/* nota-pedido — arma la NOTA DE PEDIDO (texto para WhatsApp) de un pedido guardado en Supabase.
   La usa notify-order cuando entra un pedido desde la página (se la manda al cliente por Sofía)
   y queda disponible como herramienta de Sofía:
     GET /.netlify/functions/nota-pedido?id=<uuid del pedido>
     GET /.netlify/functions/nota-pedido?rut=19.720.085-5      (último pedido de ese RUT en las últimas 72 h)
   Header X-Api-Key = NEXOR_ORDER_KEY (misma clave que crear-pedido). Precios: los mismos JSON que la página. */
const BASE = (process.env.URL || "https://mohicanojeans.netlify.app").replace(/\/$/, "");
const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const ORDER_KEY = (process.env.NEXOR_ORDER_KEY || "").trim();

const clp = (n) => "$" + String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
const json = (obj, status = 200) => ({ statusCode: status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }, body: JSON.stringify(obj) });
const ORDEN_TALLAS = ["34", "36", "38", "40", "42", "44", "46", "48", "50", "52", "XS", "S", "M", "L", "XL", "XXL"];
const ordenTalla = (t) => { const i = ORDEN_TALLAS.indexOf(String(t).toUpperCase()); return i < 0 ? 99 : i; };

async function sb(path) {
  if (!SUPABASE_URL || !SERVICE_KEY) throw new Error("Faltan SUPABASE_URL / SUPABASE_SERVICE_KEY");
  const r = await fetch(`${SUPABASE_URL}${path}`, { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } });
  const text = await r.text();
  if (!r.ok) throw new Error(`${path} → ${r.status}: ${text.slice(0, 200)}`);
  return text ? JSON.parse(text) : null;
}
async function getRemote(path) {
  const r = await fetch(`${BASE}${path}`, { headers: { "Cache-Control": "no-cache" } });
  if (!r.ok) throw new Error(`HTTP ${r.status} en ${path}`);
  const t = (await r.text()).replace(/^﻿/, "");
  return path.endsWith(".js") ? t : JSON.parse(t);
}

/* Precios: Cole 44 desde catalogo-44/app.js (IVA incluido); Cole 43 desde price-data-catalogo-43.json;
   Cole 40-42 desde price-data.json (netos). Igual que la página y que consultar_stock. */
async function buscadorPrecios() {
  const [app44, p43, p] = await Promise.all([
    getRemote("/catalogo-44/app.js").catch(() => ""),
    getRemote("/price-data-catalogo-43.json").catch(() => ({})),
    getRemote("/price-data.json").catch(() => ({})),
  ]);
  const m44 = {};
  const re = /\{nombre:"([^"]+)",\s*codigo:"([^"]+)",\s*precio:(null|\d+),/g;
  let m;
  while ((m = re.exec(app44))) m44[m[2].toUpperCase()] = { nombre: m[1], precio: m[3] === "null" ? null : Number(m[3]) };
  const it43 = p43.items || p43, it = p.items || p;
  return (sku) => {
    const s = String(sku || "").toUpperCase();
    const base4 = s.slice(0, 4);
    if (s.startsWith("44")) return { precio: (m44[s] || m44[`${base4}-00`] || {}).precio ?? null, nombre: (m44[s] || {}).nombre || "", ivaIncluido: true };
    const src = s.startsWith("43") ? it43 : it;
    const v = src[s] ?? src[base4] ?? null;
    return { precio: v == null ? null : Number(v), nombre: "", ivaIncluido: false };
  };
}

const fechaCL = (iso) => {
  try {
    const d = new Date(iso);
    const f = new Intl.DateTimeFormat("es-CL", { timeZone: "America/Santiago", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false });
    return f.format(d).replace(",", "");
  } catch (_) { return String(iso || "").slice(0, 16); }
};
const rutDigitos = (r) => String(r || "").replace(/[^0-9kK]/g, "").toUpperCase();

/* { id } o { rut } → nota. Devuelve { ok:false, mensaje } si no hay pedido. */
async function construirNota({ id, rut } = {}) {
  let quote = null;
  if (id && /^[0-9a-f-]{36}$/i.test(id)) {
    quote = (await sb(`/rest/v1/quotes?id=eq.${id}&select=*&limit=1`))[0] || null;
  } else if (rut) {
    const d = rutDigitos(rut);
    const desde = new Date(Date.now() - 72 * 3600e3).toISOString();
    const conGuion = d.length >= 2 ? `${d.slice(0, -1)}-${d.slice(-1)}` : d;
    const filtro = encodeURIComponent(`(client_rut_normalized.eq.${d},client_rut_normalized.eq.${conGuion},client_rut.eq.${conGuion})`);
    quote = (await sb(`/rest/v1/quotes?or=${filtro}&created_at=gte.${desde}&order=created_at.desc&select=*&limit=1`))[0] || null;
    if (!quote) {
      /* RUT con puntos (12.345.678-9): buscar por los dígitos dentro de client_rut */
      const rows = await sb(`/rest/v1/quotes?created_at=gte.${desde}&order=created_at.desc&select=*&limit=200`);
      quote = (rows || []).find((q) => rutDigitos(q.client_rut) === d || rutDigitos(q.client_rut_normalized) === d) || null;
    }
  }
  if (!quote) return { ok: false, mensaje: id ? "No encontré ese pedido." : "No encontré un pedido de ese RUT en las últimas 72 horas. Si lo acaba de enviar, pídele que espere un minuto; si no, dile que un ejecutivo lo revisa." };

  const items = (await sb(`/rest/v1/quote_items?quote_id=eq.${quote.id}&select=sku,size,quantity`)) || [];
  if (!items.length) return { ok: false, mensaje: "El pedido no tiene detalle de modelos." };
  const precioDe = await buscadorPrecios();

  const porSku = {};
  for (const it of items) {
    const sku = String(it.sku || "").toUpperCase();
    const q = Number(it.quantity) || 0;
    if (!sku || q <= 0) continue;
    const g = porSku[sku] || (porSku[sku] = { codigo: sku, tallas: {}, unidades: 0 });
    g.tallas[String(it.size)] = (g.tallas[String(it.size)] || 0) + q;
    g.unidades += q;
  }
  const src = String(quote.source || "").toLowerCase();
  const es44 = src.includes("44") || Object.keys(porSku).every((s) => s.startsWith("44"));
  const ref = (es44 ? "DV44-" : "C43-") + String(quote.id).slice(-6).toUpperCase();

  const modelos = Object.values(porSku).sort((a, b) => a.codigo.localeCompare(b.codigo)).map((g) => {
    const p = precioDe(g.codigo);
    const lineasTallas = Object.entries(g.tallas).sort((a, b) => ordenTalla(a[0]) - ordenTalla(b[0])).map(([t, n]) => `${t}: ${n}`);
    const subtotal = p.precio == null ? null : p.precio * g.unidades;
    return { codigo: g.codigo, nombre: p.nombre || "", unidades: g.unidades, precio_unitario: p.precio, subtotal, tallas: lineasTallas };
  });
  const totalUnidades = modelos.reduce((s, m) => s + m.unidades, 0);
  const sinPrecio = modelos.filter((m) => m.subtotal == null).map((m) => m.codigo);
  const suma = modelos.reduce((s, m) => s + (m.subtotal || 0), 0);
  let neto, iva, total;
  if (es44) { total = suma; neto = Math.round(total / 1.19); iva = total - neto; }
  else { neto = suma; iva = Math.round(neto * 0.19); total = neto + iva; }

  const cliente = quote.store_name || quote.nombre_tienda || "";
  const lineas = [
    `NOTA DE PEDIDO ${ref}`,
    `${cliente}${quote.client_rut ? ` · RUT ${quote.client_rut}` : ""}`,
    `Fecha: ${fechaCL(quote.created_at)}`,
    `Transporte: ${quote.transporte || "por confirmar"}`,
    "",
  ];
  for (const m of modelos) {
    lineas.push(`${m.codigo}${m.nombre ? ` ${m.nombre}` : ""} (${m.unidades} u${m.precio_unitario != null ? ` · ${clp(m.precio_unitario)} c/u` : ""})`);
    lineas.push(...m.tallas);
    lineas.push(m.subtotal != null ? `Subtotal: ${clp(m.subtotal)}` : "Subtotal: precio a confirmar");
    lineas.push("");
  }
  lineas.push(`Total prendas: ${totalUnidades}`);
  lineas.push(`Neto: ${clp(neto)}`);
  lineas.push(`IVA 19%: ${clp(iva)}`);
  lineas.push(`Total con IVA: ${clp(total)}`);
  if (sinPrecio.length) lineas.push(`(${sinPrecio.join(", ")} sin precio en la web: se confirma con un ejecutivo)`);

  return {
    ok: true, referencia: ref, quote_id: quote.id, fecha: fechaCL(quote.created_at), coleccion: es44 ? "Dolce Vita · Cole 44" : "Cole 40-43",
    cliente, rut: quote.client_rut || null, telefono: quote.client_phone || null, transporte: quote.transporte || null,
    modelos, total_unidades: totalUnidades, neto, iva, total, nota_texto: lineas.join("\n"),
  };
}

exports.construirNota = construirNota;

exports.handler = async (event) => {
  const apiKey = event.headers["x-api-key"] || event.headers["X-Api-Key"] || "";
  if (!ORDER_KEY || apiKey !== ORDER_KEY) return json({ ok: false, mensaje: "No autorizado." }, 401);
  const qs = event.queryStringParameters || {};
  try {
    const out = await construirNota({ id: String(qs.id || "").trim(), rut: String(qs.rut || "").trim() });
    return json(out);
  } catch (e) {
    return json({ ok: false, mensaje: `No pude armar la nota de pedido: ${e.message}` }, 500);
  }
};
