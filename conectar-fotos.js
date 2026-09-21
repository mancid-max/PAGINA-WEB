/* Conecta a la página los modelos Cole 40-43 que tienen stock y carpeta de fotos en el proyecto
   pero no se muestran: no están en data-catalogo-4X.json, están con el código mal escrito
   ("4228" en vez de "4228-00") o su foto apunta a un archivo que nunca se publicó.

   - Carpeta del modelo: {cole}/{XXXX}[-VV], {cole}/{cole}/..., 41/41 toda/... Tolera nombres tipo
     "4234- 04", "4362 04 CAFE", "4232 hacer flare", "4339_". Sin variante = -00.
   - Fotos: subcarpeta editar/ si existe (versiones finales). Sin editar/, las de la raíz solo si son
     pocas (≤ MAX_CRUDAS): una carpeta con 50 tomas de cámara es una sesión sin seleccionar y se avisa.
   - Genera la versión web liviana junto a la foto (<nombre>-web.jpg, máx 1100 px, jpg 80 ≈ 60-100 KB)
     y la portada og/<codigo>.jpg (1200x1200) que usan los links de Sofía y el carrito mixto.
     Al repo solo van los -web.jpg y og/: las originales de 3-4 MB no se commitean.
   - La ficha lleva tipo/tiro/corte desde atributos-modelos.json (subcategoría de Adecom, vía BI);
     a las fichas que ya existen y no lo tienen, se les completa.
   - conectar-fotos.ignorar.json (opcional): ["4204-02", ...] códigos que no se deben crear aunque tengan stock y fotos.

   Uso: node conectar-fotos.js                     → simulación: lista lo que haría, no escribe nada
        node conectar-fotos.js --apply             → escribe fotos web, og y JSON; imprime "CAMBIO <ruta>" por cada
                                                     archivo que escribió (para commitearlo a mano)
        node conectar-fotos.js --apply --desde-sync → lo mismo, desde generate-stock-from-bi.ps1: además guarda las
                                                     rutas en .conectar-fotos.pendiente.json hasta que el push salga
                                                     bien (si el push falla, la corrida siguiente las vuelve a listar).
   Solo se listan como CAMBIO archivos escritos por este script: nunca cambios hechos a mano en el árbol. */
const fs = require("fs");
const path = require("path");

const RAIZ = __dirname;
const APLICAR = process.argv.includes("--apply");
const DESDE_SYNC = process.argv.includes("--desde-sync");
const MAX_FOTOS = 6;   /* fotos por ficha */
const MAX_CRUDAS = 8;  /* sin editar/: si la raíz tiene más fotos que esto, es una sesión sin seleccionar → no se publica */
const RAICES = { 40: ["40/40", "40"], 41: ["41/41 toda", "41"], 42: ["42", "42/42"], 43: ["43/43", "43"] };
const IGNORAR_DIR = new Set(["editar", "web", "videos", "__pycache__"]);
const PENDIENTES = ".conectar-fotos.pendiente.json";
const BOM = String.fromCharCode(0xfeff);

let sharp = null;
try { sharp = require("sharp"); } catch (_) { try { sharp = require(path.join(RAIZ, "node_modules", "sharp")); } catch (__) {} }

const sinBom = (s) => (s.startsWith(BOM) ? s.slice(1) : s);
const leerJson = (f) => JSON.parse(sinBom(fs.readFileSync(path.join(RAIZ, f), "utf8")));
const existe = (rel) => fs.existsSync(path.join(RAIZ, rel));
/* Se ignoran los archivos ocultos: "._Foto.jpg" son restos de macOS (AppleDouble), no imágenes. */
const esFoto = (f) => !f.startsWith(".") && /\.(jpe?g|png|webp)$/i.test(f) && !/-web\.jpg$/i.test(f);
const limpio = (f) => f.replace(/\.[a-z]+$/i, "").replace(/[^A-Za-z0-9_-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
const natural = (a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });

/* "4234- 04" → 4234-04 · "4362 04 CAFE" → 4362-04 · "4232 hacer flare" → 4232-00 · "4339_" → 4339-00 */
function codigoDeCarpeta(nombre) {
  const m = nombre.match(/^(\d{4})(?:\s*[-_\s]\s*(\d{2})(?!\d))?/);
  if (!m) return null;
  return `${m[1]}-${m[2] || "00"}`;
}

function fotosDe(dir) {
  try { return fs.readdirSync(dir).filter(esFoto).sort(natural); } catch (_) { return []; }
}

function subcarpetas(raiz) {
  const abs = path.join(RAIZ, raiz);
  try { return fs.readdirSync(abs).filter((d) => { try { return fs.statSync(path.join(abs, d)).isDirectory(); } catch (_) { return false; } }); } catch (_) { return []; }
}

/* Carpeta con fotos para un código: la de nombre exacto primero, después la que tenga editar/, después la que tenga más fotos. */
function carpetaPara(codigo) {
  const cole = codigo.slice(0, 2);
  const [base, variante] = codigo.split("-");
  const candidatas = [];
  for (const raiz of RAICES[cole] || [cole]) {
    for (const d of subcarpetas(raiz)) {
      if (IGNORAR_DIR.has(d.toLowerCase()) || codigoDeCarpeta(d) !== codigo) continue;
      const rel = `${raiz}/${d}`;
      const editar = fotosDe(path.join(RAIZ, rel, "editar"));
      const crudas = fotosDe(path.join(RAIZ, rel));
      if (!editar.length && !crudas.length) continue;
      const exacto = d === base || d === `${base}-${variante}` || (variante === "00" && d === `${base}-00`);
      candidatas.push({ rel, exacto, editar, crudas });
    }
  }
  candidatas.sort((a, b) => (b.exacto - a.exacto) || ((b.editar.length > 0) - (a.editar.length > 0)) || ((b.editar.length + b.crudas.length) - (a.editar.length + a.crudas.length)));
  return candidatas[0] || null;
}

/* Carpetas con fotos de otros colores del mismo modelo (mismos 4 dígitos), para avisar cuando falta la del color pedido. */
function carpetasDelModelo(codigo) {
  const cole = codigo.slice(0, 2), base = codigo.slice(0, 4);
  const out = [];
  for (const raiz of RAICES[cole] || [cole]) {
    for (const d of subcarpetas(raiz)) {
      const c = codigoDeCarpeta(d);
      if (!c || !c.startsWith(base) || c === codigo) continue;
      if (fotosDe(path.join(RAIZ, raiz, d, "editar")).length || fotosDe(path.join(RAIZ, raiz, d)).length) out.push(`${raiz}/${d}`);
    }
  }
  return out;
}

/* Fotos elegidas para una carpeta: editar/ si existe; si no, las crudas solo cuando son pocas. */
function fotosElegidas(carpeta) {
  if (carpeta.editar.length) return { fuente: `${carpeta.rel}/editar`, fotos: carpeta.editar.slice(0, MAX_FOTOS), origen: "editar" };
  if (carpeta.crudas.length > MAX_CRUDAS) return { fuente: carpeta.rel, fotos: [], origen: "crudas", motivo: `${carpeta.crudas.length} fotos crudas sin editar/: falta seleccionar` };
  return { fuente: carpeta.rel, fotos: carpeta.crudas.slice(0, MAX_FOTOS), origen: "crudas" };
}

/* Nombre web único dentro de la carpeta: "foto (1).png" y "foto 1.png" limpian igual, se les agrega -2, -3… */
function nombreWeb(dirRel, original, usados) {
  let base = limpio(original), n = 1, destino;
  do { destino = `${dirRel}/${base}${n > 1 ? `-${n}` : ""}-web.jpg`; n++; } while (usados.has(destino));
  usados.add(destino);
  return destino;
}

async function versionWeb(relOriginal, usados) {
  if (/-web\.jpg$/i.test(relOriginal)) return relOriginal; /* ya es versión web (generada por este script) */
  const destino = nombreWeb(path.posix.dirname(relOriginal), path.posix.basename(relOriginal), usados);
  if (APLICAR && !existe(destino)) {
    if (!sharp) throw new Error("sharp no disponible (npm i sharp)");
    await sharp(path.join(RAIZ, relOriginal)).rotate().resize(1100, null, { withoutEnlargement: true }).jpeg({ quality: 80, mozjpeg: true }).toFile(path.join(RAIZ, destino));
  }
  return destino;
}

async function portadaOg(codigo, relFoto) {
  const destino = `og/${codigo}.jpg`;
  if (APLICAR) {
    if (!sharp) throw new Error("sharp no disponible (npm i sharp)");
    fs.mkdirSync(path.join(RAIZ, "og"), { recursive: true });
    await sharp(path.join(RAIZ, relFoto)).rotate().resize(1200, 1200, { fit: "cover", position: "centre" }).jpeg({ quality: 82, mozjpeg: true }).toFile(path.join(RAIZ, destino));
  }
  return destino;
}

/* Versiones web + portada og de una lista de fotos. Una foto ilegible se salta; la portada sale de la primera que sirva. */
async function publicarFotos(codigo, fuente, fotos, cambios, errores) {
  const usados = new Set();
  const webs = [];
  let portada = null;
  for (const f of fotos) {
    try {
      const w = await versionWeb(`${fuente}/${f}`, usados);
      if (!portada) { cambios.add(await portadaOg(codigo, `${fuente}/${f}`)); portada = w; }
      webs.push(w); cambios.add(w);
    } catch (e) { errores.push(`${codigo}: ${fuente}/${f} ilegible (${e.message})`); }
  }
  return [...new Set(webs)];
}

function atributos(atrs, codigo) {
  const a = atrs[codigo] || atrs[codigo.slice(0, 4)] || {};
  return { tipo: a.tipo ? String(a.tipo).toUpperCase() : "", tiro: a.tiro ? String(a.tiro).toUpperCase() : "", bota: a.corte ? String(a.corte).toUpperCase() : "" };
}

function fichaNueva(codigo, gallery, atrs) {
  const { tipo, tiro, bota } = atributos(atrs, codigo);
  const partes = [tipo, tiro, bota].filter(Boolean);
  const ficha = {
    family: codigo,
    main_image: gallery[0],
    gallery,
    variants: [],
    description: partes.length ? partes.join(" · ") : `Modelo ${codigo}`,
    characteristics: [tipo && `Tipo: ${tipo}`, tiro && `Tiro: ${tiro}`, bota && `Bota: ${bota}`].filter(Boolean),
  };
  if (tipo) ficha.tipo = tipo;
  if (tiro) ficha.tiro = tiro;
  if (bota) ficha.bota = bota;
  return ficha;
}

/* La ficha nueva va después del último color del mismo modelo (o al final): no se reordena lo que ya está. */
function insertarFicha(fichas, ficha) {
  const base = ficha.family.slice(0, 4);
  let pos = -1;
  fichas.forEach((p, i) => { if (String(p.family || "").startsWith(base)) pos = i; });
  fichas.splice(pos + 1, 0, ficha);
}

(async () => {
  const stock = leerJson("stock-data-catalogo-43.json").items || {};
  const atrs = (() => { try { return leerJson("atributos-modelos.json").modelos || {}; } catch (_) { return {}; } })();
  const ignorar = new Set((() => { try { return leerJson("conectar-fotos.ignorar.json"); } catch (_) { return []; } })().map((c) => String(c).toUpperCase()));
  const conStock = Object.entries(stock)
    .filter(([k, v]) => /^4[0-3]\d{2}-\d{2}$/.test(k) && Number(v && v.total) > 0)
    .map(([k]) => k.toUpperCase())
    .sort(natural);

  const cambios = new Set();
  const resumen = { nuevos: [], renombrados: [], reparados: [], completados: [], sinCarpeta: [], ignorados: [], errores: [] };

  for (const cole of ["40", "41", "42", "43"]) {
    const archivo = `data-catalogo-${cole}.json`;
    try {
      let crudo;
      try { crudo = fs.readFileSync(path.join(RAIZ, archivo), "utf8"); } catch (_) { continue; }
      const bom = crudo.startsWith(BOM) ? BOM : "";
      const json = JSON.parse(sinBom(crudo));
      const fichas = Array.isArray(json) ? json : json.items || [];
      let tocado = false;
      const porCodigo = () => new Map(fichas.map((p) => [String(p.family || "").toUpperCase(), p]));

      /* 1) Código sin variante ("4228") → "4228-00" si ese es el que tiene stock y no existe ya la ficha. */
      for (const p of fichas) {
        const f = String(p.family || "").toUpperCase();
        if (!/^\d{4}$/.test(f)) continue;
        const completo = `${f}-00`;
        if (!conStock.includes(completo) || porCodigo().has(completo)) continue;
        p.family = completo;
        tocado = true;
        resumen.renombrados.push(`${f} → ${completo}`);
        const portada = p.main_image || (p.gallery || [])[0];
        if (portada && existe(portada)) { try { cambios.add(await portadaOg(completo, portada)); } catch (e) { resumen.errores.push(`${completo}: og (${e.message})`); } }
      }

      for (const codigo of conStock.filter((c) => c.startsWith(cole))) {
        const existente = porCodigo().get(codigo);
        try {
          if (existente) {
            /* Sin tipo/tiro/corte la tarjeta dice "Mod. 4201-00"; con el dato del BI dice "Flare" como en la 43. */
            const { tipo, tiro, bota } = atributos(atrs, codigo);
            const nuevos = [["tipo", tipo], ["tiro", tiro], ["bota", bota]].filter(([k, v]) => v && !existente[k]);
            if (nuevos.length) {
              const etiqueta = { tipo: "Tipo", tiro: "Tiro", bota: "Bota" };
              if (!Array.isArray(existente.characteristics)) existente.characteristics = [];
              for (const [k, v] of nuevos) {
                existente[k] = v;
                if (!existente.characteristics.some((c) => String(c).startsWith(`${etiqueta[k]}:`))) existente.characteristics.push(`${etiqueta[k]}: ${v}`);
              }
              tocado = true;
              resumen.completados.push(`${codigo}: ${nuevos.map(([k, v]) => `${k} ${v}`).join(", ")}`);
            }

            const img = existente.main_image || (existente.gallery || [])[0] || "";
            if (img && existe(img)) {
              /* La ficha está bien. Si le falta la portada og (falló al crearla), se genera. */
              if (!existe(`og/${codigo}.jpg`)) { try { cambios.add(await portadaOg(codigo, img)); } catch (e) { resumen.errores.push(`${codigo}: og (${e.message})`); } }
              continue;
            }
            /* 2) Ficha cuya foto no existe en el proyecto: se vuelve a apuntar a la carpeta del modelo. */
            const carpeta = carpetaPara(codigo);
            if (!carpeta) { resumen.sinCarpeta.push(`${codigo} (ficha con foto inexistente: ${img || "sin foto"})`); continue; }
            const el = fotosElegidas(carpeta);
            if (!el.fotos.length) { resumen.sinCarpeta.push(`${codigo} (${el.motivo})`); continue; }
            const webs = await publicarFotos(codigo, el.fuente, el.fotos, cambios, resumen.errores);
            if (!webs.length) { resumen.sinCarpeta.push(`${codigo} (fotos ilegibles en ${el.fuente})`); continue; }
            existente.main_image = webs[0];
            existente.gallery = webs;
            tocado = true;
            resumen.reparados.push(`${codigo} <- ${el.fuente} (${webs.length} fotos)`);
            continue;
          }

          /* 3) Modelo con stock que no está en la página: se busca su carpeta y se crea la ficha. */
          if (ignorar.has(codigo)) { resumen.ignorados.push(codigo); continue; }
          const carpeta = carpetaPara(codigo);
          if (!carpeta) {
            /* Sin carpeta de ese color: se avisa si hay carpeta de otro color del mismo modelo (decisión de Manu, no se usa sola). */
            const hermanas = carpetasDelModelo(codigo);
            resumen.sinCarpeta.push(hermanas.length ? `${codigo} (hay fotos de otro color: ${hermanas.join(", ")})` : codigo);
            continue;
          }
          const el = fotosElegidas(carpeta);
          if (!el.fotos.length) { resumen.sinCarpeta.push(`${codigo} (${el.motivo})`); continue; }
          const webs = await publicarFotos(codigo, el.fuente, el.fotos, cambios, resumen.errores);
          if (!webs.length) { resumen.sinCarpeta.push(`${codigo} (fotos ilegibles en ${el.fuente})`); continue; }
          insertarFicha(fichas, fichaNueva(codigo, webs, atrs));
          tocado = true;
          resumen.nuevos.push(`${codigo} <- ${el.fuente} (${webs.length} fotos, ${el.origen}${carpeta.exacto ? "" : ", carpeta " + path.basename(carpeta.rel)})`);
        } catch (e) {
          resumen.errores.push(`${codigo}: ${e.message}`);
        }
      }

      if (tocado) {
        if (APLICAR) fs.writeFileSync(path.join(RAIZ, archivo), bom + JSON.stringify(json, null, 2) + "\n", "utf8");
        cambios.add(archivo);
      }
    } catch (e) {
      /* Un JSON inválido no bota la corrida entera: se avisa y se sigue con la colección siguiente. */
      resumen.errores.push(`${archivo}: ${e.message}`);
    }
  }

  const modo = APLICAR ? "" : " (simulación, no se escribió nada)";
  const lista = (t, arr) => { if (arr.length) console.log(`${t} (${arr.length}):\n  ${arr.join("\n  ")}`); };
  lista(`Fichas nuevas${modo}`, resumen.nuevos);
  lista("Códigos corregidos", resumen.renombrados);
  lista("Fotos republicadas", resumen.reparados);
  lista("Tipo/tiro/corte completados desde el BI", resumen.completados);
  lista("Ignorados (conectar-fotos.ignorar.json)", resumen.ignorados);
  lista("Con stock y sin carpeta de fotos de ese color (siguen fuera de la página)", resumen.sinCarpeta);
  lista("Errores", resumen.errores);
  if (!resumen.nuevos.length && !resumen.renombrados.length && !resumen.reparados.length && !resumen.completados.length) console.log("Sin fotos nuevas que conectar.");

  if (APLICAR) {
    /* Pendientes de una corrida del sync cuyo push falló: se vuelven a listar hasta que el ps1 borre el archivo. */
    let pendientes = [];
    try { pendientes = leerJson(PENDIENTES); } catch (_) {}
    const todos = [...new Set([...pendientes, ...cambios])].filter(existe).sort();
    for (const c of todos) console.log(`CAMBIO ${c}`);
    if (DESDE_SYNC) {
      if (todos.length) fs.writeFileSync(path.join(RAIZ, PENDIENTES), JSON.stringify(todos, null, 1) + "\n", "utf8");
      else if (existe(PENDIENTES)) fs.unlinkSync(path.join(RAIZ, PENDIENTES));
    }
  }
  if (resumen.errores.length) process.exitCode = 1;
})();
