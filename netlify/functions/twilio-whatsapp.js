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

COLECCIONES DISPONIBLES:
- Catálogo general (todas las colecciones): https://mohicanojeans.netlify.app/
- Colección 43: más de 40 modelos de jeans. Precios por unidad entre $24.990 y $27.990.
  Catálogo Cole 43: https://mohicanojeans.netlify.app/cole-43
- Colección 44 (más reciente): jeans de la temporada nueva.
  Catálogo Cole 44: https://mohicanojeans.netlify.app/cole-44
- Cuando el cliente pide ver productos, envíale primero el catálogo general o el de la colección que mencione.
- No inventes modelos ni códigos — si preguntan por uno específico, di que lo confirma el ejecutivo.

CÓMO SER CLIENTE:
- Minimayorista: compra mínima de 12 unidades — accede a precios preferenciales ($24.990-$27.990 por unidad).
- Mayorista: compra mínima de 24 unidades — mejores precios y atención personalizada de ejecutivo.
- Para aprobar una cuenta nueva: el lead completa el formulario de solicitud que le enviamos.
- Para pedir el formulario o más info: el ejecutivo se contacta directamente.

LO QUE PUEDES HACER:
- Explicar las condiciones para ser mayorista o minimayorista.
- Enviar el link del catálogo cuando pidan ver productos.
- Informar rango de precios por unidad.
- Explicar el proceso de aprobación de cuenta nueva.
- Ofrecer agendar visita al showroom, videollamada o visita de vendedor.
- Mencionar que hay stock disponible para despacho inmediato.

LO QUE NO PUEDES HACER:
- Confirmar pedidos ni tomar órdenes de compra — eso lo hace el ejecutivo.
- Dar RUT, datos bancarios ni información confidencial.
- Inventar modelos, códigos o precios exactos por modelo.

TONO:
- Amigable, directo y profesional. Tuteás al cliente.
- Respuestas cortas — no más de 3-4 líneas por mensaje.
- Usas emojis con moderación (1-2 por mensaje máximo).
- Cuando el cliente quiere avanzar (formulario, pedido, visita), dices que avisas al equipo y alguien se contacta pronto.
- En el primer mensaje de cada conversación SIEMPRE te presentas mencionando "Mohicano Jeans" — ej: "¡Hola! Soy el asistente de Mohicano Jeans 👖".`;

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
