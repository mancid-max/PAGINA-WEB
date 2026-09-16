/* /m/CODIGO → link "bonito" por modelo para WhatsApp / redes.
   - Si quien abre es un bot de vista previa (WhatsApp, Facebook, Telegram, etc.) devuelve un HTML con Open Graph:
     foto del modelo (og/<codigo>.jpg, generada con generar-og.js), nombre, código, colección y precio.
   - Si es una persona, redirige (302) a la ficha real: catalogo-44/?modelo= (Cole 44) o /?sku= (Cole 40-43).
   Ruta: netlify.toml redirige /m/* → /.netlify/functions/ficha?codigo=:splat
   Lo usa Sofía (Nexor) para "mandar la foto" de un modelo sin plantillas de Meta. */
const BASE = (process.env.URL || "https://mohicanojeans.netlify.app").replace(/\/$/, "");
const BOT_RE = /WhatsApp|facebookexternalhit|Facebot|Twitterbot|TelegramBot|LinkedInBot|Slackbot|Discordbot|Googlebot|bingbot|Applebot|Pinterest|Embedly|Iframely|SkypeUriPreview|vkShare|redditbot/i;
const clp = (n) => "$" + Number(n).toLocaleString("es-CL");
const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

async function getRemote(path) {
  const r = await fetch(`${BASE}${path}`, { headers: { "Cache-Control": "no-cache" } });
  if (!r.ok) throw new Error(`HTTP ${r.status} en ${path}`);
  return path.endsWith(".js") ? r.text() : r.json();
}
function normCod(raw) {
  const s = String(raw || "").toUpperCase().replace(/[^0-9]/g, "");
  if (s.length === 4) return `${s}-00`;
  if (s.length === 6) return `${s.slice(0, 4)}-${s.slice(4)}`;
  const t = String(raw || "").toUpperCase().trim();
  return /^\d{4}-\d{2}$/.test(t) ? t : "";
}

async function info44(cod) {
  const src = await getRemote("/catalogo-44/app.js");
  const SEC = {};
  for (const m of src.matchAll(/\{id:"(\w+)",\s*nombre:"([^"]+)"/g)) SEC[m[1]] = m[2];
  const re = new RegExp(`\\{nombre:"([^"]+)",\\s*codigo:"${cod}",\\s*precio:(null|\\d+),[^}]*?tipo:"([^"]+)",\\s*sec:"([^"]+)"\\}`);
  const m = src.match(re);
  if (!m) return null;
  const precio = m[2] === "null" ? null : Number(m[2]);
  let estado = "";
  try {
    const st = await getRemote("/stock-data-catalogo-44.json");
    estado = (((st.items || {})[cod] || {}).total || 0) > 30 ? "Disponible" : "En producción";
  } catch (e) { /* sin estado */ }
  return {
    nombre: m[1],
    coleccion: "Dolce Vita · Cole 44",
    detalle: [SEC[m[4]] || m[4], m[3] === "chaqueta" ? "Chaqueta" : "Jean", estado].filter(Boolean).join(" · "),
    precio_texto: precio == null ? "Precio a consultar" : `${clp(precio)} c/u IVA incluido`,
  };
}

async function info4043(cod, cole) {
  const [data, precios] = await Promise.all([
    getRemote(`/data-catalogo-${cole}.json`),
    getRemote(cole === "43" ? "/price-data-catalogo-43.json" : "/price-data.json").catch(() => ({})),
  ]);
  const items = Array.isArray(data) ? data : data.items || [];
  const it = items.find((x) => String(x.family || "").toUpperCase() === cod);
  if (!it) return null;
  const p = (precios.items || {})[cod] ?? (precios.items || {})[cod.slice(0, 4)] ?? null;
  const desc = [it.tipo, it.tiro ? `tiro ${it.tiro}` : "", it.bota ? `bota ${it.bota}` : ""].filter(Boolean).join(" · ")
    || String(it.description || "").replace(/\?/g, "·").trim();
  return {
    nombre: `Modelo ${cod}`,
    coleccion: `Cole ${cole}`,
    detalle: desc ? desc.charAt(0).toUpperCase() + desc.slice(1).toLowerCase() : "Jean de mujer",
    precio_texto: p == null ? "Precio a consultar" : `${clp(p)} mayorista sin IVA`,
  };
}

exports.handler = async (event) => {
  const q = event.queryStringParameters || {};
  const cod = normCod(q.codigo || q.c || (event.path || "").split("/").filter(Boolean).pop());
  if (!cod) return { statusCode: 302, headers: { Location: `${BASE}/` } };
  const cole = cod.slice(0, 2);
  const es44 = cole === "44";
  const destino = es44 ? `${BASE}/catalogo-44/?modelo=${cod}` : `${BASE}/?sku=${cod}`;
  const ua = event.headers?.["user-agent"] || event.headers?.["User-Agent"] || "";
  if (!BOT_RE.test(ua) && !q.preview) {
    return { statusCode: 302, headers: { Location: destino, "Cache-Control": "public, max-age=300" } };
  }

  let info = null;
  try { info = es44 ? await info44(cod) : /^4[0-3]$/.test(cole) ? await info4043(cod, cole) : null; } catch (e) { console.warn("ficha:", e.message); }
  const titulo = info ? `${info.nombre} · ${cod} · Mohicano Jeans` : `Mohicano Jeans · ${cod}`;
  const descripcion = info
    ? `${info.coleccion} · ${info.precio_texto} · ${info.detalle}`
    : "Jeans de mujer, venta mayorista a todo Chile.";
  const imagen = info ? `${BASE}/og/${cod}.jpg` : es44 ? `${BASE}/catalogo-44/img/og-dv44.jpg` : `${BASE}/Imagenes/Logo/app-icon.png`;
  const url = `${BASE}/m/${cod}`;

  const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<title>${esc(titulo)}</title>
<meta name="description" content="${esc(descripcion)}">
<meta property="og:type" content="product">
<meta property="og:site_name" content="Mohicano Jeans">
<meta property="og:title" content="${esc(titulo)}">
<meta property="og:description" content="${esc(descripcion)}">
<meta property="og:url" content="${esc(url)}">
<!-- Sin og:image a propósito (2026-09-16, pedido de Manu): la miniatura chica que WhatsApp arma con el link se ve mal.
     Así el link muestra solo título y descripción; las fotos grandes las manda Sofía aparte o se ven en la página. -->
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${esc(titulo)}">
<meta name="twitter:description" content="${esc(descripcion)}">
<meta http-equiv="refresh" content="0;url=${esc(destino)}">
<link rel="canonical" href="${esc(destino)}">
</head><body style="font-family:system-ui;padding:24px;text-align:center">
<p>Abriendo <b>${esc(info ? info.nombre : cod)}</b>…</p>
<p><a href="${esc(destino)}">Ver el modelo</a></p>
<script>location.replace(${JSON.stringify(destino)});</script>
</body></html>`;

  return {
    statusCode: 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=600" },
    body: html,
  };
};
