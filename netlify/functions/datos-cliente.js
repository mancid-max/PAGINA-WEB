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

/* Últimos pedidos del cliente (los que hizo por la web). Se leen con la clave de servidor; si no está
   configurada o falla, simplemente no se devuelven. */
async function ultimosPedidos(digitos) {
  const URL = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
  const KEY = (process.env.SUPABASE_SERVICE_KEY || "").trim();
  if (!URL || !KEY || !digitos) return null;
  try {
    const h = { apikey: KEY, Authorization: `Bearer ${KEY}` };
    const norm = `${digitos.slice(0, -1)}-${digitos.slice(-1)}`;
    const filtro = encodeURIComponent(`(client_rut_normalized.eq.${digitos},client_rut_normalized.eq.${norm})`);
    const qs = await fetch(`${URL}/rest/v1/quotes?or=${filtro}&select=id,created_at,source,total_items,transporte&order=created_at.desc&limit=5`, { headers: h }).then((r) => (r.ok ? r.json() : []));
    if (!qs.length) return null;
    const ids = qs.map((q) => q.id);
    const items = await fetch(`${URL}/rest/v1/quote_items?quote_id=in.(${ids.join(",")})&select=quote_id,sku,quantity&limit=999`, { headers: h }).then((r) => (r.ok ? r.json() : []));
    const porPedido = {};
    for (const it of items) {
      const m = (porPedido[it.quote_id] = porPedido[it.quote_id] || {});
      const sku = String(it.sku || "").toUpperCase();
      m[sku] = (m[sku] || 0) + (Number(it.quantity) || 0);
    }
    const fecha = (t) => { try { return new Date(t).toLocaleDateString("es-CL", { timeZone: "America/Santiago", day: "2-digit", month: "2-digit", year: "numeric" }); } catch (_) { return ""; } };
    return qs.map((q) => ({
      fecha: fecha(q.created_at),
      coleccion: String(q.source || "").includes("44") ? "Dolce Vita 44" : "Cole 40-43",
      unidades: Number(q.total_items) || 0,
      transporte: q.transporte || null,
      modelos: Object.entries(porPedido[q.id] || {}).sort((a, b) => b[1] - a[1]).map(([sku, n]) => `${sku} (${n})`),
    }));
  } catch (_) { return null; }
}

exports.handler = async (event) => {
  const headers = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" };
  const qs = event.queryStringParameters || {};
  let body = {};
  if (event.httpMethod === "POST" && event.body) { try { body = JSON.parse(event.body); } catch (_) {} }
  const raw = qs.rut || body.rut || "";
  const norm = normalizarRut(raw);
  if (!norm) return { statusCode: 200, headers, body: JSON.stringify({ ok: false, valido: false, mensaje: "Falta el RUT." }) };
  if (!rutValido(norm)) return { statusCode: 200, headers, body: JSON.stringify({ ok: false, valido: false, rut: raw, mensaje: `El RUT "${raw}" no es válido (dígito verificador). Pídeselo una vez más (ej. 12.345.678-9); si no sale, sigue con el pedido y arma el link sin rut.` }) };

  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/lookup_client_by_rut`, {
      method: "POST",
      headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ p_rut: norm }),
    });
    const data = r.ok ? await r.json().catch(() => null) : null;
    const row = Array.isArray(data) ? data[0] : data;
    if (row && row.razon_social) {
      const pedidos = await ultimosPedidos(String(norm).replace(/[^0-9kK]/g, "").toUpperCase());
      return { statusCode: 200, headers, body: JSON.stringify({
        ok: true, valido: true, existe: true, rut: formatRut(norm), razon_social: row.razon_social,
        ...(pedidos ? { pedidos_anteriores: pedidos, ultimo_pedido: `${pedidos[0].fecha}: ${pedidos[0].unidades} unidades · ${pedidos[0].modelos.slice(0, 4).join(", ")}` } : {}),
        telefono: row.telefono || null, giro: row.giro || null, direccion: row.direccion || null,
        nombre_tienda: row.nombre_tienda || null, comuna: row.comuna || null, transporte: row.transporte || null,
        mensaje: `Cliente registrado: ${row.razon_social}. Salúdalo por su nombre y sigue con el pedido: los datos que vengan en null NO bloquean el link, se piden después o los completa en la página.`,
      }) };
    }
    const pedidosSinFicha = await ultimosPedidos(String(norm).replace(/[^0-9kK]/g, "").toUpperCase());
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, valido: true, existe: false, rut: formatRut(norm),
      ...(pedidosSinFicha ? { pedidos_anteriores: pedidosSinFicha, ultimo_pedido: `${pedidosSinFicha[0].fecha}: ${pedidosSinFicha[0].unidades} unidades · ${pedidosSinFicha[0].modelos.slice(0, 4).join(", ")}` } : {}),
      mensaje: "RUT válido. No lo tenemos en la base de la web, pero eso no significa que sea cliente nuevo (la base no tiene a todos): NO le digas \"primera compra\" ni \"no estás registrado\". Arma el link igual; los datos de la tienda se los pide la página." }) };
  } catch (e) {
    return { statusCode: 200, headers, body: JSON.stringify({ ok: false, valido: true, rut: formatRut(norm), mensaje: "No pude consultar la base de clientes ahora; sigue con el pedido igual y arma el link; no digas que no está registrado. Datos al cliente." }) };
  }
};
