// netlify/functions/crm-form.js
// Recibe envíos del formulario B2B (Klaviyo embed en mayorista.html) y crea el lead en CRM

const SUPABASE_URL = process.env.SUPABASE_URL || "https://kdtydxihrflhziclgiof.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const CRM_SECRET   = process.env.CRM_SECRET || "mohicano-crm-2026";

const SB_HEADERS = {
  "apikey":        SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
  "Content-Type":  "application/json",
  "Prefer":        "resolution=merge-duplicates,return=minimal",
};

async function sbPost(table, data) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method:  "POST",
    headers: SB_HEADERS,
    body:    JSON.stringify(data),
  });
  return r.ok;
}

async function sbGet(table, params) {
  const qs = new URLSearchParams({ select: "*", ...params }).toString();
  const r  = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${qs}`, {
    headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` },
  });
  return r.ok ? r.json() : [];
}

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin":  "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: "Method Not Allowed" };
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: "Invalid JSON" }) };
  }

  if (body.secret !== CRM_SECRET) {
    return { statusCode: 401, headers, body: JSON.stringify({ ok: false, error: "Unauthorized" }) };
  }

  const nombre   = (body.nombre   || "").trim();
  const email    = (body.email    || "").trim();
  const telefono = (body.telefono || "").trim();
  const ciudad   = (body.ciudad   || "").trim();
  const region   = (body.region   || "").trim();

  if (!email && !telefono) {
    return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: "Faltan datos" }) };
  }

  // Buscar cliente existente por email o teléfono
  let rut = null;
  let clienteExiste = false;

  if (email) {
    const por_email = await sbGet("crm_clientes", { correo: `eq.${email}` });
    if (por_email.length) { rut = por_email[0].rut; clienteExiste = true; }
  }

  if (!clienteExiste && telefono) {
    const fono_clean = telefono.replace(/\D/g, "");
    const por_fono   = await sbGet("crm_clientes", { telefono: `eq.${telefono}` });
    if (por_fono.length) {
      rut = por_fono[0].rut; clienteExiste = true;
    } else if (fono_clean.length >= 8) {
      const local = fono_clean.slice(-9);
      const alt   = await sbGet("crm_clientes", { telefono: `ilike.*${local}*` });
      if (alt.length) { rut = alt[0].rut; clienteExiste = true; }
    }
  }

  // Crear lead si no existe
  if (!clienteExiste) {
    const ts = Date.now();
    rut = `LEAD-FORM-${ts}`;

    await sbPost("crm_clientes", {
      rut,
      rut_normalizado: rut,
      razon_social:    nombre || email || `Lead Formulario ${ts}`,
      telefono:        telefono || null,
      correo:          email    || null,
      ciudad:          ciudad   || null,
      region:          region   || null,
      tipo_cliente:    "Lead",
      activo_desde:    new Date().getFullYear(),
    });
  } else {
    // Actualizar datos si ya existía
    const patch = {};
    if (ciudad)   patch.ciudad  = ciudad;
    if (region)   patch.region  = region;
    if (telefono) patch.telefono = telefono;
    if (Object.keys(patch).length) {
      await fetch(`${SUPABASE_URL}/rest/v1/crm_clientes?rut=eq.${rut}`, {
        method:  "PATCH",
        headers: SB_HEADERS,
        body:    JSON.stringify(patch),
      });
    }
  }

  // Pipeline: Formulario completado
  await sbPost("crm_pipeline", {
    cliente_rut:  rut,
    etapa:        "Formulario completado",
    automatico:   true,
    notas:        `Formulario B2B completado. Ciudad: ${ciudad || "—"}, Región: ${region || "—"}`,
    cambiado_por: "klaviyo_form",
  });

  // Interacción
  await sbPost("crm_interacciones", {
    cliente_rut: rut,
    tipo:        "formulario_b2b",
    detalle:     `Completó formulario mayorista. Ciudad: ${ciudad || "—"}, Región: ${region || "—"}`,
    automatico:  true,
    usuario:     "klaviyo_form",
    metadata:    { email, telefono, ciudad, region, nombre },
  });

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ ok: true, rut, nuevo: !clienteExiste }),
  };
};
