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

async function sb(path, opts = {}) {
  if (!SUPABASE_URL || !SERVICE_KEY) throw new Error("Faltan SUPABASE_URL / SUPABASE_SERVICE_KEY");
  const r = await fetch(`${SUPABASE_URL}${path}`, { ...opts, headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json", ...(opts.headers || {}) } });
  const text = await r.text();
  if (!r.ok) throw new Error(`${path} → ${r.status}: ${text.slice(0, 200)}`);
  return text ? JSON.parse(text) : null;
}
/* Ficha del cliente (tabla clients) por RUT: teléfono, transporte, giro, dirección, tienda, comuna */
async function fichaCliente(rut) {
  const d = rutDigitos(rut);
  if (d.length < 2) return null;
  try {
    const rows = await sb(`/rest/v1/rpc/lookup_client_by_rut`, { method: "POST", body: JSON.stringify({ p_rut: `${d.slice(0, -1)}-${d.slice(-1)}` }) });
    return (Array.isArray(rows) ? rows[0] : rows) || null;
  } catch (_) { return null; }
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

/* { id } | { ids:[...] } | { rut } → nota. Devuelve { ok:false, mensaje } si no hay pedido.
   Un envío mixto (Dolce Vita 44 + Cole 40-43) son DOS pedidos con la misma hora (created_at_client):
   con `ids` se juntan en una sola nota; con `id` se buscan solos sus hermanos por RUT + hora. */
const esUuid = (v) => /^[0-9a-f-]{36}$/i.test(String(v || ""));
async function hermanosDe(quote) {
  if (!quote || !quote.created_at_client) return [];
  const rutN = String(quote.client_rut_normalized || "").trim();
  if (!rutN) return [];
  const rows = await sb(`/rest/v1/quotes?client_rut_normalized=eq.${encodeURIComponent(rutN)}&created_at_client=eq.${encodeURIComponent(quote.created_at_client)}&select=*&order=source.asc`).catch(() => []);
  return (rows || []).filter((q) => q.id !== quote.id);
}
async function construirNota({ id, ids, rut } = {}) {
  let quote = null;
  let extras = [];
  if (Array.isArray(ids) && ids.filter(esUuid).length) {
    const lista = ids.filter(esUuid);
    const rows = await sb(`/rest/v1/quotes?id=in.(${lista.join(",")})&select=*`);
    quote = (rows || []).find((q) => q.id === lista[0]) || (rows || [])[0] || null;
    extras = (rows || []).filter((q) => quote && q.id !== quote.id);
  } else if (id && esUuid(id)) {
    quote = (await sb(`/rest/v1/quotes?id=eq.${id}&select=*&limit=1`))[0] || null;
    if (quote) extras = await hermanosDe(quote);
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
  if (!extras.length && rut) extras = await hermanosDe(quote);
  const quotes = [quote, ...extras];

  const idsTodos = quotes.map((q) => q.id);
  const items = (await sb(`/rest/v1/quote_items?quote_id=in.(${idsTodos.join(",")})&select=quote_id,sku,size,quantity`)) || [];
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
  const refDe = (q) => {
    const s = String(q.source || "").toLowerCase();
    const es44q = s.includes("44");
    return (es44q ? "DV44-" : "C43-") + String(q.id).slice(-6).toUpperCase();
  };
  const ref = quotes.map(refDe).join(" + ");
  const hay44 = Object.keys(porSku).some((s) => s.startsWith("44"));
  const hay43 = Object.keys(porSku).some((s) => !s.startsWith("44"));
  const es44 = hay44 && !hay43;
  const coleccion = hay44 && hay43 ? "Dolce Vita 44 + Cole 40-43" : (hay44 ? "Dolce Vita · Cole 44" : "Cole 40-43");

  /* Dolce Vita 44: precio con IVA incluido; Cole 40-43: neto. Cada modelo aporta su neto y su IVA. */
  const modelos = Object.values(porSku).sort((a, b) => a.codigo.localeCompare(b.codigo)).map((g) => {
    const p = precioDe(g.codigo);
    const lineasTallas = Object.entries(g.tallas).sort((a, b) => ordenTalla(a[0]) - ordenTalla(b[0])).map(([t, n]) => `${t}: ${n}`);
    const subtotal = p.precio == null ? null : p.precio * g.unidades;
    const netoM = subtotal == null ? 0 : (p.ivaIncluido ? Math.round(subtotal / 1.19) : subtotal);
    const ivaM = subtotal == null ? 0 : (p.ivaIncluido ? subtotal - netoM : Math.round(subtotal * 0.19));
    return { codigo: g.codigo, nombre: p.nombre || "", coleccion: g.codigo.startsWith("44") ? "Dolce Vita 44" : `Cole ${g.codigo.slice(0, 2)}`, unidades: g.unidades, precio_unitario: p.precio, iva_incluido: !!p.ivaIncluido, subtotal, neto: netoM, iva: ivaM, tallas: lineasTallas };
  });
  const totalUnidades = modelos.reduce((s, m) => s + m.unidades, 0);
  const sinPrecio = modelos.filter((m) => m.subtotal == null).map((m) => m.codigo);
  const neto = modelos.reduce((s, m) => s + m.neto, 0);
  const iva = modelos.reduce((s, m) => s + m.iva, 0);
  const total = neto + iva;

  const ficha = (await fichaCliente(quote.client_rut || quote.client_rut_normalized)) || {};
  const dato = (...vals) => { for (const v of vals) { const s = String(v == null ? "" : v).trim(); if (s) return s; } return ""; };
  const deQuotes = (campo) => quotes.map((q) => q[campo]); /* el pedido 40-43 (RPC) no guarda giro/dirección: se toman del hermano */
  const cliente = dato(...deQuotes("store_name"), ficha.razon_social, ...deQuotes("nombre_tienda"));
  const telefono = dato(...deQuotes("client_phone"), ficha.telefono);
  const transporte = dato(...deQuotes("transporte"), ficha.transporte);
  const direccion = dato(...deQuotes("direccion"), ficha.direccion);
  const comuna = dato(...deQuotes("comuna"), ficha.comuna);
  const giro = dato(...deQuotes("giro"), ficha.giro);
  const tienda = dato(...deQuotes("nombre_tienda"), ficha.nombre_tienda);
  const lineas = [
    `NOTA DE PEDIDO ${ref}`,
    ...(hay44 && hay43 ? [`(${coleccion})`] : []),
    `${cliente}${quote.client_rut ? ` · RUT ${quote.client_rut}` : ""}`,
    ...(tienda && tienda !== cliente ? [`Tienda: ${tienda}`] : []),
    ...(giro ? [`Giro: ${giro}`] : []),
    ...(direccion || comuna ? [`Dirección: ${[direccion, comuna].filter(Boolean).join(", ")}`] : []),
    ...(telefono ? [`Teléfono: ${telefono}`] : []),
    `Fecha: ${fechaCL(quote.created_at)}`,
    `Transporte: ${transporte || "por confirmar"}`,
    "",
  ];
  for (const m of modelos) {
    const etiqueta = hay44 && hay43 ? ` · ${m.coleccion}` : "";
    const cu = m.precio_unitario == null ? "" : ` · ${clp(m.precio_unitario)} c/u${hay44 && hay43 ? (m.iva_incluido ? " IVA incl." : " + IVA") : ""}`;
    lineas.push(`${m.codigo}${m.nombre ? ` ${m.nombre}` : ""}${etiqueta} (${m.unidades} u${cu})`);
    lineas.push(...m.tallas);
    lineas.push(m.subtotal != null ? `Subtotal: ${clp(m.subtotal)}${hay44 && hay43 && !m.iva_incluido ? " + IVA" : ""}` : "Subtotal: precio a confirmar");
    lineas.push("");
  }
  lineas.push(`Total prendas: ${totalUnidades}`);
  lineas.push(`Neto: ${clp(neto)}`);
  lineas.push(`IVA 19%: ${clp(iva)}`);
  lineas.push(`Total con IVA: ${clp(total)}`);
  if (sinPrecio.length) lineas.push(`(${sinPrecio.join(", ")} sin precio en la web: se confirma con un ejecutivo)`);

  return {
    ok: true, referencia: ref, quote_id: quote.id, quote_ids: idsTodos, fecha: fechaCL(quote.created_at), coleccion, es44, mixto: hay44 && hay43,
    cliente, rut: quote.client_rut || null, telefono: telefono || null, transporte: transporte || null,
    direccion: direccion || null, comuna: comuna || null, giro: giro || null, nombre_tienda: tienda || null,
    modelos, total_unidades: totalUnidades, neto, iva, total, nota_texto: lineas.join("\n"),
  };
}

exports.construirNota = construirNota;

exports.handler = async (event) => {
  const apiKey = event.headers["x-api-key"] || event.headers["X-Api-Key"] || "";
  if (!ORDER_KEY || apiKey !== ORDER_KEY) return json({ ok: false, mensaje: "No autorizado." }, 401);
  const qs = event.queryStringParameters || {};
  try {
    const ids = String(qs.ids || "").split(",").map((s) => s.trim()).filter(Boolean);
    const out = await construirNota({ id: String(qs.id || "").trim(), ids: ids.length ? ids : undefined, rut: String(qs.rut || "").trim() });
    return json(out);
  } catch (e) {
    return json({ ok: false, mensaje: `No pude armar la nota de pedido: ${e.message}` }, 500);
  }
};
