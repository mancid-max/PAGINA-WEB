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
    payload.reply_markup = { inline_keyboard: [[{ text: "Abrir Sofía en Nexor", url: "https://app.getnexor.ai/agents/a914d7c0-fccc-4eb1-947a-ac5f875111d1" }]] };
  }
  const r = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return { statusCode: r.ok ? 200 : 502, body: JSON.stringify({ ok: r.ok, botones: !!payload.reply_markup }) };
};
