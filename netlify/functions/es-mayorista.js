/* ¿Este teléfono es un mayorista nuestro?

   Lo usa el filtro de desconocidos de Sofía: cuando entra un WhatsApp de un número que no tiene marca,
   antes de frenarlo pregunta acá. Si el número está en la ficha de clientes (cargada desde el ERP),
   el filtro lo deja pasar y Sofía le responde al tiro, sin pedir autorización por Telegram.

   GET /.netlify/functions/es-mayorista?phone=56990017184
   Header: X-Api-Key: <NEXOR_ORDER_KEY>
   → { ok, mayorista, razon_social, rut, comuna, transporte }

   El match es por los últimos 8 dígitos: el ERP guarda los teléfonos de muchas formas
   (990017184, 56990017184, +56 9 9001 7184) y así calzan todas.
   Nunca devuelve la lista completa: solo responde por un número a la vez. */
const SUPABASE_URL = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const SERVICE_KEY = (process.env.SUPABASE_SERVICE_KEY || "").trim();
const ORDER_KEY = (process.env.NEXOR_ORDER_KEY || "").trim();

const json = (code, body) => ({
  statusCode: code,
  headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  body: JSON.stringify(body),
});

exports.handler = async (event) => {
  const clave = String(event.headers["x-api-key"] || event.headers["X-Api-Key"] || "").trim();
  if (!ORDER_KEY || clave !== ORDER_KEY) return json(401, { ok: false, mensaje: "No autorizado" });
  if (!SUPABASE_URL || !SERVICE_KEY) return json(500, { ok: false, mensaje: "Base no configurada" });

  const crudo = String((event.queryStringParameters || {}).phone || "").replace(/\D/g, "");
  const cola = crudo.slice(-8);
  if (cola.length < 8) return json(200, { ok: true, mayorista: false, mensaje: "Teléfono incompleto" });

  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/clients?telefono=like.*${cola}&select=rut,razon_social,comuna,transporte,telefono&limit=2`,
      { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } }
    );
    if (!r.ok) return json(200, { ok: true, mayorista: false, mensaje: "No se pudo consultar" });
    const filas = await r.json();
    const fila = (filas || []).find((f) => String(f.telefono || "").replace(/\D/g, "").endsWith(cola));
    if (!fila) return json(200, { ok: true, mayorista: false });
    return json(200, {
      ok: true,
      mayorista: true,
      rut: fila.rut || null,
      razon_social: fila.razon_social || null,
      comuna: fila.comuna || null,
      transporte: fila.transporte || null,
    });
  } catch (e) {
    /* Ante cualquier falla se responde "no sé": el filtro sigue con su camino normal (pedir autorización),
       nunca al revés. Un error acá no puede abrirle la puerta a un desconocido. */
    return json(200, { ok: true, mayorista: false, mensaje: "Error consultando" });
  }
};
