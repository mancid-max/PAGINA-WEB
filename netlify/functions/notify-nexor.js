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

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };
  const KEY = (process.env.NEXOR_NOTIFY_KEY || "").trim();
  if (KEY) {
    const h = event.headers || {};
    if ((h["x-api-key"] || h["X-Api-Key"] || "").trim() !== KEY) return { statusCode: 401, body: "No autorizado" };
  }
  let body;
  try { body = JSON.parse(event.body || "{}"); } catch { return { statusCode: 400, body: "Bad JSON" }; }
  const texto = String(body.texto || "").trim();
  if (!texto) return { statusCode: 400, body: "Falta texto" };

  const TOKEN = process.env.TELEGRAM_TOKEN;
  const CHAT = process.env.TELEGRAM_CHAT_ID || "-5261495560";
  if (!TOKEN) return { statusCode: 500, body: "TELEGRAM_TOKEN no configurado" };

  const lead = String(body.lead_id || "").trim();
  const payload = { chat_id: CHAT, text: `[Nexor · ${body.tipo || "aviso"}]\n${texto}`.slice(0, 4000), disable_web_page_preview: true };
  if (/^[0-9a-f-]{36}$/i.test(lead) && SECRET) {
    payload.reply_markup = { inline_keyboard: [[
      { text: "✅ Aceptar como mayorista", url: linkAccion(lead, "aceptar") },
      { text: "✖ Rechazar", url: linkAccion(lead, "rechazar") },
    ]] };
  }
  const r = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return { statusCode: r.ok ? 200 : 502, body: JSON.stringify({ ok: r.ok, botones: !!payload.reply_markup }) };
};
