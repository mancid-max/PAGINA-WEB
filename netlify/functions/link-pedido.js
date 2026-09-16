/* link-pedido — arma el link del catálogo con modelo(s), curva y RUT pre-cargados (para Sofía / Nexor).
   GET /.netlify/functions/link-pedido?items=4448-00:12,4458-00:17&rut=16.388.334-1
   GET /.netlify/functions/link-pedido?modelo=4448-00&curva=12
   items: "codigo:curva" separados por coma. curva: 12 | 17 | 36=2.38=3.40=4
   Elige la página según el código: 44xx → catalogo-44, 40xx-43xx → cole-43 (raíz). */
const BASE = (process.env.URL || "https://mohicanojeans.netlify.app").replace(/\/$/, "");

function normCod(raw) {
  const s = String(raw || "").toUpperCase().replace(/[^0-9]/g, "");
  if (s.length === 4) return `${s}-00`;
  if (s.length === 6) return `${s.slice(0, 4)}-${s.slice(4)}`;
  const t = String(raw || "").toUpperCase().trim();
  return /^\d{4}-\d{2}$/.test(t) ? t : "";
}
const rutLimpio = (r) => String(r || "").replace(/[^0-9kK]/g, "").toUpperCase().replace(/^(\d+)([0-9K])$/, "$1-$2");

/* Curva sugerida para N unidades: 12 → 2 por talla; 17 → 2/3/4/4/3/1; otro N → proporcional (campana 1-2-3-3-2-1).
   Chaquetas (4465-xx): S/M/L/XL. Devuelve "36=2.38=3…" */
const CHAQUETAS = /^4465-/;
function curvaSugerida(n, chaqueta) {
  const tallas = chaqueta ? ["S", "M", "L", "XL"] : ["36", "38", "40", "42", "44", "46"];
  if (!chaqueta && n === 12) return "36=2.38=2.40=2.42=2.44=2.46=2";
  if (!chaqueta && n === 17) return "36=2.38=3.40=4.42=4.44=3.46=1";
  if (chaqueta && n === 12) return "S=3.M=3.L=3.XL=3";
  if (chaqueta && n === 17) return "S=4.M=5.L=5.XL=3";
  const pesos = chaqueta ? [3, 4, 4, 3] : [1, 2, 3, 3, 2, 1];
  const sum = pesos.reduce((a, b) => a + b, 0);
  const exact = pesos.map((p) => (n * p) / sum);
  const base = exact.map(Math.floor);
  let resto = n - base.reduce((a, b) => a + b, 0);
  exact.map((v, i) => [v - Math.floor(v), i]).sort((a, b) => b[0] - a[0] || a[1] - b[1]).forEach(([, i]) => { if (resto > 0) { base[i]++; resto--; } });
  return tallas.map((t, i) => (base[i] > 0 ? `${t}=${base[i]}` : null)).filter(Boolean).join(".");
}
/* Normaliza la spec de curva: "12" | "17" | "20" (N unidades) | "36=2.38=3" */
function specCurva(spec, cod) {
  const s = String(spec || "12").trim();
  if (/^\d+$/.test(s)) { const n = Number(s); return n >= 1 ? curvaSugerida(n, CHAQUETAS.test(cod)) : "36=2.38=2.40=2.42=2.44=2.46=2"; }
  return s;
}

/* Cole 40-43: cada talla del link tiene que existir con stock (evita que el agente invente tallas).
   Si el modelo no está en el archivo de stock, no bloquea. Devuelve lista de errores (vacía = ok). */
async function validarStock4043(items) {
  let inv = null;
  try {
    const t = await fetch(`${BASE}/stock-data-catalogo-43.json`, { headers: { "Cache-Control": "no-cache" } }).then((r) => r.text());
    const st = JSON.parse(t.replace(/^﻿/, ""));
    inv = Array.isArray(st.items) ? Object.fromEntries(st.items.map((i) => [String(i.sku || i.article).toUpperCase(), i])) : st.items;
  } catch (_) { return []; }
  if (!inv) return [];
  const errores = [];
  for (const it of items) {
    const cod = it.split(":")[0];
    const spec = it.split(":").slice(1).join(":");
    const reg = inv[cod];
    if (!reg || !reg.sizes) continue;
    const malas = [];
    for (const par of spec.split(".")) {
      const [t, q] = par.split("=");
      const n = Number(q) || 0;
      const disp = Number(reg.sizes[t]) || 0;
      if (n > disp) malas.push(disp > 0 ? `talla ${t}: pediste ${n} y hay ${disp}` : `talla ${t}: sin stock`);
    }
    if (!malas.length) continue;
    const con = Object.entries(reg.sizes).filter(([, v]) => Number(v) > 0).sort((a, b) => Number(a[0]) - Number(b[0])).map(([t, v]) => `${t}: ${v}`);
    errores.push(`${cod}: ${malas.join(" · ")}. Tallas con stock del ${cod}:\n${con.length ? con.join("\n") : "ninguna (agotado)"}`);
  }
  return errores;
}

exports.handler = async (event) => {
  const headers = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" };
  const qs = event.queryStringParameters || {};
  let body = {};
  if (event.httpMethod === "POST" && event.body) { try { body = JSON.parse(event.body); } catch (_) {} }
  const itemsRaw = String(qs.items || body.items || "").trim();
  const modelo = normCod(qs.modelo || body.modelo || "");
  const curva = String(qs.curva || body.curva || "").trim();
  const rut = rutLimpio(qs.rut || body.rut || "");
  const transporte = String(qs.transporte || body.transporte || "").trim();
  const tel = String(qs.telefono || body.telefono || "").replace(/[^0-9+]/g, "");
  const soloFicha = /^(1|true|si)$/i.test(String(qs.solo_ficha || body.solo_ficha || ""));

  const items = itemsRaw
    ? itemsRaw.split(",").map((par) => { const [c, ...r] = par.split(":"); const cod = normCod(c); return cod ? `${cod}:${specCurva(r.join(":"), cod)}` : null; }).filter(Boolean)
    : (modelo ? [`${modelo}:${specCurva(curva, modelo)}`] : []);
  if (!items.length) return { statusCode: 200, headers, body: JSON.stringify({ ok: false, mensaje: "Indica items (ej. 4448-00:12) o modelo." }) };

  const coles = new Set(items.map((i) => i.slice(0, 2)));
  if (coles.size > 1 && coles.has("44")) {
    return { statusCode: 200, headers, body: JSON.stringify({ ok: false, mensaje: "No se puede mezclar Cole 44 con Cole 40-43 en un mismo link: arma dos links." }) };
  }
  const es44 = coles.has("44");
  if (!es44) {
    const errores = await validarStock4043(items);
    if (errores.length) {
      return { statusCode: 200, headers, body: JSON.stringify({ ok: false, mensaje: `No se armó el link porque hay tallas sin stock. Corrige usando solo estas tallas y vuelve a llamar:\n${errores.join("\n")}`, errores }) };
    }
  }
  const base = es44 ? `${BASE}/catalogo-44/` : `${BASE}/`;
  const params = new URLSearchParams();
  if (soloFicha && items.length === 1) {
    /* Solo ver la ficha con la curva (no agrega al carrito) */
    params.set(es44 ? "modelo" : "sku", items[0].split(":")[0]);
    params.set("curva", items[0].split(":").slice(1).join(":"));
  } else {
    /* Por defecto: todo al carrito + abre "Tu pedido" listo para Enviar */
    params.set("items", items.join(","));
  }
  if (rut) params.set("rut", rut);
  if (transporte) params.set("transporte", transporte);
  if (tel) params.set("tel", tel);

  const url = `${base}?${params.toString()}`;
  return {
    statusCode: 200, headers,
    body: JSON.stringify({
      ok: true, url, pagina: es44 ? "Dolce Vita · Cole 44" : "Cole 40-43", items, rut: rut || null, transporte: transporte || null,
      instruccion: soloFicha
        ? "Al abrir el link se abre la ficha del modelo con la curva cargada; el cliente la agrega al pedido y luego envía."
        : "Al abrir el link, los modelos quedan cargados en 'Tu pedido' con la curva indicada, el RUT verificado y el transporte; el cliente solo revisa y presiona Enviar pedido.",
    }),
  };
};
