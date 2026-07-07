// netlify/functions/crm-lead.js
// Recibe leads desde ManyChat (Instagram DM / WhatsApp) y los guarda en Supabase CRM

const SUPABASE_URL = process.env.SUPABASE_URL || "https://kdtydxihrflhziclgiof.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_CRM_KEY || process.env.SUPABASE_SERVICE_KEY;
const CRM_SECRET   = process.env.CRM_SECRET   || "mohicano-crm-2026";

// ── Helpers Supabase ──────────────────────────────────────────────────────────

async function sbPatch(table, match, data) {
  const qs = new URLSearchParams(match).toString();
  const r  = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${qs}`, {
    method:  "PATCH",
    headers: {
      "apikey":        SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type":  "application/json",
      "Prefer":        "return=minimal",
    },
    body: JSON.stringify(data),
  });
  if (!r.ok) console.error(`[sbPatch] ${table} → ${r.status}: ${await r.text()}`);
  return r.ok;
}

async function sbPost(table, data) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method:  "POST",
    headers: {
      "apikey":        SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type":  "application/json",
      "Prefer":        "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(data),
  });
  if (!r.ok) {
    const err = await r.text();
    console.error(`[sbPost] ${table} → ${r.status}: ${err}`);
  }
  return r.ok;
}

async function sbGet(table, params) {
  const qs = new URLSearchParams({ select: "*", ...params }).toString();
  const r  = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${qs}`, {
    headers: {
      "apikey":        SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
    },
  });
  if (!r.ok) {
    const err = await r.text();
    console.error(`[sbGet] ${table} → ${r.status}: ${err}`);
    return [];
  }
  return r.json();
}

// ── Handler principal ─────────────────────────────────────────────────────────

exports.handler = async (event) => {

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  // Log de diagnóstico
  console.log("[crm-lead] key presente:", !!SUPABASE_KEY);
  console.log("[crm-lead] body recibido:", event.body?.slice(0, 300));

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, body: "Invalid JSON" };
  }

  if (body.secret !== CRM_SECRET) {
    console.warn("[crm-lead] secret inválido:", body.secret);
    return { statusCode: 401, body: "Unauthorized" };
  }

  const _nombre   = (body.nombre    || "").trim();
  const nombre    = (_nombre.includes("{{") ? "" : _nombre);
  const _tel      = (body.telefono  || "").trim();
  const telefono  = (_tel.includes("{{") ? "" : _tel);
  const email     = (body.email     || "").trim();
  const _ig       = (body.instagram || "").trim();
  const instagram = (_ig.includes("{{") ? "" : _ig);
  const whatsapp  = (body.whatsapp  || "").trim();
  const mensaje   = (body.mensaje   || "").trim();
  const canal     = (body.canal     || "instagram").trim();
  const mc_id     = (body.mc_id     || "").trim();

  console.log("[crm-lead] datos:", { nombre, telefono, instagram, canal });

  if (!nombre && !telefono && !instagram && !whatsapp) {
    return { statusCode: 400, body: "Faltan datos del contacto" };
  }

  // ── 1. Buscar cliente existente (mc_id → instagram → teléfono) ──────────────
  let rut = null;
  let clienteExiste = false;

  // 1a. Por mc_id (más confiable)
  if (mc_id) {
    const byMcId = await sbGet("crm_clientes", { mc_id: `eq.${mc_id}` });
    if (byMcId.length) { rut = byMcId[0].rut; clienteExiste = true; }
  }

  // 1b. Por username de Instagram
  if (!clienteExiste && instagram) {
    const byIg = await sbGet("crm_clientes", { contacto: `eq.@${instagram}` });
    if (byIg.length) { rut = byIg[0].rut; clienteExiste = true; }
  }

  // 1c. Por teléfono
  if (!clienteExiste && telefono) {
    const fono_clean = telefono.replace(/\D/g, "");
    const existentes = await sbGet("crm_clientes", { telefono: `eq.${telefono}` });
    if (!existentes.length && fono_clean.length >= 8) {
      const local = fono_clean.slice(-9);
      const alt   = await sbGet("crm_clientes", { telefono: `ilike.*${local}*` });
      if (alt.length) { rut = alt[0].rut; clienteExiste = true; }
    } else if (existentes.length) {
      rut = existentes[0].rut;
      clienteExiste = true;
    }
  }

  console.log("[crm-lead] clienteExiste:", clienteExiste, "rut:", rut);

  // ── 2. Crear lead nuevo ───────────────────────────────────────────────────
  if (!clienteExiste) {
    const ts = Date.now();
    rut      = `LEAD-${canal.toUpperCase()}-${ts}`;

    const okCliente = await sbPost("crm_clientes", {
      rut,
      rut_normalizado: rut,
      razon_social:    nombre || instagram || whatsapp || `Lead ${canal} ${ts}`,
      telefono:        telefono || whatsapp || null,
      correo:          email || null,
      contacto:        instagram ? `@${instagram}` : null,
      canal:           canal,
      mc_id:           mc_id || null,
      ciudad:          null,
      region:          null,
      tipo_cliente:    "Lead",
      activo_desde:    new Date().getFullYear(),
    });
    console.log("[crm-lead] crm_clientes ok:", okCliente, "rut:", rut);

    const okPipeline = await sbPost("crm_pipeline", {
      cliente_rut:  rut,
      etapa:        "Nuevo mensaje",
      automatico:   true,
      notas:        `Lead nuevo desde ${canal}. Mensaje: ${mensaje}`,
      cambiado_por: "manychat",
    });
    console.log("[crm-lead] crm_pipeline ok:", okPipeline);
  }

  // ── 3. Registrar interacción ──────────────────────────────────────────────
  const tipo = canal === "whatsapp" ? "whatsapp" : "instagram_dm";

  const okInter = await sbPost("crm_interacciones", {
    cliente_rut: rut,
    tipo,
    detalle:     mensaje || `Contacto via ${canal}`,
    automatico:  true,
    usuario:     "manychat",
    metadata: {
      canal,
      instagram_username: instagram || null,
      whatsapp_number:    whatsapp  || null,
      mc_id:              mc_id     || null,
      mensaje,
    },
  });
  console.log("[crm-lead] crm_interacciones ok:", okInter);

  if (clienteExiste) {
    if (nombre) await sbPatch("crm_clientes", { rut: `eq.${rut}` }, { razon_social: nombre });

    await sbPost("crm_pipeline", {
      cliente_rut:  rut,
      etapa:        "Nuevo mensaje",
      automatico:   true,
      notas:        `Mensaje via ${canal}: ${mensaje}`,
      cambiado_por: "manychat",
    });
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ok: true, rut, nuevo: !clienteExiste }),
  };
};
