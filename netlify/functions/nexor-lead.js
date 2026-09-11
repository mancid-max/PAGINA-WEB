/* nexor-lead — crea un lead en Nexor SOLO cuando hay intención de compra (plan de 500 leads/mes).
   POST /.netlify/functions/nexor-lead
   { "segmento": "mini" | "b2b" | "cobranzas", "nombre": "…", "telefono": "+56 9 …", "rut": "…",
     "empresa": "…", "mensaje": "quiero 50 pitillos", "modelos": ["4448-00"], "origen": "catalogo-44" }
   Env Netlify: NEXOR_API_KEY (Bearer para https://api.getnexor.ai/api/public/leads),
                NEXOR_WF_MINI, NEXOR_WF_B2B, NEXOR_WF_COBRANZAS (ids de workflow; hay valores por defecto).
   Nexor deduplica por teléfono dentro de cada agente; además enviamos external_id = RUT. */
const NEXOR_API = "https://api.getnexor.ai/api/public/leads";
const API_KEY = (process.env.NEXOR_API_KEY || "").trim();
const WF = {
  mini: (process.env.NEXOR_WF_MINI || "92560cbd-4a0b-4fce-b768-be8ceb23f828").trim(),
  b2b: (process.env.NEXOR_WF_B2B || "a914d7c0-fccc-4eb1-947a-ac5f875111d1").trim(),
  cobranzas: (process.env.NEXOR_WF_COBRANZAS || "3f1736d1-2b2e-474f-9603-6a3e7f98bfac").trim(),
};
/* Cada lead creado acá se cobra en Nexor, así que este endpoint NO puede quedar abierto:
   exige una clave del que llama (NEXOR_LEAD_KEY) y solo acepta CORS desde nuestro propio sitio.
   Si la clave no está configurada, el endpoint queda cerrado (falla cerrado, no abierto). */
const LEAD_KEY = (process.env.NEXOR_LEAD_KEY || "").trim();
const ORIGENES_OK = new Set([
  "https://mohicanojeans.netlify.app",
  "https://www.mohicanojeans.cl",
  "https://mohicanojeans.cl",
  "http://localhost:5500",
  "http://127.0.0.1:5500",
]);
const corsPara = (event) => {
  const o = String((event.headers || {}).origin || (event.headers || {}).Origin || "").trim();
  return ORIGENES_OK.has(o) ? o : "https://mohicanojeans.netlify.app";
};
const json = (obj, status = 200, event = {}) => ({
  statusCode: status,
  headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "Access-Control-Allow-Origin": corsPara(event), "Vary": "Origin", "Access-Control-Allow-Headers": "Content-Type, X-Api-Key", "Access-Control-Allow-Methods": "POST, OPTIONS" },
  body: JSON.stringify(obj),
});

function telefonoE164(raw) {
  let d = String(raw || "").replace(/[^0-9]/g, "");
  if (d.startsWith("56")) d = d.slice(2);
  if (d.length === 9 && d.startsWith("9")) return "+56" + d;
  if (d.length === 8) return "+569" + d; /* celular sin el 9 inicial */
  return "";
}
const rutNorm = (r) => String(r || "").replace(/[^0-9kK]/g, "").toUpperCase();

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return json({ ok: true }, 200, event);
  if (event.httpMethod !== "POST") return json({ ok: false, mensaje: "Usar POST." }, 405, event);

  /* Puerta cerrada: sin NEXOR_LEAD_KEY configurada nadie crea leads, aunque NEXOR_API_KEY sí exista. */
  if (!LEAD_KEY) return json({ ok: false, mensaje: "Creación de leads deshabilitada (falta NEXOR_LEAD_KEY)." }, 503, event);
  const h = event.headers || {};
  const enviada = String(h["x-api-key"] || h["X-Api-Key"] || "").trim();
  if (enviada !== LEAD_KEY) {
    console.warn("nexor-lead: intento sin clave válida desde", h["x-nf-client-connection-ip"] || h["client-ip"] || "?", "origen", h.origin || h.referer || "?");
    return json({ ok: false, mensaje: "No autorizado." }, 401, event);
  }

  if (!API_KEY) return json({ ok: false, mensaje: "Falta NEXOR_API_KEY en Netlify." }, 500, event);

  let b;
  try { b = JSON.parse(event.body || "{}"); } catch (_) { return json({ ok: false, mensaje: "JSON inválido." }, 400, event); }

  const segmento = String(b.segmento || "mini").toLowerCase();
  const workflow_id = WF[segmento];
  if (!workflow_id) return json({ ok: false, mensaje: `Segmento inválido: ${segmento}` }, 400, event);
  const phone = telefonoE164(b.telefono);
  if (!phone) return json({ ok: false, mensaje: "Teléfono inválido: usa un celular chileno (9 dígitos)." }, 400, event);
  const nombre = String(b.nombre || "").trim();
  if (!nombre) return json({ ok: false, mensaje: "Falta el nombre." }, 400, event);
  const mensaje = String(b.mensaje || "").trim();
  if (segmento !== "cobranzas" && mensaje.length < 3) return json({ ok: false, mensaje: "Cuéntanos qué quieres comprar (así solo pasan clientes con intención)." }, 400, event);

  const [first_name, ...rest] = nombre.split(/\s+/);
  const lead = {
    first_name,
    last_name: rest.join(" ") || undefined,
    phone,
    company: String(b.empresa || "").trim() || undefined,
    external_id: rutNorm(b.rut) || undefined,
    /* El filtro de desconocidos de Nexor deja pasar solo fuentes EXACTAS nuestras.
       Por eso el prefijo: "web" a secas se confunde con las fuentes propias de Nexor (webchat, whatsapp_web). */
    source: `mohicano-${String(b.origen || "web").toLowerCase().replace(/^mohicano-/, "")}`,
    workflow_id,
    /* metadata (claves no-core se mapean solas) */
    rut: String(b.rut || "").trim() || undefined,
    intencion: mensaje || undefined,
    modelos: Array.isArray(b.modelos) ? b.modelos.join(",") : (b.modelos || undefined),
    url_origen: String(b.url || "").trim() || undefined,
    segmento,
    creado_por: "web-mohicano",
  };
  Object.keys(lead).forEach((k) => lead[k] === undefined && delete lead[k]);

  try {
    const r = await fetch(NEXOR_API, {
      method: "POST",
      headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(lead),
    });
    const text = await r.text();
    let data = null; try { data = JSON.parse(text); } catch (_) {}
    if (!r.ok) {
      console.error("nexor-lead error", r.status, text.slice(0, 300));
      return json({ ok: false, mensaje: "No pude registrar la solicitud. Escríbenos por WhatsApp.", detalle: (data && (data.message || data.error)) || r.status }, 200, event);
    }
    return json({ ok: true, mensaje: "Listo. Sofía te escribirá por WhatsApp en un momento.", lead_id: (data && (data.id || (data.lead && data.lead.id))) || null, segmento }, 200, event);
  } catch (e) {
    console.error("nexor-lead fetch", e.message);
    return json({ ok: false, mensaje: "Error de conexión con el asistente. Intenta de nuevo." }, 502, event);
  }
};
