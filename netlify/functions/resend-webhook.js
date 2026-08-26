exports.handler = async function(event) {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

  let payload;
  try { payload = JSON.parse(event.body); } catch { return { statusCode: 400, body: "Bad JSON" }; }

  const tipo = payload.type; // "email.opened", "email.clicked", etc.
  const tags = payload.data?.tags || [];
  const rutTag = tags.find(t => t.name === "rut");
  const rut = rutTag?.value;

  if (!rut) return { statusCode: 200, body: "sin rut" };

  let tipoInteraccion = null;
  if (tipo === "email.opened")  tipoInteraccion = "email_abierto";
  if (tipo === "email.clicked") tipoInteraccion = "link_visitado";
  if (!tipoInteraccion) return { statusCode: 200, body: "evento ignorado" };

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

  await fetch(`${SUPABASE_URL}/rest/v1/crm_interacciones_v2`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      client_rut: rut,
      tipo: tipoInteraccion,
      descripcion: `Detectado por Resend (${tipo})`,
    }),
  });

  return { statusCode: 200, body: JSON.stringify({ ok: true, rut, tipoInteraccion }) };
};
