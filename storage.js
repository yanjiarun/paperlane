(function () {
  "use strict";

  const DB_NAME = "paperlane-data";
  const DB_VERSION = 1;
  const STORES = ["meta", "paperCache", "paperStates", "collections", "memberships", "snapshots", "outbox"];

  function requestResult(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  function transactionDone(transaction) {
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error || new Error("本地数据库操作已取消"));
    });
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function compareTimestamps(left, right) {
    const leftTime = Date.parse(left || "");
    const rightTime = Date.parse(right || "");
    if (Number.isFinite(leftTime) && Number.isFinite(rightTime)) return leftTime - rightTime;
    return String(left || "").localeCompare(String(right || ""));
  }

  function namespaceUserId(namespace) {
    return namespace.startsWith("user:") ? namespace.slice(5) : "";
  }

  function compactSnapshot(paper) {
    return {
      id: paper.id,
      source: paper.source,
      sourceId: paper.sourceId,
      sourceLabel: paper.sourceLabel,
      date: paper.date,
      sortDate: paper.sortDate,
      category: paper.category,
      title: paper.title,
      authors: paper.authors,
      abstract: paper.abstract,
      tags: paper.tags,
      url: paper.url,
      issueLabel: paper.issueLabel,
      issueType: paper.issueType,
      sourceOrder: paper.sourceOrder,
    };
  }

  class PaperlaneStore {
    constructor() {
      this.db = null;
      this.available = "indexedDB" in window;
    }

    async open() {
      if (!this.available) return false;
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        STORES.forEach((name) => {
          if (db.objectStoreNames.contains(name)) return;
          const store = db.createObjectStore(name, { keyPath: "key" });
          if (!["meta", "paperCache"].includes(name)) store.createIndex("namespace", "namespace", { unique: false });
        });
      };
      try {
        this.db = await requestResult(request);
        return true;
      } catch {
        this.available = false;
        return false;
      }
    }

    async get(storeName, key) {
      if (!this.db) return null;
      return requestResult(this.db.transaction(storeName, "readonly").objectStore(storeName).get(key));
    }

    async put(storeName, value) {
      if (!this.db) return;
      const transaction = this.db.transaction(storeName, "readwrite");
      transaction.objectStore(storeName).put(value);
      await transactionDone(transaction);
    }

    async remove(storeName, key) {
      if (!this.db) return;
      const transaction = this.db.transaction(storeName, "readwrite");
      transaction.objectStore(storeName).delete(key);
      await transactionDone(transaction);
    }

    async getByNamespace(storeName, namespace) {
      if (!this.db) return [];
      const store = this.db.transaction(storeName, "readonly").objectStore(storeName);
      return requestResult(store.index("namespace").getAll(namespace));
    }

    async getMeta(key) {
      return (await this.get("meta", key))?.value ?? null;
    }

    async setMeta(key, value) {
      await this.put("meta", { key, value });
    }

    async savePaperCache(papers) {
      if (!this.db || !Array.isArray(papers)) return;
      const json = JSON.stringify(papers);
      let encoding = "json";
      let data = json;
      if ("CompressionStream" in window) {
        const compressed = new Blob([json]).stream().pipeThrough(new CompressionStream("gzip"));
        data = await new Response(compressed).blob();
        encoding = "gzip";
      }
      await this.put("paperCache", { key: "latest", encoding, data, count: papers.length, updatedAt: nowIso() });
    }

    async loadPaperCache() {
      const record = await this.get("paperCache", "latest");
      if (!record) return null;
      try {
        let json = record.data;
        if (record.encoding === "gzip") {
          if (!("DecompressionStream" in window)) return null;
          const stream = record.data.stream().pipeThrough(new DecompressionStream("gzip"));
          json = await new Response(stream).text();
        }
        const papers = JSON.parse(json);
        return Array.isArray(papers) && papers.length ? papers : null;
      } catch {
        return null;
      }
    }

    async loadWorkspace(namespace) {
      const [settingsRecord, paperStates, collections, memberships, snapshots] = await Promise.all([
        this.get("meta", `settings:${namespace}`),
        this.getByNamespace("paperStates", namespace),
        this.getByNamespace("collections", namespace),
        this.getByNamespace("memberships", namespace),
        this.getByNamespace("snapshots", namespace),
      ]);
      return {
        settings: settingsRecord?.value || null,
        paperStates,
        collections,
        memberships,
        snapshots,
      };
    }

    async queue(namespace, table, recordId, row, updatedAt) {
      if (!namespaceUserId(namespace)) return;
      const key = `${namespace}|${table}|${recordId}`;
      await this.put("outbox", { key, namespace, table, recordId, row, updatedAt });
    }

    async saveSettings(namespace, settings, queue = true, updatedAt = nowIso()) {
      const value = { ...settings, updatedAt };
      await this.put("meta", { key: `settings:${namespace}`, value });
      if (queue) {
        await this.queue(namespace, "user_settings", "settings", {
          enabled_sources: value.enabledSources,
          range_days: value.rangeDays,
          ieee_scope: value.ieeeScope,
          updated_at: updatedAt,
        }, updatedAt);
      }
      return value;
    }

    async savePaperState(namespace, paperId, isRead, isImportant, queue = true, updatedAt = nowIso(), deletedAt = null) {
      const deleted = deletedAt || (!isRead && !isImportant ? updatedAt : null);
      const record = {
        key: `${namespace}|${paperId}`,
        namespace,
        paperId,
        isRead: Boolean(isRead),
        isImportant: Boolean(isImportant),
        updatedAt,
        deletedAt: deleted,
      };
      await this.put("paperStates", record);
      if (queue) {
        await this.queue(namespace, "paper_states", paperId, {
          paper_id: paperId,
          is_read: record.isRead,
          is_important: record.isImportant,
          updated_at: updatedAt,
          deleted_at: deleted,
        }, updatedAt);
      }
      return record;
    }

    async saveCollection(namespace, collection, queue = true) {
      const record = {
        key: `${namespace}|${collection.id}`,
        namespace,
        id: collection.id,
        name: collection.name,
        color: collection.color,
        updatedAt: collection.updatedAt || nowIso(),
        deletedAt: collection.deletedAt || null,
      };
      await this.put("collections", record);
      if (queue) {
        await this.queue(namespace, "collections", record.id, {
          id: record.id,
          name: record.name,
          color: record.color,
          updated_at: record.updatedAt,
          deleted_at: record.deletedAt,
        }, record.updatedAt);
      }
      return record;
    }

    async saveMembership(namespace, collectionId, paperId, selected, queue = true, updatedAt = nowIso(), deletedAt = null) {
      const deleted = deletedAt || (selected ? null : updatedAt);
      const recordId = `${collectionId}|${paperId}`;
      const record = {
        key: `${namespace}|${recordId}`,
        namespace,
        collectionId,
        paperId,
        updatedAt,
        deletedAt: deleted,
      };
      await this.put("memberships", record);
      if (queue) {
        await this.queue(namespace, "collection_papers", recordId, {
          collection_id: collectionId,
          paper_id: paperId,
          updated_at: updatedAt,
          deleted_at: deleted,
        }, updatedAt);
      }
      return record;
    }

    async saveSnapshot(namespace, paper, queue = true, updatedAt = nowIso(), deletedAt = null) {
      const snapshot = compactSnapshot(paper);
      const record = {
        key: `${namespace}|${paper.id}`,
        namespace,
        paperId: paper.id,
        snapshot,
        updatedAt,
        deletedAt,
      };
      await this.put("snapshots", record);
      if (queue) {
        await this.queue(namespace, "saved_papers", paper.id, {
          paper_id: paper.id,
          snapshot,
          updated_at: updatedAt,
          deleted_at: deletedAt,
        }, updatedAt);
      }
      return record;
    }

    async deleteSnapshot(namespace, paperId, queue = true, updatedAt = nowIso()) {
      const existing = await this.get("snapshots", `${namespace}|${paperId}`);
      if (!existing) return;
      await this.saveSnapshot(namespace, existing.snapshot, queue, updatedAt, updatedAt);
    }

    async getOutbox(namespace) {
      return this.getByNamespace("outbox", namespace);
    }

    async removeOutbox(keys) {
      if (!this.db || !keys.length) return;
      const transaction = this.db.transaction("outbox", "readwrite");
      const store = transaction.objectStore("outbox");
      keys.forEach((key) => store.delete(key));
      await transactionDone(transaction);
    }

    async pruneOutbox(namespace, remote) {
      const remoteTimes = new Map();
      Object.entries(remote).forEach(([table, rows]) => {
        (rows || []).forEach((row) => {
          let recordId = row.paper_id || row.id || "settings";
          if (table === "collection_papers") recordId = `${row.collection_id}|${row.paper_id}`;
          remoteTimes.set(`${table}|${recordId}`, row.updated_at);
        });
      });
      const pending = await this.getOutbox(namespace);
      const superseded = pending
        .filter((item) => {
          const remoteTime = remoteTimes.get(`${item.table}|${item.recordId}`);
          return remoteTime && compareTimestamps(remoteTime, item.updatedAt) >= 0;
        })
        .map((item) => item.key);
      await this.removeOutbox(superseded);
      return superseded.length;
    }

    async mergeRemote(namespace, remote) {
      const tableMap = {
        paper_states: ["paperStates", (row) => ({
          key: `${namespace}|${row.paper_id}`,
          namespace,
          paperId: row.paper_id,
          isRead: row.is_read,
          isImportant: row.is_important,
          updatedAt: row.updated_at,
          deletedAt: row.deleted_at,
        })],
        collections: ["collections", (row) => ({
          key: `${namespace}|${row.id}`,
          namespace,
          id: row.id,
          name: row.name,
          color: row.color,
          updatedAt: row.updated_at,
          deletedAt: row.deleted_at,
        })],
        collection_papers: ["memberships", (row) => ({
          key: `${namespace}|${row.collection_id}|${row.paper_id}`,
          namespace,
          collectionId: row.collection_id,
          paperId: row.paper_id,
          updatedAt: row.updated_at,
          deletedAt: row.deleted_at,
        })],
        saved_papers: ["snapshots", (row) => ({
          key: `${namespace}|${row.paper_id}`,
          namespace,
          paperId: row.paper_id,
          snapshot: row.snapshot,
          updatedAt: row.updated_at,
          deletedAt: row.deleted_at,
        })],
      };

      for (const [table, rows] of Object.entries(remote)) {
        if (table === "user_settings") {
          const row = rows[0];
          if (!row) continue;
          const current = await this.get("meta", `settings:${namespace}`);
          if (!current?.value?.updatedAt || compareTimestamps(row.updated_at, current.value.updatedAt) >= 0) {
            await this.saveSettings(namespace, {
              enabledSources: row.enabled_sources,
              rangeDays: row.range_days,
              ieeeScope: row.ieee_scope,
            }, false, row.updated_at);
          }
          continue;
        }
        const mapping = tableMap[table];
        if (!mapping || !rows.length) continue;
        const [storeName, convert] = mapping;
        const existing = new Map((await this.getByNamespace(storeName, namespace)).map((record) => [record.key, record]));
        const accepted = rows.map(convert).filter((record) => {
          const localUpdatedAt = existing.get(record.key)?.updatedAt;
          return !localUpdatedAt || compareTimestamps(record.updatedAt, localUpdatedAt) >= 0;
        });
        if (!accepted.length) continue;
        const transaction = this.db.transaction(storeName, "readwrite");
        const store = transaction.objectStore(storeName);
        accepted.forEach((record) => store.put(record));
        await transactionDone(transaction);
      }
    }

    async importNamespace(fromNamespace, toNamespace) {
      const source = await this.loadWorkspace(fromNamespace);
      const importedAt = nowIso();
      if (source.settings) await this.saveSettings(toNamespace, source.settings, true, importedAt);
      for (const record of source.paperStates.filter((item) => !item.deletedAt)) {
        await this.savePaperState(toNamespace, record.paperId, record.isRead, record.isImportant, true, importedAt);
      }
      for (const record of source.collections.filter((item) => !item.deletedAt)) {
        await this.saveCollection(toNamespace, { ...record, updatedAt: importedAt }, true);
      }
      for (const record of source.memberships.filter((item) => !item.deletedAt)) {
        await this.saveMembership(toNamespace, record.collectionId, record.paperId, true, true, importedAt);
      }
      for (const record of source.snapshots.filter((item) => !item.deletedAt)) {
        await this.saveSnapshot(toNamespace, record.snapshot, true, importedAt);
      }
    }

    async exportNamespace(namespace) {
      const workspace = await this.loadWorkspace(namespace);
      return {
        format: "paperlane-export-v1",
        exportedAt: nowIso(),
        settings: workspace.settings,
        paperStates: workspace.paperStates.filter((item) => !item.deletedAt).map(({ paperId, isRead, isImportant, updatedAt }) => ({ paperId, isRead, isImportant, updatedAt })),
        collections: workspace.collections.filter((item) => !item.deletedAt).map(({ id, name, color, updatedAt }) => ({ id, name, color, updatedAt })),
        memberships: workspace.memberships.filter((item) => !item.deletedAt).map(({ collectionId, paperId, updatedAt }) => ({ collectionId, paperId, updatedAt })),
        savedPapers: workspace.snapshots.filter((item) => !item.deletedAt).map((item) => item.snapshot),
      };
    }

    async clearNamespace(namespace) {
      if (!this.db) return;
      const names = ["paperStates", "collections", "memberships", "snapshots", "outbox"];
      for (const storeName of names) {
        const transaction = this.db.transaction(storeName, "readwrite");
        const index = transaction.objectStore(storeName).index("namespace");
        const request = index.openCursor(IDBKeyRange.only(namespace));
        request.onsuccess = () => {
          const cursor = request.result;
          if (!cursor) return;
          cursor.delete();
          cursor.continue();
        };
        await transactionDone(transaction);
      }
      await this.remove("meta", `settings:${namespace}`);
    }

    async migrateLegacy(defaultGroups) {
      if (!this.db || await this.getMeta("legacyMigrated")) return false;
      const namespace = "guest";
      try {
        const oldState = JSON.parse(localStorage.getItem("paperlane-state-v1") || "null");
        const oldPapers = JSON.parse(localStorage.getItem("paperlane-paper-cache-v1") || "null");
        const enabledSources = JSON.parse(localStorage.getItem("paperlane-enabled-sources-v1") || "null");
        const rangeDays = Number(localStorage.getItem("paperlane-time-range-v1")) || 30;
        const ieeeScope = localStorage.getItem("paperlane-ieee-scope-v1") || "ea+1";

        if (Array.isArray(oldPapers) && oldPapers.length) await this.savePaperCache(oldPapers);
        if (oldState) {
          const savedPaperIds = new Set(Object.keys(oldState.important || {}).filter((paperId) => oldState.important[paperId]));
          for (const paperId of new Set([...Object.keys(oldState.read || {}), ...Object.keys(oldState.important || {})])) {
            const isRead = Boolean(oldState.read?.[paperId]);
            const isImportant = Boolean(oldState.important?.[paperId]);
            if (isRead || isImportant) await this.savePaperState(namespace, paperId, isRead, isImportant, false);
          }
          const groups = Array.isArray(oldState.groups) && oldState.groups.length ? oldState.groups : defaultGroups;
          for (const group of groups) await this.saveCollection(namespace, group, false);
          for (const [collectionId, paperIds] of Object.entries(oldState.groupItems || {})) {
            for (const [paperId, selected] of Object.entries(paperIds || {})) {
              if (selected) {
                savedPaperIds.add(paperId);
                await this.saveMembership(namespace, collectionId, paperId, true, false);
              }
            }
          }
          const oldPaperMap = new Map((Array.isArray(oldPapers) ? oldPapers : []).map((paper) => [paper.id, paper]));
          for (const paperId of savedPaperIds) {
            if (oldPaperMap.has(paperId)) await this.saveSnapshot(namespace, oldPaperMap.get(paperId), false);
          }
        }
        if (Array.isArray(enabledSources) && enabledSources.length) {
          await this.saveSettings(namespace, { enabledSources, rangeDays, ieeeScope }, false);
        }
        await this.setMeta("legacyMigrated", nowIso());
        ["paperlane-state-v1", "paperlane-paper-cache-v1", "paperlane-enabled-sources-v1", "paperlane-time-range-v1", "paperlane-ieee-scope-v1"].forEach((key) => localStorage.removeItem(key));
        return Boolean(oldState || oldPapers || enabledSources);
      } catch {
        return false;
      }
    }
  }

  window.PaperlaneStore = PaperlaneStore;
}());
