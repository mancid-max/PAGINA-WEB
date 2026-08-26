exports.handler = async function(event) {
  const rut = event.queryStringParameters?.cli;
  if (!rut) return { statusCode: 400, body: "sin rut" };

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
      tipo: "link_visitado",
      descripcion: "Entró al catálogo desde link de email",
    }),
  }).catch(() => {});

  return {
    statusCode: 302,
    headers: { Location: `https://mohicanojeans.netlify.app/catalogo-44/?cli=${rut}` },
    body: "",
  };
};
