/* generar-atributos.js — atributos de cada modelo (tiro, corte, tipo) desde Z:\BI, para que Sofía
   los diga al describir un modelo. Fuente: subcategoría del artículo en PEDIDOS.CSV (y VENTAS como
   respaldo), que en Adecom viene como "CINTURA PITILLO", "MEDIO FLARE", "CADERA OXFORD", etc.
     CINTURA / HIGH WAIST = tiro alto · MEDIO = tiro medio · CADERA = tiro bajo
   Escribe atributos-modelos.json en la raíz (datos de producto, no de clientes: puede ir al repo).
   Uso: node generar-atributos.js        (correrlo junto con el stock, o cuando entren modelos nuevos) */
const fs = require("fs");
const path = require("path");

const BI = process.env.BI_DIR || "Z:\\BI";
const SALIDA = path.join(__dirname, "atributos-modelos.json");

const TIROS = [["HIGH WAIST", "alto"], ["CINTURA", "alto"], ["MEDIO", "medio"], ["CADERA", "bajo"]];
const CORTES = {
  PITILLO: "pitillo", FLARE: "flare", RECTO: "recto", TOBILLO: "tobillero", TOBILLERO: "tobillero", PALAZZO: "palazzo",
  OXFORD: "oxford", "WIDE LEG": "wide leg", "BOOT CUT": "bootcut", BOOTCUT: "bootcut", CROOPED: "cropped", CROOP: "cropped",
  BALLOON: "balloon", CULOTTE: "culotte", MOM: "mom", MON: "mom", BAGUI: "baggy", "FALDA MINI": "falda mini", SHORTS: "shorts",
};
const TIPOS = { "JEANS DAMA": "jean", FALDA: "falda", "CHAQUETA DAMA": "chaqueta", "SHORTS-BERMUDA": "short", "GUILLETE DAMA": "chaleco", VESTIDOS: "vestido", "ABRIGO DAMA": "abrigo", BLUSAS: "blusa" };

/* "CINTURA RECTO TOBILLERO" → { tiro: "alto", corte: "recto tobillero" } */
function interpretar(sub) {
  const s = String(sub || "").trim().toUpperCase();
  if (!s) return null;
  let tiro = null, resto = s;
  for (const [pref, t] of TIROS) if (s.startsWith(pref + " ") || s === pref) { tiro = t; resto = s.slice(pref.length).trim(); break; }
  const partes = [];
  for (const [k, v] of Object.entries(CORTES).sort((a, b) => b[0].length - a[0].length)) {
    if (resto.includes(k)) { partes.push(v); resto = resto.replace(k, " "); }
  }
  const corte = partes.length ? [...new Set(partes)].join(" ") : (resto.trim() ? resto.trim().toLowerCase() : null);
  return { tiro, corte, subcategoria: s };
}

/* Artículo Adecom: "01" + modelo(4) + variante(2) + talla(2)  → clave "4157-00" */
const clave = (art) => { const a = String(art || "").trim().replace(/^01/, ""); const m = a.match(/^(\d{4})(\d{2})/); return m ? `${m[1]}-${m[2]}` : null; };
const leer = (f) => fs.readFileSync(path.join(BI, f), "latin1").split(/\r?\n/);

const votos = {}; // clave -> { sub -> n, categ -> n }
function contar(k, sub, categ) {
  if (!k || !sub) return;
  const v = votos[k] || (votos[k] = { sub: {}, categ: {} });
  v.sub[sub] = (v.sub[sub] || 0) + 1;
  if (categ) v.categ[categ] = (v.categ[categ] || 0) + 1;
}
for (const l of leer("PEDIDOS.CSV").slice(1)) { const c = l.split(";"); if (c.length < 23) continue; contar(clave(c[10]), (c[22] || "").trim().toUpperCase(), (c[21] || "").trim().toUpperCase()); }
for (const l of leer("VENTAS-TOD-2026.CSV").slice(1)) { const c = l.split(";"); if (c.length < 10) continue; contar(clave(c[3]), (c[5] || "").trim().toUpperCase(), (c[4] || "").trim().toUpperCase()); }

const top = (o) => Object.entries(o).sort((a, b) => b[1] - a[1])[0];
const salida = {};
for (const [k, v] of Object.entries(votos)) {
  const sub = top(v.sub); if (!sub) continue;
  if (/FALLA|SEGUNDA|LINEA ARTE|EDICI/.test(sub[0]) && Object.keys(v.sub).length > 1) { delete v.sub[sub[0]]; } // no describir por una etiqueta de saldo
  const mejor = top(v.sub); if (!mejor) continue;
  const at = interpretar(mejor[0]); if (!at) continue;
  const cat = top(v.categ);
  salida[k] = { tipo: cat ? (TIPOS[cat[0]] || cat[0].toLowerCase()) : null, tiro: at.tiro, corte: at.corte, subcategoria: at.subcategoria };
}
/* nivel familia (4157) por si preguntan sin variante */
for (const k of Object.keys(salida)) { const fam = k.slice(0, 4); if (!salida[fam]) salida[fam] = salida[k.endsWith("-00") ? k : k] ; }

const modelos4x = Object.keys(salida).filter((k) => /^4[0-4]\d\d-/.test(k));
fs.writeFileSync(SALIDA, JSON.stringify({ generado: new Date().toISOString().slice(0, 16), fuente: "Z:\\BI PEDIDOS.CSV + VENTAS (subcategoria)", modelos: salida }, null, 1), "utf8");
console.log(`atributos-modelos.json: ${Object.keys(salida).length} claves (${modelos4x.length} modelos con variante de la 40 a la 44)`);
["4157-00", "4448-00", "4402-00", "4001-00", "4413-00"].forEach((k) => console.log(`  ${k}: ${JSON.stringify(salida[k] || null)}`));
