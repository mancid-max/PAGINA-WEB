// netlify/functions/crm-lead.js
// Recibe leads desde ManyChat (Instagram DM / WhatsApp), guarda en Supabase y responde con IA

const SUPABASE_URL      = process.env.SUPABASE_URL        || "https://kdtydxihrflhziclgiof.supabase.co";
const SUPABASE_KEY      = process.env.SUPABASE_CRM_KEY    || process.env.SUPABASE_SERVICE_KEY;
const CRM_SECRET        = process.env.CRM_SECRET          || "mohicano-crm-2026";
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const MANYCHAT_API_KEY  = process.env.MANYCHAT_API_KEY;

const SB_HEADERS = {
  "apikey":        SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
  "Content-Type":  "application/json",
  "Prefer":        "resolution=merge-duplicates,return=minimal",
};

const SYSTEM_PROMPT = `Eres el asistente virtual de Mohicano Jeans, una empresa chilena de moda denim con sede en Santiago. \
Atiendes por WhatsApp e Instagram a personas interesadas en comprar al por mayor (mayoristas y minimayoristas).

SOBRE MOHICANO JEANS:
- Fabricamos y comercializamos jeans y ropa denim de calidad para hombre, mujer y niño.
- Tenemos showroom en Santiago. También hacemos visitas de vendedor y videollamadas.
- Trabajamos con mayoristas y minimayoristas en todo Chile.

CÓMO SER CLIENTE:
- Minimayorista: compra mínima de 12 unidades — accede a precios preferenciales.
- Mayorista: compra mínima de 24 unidades — mejores precios, atención personalizada de ejecutivo.
- Para aprobar una cuenta nueva: el lead completa el formulario de solicitud que le enviamos.

LO QUE PUEDES RESPONDER:
- Disponibilidad general de productos y tallas.
- Precios aproximados y rangos por volumen.
- Proceso para convertirse en mayorista o minimayorista.
- Cómo agendar visita, videollamada o ir al showroom.
- Información general de la colección actual.
- Despacho inmediato: hay artículos con stock en bodega listos para facturar hoy.

LO QUE NO PUEDES HACER:
- Confirmar pedidos ni tomar órdenes de compra — eso lo hace el ejecutivo asignado.
- Dar RUT, datos bancarios ni información confidencial de clientes.
- Comprometerte a precios exactos sin que el ejecutivo los confirme.

TONO:
- Amigable, directo y profesional. Tuteás al cliente.
- Respuestas cortas y concretas — no más de 3-4 líneas por mensaje.
- Usas emojis con moderación (1-2 por mensaje máximo).
- Si no sabes algo específico, ofreces conectar con un ejecutivo.

Cuando el cliente quiere hablar con un ejecutivo o agendar algo, responde que vas a avisar al equipo y que alguien se contacta pronto.`;

// ── Helpers Supabase ──────────────────────────────────────────────────────────

async function sbPost(table, data) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method:  "POST",
    headers: SB_HEADERS,
    body:    JSON.stringify(data),
  });
  if (!r.ok) {
    const err = await r.text();
    console.error(`[sbPost] ${table} → ${r.status}: ${err}`);
  }
  return r.ok;
}

async function sbPatch(table, match, data) {
  const qs = new URLSearchParams(match).toString();
  const r  = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${qs}`, {
    method:  "PATCH",
    headers: { ...SB_HEADERS, Prefer: "return=minimal" },
    body:    JSON.stringify(data),
  });
  if (!r.ok) console.error(`[sbPatch] ${table} → ${r.status}: ${await r.text()}`);
  return r.ok;
}

async function sbGet(table, params) {
  const qs = new URLSearchParams({ select: "*", ...params }).toString();
  const r  = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${qs}`, {
    headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` },
  });
  if (!r.ok) {
    console.error(`[sbGet] ${table} → ${r.status}: ${await r.text()}`);
    return [];
  }
  return r.json();
}

// ── Historial para contexto del agente ────────────────────────────────────────

async function getHistory(rut, limit = 8) {
  if (!rut) return [];
  const ints = await sbGet("crm_interacciones", {
    "cliente_rut": `eq.${rut}`,
    "tipo":        "in.(whatsapp,ai_response,instagram_dm)",
    "order":       "fecha.desc",
    "limit":       String(limit),
  });
  const mensajes = [];
  for (const inter of [...ints].reverse()) {
    const rol   = inter.tipo === "ai_response" ? "assistant" : "user";
    const texto = inter.detalle || "";
    if (texto) mensajes.push({ role: rol, content: texto });
  }
  return mensajes;
}

// ── Llamada a Claude Haiku ────────────────────────────────────────────────────

async function askClaude(mensaje, historial, contextoCliente) {
  let system = SYSTEM_PROMPT;
  if (contextoCliente) system += `\n\nCONTEXTO DEL CLIENTE ACTUAL:\n${contextoCliente}`;

  const messages = [...historial, { role: "user", content: mensaje }];

  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method:  "POST",
    headers: {
      "Content-Type":      "application/json",
      "x-api-key":         ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model:      "claude-haiku-4-5-20251001",
      max_tokens: 300,
      system,
      messages,
    }),
  });

  if (!resp.ok) {
    console.error("[AI] Error Claude:", resp.status, await resp.text());
    return null;
  }
  const data = await resp.json();
  return data.content?.[0]?.text?.trim() || null;
}

// ── Enviar mensaje via ManyChat ───────────────────────────────────────────────

async function mcSendText(mc_id, texto) {
  if (!mc_id || !texto) return false;
  const resp = await fetch("https://api.manychat.com/fb/sending/sendContent", {
    method:  "POST",
    headers: {
      "Authorization": `Bearer ${MANYCHAT_API_KEY}`,
      "Content-Type":  "application/json",
    },
    body: JSON.stringify({
      subscriber_id: mc_id,
      data: {
        version: "v2",
        content: { messages: [{ type: "text", text: texto }] },
      },
    }),
  });
  if (!resp.ok) console.error("[MC] Error send:", resp.status, await resp.text());
  return resp.ok;
}

// ── Handler principal ─────────────────────────────────────────────────────────

exports.handler = async (event) => {

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

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

  const _nombre    = (body.nombre    || "").trim();
  const nombre     = (_nombre.includes("{{") ? "" : _nombre);
  const _tel       = (body.telefono  || "").trim();
  const telefono   = (_tel.includes("{{") ? "" : _tel);
  const email      = (body.email     || "").trim();
  const _ig        = (body.instagram || "").trim();
  const instagram  = (_ig.includes("{{") ? "" : _ig);
  const whatsapp   = (body.whatsapp  || "").trim();
  const mensaje    = (body.mensaje   || "").trim();
  const canal      = (body.canal     || "instagram").trim();
  const mc_id      = (body.mc_id     || "").trim();
  const tipo_flujo = (body.tipo_flujo || "nuevo").trim();

  const esMayorista = tipo_flujo === "mayorista";

  console.log("[crm-lead] datos:", { nombre, telefono, instagram, canal });

  if (!nombre && !telefono && !instagram && !whatsapp) {
    return { statusCode: 400, body: "Faltan datos del contacto" };
  }

  // ── 1. Buscar cliente existente (mc_id → instagram → teléfono) ──────────────
  let rut = null;
  let clienteExiste = false;

  if (mc_id) {
    const byMcId = await sbGet("crm_clientes", { mc_id: `eq.${mc_id}` });
    if (byMcId.length) { rut = byMcId[0].rut; clienteExiste = true; }
  }

  if (!clienteExiste && instagram) {
    const byIg = await sbGet("crm_clientes", { contacto: `eq.@${instagram}` });
    if (byIg.length) { rut = byIg[0].rut; clienteExiste = true; }
  }

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
      canal,
      mc_id:           mc_id || null,
      ciudad:          null,
      region:          null,
      tipo_cliente:    esMayorista ? "Lead_WA" : "Lead",
      activo_desde:    new Date().getFullYear(),
    });
    console.log("[crm-lead] crm_clientes ok:", okCliente, "rut:", rut);

    const notaInicial = esMayorista
      ? `Mayorista existente vía ${canal}. Mensaje: ${mensaje}`
      : `Lead nuevo desde ${canal}. Mensaje: ${mensaje}`;

    const etapaInicial = (body.etapa || "").trim() || (esMayorista ? "Contactó" : "En conversación");
    await sbPost("crm_pipeline", {
      cliente_rut:  rut,
      etapa:        etapaInicial,
      automatico:   true,
      notas:        notaInicial,
      cambiado_por: "manychat",
    });
  }

  // ── 3. Registrar mensaje del lead ─────────────────────────────────────────
  const tipo    = canal === "whatsapp" ? "whatsapp" : "instagram_dm";
  const nowIso  = new Date().toISOString();

  await sbPost("crm_interacciones", {
    cliente_rut: rut,
    tipo,
    detalle:     mensaje || `Contacto via ${canal}`,
    automatico:  false,
    usuario:     "lead",
    fecha:       nowIso,
    metadata: {
      canal,
      tipo_flujo,
      instagram_username: instagram || null,
      whatsapp_number:    whatsapp  || null,
      mc_id:              mc_id     || null,
      mensaje,
    },
  });

  if (clienteExiste) {
    if (nombre) await sbPatch("crm_clientes", { rut: `eq.${rut}` }, { razon_social: nombre });
    await sbPost("crm_pipeline", {
      cliente_rut:  rut,
      etapa:        (body.etapa || "").trim() || (esMayorista ? "Contactó" : "En conversación"),
      automatico:   true,
      notas:        `Mensaje via ${canal}: ${mensaje}`,
      cambiado_por: "manychat",
    });
  }

  // ── 4. Responder con IA ───────────────────────────────────────────────────
  let respuestaIA = null;
  if (mensaje && mc_id) {
    try {
      const historial = await getHistory(rut);
      const ctx       = nombre ? `Cliente: ${nombre}` : null;
      respuestaIA     = await askClaude(mensaje, historial, ctx);

      if (respuestaIA) {
        await mcSendText(mc_id, respuestaIA);

        await sbPost("crm_interacciones", {
          cliente_rut: rut,
          tipo:        "ai_response",
          detalle:     respuestaIA,
          automatico:  true,
          usuario:     "agente_ia",
          fecha:       new Date().toISOString(),
          metadata:    { mc_id, modelo: "claude-haiku-4-5" },
        });
      }
    } catch (err) {
      console.error("[AI] Error:", err.message);
    }
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ok: true, rut, nuevo: !clienteExiste, ia: !!respuestaIA }),
  };
};
