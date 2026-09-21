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

/* Mínimos del pedido (los mismos que aplica la página al enviar) */
const MIN_TOTAL = 24;       /* unidades del pedido completo */
const MIN_POR_MODELO_44 = 12; /* Cole 44: por modelo */
const TALLAS_CHAQUETA = ["S", "M", "L", "XL"];
const TALLAS_JEAN = ["36", "38", "40", "42", "44", "46", "48", "50", "52"];

const leerJson = async (ruta) => {
  const t = await fetch(`${BASE}${ruta}`, { headers: { "Cache-Control": "no-cache" } }).then((r) => (r.ok ? r.text() : ""));
  if (!t) return null;
  try { return JSON.parse(t.replace(/^﻿/, "")); } catch (_) { return null; }
};

/* Códigos válidos: Cole 44 desde catalogo-44/app.js (con su tipo), Cole 40-43 desde data-catalogo-4X.json */
async function catalogo44() {
  const src = await fetch(`${BASE}/catalogo-44/app.js`, { headers: { "Cache-Control": "no-cache" } }).then((r) => (r.ok ? r.text() : ""));
  const map = {};
  const re = /\{nombre:"([^"]+)",\s*codigo:"([^"]+)",\s*precio:(null|\d+),[^}]*?tipo:"([^"]+)"/g;
  let m;
  while ((m = re.exec(src))) map[m[2].toUpperCase()] = { nombre: m[1], tipo: m[4] };
  return map;
}
async function codigos4043() {
  const set = new Set();
  for (const c of ["40", "41", "42", "43"]) {
    const d = await leerJson(`/data-catalogo-${c}.json`);
    const items = Array.isArray(d) ? d : (d && d.items) || [];
    for (const p of items) { const f = String(p.family || "").toUpperCase(); if (f) set.add(f); }
  }
  return set;
}

/* RUT chileno: dígito verificador */
function rutValido(norm) {
  const m = /^(\d{7,8})-([0-9K])$/.exec(String(norm || "").toUpperCase());
  if (!m) return false;
  let suma = 0, mul = 2;
  for (const d of m[1].split("").reverse()) { suma += Number(d) * mul; mul = mul === 7 ? 2 : mul + 1; }
  const res = 11 - (suma % 11);
  const dv = res === 11 ? "0" : res === 10 ? "K" : String(res);
  return dv === m[2];
}

/* "36=2.38=3" → { "36": 2, "38": 3 } y de vuelta */
const specAObjeto = (spec) => {
  const o = {};
  for (const par of String(spec || "").split(".")) {
    const [t, q] = par.split("=");
    const talla = String(t || "").trim().toUpperCase();
    const n = Number(q) || 0;
    if (talla && n > 0) o[talla] = (o[talla] || 0) + n;
  }
  return o;
};
const objetoASpec = (o) => Object.entries(o).map(([t, n]) => `${t}=${n}`).join(".");
const unidades = (o) => Object.values(o).reduce((a, b) => a + b, 0);

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

  const error = (mensaje, extra) => ({ statusCode: 200, headers, body: JSON.stringify({ ok: false, mensaje, ...(extra || {}) }) });

  /* Un modelo repetido en el mismo link se suma en vez de pisarse */
  const porCodigo = new Map();
  const crudos = itemsRaw
    ? itemsRaw.split(",").map((par) => { const [c, ...r] = par.split(":"); return { cod: normCod(c), spec: r.join(":") }; })
    : (modelo ? [{ cod: modelo, spec: curva }] : []);
  for (const { cod, spec } of crudos) {
    if (!cod) continue;
    const cv = specAObjeto(specCurva(spec, cod));
    const acum = porCodigo.get(cod) || {};
    for (const [t, n] of Object.entries(cv)) acum[t] = (acum[t] || 0) + n;
    porCodigo.set(cod, acum);
  }
  if (!porCodigo.size) return error("Indica items (ej. 4448-00:12) o modelo.");

  const items = [...porCodigo].map(([cod, cv]) => `${cod}:${objetoASpec(cv)}`);
  const fuera = [...porCodigo.keys()].filter((c) => !/^4[0-4]$/.test(c.slice(0, 2)));
  if (fuera.length) return error(`${fuera.join(", ")} no pertenece a las colecciones vigentes (Cole 40 a 44). Confirma el código con consultar_stock.`, { codigos_desconocidos: fuera });
  const coles = new Set(items.map((i) => i.slice(0, 2)));
  /* Desde el 2026-09-21 se puede mezclar: si hay algún modelo de la 44 el link abre catalogo-44, cuyo
     carrito acepta también los de la 40-43 (por dentro se registran como dos pedidos, uno por colección). */
  const es44 = coles.has("44");
  const hay4043 = [...coles].some((c) => /^4[0-3]$/.test(c));
  const mixto = es44 && hay4043;

  /* 1) que los códigos existan en el catálogo */
  const desconocidos = [];
  let cat44 = null;
  if (es44) {
    cat44 = await catalogo44().catch(() => null);
    if (cat44 && Object.keys(cat44).length) for (const cod of porCodigo.keys()) if (cod.startsWith("44") && !cat44[cod]) desconocidos.push(cod);
  }
  if (hay4043) {
    const validos = await codigos4043().catch(() => null);
    if (validos && validos.size) for (const cod of porCodigo.keys()) if (!cod.startsWith("44") && !validos.has(cod)) desconocidos.push(cod);
  }
  if (desconocidos.length) {
    return error(`${desconocidos.join(", ")} no ${desconocidos.length === 1 ? "es un código" : "son códigos"} de ${es44 ? "la Dolce Vita 44" : "las colecciones 40 a 43"}. Confirma el código con consultar_stock antes de armar el link.`, { codigos_desconocidos: desconocidos });
  }

  /* 2) RUT: si viene, tiene que ser válido (la página lo rechaza y el pedido no se puede enviar) */
  if (rut && !rutValido(rut)) {
    return error(`El RUT "${qs.rut || body.rut}" no es válido (dígito verificador). Pídeselo de nuevo al cliente, con el formato 12.345.678-9.`);
  }

  /* 3) tallas y mínimos (los mismos que exige la página al apretar Enviar) */
  if (!soloFicha) {
    const problemas = [];
    for (const [cod, cv] of porCodigo) {
      const esChaqueta = cod.startsWith("44") && cat44 && cat44[cod] ? cat44[cod].tipo === "chaqueta" : CHAQUETAS.test(cod);
      const permitidas = esChaqueta ? TALLAS_CHAQUETA : TALLAS_JEAN;
      const malas = Object.keys(cv).filter((t) => !permitidas.includes(t));
      if (malas.length) problemas.push(`${cod}: ${malas.join(", ")} no ${malas.length === 1 ? "es una talla" : "son tallas"} de este modelo (usa ${permitidas.join(", ")}).`);
      if (cod.startsWith("44") && unidades(cv) < MIN_POR_MODELO_44) problemas.push(`${cod}: ${unidades(cv)} unidades; en la Dolce Vita 44 el mínimo es ${MIN_POR_MODELO_44} por modelo.`);
    }
    if (problemas.length) return error(`No armé el link porque la página lo va a rechazar:\n${problemas.join("\n")}`, { problemas });

    const total = [...porCodigo.values()].reduce((a, cv) => a + unidades(cv), 0);
    if (total < MIN_TOTAL) {
      return error(`El pedido suma ${total} unidades y el mínimo es ${MIN_TOTAL}. Faltan ${MIN_TOTAL - total}: agrega más unidades o otro modelo y vuelve a armar el link.`, { total_unidades: total, minimo: MIN_TOTAL });
    }
  }

  /* 4) Cole 40-43: las tallas tienen que tener stock real (también dentro de un link mixto) */
  if (hay4043) {
    const errores = await validarStock4043(items.filter((i) => !i.startsWith("44")));
    if (errores.length) {
      return error(`No se armó el link porque hay tallas sin stock. Corrige usando solo estas tallas y vuelve a llamar:\n${errores.join("\n")}`, { errores });
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
      ok: true, url, pagina: mixto ? "Dolce Vita 44 + Cole 40-43 (un solo carrito)" : es44 ? "Dolce Vita · Cole 44" : "Cole 40-43", items, rut: rut || null, transporte: transporte || null,
      instruccion: soloFicha
        ? "Al abrir el link se abre la ficha del modelo con la curva cargada; el cliente la agrega al pedido y luego envía."
        : "Al abrir el link, los modelos quedan cargados en 'Tu pedido' con la curva indicada, el RUT verificado y el transporte; el cliente solo revisa y presiona Enviar pedido.",
    }),
  };
};
