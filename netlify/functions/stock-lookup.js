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
/* El cliente escribe sin tildes ("monaco", "lumiere") y con espacios o guiones sueltos ("wide leg", "wide-leg") */
const sinTildes = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "");
const normTexto = (s) => sinTildes(s).toLowerCase().trim();
const normClave = (s) => normTexto(s).replace(/[\s_-]+/g, " ").trim();

/* Todos los códigos de un mismo modelo base: 4234 → ["4234-04","4234-08",…] */
async function variantesDe(base4, cole) {
  const es44 = cole === "44";
  if (es44) return Object.keys(await modelos44()).filter((c) => c.startsWith(base4 + "-"));
  const cat = await getJson(`/data-catalogo-${cole}.json`).catch(() => []);
  const items = Array.isArray(cat) ? cat : cat.items || [];
  return items.map((p) => String(p.family || "").toUpperCase()).filter((c) => c.startsWith(base4 + "-"));
}

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
    webTipo = m.tipo === "chaqueta" ? "chaqueta" : "jean";
    webCorte = m.tipo === "chaqueta" ? null : (m.sec || null); /* una chaqueta no tiene "corte chaquetas" */
  } else {
    const item = (Array.isArray(cat) ? cat : []).find((p) => String(p.family).toUpperCase() === family);
    if (!item) return { ok: false, codigo: family, coleccion: `Cole ${cole}`, mensaje: `Ese código no está en el catálogo Cole ${cole}.` };
    /* Sin foto la página no muestra el modelo: no ofrecerlo (el link abriría el catálogo sin él) */
    if (!item.main_image) return { ok: false, codigo: family, coleccion: `Cole ${cole}`, mensaje: `El ${family} tiene stock pero aún no está publicado en la página (sin foto). No lo ofrezcas; si el cliente lo pide, dile que un ejecutivo se lo cotiza.` };
    const partes = [item.tipo, item.tiro ? `tiro ${item.tiro}` : "", item.bota ? `bota ${item.bota}` : ""].filter(Boolean);
    detalle = partes.join(" · ") || String(item.description || "").replace(/\?/g, "·");
    nombre = item.bota ? item.bota.charAt(0).toUpperCase() + item.bota.slice(1).toLowerCase() : `Modelo ${base4}`;
    webTipo = item.tipo ? String(item.tipo).toLowerCase() : null; webTiro = item.tiro ? String(item.tiro).toLowerCase() : null; webCorte = item.bota ? String(item.bota).toLowerCase() : null;
    const precios = cole === "43" ? await getJson("/price-data-catalogo-43.json") : await getJson("/price-data.json");
    const pit = precios.items || precios;
    /* mismos candidatos que usa la web: el código exacto, los 4 dígitos y el -00 del modelo base */
    precio = pit[family] ?? pit[base4] ?? pit[`${base4}-00`] ?? null;
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
  const esChaqueta = String(tipo || "").includes("chaqueta");
  const tiro = esChaqueta ? null : (bi.tiro || webTiro || null);
  const corte = esChaqueta ? null : (bi.corte || webCorte || null);
  const tipoTxt = tipo ? tipo.charAt(0).toUpperCase() + tipo.slice(1) : "Modelo";
  const rasgos = esChaqueta
    ? "tallas S a XL"
    : [tiro ? `tiro ${tiro}` : null, corte ? `corte ${corte}` : null].filter(Boolean).join(" · ");
  const descripcion_corta = esChaqueta ? `${tipoTxt} · ${rasgos}` : (rasgos ? `${tipoTxt} ${rasgos}` : tipoTxt); // ej. "Jean tiro alto · corte flare"
  const precioCorto = precio == null ? "precio a consultar" : `${clp(precio)} + IVA`; /* el precio de lista es neto en las dos colecciones */
  /* Ficha en varias lineas (se lee mejor en el celular); en Cole 40-43 cada talla va en su linea */
  /* La 44 no muestra cantidades: solo si sale al tiro o si hay que esperar la producción (mismo texto que la lista por estilo) */
  const estado44 = disponible ? "Disponible (despacho inmediato)" : "En producción (10 a 15 días, se puede reservar)";
  const lineasStock = es44 ? [estado44] : (total > 0 ? [`Stock: ${total} unidades`, ...conStock.map((s) => `  ${s}`)] : ["Agotado"]);
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
    precio_texto: precio == null ? "Precio a consultar" : `${clp(precio)} por unidad + IVA`,
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

/* Variantes de un mismo modelo, cada una con su ficha completa (reusa consultarCodigo para no repetir formato) */
async function fichasDeVariantes(base4, cole, { soloConStock = false } = {}) {
  const codigos = (await variantesDe(base4, cole)).slice(0, 8);
  const fichas = [];
  for (const c of codigos) {
    const r = await consultarCodigo(c).catch(() => null);
    if (!r || !r.ok) continue;
    if (soloConStock && cole !== "44" && !(Number(r.stock_total) > 0)) continue;
    fichas.push(r);
  }
  return fichas.sort((a, b) => (Number(b.stock_total) || 0) - (Number(a.stock_total) || 0));
}
const resumenVariante = (r) => ({ codigo: r.codigo, nombre: r.nombre, coleccion: r.coleccion, precio: r.precio, estado: r.estado, stock_total: r.stock_total, tallas_con_stock: r.tallas_con_stock, ficha_texto: r.ficha_texto });

/* El cliente casi siempre dice los 4 dígitos ("el 4234"). Si ese modelo no tiene variante -00, o el -00
   está agotado pero otra variante del mismo modelo sí tiene stock, se le muestran las variantes. */
async function consultarCodigoConVariantes(family) {
  const cole = family.slice(0, 2);
  const base4 = family.slice(0, 4);
  const out = await consultarCodigo(family);

  if (out.ok === false && /no está en el catálogo/i.test(String(out.mensaje || ""))) {
    const fichas = await fichasDeVariantes(base4, cole).catch(() => []);
    if (fichas.length === 1) return fichas[0];
    if (fichas.length > 1) {
      /* lista_texto va primero: es lo que Sofía debe mandar tal cual (un modelo por bloque) */
      return {
        ok: true, busqueda: `modelo ${base4}`, total_encontrados: fichas.length,
        lista_texto: fichas.map((f) => f.ficha_texto).join("\n\n"),
        nota: `El modelo ${base4} viene en ${fichas.length} variantes. Manda lista_texto tal cual y pregunta cuál quiere.`,
        resultados: fichas.map(resumenVariante),
      };
    }
    return out;
  }

  /* -00 existe pero agotado: avisar de las variantes que sí tienen stock */
  if (out.ok === true && cole !== "44" && !(Number(out.stock_total) > 0)) {
    const conStock = (await fichasDeVariantes(base4, cole, { soloConStock: true }).catch(() => []))
      .filter((f) => f.codigo !== family);
    if (conStock.length) {
      out.variantes_con_stock = conStock.map(resumenVariante);
      out.lista_texto = conStock.map((f) => f.ficha_texto).join("\n\n");
      out.nota = `El ${family} está agotado, pero el mismo modelo tiene ${conStock.length === 1 ? "otra variante" : `${conStock.length} variantes`} con stock: ${conStock.map((f) => f.codigo).join(", ")}. Ofrécesela.`;
      out.ficha_texto = `${out.ficha_texto}\n\nDel mismo modelo sí tengo:\n\n${out.lista_texto}`;
    }
  }
  return out;
}

async function buscarNombre(q) {
  const term = normTexto(q);
  if (term.length < 2) return { ok: false, mensaje: "Indica al menos 2 letras del nombre o el código." };
  const map = await modelos44();
  const coincide = Object.entries(map).filter(([, m]) => normTexto(m.nombre).includes(term));
  if (!coincide.length) return { ok: false, mensaje: `No encontré modelos Cole 44 con "${q}". Pide el código de 4 dígitos.` };
  /* ficha completa de cada uno (igual que al consultar por código), lista para mandar tal cual */
  const fichas = [];
  for (const [codigo] of coincide.slice(0, 6)) {
    const r = await consultarCodigo(codigo).catch(() => null);
    if (r && r.ok) fichas.push(r);
  }
  if (!fichas.length) return { ok: false, mensaje: `No encontré modelos Cole 44 con "${q}". Pide el código de 4 dígitos.` };
  if (fichas.length === 1) return fichas[0];
  return {
    ok: true, coleccion: "Dolce Vita · Cole 44", busqueda: q, total_encontrados: fichas.length,
    lista_texto: fichas.map((f) => f.ficha_texto).join("\n\n"),
    resultados: fichas.map(resumenVariante),
  };
}

/* Búsqueda por atributos: "quiero pitillos", "tiro alto", "flare de la 44".
   Cruza atributos-modelos.json (BI) con los catálogos de la web y el stock; devuelve solo modelos con stock
   (Cole 40-43) o con estado (Cole 44), cada uno con su ficha_texto lista. */
const SINONIMOS_CORTE = { skinny: "pitillo", skinnys: "pitillo", pitillos: "pitillo", chupin: "pitillo", chupines: "pitillo", acampanado: "flare", acampanados: "flare", campana: "flare", flares: "flare", recta: "recto", rectos: "recto", ancho: "wide leg", anchos: "wide leg", anchas: "wide leg", wideleg: "wide leg", "wide legs": "wide leg", palazzos: "palazzo", oxfords: "oxford", tobilleros: "tobillero", tobillo: "tobillero", cropped: "cropped", crop: "cropped", crops: "cropped", moms: "mom", "mom fit": "mom", balloons: "balloon", globo: "balloon", bootcut: "bootcut", "boot cut": "bootcut", baggy: "baggy", bagui: "baggy", cargo: "cargo" };
const SINONIMOS_TIRO = { cintura: "alto", alta: "alto", altos: "alto", "high waist": "alto", "highwaist": "alto", "cintura alta": "alto", "tiro alto": "alto", "talle alto": "alto", medios: "medio", media: "medio", "tiro medio": "medio", bajos: "bajo", baja: "bajo", cadera: "bajo", "cintura baja": "bajo", "tiro bajo": "bajo" };
const normAttr = (v, dic) => { let s = normClave(v).replace(/^tiro\s+/, "").replace(/^corte\s+/, ""); if (!s) return null; return dic[s] || s; };

async function buscarPorAtributos({ corte, tiro, tipo, cole, desde, soloDisponible }) {
  let qCorte = normAttr(corte, SINONIMOS_CORTE), qTiro = normAttr(tiro, SINONIMOS_TIRO);
  const qTipo = normAttr(tipo, {});
  /* "cintura alta" suele venir en corte: si es un tiro, se mueve al campo que corresponde */
  if (qCorte && !qTiro) {
    const comoTiro = SINONIMOS_TIRO[normClave(corte).replace(/^corte\s+/, "")] || (["alto", "medio", "bajo"].includes(qCorte) ? qCorte : null);
    if (comoTiro) { qTiro = comoTiro; qCorte = null; }
  }
  /* Con solo la colección (ej. "qué tienes de la Cole 42") se listan sus modelos con stock */
  if (!qCorte && !qTiro && !qTipo && !coleQ) return { ok: false, mensaje: "Indica corte (pitillo, flare, recto, palazzo, oxford, wide leg…), tiro (alto, medio, bajo) o colección (40 a 44)." };
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
  /* "Jean tiro alto · corte pitillo"; las chaquetas no tienen tiro ni corte, van por talla S a XL */
  const descDe = (ok) => {
    const tp = String(ok.tp || "jean");
    if (tp.includes("chaqueta")) return `${cap(tp)} · tallas S a XL`;
    return [cap(tp), ok.ti ? `tiro ${ok.ti}` : null, ok.co ? `corte ${ok.co}` : null].filter(Boolean).join(" · ").replace(" · tiro", " tiro");
  };
  let res = [];
  for (const c of coles) {
    if (c === "44") {
      const map = await modelos44();
      const stock = await getJson("/stock-data-catalogo-44.json");
      for (const [codigo, m] of Object.entries(map)) {
        const bi = atrs[codigo] || atrs[codigo.slice(0, 4)] || {};
        const esChaq = m.tipo === "chaqueta";
        const ok = calza(bi, esChaq ? null : m.sec, esChaq ? "chaqueta" : "jean");
        if (!ok) continue;
        const total = Number(((stock.items || {})[codigo] || {}).total) || 0;
        const estado = total > 30 ? "Disponible" : "En producción";
        const desc = descDe(ok);
        /* orden: primero la Dolce Vita disponible (es la novedad), después colecciones anteriores por stock, al final la 44 en producción */
        /* ficha vertical, igual que la consulta por código (una cosa por línea) */
        const ficha = [`${codigo} ${m.nombre} · Dolce Vita 44`, desc, m.precio == null ? "precio a consultar" : `${clp(m.precio)} + IVA`, estado === "Disponible" ? "Disponible (despacho inmediato)" : "En producción (10 a 15 días, se puede reservar)"].join("\n");
        res.push({ codigo, nombre: m.nombre, coleccion: "Dolce Vita · Cole 44", tiro: ok.ti, corte: ok.co, precio: m.precio, estado, ficha_texto: ficha, _orden: total > 30 ? 3 : 1, _total: total });
      }
    } else {
      const cat = await getJson(`/data-catalogo-${c}.json`).catch(() => []);
      const stock = await getJson("/stock-data-catalogo-43.json");
      const precios = c === "43" ? await getJson("/price-data-catalogo-43.json").catch(() => ({})) : await getJson("/price-data.json").catch(() => ({}));
      const pit = precios.items || precios;
      for (const item of (Array.isArray(cat) ? cat : [])) {
        const codigo = String(item.family || "").toUpperCase();
        if (!item.main_image) continue; /* sin foto no se muestra en la página: no se ofrece */
        const st = (stock.items || {})[codigo]; const total = st ? Number(st.total) || 0 : 0;
        if (total <= 0) continue;
        const bi = atrs[codigo] || atrs[codigo.slice(0, 4)] || {};
        const ok = calza(bi, item.bota, item.tipo);
        if (!ok) continue;
        const tallas = Object.entries(st.sizes || {}).filter(([, n]) => Number(n) > 0).map(([t, n]) => `${t}: ${n}`);
        /* mismos candidatos que la busqueda por codigo: exacto, 4 digitos y el -00 del modelo base */
        const precio = pit[codigo] ?? pit[codigo.slice(0, 4)] ?? pit[`${codigo.slice(0, 4)}-00`] ?? null;
        const desc = descDe(ok);
        const ficha = [`${codigo} · Cole ${c}`, desc, precio == null ? "precio a consultar" : `${clp(precio)} + IVA`, `Stock: ${total} unidades (${tallas.length} tallas)`].join("\n"); /* en la lista va solo el total: el detalle por talla se pide por código */
        res.push({ codigo, nombre: `Modelo ${codigo.slice(0, 4)}`, coleccion: `Cole ${c}`, tiro: ok.ti, corte: ok.co, precio, estado: "Disponible", stock_total: total, tallas_con_stock: tallas, ficha_texto: ficha, _orden: 2, _total: total });
      }
    }
  }
  /* "con despacho inmediato": deja fuera lo que está En producción (la 44) y lo agotado */
  if (soloDisponible) {
    const antes = res.length;
    res = res.filter((r) => r.estado === "Disponible");
    if (!res.length) return { ok: false, mensaje: `Con despacho inmediato no tengo nada que calce con esa búsqueda (sí hay ${antes} que llegan en 10 a 15 días). Ofrécele esos o algo parecido disponible.` };
  }
  res.sort((a, b) => b._orden - a._orden || b._total - a._total);
  /* de a 5 modelos por tanda: 'desde' es el índice donde sigue la lista si el cliente pide ver más */
  const inicio = Math.max(0, Math.min(Number(desde) || 0, Math.max(0, res.length - 1)));
  const tanda = res.slice(inicio, inicio + 5);
  const resultados = tanda.map(({ _orden, _total, ...r }) => r);
  const que = [qTipo, qTiro ? `tiro ${qTiro}` : null, qCorte ? `corte ${qCorte}` : null].filter(Boolean).join(" ");
  if (!resultados.length) return { ok: false, mensaje: `No tengo modelos con stock que calcen con "${que}"${coleQ ? ` en la Cole ${coleQ}` : ""}. Ofrece un corte o tiro parecido.` };
  const quedan = Math.max(0, res.length - (inicio + tanda.length));
  /* lista_texto: hasta 5 modelos con su ficha completa, listos para mandar tal cual en un mensaje */
  const lista = resultados.map((r) => r.ficha_texto).join("\n\n") + (quedan ? `\n\n… y ${quedan} más. ¿Quieres verlos?` : "");
  /* lista_texto va antes que resultados: es lo que Sofía manda tal cual (un modelo por bloque, una línea por dato) */
  return { ok: true, busqueda: que, total_encontrados: res.length, desde: inicio, siguiente_desde: quedan ? inicio + tanda.length : null, lista_texto: lista, nota: quedan ? `Hay ${res.length} que calzan y te mandé ${tanda.length}. Manda lista_texto TAL CUAL (va el stock total de cada uno; si quiere las tallas de uno, consúltalo por código). Si quiere ver los demás, vuelve a llamarme con desde=${inicio + tanda.length}.` : "Manda lista_texto TAL CUAL, sin resumir.", resultados };
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
    if (!codigoRaw && (corte || tiro || tipo || cole)) {
      const dispRaw = String(qs.disponible ?? body.disponible ?? "").toLowerCase();
      out = await buscarPorAtributos({ corte, tiro, tipo, cole, desde: qs.desde || body.desde || 0, soloDisponible: dispRaw === "true" || dispRaw === "1" || dispRaw === "si" || dispRaw === "sí" });
    } else if (codigoRaw) {
      const family = normalizarCodigo(codigoRaw);
      out = family ? await consultarCodigoConVariantes(family) : { ok: false, mensaje: `Código inválido: ${codigoRaw}. Usa 4 dígitos (ej. 4401) o 4401-00.` };
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
