// netlify/functions/crm-stage.js
// Actualiza etapa del pipeline CRM desde ManyChat (cuando agente toma la conversación)

const SUPABASE_URL = process.env.SUPABASE_URL || "https://kdtydxihrflhziclgiof.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_CRM_KEY || process.env.SUPABASE_SERVICE_KEY;
const CRM_SECRET   = process.env.CRM_SECRET       || "mohicano-crm-2026";

const ETAPAS_VALIDAS = [
  "Nuevo mensaje",
  "Link individual enviado",
  "Link mayorista enviado",
  "Quiere hablar",
  "Sin respuesta",
  "En conversación",
  "Aprobado",
  "No aprobado",
];

async function sbPost(table, data) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method:  "POST",
    headers: {
      "apikey":        SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type":  "application/json",
      "Prefer":        "return=minimal",
    },
    body: JSON.stringify(data),
  });
  if (!r.ok) console.error(`[crm-stage] ${table} → ${r.status}: ${await r.text()}`);
  return r.ok;
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, body: "Invalid JSON" };
  }

  if (body.secret !== CRM_SECRET) {
    return { statusCode: 401, body: "Unauthorized" };
  }

  const rut   = (body.rut   || "").trim();
  const etapa = (body.etapa || "En conversación").trim();
  const canal = (body.canal || "").trim();
  const notas = (body.notas || "").trim();

  console.log("[crm-stage] rut:", rut, "etapa:", etapa);

  if (!rut) {
    return { statusCode: 400, body: "Falta rut" };
  }
  if (!ETAPAS_VALIDAS.includes(etapa)) {
    return { statusCode: 400, body: `Etapa inválida: ${etapa}` };
  }

  const ok = await sbPost("crm_pipeline", {
    cliente_rut:  rut,
    etapa,
    automatico:   true,
    notas:        notas || `Agente tomó la conversación via ${canal || "manychat"}`,
    cambiado_por: "manychat",
  });

  if (ok) {
    await sbPost("crm_interacciones", {
      cliente_rut: rut,
      tipo:        canal === "whatsapp" ? "whatsapp" : "instagram_dm",
      detalle:     notas || `Etapa cambiada a: ${etapa}`,
      automatico:  true,
      usuario:     "manychat",
    });
  }

  return {
    statusCode: ok ? 200 : 500,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ok, rut, etapa }),
  };
};
