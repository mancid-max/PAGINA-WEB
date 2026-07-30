// netlify/functions/twilio-whatsapp.js
// Recibe mensajes de WhatsApp via Twilio Sandbox y responde con Claude IA

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const SUPABASE_URL      = process.env.SUPABASE_URL        || "https://kdtydxihrflhziclgiof.supabase.co";
const SUPABASE_KEY      = process.env.SUPABASE_CRM_KEY    || process.env.SUPABASE_SERVICE_KEY;

const SB_HEADERS = {
  "apikey":        SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
  "Content-Type":  "application/json",
  "Prefer":        "resolution=merge-duplicates,return=minimal",
};

const SYSTEM_PROMPT = `Eres el asistente virtual de Mohicano Jeans, una empresa chilena de moda denim con sede en Santiago. \
Atiendes por WhatsApp a personas interesadas en comprar al por mayor (mayoristas y minimayoristas).

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
- Si no sabes algo específico, ofreces conectar con un ejecutivo.`;

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseFormBody(body) {
  const params = {};
  if (!body) return params;
  body.split("&").forEach(pair => {
    const [k, v] = pair.split("=");
    if (k) params[decodeURIComponent(k)] = decodeURIComponent((v || "").replace(/\+/g, " "));
  });
  return params;
}

async function sbPost(table, data) {
  if (!SUPABASE_KEY) return false;
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method:  "POST",
    headers: SB_HEADERS,
    body:    JSON.stringify(data),
  });
  return r.ok;
}

async function sbGet(table, params) {
  if (!SUPABASE_KEY) return [];
  const qs = new URLSearchParams({ select: "*", ...params }).toString();
  const r  = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${qs}`, {
    headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` },
  });
  return r.ok ? r.json() : [];
}

async function getHistory(telefono, limit = 6) {
  const ints = await sbGet("crm_interacciones", {
    "order": "fecha.desc",
    "limit": String(limit),
  });
  // Filter by phone via cliente lookup would be ideal; for demo use all recent
  const mensajes = [];
  for (const inter of [...ints].reverse()) {
    if (!["whatsapp", "ai_response"].includes(inter.tipo)) continue;
    const rol   = inter.tipo === "ai_response" ? "assistant" : "user";
    const texto = inter.detalle || "";
    if (texto) mensajes.push({ role: rol, content: texto });
  }
  return mensajes;
}

async function askClaude(mensaje, historial, contexto) {
  let system = SYSTEM_PROMPT;
  if (contexto) system += `\n\nCONTEXTO: ${contexto}`;

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
    console.error("[AI] Error:", resp.status, await resp.text());
    return null;
  }
  const data = await resp.json();
  return data.content?.[0]?.text?.trim() || null;
}

function twimlResponse(texto) {
  const safe = texto.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Message><Body>${safe}</Body></Message></Response>`;
}

// ── Handler ───────────────────────────────────────────────────────────────────

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const params  = parseFormBody(event.body);
  const mensaje = (params.Body || "").trim();
  const from    = (params.From || "").replace("whatsapp:", "");
  const nombre  = (params.ProfileName || "").trim() || "Lead";

  console.log("[twilio-wa] from:", from, "msg:", mensaje);

  if (!mensaje) {
    return { statusCode: 200, headers: { "Content-Type": "text/xml" }, body: "<Response></Response>" };
  }

  // Buscar o crear lead en Supabase
  let rut = null;
  const existentes = await sbGet("crm_clientes", { telefono: `eq.${from}` });
  if (existentes.length) {
    rut = existentes[0].rut;
  } else {
    const ts = Date.now();
    rut = `LEAD-WA-TWILIO-${ts}`;
    await sbPost("crm_clientes", {
      rut,
      rut_normalizado: rut,
      razon_social:    nombre,
      telefono:        from,
      tipo_cliente:    "Lead_WA",
      activo_desde:    new Date().getFullYear(),
      canal:           "whatsapp",
    });
    await sbPost("crm_pipeline", {
      cliente_rut:  rut,
      etapa:        "En conversación",
      automatico:   true,
      notas:        `Lead nuevo vía Twilio WhatsApp. Mensaje: ${mensaje}`,
      cambiado_por: "twilio",
    });
  }

  // Guardar mensaje del lead
  const nowIso = new Date().toISOString();
  await sbPost("crm_interacciones", {
    cliente_rut: rut,
    tipo:        "whatsapp",
    detalle:     mensaje,
    automatico:  false,
    usuario:     "lead",
    fecha:       nowIso,
    metadata:    { canal: "whatsapp", whatsapp_number: from, fuente: "twilio" },
  });

  // Llamar a Claude
  const historial  = await getHistory(from);
  const respuestaIA = await askClaude(mensaje, historial, `Cliente: ${nombre}, Tel: ${from}`);

  if (!respuestaIA) {
    return {
      statusCode: 200,
      headers: { "Content-Type": "text/xml" },
      body: twimlResponse("Hola, soy el asistente de Mohicano Jeans 👋 ¿En qué te puedo ayudar?"),
    };
  }

  // Guardar respuesta IA
  await sbPost("crm_interacciones", {
    cliente_rut: rut,
    tipo:        "ai_response",
    detalle:     respuestaIA,
    automatico:  true,
    usuario:     "agente_ia",
    fecha:       new Date().toISOString(),
    metadata:    { modelo: "claude-haiku-4-5", fuente: "twilio" },
  });

  return {
    statusCode: 200,
    headers: { "Content-Type": "text/xml" },
    body: twimlResponse(respuestaIA),
  };
};
