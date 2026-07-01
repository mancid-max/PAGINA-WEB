// netlify/functions/crm-lead.js
// Recibe leads desde ManyChat (Instagram DM / WhatsApp) y los guarda en Supabase CRM
//
// Copiar este archivo a: PAGINA-WEB/netlify/functions/crm-lead.js
// URL del webhook: https://mohicanojeans.netlify.app/.netlify/functions/crm-lead

const SUPABASE_URL        = process.env.SUPABASE_URL        || "https://kdtydxihrflhziclgiof.supabase.co";
const SUPABASE_KEY        = process.env.SUPABASE_SERVICE_KEY;
const CRM_SECRET          = process.env.CRM_SECRET          || "mohicano-crm-2026";

const SB_HEADERS = {
  "apikey":        SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
  "Content-Type":  "application/json",
  "Prefer":        "resolution=merge-duplicates,return=minimal",
};

// ── Helpers Supabase ──────────────────────────────────────────────────────────

async function sbPost(table, data) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method:  "POST",
    headers: SB_HEADERS,
    body:    JSON.stringify(data),
  });
  return r.ok;
}

async function sbGet(table, params) {
  const qs  = new URLSearchParams({ select: "*", ...params }).toString();
  const r   = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${qs}`, {
    headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` },
  });
  return r.ok ? r.json() : [];
}

// ── Handler principal ─────────────────────────────────────────────────────────

exports.handler = async (event) => {

  // Solo POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, body: "Invalid JSON" };
  }

  // Verificar token secreto
  if (body.secret !== CRM_SECRET) {
    return { statusCode: 401, body: "Unauthorized" };
  }

  // Extraer campos que envía ManyChat
  const nombre    = (body.nombre    || "").trim();
  const telefono  = (body.telefono  || "").trim();
  const email     = (body.email     || "").trim();
  const instagram = (body.instagram || "").trim(); // username de Instagram
  const whatsapp  = (body.whatsapp  || "").trim(); // número WhatsApp
  const mensaje   = (body.mensaje   || "").trim();
  const canal     = (body.canal     || "instagram").trim(); // 'instagram' | 'whatsapp'
  const mc_id     = (body.mc_id     || "").trim(); // ManyChat subscriber ID

  if (!nombre && !telefono && !instagram && !whatsapp) {
    return { statusCode: 400, body: "Faltan datos del contacto" };
  }

  // ── 1. Buscar si el cliente ya existe por teléfono ────────────────────────
  let rut = null;
  let clienteExiste = false;

  if (telefono) {
    const fono_clean = telefono.replace(/\D/g, "");
    const existentes = await sbGet("crm_clientes", { telefono: `eq.${telefono}` });
    if (!existentes.length && fono_clean.length >= 8) {
      // Buscar también sin código de país
      const local = fono_clean.slice(-9);
      const alt   = await sbGet("crm_clientes", { telefono: `ilike.*${local}*` });
      if (alt.length) { rut = alt[0].rut; clienteExiste = true; }
    } else if (existentes.length) {
      rut = existentes[0].rut;
      clienteExiste = true;
    }
  }

  // ── 2. Si no existe, crear como lead nuevo ────────────────────────────────
  if (!clienteExiste) {
    // Generar RUT temporal basado en canal + timestamp
    const ts  = Date.now();
    rut       = `LEAD-${canal.toUpperCase()}-${ts}`;

    await sbPost("crm_clientes", {
      rut,
      rut_normalizado: rut,
      razon_social:    nombre || instagram || whatsapp || `Lead ${canal} ${ts}`,
      telefono:        telefono || whatsapp || null,
      correo:          email   || null,
      contacto:        instagram ? `@${instagram}` : null,
      ciudad:          null,
      region:          null,
      tipo_cliente:    "Lead",
      activo_desde:    new Date().getFullYear(),
    });

    // Pipeline inicial
    await sbPost("crm_pipeline", {
      cliente_rut:  rut,
      etapa:        canal === "whatsapp" ? "Interacción Instagram" : "Interacción Instagram",
      automatico:   true,
      notas:        `Lead nuevo desde ${canal}. Mensaje: ${mensaje}`,
      cambiado_por: "manychat",
    });
  }

  // ── 3. Registrar interacción ──────────────────────────────────────────────
  const tipo = canal === "whatsapp" ? "whatsapp" : "instagram_dm";

  await sbPost("crm_interacciones", {
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

  // Si ya existía, mover pipeline a etapa de contacto
  if (clienteExiste) {
    await sbPost("crm_pipeline", {
      cliente_rut:  rut,
      etapa:        "Interacción Instagram",
      automatico:   true,
      notas:        `Mensaje via ${canal}: ${mensaje}`,
      cambiado_por: "manychat",
    });
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ ok: true, rut, nuevo: !clienteExiste }),
  };
};
