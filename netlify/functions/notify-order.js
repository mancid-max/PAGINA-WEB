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
/* Guarda o completa la ficha del cliente con los datos que vinieron en el pedido. Nunca borra lo que ya
   había: solo rellena lo que está vacío (y el transporte, que se actualiza al último que usó). */
async function guardarFichaCliente(nota) {
  if (!SUPABASE_URL || !SERVICE_KEY || !nota || !nota.ok) return null;
  const digitos = String(nota.rut || "").replace(/[^0-9kK]/g, "").toUpperCase();
  if (digitos.length < 8) return null;
  const limpio = (v) => { const t = String(v == null ? "" : v).trim().replace(/\s+/g, " ").slice(0, 120); return t || null; };
  const campos = {
    razon_social: limpio(nota.cliente),
    telefono: limpio(nota.telefono),
    transporte: limpio(nota.transporte),
    giro: limpio(nota.giro),
    direccion: limpio(nota.direccion),
    comuna: limpio(nota.comuna),
    nombre_tienda: limpio(nota.nombre_tienda),
  };
  const h = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json" };
  try {
    const norm = `${digitos.slice(0, -1)}-${digitos.slice(-1)}`;
    const filtro = encodeURIComponent(`(rut_normalized.eq.${digitos},rut_normalized.eq.${norm})`);
    const fila = (await fetch(`${SUPABASE_URL}/rest/v1/clients?or=${filtro}&select=*&limit=1`, { headers: h }).then((r) => (r.ok ? r.json() : [])))[0] || null;
    if (fila) {
      /* solo lo que falta; el transporte se pone al día con el del pedido */
      const patch = {};
      for (const [k, v] of Object.entries(campos)) {
        if (!v) continue;
        if (k === "transporte") { if (v !== fila.transporte) patch[k] = v; continue; }
        if (!String(fila[k] || "").trim()) patch[k] = v;
      }
      if (!Object.keys(patch).length) return { actualizado: false };
      const r = await fetch(`${SUPABASE_URL}/rest/v1/clients?id=eq.${fila.id}`, { method: "PATCH", headers: h, body: JSON.stringify(patch) });
      return { actualizado: r.ok, campos: Object.keys(patch) };
    }
    if (!campos.razon_social) return { creado: false, motivo: "sin razón social" };
    const r = await fetch(`${SUPABASE_URL}/rest/v1/clients`, { method: "POST", headers: h, body: JSON.stringify({ rut: nota.rut, rut_normalized: digitos, active: true, ...campos }) });
    return { creado: r.ok };
  } catch (e) { return { error: e.message }; }
}

async function avisarNexor(nota, telefono) {
  const API = (process.env.NEXOR_API_KEY || "").trim();
  if (!API) return { skip: "sin NEXOR_API_KEY" };
  if (!nota || !nota.ok) return { skip: `sin nota: ${nota && nota.mensaje}` };
  const H = { "X-API-Key": API, "Content-Type": "application/json" };
  const tel = String(nota.telefono || telefono || "").replace(/\D/g, "");
  const rutDig = String(nota.rut || "").replace(/[^0-9kK]/g, "").toUpperCase();
  let lead = null, via = "";
  /* 1) por teléfono (últimos 8 dígitos) */
  if (tel.length >= 8) {
    const cola = tel.slice(-8);
    const j = await fetch(`${NX}/leads?search=${cola}&workflow_id=${WF}&limit=5`, { headers: H }).then((x) => x.json()).catch(() => ({}));
    lead = (j.leads || j.data || []).find((l) => String(l.phone || "").replace(/\D/g, "").endsWith(cola)) || null;
    if (lead) via = "teléfono";
  }
  /* 2) por RUT (metadata.rut de los leads cargados desde BI): lista los leads del flujo y los trae completos */
  if (!lead && rutDig.length >= 8) {
    const ids = [];
    for (let page = 0; page < 6; page++) {
      const j = await fetch(`${NX}/leads?workflow_id=${WF}&limit=50&page=${page}`, { headers: H }).then((x) => x.json()).catch(() => ({}));
      (j.leads || j.data || []).forEach((l) => ids.push(l.id));
      if (!(j.pagination && j.pagination.has_more)) break;
    }
    for (let i = 0; i < ids.length && !lead; i += 50) {
      const lote = ids.slice(i, i + 50);
      const j = await fetch(`${NX}/leads/bulk/get`, { method: "POST", headers: H, body: JSON.stringify({ lead_ids: lote }) }).then((x) => x.json()).catch(() => ({}));
      /* bulk/get devuelve [{ lead: {...} }] */
      lead = (j.leads || j.data || []).map((x) => x.lead || x).find((l) => String((l.metadata || {}).rut || "").replace(/[^0-9kK]/g, "").toUpperCase() === rutDig) || null;
    }
    if (lead) via = "RUT";
  }
  if (!lead) return { skip: tel.length >= 8 ? "el cliente no es lead de Nexor (no se crea)" : "pedido sin teléfono y sin lead con ese RUT" };

  const out = { lead_id: lead.id, via, referencia: nota.referencia };
  /* Si la ficha del cliente no tenía teléfono y el lead sí, se guarda para la próxima (tabla clients) */
  if (!tel && lead.phone && SUPABASE_URL && SERVICE_KEY && rutDig.length >= 8) {
    try {
      const norm = `${rutDig.slice(0, -1)}-${rutDig.slice(-1)}`;
      const filtro = encodeURIComponent(`(rut_normalized.eq.${rutDig},rut_normalized.eq.${norm})`);
      const r = await fetch(`${SUPABASE_URL}/rest/v1/clients?or=${filtro}&telefono=is.null`, { method: "PATCH", headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify({ telefono: String(lead.phone).replace(/\D/g, "") }) });
      out.telefono_guardado = r.status;
    } catch (_) {}
  }
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
  /* La página llama sin clave y solo con el uuid del pedido (imposible de adivinar). Con la clave interna
     (X-Api-Key = NEXOR_ORDER_KEY) se permite además buscar por RUT y se devuelve el detalle de Nexor. */
  const ORDER_KEY = (process.env.NEXOR_ORDER_KEY || "").trim();
  const apiKey = (event.headers || {})["x-api-key"] || (event.headers || {})["X-Api-Key"] || "";
  const conClave = !!ORDER_KEY && apiKey === ORDER_KEY;
  if (!conClave && !/^[0-9a-f-]{36}$/i.test(String(order.quoteId || ""))) return { statusCode: 400, body: JSON.stringify({ ok: false, mensaje: "Falta el id del pedido." }) };

  const TOKEN = process.env.TELEGRAM_TOKEN;
  const CHAT  = process.env.TELEGRAM_CHAT_PEDIDOS || process.env.TELEGRAM_CHAT_ID || "-5261495560"; /* grupo "Mohicano Pedidos" */

  /* Cole 44 (catalogo-44 / dolce-vita-44) o Cole 40-43 (catalogo-43, catalogo-2, catalogo-mixto).
     Sin source se asume Cole 44, que era el unico que avisaba antes. */
  const src   = String(order.source || "").toLowerCase();
  const es44  = !src || src.includes("44");
  const mixto = src.includes("mixto") || /^[0-9a-f-]{36}$/i.test(String(order.quoteIdExtra || ""));
  const id6   = order.quoteId ? String(order.quoteId).slice(-6).toUpperCase() : "???";
  const titulo = mixto ? "Nuevo pedido Cole 44 + Cole 40-43" : es44 ? "Nuevo pedido Cole 44" : "Nuevo pedido Cole 40-43";
  const ref  = (es44 ? "DV44-" : "C43-") + id6;
  const link = (es44 || mixto)
    ? (order.quoteId ? "https://mohicanojeans.netlify.app/catalogo-44/?pedido=" + order.quoteId : "https://mohicanojeans.netlify.app/catalogo-44/")
    : "https://mohicanojeans.netlify.app/?admin=1#admin";

  /* Completar con lo que ya sabemos: pedido guardado + ficha del cliente */
  const quoteId = String(order.quoteId || "");
  /* Con id del pedido; si no viene (o no es uuid), el último pedido de ese RUT en las últimas 72 h */
  /* Envío mixto desde catalogo-44: dos pedidos (44 y 40-43) con la misma hora; quoteIdExtra es el hermano */
  const quoteIdExtra = String(order.quoteIdExtra || "");
  const nota = /^[0-9a-f-]{36}$/i.test(quoteId)
    ? await construirNota(/^[0-9a-f-]{36}$/i.test(quoteIdExtra) ? { ids: [quoteId, quoteIdExtra] } : { id: quoteId }).catch((e) => ({ ok: false, mensaje: e.message }))
    : (conClave && order.rut ? await construirNota({ rut: order.rut }).catch((e) => ({ ok: false, mensaje: e.message })) : { ok: false, mensaje: "sin id de pedido" });
  const rut = (nota.ok && nota.rut) || order.rut || "";
  const ficha = await fichaCliente(rut);
  const dato = (...vals) => { for (const v of vals) { const s = String(v == null ? "" : v).trim(); if (s) return s; } return "—"; };
  /* Lo guardado (pedido + ficha) manda; lo que trae la página solo rellena huecos */
  const nombre     = dato(nota.ok && nota.cliente, ficha && ficha.razon_social, order.storeName);
  const telefono   = dato(nota.ok && nota.telefono, ficha && ficha.telefono, order.phone);
  const transporte = dato(nota.ok && nota.transporte, ficha && ficha.transporte, order.transporte);
  const comuna     = dato(nota.ok && nota.comuna, ficha && ficha.comuna, order.ciudad);
  const direccion  = dato(nota.ok && nota.direccion, ficha && ficha.direccion);
  const giro       = dato(nota.ok && nota.giro, ficha && ficha.giro);
  const tienda     = dato(nota.ok && nota.nombre_tienda, ficha && ficha.nombre_tienda);

  const lineasModelos = nota.ok
    ? nota.modelos.map((m) => `  - ${m.codigo}${m.nombre ? " (" + m.nombre + ")" : ""}${nota.mixto ? " · " + m.coleccion : ""}: ${m.unidades} u  [${m.tallas.map((t) => t.replace(": ", ":")).join(" ")}]${m.subtotal != null ? "  " + clp(m.subtotal) + " + IVA" : ""}`)
    : (order.items || []).map((it) => `  - ${it.codigo}${it.nombre ? " (" + it.nombre + ")" : ""}: ${it.totalUnidades} u`);
  const armar = (ls) => [
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
    ls.length ? ls.join("\n") : "  (sin detalle)",
    "",
    "Total unidades: " + (nota.ok ? nota.total_unidades : (order.totalUnidades || "—")),
    ...(nota.ok ? [`Neto: ${clp(nota.neto)}  ·  IVA: ${clp(nota.iva)}  ·  Total: ${clp(nota.total)}`] : []),
    "",
    "Ver pedido: " + link,
  ].join("\n");
  /* Telegram acepta 4096 caracteres: si el pedido es enorme se recortan modelos (el detalle completo está en el link) */
  let texto = armar(lineasModelos);
  let ls = lineasModelos;
  while (texto.length > 3900 && ls.length > 1) {
    ls = ls.slice(0, Math.max(1, Math.floor(ls.length * 0.8)));
    texto = armar([...ls, `  … y ${lineasModelos.length - ls.length} modelos más (ver link)`]);
  }

  /* Botón "Lo tomo yo" (lo atiende telegram-callback): así el grupo sabe quién está con el pedido */
  const idPedido = nota.ok ? nota.quote_id : (/^[0-9a-f-]{36}$/i.test(quoteId) ? quoteId : "");
  const tgBody = { chat_id: CHAT, text: texto, disable_web_page_preview: true };
  if (idPedido) tgBody.reply_markup = { inline_keyboard: [[{ text: "🙋 Lo tomo yo", callback_data: `tomar:${idPedido}` }]] };
  let telegram = "sin token";
  if (TOKEN) {
    try {
      const r = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(tgBody) });
      const j = await r.json().catch(() => ({}));
      telegram = j.ok ? "ok" : `error ${r.status}: ${j.description || ""}`.trim();
      if (!j.ok) console.error("Telegram sendMessage falló:", telegram);
    } catch (e) { telegram = `error: ${e.message}`; console.error("Telegram sendMessage falló:", e.message); }
  }

  /* La ficha del cliente queda al día con los datos del pedido (antes solo quedaban en el pedido y
     la próxima vez se le pedían de nuevo). No bloquea el aviso si falla. */
  let fichaGuardada = null;
  try { fichaGuardada = await guardarFichaCliente(nota); } catch (e) { fichaGuardada = { error: e.message }; }

  let nexor = null;
  try { nexor = await avisarNexor(nota, telefono === "—" ? "" : telefono); } catch (e) { nexor = { error: e.message }; }
  if (nexor && (nexor.error || nexor.msg1 >= 400 || nexor.estado >= 400)) console.error("Nexor:", JSON.stringify(nexor));

  const refFinal = nota.ok ? nota.referencia : ref;
  /* Al navegador solo se le confirma; el detalle (lead_id, estados) solo con la clave interna */
  return { statusCode: 200, body: JSON.stringify(conClave ? { ok: true, ref: refFinal, telegram, nexor, ficha: fichaGuardada } : { ok: true, ref: refFinal }) };
};
