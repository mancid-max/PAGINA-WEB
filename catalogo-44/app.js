/* ============================================================
   MOHICANO · DOLCE VITA 44 — Pedidos mayoristas
   ============================================================ */

/* ---- CONFIGURACIÓN ---------------------------------------- */
const WHATSAPP       = "56233990578";
const MIN_POR_MODELO = 12;
const TALLAS_JEANS   = ["36","38","40","42","44","46"];
const TALLAS_CHAQ    = ["S","M","L","XL"];
const CURVA_JEANS    = {"36":2,"38":2,"40":2,"42":2,"44":2,"46":2};
const CURVA_JEANS_17 = {"36":2,"38":3,"40":4,"42":4,"44":3,"46":1};
const CURVA_CHAQ     = {"S":3,"M":3,"L":3,"XL":3};
const CURVA_CHAQ_17  = {"S":4,"M":5,"L":5,"XL":3};
const LANDING        = "https://mohicanojeans.netlify.app/catalogo-44";
const SOURCE_PEDIDO  = "dolce-vita-44";

/* ---- SUPABASE --------------------------------------------- */
const SUPABASE_URL = "https://kdtydxihrflhziclgiof.supabase.co";
const SUPABASE_KEY = "sb_publishable_37ce4uK_RG8o9pP-Jdf2Xw_3eWgqJQy";

/* ---- SECCIONES -------------------------------------------- */
const SECCIONES = [
  {id:"flare",     nombre:"Flare Jeans",                      cover:"c6"},
  {id:"skinny",    nombre:"Skinny Jeans",                     cover:"c43"},
  {id:"wideleg",   nombre:"Wide Leg",                         cover:"c56"},
  {id:"balloon",   nombre:"Balloon",                          cover:"c69"},
  {id:"oxford",    nombre:"Oxford",                            cover:"c78"},
  {id:"crop",      nombre:"Crop Jeans",                       cover:"c87"},
  {id:"rectos",    nombre:"Jeans Rectos",                     cover:"c100"},
  {id:"palazzo",   nombre:"Jeans Palazzo",                    cover:"c115"},
  {id:"smart",     nombre:"Smart Denim",                      cover:"c132"},
  {id:"faja",      nombre:"Efecto Faja · Push In Push Up",    cover:"c138"},
  {id:"colores",   nombre:"Jeans de Colores",                 cover:"c159"},
  {id:"laser",     nombre:"Láser Jeans",                      cover:"c188"},
  {id:"chaquetas", nombre:"Chaquetas",                        cover:"c261"},
];

/* ---- MODELOS ---------------------------------------------- */
const MODELOS = [
  // FLARE
  {nombre:"Vita",         codigo:"4402-00", precio:26990, img:"m7",   tipo:"jeans", sec:"flare"},
  {nombre:"Sermione",     codigo:"4417-00", precio:26990, img:"m11",  tipo:"jeans", sec:"flare"},
  {nombre:"Venezia",      codigo:"4448-00", precio:25990, img:"m15",  tipo:"jeans", sec:"flare"},
  {nombre:"Modena",       codigo:"4454-00", precio:25990, img:"m19",  tipo:"jeans", sec:"flare"},
  {nombre:"Garda",        codigo:"4472-00", precio:25990, img:"m23",  tipo:"jeans", sec:"flare"},
  {nombre:"Napoli",       codigo:"4472-01", precio:25990, img:"m27",  tipo:"jeans", sec:"flare"},
  {nombre:"Iseo",         codigo:"4475-00", precio:26990, img:"m31",  tipo:"jeans", sec:"flare"},
  {nombre:"Nizza",        codigo:"4484-00", precio:25990, img:"m35",  tipo:"jeans", sec:"flare"},
  {nombre:"Biarritz",     codigo:"4499-00", precio:null,  img:"m39",  tipo:"jeans", sec:"flare"},
  // SKINNY
  {nombre:"Garda Blu",    codigo:"4419-00", precio:null,  img:"m44",  tipo:"jeans", sec:"skinny"},
  {nombre:"Amore",        codigo:"4441-00", precio:24990, img:"m48",  tipo:"jeans", sec:"skinny"},
  {nombre:"Bergamo",      codigo:"4474-00", precio:24990, img:"m52",  tipo:"jeans", sec:"skinny"},
  // WIDE LEG
  {nombre:"Siena",        codigo:"4416-00", precio:26990, img:"m57",  tipo:"jeans", sec:"wideleg"},
  {nombre:"Arles",        codigo:"4431-00", precio:26990, img:"m61",  tipo:"jeans", sec:"wideleg"},
  {nombre:"Verona",       codigo:"4431-01", precio:26990, img:"m65",  tipo:"jeans", sec:"wideleg"},
  // BALLOON
  {nombre:"Stella",       codigo:"4412-00", precio:26990, img:"m70",  tipo:"jeans", sec:"balloon"},
  {nombre:"Genova",       codigo:"4442-00", precio:25990, img:"m74",  tipo:"jeans", sec:"balloon"},
  // OXFORD
  {nombre:"Èze",          codigo:"4443-00", precio:25990, img:"m79",  tipo:"jeans", sec:"oxford"},
  {nombre:"Provence",     codigo:"4478-00", precio:25990, img:"m83",  tipo:"jeans", sec:"oxford"},
  // CROP
  {nombre:"Sole",         codigo:"4438-00", precio:28990, img:"m88",  tipo:"jeans", sec:"crop"},
  {nombre:"Piemonte",     codigo:"4486-00", precio:25990, img:"m92",  tipo:"jeans", sec:"crop"},
  {nombre:"Piemonte",     codigo:"4486-01", precio:25990, img:"m96",  tipo:"jeans", sec:"crop"},
  // RECTOS
  {nombre:"Tivoli",       codigo:"4444-00", precio:25990, img:"m101", tipo:"jeans", sec:"rectos"},
  {nombre:"Bari",         codigo:"4453-00", precio:25990, img:"m105", tipo:"jeans", sec:"rectos"},
  {nombre:"Perla",        codigo:"4453-01", precio:25990, img:"m108", tipo:"jeans", sec:"rectos"},
  {nombre:"Provence",     codigo:"4497-00", precio:null,  img:"m112", tipo:"jeans", sec:"rectos"},
  // PALAZZO
  {nombre:"Vento",        codigo:"4407-00", precio:26990, img:"m116", tipo:"jeans", sec:"palazzo"},
  {nombre:"Lumière",      codigo:"4418-00", precio:26990, img:"m120", tipo:"jeans", sec:"palazzo"},
  {nombre:"Riviera",      codigo:"4455-00", precio:26990, img:"m124", tipo:"jeans", sec:"palazzo"},
  {nombre:"Cassis",       codigo:"4482-00", precio:26990, img:"m128", tipo:"jeans", sec:"palazzo"},
  // SMART DENIM
  {nombre:"Amalfi",       codigo:"4414-00", precio:25990, img:"m133", tipo:"jeans", sec:"smart"},
  // EFECTO FAJA / PUSH IN·UP
  {nombre:"Antibes",      codigo:"4413-00", precio:24990, img:"m139", tipo:"jeans", sec:"faja"},
  {nombre:"Sanremo",      codigo:"4426-00", precio:26990, img:"m143", tipo:"jeans", sec:"faja"},
  {nombre:"Milan",        codigo:"4430-00", precio:25990, img:"m147", tipo:"jeans", sec:"faja"},
  {nombre:"Asti",         codigo:"4480-00", precio:25990, img:"m155", tipo:"jeans", sec:"faja"},
  // COLORES
  {nombre:"Luna",         codigo:"4421-38", precio:26990, img:"m160", tipo:"jeans", sec:"colores"},
  {nombre:"Ravello",      codigo:"4422-00", precio:25990, img:"m164", tipo:"jeans", sec:"colores"},
  {nombre:"Bianca",       codigo:"4457-38", precio:26990, img:"m168", tipo:"jeans", sec:"colores"},
  {nombre:"Rapallo",      codigo:"4493-09", precio:25990, img:"m172", tipo:"jeans", sec:"colores"},
  {nombre:"Èze",          codigo:"4494-04", precio:26990, img:"m176", tipo:"jeans", sec:"colores"},
  {nombre:"Cannes",       codigo:"4495-24", precio:26990, img:"m180", tipo:"jeans", sec:"colores"},
  {nombre:"Mónaco",       codigo:"4496-09", precio:26990, img:"m184", tipo:"jeans", sec:"colores"},
  // LÁSER
  {nombre:"Mare",         codigo:"4486-03", precio:25990, img:"m189", tipo:"jeans", sec:"laser"},
  {nombre:"Roma",         codigo:"4488-00", precio:26990, img:"m193", tipo:"jeans", sec:"laser"},
  {nombre:"Dolce",        codigo:"4489-00", precio:26990, img:"m197", tipo:"jeans", sec:"laser"},
  {nombre:"Florencia",    codigo:"4492-00", precio:25990, img:"m201", tipo:"jeans", sec:"laser"},
  {nombre:"Lucca",        codigo:"4432-00", precio:24990, img:"m205", tipo:"jeans", sec:"skinny"},
  {nombre:"Megève",       codigo:"4434-00", precio:25990, img:"m209", tipo:"jeans", sec:"rectos"},
  {nombre:"Capri",        codigo:"4435-00", precio:25990, img:"m213", tipo:"jeans", sec:"skinny"},
  {nombre:"Lecce",        codigo:"4440-00", precio:25990, img:"m217", tipo:"jeans", sec:"oxford"},
  {nombre:"Ischia",       codigo:"4440-60", precio:25990, img:"m221", tipo:"jeans", sec:"oxford"},
  {nombre:"Alba",         codigo:"4459-00", precio:25990, img:"m225", tipo:"jeans", sec:"crop"},
  {nombre:"Firenze",      codigo:"4471-00", precio:25990, img:"m229", tipo:"jeans", sec:"crop"},
  {nombre:"Belluno",      codigo:"4473-00", precio:24990, img:"m233", tipo:"jeans", sec:"skinny"},
  {nombre:"Mantova",      codigo:"4481-00", precio:25990, img:"m237", tipo:"jeans", sec:"rectos"},
  {nombre:"Monza",        codigo:"4485-00", precio:25990, img:"m241", tipo:"jeans", sec:"rectos"},
  {nombre:"Piemonte",     codigo:"4486-02", precio:25990, img:"m245", tipo:"jeans", sec:"wideleg"},
  {nombre:"Murano",       codigo:"4493-00", precio:25990, img:"m249", tipo:"jeans", sec:"flare"},
  {nombre:"Porto",        codigo:"4493-01", precio:26990, img:"m253", tipo:"jeans", sec:"flare"},
  {nombre:"Limone",       codigo:"4494-00", precio:26990, img:"m257", tipo:"jeans", sec:"rectos"},
  // CHAQUETAS
  {nombre:"Aurelia",      codigo:"4465-00", precio:null,  img:"m262", tipo:"chaqueta", sec:"chaquetas"},
  {nombre:"Aurelia Denim",codigo:"4465-01", precio:null,  img:"m265", tipo:"chaqueta", sec:"chaquetas"},
];

/* ---- VIDEOS ----------------------------------------------- */
const VIDEOS = {
  "4402-00":"4402.mp4",   "4412-00":"4412.mp4",   "4413-00":"4413.mp4",
  "4414-00":"4414.mp4",   "4416-00":"4416.mp4",   "4417-00":"4417.mp4",
  "4418-00":"4418.mp4",   "4421-38":"4421-38.mp4","4426-00":"4426.mp4",
  "4430-00":"4430.mp4",   "4431-00":"4431.mp4",   "4431-01":"4431-01.mp4",
  "4432-00":"4432.mp4",   "4435-00":"4435.mp4",   "4438-00":"4438.mp4",
  "4440-00":"4440.mp4",   "4440-60":"4440-60.mp4","4441-00":"4441.mp4",
  "4442-00":"4442.mp4",   "4443-00":"4443.mp4",   "4444-00":"4444.mp4",
  "4448-00":"4448.mp4",   "4453-01":"4453-01.mp4","4454-00":"4454.mp4",
  "4455-00":"4455.mp4",   "4459-00":"4459.mp4",   "4465-00":"4465.mp4",
  "4465-01":"4465-01.mp4","4471-00":"4471.mp4",   "4472-00":"4472.mp4",
  "4472-01":"4472-01.mp4","4473-00":"4473.mp4",   "4474-00":"4474.mp4",
  "4475-00":"4475.mp4",   "4481-00":"4481.mp4",   "4484-00":"4484.mp4",
  "4486-00":"4486.mp4",   "4486-01":"4486-01.mp4","4488-00":"4488.mp4",
  "4492-00":"4492.mp4",   "4493-00":"4493.mp4",   "4493-01":"4493-01.mp4",
  "4493-09":"4493-09.mp4","4494-04":"4494-04.mp4","4495-24":"4495-24.mp4",
  "4496-09":"4496-09.mp4",
};
const videoSrc = c => VIDEOS[c] ? `../44/videos/video/${VIDEOS[c]}` : null;

/* ============================================================ */
const $     = s => document.querySelector(s) || {};
const CLP   = n => "$" + Number(n).toLocaleString("es-CL");
const tallasDe  = m => m.tipo === "chaqueta" ? TALLAS_CHAQ : TALLAS_JEANS;
const curvaDe   = m => m.tipo === "chaqueta" ? CURVA_CHAQ    : CURVA_JEANS;
const curva17De = m => m.tipo === "chaqueta" ? CURVA_CHAQ_17 : CURVA_JEANS_17;
const buscar    = c => MODELOS.find(m => m.codigo === c);
const nombreSec = id => (SECCIONES.find(s => s.id === id) || {}).nombre || "";
const linkWsp   = txt => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(txt)}`;

/* ---- RUT -------------------------------------------------- */
function normalizarRut(rut) {
  if (!rut) return "";
  const clean = String(rut).replace(/[^0-9kK]/g, "").toUpperCase();
  if (clean.length < 2) return "";
  return clean.slice(0, -1) + "-" + clean.slice(-1);
}
function esRutValido(rut) {
  const n = normalizarRut(rut);
  if (!n) return false;
  const [body, dv] = n.split("-");
  let suma = 0, mul = 2;
  for (let i = body.length - 1; i >= 0; i--) { suma += parseInt(body[i]) * mul; mul = mul === 7 ? 2 : mul + 1; }
  return String(11 - (suma % 11)).replace("10", "K").replace("11", "0") === dv.toUpperCase();
}
function formatRut(rut) {
  const n = normalizarRut(rut);
  if (!n) return rut;
  const [body, dv] = n.split("-");
  return body.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "-" + dv;
}

/* ---- ESTADO ----------------------------------------------- */
let carrito = {};
let modeloAbierto = null;
let selModal = {};
let filtroSec  = "todos";
let filtroDisp = "todos";
let stockData  = {};
fetch("../stock-data-catalogo-44.json")
  .then(r => r.json())
  .then(d => { stockData = d.items || {}; pintarGrid(); })
  .catch(() => {});
function stockTotal(codigo) { return (stockData[codigo] && stockData[codigo].total) || 0; }
function esDisponible(m)    { return stockTotal(m.codigo) > 30; }
let clienteBuscado = null;
let adminToken = sessionStorage.getItem("dv44_admin_token") || "";
let pedidoListo = null;
let snapshotCarrito = null;
let payloadListo = null;
let adminPedidos = [];
let adminPedidoActual = null;

try { const g = localStorage.getItem("dv44_carrito"); if (g) carrito = JSON.parse(g); } catch(e){}
const guardar = () => { try { localStorage.setItem("dv44_carrito", JSON.stringify(carrito)); } catch(e){} };

/* ---- WhatsApp -------------------------------------------- */
$("#wsp-general").href = linkWsp("¡Hola Mohicano! 👖 Soy mayorista y quiero información de la colección DOLCE VITA 44.");

/* ---- FILTROS --------------------------------------------- */
const barra = $("#filtros");
[{id:"todos", nombre:"Todo el catálogo"}, ...SECCIONES].forEach(s => {
  const b = document.createElement("button");
  b.className = "chip" + (s.id === "todos" ? " activo" : "");
  b.textContent = s.nombre;
  b.onclick = () => {
    filtroSec = s.id;
    document.querySelectorAll(".chip:not(.chip-disp)").forEach(c => c.classList.remove("activo"));
    b.classList.add("activo");
    pintarGrid();
  };
  barra.insertBefore(b, $("#busca"));
});

// Chips de disponibilidad — fila separada
const barraDisp = document.getElementById("filtros-disp");
[{id:"todos", label:"Todos"}, {id:"disponible", label:"✓ Disponible"}, {id:"produccion", label:"⏳ En producción"}].forEach(d => {
  const b = document.createElement("button");
  b.className = "chip chip-disp" + (d.id === "todos" ? " activo" : "");
  b.dataset.disp = d.id;
  b.textContent = d.label;
  b.onclick = () => {
    filtroDisp = d.id;
    document.querySelectorAll(".chip-disp").forEach(c => c.classList.remove("activo"));
    b.classList.add("activo");
    pintarGrid();
  };
  barraDisp.appendChild(b);
});
const ADMIN_CODE = "DV44**";
$("#busca").value = "";
$("#busca").addEventListener("input", () => {
  const val = $("#busca").value;
  if (val === ADMIN_CODE) {
    $("#busca").value = "";
    pintarGrid();
    $("#btn-admin").classList.add("visible");
    return;
  }
  pintarGrid();
});

/* ---- GRID ------------------------------------------------- */
function cardHTML(m) {
  const disp    = esDisponible(m);
  const dispHTML = disp
    ? `<span class="pill-disp">✓ Disponible</span>`
    : `<span class="pill-prod">⏳ En producción</span>`;
  return `
    <article class="card">
      <div class="marco" onclick="abrirModal('${m.codigo}')">
        <img src="img/${m.img}_0.webp" alt="${m.nombre} ${m.codigo}" loading="lazy">
      </div>
      <div class="cuerpo">
        <h3>${m.nombre}</h3>
        <p class="codigo">Código <b>${m.codigo}</b> · ${nombreSec(m.sec)}</p>
        ${dispHTML}
        <p class="precio">${m.precio ? CLP(m.precio) : "A consultar"}<small>${m.precio ? "por unidad · IVA incluido" : "precio mayorista · consultar"}</small></p>
        <div class="botones">
          <div class="fila">
            ${disp
              ? `<button class="btn btn-rojo" onclick="abrirModal('${m.codigo}')">Armar curva</button>`
              : `<button class="btn btn-borde" onclick="abrirModal('${m.codigo}')">Ver modelo</button>`}
            ${videoSrc(m.codigo) ? `<button class="btn btn-video" onclick="abrirVideo('${m.codigo}')">▶ Video</button>` : ""}
          </div>
        </div>
      </div>
      <div class="pie-flag"><i></i><i></i><i></i></div>
    </article>`;
}

function pintarGrid() {
  const q = $("#busca").value.trim().toLowerCase();
  const pasa = m =>
    (filtroSec === "todos" || m.sec === filtroSec) &&
    (filtroDisp === "todos" || (filtroDisp === "disponible" ? esDisponible(m) : !esDisponible(m))) &&
    (!q || m.nombre.toLowerCase().includes(q) || m.codigo.includes(q));
  let html = "", visibles = 0;
  SECCIONES.forEach(s => {
    const modelos = MODELOS.filter(m => m.sec === s.id && pasa(m));
    if (!modelos.length) return;
    const invertida = visibles % 2 === 1 ? " invertida" : "";
    visibles++;
    html += `
      <section class="seccion${invertida}" id="sec-${s.id}">
        <div class="titulo-sec">
          <h2>${s.nombre}</h2>
          <span>${modelos.length} modelo${modelos.length > 1 ? "s" : ""}</span>
          <div class="bandera-sec"><i></i><i></i><i></i></div>
        </div>
        <div class="cuerpo-sec">
          <div class="cover-sec"><img src="img/${s.cover}.webp" alt="${s.nombre}" loading="lazy"></div>
          <div class="grid">${modelos.map(cardHTML).join("")}</div>
        </div>
      </section>`;
  });
  $("#catalogo").innerHTML = html || `<p class="vacio">No encontramos modelos para tu búsqueda.</p>`;
}
pintarGrid();

/* ---- MODAL PRODUCTO --------------------------------------- */
window.abrirModal = function(codigo) {
  const m = buscar(codigo); if (!m) return;
  modeloAbierto = m;
  selModal = { ...(carrito[codigo]?.t || {}) };
  $("#m-nombre").textContent = m.nombre;
  $("#m-codigo").textContent = "Código " + m.codigo + " · " + nombreSec(m.sec) + " · Dolce Vita 44";
  $("#m-precio").innerHTML = m.precio ? CLP(m.precio) + "<small>por unidad · IVA incluido</small>" : "Precio a consultar<small>se cotiza por WhatsApp</small>";
  const fotos = [0, 1, 2].map(i => `img/${m.img}_${i}.webp`);
  $("#img-principal").src = fotos[0];
  $("#minis").innerHTML = fotos.map((f, i) => `<img src="${f}" class="${i===0?"activa":""}" onclick="cambiarFoto(this)" alt="vista ${i+1}">`).join("");
  pintarTallasModal();
  const cajonEstabaAbierto = $("#cajon").classList.contains("abierto");
  cerrarCajon();
  window._modalDesdeCajon = cajonEstabaAbierto;
  $("#velo-modal").classList.add("abierto");
  document.body.style.overflow = "hidden";
};
window.cambiarFoto = function(el) {
  $("#img-principal").src = el.getAttribute("src");
  document.querySelectorAll("#minis img").forEach(i => i.classList.remove("activa"));
  el.classList.add("activa");
};
function pintarTallasModal() {
  const m = modeloAbierto;
  $("#m-tallas").innerHTML = tallasDe(m).map(t => `
    <div class="talla-fila">
      <span class="t">${t}</span>
      <input type="number" class="cant-input" id="cant-${t}"
             min="0" max="99" value="${selModal[t]||0}"
             onfocus="this.select()"
             oninput="setCant('${t}',this.value)">
    </div>`).join("");
  actualizarTotalModal();
}
window.setCant = function(t, v) {
  const n = Math.max(0, parseInt(v) || 0);
  if (n > 0) selModal[t] = n;
  else delete selModal[t];
  actualizarTotalModal();
};
function aplicarCurva(cv) {
  tallasDe(modeloAbierto).forEach(t => {
    const n = cv[t] || 0;
    if (n > 0) selModal[t] = n; else delete selModal[t];
    const inp = document.getElementById("cant-" + t);
    if (inp) inp.value = n;
  });
  actualizarTotalModal();
}
function totalSel() { return Object.values(selModal).reduce((a,b) => a+b, 0); }
function actualizarTotalModal() {
  const tot = totalSel();
  $("#m-total").textContent = tot;
  $("#m-aviso").classList.toggle("ver", tot > 0 && tot < MIN_POR_MODELO);
}
$("#m-curva12").onclick = () => {
  aplicarCurva(curvaDe(modeloAbierto));
  toast("Curva 12 unidades aplicada ✔");
};
$("#m-curva17").onclick = () => {
  aplicarCurva(curva17De(modeloAbierto));
  toast("Curva 17 unidades aplicada ✔");
};
$("#m-agregar").onclick = () => {
  const tot = totalSel();
  if (tot === 0) { toast("Elige cantidades por talla primero"); return; }
  if (tot < MIN_POR_MODELO) { $("#m-aviso").classList.add("ver"); toast("Mínimo "+MIN_POR_MODELO+" unidades por modelo"); return; }
  carrito[modeloAbierto.codigo] = { t: {...selModal} };
  guardar(); pintarCarrito();
  cerrarModal();
  toast(modeloAbierto.nombre + " agregado al pedido 🛒");
};
function cerrarModal() {
  $("#velo-modal").classList.remove("abierto");
  document.body.style.overflow = "";
  if (window._modalDesdeCajon) { window._modalDesdeCajon = false; abrirCajon(false); pintarCarrito(); }
}
$("#cerrar-modal").onclick = cerrarModal;
$("#velo-modal").addEventListener("click", e => { if (e.target === $("#velo-modal")) cerrarModal(); });

/* ---- VIDEO MODAL ------------------------------------------ */
window.abrirVideo = function(codigo) {
  const src = videoSrc(codigo);
  if (!src) return;
  const m = buscar(codigo);
  const vv = document.getElementById("video-player");
  const vt = document.getElementById("video-titulo");
  if (vt) vt.textContent = m ? `${m.nombre} · ${m.codigo}` : codigo;
  if (vv) { vv.src = src; vv.play().catch(() => {}); }
  document.getElementById("video-modal").style.display = "flex";
  document.body.style.overflow = "hidden";
};
window.cerrarVideo = function() {
  const vv = document.getElementById("video-player");
  if (vv) { vv.pause(); vv.src = ""; }
  document.getElementById("video-modal").style.display = "none";
  document.body.style.overflow = "";
};

/* ---- CARRITO --------------------------------------------- */
function datosCarrito() {
  let prendas = 0, total = 0, consultar = false;
  Object.entries(carrito).forEach(([c, v]) => {
    const m = buscar(c); if (!m) return;
    const n = Object.values(v.t).reduce((a,b) => a+b, 0);
    prendas += n;
    if (m.precio) total += n * m.precio; else consultar = true;
  });
  return { prendas, total, consultar, curvas: Math.round((prendas / MIN_POR_MODELO) * 10) / 10 };
}
function pintarCarrito() {
  const cont = $("#items-carrito");
  const codigos = Object.keys(carrito);
  $("#num-carrito").textContent = datosCarrito().prendas;
  if (!codigos.length) {
    cont.innerHTML = `<p class="vacio">Aún no agregas modelos.<br>Explora el catálogo y arma tus curvas 👖</p>`;
  } else {
    cont.innerHTML = codigos.map(c => {
      const m = buscar(c); const v = carrito[c]; if (!m) return "";
      const n = Object.values(v.t).reduce((a,b) => a+b, 0);
      const sub = m.precio ? CLP(n * m.precio) : "A consultar";
      const bajo = n < MIN_POR_MODELO ? `<p class="falta">⚠ Faltan ${MIN_POR_MODELO-n} u. para el mínimo</p>` : "";
      return `<div class="item-c" data-sku="${c}">
        <img src="img/${m.img}_0.webp" alt="${m.nombre}">
        <div class="info">
          <h4>${m.nombre}</h4>
          <p class="cod">${m.codigo} · ${m.precio?CLP(m.precio)+" c/u":"precio a consultar"}</p>
          <div class="tallas-mini">${Object.entries(v.t).map(([t,q])=>`<span>${t} × ${q}</span>`).join("")}</div>
          ${bajo}
          <div class="abajo"><span>${n} prendas</span><b>${sub}</b></div>
          <div style="margin-top:.4rem">
            <button class="editar" onclick="abrirModal('${c}')">Editar tallas</button>
            <button class="quitar" onclick="quitar('${c}')">Quitar</button>
          </div>
        </div>
      </div>`;
    }).join("");
  }
  const d = datosCarrito();
  $("#c-prendas").textContent = d.prendas;
  $("#c-curvas").textContent = d.curvas;
  if (d.consultar) {
    $("#c-neto").textContent = "—";
    $("#c-iva").textContent = "—";
    $("#c-total").textContent = CLP(d.total) + " + a consultar";
  } else {
    const neto = Math.round(d.total / 1.19);
    const iva  = d.total - neto;
    $("#c-neto").textContent = CLP(neto);
    $("#c-iva").textContent  = CLP(iva);
    $("#c-total").textContent = CLP(d.total);
  }
}
window.quitar = async function(c) {
  const ok = await customConfirm("¿Quitar artículo?", "Se eliminará este modelo del pedido.", { okTexto: "Sí, quitar", ico: "🗑" });
  if (!ok) return;
  const el = document.querySelector(`.item-c[data-sku="${c}"]`);
  if (el) {
    el.classList.add("saliendo");
    await new Promise(r => setTimeout(r, 320));
  }
  delete carrito[c]; guardar(); pintarCarrito();
  toast("Artículo eliminado del pedido");
};
pintarCarrito();

function abrirCajon(resetForm = true) {
  $("#cajon").classList.add("abierto");
  $("#cajon-velo").classList.add("abierto");
  if (resetForm) {
    elRut().value = "";
    setRutEstado("", "");
    mostrarCampos(false);
    limpiarForm();
    clienteBuscado = null;
    pedidoListo = null; snapshotCarrito = null; payloadListo = null;
    $("#btn-finalizar").style.display = "none";
    $("#exito").classList.remove("ver");
  }
}
function cerrarCajon() { $("#cajon").classList.remove("abierto"); $("#cajon-velo").classList.remove("abierto"); }
$("#abrir-carrito").onclick = () => { abrirCajon(true); pintarCarrito(); };
$("#cerrar-cajon").onclick = cerrarCajon;
$("#cajon-velo").onclick = cerrarCajon;

/* ---- FORMULARIO CLIENTE: RUT LOOKUP ----------------------- */
const elRut      = () => $("#f-rut");
const elNombre   = () => $("#f-nombre");
const elFono     = () => $("#f-fono");
const elGiro     = () => $("#f-giro");
const elDir      = () => $("#f-dir");
const elTienda   = () => $("#f-tienda");
const elComuna   = () => $("#f-comuna");
const elTransp   = () => $("#f-transporte");
const elNota     = () => $("#f-nota");
const elCampos   = () => $("#campos-cliente");
const elEstado   = () => $("#rut-estado");

function setRutEstado(tipo, msg) {
  const el = elEstado();
  el.className = "rut-estado " + tipo;
  el.textContent = msg;
}
function setCampoVisible(id, visible) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.display = visible ? "" : "none";
  const prev = el.previousElementSibling;
  if (prev && prev.classList.contains("form-label")) prev.style.display = visible ? "" : "none";
}

function mostrarCampos(modo) {
  // modo: false = ocultar todo | "existente" = solo nota | "nuevo" = todo
  const mostrar = !!modo;
  elCampos().style.display = mostrar ? "flex" : "none";
  if (!mostrar) return;
  const esNuevo = modo === "nuevo";
  setCampoVisible("f-nombre",    esNuevo);
  setCampoVisible("f-fono",      esNuevo);
  setCampoVisible("f-giro",      esNuevo);
  setCampoVisible("f-dir",       esNuevo);
  setCampoVisible("f-tienda",    esNuevo);
  setCampoVisible("f-comuna",    esNuevo);
  setCampoVisible("f-transporte",esNuevo);
  setCampoVisible("f-nota",      true);
}

function limpiarForm() {
  [elNombre(), elFono(), elGiro(), elDir(), elTienda(), elComuna(), elNota()].forEach(e => { if (e) e.value = ""; });
  if (elTransp()) elTransp().value = "";
  const ot = $("#f-transporte-otro"); if (ot) ot.value = "";
  const ow = $("#f-transporte-otro-wrap"); if (ow) ow.style.display = "none";
}

function setTranspValue(val) {
  if (!val) return;
  const sel = elTransp();
  const known = ["Starken","Chilexpress","Bus","Retiro en bodega"];
  if (known.includes(val)) {
    sel.value = val;
  } else {
    sel.value = "Otro";
    $("#f-transporte-otro-wrap").style.display = "block";
    $("#f-transporte-otro").value = val;
  }
}

window.toggleTranspOtro = function(sel) {
  const esOtro = sel.value === "Otro";
  $("#f-transporte-otro-wrap").style.display = esOtro ? "block" : "none";
  if (!esOtro) { $("#f-transporte-otro").value = ""; return; }
  setTimeout(() => $("#f-transporte-otro").focus(), 30);
};

async function buscarClientePorRut() {
  const rawRut = elRut().value.trim();
  const norm = normalizarRut(rawRut);
  if (!norm || !esRutValido(norm)) {
    setRutEstado("error", "RUT inválido — revisa el formato (ej: 12.345.678-9)");
    mostrarCampos(false);
    clienteBuscado = null;
    return;
  }
  elRut().value = formatRut(norm);
  setRutEstado("buscando", "Buscando cliente…");
  mostrarCampos(false);
  clienteBuscado = null;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/lookup_client_by_rut`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ p_rut: norm }),
    });
    const data = await res.json().catch(() => null);
    const row = Array.isArray(data) ? data[0] : data;
    if (row && row.razon_social) {
      clienteBuscado = { rut: formatRut(norm), rut_normalized: norm, razon_social: row.razon_social, is_new: false };
      limpiarForm();
      // intentar pre-llenar campos si el RPC los devuelve
      if (row.telefono || row.phone)  elFono().value   = row.telefono || row.phone || "";
      if (row.giro)                   elGiro().value   = row.giro;
      if (row.direccion)              elDir().value    = row.direccion;
      if (row.nombre_tienda)          elTienda().value = row.nombre_tienda;
      if (row.comuna)                 elComuna().value = row.comuna;
      const transpGuardado = row.transporte || localStorage.getItem("dv44_transp_" + norm) || "";
      setTranspValue(transpGuardado);
      setRutEstado("ok", "✔ Cliente encontrado: " + row.razon_social);
      mostrarCampos("existente");
    } else {
      clienteBuscado = { rut: formatRut(norm), rut_normalized: norm, razon_social: "", is_new: true };
      limpiarForm();
      elNombre().readOnly = false;
      const transpGuardado = localStorage.getItem("dv44_transp_" + norm) || "";
      setTranspValue(transpGuardado);
      setRutEstado("nuevo", "Cliente nuevo — completa los datos");
      mostrarCampos("nuevo");
    }
    actualizarBotonRut();
    $("#btn-finalizar").style.display = "flex";
  } catch(e) {
    setRutEstado("error", "No se pudo verificar el RUT — revisa tu conexión");
    mostrarCampos(false);
  }
}

/* ---- DESTACAR CAMPO RUT ---------------------------------- */
function resaltarRut() {
  const inp = elRut();
  if (!inp || !inp.focus) return;
  inp.classList.remove("highlight");
  void inp.offsetWidth; // fuerza reflow para reiniciar animación
  inp.classList.add("highlight");
  setTimeout(() => inp.classList.remove("highlight"), 600);
  inp.focus();
  if (inp.select) inp.select();
  document.getElementById("zona-rut").scrollIntoView({ behavior: "smooth", block: "center" });
}
function actualizarBotonRut() {
  if (!clienteBuscado) return;
  const t = document.getElementById("rut-btn-titulo");
  const s = document.getElementById("rut-btn-sub");
  if (t) t.textContent = clienteBuscado.is_new
    ? "Cliente nuevo — completá los datos"
    : "✔ " + (clienteBuscado.razon_social || clienteBuscado.rut);
  if (s) s.textContent = clienteBuscado.rut + " · Toca para cambiar";
}
$("#btn-abrir-rut").onclick = resaltarRut;

elRut().addEventListener("keydown", e => { if (e.key === "Enter") buscarClientePorRut(); });

let rutDebounceT;
elRut().addEventListener("input", () => {
  clearTimeout(rutDebounceT);
  const norm = normalizarRut(elRut().value.trim());
  if (norm && norm.length >= 8) {
    rutDebounceT = setTimeout(buscarClientePorRut, 650);
  }
});

/* ---- CHECKOUT --------------------------------------------- */
function validarCamposForm() {
  const esNuevo = clienteBuscado?.is_new ?? true;
  const reqs = esNuevo
    ? [
        { el: elNombre(),  label: "Razón Social" },
        { el: elFono(),    label: "Teléfono" },
        { el: elGiro(),    label: "Giro" },
        { el: elDir(),     label: "Dirección" },
        { el: elTienda(),  label: "Nombre Tienda" },
        { el: elComuna(),  label: "Comuna" },
        { el: elTransp(),  label: "Transporte" },
      ]
    : []; // cliente existente: sin campos obligatorios adicionales
  for (const r of reqs) {
    if (!r.el || !r.el.value.trim()) {
      toast("Completa el campo: " + r.label);
      r.el && r.el.focus();
      return false;
    }
  }
  // Validar "Otro transporte" si está visible
  if (elTransp().value === "Otro" && !$("#f-transporte-otro").value.trim()) {
    toast("Indica cuál es el transporte");
    $("#f-transporte-otro").focus();
    return false;
  }
  return true;
}

function obtenerDatosCliente() {
  return {
    rut:          clienteBuscado?.rut || elRut().value.trim(),
    rut_normalized: clienteBuscado?.rut_normalized || normalizarRut(elRut().value.trim()),
    razon_social: clienteBuscado?.razon_social || elNombre().value.trim(),
    client_phone: elFono().value.trim(),
    giro:         elGiro().value.trim(),
    direccion:    elDir().value.trim(),
    nombre_tienda: elTienda().value.trim(),
    comuna:       elComuna().value.trim(),
    transporte:   elTransp().value === "Otro"
                    ? ($("#f-transporte-otro").value.trim() || "Otro")
                    : elTransp().value.trim(),
    nota:         elNota().value.trim(),
    is_new:       clienteBuscado?.is_new ?? true,
  };
}

function construirPayload(cliente) {
  const quoteId = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2);
  let totalItems = 0;
  const lineas = [];
  Object.entries(carrito).forEach(([codigo, v]) => {
    Object.entries(v.t).forEach(([talla, cantidad]) => {
      const qty = Number(cantidad) || 0;
      if (qty <= 0) return;
      totalItems += qty;
      lineas.push({ sku: codigo, talla, cantidad: qty });
    });
  });
  return {
    quote: {
      id: quoteId,
      store_name: cliente.razon_social,
      client_rut: cliente.rut,
      client_rut_normalized: cliente.rut_normalized,
      client_phone: cliente.client_phone,
      total_items: totalItems,
      created_at_client: new Date().toISOString(),
      source: SOURCE_PEDIDO,
      giro: cliente.giro || null,
      direccion: cliente.direccion || null,
      nombre_tienda: cliente.nombre_tienda || null,
      comuna: cliente.comuna || null,
      transporte: cliente.transporte || null,
    },
    items: lineas,
  };
}

async function guardarEnSupabase(payload) {
  const headers = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=minimal",
  };
  const qRes = await fetch(`${SUPABASE_URL}/rest/v1/quotes`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload.quote),
  });
  if (!qRes.ok) throw new Error("Error guardando pedido: " + (await qRes.text() || qRes.status));
  const iRes = await fetch(`${SUPABASE_URL}/rest/v1/quote_items`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload.items.map(it => ({
      quote_id: payload.quote.id,
      sku: it.sku,
      size: it.talla,
      quantity: it.cantidad,
    }))),
  });
  if (!iRes.ok) throw new Error("Error guardando items: " + (await iRes.text() || iRes.status));
  return payload.quote.id;
}

function notificarPedido(cliente, payload) {
  const items = Object.entries(carrito).map(([codigo, v]) => {
    const total = Object.values(v.t).reduce((s, n) => s + (Number(n) || 0), 0);
    return { codigo, nombre: v.nombre || "", totalUnidades: total };
  }).filter(i => i.totalUnidades > 0);
  const totalUnidades = items.reduce((s, i) => s + i.totalUnidades, 0);
  const body = {
    quoteId:     payload?.quote?.id || "",
    storeName:   cliente.razon_social || cliente.nombre_tienda || "",
    rut:         cliente.rut || "",
    phone:       cliente.client_phone || "",
    transporte:  cliente.transporte || "",
    ciudad:      cliente.comuna || "",
    items,
    totalUnidades,
  };
  fetch("/.netlify/functions/notify-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => {});
}

$("#btn-finalizar").onclick = async () => {
  const codigos = Object.keys(carrito);
  if (!codigos.length) { toast("Tu pedido está vacío"); return; }
  const bajos = codigos.filter(c => Object.values(carrito[c].t).reduce((a,b)=>a+b,0) < MIN_POR_MODELO);
  if (bajos.length) { toast("Hay modelos bajo el mínimo de "+MIN_POR_MODELO+" u.: "+bajos.join(", ")); return; }

  if (!clienteBuscado) { toast("Ingresa y verifica el RUT del cliente"); elRut().focus(); return; }
  if (!validarCamposForm()) return;

  const totalUnidades = codigos.reduce((s,c) => s + Object.values(carrito[c].t).reduce((a,b)=>a+b,0), 0);
  const confirmar = await customConfirm(
    "¿Enviar pedido?",
    `${codigos.length} modelo${codigos.length!==1?"s":""} · ${totalUnidades} unidades. Una vez enviado se descarga el Excel automáticamente.`,
    { okTexto: "Sí, enviar", ico: "📤" }
  );
  if (!confirmar) return;

  const cliente = obtenerDatosCliente();
  pedidoListo = { ...cliente, fecha: new Date() };
  const payload = construirPayload(cliente);

  const gEl = $("#guardando-estado");
  gEl.style.display = "block";
  gEl.innerHTML = `<span class="spinner"></span> Guardando pedido en Supabase…`;
  $("#btn-finalizar").disabled = true;

  try {
    await guardarEnSupabase(payload);
    if (cliente.transporte && clienteBuscado?.rut_normalized) {
      localStorage.setItem("dv44_transp_" + clienteBuscado.rut_normalized, cliente.transporte);
    }
    // Snapshot del carrito antes de vaciarlo (para re-descarga)
    snapshotCarrito = JSON.parse(JSON.stringify(carrito));
    payloadListo = payload;
    // Notificar pedido por Telegram
    notificarPedido(cliente, payload);
    // Generar Excel (lee carrito sincrónicamente antes del primer await interno)
    generarExcel(pedidoListo, payload);
    // Link WhatsApp antes de vaciar (usa carrito)
    const wspLink = linkWsp(textoPedido(cliente, payload));
    // Vaciar carrito
    carrito = {}; guardar(); pintarCarrito();
    // Mostrar éxito y cerrar carrito
    gEl.style.display = "none";
    $("#exito").classList.add("ver");
    $("#btn-wsp-pedido").href = wspLink;
    $("#btn-finalizar").style.display = "none";
    setTimeout(cerrarCajon, 1800);
    toast("Pedido guardado y Excel descargado ⬇");
  } catch(err) {
    gEl.style.display = "none";
    $("#btn-finalizar").disabled = false;
    toast("Error: " + err.message);
  }
};
$("#btn-excel-otra").onclick = () => {
  if (pedidoListo && snapshotCarrito) generarExcel(pedidoListo, payloadListo, snapshotCarrito);
};
$("#btn-cerrar-exito").onclick = () => cerrarCajon();

function textoPedido(cliente, payload) {
  const d = datosCarrito();
  const lineas = Object.keys(carrito).map(c => {
    const m = buscar(c); const v = carrito[c];
    const n = Object.values(v.t).reduce((a,b)=>a+b,0);
    const det = Object.entries(v.t).map(([t,q])=>`${t}×${q}`).join(" ");
    return `• *${m.nombre} ${m.codigo}*: ${n} u. (${det})${m.precio?` — ${CLP(n*m.precio)}`:" — a consultar"}`;
  });
  return `¡Hola Mohicano! 🇮🇹 Pedido mayorista *DOLCE VITA 44*\n\n`+
    `👤 ${cliente.razon_social}\n🪪 RUT: ${cliente.rut}\n📞 ${cliente.client_phone}\n`+
    (cliente.nota?`📝 ${cliente.nota}\n`:"")+
    `\n${lineas.join("\n")}\n\n`+
    `Total: *${d.prendas} prendas* (${d.curvas} curvas) — *${CLP(d.total)}*${d.consultar?" + ítems a consultar":""}\n\n`+
    `📎 Adjunto el Excel con el detalle del pedido.`;
}

/* ---- EXCEL (cliente) — Nota de Pedido con diseño --------- */
function colToLetter(n) {
  let s = "";
  while (n > 0) { const r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26); }
  return s;
}

async function generarExcel(cliente, payload, carritoRef) {
  const c = carritoRef || carrito;
  const f = cliente.fecha || new Date();
  const fechaStr = f.toLocaleDateString("es-CL") + " " + f.toLocaleTimeString("es-CL", {hour:"2-digit",minute:"2-digit"});

  // Capturar datos del carrito ANTES de cualquier await
  const tallasUsadas = [];
  for (const t of [...TALLAS_JEANS, ...TALLAS_CHAQ]) {
    if (Object.values(c).some(v => v.t[t] && v.t[t] > 0)) tallasUsadas.push(t);
  }
  const modelos = Object.keys(c).map((cod, i) => {
    const m = buscar(cod); const v = c[cod]; if (!m) return null;
    const n = Object.values(v.t).reduce((a, b) => a + b, 0);
    return { m, v, n, i };
  }).filter(Boolean);

  const tot = modelos.reduce((a, x) => a + x.n, 0);
  const totalPesos = modelos.reduce((a, x) => a + (x.m.precio ? x.n * x.m.precio : 0), 0);
  const neto = Math.round(totalPesos / 1.19);
  const iva  = totalPesos - neto;

  // Columnas de la tabla
  const C_NUM = 1, C_COD = 2, C_NOM = 3;
  const C_TAL = 4;
  const C_TOT = C_TAL + tallasUsadas.length;
  const C_PRC = C_TOT + 1;
  const C_SUB = C_PRC + 1;
  const LAST  = C_SUB;

  const AZUL = "12283A", ROJO = "D81F2A", AZUL2 = "1E3C55";
  const GF   = "F3F8FB";
  const bT = { style: "thin", color: "C8DDE8" };
  const bA = { top: bT, bottom: bT, left: bT, right: bT };
  const clp = v => typeof v === "number"
    ? "$ " + v.toLocaleString("es-CL")
    : String(v);

  // ── async section ─────────────────────────────────────────
  const XP = await loadXlsxPopulate();
  const wb = await XP.fromBlankAsync();
  const sh = wb.sheet(0).name("Nota de Pedido");

  const L = colToLetter(LAST);

  // Fila 1: logo
  sh.range(`A1:${L}1`).merged(true);
  sh.cell("A1").value("MOHICANO JEANS").style({
    bold:true, fontSize:18, fontColor:"FFFFFF", fill:AZUL,
    horizontalAlignment:"center", verticalAlignment:"center"
  });
  sh.row(1).height(32);

  // Fila 2: colección
  sh.range(`A2:${L}2`).merged(true);
  sh.cell("A2").value("DOLCE VITA · COLECCIÓN 44").style({
    bold:true, fontSize:10, fontColor:"FFFFFF", fill:ROJO,
    horizontalAlignment:"center", verticalAlignment:"center"
  });
  sh.row(2).height(18);

  // Fila 3: subtítulo
  sh.range(`A3:${L}3`).merged(true);
  sh.cell("A3").value("NOTA DE PEDIDO").style({
    bold:true, italic:true, fontSize:9, fontColor:"FFFFFF", fill:AZUL2,
    horizontalAlignment:"center", verticalAlignment:"center"
  });
  sh.row(3).height(14);

  sh.row(4).height(8);

  // Filas 5-8: datos cliente
  const lbl = { bold:true, fontSize:9, fontColor:"4A6070" };
  const val = { fontSize:9 };
  const valB = { fontSize:9, bold:true };
  const halfL = colToLetter(Math.max(1, Math.floor(LAST / 2)));
  const halfR = colToLetter(Math.max(2, Math.floor(LAST / 2) + 1));

  sh.cell("A5").value("Fecha").style(lbl);
  sh.range(`B5:${halfL}5`).merged(true).value(fechaStr).style(val);
  sh.cell(5, Math.floor(LAST / 2) + 1).value("RUT").style(lbl);
  sh.range(`${halfR}5:${L}5`).merged(true).value(cliente.rut || "").style(valB);

  sh.cell("A6").value("Razón Social").style(lbl);
  sh.range(`B6:${L}6`).merged(true).value(cliente.razon_social || "").style(valB);

  sh.cell("A7").value("Teléfono").style(lbl);
  sh.range(`B7:${halfL}7`).merged(true).value(cliente.client_phone || "").style(val);
  sh.cell(7, Math.floor(LAST / 2) + 1).value("Transporte").style(lbl);
  sh.range(`${halfR}7:${L}7`).merged(true).value(cliente.transporte || "").style(val);

  if (cliente.nota) {
    sh.cell("A8").value("Comentario").style(lbl);
    sh.range(`B8:${L}8`).merged(true).value(cliente.nota).style(val);
  }

  sh.row(9).height(8);

  // Fila 10: cabecera tabla
  ["#", "Código", "Modelo", ...tallasUsadas, "Total", "Precio unit.", "Subtotal"].forEach((h, i) => {
    sh.cell(10, i + 1).value(h).style({
      bold:true, fontSize:9, fontColor:"FFFFFF", fill:AZUL,
      horizontalAlignment:"center", verticalAlignment:"center", border:bA
    });
  });
  sh.row(10).height(20);

  // Filas 11+: ítems
  modelos.forEach(({ m, v, n, i }) => {
    const row = 11 + i;
    const rf = i % 2 === 0 ? "FFFFFF" : GF;
    const rs = { fontSize:9, fill:rf, border:bA };
    sh.cell(row, C_NUM).value(i + 1).style({ ...rs, horizontalAlignment:"center" });
    sh.cell(row, C_COD).value(m.codigo).style({ ...rs, horizontalAlignment:"center" });
    sh.cell(row, C_NOM).value(m.nombre).style({ ...rs, bold:true });
    tallasUsadas.forEach((t, ti) => {
      sh.cell(row, C_TAL + ti).value(v.t[t] || "").style({ ...rs, horizontalAlignment:"center" });
    });
    sh.cell(row, C_TOT).value(n).style({ ...rs, horizontalAlignment:"center", bold:true });
    sh.cell(row, C_PRC).value(m.precio ? clp(m.precio) : "Consultar").style({ ...rs, horizontalAlignment:"right" });
    sh.cell(row, C_SUB).value(m.precio ? clp(n * m.precio) : "Consultar").style({ ...rs, horizontalAlignment:"right", bold:true });
    sh.row(row).height(16);
  });

  // Totales
  const sp = 11 + modelos.length;
  sh.row(sp).height(8);

  [
    { label:"Total prendas", val:tot,           bold:false, color:"333333", size:9 },
    { label:"Neto",           val:clp(neto),      bold:false, color:"555555", size:9 },
    { label:"IVA (19%)",      val:clp(iva),       bold:false, color:"555555", size:9 },
    { label:"TOTAL CON IVA",  val:clp(totalPesos),bold:true,  color:ROJO,     size:11 },
  ].forEach(({ label, val: v2, bold: b, color, size }, i) => {
    const r = sp + 1 + i;
    sh.range(`A${r}:${colToLetter(C_TOT)}${r}`).merged(true)
      .value(label).style({ bold:b, fontSize:size, fontColor:color, horizontalAlignment:"right" });
    sh.cell(r, C_SUB).value(v2).style({ bold:b, fontSize:size, fontColor:color, horizontalAlignment:"right" });
    sh.row(r).height(i === 3 ? 22 : 16);
  });

  const noteRow = sp + 6;
  sh.range(`A${noteRow}:${L}${noteRow}`).merged(true)
    .value("Los precios incluyen IVA. Los modelos 'Consultar' se cotizan por separado.")
    .style({ fontSize:7, italic:true, fontColor:"AAAAAA" });

  // Anchos de columna
  sh.column(colToLetter(C_NUM)).width(4);
  sh.column(colToLetter(C_COD)).width(11);
  sh.column(colToLetter(C_NOM)).width(22);
  tallasUsadas.forEach((t, i) => sh.column(colToLetter(C_TAL + i)).width(6));
  sh.column(colToLetter(C_TOT)).width(8);
  sh.column(colToLetter(C_PRC)).width(15);
  sh.column(colToLetter(C_SUB)).width(15);

  // Descargar
  const blob = await wb.outputAsync();
  const url = URL.createObjectURL(new Blob([blob], { type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
  const a = document.createElement("a");
  const nombreCliente = String(cliente.razon_social || cliente.rut || "").replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]/g," ").trim().replace(/\s+/g,"_").slice(0,30);
  const yyyymmdd = f.getFullYear() + String(f.getMonth()+1).padStart(2,"0") + String(f.getDate()).padStart(2,"0");
  a.href = url; a.download = `NotaPedido_DolceVita44_${nombreCliente}_${yyyymmdd}.xlsx`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 8000);
}

/* ---- XLSX-POPULATE + PLANILLA 44 -------------------------- */
let xlsxPopulatePromise = null;
function loadXlsxPopulate() {
  if (window.XlsxPopulate) return Promise.resolve(window.XlsxPopulate);
  if (xlsxPopulatePromise) return xlsxPopulatePromise;
  xlsxPopulatePromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://unpkg.com/xlsx-populate/browser/xlsx-populate.min.js";
    s.onload = () => window.XlsxPopulate ? resolve(window.XlsxPopulate) : reject(new Error("XlsxPopulate no cargó"));
    s.onerror = () => reject(new Error("No se pudo cargar xlsx-populate"));
    document.head.appendChild(s);
  });
  return xlsxPopulatePromise;
}

let templateBuffer44 = null;
async function loadTemplate44() {
  if (templateBuffer44) return templateBuffer44;
  const url = location.origin + "/PLANILLA%2044%20LISTA%20PRECIO%20FINAL.xlsx";
  const resp = await fetch(url);
  if (!resp.ok) throw new Error("No se encontró la PLANILLA 44 en " + url + " (" + resp.status + ")");
  templateBuffer44 = await resp.arrayBuffer();
  return templateBuffer44;
}

function skuNumerico(sku) {
  const limpio = String(sku).replace(/[^0-9kK]/gi, "");
  if (/^\d{6}$/.test(limpio)) return Number(limpio);
  if (/^\d{4}$/.test(limpio)) return Number(limpio + "00");
  return Number(limpio) || sku;
}

const CONFIG44 = {
  sheet: "TOMA DE PEDIDOS",
  skuColumn: "B",
  firstRow: 15, lastRow: 59,
  sizeColumns: { "36":"F","38":"G","40":"H","42":"I","44":"J","46":"K","S":"L","M":"M","L":"N" },
  razonSocialCell:"L1", giroCell:"L2", direccionCell:"L3", nombreTiendaCell:"L4",
  rutCell:"L5", comunaCell:"L6", phoneCell:"L7", dateCell:"L8", transporteCell:"E7",
  idLabelCell:"U1", idValueCell:"V1",
};

async function generarExcelConPlantilla44(quote, items) {
  const [XlsxPopulate, buf] = await Promise.all([loadXlsxPopulate(), loadTemplate44()]);
  const wb = await XlsxPopulate.fromDataAsync(buf);
  const sh = wb.sheet(CONFIG44.sheet);
  if (!sh) throw new Error("No se encontró la hoja TOMA DE PEDIDOS");

  // Usa formula("...") para reemplazar VLOOKUPs sin dejar XML sucio
  const setCelda = (ref, val) => {
    if (!ref || val == null || val === "") return;
    sh.cell(ref).formula(`"${String(val).replace(/"/g, '""')}"`);
  };

  const fechaStr = new Date(quote.created_at || Date.now()).toLocaleDateString("es-CL");
  setCelda(CONFIG44.rutCell,          quote.client_rut);
  setCelda(CONFIG44.dateCell,         fechaStr);
  setCelda(CONFIG44.phoneCell,        quote.client_phone);
  sh.cell(CONFIG44.idLabelCell).value("ID");
  sh.cell(CONFIG44.idValueCell).value(quote.id ? "COT-" + String(quote.id).slice(0,8).toUpperCase() : "");
  setCelda(CONFIG44.razonSocialCell,  quote.store_name);
  setCelda(CONFIG44.giroCell,         quote.giro);
  setCelda(CONFIG44.direccionCell,    quote.direccion);
  setCelda(CONFIG44.nombreTiendaCell, quote.nombre_tienda);
  setCelda(CONFIG44.comunaCell,       quote.comuna);
  setCelda(CONFIG44.transporteCell,   quote.transporte);

  for (let r = CONFIG44.firstRow; r <= CONFIG44.lastRow; r++) {
    sh.cell(`${CONFIG44.skuColumn}${r}`).value("");
    Object.values(CONFIG44.sizeColumns).forEach(c => sh.cell(`${c}${r}`).value(""));
  }

  const agrupado = {};
  items.forEach(it => {
    if (!agrupado[it.sku]) agrupado[it.sku] = {};
    agrupado[it.sku][it.size] = (agrupado[it.sku][it.size]||0) + (it.quantity||0);
  });
  Object.entries(agrupado).forEach(([sku, tallas], idx) => {
    const row = CONFIG44.firstRow + idx;
    if (row > CONFIG44.lastRow) return;
    sh.cell(`${CONFIG44.skuColumn}${row}`).value(skuNumerico(sku));
    Object.entries(tallas).forEach(([size, qty]) => {
      const col = CONFIG44.sizeColumns[size];
      if (col) sh.cell(`${col}${row}`).value(qty);
    });
  });

  const blob = await wb.outputAsync();
  const url = URL.createObjectURL(new Blob([blob], {type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}));
  const a = document.createElement("a");
  const nombre = String(quote.store_name||quote.client_rut||"").replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]/g," ").trim().replace(/\s+/g,"_").slice(0,30);
  const f = new Date(quote.created_at||Date.now());
  const d = f.getFullYear()+String(f.getMonth()+1).padStart(2,"0")+String(f.getDate()).padStart(2,"0");
  a.href = url; a.download = `Pedido_DV44_${nombre}_${d}.xlsx`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/* ---- ADMIN: LOGIN ----------------------------------------- */
const _pedidoUrlId = new URLSearchParams(location.search).get("pedido") || null;

function abrirAdmin() {
  $("#admin-velo").classList.add("abierto");
  document.body.style.overflow = "hidden";
  if (adminToken) {
    mostrarSeccionAdmin("lista");
    cargarPedidosAdmin();
  } else {
    mostrarSeccionAdmin("login");
  }
}
function cerrarAdmin() {
  $("#admin-velo").classList.remove("abierto");
  document.body.style.overflow = "";
}
function mostrarSeccionAdmin(seccion) {
  ["login","lista","detalle","crm"].forEach(s => {
    $("#admin-seccion-"+s).style.display = s === seccion ? "block" : "none";
  });
  if (seccion === "crm") {
    const m = $("#crm-modal"); if (m) m.style.display = "none";
    $("#crm-lista").style.display = "flex";
    crmActual = null;
    if (!crmClientes.length) cargarCRM();
  }
}

$("#btn-admin").onclick = abrirAdmin;

// Si la URL tiene ?pedido=<id> (link desde Telegram), abrir admin directo
if (_pedidoUrlId && adminToken) setTimeout(abrirAdmin, 300);
$("#cerrar-admin").onclick = cerrarAdmin;
$("#admin-velo").addEventListener("click", e => { if (e.target === $("#admin-velo")) cerrarAdmin(); });

$("#btn-login-admin").onclick = async () => {
  const email = $("#a-email").value.trim();
  const pass  = $("#a-pass").value;
  const errEl = $("#a-error");
  errEl.classList.remove("ver");
  if (!email || !pass) { errEl.textContent = "Ingresa email y contraseña"; errEl.classList.add("ver"); return; }
  $("#btn-login-admin").textContent = "Ingresando…";
  $("#btn-login-admin").disabled = true;
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: pass }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.access_token) throw new Error(data.error_description || data.msg || "Credenciales incorrectas");
    adminToken = data.access_token;
    sessionStorage.setItem("dv44_admin_token", adminToken);
    mostrarSeccionAdmin("lista");
    cargarPedidosAdmin();
  } catch(e) {
    errEl.textContent = e.message;
    errEl.classList.add("ver");
  } finally {
    $("#btn-login-admin").textContent = "Ingresar";
    $("#btn-login-admin").disabled = false;
  }
};

$("#a-pass").addEventListener("keydown", e => { if (e.key === "Enter") $("#btn-login-admin").click(); });

$("#btn-logout").onclick = () => {
  adminToken = "";
  sessionStorage.removeItem("dv44_admin_token");
  adminPedidos = [];
  mostrarSeccionAdmin("login");
};

/* ---- ADMIN: CARGAR PEDIDOS -------------------------------- */
let filtroEstadoAdmin = "todos";

document.querySelectorAll(".chip-estado").forEach(btn => {
  btn.onclick = () => {
    filtroEstadoAdmin = btn.dataset.filtro;
    document.querySelectorAll(".chip-estado").forEach(b => b.classList.remove("activo","activo-listo","activo-pend"));
    btn.classList.add("activo");
    if (filtroEstadoAdmin === "listo") btn.classList.add("activo-listo");
    else if (filtroEstadoAdmin === "pendiente") btn.classList.add("activo-pend");
    renderizarTablaPedidos(adminPedidos);
  };
});

async function cargarPedidosAdmin() {
  const tbody = $("#tbody-pedidos");
  const aviso = $("#a-vacio");
  tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--gris);padding:1.5rem">Cargando…</td></tr>`;
  aviso.style.display = "none";
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/quotes?select=id,store_name,client_rut,client_phone,total_items,created_at,source,is_ready,ready_at,giro,direccion,nombre_tienda,comuna,transporte&order=created_at.desc&limit=500`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${adminToken}` } }
    );
    if (res.status === 401 || res.status === 403) {
      adminToken = ""; sessionStorage.removeItem("dv44_admin_token");
      mostrarSeccionAdmin("login");
      return;
    }
    if (!res.ok) throw new Error(await res.text() || res.status);
    adminPedidos = await res.json();

    if (!adminPedidos.length) {
      tbody.innerHTML = "";
      aviso.style.display = "block";
      return;
    }

    const ids = adminPedidos.map(q => q.id).filter(Boolean);
    let items = [];
    if (ids.length) {
      const ir = await fetch(
        `${SUPABASE_URL}/rest/v1/quote_items?select=quote_id,sku,size,quantity&quote_id=in.(${ids.join(",")})&limit=9999`,
        { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${adminToken}` } }
      );
      if (ir.ok) {
        items = await ir.json();
        console.log(`[admin] quote_items: ${items.length} filas cargadas para ${ids.length} pedidos`);
      } else {
        const errTxt = await ir.text();
        console.error(`[admin] quote_items fetch falló (${ir.status}):`, errTxt);
      }
    }

    adminPedidos.forEach(q => { q._items = items.filter(it => it.quote_id === q.id); });
    renderizarTablaPedidos(adminPedidos);
  } catch(e) {
    tbody.innerHTML = `<tr><td colspan="5" style="color:var(--rojo-osc);padding:1rem">${e.message}</td></tr>`;
  }
}

function renderizarTablaPedidos(lista) {
  const q = $("#a-busca").value.trim().toLowerCase();
  let filtrados = q
    ? lista.filter(p => (p.client_rut||"").toLowerCase().includes(q) || (p.store_name||"").toLowerCase().includes(q))
    : lista;
  if (filtroEstadoAdmin === "listo")    filtrados = filtrados.filter(p => !!p.is_ready);
  if (filtroEstadoAdmin === "pendiente") filtrados = filtrados.filter(p => !p.is_ready);

  const tbody = $("#tbody-pedidos");
  const aviso = $("#a-vacio");
  if (!filtrados.length) {
    tbody.innerHTML = "";
    aviso.style.display = "block";
    return;
  }
  aviso.style.display = "none";
  tbody.innerHTML = filtrados.map(p => {
    const d = new Date(p.created_at);
    const fecha = `${String(d.getDate()).padStart(2,"0")}-${String(d.getMonth()+1).padStart(2,"0")}<br><span style="font-size:.7rem;color:var(--gris)">${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}</span>`;
    const src = p.source || "—";
    const srcLabel = src.includes("dolce")   ? "DV 44"
                   : src.includes("mixto")   ? "Mixto"
                   : src.includes("44")      ? "Cole 44"
                   : src.includes("43")      ? "Cole 43"
                   : src.includes("filomena")? "Filomena"
                   : src.includes("unified") ? "Unificado"
                   : src;
    const srcClass = src.includes("dolce") || src.includes("44") ? "a-tag-dv" : "a-tag-otro";
    const srcTag = `<span class="a-tag ${srcClass}">${srcLabel}</span>`;
    const listo = !!p.is_ready;
    const iconListo = listo ? "✔" : "○";
    const titleListo = listo ? "Desmarcar listo" : "Marcar como listo";
    return `<tr data-id="${p.id}">
      <td>${fecha}</td>
      <td style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${p.store_name||""}">${p.store_name||"—"}</td>
      <td style="white-space:nowrap">${p.client_rut||"—"}</td>
      <td>${srcTag}</td>
      <td style="text-align:center;font-weight:700">${p.total_items||"?"}</td>
      <td style="text-align:center">
        <button class="btn-icon-listo ${listo?"si":"no"}" title="${titleListo}" onclick="toggleListo('${p.id}',${!listo})">${iconListo}</button>
      </td>
      <td style="white-space:nowrap">
        <button class="btn-ico" title="Ver detalle" onclick="verDetallePedido('${p.id}')">👁</button>
        <button class="btn-ico btn-ico-dl" title="Descargar Excel" onclick="descargarExcelAdmin('${p.id}')">📥</button>
        <button class="btn-ico btn-ico-del" title="Eliminar" onclick="eliminarPedido('${p.id}')">🗑</button>
      </td>
    </tr>`;
  }).join("");

  // Si se abrió desde link de Telegram, resaltar ese pedido
  if (_pedidoUrlId) {
    const fila = document.querySelector(`tr[data-id="${_pedidoUrlId}"]`);
    if (fila) {
      fila.style.background = "#fffbdd";
      fila.style.outline = "2px solid #f0c000";
      setTimeout(() => fila.scrollIntoView({ behavior: "smooth", block: "center" }), 200);
    }
  }
}

$("#btn-refresh").onclick = cargarPedidosAdmin;
$("#a-busca").addEventListener("input", () => renderizarTablaPedidos(adminPedidos));

window.toggleListo = async function(id, nuevoEstado) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/quotes?id=eq.${id}`, {
      method: "PATCH",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        is_ready: nuevoEstado,
        ready_at: nuevoEstado ? new Date().toISOString() : null,
      }),
    });
    if (!res.ok) throw new Error(await res.text() || res.status);
    const p = adminPedidos.find(p => p.id === id);
    if (p) { p.is_ready = nuevoEstado; p.ready_at = nuevoEstado ? new Date().toISOString() : null; }
    renderizarTablaPedidos(adminPedidos);
    toast(nuevoEstado ? "✔ Marcado como listo" : "Desmarcado");
  } catch(e) {
    toast("Error: " + e.message);
  }
};

function customConfirm(titulo, mensaje, { okTexto = "Sí, eliminar", ico = "🗑" } = {}) {
  return new Promise(resolve => {
    $("#confirm-titulo").textContent = titulo;
    $("#confirm-msg").textContent = mensaje;
    $("#confirm-ok").textContent = okTexto;
    $("#confirm-ico").textContent = ico;
    $("#confirm-velo").classList.add("abierto");
    const cerrar = (val) => {
      $("#confirm-velo").classList.remove("abierto");
      $("#confirm-ok").removeEventListener("click", onOk);
      $("#confirm-cancel").removeEventListener("click", onCancel);
      resolve(val);
    };
    const onOk     = () => cerrar(true);
    const onCancel = () => cerrar(false);
    $("#confirm-ok").addEventListener("click", onOk);
    $("#confirm-cancel").addEventListener("click", onCancel);
  });
}

window.eliminarPedido = async function(id) {
  const p = adminPedidos.find(p => p.id === id);
  const nombre = p?.store_name || p?.client_rut || id;
  const ok = await customConfirm(
    "Eliminar pedido",
    `¿Eliminar el pedido de "${nombre}"? Esta acción no se puede deshacer.`
  );
  if (!ok) return;
  try {
    const headers = {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${adminToken}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    };
    const r1 = await fetch(`${SUPABASE_URL}/rest/v1/quote_items?quote_id=eq.${id}`, { method:"DELETE", headers });
    if (!r1.ok) throw new Error("Error eliminando ítems: " + (await r1.text() || r1.status));
    const r2 = await fetch(`${SUPABASE_URL}/rest/v1/quotes?id=eq.${id}`, { method:"DELETE", headers });
    if (!r2.ok) throw new Error("Error eliminando pedido: " + (await r2.text() || r2.status));
    adminPedidos = adminPedidos.filter(p => p.id !== id);
    renderizarTablaPedidos(adminPedidos);
    toast(`🗑 Pedido de "${nombre}" eliminado`);
  } catch(e) {
    toast("Error: " + e.message);
  }
};

/* ---- ADMIN: DETALLE --------------------------------------- */
window.verDetallePedido = async function(id) {
  const q = adminPedidos.find(p => p.id === id);
  if (!q) return;
  adminPedidoActual = q;
  const fecha = new Date(q.created_at).toLocaleDateString("es-CL", {dateStyle:"long"});
  $("#det-titulo").textContent = "Pedido " + fecha;

  const campos = [
    ["Cliente", q.store_name], ["RUT", q.client_rut], ["Teléfono", q.client_phone],
    ["Giro", q.giro], ["Dirección", q.direccion], ["Nombre Tienda", q.nombre_tienda],
    ["Comuna", q.comuna], ["Transporte", q.transporte],
    ["Total prendas", q.total_items], ["Fecha", new Date(q.created_at).toLocaleString("es-CL")],
  ];
  $("#det-info").innerHTML = campos.filter(([,v]) => v).map(([k,v]) =>
    `<div><dt>${k}</dt><dd>${v}</dd></div>`
  ).join("");

  $("#det-items").innerHTML = `<p style="color:var(--gris);font-size:.85rem;grid-column:1/-1">Cargando ítems…</p>`;

  let items = q._items || [];
  if (!items.length && q.total_items > 0) {
    try {
      const ir = await fetch(
        `${SUPABASE_URL}/rest/v1/quote_items?select=quote_id,sku,size,quantity&quote_id=eq.${id}&limit=9999`,
        { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${adminToken}` } }
      );
      if (ir.ok) { items = await ir.json(); q._items = items; }
    } catch(e) {}
  }
  const agrupado = {};
  items.forEach(it => {
    if (!agrupado[it.sku]) agrupado[it.sku] = {};
    agrupado[it.sku][it.size] = (agrupado[it.sku][it.size]||0) + it.quantity;
  });
  const itemsHtml = Object.entries(agrupado).map(([sku, tallas]) => {
    const m = buscar(sku);
    const n = Object.values(tallas).reduce((a,b)=>a+b,0);
    const sub = m?.precio ? CLP(n*m.precio) : "A consultar";
    const tallasHtml = Object.entries(tallas).map(([t,q]) => `<span>${t} × ${q}</span>`).join("");
    return `<div class="det-item">
      <div class="dnom">${m?.nombre||sku}</div>
      <div class="dcod">${sku} · ${m?nombreSec(m.sec):""}</div>
      <div class="dtallas">${tallasHtml}</div>
      <div class="dsubt">${n} prendas — ${sub}</div>
    </div>`;
  }).join("");
  if (itemsHtml) {
    $("#det-items").innerHTML = itemsHtml;
  } else if (q.total_items > 0) {
    $("#det-items").innerHTML = `<p style="color:var(--gris);font-size:.85rem;grid-column:1/-1">
      ⚠ El pedido tiene ${q.total_items} prendas pero el detalle aún no carga —
      es un problema de permisos en la base de datos que se está corrigiendo. Descarga el Excel para ver el desglose completo.</p>`;
  } else {
    $("#det-items").innerHTML = `<p style="color:var(--gris);font-size:.85rem;grid-column:1/-1">Sin ítems registrados</p>`;
  }

  if (q.client_phone) {
    $("#det-wsp").href = linkWsp(`¡Hola! 👖 Seguimiento pedido Dolce Vita 44 — ${q.store_name} — ${new Date(q.created_at).toLocaleDateString("es-CL")}`);
    $("#det-wsp").style.display = "inline-flex";
  } else {
    $("#det-wsp").style.display = "none";
  }

  mostrarSeccionAdmin("detalle");
};

$("#btn-volver-lista").onclick = () => mostrarSeccionAdmin("lista");

/* ---- ADMIN: helpers ítems -------------------------------- */
async function fetchItemsParaPedido(quoteId) {
  const ir = await fetch(
    `${SUPABASE_URL}/rest/v1/quote_items?select=quote_id,sku,size,quantity&quote_id=eq.${quoteId}`,
    { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${adminToken}` } }
  );
  if (ir.ok) return await ir.json();
  return [];
}

async function resolverItems(q) {
  if ((q._items || []).length > 0) return q._items;
  const items = await fetchItemsParaPedido(q.id);
  q._items = items;
  return items;
}

/* ---- ADMIN: EXCEL POR PEDIDO ------------------------------ */
window.descargarExcelAdmin = async function(id) {
  const q = adminPedidos.find(p => p.id === id);
  if (!q) return;
  toast("Cargando ítems…");
  const items = await resolverItems(q);
  toast("Generando Excel con PLANILLA 44…");
  try {
    await generarExcelConPlantilla44(q, items);
    toast("Excel descargado ⬇");
  } catch(e) {
    toast("Error: " + e.message);
  }
};

$("#btn-dl-excel").onclick = async () => {
  if (!adminPedidoActual) return;
  toast("Cargando ítems…");
  const items = await resolverItems(adminPedidoActual);
  toast("Generando Excel…");
  try {
    await generarExcelConPlantilla44(adminPedidoActual, items);
    toast("Excel descargado ⬇");
  } catch(e) {
    toast("Error: " + e.message);
  }
};

/* ---- ADMIN: CRM FALTANTES -------------------------------- */
let crmClientes = [];
let crmActual = null;
let crmFiltroEstado = "todos";
let crmFunnel = {}; // rut → {email_enviado, email_abierto, link_visitado, pedido_realizado}

document.querySelectorAll("[data-crm-filtro]").forEach(btn => {
  btn.onclick = () => {
    crmFiltroEstado = btn.dataset.crmFiltro;
    document.querySelectorAll("[data-crm-filtro]").forEach(b => b.classList.remove("activo"));
    btn.classList.add("activo");
    renderizarCRM();
  };
});

$("#crm-busca").addEventListener("input", renderizarCRM);
$("#btn-refresh-crm").onclick = cargarCRM;

$("#btn-crm-email-toggle").onclick = () => {
  actualizarPanelEmail();
  $("#crm-email-modal").style.display = "block";
};

window.cerrarEmailModal = function() {
  $("#crm-email-modal").style.display = "none";
};

function actualizarPanelEmail() {
  const conEmail = crmClientes.filter(c => c.email && c.email.length > 3 && (c.estado||"pendiente") !== "pedido_realizado" && c.estado !== "descartado");
  const bcc = conEmail.map(c => c.email.toLowerCase()).join("; ");
  $("#crm-email-modal").dataset.bcc = bcc;
  $("#crm-email-count").textContent = `${conEmail.length} destinatarios (sin los que ya hicieron pedido)`;
}

$("#btn-copiar-bcc").onclick = () => {
  const bcc = $("#crm-email-modal").dataset.bcc || "";
  navigator.clipboard.writeText(bcc).then(() => {
    $("#btn-copiar-bcc").textContent = "✔ ¡Copiado!";
    setTimeout(() => { $("#btn-copiar-bcc").textContent = "📋 Copiar BCC"; }, 2500);
  });
};

$("#btn-abrir-gmail").onclick = () => {
  const subject = encodeURIComponent($("#crm-email-subject").value);
  const body = encodeURIComponent($("#crm-email-body").value);
  window.open(`https://mail.google.com/mail/?view=cm&su=${subject}&body=${body}`, "_blank");
};

$("#btn-marcar-enviados").onclick = async () => {
  const conEmail = crmClientes.filter(c => c.email && c.email.length > 3 && (c.estado||"pendiente") !== "pedido_realizado" && c.estado !== "descartado");
  if (!conEmail.length) { toast("Sin destinatarios"); return; }
  const btn = $("#btn-marcar-enviados");
  btn.disabled = true;
  btn.textContent = "Registrando…";
  let ok = 0;
  for (const c of conEmail) {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/crm_interacciones_v2`, {
        method: "POST",
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({ client_rut: c.rut, tipo: "email_enviado", descripcion: "Correo masivo Dolce Vita 44" })
      });
      if ((c.estado||"pendiente") === "pendiente") {
        c.estado = "contactado";
        await fetch(`${SUPABASE_URL}/rest/v1/crm_clientes_44?rut=eq.${encodeURIComponent(c.rut)}`, {
          method: "PATCH",
          headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json", Prefer: "return=minimal" },
          body: JSON.stringify({ estado: "contactado" })
        });
      }
      ok++;
    } catch(e) {}
  }
  toast(`✔ ${ok} clientes marcados como contactados`);
  btn.disabled = false;
  btn.textContent = "✔ Marcar como enviado a todos";
  renderizarCRM();
  actualizarPanelEmail();
};

async function cargarCRM() {
  const lista = $("#crm-lista");
  lista.innerHTML = '<p style="color:var(--gris);font-size:.85rem;padding:1rem">Cargando clientes…</p>';
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/crm_clientes_44?select=*&order=ultima_cole.desc,nombre.asc&limit=200`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${adminToken}` } }
    );
    if (!res.ok) throw new Error(await res.text() || res.status);
    crmClientes = await res.json();

    // Auto-detectar si algún faltante ya hizo un pedido Cole 44
    const sinPedido = crmClientes.filter(c => c.estado !== "pedido_realizado");
    if (sinPedido.length) {
      const rutsQ = sinPedido.map(c => `"${c.rut}"`).join(",");
      const qRes = await fetch(
        `${SUPABASE_URL}/rest/v1/quotes?select=client_rut&client_rut=in.(${rutsQ})&limit=500`,
        { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${adminToken}` } }
      );
      if (qRes.ok) {
        const ordenes = await qRes.json();
        const conPedido = new Set(ordenes.map(o => o.client_rut));
        for (const c of crmClientes) {
          if (conPedido.has(c.rut) && c.estado !== "pedido_realizado") {
            c.estado = "pedido_realizado";
            fetch(`${SUPABASE_URL}/rest/v1/crm_clientes_44?rut=eq.${encodeURIComponent(c.rut)}`, {
              method: "PATCH",
              headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json", Prefer: "return=minimal" },
              body: JSON.stringify({ estado: "pedido_realizado" })
            }).catch(() => {});
            fetch(`${SUPABASE_URL}/rest/v1/crm_interacciones_v2`, {
              method: "POST",
              headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json", Prefer: "return=minimal" },
              body: JSON.stringify({ client_rut: c.rut, tipo: "pedido_realizado", descripcion: "Pedido Cole 44 detectado automáticamente" })
            }).catch(() => {});
          }
        }
      }
    }

    // Detectar clientes nuevos con pedido Cole 44 que no están en la lista de seguimiento
    const rutsCRM = new Set(crmClientes.map(c => c.rut));
    const nuevosRes = await fetch(
      `${SUPABASE_URL}/rest/v1/quotes?select=client_rut,store_name,client_phone,created_at&source=eq.dolce-vita-44&order=created_at.desc&limit=200`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${adminToken}` } }
    );
    if (nuevosRes.ok) {
      const nuevosQuotes = await nuevosRes.json();
      const vistos = new Set();
      for (const q of nuevosQuotes) {
        if (q.client_rut && !rutsCRM.has(q.client_rut) && !vistos.has(q.client_rut)) {
          vistos.add(q.client_rut);
          crmClientes.push({
            rut: q.client_rut,
            nombre: q.store_name || q.client_rut,
            ciudad: "—",
            email: "",
            telefono: q.client_phone || "",
            vendedor: "—",
            ultima_cole: 44,
            coles_compradas: [44],
            estado: "pedido_realizado",
            tipo: "nuevo"
          });
        }
      }
    }

    // Cargar interacciones en batch para mostrar funnel
    const todosRuts = crmClientes.map(c => `"${c.rut}"`).join(",");
    if (todosRuts) {
      const intRes = await fetch(
        `${SUPABASE_URL}/rest/v1/crm_interacciones_v2?client_rut=in.(${todosRuts})&select=client_rut,tipo&order=fecha.asc&limit=2000`,
        { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${adminToken}` } }
      );
      if (intRes.ok) {
        const ints = await intRes.json();
        crmFunnel = {};
        for (const i of ints) {
          if (!crmFunnel[i.client_rut]) crmFunnel[i.client_rut] = {};
          crmFunnel[i.client_rut][i.tipo] = true;
        }
      }
    }

    renderizarCRM();
  } catch(e) {
    lista.innerHTML = `<p style="color:var(--rojo-osc);padding:1rem">Error: ${e.message}</p>`;
  }
}

function renderizarCRM() {
  const q = ($("#crm-busca").value || "").trim().toLowerCase();
  let filtrados = crmClientes;
  if (q) filtrados = filtrados.filter(c =>
    (c.nombre||"").toLowerCase().includes(q) ||
    (c.ciudad||"").toLowerCase().includes(q) ||
    (c.rut||"").includes(q)
  );
  if (crmFiltroEstado !== "todos") filtrados = filtrados.filter(c => (c.estado||"pendiente") === crmFiltroEstado);

  const cnt = { pendiente:0, contactado:0, en_negocio:0, pedido_realizado:0, descartado:0 };
  crmClientes.forEach(c => { const e = c.estado||"pendiente"; if (cnt[e] !== undefined) cnt[e]++; });
  $("#crm-stats").innerHTML =
    `<div class="crm-stat">${crmClientes.length}<span>total</span></div>` +
    `<div class="crm-stat">${cnt.pedido_realizado}<span>con pedido ✔</span></div>` +
    `<div class="crm-stat">${cnt.contactado+cnt.en_negocio}<span>en proceso</span></div>` +
    `<div class="crm-stat">${cnt.pendiente}<span>pendientes</span></div>`;

  const lista = $("#crm-lista");
  if (!filtrados.length) {
    lista.innerHTML = '<p style="color:var(--gris);font-size:.85rem;padding:1rem;text-align:center">Sin resultados</p>';
    return;
  }
  const estadoLabel = { pendiente:"Pendiente", contactado:"Contactado", en_negocio:"En negocio", pedido_realizado:"Hizo pedido ✔", descartado:"Descartado" };
  const PASOS = [
    { tipo: "email_enviado",  icono: "📧", label: "Enviado"  },
    { tipo: "email_abierto",  icono: "👁",  label: "Abrió"   },
    { tipo: "link_visitado",  icono: "🔗", label: "Entró"   },
    { tipo: "pedido_realizado", icono: "✅", label: "Pidió"  },
  ];
  lista.innerHTML = filtrados.map(c => {
    const estado = c.estado || "pendiente";
    const tieneEmail = c.email && c.email.length > 3;
    const tieneTel = c.telefono && c.telefono.length > 4;
    const esNuevo = c.tipo === "nuevo";
    const funnel = crmFunnel[c.rut] || {};
    const funnelHtml = PASOS.map(p => {
      const ok = funnel[p.tipo] || (p.tipo === "pedido_realizado" && estado === "pedido_realizado");
      return `<span class="crm-paso${ok ? " ok" : ""}" title="${p.label}">${p.icono}</span>`;
    }).join("");
    return `<div class="crm-card" onclick="abrirDetalleCRM('${c.rut}')">
      <div>
        <div class="cn">${c.nombre}${esNuevo ? ' <span class="crm-pill crm-pill-nuevo" style="font-size:.6rem;padding:.15rem .45rem;vertical-align:middle;margin-left:.3rem">CLIENTE NUEVO</span>' : ""}</div>
        <div class="cc">${esNuevo ? "Cole 44" : (c.ciudad||"") + " · Última: Cole " + (c.ultima_cole||"?") + " · " + ((c.vendedor||"s/v").split(" - ")[1]||c.vendedor||"")}</div>
        <div class="ce">${tieneTel ? "📞 " + c.telefono : (tieneEmail ? "📧 " + c.email : "✗ sin contacto")}</div>
        <div class="crm-funnel">${funnelHtml}</div>
      </div>
      <div><span class="crm-pill crm-pill-${estado}">${estadoLabel[estado]||estado}</span></div>
    </div>`;
  }).join("");
}

window.abrirDetalleCRM = async function(rut) {
  crmActual = crmClientes.find(c => c.rut === rut);
  if (!crmActual) return;

  const esNuevo = crmActual.tipo === "nuevo";
  const tieneTel = crmActual.telefono && crmActual.telefono.length > 4;
  const estado = crmActual.estado || "pendiente";

  let infoHtml = `<div><b>RUT:</b> ${crmActual.rut}</div>`;
  if (!esNuevo) {
    const tieneEmail = crmActual.email && crmActual.email.length > 3;
    const coles = (crmActual.coles_compradas || []).join(", ");
    infoHtml +=
      `<div><b>Ciudad:</b> ${crmActual.ciudad||"—"}</div>` +
      `<div><b>Vendedor:</b> ${crmActual.vendedor||"—"}</div>` +
      `<div><b>Últimas coles:</b> ${coles||crmActual.ultima_cole}</div>`;
    if (tieneEmail) {
      infoHtml += `<div><b>Email:</b> <a href="mailto:${crmActual.email}">${crmActual.email}</a></div>`;
    } else {
      infoHtml += `<div><b>Email:</b> <em style="color:var(--gris)">sin email</em></div>`;
    }
  }
  if (tieneTel) {
    const tel = crmActual.telefono.replace(/\D/g,"");
    const wspMsg = encodeURIComponent(`¡Hola! Te escribimos de Mohicano Jeans. Tenemos lista nuestra nueva colección Dolce Vita 44 — Primavera-Verano 2026. ¿Te la compartimos? https://mohicanojeans.netlify.app/catalogo-44/`);
    const wspHref = `https://wa.me/${tel}?text=${wspMsg}`;
    infoHtml += `<div><b>WhatsApp:</b> <a href="${wspHref}" target="_blank" rel="noopener" onclick="registrarWspCRM(event,'${wspHref}')">💬 Abrir chat (${crmActual.telefono})</a></div>`;
  }

  let bodyHtml;
  if (esNuevo) {
    bodyHtml = `
      <div class="crm-det-info">${infoHtml}</div>
      <p style="font-size:.78rem;color:var(--gris);background:#f5f3ff;border-radius:8px;padding:.6rem .85rem;margin:.5rem 0 1rem">
        Cliente nuevo — realizó su primer pedido Cole 44 directamente desde el catálogo.
      </p>
      <button class="btn btn-rojo" style="justify-content:center;width:100%;margin-bottom:.5rem" onclick="descargarExcelCRM('${crmActual.rut}')">⬇ Descargar Excel del pedido</button>
    `;
  } else {
    const yaHizoPedido = estado === "pedido_realizado";
    const estados = [
      { k:"pendiente", l:"Pendiente" }, { k:"contactado", l:"Contactado" },
      { k:"en_negocio", l:"En negocio" }, { k:"pedido_realizado", l:"Hizo pedido ✔" }, { k:"descartado", l:"Descartado" },
    ];
    const estadoBtns = estados.map(e =>
      `<button class="crm-pill crm-pill-${e.k}${e.k===estado?" activo-est":""}"
         style="font-size:.75rem;padding:.3rem .75rem;${e.k===estado?"border-color:#333 !important;":""}"
         onclick="cambiarEstadoCRM('${e.k}')">${e.l}</button>`
    ).join("");
    bodyHtml = `
      <div class="crm-det-info">${infoHtml}</div>
      ${yaHizoPedido ? `<button class="btn btn-rojo" style="justify-content:center;margin-bottom:.8rem;width:100%" onclick="descargarExcelCRM('${crmActual.rut}')">⬇ Descargar Excel del pedido</button>` : ""}
      <div class="crm-det-estado" id="crm-det-estado">${estadoBtns}</div>
      <p class="crm-hist-titulo">Historial de contacto</p>
      <div class="crm-hist" id="crm-hist"><p style="color:var(--gris);font-size:.8rem">Cargando…</p></div>
      <div class="crm-add-form">
        <label>Registrar interacción</label>
        <select id="crm-tipo" class="crm-select">
          <option value="email">📧 Email enviado</option>
          <option value="whatsapp">💬 WhatsApp</option>
          <option value="llamada">📞 Llamada</option>
          <option value="pagina_enviada">🔗 Página de catálogo enviada</option>
          <option value="nota">📝 Nota interna</option>
        </select>
        <textarea id="crm-desc" class="crm-textarea" placeholder="Descripción (opcional)…"></textarea>
        <button class="btn btn-rojo" id="btn-crm-add" onclick="agregarInteraccion()" style="justify-content:center">+ Registrar</button>
      </div>
    `;
  }

  $("#crm-modal-box").innerHTML = `
    <div class="crm-det-header">
      <button onclick="cerrarCRMModal()" class="btn btn-borde" style="padding:.35rem .8rem;font-size:.8rem">← Lista</button>
      <h3 style="margin:0;font-size:1rem;font-weight:800">${crmActual.nombre}${esNuevo ? ' <span class="crm-pill crm-pill-nuevo" style="font-size:.6rem;padding:.15rem .45rem;vertical-align:middle;margin-left:.4rem">NUEVO</span>' : ""}</h3>
    </div>
    ${bodyHtml}
  `;

  $("#crm-modal").style.display = "block";
  if (!esNuevo) await cargarInteracciones(rut);
};

window.cerrarCRMModal = function() {
  $("#crm-modal").style.display = "none";
  crmActual = null;
};

function renderEstadoButtons(estadoActual) {
  const estados = [
    { k:"pendiente",       l:"Pendiente" },
    { k:"contactado",      l:"Contactado" },
    { k:"en_negocio",      l:"En negocio" },
    { k:"pedido_realizado",l:"Hizo pedido ✔" },
    { k:"descartado",      l:"Descartado" },
  ];
  $("#crm-det-estado").innerHTML = estados.map(e =>
    `<button class="crm-pill crm-pill-${e.k}${e.k===estadoActual?" activo-est":""}"
       style="font-size:.75rem;padding:.3rem .75rem;${e.k===estadoActual?"border-color:#333 !important;":""}"
       onclick="cambiarEstadoCRM('${e.k}')">${e.l}</button>`
  ).join("");
}

async function cargarInteracciones(rut) {
  const hist = $("#crm-hist");
  hist.innerHTML = '<p style="color:var(--gris);font-size:.8rem">Cargando…</p>';
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/crm_interacciones_v2?client_rut=eq.${encodeURIComponent(rut)}&order=fecha.desc&limit=50`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${adminToken}` } }
    );
    if (!res.ok) throw new Error(res.status);
    const items = await res.json();
    if (!items.length) {
      hist.innerHTML = '<p style="color:var(--gris);font-size:.8rem;text-align:center">Sin interacciones aún</p>';
      return;
    }
    const tipoLabel = { email:"📧 Email", whatsapp:"💬 WhatsApp", llamada:"📞 Llamada", pagina_enviada:"🔗 Catálogo enviado", nota:"📝 Nota", pedido_realizado:"🛒 Hizo pedido Cole 44" };
    hist.innerHTML = items.map(it => {
      const f = new Date(it.fecha);
      const fStr = f.toLocaleDateString("es-CL",{day:"2-digit",month:"2-digit",year:"2-digit"}) + " " +
                   f.toLocaleTimeString("es-CL",{hour:"2-digit",minute:"2-digit"});
      return `<div class="crm-hist-item">
        <span class="ci-tipo">${tipoLabel[it.tipo]||it.tipo}</span>
        <span class="ci-fecha">${fStr}</span>
        ${it.descripcion ? `<div class="ci-desc">${it.descripcion}</div>` : ""}
      </div>`;
    }).join("");
  } catch(e) {
    hist.innerHTML = `<p style="color:var(--rojo-osc);font-size:.8rem">Error: ${e.message}</p>`;
  }
}

window.registrarWspCRM = function(e, href) {
  e.preventDefault();
  window.open(href, "_blank", "noopener");
  if (!crmActual) return;
  fetch(`${SUPABASE_URL}/rest/v1/crm_interacciones_v2`, {
    method: "POST",
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({ client_rut: crmActual.rut, tipo: "whatsapp", descripcion: "Catálogo enviado por WhatsApp" })
  }).then(() => {
    if ((crmActual.estado||"pendiente") === "pendiente") cambiarEstadoCRM("contactado");
    else cargarInteracciones(crmActual.rut);
  }).catch(() => {});
};

window.cambiarEstadoCRM = async function(nuevoEstado) {
  if (!crmActual) return;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/crm_clientes_44?rut=eq.${encodeURIComponent(crmActual.rut)}`, {
      method: "PATCH",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ estado: nuevoEstado })
    });
    if (!res.ok) throw new Error(await res.text() || res.status);
    crmActual.estado = nuevoEstado;
    const idx = crmClientes.findIndex(c => c.rut === crmActual.rut);
    if (idx >= 0) crmClientes[idx].estado = nuevoEstado;
    renderEstadoButtons(nuevoEstado);
    toast("Estado actualizado ✔");
  } catch(e) {
    toast("Error: " + e.message);
  }
};

async function descargarExcelCRM(rut) {
  toast("Buscando pedido…");
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/quotes?select=id,store_name,client_rut,client_phone,total_items,created_at,source,is_ready,giro,direccion,nombre_tienda,comuna,transporte&client_rut=eq.${encodeURIComponent(rut)}&order=created_at.desc&limit=1`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${adminToken}` } }
    );
    if (!res.ok) throw new Error(res.status);
    const quotes = await res.json();
    if (!quotes.length) { toast("No se encontró pedido para este cliente"); return; }
    const q = quotes[0];
    if (!adminPedidos.find(p => p.id === q.id)) adminPedidos.push(q);
    toast("Cargando ítems…");
    const items = await resolverItems(q);
    toast("Generando Excel…");
    await generarExcelConPlantilla44(q, items);
    toast("Excel descargado ⬇");
  } catch(e) {
    toast("Error: " + e.message);
  }
}

async function agregarInteraccion() {
  if (!crmActual) return;
  const tipo = $("#crm-tipo").value;
  const desc = ($("#crm-desc").value || "").trim();
  const btn = $("#btn-crm-add");
  btn.disabled = true;
  btn.textContent = "Guardando…";
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/crm_interacciones_v2`, {
      method: "POST",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ client_rut: crmActual.rut, tipo, descripcion: desc || null })
    });
    if (!res.ok) throw new Error(await res.text() || res.status);
    $("#crm-desc").value = "";
    toast("Interacción registrada ✔");
    if ((crmActual.estado||"pendiente") === "pendiente" && tipo !== "nota") {
      await cambiarEstadoCRM("contactado");
    }
    await cargarInteracciones(crmActual.rut);
  } catch(e) {
    toast("Error: " + e.message);
  } finally {
    btn.disabled = false;
    btn.textContent = "+ Registrar";
  }
}

/* ---- TOAST ------------------------------------------------ */
let toastT;
function toast(msg) {
  const el = $("#toast");
  el.textContent = msg;
  el.classList.add("ver");
  clearTimeout(toastT);
  toastT = setTimeout(() => el.classList.remove("ver"), 2800);
}
