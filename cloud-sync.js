(function () {
  "use strict";

  const TABLES = ["user_settings", "paper_states", "collections", "collection_papers", "saved_papers"];
  const CONFLICT_COLUMNS = {
    user_settings: "user_id",
    paper_states: "user_id,paper_id",
    collections: "user_id,id",
    collection_papers: "user_id,collection_id,paper_id",
    saved_papers: "user_id,paper_id",
  };

  class CloudRequestError extends Error {
    constructor(message, status = 0, payload = null) {
      super(message);
      this.name = "CloudRequestError";
      this.status = status;
      this.payload = payload;
    }
  }

  function jwtRole(key) {
    if (!key || key.split(".").length !== 3) return "";
    try {
      const encoded = key.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
      const padded = encoded.padEnd(Math.ceil(encoded.length / 4) * 4, "=");
      return JSON.parse(atob(padded))?.role || "";
    } catch {
      return "";
    }
  }

  class PaperlaneCloud {
    constructor(store) {
      const config = window.PAPERLANE_SUPABASE || {};
      this.url = String(config.url || "").trim().replace(/\/+(?:rest\/v1)?\/?$/i, "");
      this.anonKey = String(config.anonKey || "");
      this.store = store;
      this.session = null;
      this.syncing = false;
      this.syncPromise = null;
    }

    get configurationIssue() {
      const configuredIssue = String((window.PAPERLANE_SUPABASE || {}).configurationIssue || "").trim();
      if (configuredIssue) return configuredIssue;
      if (!this.url && !this.anonKey) return "尚未填写 Supabase Project URL 和 publishable key";
      if (!/^https:\/\/.+\.supabase\.co$/i.test(this.url)) return "Supabase Project URL 格式不正确；应填写 https://项目编号.supabase.co，不要附加 /rest/v1/";
      if (!this.anonKey || this.anonKey.length <= 20) return "Supabase publishable key 为空或格式不正确";
      if (this.anonKey.startsWith("sb_secret_") || jwtRole(this.anonKey) === "service_role") {
        return "检测到高权限密钥：浏览器端只能使用 publishable key 或旧版 anon key";
      }
      return "";
    }

    get configured() {
      return !this.configurationIssue;
    }

    get user() {
      return this.session?.user || null;
    }

    async init() {
      if (!this.configured) return null;
      const saved = await this.store.getMeta("authSession");
      if (!saved || saved.projectUrl !== this.url) return null;
      this.session = saved.session;
      if (!navigator.onLine) return this.user;
      try {
        await this.ensureSession();
        return this.user;
      } catch (error) {
        if (error instanceof CloudRequestError && [400, 401, 403].includes(error.status)) {
          await this.clearSession();
          return null;
        }
        // A sleeping Free Plan project or a temporary network failure must not
        // silently sign the user out. The saved refresh token can retry later.
        return this.user;
      }
    }

    headers(authenticated = false) {
      const headers = { apikey: this.anonKey, "Content-Type": "application/json" };
      if (authenticated && this.session?.access_token) headers.Authorization = `Bearer ${this.session.access_token}`;
      return headers;
    }

    async request(path, options = {}, authenticated = false) {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 20000);
      let response;
      try {
        response = await fetch(`${this.url}${path}`, {
          ...options,
          signal: options.signal || controller.signal,
          headers: { ...this.headers(authenticated), ...(options.headers || {}) },
        });
      } catch (error) {
        if (error?.name === "AbortError") throw new CloudRequestError("连接 Supabase 超时；免费项目可能正在恢复，请稍后重试");
        throw new CloudRequestError("无法连接 Supabase；请检查网络，或在 Supabase Dashboard 中确认免费项目未暂停");
      } finally {
        window.clearTimeout(timeout);
      }
      const text = await response.text();
      let payload = null;
      if (text) {
        try { payload = JSON.parse(text); } catch { payload = { message: text }; }
      }
      if (!response.ok) {
        const rawMessage = payload?.msg || payload?.message || payload?.error_description || payload?.error || `云端返回 ${response.status}`;
        const schemaMissing = response.status === 404 || /relation .* does not exist|could not find the table|schema cache/i.test(rawMessage);
        const message = schemaMissing
          ? "云端数据表不存在；请在 Supabase SQL Editor 中完整运行 supabase-schema.sql"
          : [401, 403].includes(response.status)
            ? "Supabase 拒绝了请求；请检查 publishable key、邮箱确认状态和 RLS 配置"
            : rawMessage;
        throw new CloudRequestError(message, response.status, payload);
      }
      return payload;
    }

    async saveSession(payload) {
      if (!payload?.access_token || !payload?.refresh_token) return false;
      this.session = {
        ...payload,
        expires_at: payload.expires_at || Math.floor(Date.now() / 1000) + Number(payload.expires_in || 3600),
      };
      await this.store.setMeta("authSession", { projectUrl: this.url, session: this.session });
      return true;
    }

    async clearSession() {
      this.session = null;
      await this.store.remove("meta", "authSession");
    }

    async ensureSession() {
      if (!this.session) throw new Error("尚未登录");
      if (Number(this.session.expires_at || 0) > Math.floor(Date.now() / 1000) + 60) return;
      const payload = await this.request("/auth/v1/token?grant_type=refresh_token", {
        method: "POST",
        body: JSON.stringify({ refresh_token: this.session.refresh_token }),
      });
      await this.saveSession(payload);
    }

    async signIn(email, password) {
      if (!this.configured) throw new Error("尚未配置 Supabase");
      const payload = await this.request("/auth/v1/token?grant_type=password", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      await this.saveSession(payload);
      return this.user;
    }

    async signUp(email, password) {
      if (!this.configured) throw new Error("尚未配置 Supabase");
      const payload = await this.request("/auth/v1/signup", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      const signedIn = await this.saveSession(payload);
      return { user: payload?.user || null, signedIn };
    }

    async signOut() {
      if (this.session?.access_token) {
        try {
          await this.request("/auth/v1/logout", { method: "POST" }, true);
        } catch {
          // Local sign-out remains available if the server cannot be reached.
        }
      }
      await this.clearSession();
    }

    async fetchTable(table) {
      const rows = [];
      const pageSize = 1000;
      for (let offset = 0; ; offset += pageSize) {
        const page = await this.request(`/rest/v1/${table}?select=*&user_id=eq.${encodeURIComponent(this.user.id)}&order=updated_at.asc&limit=${pageSize}&offset=${offset}`, {
          method: "GET",
        }, true);
        rows.push(...(page || []));
        if (!page || page.length < pageSize) break;
      }
      return rows;
    }

    async pull() {
      const results = await Promise.all(TABLES.map((table) => this.fetchTable(table)));
      return Object.fromEntries(TABLES.map((table, index) => [table, results[index]]));
    }

    async flush(namespace) {
      const pending = await this.store.getOutbox(namespace);
      if (!pending.length) return 0;
      const groups = new Map();
      pending.forEach((item) => {
        if (!groups.has(item.table)) groups.set(item.table, []);
        groups.get(item.table).push(item);
      });
      let sent = 0;
      for (const [table, entries] of groups) {
        const rows = entries.map((entry) => ({ user_id: this.user.id, ...entry.row }));
        await this.request(`/rest/v1/${table}?on_conflict=${encodeURIComponent(CONFLICT_COLUMNS[table])}`, {
          method: "POST",
          headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
          body: JSON.stringify(rows),
        }, true);
        await this.store.removeOutbox(entries.map((entry) => entry.key));
        sent += entries.length;
      }
      return sent;
    }

    async sync(namespace) {
      if (this.syncPromise) return this.syncPromise;
      this.syncing = true;
      this.syncPromise = (async () => {
        await this.ensureSession();
        const remote = await this.pull();
        await this.store.mergeRemote(namespace, remote);
        await this.store.pruneOutbox(namespace, remote);
        await this.flush(namespace);
        await this.store.setMeta(`lastSync:${namespace}`, new Date().toISOString());
        return true;
      })();
      try {
        return await this.syncPromise;
      } finally {
        this.syncing = false;
        this.syncPromise = null;
      }
    }
  }

  window.PaperlaneCloud = PaperlaneCloud;
}());
