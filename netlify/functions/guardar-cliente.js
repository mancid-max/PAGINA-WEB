/* guardar-cliente — Sofía completa los datos del cliente (tabla clients de Supabase) para que la
   nota de pedido, el Telegram y la web salgan completos.
   POST /.netlify/functions/guardar-cliente
        { rut, razon_social?, telefono?, transporte?, giro?, direccion?, comuna?, nombre_tienda? }
   Autorización (cualquiera de las dos):
     - Header X-Api-Key = NEXOR_ORDER_KEY (misma clave que crear-pedido / nota-pedido), o
     - ?lead=<uuid del lead de Nexor>: se verifica contra la API de Nexor que el lead exista en el workflow de
       Sofía. Es lo que usa la herramienta guardar_datos_cliente (URL con {{lead_id}}): los headers de las
       herramientas de Nexor no reemplazan {{env.X}}, así que la clave nunca llegaba y devolvía 401.
   Solo escribe los campos que vienen con valor; nunca borra ni pisa con vacío lo que ya existe.
   → { ok, valido, existe, creado, rut, razon_social, telefono, transporte, giro, direccion, comuna, nombre_tienda, faltan, mensaje } */
const SUPABASE_URL = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const SERVICE_KEY = (process.env.SUPABASE_SERVICE_KEY || "").trim();
const ORDER_KEY = (process.env.NEXOR_ORDER_KEY || "").trim();
const NEXOR_KEY = (process.env.NEXOR_API_KEY || "").trim();
const WORKFLOW_SOFIA = "a914d7c0-fccc-4eb1-947a-ac5f875111d1";

/* El lead existe en Nexor y pertenece al workflow de Sofía → la llamada viene de la herramienta de Sofía
   (un uuid de lead no se adivina). Devuelve el teléfono del lead para completar la ficha si no vino. */
async function leadAutorizado(leadId) {
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
    return { telefono: String(lead.phone_e164 || lead.phone || "").trim() };
  } catch (_) { return null; }
}

const json = (obj, status = 200) => ({ statusCode: status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }, body: JSON.stringify(obj) });
function normalizarRut(raw) {
  const clean = String(raw || "").replace(/[^0-9kK]/g, "").toUpperCase();
  if (clean.length < 2) return "";
  return clean.slice(0, -1) + "-" + clean.slice(-1);
}
function rutValido(norm) {
  const m = /^(\d{7,8})-([0-9K])$/.exec(norm);
  if (!m) return false;
  let suma = 0, mul = 2;
  for (const d of m[1].split("").reverse()) { suma += Number(d) * mul; mul = mul === 7 ? 2 : mul + 1; }
  const res = 11 - (suma % 11);
  const dv = res === 11 ? "0" : res === 10 ? "K" : String(res);
  return dv === m[2];
}
const formatRut = (norm) => { const [n, dv] = norm.split("-"); return n.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "-" + dv; };

const CAMPOS = ["razon_social", "telefono", "transporte", "giro", "direccion", "comuna", "nombre_tienda"];
const ETIQUETAS = { telefono: "teléfono", transporte: "transporte", direccion: "dirección", comuna: "comuna", giro: "giro", nombre_tienda: "nombre de la tienda" };
const limpiar = (k, v) => {
  let s = String(v == null ? "" : v).trim().replace(/\s+/g, " ").slice(0, 120);
  if (k === "telefono") s = s.replace(/[^0-9+]/g, "");
  return s;
};

async function sb(path, opts = {}) {
  const r = await fetch(`${SUPABASE_URL}${path}`, {
    ...opts,
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json", ...(opts.headers || {}) },
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`${path} → ${r.status}: ${text.slice(0, 200)}`);
  return text ? JSON.parse(text) : null;
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json({ ok: false, mensaje: "Usar POST con JSON." }, 405);
  const apiKey = event.headers["x-api-key"] || event.headers["X-Api-Key"] || "";
  const conClave = !!ORDER_KEY && apiKey === ORDER_KEY;
  const lead = conClave ? null : await leadAutorizado((event.queryStringParameters || {}).lead);
  if (!conClave && !lead) return json({ ok: false, mensaje: "No autorizado." }, 401);
  if (!SUPABASE_URL || !SERVICE_KEY) return json({ ok: false, mensaje: "Falta configuración de Supabase." }, 500);

  let body;
  try { body = JSON.parse(event.body || "{}"); } catch (_) { return json({ ok: false, mensaje: "JSON inválido." }, 400); }
  /* El celular del lead de WhatsApp sirve como teléfono del cliente si Sofía no mandó otro. */
  if (lead && lead.telefono && !String(body.telefono || "").trim()) body.telefono = lead.telefono;

  const norm = normalizarRut(body.rut);
  if (!norm) return json({ ok: false, valido: false, mensaje: "Falta el RUT." });
  if (!rutValido(norm)) return json({ ok: false, valido: false, mensaje: `El RUT "${body.rut}" no es válido (dígito verificador). Pide al cliente que lo repita, ej. 12.345.678-9.` });
  const digitos = norm.replace("-", "");
  const rutFmt = formatRut(norm);

  const campos = {};
  for (const k of CAMPOS) { const v = limpiar(k, body[k]); if (v) campos[k] = v; }

  try {
    const filtro = encodeURIComponent(`(rut_normalized.eq.${digitos},rut_normalized.eq.${norm})`);
    const existente = ((await sb(`/rest/v1/clients?or=${filtro}&select=*&limit=1`)) || [])[0] || null;
    let fila = existente, creado = false;
    if (existente) {
      if (Object.keys(campos).length) {
        fila = ((await sb(`/rest/v1/clients?id=eq.${existente.id}`, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify({ ...campos, active: true }) })) || [])[0] || { ...existente, ...campos };
      }
    } else {
      if (!campos.razon_social) return json({ ok: false, valido: true, existe: false, rut: rutFmt, mensaje: "Cliente nuevo: necesito la razón social (nombre de la empresa o persona) para registrarlo." });
      fila = ((await sb(`/rest/v1/clients`, { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify({ rut: rutFmt, rut_normalized: digitos, active: true, ...campos }) })) || [])[0] || { rut: rutFmt, rut_normalized: digitos, ...campos };
      creado = true;
    }

    const faltan = ["telefono", "transporte", "direccion", "comuna", "giro", "nombre_tienda"].filter((k) => !String(fila[k] || "").trim());
    const out = { ok: true, valido: true, existe: true, creado, rut: rutFmt, razon_social: fila.razon_social || null };
    for (const k of ["telefono", "transporte", "giro", "direccion", "comuna", "nombre_tienda"]) out[k] = fila[k] || null;
    out.faltan = faltan;
    out.mensaje = (creado ? "Cliente registrado. " : Object.keys(campos).length ? "Datos guardados. " : "Sin cambios. ")
      + (faltan.length ? `Para que la nota de pedido salga completa faltan: ${faltan.map((k) => ETIQUETAS[k]).join(", ")}.` : "Ficha completa.");
    return json(out);
  } catch (e) {
    return json({ ok: false, mensaje: `No pude guardar los datos: ${e.message}` }, 500);
  }
};
