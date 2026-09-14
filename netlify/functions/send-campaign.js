exports.handler = async function(event) {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

  /* Candado: solo un administrador con sesion valida del CRM puede mandar correos.
     Sin esto, cualquiera que sepa la URL manda correos desde ventas@mohicanojeans.cl
     y nos quema el dominio en Gmail. Ojo: el codigo de las funciones se lee desde la
     web (el repo es publico), asi que la URL no es ningun secreto. */
  let SUPABASE_URL = process.env.SUPABASE_URL || "https://kdtydxihrflhziclgiof.supabase.co";
  if (SUPABASE_URL.endsWith("/")) SUPABASE_URL = SUPABASE_URL.slice(0, -1);
  const SERVICE_KEY = (process.env.SUPABASE_SERVICE_KEY || "").trim();
  const h = event.headers || {};
  const cabAuth = String(h.authorization || h.Authorization || "").trim();
  const token = cabAuth.toLowerCase().startsWith("bearer ") ? cabAuth.slice(7).trim() : cabAuth;

  if (!token) return { statusCode: 401, body: JSON.stringify({ error: "Falta la sesion de administrador. Entra al CRM de nuevo." }) };
  if (!SERVICE_KEY) return { statusCode: 500, body: JSON.stringify({ error: "Falta SUPABASE_SERVICE_KEY en Netlify." }) };
  try {
    const ver = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${token}` } });
    if (!ver.ok) {
      console.warn("send-campaign: sesion rechazada, HTTP", ver.status);
      return { statusCode: 401, body: JSON.stringify({ error: "Sesion invalida o vencida. Vuelve a entrar al CRM." }) };
    }
    const usuario = await ver.json();
    console.log("send-campaign: autorizado por", usuario.email || usuario.id);
  } catch (e) {
    console.error("send-campaign: no pude validar la sesion:", e.message);
    return { statusCode: 502, body: JSON.stringify({ error: "No pude validar la sesion. Intenta de nuevo." }) };
  }

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
