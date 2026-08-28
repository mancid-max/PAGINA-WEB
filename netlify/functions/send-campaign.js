exports.handler = async function(event) {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

  let body;
  try { body = JSON.parse(event.body); } catch { return { statusCode: 400, body: "Bad JSON" }; }

  const { clientes, asunto, html } = body;
  if (!clientes?.length || !asunto || !html) {
    return { statusCode: 400, body: "Faltan clientes, asunto o html" };
  }

  const RESEND_KEY = process.env.RESEND_API_KEY;
  const FROM = "Venta Mohicano <ventas@mohicanojeans.cl>";

  const resultados = [];
  for (const c of clientes) {
    if (!c.email || c.email.length < 5) continue;

    const rutNorm = (c.rut || "").replace(/[^0-9K]/gi, "").toUpperCase();
    const catalogUrl = `https://mohicanojeans.netlify.app/catalogo-44/?cli=${rutNorm}`;
    const trackingPixel = `<img src="https://mohicanojeans.netlify.app/.netlify/functions/track-open?cli=${rutNorm}" width="1" height="1" style="border:0" alt="">`;
    const htmlPersonalizado = (html
      .replace(/\{\{nombre\}\}/g, c.nombre || "cliente")
      .replace(/\{\{link\}\}/g, catalogUrl))
      + trackingPixel;

    // DIAG: loguear snippet del href para verificar que {{link}} fue reemplazado
    const hrefMatch = htmlPersonalizado.match(/href="([^"]{0,120})"/);
    console.log(`[DIAG] ${c.email} | URL catalogo: ${catalogUrl} | primer href: ${hrefMatch ? hrefMatch[1] : "no encontrado"}`);

    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: FROM,
          to: [c.email],
          subject: asunto,
          html: htmlPersonalizado,
          tags: [{ name: "rut", value: rutNorm }],
        }),
      });
      const data = await res.json();
      console.log(`[DIAG] Resend response: ok=${res.ok} id=${data.id} err=${JSON.stringify(data.name||data.message||"")}`);
      resultados.push({ rut: c.rut, email: c.email, ok: res.ok, id: data.id, diagUrl: catalogUrl });
    } catch(e) {
      console.error(`[DIAG] fetch error: ${e.message}`);
      resultados.push({ rut: c.rut, email: c.email, ok: false, error: e.message });
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ enviados: resultados.filter(r => r.ok).length, resultados }),
  };
};
