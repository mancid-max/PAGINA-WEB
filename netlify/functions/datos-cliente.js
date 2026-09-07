/* datos-cliente — reconoce a un cliente por RUT (para Sofía / Nexor).
   GET /.netlify/functions/datos-cliente?rut=16.388.334-1
   → { ok, valido, existe, rut, razon_social, telefono, giro, direccion, nombre_tienda, comuna, transporte, mensaje }
   Fuente: Supabase RPC lookup_client_by_rut (misma que usa la web). No expone nada más. */
const SUPABASE_URL = (process.env.SUPABASE_URL || "https://kdtydxihrflhziclgiof.supabase.co").replace(/\/$/, "");
const ANON_KEY = (process.env.SUPABASE_ANON_KEY || "sb_publishable_37ce4uK_RG8o9pP-Jdf2Xw_3eWgqJQy").trim();

function normalizarRut(raw) {
  const clean = String(raw || "").replace(/[^0-9kK]/g, "").toUpperCase();
  if (clean.length < 2) return "";
  return clean.slice(0, -1) + "-" + clean.slice(-1);
}
function rutValido(norm) {
  const m = /^(\d{7,8})-([0-9K])$/.exec(norm);
  if (!m) return false;
  let suma = 0, mul = 2;
  for (const d of m[1].split("").reverse()) { suma += Number(d) * mul; mul = mul === 7 ? 2 : mul + 1; }
  const res = 11 - (suma % 11);
  const dv = res === 11 ? "0" : res === 10 ? "K" : String(res);
  return dv === m[2];
}
const formatRut = (norm) => { const [n, dv] = norm.split("-"); return n.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "-" + dv; };

exports.handler = async (event) => {
  const headers = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" };
  const qs = event.queryStringParameters || {};
  let body = {};
  if (event.httpMethod === "POST" && event.body) { try { body = JSON.parse(event.body); } catch (_) {} }
  const raw = qs.rut || body.rut || "";
  const norm = normalizarRut(raw);
  if (!norm) return { statusCode: 200, headers, body: JSON.stringify({ ok: false, valido: false, mensaje: "Falta el RUT." }) };
  if (!rutValido(norm)) return { statusCode: 200, headers, body: JSON.stringify({ ok: false, valido: false, rut: raw, mensaje: `El RUT "${raw}" no es válido (dígito verificador). Pide al cliente que lo repita, ej. 12.345.678-9.` }) };

  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/lookup_client_by_rut`, {
      method: "POST",
      headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ p_rut: norm }),
    });
    const data = r.ok ? await r.json().catch(() => null) : null;
    const row = Array.isArray(data) ? data[0] : data;
    if (row && row.razon_social) {
      return { statusCode: 200, headers, body: JSON.stringify({
        ok: true, valido: true, existe: true, rut: formatRut(norm), razon_social: row.razon_social,
        telefono: row.telefono || null, giro: row.giro || null, direccion: row.direccion || null,
        nombre_tienda: row.nombre_tienda || null, comuna: row.comuna || null, transporte: row.transporte || null,
        mensaje: `Cliente registrado: ${row.razon_social}. Puedes saludarlo por su nombre; solo falta confirmar los datos que estén en null (teléfono, transporte).`,
      }) };
    }
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, valido: true, existe: false, rut: formatRut(norm),
      mensaje: "RUT válido pero es cliente nuevo: pide razón social (nombre de la tienda o persona), teléfono y transporte." }) };
  } catch (e) {
    return { statusCode: 200, headers, body: JSON.stringify({ ok: false, valido: true, rut: formatRut(norm), mensaje: "No pude consultar la base de clientes ahora; continúa pidiendo los datos al cliente." }) };
  }
};
