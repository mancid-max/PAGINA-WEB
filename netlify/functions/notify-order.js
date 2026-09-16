const { construirNota } = require("./nota-pedido.js");

/* Nexor: si el cliente existe como lead (nunca se crea uno), le manda por Sofía la confirmación con la
   NOTA DE PEDIDO, deja la nota en el CRM y mueve el lead a "Compró (pedido enviado)".
   Solo actúa si el pedido existe en Supabase y su teléfono coincide con el del lead (el uuid del pedido
   no se puede adivinar, así que nadie puede gatillar mensajes desde afuera). */
async function avisarNexor(order, ref) {
  const API = (process.env.NEXOR_API_KEY || "").trim();
  const WF = "a914d7c0-fccc-4eb1-947a-ac5f875111d1";
  const NX = "https://api.getnexor.ai/api/public";
  const quoteId = String(order.quoteId || "");
  if (!API || !/^[0-9a-f-]{36}$/i.test(quoteId)) return { skip: "sin api key o sin id de pedido" };

  const nota = await construirNota({ id: quoteId }).catch((e) => ({ ok: false, mensaje: e.message }));
  if (!nota.ok) return { skip: `sin nota: ${nota.mensaje}` };
  const tel = String(nota.telefono || order.phone || "").replace(/\D/g, "");
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
  const activo = Date.now() - ultimo < 24 * 3600e3;
  if (activo) {
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
  const CHAT  = process.env.TELEGRAM_CHAT_ID || "-5261495560";

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

  const lineas = (order.items || []).map(it =>
    `  - ${it.codigo}${it.nombre ? " (" + it.nombre + ")" : ""}: ${it.totalUnidades} u`
  ).join("\n");

  const texto = [
    titulo + "  [" + ref + "]",
    "",
    "Cliente: "    + (order.storeName  || "—"),
    "RUT: "        + (order.rut        || "—"),
    "Telefono: "   + (order.phone      || "—"),
    "Transporte: " + (order.transporte || "—"),
    "Ciudad: "     + (order.ciudad     || "—"),
    "",
    "Modelos:",
    lineas || "  (sin detalle)",
    "",
    "Total unidades: " + (order.totalUnidades || "—"),
    "",
    "Ver pedido: " + link,
  ].join("\n");

  await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: CHAT, text: texto, disable_web_page_preview: true }),
  });

  let nexor = null;
  try { nexor = await avisarNexor(order, ref); } catch (e) { nexor = { error: e.message }; }

  return { statusCode: 200, body: JSON.stringify({ ok: true, ref, nexor }) };
};
