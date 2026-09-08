/* stock-lookup — consulta de stock/precio en vivo para el agente de Nexor (Sofía).
   GET /.netlify/functions/stock-lookup?codigo=4401      (4401, 4401-00, 440100, 4431-01)
   GET /.netlify/functions/stock-lookup?q=vita           (búsqueda por nombre, Cole 44)
   Lee los mismos JSON que usa la web (stock-data-catalogo-43/44, price-data*, data-catalogo-4X)
   y los nombres/precios de Cole 44 desde catalogo-44/app.js. Cache en memoria 5 min. */

const BASE = (process.env.URL || "https://mohicanojeans.netlify.app").replace(/\/$/, "");
const TTL_MS = 5 * 60 * 1000;
const cache = new Map();

async function getJson(path) {
  const hit = cache.get(path);
  if (hit && Date.now() - hit.t < TTL_MS) return hit.v;
  const r = await fetch(`${BASE}${path}`, { headers: { "Cache-Control": "no-cache" } });
  if (!r.ok) throw new Error(`HTTP ${r.status} en ${path}`);
  const v = path.endsWith(".js") ? await r.text() : await r.json();
  cache.set(path, { t: Date.now(), v });
  return v;
}

/* MODELOS de catalogo-44/app.js → { "4402-00": {nombre, precio, sec, tipo} } */
async function modelos44() {
  const hit = cache.get("__modelos44");
  if (hit && Date.now() - hit.t < TTL_MS) return hit.v;
  const src = await getJson("/catalogo-44/app.js");
  const map = {};
  const re = /\{nombre:"([^"]+)",\s*codigo:"([^"]+)",\s*precio:(null|\d+),[^}]*?tipo:"([^"]+)",\s*sec:"([^"]+)"\}/g;
  let m;
  while ((m = re.exec(src))) {
    map[m[2]] = { nombre: m[1], precio: m[3] === "null" ? null : Number(m[3]), tipo: m[4], sec: m[5] };
  }
  cache.set("__modelos44", { t: Date.now(), v: map });
  return map;
}

const SECCIONES_44 = {
  flare: "Flare Jeans", skinny: "Skinny Jeans", wideleg: "Wide Leg", balloon: "Balloon", oxford: "Oxford",
  crop: "Crop Jeans", rectos: "Jeans Rectos", palazzo: "Jeans Palazzo", smart: "Smart Denim",
  faja: "Efecto Faja · Push In Push Up", colores: "Jeans de Colores", laser: "Láser Jeans", chaquetas: "Chaquetas",
};

function normalizarCodigo(raw) {
  const s = String(raw || "").toUpperCase().replace(/[^0-9]/g, "");
  if (s.length === 4) return `${s}-00`;
  if (s.length === 6) return `${s.slice(0, 4)}-${s.slice(4)}`;
  const t = String(raw || "").toUpperCase().trim();
  if (/^\d{4}-\d{2}$/.test(t)) return t;
  return "";
}

const clp = (n) => "$" + Number(n).toLocaleString("es-CL");

async function consultarCodigo(family) {
  const cole = family.slice(0, 2);
  if (!/^4[0-4]$/.test(cole)) return { ok: false, codigo: family, mensaje: "Código fuera de las colecciones vigentes (Cole 40 a 44)." };
  const base4 = family.slice(0, 4);
  const es44 = cole === "44";

  const [stock, cat] = await Promise.all([
    getJson(es44 ? "/stock-data-catalogo-44.json" : "/stock-data-catalogo-43.json"),
    getJson(`/data-catalogo-${cole}.json`).catch(() => []),
  ]);

  let nombre = "", detalle = "", precio = null, seccion = "";
  if (es44) {
    const m = (await modelos44())[family];
    if (!m) return { ok: false, codigo: family, coleccion: "Cole 44", mensaje: "Ese código no está en el catálogo Dolce Vita 44." };
    nombre = m.nombre; precio = m.precio; seccion = SECCIONES_44[m.sec] || m.sec;
    detalle = m.tipo === "chaqueta" ? "Chaqueta" : "Jean";
  } else {
    const item = (Array.isArray(cat) ? cat : []).find((p) => String(p.family).toUpperCase() === family);
    if (!item) return { ok: false, codigo: family, coleccion: `Cole ${cole}`, mensaje: `Ese código no está en el catálogo Cole ${cole}.` };
    const partes = [item.tipo, item.tiro ? `tiro ${item.tiro}` : "", item.bota ? `bota ${item.bota}` : ""].filter(Boolean);
    detalle = partes.join(" · ") || String(item.description || "").replace(/\?/g, "·");
    nombre = item.bota ? item.bota.charAt(0).toUpperCase() + item.bota.slice(1).toLowerCase() : `Modelo ${base4}`;
    const precios = cole === "43" ? await getJson("/price-data-catalogo-43.json") : await getJson("/price-data.json");
    const pit = precios.items || precios;
    precio = pit[family] ?? pit[base4] ?? null;
  }

  const st = (stock.items || {})[family] || null;
  const tallas = st && st.sizes ? st.sizes : {};
  const total = st ? Number(st.total) || 0 : 0;
  const conStock = Object.entries(tallas).filter(([, n]) => Number(n) > 0).map(([t, n]) => `${t}: ${n}`);
  const disponible = es44 ? total > 30 : total > 0;
  const estado = es44 ? (disponible ? "Disponible" : "En producción") : (disponible ? "Disponible" : "Agotado");

  /* Cole 44 en producción: plazo aproximado de despacho (editable en /produccion-eta-44.json) */
  let notaProduccion;
  if (es44 && !disponible) {
    const eta = await getJson("/produccion-eta-44.json").catch(() => ({}));
    const porModelo = eta[family];
    const dias = porModelo || eta.default_dias || process.env.ETA_PRODUCCION_DIAS || "10 a 15";
    notaProduccion = /^\d{4}-\d{2}-\d{2}$/.test(String(dias))
      ? `Modelo en producción: estimamos que estará listo para despacho alrededor del ${dias}. Se puede dejar reservado.`
      : `Modelo en producción: pronto estará listo para despachar, aprox. en ${dias} días. Se puede dejar reservado.`;
  }

  return {
    ok: true,
    codigo: family,
    coleccion: es44 ? "Dolce Vita · Cole 44" : `Cole ${cole}`,
    nombre,
    detalle,
    seccion: seccion || undefined,
    precio,
    precio_texto: precio == null ? "Precio a consultar" : es44 ? `${clp(precio)} por unidad, IVA incluido` : `${clp(precio)} precio mayorista sin IVA`,
    estado,
    disponible,
    /* Cole 44: solo disponible / en producción, sin cantidades (la disponibilidad se define a mano) */
    stock_total: es44 ? undefined : total,
    stock_por_talla: es44 ? undefined : tallas,
    tallas_con_stock: es44 ? undefined : conStock,
    minimo_por_modelo: es44 ? 12 : undefined,
    url: es44 ? `${BASE}/catalogo-44/` : `${BASE}/cole-43`,
    /* link por modelo con vista previa (foto, nombre, precio) en WhatsApp; abre la ficha real */
    link_modelo: `${BASE}/m/${family}`,
    nota: notaProduccion || (es44 && disponible ? "Disponible en bodega para despacho inmediato." : undefined),
  };
}

async function buscarNombre(q) {
  const term = String(q || "").trim().toLowerCase();
  if (term.length < 2) return { ok: false, mensaje: "Indica al menos 2 letras del nombre o el código." };
  const map = await modelos44();
  const stock = await getJson("/stock-data-catalogo-44.json");
  const res = Object.entries(map)
    .filter(([, m]) => m.nombre.toLowerCase().includes(term))
    .slice(0, 6)
    .map(([codigo, m]) => {
      const total = Number(((stock.items || {})[codigo] || {}).total) || 0;
      return { codigo, nombre: m.nombre, seccion: SECCIONES_44[m.sec] || m.sec, precio: m.precio,
        estado: total > 30 ? "Disponible" : "En producción" };
    });
  if (!res.length) return { ok: false, mensaje: `No encontré modelos Cole 44 con "${q}". Pide el código de 4 dígitos.` };
  return { ok: true, coleccion: "Dolce Vita · Cole 44", resultados: res };
}

exports.handler = async function (event) {
  const headers = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" };
  try {
    const qs = event.queryStringParameters || {};
    let body = {};
    if (event.httpMethod === "POST" && event.body) { try { body = JSON.parse(event.body); } catch (_) {} }
    const codigoRaw = qs.codigo || body.codigo || "";
    const q = qs.q || body.q || "";

    let out;
    if (codigoRaw) {
      const family = normalizarCodigo(codigoRaw);
      out = family ? await consultarCodigo(family) : { ok: false, mensaje: `Código inválido: ${codigoRaw}. Usa 4 dígitos (ej. 4401) o 4401-00.` };
    } else if (q) {
      out = await buscarNombre(q);
    } else {
      out = { ok: false, mensaje: "Falta el parámetro codigo (ej. 4401) o q (nombre del modelo)." };
    }
    return { statusCode: 200, headers, body: JSON.stringify(out) };
  } catch (e) {
    console.error("stock-lookup error:", e);
    return { statusCode: 200, headers, body: JSON.stringify({ ok: false, mensaje: "No pude consultar el stock en este momento. Intenta de nuevo en un minuto." }) };
  }
};
