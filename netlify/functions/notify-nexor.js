/* Aviso a Telegram desde Nexor (Cloud Function "Filtro desconocidos"), con botones Aceptar / Rechazar.
   POST { tipo, texto, lead_id?, phone?, nombre? }
   - Manda `texto` al chat de pedidos (mismo bot que notify-order).
   - Si viene lead_id, agrega botones con links firmados a nexor-aceptar (HMAC con NEXOR_ORDER_KEY).
   Si se define NEXOR_NOTIFY_KEY en Netlify, exige header X-Api-Key con ese valor. */
const crypto = require("crypto");
const BASE = (process.env.URL || "https://mohicanojeans.netlify.app").replace(/\/$/, "");
const SECRET = (process.env.NEXOR_ORDER_KEY || "").trim();
const firma = (lead, accion) => crypto.createHmac("sha256", SECRET).update(`${lead}|${accion}`).digest("hex").slice(0, 32);
const linkAccion = (lead, accion) => `${BASE}/.netlify/functions/nexor-aceptar?lead=${encodeURIComponent(lead)}&a=${accion}&t=${firma(lead, accion)}`;

/* Aviso "necesita ayuda": nombre, RUT, teléfono y motivo leídos del lead en Nexor (NEXOR_API_KEY) */
async function textoAyuda(body) {
  const API = (process.env.NEXOR_API_KEY || "").trim();
  let L = {};
  if (API) {
    const r = await fetch(`https://api.getnexor.ai/api/public/leads/${body.lead_id}?verbose=true`, { headers: { "X-API-Key": API } });
    if (r.ok) { const j = await r.json(); L = j.lead || j; }
  }
  const nombre = [L.first_name, L.last_name].filter(Boolean).join(" ") || L.company || body.nombre || "Cliente";
  const empresa = L.company && L.company !== nombre ? L.company : "";
  const campos = L.fields || L.field_values || {};
  const meta = L.metadata || {};
  const rut = campos.rut || meta.rut || "";
  const tel = String(L.phone || body.phone || "").replace(/\D/g, "");
  const telFmt = tel.length >= 11 ? `+${tel.slice(0, 2)} ${tel.slice(2, 3)} ${tel.slice(3, 7)} ${tel.slice(7)}` : tel || "—";
  const motivo = String(body.motivo || "").trim();
  const problema = campos.problema || meta.problema || "";
  return [
    `${nombre}${empresa ? ` · ${empresa}` : ""}${rut ? ` · RUT ${rut}` : ""}`,
    `Teléfono: ${telFmt}`,
    `Motivo: ${motivo || problema || "Sofía no pudo resolverlo; ver la conversación"}`,
    "",
    "Sofía lo dejó en \"Necesita ayuda (humano)\" y NO le responde mientras esté ahí. Alguien tiene que escribirle por WhatsApp y, cuando termine, tocar \"Devolver a Sofía\".",
  ].join("\n");
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };
  let body;
  try { body = JSON.parse(event.body || "{}"); } catch { return { statusCode: 400, body: "Bad JSON" }; }
  /* Autorización: header X-Api-Key = NEXOR_NOTIFY_KEY si está configurada; si no, el lead_id debe ser un lead
     real de Nexor (las Cloud Functions siempre lo mandan; un uuid no se adivina). Nunca queda abierto. */
  const KEY = (process.env.NEXOR_NOTIFY_KEY || "").trim();
  const h = event.headers || {};
  const conClave = !!KEY && (h["x-api-key"] || h["X-Api-Key"] || "").trim() === KEY;
  if (!conClave) {
    const API = (process.env.NEXOR_API_KEY || "").trim();
    const lid = String(body.lead_id || "");
    let leadReal = false;
    if (API && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(lid)) {
      try {
        const r = await fetch(`https://api.getnexor.ai/api/public/leads/${lid}`, { headers: { "X-API-Key": API } });
        const j = r.ok ? await r.json().catch(() => null) : null;
        const l = j && (j.lead || j);
        leadReal = !!(l && String(l.id || "").toLowerCase() === lid.toLowerCase());
      } catch (_) {}
    }
    if (!leadReal) return { statusCode: 401, body: "No autorizado" };
  }
  let texto = String(body.texto || "").trim();
  if (body.tipo === "nexor_ayuda" && /^[0-9a-f-]{36}$/i.test(String(body.lead_id || ""))) {
    /* El evento de cambio de estado de Nexor no trae los datos del lead: se completan desde su API */
    texto = await textoAyuda(body).catch(() => texto || "Un cliente necesita ayuda (no pude leer sus datos).");
  }
  if (!texto) return { statusCode: 400, body: "Falta texto" };

  const TOKEN = process.env.TELEGRAM_TOKEN;
  if (!TOKEN) return { statusCode: 500, body: "TELEGRAM_TOKEN no configurado" };
  /* Un grupo de Telegram por tipo de aviso (2026-09-16): desconocidos, ayuda humana; el resto al grupo general */
  const tipo = String(body.tipo || "aviso");
  const CHAT = tipo === "nexor_ayuda" ? (process.env.TELEGRAM_CHAT_AYUDA || process.env.TELEGRAM_CHAT_ID || "-5261495560")
    : tipo === "nexor_desconocido" ? (process.env.TELEGRAM_CHAT_DESCONOCIDOS || process.env.TELEGRAM_CHAT_ID || "-5261495560")
    : (process.env.TELEGRAM_CHAT_ID || "-5261495560");
  const titulo = tipo === "nexor_ayuda" ? "Cliente necesita ayuda (Sofía)" : tipo === "nexor_desconocido" ? "Número desconocido" : `Nexor · ${tipo}`;

  const lead = String(body.lead_id || "").trim();
  const payload = { chat_id: CHAT, text: `[${titulo}]\n${texto}`.slice(0, 4000), disable_web_page_preview: true };
  if (/^[0-9a-f-]{36}$/i.test(lead) && SECRET && tipo === "nexor_desconocido") {
    payload.reply_markup = { inline_keyboard: [[
      { text: "✅ Aceptar como mayorista", url: linkAccion(lead, "aceptar") },
      { text: "✖ Rechazar", url: linkAccion(lead, "rechazar") },
    ]] };
  } else if (tipo === "nexor_ayuda") {
    const fila = [{ text: "Abrir Sofía en Nexor", url: "https://app.getnexor.ai/agents/a914d7c0-fccc-4eb1-947a-ac5f875111d1" }];
    /* Mientras el lead esté en "Necesita ayuda (humano)" Sofía no le responde: este botón se lo devuelve cuando ya lo atendieron */
    if (/^[0-9a-f-]{36}$/i.test(lead) && SECRET) fila.unshift({ text: "↩ Devolver a Sofía", url: linkAccion(lead, "devolver") });
    payload.reply_markup = { inline_keyboard: [fila] };
  }
  const r = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return { statusCode: r.ok ? 200 : 502, body: JSON.stringify({ ok: r.ok, botones: !!payload.reply_markup }) };
};
