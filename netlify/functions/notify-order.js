/* notify-order — aviso a Telegram cuando entra un pedido desde la página (Cole 44 o Cole 40-43)
   + confirmación al cliente por Sofía (Nexor) con la NOTA DE PEDIDO y paso del lead a "Compró".
   La página manda lo que tiene (quoteId, source, rut, phone, items...); acá se completa con lo que
   ya sabemos: el pedido guardado en Supabase (nota-pedido) y la ficha del cliente (lookup_client_by_rut). */
const { construirNota } = require("./nota-pedido.js");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const WF = "a914d7c0-fccc-4eb1-947a-ac5f875111d1";
const NX = "https://api.getnexor.ai/api/public";

const clp = (n) => "$" + String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
const normRut = (r) => { const c = String(r || "").replace(/[^0-9kK]/g, "").toUpperCase(); return c.length < 2 ? "" : `${c.slice(0, -1)}-${c.slice(-1)}`; };

/* Ficha del cliente en Supabase (tabla clients) por RUT: teléfono, transporte, giro, dirección, tienda, comuna */
async function fichaCliente(rut) {
  const p = normRut(rut);
  if (!p || !SUPABASE_URL || !SERVICE_KEY) return null;
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/lookup_client_by_rut`, {
      method: "POST",
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ p_rut: p }),
    });
    if (!r.ok) return null;
    const rows = await r.json();
    return (Array.isArray(rows) ? rows[0] : rows) || null;
  } catch (_) { return null; }
}

/* Nexor: si el cliente existe como lead (nunca se crea uno), le manda por Sofía la confirmación con la
   NOTA DE PEDIDO, deja la nota en el CRM y mueve el lead a "Compró (pedido enviado)".
   Solo actúa si el pedido existe en Supabase (el uuid no se puede adivinar) y el teléfono coincide con el del lead. */
async function avisarNexor(nota, telefono) {
  const API = (process.env.NEXOR_API_KEY || "").trim();
  if (!API) return { skip: "sin NEXOR_API_KEY" };
  if (!nota || !nota.ok) return { skip: `sin nota: ${nota && nota.mensaje}` };
  const tel = String(nota.telefono || telefono || "").replace(/\D/g, "");
  if (tel.length < 8) return { skip: "pedido sin teléfono" };
  const cola = tel.slice(-8);

  const H = { "X-API-Key": API, "Content-Type": "application/json" };
  const r = await fetch(`${NX}/leads?search=${cola}&workflow_id=${WF}&limit=5`, { headers: H });
  const j = await r.json().catch(() => ({}));
  const lead = (j.leads || j.data || []).find((l) => String(l.phone || "").replace(/\D/g, "").endsWith(cola));
  if (!lead) return { skip: "el cliente no es lead de Nexor (no se crea)" };

  const out = { lead_id: lead.id, referencia: nota.referencia };
  /* 1) nota en el CRM (Sofía la ve en contexto) */
  out.nota_crm = await fetch(`${NX}/leads/${lead.id}/notes`, { method: "POST", headers: H, body: JSON.stringify({ content: nota.nota_texto, ai_visible: true }) }).then((x) => x.status).catch((e) => e.message);
  /* 2) WhatsApp solo si hay conversación activa (últimas 24 h): fuera de esa ventana Meta exige plantilla */
  const ultimo = new Date(lead.last_history_at || lead.updated_at || 0).getTime();
  if (Date.now() - ultimo < 24 * 3600e3) {
    const enviar = (content) => fetch(`${NX}/messages`, { method: "POST", headers: H, body: JSON.stringify({ lead_id: lead.id, workflow_id: WF, channel: "whatsapp", content }) }).then((x) => x.status).catch((e) => e.message);
    out.msg1 = await enviar(`Perfecto, ya recibimos tu pedido ${nota.referencia}. Te paso la nota de pedido para que la revises:`);
    out.msg2 = await enviar(nota.nota_texto);
  } else out.msg = "no enviado: sin conversación en las últimas 24 h";
  /* 3) estado Compró (al final: es terminal y cierra la corrida) */
  out.estado = await fetch(`${NX}/leads/${lead.id}/status`, { method: "POST", headers: H, body: JSON.stringify({ status_key: "cerrado", workflow_id: WF, reason: `Pedido ${nota.referencia} enviado desde la página` }) }).then((x) => x.status).catch((e) => e.message);
  return out;
}

exports.handler = async function(event) {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

  let order;
  try { order = JSON.parse(event.body); } catch { return { statusCode: 400, body: "Bad JSON" }; }

  const TOKEN = process.env.TELEGRAM_TOKEN;
  const CHAT  = process.env.TELEGRAM_CHAT_PEDIDOS || process.env.TELEGRAM_CHAT_ID || "-5261495560"; /* grupo "Mohicano Pedidos" */

  /* Cole 44 (catalogo-44 / dolce-vita-44) o Cole 40-43 (catalogo-43, catalogo-2, catalogo-mixto).
     Sin source se asume Cole 44, que era el unico que avisaba antes. */
  const src   = String(order.source || "").toLowerCase();
  const es44  = !src || src.includes("44");
  const id6   = order.quoteId ? String(order.quoteId).slice(-6).toUpperCase() : "???";
  const titulo = es44 ? "Nuevo pedido Cole 44" : "Nuevo pedido Cole 40-43";
  const ref  = (es44 ? "DV44-" : "C43-") + id6;
  const link = es44
    ? (order.quoteId ? "https://mohicanojeans.netlify.app/catalogo-44/?pedido=" + order.quoteId : "https://mohicanojeans.netlify.app/catalogo-44/")
    : "https://mohicanojeans.netlify.app/?admin=1#admin";

  /* Completar con lo que ya sabemos: pedido guardado + ficha del cliente */
  const quoteId = String(order.quoteId || "");
  const nota = /^[0-9a-f-]{36}$/i.test(quoteId) ? await construirNota({ id: quoteId }).catch((e) => ({ ok: false, mensaje: e.message })) : { ok: false, mensaje: "sin id" };
  const rut = order.rut || (nota.ok && nota.rut) || "";
  const ficha = await fichaCliente(rut);
  const dato = (...vals) => { for (const v of vals) { const s = String(v == null ? "" : v).trim(); if (s) return s; } return "—"; };
  const nombre     = dato(order.storeName, nota.ok && nota.cliente, ficha && ficha.razon_social);
  const telefono   = dato(order.phone, nota.ok && nota.telefono, ficha && ficha.telefono);
  const transporte = dato(order.transporte, nota.ok && nota.transporte, ficha && ficha.transporte);
  const comuna     = dato(order.ciudad, ficha && ficha.comuna);
  const direccion  = dato(ficha && ficha.direccion);
  const giro       = dato(ficha && ficha.giro);
  const tienda     = dato(ficha && ficha.nombre_tienda);

  const lineas = nota.ok
    ? nota.modelos.map((m) => `  - ${m.codigo}${m.nombre ? " (" + m.nombre + ")" : ""}: ${m.unidades} u  [${m.tallas.map((t) => t.replace(": ", ":")).join(" ")}]${m.subtotal != null ? "  " + clp(m.subtotal) : ""}`).join("\n")
    : (order.items || []).map((it) => `  - ${it.codigo}${it.nombre ? " (" + it.nombre + ")" : ""}: ${it.totalUnidades} u`).join("\n");

  const texto = [
    titulo + "  [" + (nota.ok ? nota.referencia : ref) + "]",
    "",
    "Cliente: "    + nombre,
    "RUT: "        + dato(rut),
    "Telefono: "   + telefono,
    "Transporte: " + transporte,
    "Comuna: "     + comuna,
    "Direccion: "  + direccion,
    "Giro: "       + giro,
    "Tienda: "     + tienda,
    "",
    "Modelos:",
    lineas || "  (sin detalle)",
    "",
    "Total unidades: " + (nota.ok ? nota.total_unidades : (order.totalUnidades || "—")),
    ...(nota.ok ? [`Neto: ${clp(nota.neto)}  ·  IVA: ${clp(nota.iva)}  ·  Total: ${clp(nota.total)}`] : []),
    "",
    "Ver pedido: " + link,
  ].join("\n");

  await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: CHAT, text: texto, disable_web_page_preview: true }),
  });

  let nexor = null;
  try { nexor = await avisarNexor(nota, telefono === "—" ? "" : telefono); } catch (e) { nexor = { error: e.message }; }

  return { statusCode: 200, body: JSON.stringify({ ok: true, ref: nota.ok ? nota.referencia : ref, nexor }) };
};
