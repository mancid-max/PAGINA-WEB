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
  /* atributos que ya trae la web, como respaldo de los de BI */
  let webTipo = null, webTiro = null, webCorte = null;
  if (es44) {
    const m = (await modelos44())[family];
    if (!m) return { ok: false, codigo: family, coleccion: "Cole 44", mensaje: "Ese código no está en el catálogo Dolce Vita 44." };
    nombre = m.nombre; precio = m.precio; seccion = SECCIONES_44[m.sec] || m.sec;
    detalle = m.tipo === "chaqueta" ? "Chaqueta" : "Jean";
    webTipo = m.tipo === "chaqueta" ? "chaqueta" : "jean"; webCorte = m.sec || null;
  } else {
    const item = (Array.isArray(cat) ? cat : []).find((p) => String(p.family).toUpperCase() === family);
    if (!item) return { ok: false, codigo: family, coleccion: `Cole ${cole}`, mensaje: `Ese código no está en el catálogo Cole ${cole}.` };
    const partes = [item.tipo, item.tiro ? `tiro ${item.tiro}` : "", item.bota ? `bota ${item.bota}` : ""].filter(Boolean);
    detalle = partes.join(" · ") || String(item.description || "").replace(/\?/g, "·");
    nombre = item.bota ? item.bota.charAt(0).toUpperCase() + item.bota.slice(1).toLowerCase() : `Modelo ${base4}`;
    webTipo = item.tipo ? String(item.tipo).toLowerCase() : null; webTiro = item.tiro ? String(item.tiro).toLowerCase() : null; webCorte = item.bota ? String(item.bota).toLowerCase() : null;
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

  /* Tipo, tiro y corte: primero BI (atributos-modelos.json, subcategoría de Adecom), después lo que trae la web.
     Se entrega también una frase lista (descripcion_corta) y la ficha completa de una línea (ficha_texto)
     para que Sofía la mande tal cual debajo de la foto. */
  const atrs = await getJson("/atributos-modelos.json").then((a) => a.modelos || {}).catch(() => ({}));
  const bi = atrs[family] || atrs[base4] || {};
  const tipo = bi.tipo || webTipo || (es44 ? "jean" : null);
  const tiro = bi.tiro || webTiro || null;
  const corte = bi.corte || webCorte || null;
  const tipoTxt = tipo ? tipo.charAt(0).toUpperCase() + tipo.slice(1) : "Modelo";
  const rasgos = [tiro ? `tiro ${tiro}` : null, corte ? `corte ${corte}` : null].filter(Boolean).join(" · ");
  const descripcion_corta = rasgos ? `${tipoTxt} ${rasgos}` : tipoTxt; // ej. "Jean tiro alto · corte flare"
  const precioCorto = precio == null ? "precio a consultar" : es44 ? `${clp(precio)} c/u IVA incl.` : `${clp(precio)} sin IVA`;
  /* Ficha en varias lineas (se lee mejor en el celular); en Cole 40-43 cada talla va en su linea */
  const lineasStock = es44 ? [estado] : (total > 0 ? [`Stock: ${total} unidades`, ...conStock.map((s) => `  ${s}`)] : ["Agotado"]);
  const ficha_texto = [
    `${family}${es44 && nombre ? ` ${nombre}` : ""} · ${es44 ? "Dolce Vita 44" : `Cole ${cole}`}`,
    descripcion_corta,
    precioCorto,
    ...lineasStock,
  ].join("\n");

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
    tipo: tipo || undefined,
    tiro: tiro || undefined,
    corte: corte || undefined,
    descripcion_corta,
    ficha_texto,
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

/* Búsqueda por atributos: "quiero pitillos", "tiro alto", "flare de la 44".
   Cruza atributos-modelos.json (BI) con los catálogos de la web y el stock; devuelve solo modelos con stock
   (Cole 40-43) o con estado (Cole 44), cada uno con su ficha_texto lista. */
const SINONIMOS_CORTE = { skinny: "pitillo", pitillos: "pitillo", acampanado: "flare", acampanados: "flare", campana: "flare", rectos: "recto", ancho: "wide leg", anchos: "wide leg", palazzos: "palazzo", oxfords: "oxford", tobilleros: "tobillero", tobillo: "tobillero", cropped: "cropped", crop: "cropped", mom: "mom", balloon: "balloon", bootcut: "bootcut", "boot cut": "bootcut" };
const SINONIMOS_TIRO = { cintura: "alto", alta: "alto", altos: "alto", "high waist": "alto", medios: "medio", media: "medio", bajos: "bajo", baja: "bajo", cadera: "bajo" };
const normAttr = (v, dic) => { let s = String(v || "").trim().toLowerCase().replace(/^tiro\s+/, "").replace(/^corte\s+/, ""); if (!s) return null; return dic[s] || s; };

async function buscarPorAtributos({ corte, tiro, tipo, cole }) {
  const qCorte = normAttr(corte, SINONIMOS_CORTE), qTiro = normAttr(tiro, SINONIMOS_TIRO), qTipo = normAttr(tipo, {});
  if (!qCorte && !qTiro && !qTipo) return { ok: false, mensaje: "Indica corte (pitillo, flare, recto, palazzo, oxford, wide leg…) o tiro (alto, medio, bajo)." };
  const atrs = await getJson("/atributos-modelos.json").then((a) => a.modelos || {}).catch(() => ({}));
  const coleQ = cole ? String(cole).replace(/\D/g, "") : "";
  const coles = coleQ ? [coleQ] : ["44", "43", "42", "41", "40"];
  const calza = (bi, fallbackCorte, fallbackTipo) => {
    const co = String(bi.corte || fallbackCorte || "").toLowerCase(), ti = String(bi.tiro || "").toLowerCase(), tp = String(bi.tipo || fallbackTipo || "").toLowerCase();
    if (qCorte && !co.includes(qCorte)) return false;
    if (qTiro && ti !== qTiro) return false;
    if (qTipo && !tp.includes(qTipo)) return false;
    return { co: co || null, ti: ti || null, tp: tp || null };
  };
  const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "Modelo");
  const res = [];
  for (const c of coles) {
    if (c === "44") {
      const map = await modelos44();
      const stock = await getJson("/stock-data-catalogo-44.json");
      for (const [codigo, m] of Object.entries(map)) {
        const bi = atrs[codigo] || atrs[codigo.slice(0, 4)] || {};
        const ok = calza(bi, m.sec, m.tipo === "chaqueta" ? "chaqueta" : "jean");
        if (!ok) continue;
        const total = Number(((stock.items || {})[codigo] || {}).total) || 0;
        const estado = total > 30 ? "Disponible" : "En producción";
        const desc = [cap(ok.tp || "jean"), ok.ti ? `tiro ${ok.ti}` : null, ok.co ? `corte ${ok.co}` : null].filter(Boolean).join(" · ").replace(" · tiro", " tiro");
        /* orden: primero la Dolce Vita disponible (es la novedad), después colecciones anteriores por stock, al final la 44 en producción */
        /* ficha vertical, igual que la consulta por código (una cosa por línea) */
        const ficha = [`${codigo} ${m.nombre} · Dolce Vita 44`, desc, m.precio == null ? "precio a consultar" : `${clp(m.precio)} c/u IVA incl.`, estado === "Disponible" ? "Disponible (despacho inmediato)" : "En producción (10 a 15 días, se puede reservar)"].join("\n");
        res.push({ codigo, nombre: m.nombre, coleccion: "Dolce Vita · Cole 44", tiro: ok.ti, corte: ok.co, precio: m.precio, estado, ficha_texto: ficha, _orden: total > 30 ? 3 : 1, _total: total });
      }
    } else {
      const cat = await getJson(`/data-catalogo-${c}.json`).catch(() => []);
      const stock = await getJson("/stock-data-catalogo-43.json");
      const precios = c === "43" ? await getJson("/price-data-catalogo-43.json").catch(() => ({})) : await getJson("/price-data.json").catch(() => ({}));
      const pit = precios.items || precios;
      for (const item of (Array.isArray(cat) ? cat : [])) {
        const codigo = String(item.family || "").toUpperCase();
        const st = (stock.items || {})[codigo]; const total = st ? Number(st.total) || 0 : 0;
        if (total <= 0) continue;
        const bi = atrs[codigo] || atrs[codigo.slice(0, 4)] || {};
        const ok = calza(bi, item.bota, item.tipo);
        if (!ok) continue;
        const tallas = Object.entries(st.sizes || {}).filter(([, n]) => Number(n) > 0).map(([t, n]) => `${t}: ${n}`);
        const precio = pit[codigo] ?? pit[codigo.slice(0, 4)] ?? null;
        const desc = [cap(ok.tp || "jean"), ok.ti ? `tiro ${ok.ti}` : null, ok.co ? `corte ${ok.co}` : null].filter(Boolean).join(" · ").replace(" · tiro", " tiro");
        const ficha = [`${codigo} · Cole ${c}`, desc, precio == null ? "precio a consultar" : `${clp(precio)} sin IVA`, `Stock: ${total} unidades`, ...tallas.map((t) => `  ${t}`)].join("\n");
        res.push({ codigo, nombre: `Modelo ${codigo.slice(0, 4)}`, coleccion: `Cole ${c}`, tiro: ok.ti, corte: ok.co, precio, estado: "Disponible", stock_total: total, tallas_con_stock: tallas, ficha_texto: ficha, _orden: 2, _total: total });
      }
    }
  }
  res.sort((a, b) => b._orden - a._orden || b._total - a._total);
  const resultados = res.slice(0, 8).map(({ _orden, _total, ...r }) => r);
  const que = [qTipo, qTiro ? `tiro ${qTiro}` : null, qCorte ? `corte ${qCorte}` : null].filter(Boolean).join(" ");
  if (!resultados.length) return { ok: false, mensaje: `No tengo modelos con stock que calcen con "${que}"${coleQ ? ` en la Cole ${coleQ}` : ""}. Ofrece un corte o tiro parecido.` };
  /* lista_texto: los primeros 5 con su ficha completa, listos para mandar tal cual en un mensaje */
  const lista = resultados.slice(0, 5).map((r) => r.ficha_texto).join("\n\n") + (res.length > 5 ? `\n\n… y ${res.length - 5} más. ¿Quieres verlos?` : "");
  return { ok: true, busqueda: que, total_encontrados: res.length, resultados, lista_texto: lista, nota: res.length > 8 ? `Hay ${res.length} en total; devuelvo los 8 con más stock y lista_texto trae los 5 primeros.` : undefined };
}

exports.handler = async function (event) {
  const headers = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" };
  try {
    const qs = event.queryStringParameters || {};
    let body = {};
    if (event.httpMethod === "POST" && event.body) { try { body = JSON.parse(event.body); } catch (_) {} }
    const codigoRaw = qs.codigo || body.codigo || "";
    const q = qs.q || body.q || "";
    const corte = qs.corte || body.corte || "", tiro = qs.tiro || body.tiro || "", tipo = qs.tipo || body.tipo || "", cole = qs.cole || body.cole || "";

    let out;
    if (!codigoRaw && (corte || tiro || tipo)) {
      out = await buscarPorAtributos({ corte, tiro, tipo, cole });
    } else if (codigoRaw) {
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
