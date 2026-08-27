// 1x1 transparent PNG en base64
const PIXEL = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64"
);

exports.handler = async function(event) {
  const rut = event.queryStringParameters?.cli;

  if (rut) {
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
        tipo: "email_abierto",
        descripcion: "Abrió el email (pixel de tracking)",
      }),
    }).catch(() => {});
  }

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
    body: PIXEL.toString("base64"),
    isBase64Encoded: true,
  };
};
