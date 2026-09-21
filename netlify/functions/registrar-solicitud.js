/* registrar-solicitud — Sofía registra lo que un cliente pidió y ella no pudo resolver (talla, color o modelo
   sin stock o sin publicar, precio que no tiene, quiere que lo llamen, reclamo, pregunta sin respuesta).
   Queda en la tabla solicitudes (Supabase, database/supabase_solicitudes.sql) y avisa al grupo Ayuda de
   Telegram con el botón "✅ Resuelta" (telegram-callback, acción sol:<uuid>). Con esto se atienden las
   peticiones y se ve qué piden los clientes para mejorar al agente.

   POST /.netlify/functions/registrar-solicitud?lead=<uuid del lead de Nexor>
        { tipo, texto, contexto?, rut?, nombre? }
        Autorización: el lead existe en Nexor y está en el workflow de Sofía (igual que guardar-cliente),
        o header X-Api-Key = NEXOR_ORDER_KEY.
   GET  /.netlify/functions/registrar-solicitud[?estado=pendiente|resuelta|todas]  (header X-Api-Key = NEXOR_ORDER_KEY)
        → lista para el informe privado de pendientes (pendientes-catalogo.js).
   → { ok, id, mensaje } */
const SUPABASE_URL = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const SERVICE_KEY = (process.env.SUPABASE_SERVICE_KEY || "").trim();
const ORDER_KEY = (process.env.NEXOR_ORDER_KEY || "").trim();
const NEXOR_KEY = (process.env.NEXOR_API_KEY || "").trim();
const TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_AYUDA = process.env.TELEGRAM_CHAT_AYUDA || process.env.TELEGRAM_CHAT_ID;
const WORKFLOW_SOFIA = "a914d7c0-fccc-4eb1-947a-ac5f875111d1";
const TIPOS = ["stock", "talla", "color", "modelo", "precio", "foto", "llamada", "reclamo", "otro"];
const ETIQUETA = { stock: "Sin stock", talla: "Talla", color: "Color", modelo: "Modelo", precio: "Precio", foto: "Fotos / video", llamada: "Quiere que lo llamen", reclamo: "Reclamo", otro: "Otra consulta" };

const json = (obj, status = 200) => ({ statusCode: status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }, body: JSON.stringify(obj) });
const limpio = (v, n) => String(v == null ? "" : v).trim().replace(/\s+/g, " ").slice(0, n);
const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));

async function sb(path, opts = {}) {
  const r = await fetch(`${SUPABASE_URL}${path}`, { ...opts, headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json", ...(opts.headers || {}) } });
  const text = await r.text();
  if (!r.ok) throw new Error(`${path} → ${r.status}: ${text.slice(0, 200)}`);
  return text ? JSON.parse(text) : null;
}

/* El lead existe en Nexor y pertenece al workflow de Sofía → la llamada viene de la herramienta de Sofía. */
async function leadDeNexor(leadId) {
  if (!NEXOR_KEY || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(leadId || ""))) return null;
  try {
    const r = await fetch(`https://api.getnexor.ai/api/public/leads/${leadId}`, { headers: { "X-API-Key": NEXOR_KEY } });
    if (!r.ok) return null;
    const j = await r.json().catch(() => null);
    const lead = (j && (j.lead || j)) || null;
    if (!lead || String(lead.id || "").toLowerCase() !== String(leadId).toLowerCase()) return null;
    const run = lead.active_workflow_run || lead.last_workflow_run || null;
    const wf = run ? (run.workflow_id || (run.workflow && run.workflow.id) || "") : "";
    if (wf !== WORKFLOW_SOFIA) return null;
    return { id: lead.id, phone: String(lead.phone_e164 || lead.phone || "").trim(), nombre: [lead.first_name, lead.last_name].filter(Boolean).join(" "), rut: String((lead.metadata || {}).rut || "").trim() };
  } catch (_) { return null; }
}

exports.handler = async (event) => {
  const q = event.queryStringParameters || {};
  const apiKey = event.headers["x-api-key"] || event.headers["X-Api-Key"] || "";
  const conClave = !!ORDER_KEY && apiKey === ORDER_KEY; /* siempre por header, nunca en la URL */
  if (!SUPABASE_URL || !SERVICE_KEY) return json({ ok: false, mensaje: "Falta configuración de Supabase." }, 500);

  /* Listado para el informe privado (solo con la clave). */
  if (event.httpMethod === "GET") {
    if (!conClave) return json({ ok: false, mensaje: "No autorizado." }, 401);
    const estado = ["pendiente", "resuelta", "todas"].includes(q.estado) ? q.estado : "pendiente";
    const filtro = estado === "todas" ? "" : `&estado=eq.${estado}`;
    try {
      const filas = await sb(`/rest/v1/solicitudes?select=id,created_at,phone,rut,nombre,tipo,texto,contexto,estado,resuelta_at,resuelta_por&order=created_at.desc&limit=200${filtro}`);
      return json({ ok: true, estado, total: filas.length, solicitudes: filas });
    } catch (e) { return json({ ok: false, mensaje: `No pude leer las solicitudes: ${e.message}` }, 500); }
  }
  if (event.httpMethod !== "POST") return json({ ok: false, mensaje: "Usar POST con JSON." }, 405);

  const lead = conClave ? null : await leadDeNexor(q.lead);
  if (!conClave && !lead) return json({ ok: false, mensaje: "No autorizado." }, 401);

  let body;
  try { body = JSON.parse(event.body || "{}"); } catch (_) { return json({ ok: false, mensaje: "JSON inválido." }, 400); }
  const texto = limpio(body.texto, 500);
  if (!texto) return json({ ok: false, mensaje: "Falta 'texto': qué pidió el cliente, con sus palabras." });
  const tipo = TIPOS.includes(String(body.tipo || "").toLowerCase()) ? String(body.tipo).toLowerCase() : "otro";
  const fila = {
    lead_id: lead ? lead.id : (limpio(q.lead, 40) || null),
    phone: limpio(body.telefono || body.phone || (lead && lead.phone), 20) || null,
    rut: limpio(body.rut || (lead && lead.rut), 20) || null,
    nombre: limpio(body.nombre || (lead && lead.nombre), 120) || null,
    tipo,
    texto,
    contexto: limpio(body.contexto, 300) || null,
  };

  /* Misma petición repetida en la conversación (mismo lead, mismo texto, últimas 24 h): no se duplica. */
  try {
    if (fila.lead_id) {
      const desde = new Date(Date.now() - 24 * 3600e3).toISOString();
      const rep = await sb(`/rest/v1/solicitudes?select=id&lead_id=eq.${encodeURIComponent(fila.lead_id)}&estado=eq.pendiente&texto=eq.${encodeURIComponent(JSON.stringify(texto))}&created_at=gte.${desde}&limit=1`);
      if (rep && rep.length) return json({ ok: true, id: rep[0].id, repetida: true, mensaje: "Esa solicitud ya estaba registrada; no la repitas, dile al cliente que ya quedó anotada." });
    }
  } catch (_) {}

  let guardada;
  try {
    guardada = ((await sb(`/rest/v1/solicitudes`, { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify(fila) })) || [])[0] || null;
  } catch (e) { return json({ ok: false, mensaje: `No pude registrar la solicitud: ${e.message}` }, 500); }

  /* Aviso al grupo Ayuda con botón "Resuelta". Si Telegram falla, la solicitud igual queda guardada.
     Tope: hasta 5 avisos por lead al día; el resto se guarda sin avisar (un cliente no puede inundar el grupo). */
  let telegram = false;
  let avisosHoy = 0;
  try {
    if (fila.lead_id) {
      const desde = new Date(Date.now() - 24 * 3600e3).toISOString();
      const n = await sb(`/rest/v1/solicitudes?select=id&lead_id=eq.${encodeURIComponent(fila.lead_id)}&created_at=gte.${desde}&limit=20`);
      avisosHoy = (n || []).length;
    }
  } catch (_) {}
  if (TOKEN && CHAT_AYUDA && guardada && avisosHoy <= 5) {
    const lineas = [
      `🙋 <b>Solicitud de cliente</b> · ${esc(ETIQUETA[tipo] || tipo)}`,
      `Pidió: ${esc(texto)}`,
      fila.contexto ? `Nota de Sofía: ${esc(fila.contexto)}` : null,
      ``,
      `Cliente: ${esc(fila.nombre || "—")}${fila.rut ? ` · RUT ${esc(fila.rut)}` : ""}`,
      `Teléfono: ${fila.phone ? `<a href="https://wa.me/${esc(fila.phone.replace(/[^0-9]/g, ""))}">${esc(fila.phone)}</a>` : "—"}`,
      `Sofía le dijo que quedó anotado y que un ejecutivo lo verá.`,
    ].filter((l) => l !== null).join("\n");
    try {
      const r = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: CHAT_AYUDA, text: lineas, parse_mode: "HTML", disable_web_page_preview: true, reply_markup: { inline_keyboard: [[{ text: "✅ Resuelta", callback_data: `sol:${guardada.id}` }]] } }),
      });
      telegram = r.ok;
    } catch (_) {}
  }

  return json({ ok: true, id: guardada ? guardada.id : null, telegram, mensaje: "Solicitud registrada. Dile al cliente en una frase que quedó anotada y que un ejecutivo la verá; no prometas plazo ni resultado." });
};
