import { withSupabase } from "npm:@supabase/server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MAX_ITEMS = 20;
const MAX_ITEM_CHARS = 12000;
const MAX_REQUEST_CHARS = 80000;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  });
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

Deno.serve(withSupabase({ auth: ["user", "publishable"], cors: corsHeaders }, async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  const authKey = text(Deno.env.get("DEEPL_AUTH_KEY"));
  if (!authKey) return jsonResponse({ error: "DeepL service is not configured" }, 503);

  let body: { items?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON" }, 400);
  }
  if (!Array.isArray(body.items) || body.items.length < 1 || body.items.length > MAX_ITEMS) {
    return jsonResponse({ error: `items must contain 1-${MAX_ITEMS} papers` }, 400);
  }

  const items = body.items.map((item) => ({
    id: text((item as Record<string, unknown>)?.id),
    title: text((item as Record<string, unknown>)?.title),
    abstract: text((item as Record<string, unknown>)?.abstract),
  }));
  if (items.some((item) => !item.id || !item.title || item.title.length > MAX_ITEM_CHARS || item.abstract.length > MAX_ITEM_CHARS)) {
    return jsonResponse({ error: "Each paper needs an id, title, and bounded text" }, 400);
  }

  const segments: Array<{ id: string; field: "title" | "abstract"; text: string }> = [];
  items.forEach((item) => {
    segments.push({ id: item.id, field: "title", text: item.title });
    if (item.abstract) segments.push({ id: item.id, field: "abstract", text: item.abstract });
  });
  if (segments.reduce((sum, segment) => sum + segment.text.length, 0) > MAX_REQUEST_CHARS) {
    return jsonResponse({ error: "Translation request is too large" }, 413);
  }

  const form = new URLSearchParams({ target_lang: "ZH", preserve_formatting: "1" });
  segments.forEach((segment) => form.append("text", segment.text));
  const deeplUrl = text(Deno.env.get("DEEPL_API_URL")) || "https://api-free.deepl.com/v2/translate";
  let response: Response;
  try {
    response = await fetch(deeplUrl, {
      method: "POST",
      headers: {
        Authorization: `DeepL-Auth-Key ${authKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form,
    });
  } catch {
    return jsonResponse({ error: "DeepL is unreachable" }, 502);
  }
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 300);
    return jsonResponse({ error: "DeepL translation failed", detail }, response.status === 429 ? 429 : 502);
  }

  const payload = await response.json();
  const translated = Array.isArray(payload.translations) ? payload.translations : [];
  if (translated.length !== segments.length) return jsonResponse({ error: "DeepL returned an incomplete result" }, 502);
  const byId = new Map<string, { id: string; titleZh: string; abstractZh: string }>();
  items.forEach((item) => byId.set(item.id, { id: item.id, titleZh: "", abstractZh: "" }));
  segments.forEach((segment, index) => {
    const result = byId.get(segment.id);
    if (result) result[segment.field === "title" ? "titleZh" : "abstractZh"] = text(translated[index]?.text);
  });
  return jsonResponse({ provider: "deepl", targetLang: "ZH", translations: [...byId.values()] });
}));
