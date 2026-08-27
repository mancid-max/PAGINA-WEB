exports.handler = async function(event) {
  const rut = event.queryStringParameters?.cli;
  const dest = `https://mohicanojeans.netlify.app/catalogo-44/${rut ? "?cli=" + rut : ""}`;

  if (rut) {
    const SUPABASE_URL = (process.env.SUPABASE_URL || "").trim();
    const SUPABASE_SERVICE_KEY = (process.env.SUPABASE_SERVICE_KEY || "").trim();
    try {
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
          descripcion: "Entro al catalogo desde link de email",
        }),
      });
    } catch(e) {
      console.error(`track-visit error: ${e.message}`);
    }
  }

  return {
    statusCode: 302,
    headers: { Location: dest },
    body: "",
  };
};
