// 1x1 transparent PNG en base64
const PIXEL = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64"
);

exports.handler = async function(event) {
  const rut = event.queryStringParameters?.cli;

  if (rut) {
    const SUPABASE_URL = (process.env.SUPABASE_URL || "").trim();
    const SUPABASE_SERVICE_KEY = (process.env.SUPABASE_SERVICE_KEY || "").trim();

    console.log(`URL: "${SUPABASE_URL.substring(0, 35)}" | KEY len: ${SUPABASE_SERVICE_KEY.length}`);
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/crm_interacciones_v2`, {
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
      });

      if (!res.ok) {
        const text = await res.text();
        console.error(`track-open INSERT falló: ${res.status} — ${text}`);
      }
    } catch(e) {
      console.error(`track-open fetch error: ${e.message}`);
    }
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
