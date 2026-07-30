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

MODELOS DISPONIBLES (úsalos para confirmar cuando el cliente pregunta por un código):
- Colección 43: 4301-00, 4303-00, 4309-00, 4310-00, 4313-00, 4314-00, 4318-00, 4319-00, 4321-00, 4322-00, 4322-01, 4322-02, 4323-00, 4325-00, 4329-00, 4333-00, 4335-00, 4337-00, 4341-00, 4348-00, 4355-00, 4356-00, 4361-04, 4361-06, 4361-08, 4361-16, 4361-48, 4362-04, 4362-06, 4362-08, 4362-16, 4362-48, 4363-00, 4365-00, 4366-04, 4366-08, 4366-16, 4366-48, 4371-00, 4371-01, 4377-00, 4378-00
- Colección 44: 4402-00, 4412-00, 4413-00, 4414-00, 4416-00, 4417-00, 4426-00, 4431-00, 4431-01, 4431-02, 4441-00, 4450-00, 4454-00, 4454-01, 4458-00, 4459-00, 4478-00, 4480-00, 4481-00
Cuando preguntan por un modelo: si está en la lista, confirma que existe e indica en qué colección está. Si no está, di honestamente que no lo tenés en el catálogo actual. No inventes características, colores ni tallas específicas.

CÓMO SER CLIENTE:
- Minimayorista: compra mínima de 12 unidades — accede a precios preferenciales ($24.990-$27.990 por unidad).
- Mayorista: compra mínima de 24 unidades — mejores precios y atención personalizada de ejecutivo.
- Para aprobar una cuenta nueva: el lead completa el formulario de solicitud que le enviamos.
- Para pedir el formulario o más info: el ejecutivo se contacta directamente.

LO QUE PUEDES HACER:
- Explicar las condiciones para ser mayorista o minimayorista.
- Enviar el link del catálogo cuando pidan ver productos o quieran comprar.
- Informar rango de precios por unidad.
- Explicar el proceso de aprobación de cuenta nueva.
- Mencionar que hay stock disponible para despacho inmediato.

FLUJO CUANDO ALGUIEN QUIERE COMPRAR:
1. Recuérdale el mínimo de compra: minimayorista 12 unidades, mayorista 24 unidades.
2. Envíale el catálogo para que elija sus productos: https://mohicanojeans.netlify.app/
3. Indícale que desde esa misma página puede hacer su pedido directamente.
4. NO digas que "un ejecutivo lo contactará" — el pedido se hace online en el catálogo.

LO QUE NO PUEDES HACER:
- Dar RUT, datos bancarios ni información confidencial.
- Inventar modelos, códigos o precios exactos por modelo.

TONO:
- Vendedor profesional, amigable y directo. Tuteás al cliente.
- Respuestas cortas — no más de 3-4 líneas por mensaje.
- Usas emojis con moderación (1-2 por mensaje máximo).
- NUNCA uses formato markdown: sin asteriscos (**), sin guiones bajos (__), sin almohadillas (#). Solo texto plano.
- Los links van en texto plano, sin asteriscos ni corchetes: https://mohicanojeans.netlify.app/
- NUNCA menciones que estás en WhatsApp, que eres un bot, ni el canal de comunicación — actúa como un ejecutivo real.
- En el primer mensaje SIEMPRE saluda mencionando Mohicano Jeans y pregunta directamente en qué puedes ayudar. Ejemplo: "¡Hola! Soy el asistente de Mohicano Jeans 👖 ¿En qué te puedo ayudar?"
- No uses frases genéricas como "estamos acá por WhatsApp", "puedo ayudarte en lo que necesites" o similares — sé específico y orientado a la venta.`;

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
