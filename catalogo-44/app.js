/* ============================================================
   MOHICANO · DOLCE VITA 44 — Pedidos mayoristas
   ============================================================ */

/* ---- CONFIGURACIÓN ---------------------------------------- */
const WHATSAPP       = "56233990578";
const MIN_POR_MODELO = 12;
const TALLAS_JEANS   = ["36","38","40","42","44","46"];
const TALLAS_CHAQ    = ["S","M","L","XL"];
const CURVA_JEANS    = {"36":2,"38":2,"40":2,"42":2,"44":2,"46":2};
const CURVA_CHAQ     = {"S":3,"M":3,"L":3,"XL":3};
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
  {id:"perfect",   nombre:"Perfect Fit",                      cover:"c204"},
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
  // PERFECT FIT
  {nombre:"Lucca",        codigo:"4432-00", precio:24990, img:"m205", tipo:"jeans", sec:"perfect"},
  {nombre:"Megève",       codigo:"4434-00", precio:25990, img:"m209", tipo:"jeans", sec:"perfect"},
  {nombre:"Capri",        codigo:"4435-00", precio:25990, img:"m213", tipo:"jeans", sec:"perfect"},
  {nombre:"Lecce",        codigo:"4440-00", precio:25990, img:"m217", tipo:"jeans", sec:"perfect"},
  {nombre:"Ischia",       codigo:"4440-60", precio:25990, img:"m221", tipo:"jeans", sec:"perfect"},
  {nombre:"Alba",         codigo:"4459-00", precio:25990, img:"m225", tipo:"jeans", sec:"perfect"},
  {nombre:"Firenze",      codigo:"4471-00", precio:25990, img:"m229", tipo:"jeans", sec:"perfect"},
  {nombre:"Belluno",      codigo:"4473-00", precio:24990, img:"m233", tipo:"jeans", sec:"perfect"},
  {nombre:"Mantova",      codigo:"4481-00", precio:25990, img:"m237", tipo:"jeans", sec:"perfect"},
  {nombre:"Monza",        codigo:"4485-00", precio:25990, img:"m241", tipo:"jeans", sec:"perfect"},
  {nombre:"Piemonte",     codigo:"4486-02", precio:25990, img:"m245", tipo:"jeans", sec:"perfect"},
  {nombre:"Murano",       codigo:"4493-00", precio:25990, img:"m249", tipo:"jeans", sec:"perfect"},
  {nombre:"Porto",        codigo:"4493-01", precio:26990, img:"m253", tipo:"jeans", sec:"perfect"},
  {nombre:"Limone",       codigo:"4494-00", precio:26990, img:"m257", tipo:"jeans", sec:"perfect"},
  // CHAQUETAS
  {nombre:"Aurelia",      codigo:"4465-00", precio:null,  img:"m262", tipo:"chaqueta", sec:"chaquetas"},
  {nombre:"Aurelia Denim",codigo:"4465-01", precio:null,  img:"m265", tipo:"chaqueta", sec:"chaquetas"},
];

/* ============================================================ */
const $     = s => document.querySelector(s);
const CLP   = n => "$" + Number(n).toLocaleString("es-CL");
const tallasDe  = m => m.tipo === "chaqueta" ? TALLAS_CHAQ : TALLAS_JEANS;
const curvaDe   = m => m.tipo === "chaqueta" ? CURVA_CHAQ  : CURVA_JEANS;
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
let filtroSec = "todos";
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
    document.querySelectorAll(".chip").forEach(c => c.classList.remove("activo"));
    b.classList.add("activo");
    pintarGrid();
  };
  barra.insertBefore(b, $("#busca"));
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
  return `
    <article class="card">
      <div class="marco" onclick="abrirModal('${m.codigo}')">
        <img src="img/${m.img}_0.webp" alt="${m.nombre} ${m.codigo}" loading="lazy">
        <span class="lupa">👆 Ver modelo y curva</span>
      </div>
      <div class="cuerpo">
        <h3>${m.nombre}</h3>
        <p class="codigo">Código <b>${m.codigo}</b> · ${nombreSec(m.sec)}</p>
        <p class="precio">${m.precio ? CLP(m.precio) : "A consultar"}<small>${m.precio ? "por unidad · IVA incluido" : "precio mayorista por WhatsApp"}</small></p>
        <div class="botones">
          <div class="fila">
            <button class="btn btn-rojo" onclick="abrirModal('${m.codigo}')">Armar curva</button>
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
  $("#m-wsp").href = linkWsp(`¡Hola Mohicano! 👖 Quiero consultar por el modelo *${m.nombre} ${m.codigo}* de la colección DOLCE VITA 44.`);
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
      <span class="t">${t}</span><span></span>
      <div class="stepper">
        <button onclick="paso('${t}',-1)">−</button>
        <span class="cant" id="cant-${t}">${selModal[t]||0}</span>
        <button onclick="paso('${t}',1)">+</button>
      </div>
    </div>`).join("");
  actualizarTotalModal();
}
window.paso = function(t, d) {
  selModal[t] = Math.max(0, (selModal[t]||0) + d);
  if (!selModal[t]) delete selModal[t];
  $("#cant-"+t).textContent = selModal[t] || 0;
  actualizarTotalModal();
};
function totalSel() { return Object.values(selModal).reduce((a,b) => a+b, 0); }
function actualizarTotalModal() {
  const tot = totalSel();
  $("#m-total").textContent = tot;
  $("#m-aviso").classList.toggle("ver", tot > 0 && tot < MIN_POR_MODELO);
}
$("#m-curva").onclick = () => {
  const cv = curvaDe(modeloAbierto);
  Object.keys(cv).forEach(t => selModal[t] = (selModal[t]||0) + cv[t]);
  pintarTallasModal();
  toast("Curva de 12 unidades agregada ✔");
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
      return `<div class="item-c">
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
window.quitar = function(c) { delete carrito[c]; guardar(); pintarCarrito(); };
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
}

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
      // transporte: intentar del RPC, si no del localStorage
      const transpGuardado = row.transporte || localStorage.getItem("dv44_transp_" + norm) || "";
      if (transpGuardado) elTransp().value = transpGuardado;
      setRutEstado("ok", "✔ Cliente encontrado: " + row.razon_social);
      mostrarCampos("existente");
    } else {
      clienteBuscado = { rut: formatRut(norm), rut_normalized: norm, razon_social: "", is_new: true };
      limpiarForm();
      elNombre().readOnly = false;
      // transporte recordado para clientes nuevos también
      const transpGuardado = localStorage.getItem("dv44_transp_" + norm) || "";
      if (transpGuardado) elTransp().value = transpGuardado;
      setRutEstado("nuevo", "Cliente nuevo — completa los datos");
      mostrarCampos("nuevo");
    }
    $("#btn-finalizar").style.display = "flex";
  } catch(e) {
    setRutEstado("error", "No se pudo verificar el RUT — revisa tu conexión");
    mostrarCampos(false);
  }
}

$("#btn-buscar-rut").onclick = buscarClientePorRut;
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
    transporte:   elTransp().value.trim(),
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

$("#btn-finalizar").onclick = async () => {
  const codigos = Object.keys(carrito);
  if (!codigos.length) { toast("Tu pedido está vacío"); return; }
  const bajos = codigos.filter(c => Object.values(carrito[c].t).reduce((a,b)=>a+b,0) < MIN_POR_MODELO);
  if (bajos.length) { toast("Hay modelos bajo el mínimo de "+MIN_POR_MODELO+" u.: "+bajos.join(", ")); return; }

  if (!clienteBuscado) { toast("Ingresa y verifica el RUT del cliente"); elRut().focus(); return; }
  if (!validarCamposForm()) return;

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
    // Generar Excel (lee carrito sincrónicamente antes del primer await interno)
    generarExcel(pedidoListo, payload);
    // Link WhatsApp antes de vaciar (usa carrito)
    const wspLink = linkWsp(textoPedido(cliente, payload));
    // Vaciar carrito
    carrito = {}; guardar(); pintarCarrito();
    // Mostrar éxito
    gEl.style.display = "none";
    $("#exito").classList.add("ver");
    $("#btn-wsp-pedido").href = wspLink;
    $("#btn-finalizar").style.display = "none";
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

  const setCelda = (ref, val) => {
    if (!ref || val == null || val === "") return;
    sh.cell(ref).value(String(val));
  };

  sh.cell(CONFIG44.rutCell).value(quote.client_rut || "");
  sh.cell(CONFIG44.dateCell).value(new Date(quote.created_at || Date.now()));
  sh.cell(CONFIG44.phoneCell).value(quote.client_phone || "");
  sh.cell(CONFIG44.idLabelCell).value("ID");
  sh.cell(CONFIG44.idValueCell).value(quote.id ? "COT-" + String(quote.id).slice(0,8).toUpperCase() : "");
  setCelda(CONFIG44.razonSocialCell, quote.store_name);
  setCelda(CONFIG44.giroCell,        quote.giro);
  setCelda(CONFIG44.direccionCell,   quote.direccion);
  setCelda(CONFIG44.nombreTiendaCell,quote.nombre_tienda);
  setCelda(CONFIG44.comunaCell,      quote.comuna);
  setCelda(CONFIG44.transporteCell,  quote.transporte);

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
  ["login","lista","detalle"].forEach(s => {
    $("#admin-seccion-"+s).style.display = s === seccion ? "block" : "none";
  });
}

$("#btn-admin").onclick = abrirAdmin;
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
    btn.classList.add("activo", filtroEstadoAdmin === "listo" ? "activo-listo" : filtroEstadoAdmin === "pendiente" ? "activo-pend" : "");
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
    return `<tr>
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

function customConfirm(titulo, mensaje) {
  return new Promise(resolve => {
    $("#confirm-titulo").textContent = titulo;
    $("#confirm-msg").textContent = mensaje;
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
window.verDetallePedido = function(id) {
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

  const items = q._items || [];
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

/* ---- ADMIN: EXCEL POR PEDIDO ------------------------------ */
window.descargarExcelAdmin = async function(id) {
  const q = adminPedidos.find(p => p.id === id);
  if (!q) return;
  if ((q._items || []).length === 0 && q.total_items > 0) {
    toast("⚠ Sesión expirada — cerrá sesión y volvé a entrar para cargar los ítems");
    return;
  }
  toast("Generando Excel con PLANILLA 44…");
  try {
    await generarExcelConPlantilla44(q, q._items || []);
    toast("Excel descargado ⬇");
  } catch(e) {
    toast("Error: " + e.message);
  }
};

$("#btn-dl-excel").onclick = async () => {
  if (!adminPedidoActual) return;
  if ((adminPedidoActual._items || []).length === 0 && adminPedidoActual.total_items > 0) {
    toast("⚠ Sesión expirada — cerrá sesión y volvé a entrar para cargar los ítems");
    return;
  }
  toast("Generando Excel…");
  try {
    await generarExcelConPlantilla44(adminPedidoActual, adminPedidoActual._items || []);
    toast("Excel descargado ⬇");
  } catch(e) {
    toast("Error: " + e.message);
  }
};

/* ---- TOAST ------------------------------------------------ */
let toastT;
function toast(msg) {
  const el = $("#toast");
  el.textContent = msg;
  el.classList.add("ver");
  clearTimeout(toastT);
  toastT = setTimeout(() => el.classList.remove("ver"), 2800);
}
