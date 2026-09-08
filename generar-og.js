/* Genera las imágenes de vista previa (Open Graph) por modelo para los links /m/CODIGO que manda Sofía.
   Uso: node generar-og.js            → escribe og/<codigo>.jpg (1200x630) para Cole 44 y Cole 40-43
   Fuente Cole 44: catalogo-44/img/<img>_0.webp · Cole 40-43: main_image de data-catalogo-4X.json
   Requiere: npm i sharp (ya instalado). Volver a correr cuando se agreguen modelos o cambien fotos. */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const ROOT = __dirname;
const OUT = path.join(ROOT, "og");
const W = 1200, H = 630;
fs.mkdirSync(OUT, { recursive: true });

const fuentes = [];

/* Cole 44 */
const app = fs.readFileSync(path.join(ROOT, "catalogo-44/app.js"), "utf8");
for (const m of app.matchAll(/\{nombre:"[^"]+",\s*codigo:"([^"]+)",[^}]*?img:"([^"]+)"[^}]*\}/g)) {
  fuentes.push({ codigo: m[1], src: path.join(ROOT, "catalogo-44/img", `${m[2]}_0.webp`) });
}

/* Cole 40-43 */
for (const cole of ["40", "41", "42", "43"]) {
  const f = path.join(ROOT, `data-catalogo-${cole}.json`);
  if (!fs.existsSync(f)) continue;
  const data = JSON.parse(fs.readFileSync(f, "utf8").replace(/^﻿/, ""));
  const items = Array.isArray(data) ? data : data.items || [];
  for (const it of items) {
    const cod = String(it.family || "").toUpperCase();
    const img = it.main_image || (it.gallery || [])[0];
    if (!cod || !img) continue;
    fuentes.push({ codigo: cod, src: path.join(ROOT, img) });
  }
}

(async () => {
  let ok = 0, faltan = [];
  for (const { codigo, src } of fuentes) {
    if (!fs.existsSync(src)) { faltan.push(`${codigo} (${path.relative(ROOT, src)})`); continue; }
    const out = path.join(OUT, `${codigo}.jpg`);
    try {
      const fondo = await sharp(src).resize(W, H, { fit: "cover" }).blur(40).modulate({ brightness: 1.08, saturation: 0.7 }).toBuffer();
      const foto = await sharp(src).resize(W, H, { fit: "inside" }).toBuffer();
      await sharp(fondo).composite([{ input: foto, gravity: "centre" }]).jpeg({ quality: 82, mozjpeg: true }).toFile(out);
      ok++;
    } catch (e) { faltan.push(`${codigo}: ${e.message}`); }
  }
  console.log(`OK ${ok} imágenes en og/`);
  if (faltan.length) console.log("Sin foto:", faltan.join("\n  "));
})();
