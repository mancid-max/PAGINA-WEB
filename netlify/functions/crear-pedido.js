/* crear-pedido — registra un pedido mayorista desde WhatsApp (Sofía / Nexor) igual que la web.
   POST /.netlify/functions/crear-pedido   (header X-Api-Key = process.env.NEXOR_ORDER_KEY)
   {
     "rut": "16.388.334-1", "razon_social": "…", "telefono": "9…", "giro": "…", "direccion": "…",
     "nombre_tienda": "…", "comuna": "…", "transporte": "Starken", "nota": "…",
     "items": [ { "codigo": "4448-00", "curva": "12" }, { "codigo": "4301-00", "curva": "36=2.38=3" } ],
     "dry_run": true   // opcional: valida y resume sin guardar
   }
   Cole 44 → quotes + quote_items (source dolce-vita-44) · Cole 40-43 → RPC create_quote_with_stock_reservation
   (source catalogo-43). Si hay de ambas, se crean dos pedidos. Avisa por Telegram (notify-order). */
const BASE = (process.env.URL || "https://mohicanojeans.netlify.app").replace(/\/$/, "");
const SUPABASE_URL = (process.env.SUPABASE_URL || "https://kdtydxihrflhziclgiof.supabase.co").replace(/\/$/, "");
const SERVICE_KEY = (process.env.SUPABASE_SERVICE_KEY || "").trim();
const ANON_KEY = (process.env.SUPABASE_ANON_KEY || "sb_publishable_37ce4uK_RG8o9pP-Jdf2Xw_3eWgqJQy").trim();
const ORDER_KEY = (process.env.NEXOR_ORDER_KEY || "").trim();
const MIN_44 = 12;          /* Cole 44: mínimo por modelo */
const MIN_TOTAL_4043 = 24;  /* Cole 40-43: sin mínimo por modelo, pero el pedido completo suma al menos 24 u. (igual que la web) */
const CV12 = { "36": 2, "38": 2, "40": 2, "42": 2, "44": 2, "46": 2 };
const CV17 = { "36": 2, "38": 3, "40": 4, "42": 4, "44": 3, "46": 1 };
const CV12_CHAQ = { S: 3, M: 3, L: 3, XL: 3 };
const CV17_CHAQ = { S: 4, M: 5, L: 5, XL: 3 };

const json = (obj, status = 200) => ({ statusCode: status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }, body: JSON.stringify(obj) });

async function getRemote(path) {
  const r = await fetch(`${BASE}${path}`, { headers: { "Cache-Control": "no-cache" } });
  if (!r.ok) throw new Error(`HTTP ${r.status} en ${path}`);
  return path.endsWith(".js") ? r.text() : r.json();
}
async function modelos44() {
  const src = await getRemote("/catalogo-44/app.js");
  const map = {};
  const re = /\{nombre:"([^"]+)",\s*codigo:"([^"]+)",\s*precio:(null|\d+),[^}]*?tipo:"([^"]+)",\s*sec:"([^"]+)"\}/g;
  let m;
  while ((m = re.exec(src))) map[m[2]] = { nombre: m[1], precio: m[3] === "null" ? null : Number(m[3]), tipo: m[4] };
  return map;
}
function normCod(raw) {
  const s = String(raw || "").toUpperCase().replace(/[^0-9]/g, "");
  if (s.length === 4) return `${s}-00`;
  if (s.length === 6) return `${s.slice(0, 4)}-${s.slice(4)}`;
  const t = String(raw || "").toUpperCase().trim();
  return /^\d{4}-\d{2}$/.test(t) ? t : "";
}
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
function formatRut(norm) {
  const [num, dv] = norm.split("-");
  return num.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "-" + dv;
}
/* Curva proporcional para N unidades (campana 1-2-3-3-2-1 en jeans; 3-4-4-3 en chaquetas) */
function curvaProporcional(n, chaq) {
  const tallas = chaq ? ["S", "M", "L", "XL"] : ["36", "38", "40", "42", "44", "46"];
  const pesos = chaq ? [3, 4, 4, 3] : [1, 2, 3, 3, 2, 1];
  const sum = pesos.reduce((a, b) => a + b, 0);
  const exact = pesos.map((p) => (n * p) / sum);
  const base = exact.map(Math.floor);
  let resto = n - base.reduce((a, b) => a + b, 0);
  exact.map((v, i) => [v - Math.floor(v), i]).sort((a, b) => b[0] - a[0] || a[1] - b[1]).forEach(([, i]) => { if (resto > 0) { base[i]++; resto--; } });
  const cv = {}; tallas.forEach((t, i) => { if (base[i] > 0) cv[t] = base[i]; }); return cv;
}
function curvaDesde(spec, tipo) {
  const s = String(spec == null ? "12" : spec).trim();
  const chaq = tipo === "chaqueta";
  if (s === "12" || s === "") return { ...(chaq ? CV12_CHAQ : CV12) };
  if (s === "17") return { ...(chaq ? CV17_CHAQ : CV17) };
  if (/^\d+$/.test(s)) return curvaProporcional(Number(s), chaq); /* "20" → curva sugerida de 20 */
  if (typeof spec === "object" && spec) {
    const cv = {}; for (const [t, n] of Object.entries(spec)) if (Number(n) > 0) cv[String(t).toUpperCase()] = Number(n); return cv;
  }
  const cv = {};
  s.split(/[.,;\s]+/).forEach((par) => { const [t, n] = par.split(/[=:x]/); if (t && Number(n) > 0) cv[t.trim().toUpperCase()] = Number(n); });
  return cv;
}
async function sb(path, opts = {}) {
  const key = SERVICE_KEY || ANON_KEY;
  const r = await fetch(`${SUPABASE_URL}${path}`, {
    ...opts,
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...(opts.headers || {}) },
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`${path} → ${r.status}: ${text}`);
  try { return text ? JSON.parse(text) : null; } catch (_) { return text; }
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json({ ok: false, mensaje: "Usar POST con JSON." }, 405);
  const apiKey = event.headers["x-api-key"] || event.headers["X-Api-Key"] || "";
  if (!ORDER_KEY || apiKey !== ORDER_KEY) return json({ ok: false, mensaje: "No autorizado." }, 401);

  let body;
  try { body = JSON.parse(event.body || "{}"); } catch (_) { return json({ ok: false, mensaje: "JSON inválido." }, 400); }
  const dryRun = body.dry_run === true || body.dry_run === "true";

  /* --- cliente --- */
  const rutNorm = normalizarRut(body.rut);
  if (!rutValido(rutNorm)) return json({ ok: false, mensaje: `RUT inválido: "${body.rut || ""}". Pide al cliente el RUT con dígito verificador (ej. 12.345.678-9).` });
  const rutFmt = formatRut(rutNorm);
  let razon = String(body.razon_social || "").trim();
  let existente = null;
  try {
    const rows = await sb("/rest/v1/rpc/lookup_client_by_rut", { method: "POST", body: JSON.stringify({ p_rut: rutNorm }) });
    existente = Array.isArray(rows) ? rows[0] : rows;
  } catch (_) {}
  if (existente && existente.razon_social) razon = razon || existente.razon_social;
  if (!razon) return json({ ok: false, mensaje: "Cliente nuevo: necesito la razón social (nombre de la empresa o persona) para registrar el pedido." });
  const telefono = String(body.telefono || (existente && existente.telefono) || "").trim();
  if (!telefono) return json({ ok: false, mensaje: "Necesito un teléfono de contacto del cliente." });
  const cliente = {
    rut: rutFmt, rut_normalized: rutNorm.replace("-", ""), razon_social: razon, client_phone: telefono,
    giro: String(body.giro || (existente && existente.giro) || "").trim() || null,
    direccion: String(body.direccion || (existente && existente.direccion) || "").trim() || null,
    nombre_tienda: String(body.nombre_tienda || (existente && existente.nombre_tienda) || "").trim() || null,
    comuna: String(body.comuna || (existente && existente.comuna) || "").trim() || null,
    transporte: String(body.transporte || (existente && existente.transporte) || "").trim() || null,
    nota: String(body.nota || "").trim() || null,
  };

  /* --- items --- */
  const itemsIn = Array.isArray(body.items) ? body.items : [];
  if (!itemsIn.length) return json({ ok: false, mensaje: "Indica al menos un modelo (codigo + curva)." });
  const m44 = await modelos44();
  const [stock43, stock44] = await Promise.all([getRemote("/stock-data-catalogo-43.json"), getRemote("/stock-data-catalogo-44.json")]);
  const lineas44 = [], lineas43 = [], resumen = [], errores = [];
  for (const it of itemsIn) {
    const cod = normCod(it.codigo || it.sku || it.modelo);
    if (!cod) { errores.push(`Código inválido: ${it.codigo || it.sku || ""}`); continue; }
    const cole = cod.slice(0, 2);
    if (cole === "44") {
      const m = m44[cod];
      if (!m) { errores.push(`${cod} no está en el catálogo Cole 44`); continue; }
      const cv = curvaDesde(it.curva ?? it.tallas, m.tipo);
      const tot = Object.values(cv).reduce((a, b) => a + b, 0);
      if (tot < MIN_44) { errores.push(`${cod} ${m.nombre}: ${tot} u. — el mínimo es ${MIN_44} por modelo`); continue; }
      const disp = ((stock44.items || {})[cod] || {}).total > 30;
      for (const [t, n] of Object.entries(cv)) lineas44.push({ sku: cod, talla: t, cantidad: n });
      resumen.push({ codigo: cod, nombre: m.nombre, coleccion: "Cole 44", unidades: tot, tallas: cv, precio_unitario: m.precio, estado: disp ? "Disponible" : "En producción (reserva)" });
    } else if (/^4[0-3]$/.test(cole)) {
      const st = (stock43.items || {})[cod];
      if (!st || !(st.total > 0)) { errores.push(`${cod}: sin stock en Cole ${cole}`); continue; }
      const cv = curvaDesde(it.curva ?? it.tallas, "jeans");
      const ajust = {}; const faltas = [];
      for (const [t, n] of Object.entries(cv)) {
        const disp = Number((st.sizes || {})[t]) || 0;
        if (disp <= 0) { faltas.push(`${t}: sin stock`); continue; }
        ajust[t] = Math.min(n, disp);
        if (n > disp) faltas.push(`${t}: solo ${disp}`);
      }
      const tot = Object.values(ajust).reduce((a, b) => a + b, 0);
      if (!tot) { errores.push(`${cod}: sin stock en las tallas pedidas`); continue; }
      for (const [t, n] of Object.entries(ajust)) lineas43.push({ sku: cod, talla: t, cantidad: n, source: "catalogo-43" });
      resumen.push({ codigo: cod, coleccion: `Cole ${cole}`, unidades: tot, tallas: ajust, ajustes: faltas.length ? faltas : undefined });
    } else {
      errores.push(`${cod}: colección no vigente`);
    }
  }
  if (!lineas44.length && !lineas43.length) return json({ ok: false, mensaje: "No se pudo armar ningún modelo.", errores });

  const totalU = resumen.reduce((a, r) => a + r.unidades, 0);
  const total4043 = lineas43.reduce((a, l) => a + l.cantidad, 0);
  if (lineas43.length && total4043 < MIN_TOTAL_4043) {
    return json({ ok: false, resumen, total_unidades: totalU, errores: errores.length ? errores : undefined,
      mensaje: `Cole 40-43: el pedido suma ${total4043} unidades y el mínimo del pedido completo es ${MIN_TOTAL_4043} (sin mínimo por modelo). Agrega más modelos o unidades con stock para completar.` });
  }
  if (dryRun) return json({ ok: true, dry_run: true, cliente: { rut: rutFmt, razon_social: razon, nuevo: !existente }, resumen, total_unidades: totalU, errores: errores.length ? errores : undefined, mensaje: "Simulación: nada se guardó. Confirma con el cliente y vuelve a llamar sin dry_run." });

  /* --- registrar cliente si es nuevo --- */
  if (!existente) {
    try { await sb("/rest/v1/rpc/register_client_if_missing", { method: "POST", body: JSON.stringify({ p_rut: rutFmt, p_razon_social: razon }) }); } catch (e) { console.warn("register_client:", e.message); }
  }

  /* --- guardar pedidos --- */
  const pedidos = [];
  const nuevoId = () => (globalThis.crypto && crypto.randomUUID ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`);
  const quoteBase = (id, source, lineas) => ({
    id, store_name: razon, client_rut: rutFmt, client_rut_normalized: cliente.rut_normalized, client_phone: telefono,
    total_items: lineas.reduce((a, l) => a + l.cantidad, 0), created_at_client: new Date().toISOString(), source,
    giro: cliente.giro, direccion: cliente.direccion, nombre_tienda: cliente.nombre_tienda, comuna: cliente.comuna, transporte: cliente.transporte,
  });
  try {
    if (lineas44.length) {
      const id = nuevoId();
      const q = quoteBase(id, "dolce-vita-44", lineas44);
      await sb("/rest/v1/quotes", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify(q) });
      await sb("/rest/v1/quote_items", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify(lineas44.map((l) => ({ quote_id: id, sku: l.sku, size: l.talla, quantity: l.cantidad }))) });
      pedidos.push({ quote_id: id, ref: "DV44-" + id.slice(-6).toUpperCase(), coleccion: "Cole 44", unidades: q.total_items, link_admin: `${BASE}/catalogo-44/?pedido=${id}` });
    }
    if (lineas43.length) {
      const id = nuevoId();
      const q = quoteBase(id, "catalogo-43", lineas43);
      const rid = await sb("/rest/v1/rpc/create_quote_with_stock_reservation", { method: "POST", body: JSON.stringify({ p_quote: q, p_items: lineas43 }) });
      const qid = typeof rid === "string" ? rid.replace(/"/g, "") : id;
      pedidos.push({ quote_id: qid, ref: "C43-" + String(qid).slice(-6).toUpperCase(), coleccion: "Cole 40-43", unidades: q.total_items, link_admin: `${BASE}/cole-43?admin=1` });
    }
  } catch (e) {
    return json({ ok: false, mensaje: `No pude guardar el pedido: ${e.message}`.slice(0, 400), pedidos_creados: pedidos });
  }

  /* --- aviso Telegram (mismo que la web) --- */
  try {
    await fetch(`${BASE}/.netlify/functions/notify-order`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quoteId: pedidos[0].quote_id, storeName: razon + " (vía WhatsApp/Sofía)", rut: rutFmt, phone: telefono, transporte: cliente.transporte || "", ciudad: cliente.comuna || "",
        items: resumen.map((r) => ({ codigo: r.codigo, nombre: r.nombre || "", totalUnidades: r.unidades })), totalUnidades: totalU,
      }),
    });
  } catch (_) {}

  return json({
    ok: true, cliente: { rut: rutFmt, razon_social: razon, nuevo: !existente }, pedidos, resumen, total_unidades: totalU,
    errores: errores.length ? errores : undefined,
    mensaje: `Pedido registrado (${pedidos.map((p) => p.ref).join(", ")}): ${totalU} unidades. Un ejecutivo de Mohicano lo confirmará y coordinará el despacho por ${cliente.transporte || "el transporte indicado"}.`,
  });
};
