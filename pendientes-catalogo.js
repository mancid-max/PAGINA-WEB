/* Informe de lo que falta en el catálogo web, para revisarlo con Manu dos veces al día:
   - Modelos Cole 40-43 con stock que NO están en la página (sin foto): con carpeta de otro color,
     con fotos crudas sin seleccionar, o sin ninguna carpeta.
   - Modelos en la página sin precio (Cole 40-43 y Dolce Vita 44).
   - Notas manuales (pendientes-catalogo.notas.md): dudas de corte, fotos repetidas, etc.
   Escribe pendientes-catalogo.html y .json en el PC (NO van a la web: están en .gitignore, es un informe
   privado). Con --avisar manda el .html por Telegram como archivo, con un resumen, al chat guardado en
   %USERPROFILE%\.mohicano\telegram.json ({ token, chat }); ese archivo queda fuera del repo.
   Corre solo en cada sync de stock (generate-stock-from-bi.ps1; --avisar a las 8 y a las 17).
   Uso manual: node pendientes-catalogo.js [--avisar] */
const fs = require("fs");
const path = require("path");
const { carpetaPara, carpetasDelModelo, fotosElegidas } = require("./conectar-fotos.js");

const RAIZ = __dirname;
const BOM = String.fromCharCode(0xfeff);
const leerJson = (f) => JSON.parse(fs.readFileSync(path.join(RAIZ, f), "utf8").replace(BOM, ""));
const leerOpc = (f, def) => { try { return leerJson(f); } catch (_) { return def; } };
const natural = (a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
const clp = (n) => "$" + Number(n).toLocaleString("es-CL");

/* --- Cole 40-43 --- */
const stock = leerJson("stock-data-catalogo-43.json").items || {};
const precios = { ...(leerOpc("price-data.json", {}).items || {}) };
for (const [k, v] of Object.entries(leerOpc("price-data-catalogo-43.json", {}).items || {})) precios[k] = precios[k] ?? v;
const precioDe = (cod) => precios[cod] ?? precios[cod.slice(0, 4)] ?? precios[cod.slice(0, 4) + "-00"] ?? null;
const enPagina = new Map();
for (const c of ["40", "41", "42", "43"]) for (const p of leerOpc(`data-catalogo-${c}.json`, [])) enPagina.set(String(p.family || "").toUpperCase(), { cole: c, foto: !!(p.main_image || (p.gallery || [])[0]) });

const conStock = Object.entries(stock)
  .filter(([k, v]) => /^4[0-3]\d{2}-\d{2}$/.test(k) && Number(v && v.total) > 0)
  .map(([k, v]) => ({ codigo: k.toUpperCase(), unidades: Number(v.total) }))
  .sort((a, b) => b.unidades - a.unidades || natural(a.codigo, b.codigo));

const sinFoto = { otroColor: [], crudas: [], sinCarpeta: [] };
const sinPrecio = [];
for (const m of conStock) {
  const ficha = enPagina.get(m.codigo);
  if (ficha && ficha.foto) {
    if (precioDe(m.codigo) == null) sinPrecio.push({ ...m, cole: m.codigo.slice(0, 2) });
    continue;
  }
  const carpeta = carpetaPara(m.codigo);
  if (carpeta) {
    const el = fotosElegidas(carpeta);
    if (!el.fotos.length) sinFoto.crudas.push({ ...m, carpeta: carpeta.rel, detalle: el.motivo });
    else sinFoto.sinCarpeta.push({ ...m, detalle: "tiene carpeta pero no se pudo conectar (fotos ilegibles)" });
    continue;
  }
  const hermanas = carpetasDelModelo(m.codigo);
  if (hermanas.length) sinFoto.otroColor.push({ ...m, carpetas: hermanas });
  else sinFoto.sinCarpeta.push(m);
}

/* --- Dolce Vita 44: modelos sin precio en catalogo-44/app.js --- */
const app44 = fs.readFileSync(path.join(RAIZ, "catalogo-44/app.js"), "utf8");
const stock44 = leerOpc("stock-data-catalogo-44.json", {}).items || {};
const sinPrecio44 = [];
for (const m of app44.matchAll(/\{nombre:"([^"]+)",\s*codigo:"([^"]+)",\s*precio:(null|0)\b/g)) {
  sinPrecio44.push({ codigo: m[2], nombre: m[1], unidades: Number((stock44[m[2]] || {}).total || 0) });
}

/* --- Solicitudes de clientes pendientes (registrar_solicitud → Supabase), vía la función con la clave local --- */
async function leerSolicitudes() {
  let clave = "";
  try { clave = String(JSON.parse(fs.readFileSync(path.join(process.env.USERPROFILE || process.env.HOME, ".mohicano", "api.json"), "utf8")).order_key || "").trim(); } catch (_) {}
  if (!clave) return { error: "sin clave local (%USERPROFILE%\\.mohicano\\api.json)", lista: [] };
  try {
    const r = await fetch("https://mohicanojeans.netlify.app/.netlify/functions/registrar-solicitud?estado=pendiente", { headers: { "X-Api-Key": clave } });
    const j = await r.json();
    if (!j.ok) return { error: j.mensaje || ("HTTP " + r.status), lista: [] };
    return { error: null, lista: j.solicitudes || [] };
  } catch (e) { return { error: e.message, lista: [] }; }
}

/* --- Notas manuales --- */
const notas = (() => { try { return fs.readFileSync(path.join(RAIZ, "pendientes-catalogo.notas.md"), "utf8").replace(BOM, "").trim(); } catch (_) { return ""; } })();

(async () => {
const solicitudes = await leerSolicitudes();
const unidades = (arr) => arr.reduce((s, x) => s + (x.unidades || 0), 0);
const informe = {
  generado: new Date().toISOString(),
  resumen: {
    sin_foto_total: sinFoto.otroColor.length + sinFoto.crudas.length + sinFoto.sinCarpeta.length,
    sin_foto_unidades: unidades(sinFoto.otroColor) + unidades(sinFoto.crudas) + unidades(sinFoto.sinCarpeta),
    sin_foto_otro_color: sinFoto.otroColor.length,
    sin_foto_crudas: sinFoto.crudas.length,
    sin_foto_sin_carpeta: sinFoto.sinCarpeta.length,
    sin_precio_4043: sinPrecio.length,
    sin_precio_44: sinPrecio44.length,
    notas: notas ? notas.split("\n").filter((l) => /^\s*[-*]/.test(l)).length : 0,
    solicitudes: solicitudes.lista.length,
  },
  solicitudes: solicitudes.lista.map((x) => ({ id: x.id, fecha: x.created_at, tipo: x.tipo, texto: x.texto, contexto: x.contexto, nombre: x.nombre, rut: x.rut, phone: x.phone })),
  solicitudes_error: solicitudes.error,
  sin_foto: sinFoto,
  sin_precio_4043: sinPrecio,
  sin_precio_44: sinPrecio44,
  notas,
};
fs.writeFileSync(path.join(RAIZ, "pendientes-catalogo.json"), JSON.stringify(informe, null, 1) + "\n", "utf8");

/* --- HTML --- */
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const fecha = new Date().toLocaleString("es-CL", { timeZone: "America/Santiago", dateStyle: "medium", timeStyle: "short" });
const fila = (cols) => `<tr>${cols.map((c) => `<td>${c}</td>`).join("")}</tr>`;
const tabla = (cab, filas, vacio) => filas.length
  ? `<table><thead><tr>${cab.map((c) => `<th>${c}</th>`).join("")}</tr></thead><tbody>${filas.join("")}</tbody></table>`
  : `<p class="ok">${vacio}</p>`;
const linkFicha = (cod) => `<a href="https://mohicanojeans.netlify.app/m/${cod}" target="_blank">${cod}</a>`;
const notasHtml = notas
  ? "<ul>" + notas.split("\n").filter((l) => /^\s*[-*]/.test(l)).map((l) => `<li>${esc(l.replace(/^\s*[-*]\s*/, ""))}</li>`).join("") + "</ul>"
  : `<p class="ok">Sin notas. (Se escriben en pendientes-catalogo.notas.md, una por línea con "-".)</p>`;

const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>Pendientes del catálogo</title>
<style>
  :root{--tinta:#1c1c1e;--gris:#6b7280;--linea:#e5e7eb;--rojo:#c62828;--verde:#15803d;--fondo:#fafafa}
  body{margin:0;padding:16px;font:15px/1.45 system-ui,-apple-system,"Segoe UI",sans-serif;color:var(--tinta);background:var(--fondo)}
  main{max-width:820px;margin:0 auto}
  h1{font-size:1.35rem;margin:0 0 2px}h2{font-size:1.05rem;margin:26px 0 8px;padding-bottom:4px;border-bottom:2px solid var(--tinta)}
  .fecha{color:var(--gris);font-size:.85rem;margin-bottom:14px}
  .contadores{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px;margin:12px 0 4px}
  .contadores div{background:#fff;border:1px solid var(--linea);border-radius:10px;padding:10px 12px}
  .contadores b{display:block;font-size:1.5rem;line-height:1.1}.contadores span{color:var(--gris);font-size:.8rem}
  table{width:100%;border-collapse:collapse;background:#fff;border:1px solid var(--linea);border-radius:10px;overflow:hidden;font-size:.9rem}
  th,td{padding:7px 9px;text-align:left;border-bottom:1px solid var(--linea);vertical-align:top}th{background:#f3f4f6;font-size:.75rem;letter-spacing:.04em;text-transform:uppercase;color:var(--gris)}
  td:nth-child(2){font-variant-numeric:tabular-nums;white-space:nowrap}
  .ok{color:var(--verde);background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:8px 10px}
  .ayuda{color:var(--gris);font-size:.83rem;margin:0 0 8px}code{font-size:.85em;background:#f3f4f6;padding:1px 4px;border-radius:4px}
  a{color:var(--rojo)}ul{padding-left:20px}
</style></head><body><main>
<h1>Pendientes del catálogo</h1>
<div class="fecha">Última novedad ${esc(fecha)} · se revisa en cada sincronización de stock</div>
<div class="contadores">
  <div><b>${informe.resumen.sin_foto_total}</b><span>con stock y sin foto (${informe.resumen.sin_foto_unidades.toLocaleString("es-CL")} u)</span></div>
  <div><b>${informe.resumen.sin_precio_4043}</b><span>en la página sin precio (40-43)</span></div>
  <div><b>${informe.resumen.sin_precio_44}</b><span>Dolce Vita 44 sin precio</span></div>
  <div><b>${informe.resumen.notas}</b><span>notas por resolver</span></div>
  <div><b>${informe.resumen.solicitudes}</b><span>solicitudes de clientes</span></div>
</div>

<h2>0. Solicitudes de clientes que Sofía no pudo resolver (${informe.resumen.solicitudes})</h2>
<p class="ayuda">Las registra Sofía con <code>registrar_solicitud</code>; llegan también al grupo Ayuda de Telegram, donde se marcan "Resuelta". Aquí salen las pendientes.</p>
${solicitudes.error ? `<p class="ayuda">No se pudieron leer: ${esc(solicitudes.error)}</p>` : ""}
${tabla(["Cuándo", "Tipo", "Pidió", "Cliente"], informe.solicitudes.map((x) => fila([esc(new Date(x.fecha).toLocaleString("es-CL", { timeZone: "America/Santiago", dateStyle: "short", timeStyle: "short" })), esc(x.tipo), esc(x.texto) + (x.contexto ? `<br><span class="ayuda">${esc(x.contexto)}</span>` : ""), esc([x.nombre, x.rut, x.phone].filter(Boolean).join(" · ") || "—")])), "Sin solicitudes pendientes.")}

<h2>1. Con stock y sin foto de ese color: hay fotos de otro color (${sinFoto.otroColor.length})</h2>
<p class="ayuda">Decisión: ¿se usa la foto del color hermano o se fotografía? Si se aprueba, se agrega el código a la carpeta correcta (o se copia la carpeta con el nombre del color) y el sync lo conecta solo.</p>
${tabla(["Código", "Stock", "Precio", "Carpetas con fotos"], sinFoto.otroColor.map((m) => fila([m.codigo, `${m.unidades} u`, precioDe(m.codigo) == null ? "—" : clp(precioDe(m.codigo)), m.carpetas.map((c) => `<code>${esc(c)}</code>`).join("<br>")])), "Ninguno.")}

<h2>2. Con fotos crudas sin seleccionar (${sinFoto.crudas.length})</h2>
<p class="ayuda">La carpeta tiene una sesión completa de cámara. Falta elegir las fotos finales en una subcarpeta <code>editar/</code>; el sync las publica solo.</p>
${tabla(["Código", "Stock", "Carpeta", "Detalle"], sinFoto.crudas.map((m) => fila([m.codigo, `${m.unidades} u`, `<code>${esc(m.carpeta)}</code>`, esc(m.detalle)])), "Ninguno.")}

<h2>3. Con stock y sin ninguna carpeta de fotos (${sinFoto.sinCarpeta.length})</h2>
<p class="ayuda">Hay que fotografiarlos (o buscar la carpeta en otro disco). Ordenados por stock.</p>
${tabla(["Código", "Stock", "Precio"], sinFoto.sinCarpeta.map((m) => fila([m.codigo, `${m.unidades} u`, m.detalle ? esc(m.detalle) : (precioDe(m.codigo) == null ? "—" : clp(precioDe(m.codigo)))])), "Ninguno.")}

<h2>4. En la página sin precio, Cole 40-43 (${sinPrecio.length})</h2>
<p class="ayuda">La tarjeta sale sin precio y Sofía dice "precio a consultar". Se arregla agregando el código a <code>price-data.json</code> (o <code>price-data-catalogo-43.json</code>).</p>
${tabla(["Código", "Stock", "Ficha"], sinPrecio.map((m) => fila([m.codigo, `${m.unidades} u`, linkFicha(m.codigo)])), "Todos con precio.")}

<h2>5. Dolce Vita 44 sin precio (${sinPrecio44.length})</h2>
<p class="ayuda">Se arregla en <code>catalogo-44/app.js</code> (campo <code>precio</code> del modelo).</p>
${tabla(["Código", "Nombre", "Stock (manual)"], sinPrecio44.map((m) => fila([linkFicha(m.codigo), esc(m.nombre), `${m.unidades} u`])), "Todos con precio.")}

<h2>6. Notas por resolver</h2>
${notasHtml}
</main></body></html>
`;
fs.writeFileSync(path.join(RAIZ, "pendientes-catalogo.html"), html, "utf8");
console.log(`pendientes: sin foto ${informe.resumen.sin_foto_total} (otro color ${sinFoto.otroColor.length}, crudas ${sinFoto.crudas.length}, sin carpeta ${sinFoto.sinCarpeta.length}) · sin precio 40-43 ${sinPrecio.length} · sin precio 44 ${sinPrecio44.length} · notas ${informe.resumen.notas}`);

/* --- Aviso por Telegram (archivo + resumen), solo con --avisar --- */
if (process.argv.includes("--avisar")) {
  (async () => {
    let tg = null;
    try { tg = JSON.parse(fs.readFileSync(path.join(process.env.USERPROFILE || process.env.HOME, ".mohicano", "telegram.json"), "utf8")); } catch (_) {}
    if (!tg || !tg.token || !tg.chat) { console.log("aviso: falta %USERPROFILE%\\.mohicano\\telegram.json (token, chat); no se manda"); return; }
    const r = informe.resumen;
    const total = r.sin_foto_total + r.sin_precio_4043 + r.sin_precio_44 + r.notas + r.solicitudes;
    if (!total) { console.log("aviso: sin pendientes, no se manda"); return; }
    const top = (arr, n) => arr.slice(0, n).map((m) => `${m.codigo} (${m.unidades} u)`).join(", ");
    const tx = (t) => String(t).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
    const caption = [
      `📋 <b>Pendientes del catálogo</b> · ${total} cosas por resolver`,
      `📷 Con stock y sin foto: <b>${r.sin_foto_total}</b> (${r.sin_foto_unidades.toLocaleString("es-CL")} u)`,
      r.sin_foto_otro_color ? `   · ${r.sin_foto_otro_color} con fotos de otro color: ${tx(top(sinFoto.otroColor, 3))}…` : null,
      r.sin_foto_crudas ? `   · ${r.sin_foto_crudas} con fotos crudas sin seleccionar` : null,
      r.sin_foto_sin_carpeta ? `   · ${r.sin_foto_sin_carpeta} sin ninguna foto: ${tx(top(sinFoto.sinCarpeta, 3))}…` : null,
      `💲 Sin precio: <b>${r.sin_precio_4043}</b> de la 40-43${r.sin_precio_4043 ? ` (${tx(top(sinPrecio, 3))}…)` : ""} y <b>${r.sin_precio_44}</b> de la Dolce Vita 44`,
      r.notas ? `📝 Notas por resolver: <b>${r.notas}</b>` : null,
      r.solicitudes ? `🙋 Solicitudes de clientes sin resolver: <b>${r.solicitudes}</b>` : null,
      `El detalle va en el archivo adjunto (ábrelo en el navegador).`,
    ].filter((l) => l !== null).join("\n");
    const fd = new FormData();
    fd.append("chat_id", String(tg.chat));
    fd.append("caption", caption.slice(0, 1000));
    fd.append("parse_mode", "HTML");
    fd.append("document", new Blob([html], { type: "text/html" }), "pendientes-catalogo.html");
    try {
      const resp = await fetch(`https://api.telegram.org/bot${tg.token}/sendDocument`, { method: "POST", body: fd });
      console.log("aviso Telegram:", resp.ok ? "enviado" : `error HTTP ${resp.status}`);
    } catch (e) { console.log("aviso Telegram: error", e.message); }
  })();
}
})();
