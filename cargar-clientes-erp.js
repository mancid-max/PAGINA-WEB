/* Carga la ficha de los clientes del ERP (Z:\BI\CLIENTE.Txt) a la base de la web, para que un mayorista
   que entra por el link de Sofía no tenga que escribir ningún dato: pone su RUT y la página ya sabe su
   razón social, giro, dirección, comuna y teléfono. Solo revisa y aprieta Enviar pedido.

   - Escribe a través de la función guardar-cliente (que corre en el servidor con la clave de Supabase):
     nunca pisa lo que ya está, solo completa lo que falta.
   - El transporte NO viene en el ERP: queda vacío y se guarda solo con el primer pedido que hagan.
   - Z:\BI es de solo lectura: acá solo se lee.
   - Los datos de los clientes van a Supabase, nunca al repo (es público).

   Uso: node cargar-clientes-erp.js            → simulación: dice cuántos crearía y completaría
        node cargar-clientes-erp.js --apply    → los carga de verdad
   La clave sale de %USERPROFILE%\.mohicano\api.json (order_key), fuera del repo. */
const fs = require("fs");
const path = require("path");

const ORIGEN = "Z:/BI/CLIENTE.Txt";
const API = "https://mohicanojeans.netlify.app/.netlify/functions/guardar-cliente";
const APLICAR = process.argv.includes("--apply");

const limpio = (v, n = 120) => String(v == null ? "" : v).trim().replace(/\s+/g, " ").slice(0, n) || null;
const digitos = (r) => String(r || "").replace(/[^0-9kK]/g, "").toUpperCase();
const formatRut = (d) => (d.length < 2 ? "" : d.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "-" + d.slice(-1));
function rutValido(d) {
  const m = /^(\d{7,8})([0-9K])$/.exec(d);
  if (!m) return false;
  let suma = 0, mul = 2;
  for (const x of m[1].split("").reverse()) { suma += Number(x) * mul; mul = mul === 7 ? 2 : mul + 1; }
  const res = 11 - (suma % 11);
  return (res === 11 ? "0" : res === 10 ? "K" : String(res)) === m[2];
}
function telefono(v) {
  const d = String(v || "").replace(/\D/g, "");
  if (!d || /^0+$/.test(d)) return null;
  if (d.length === 9 && d.startsWith("9")) return "56" + d;
  if (d.length === 11 && d.startsWith("569")) return d;
  if (d.length === 8) return "569" + d;
  return d.length >= 8 ? d : null;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  let clave = "";
  try { clave = String(JSON.parse(fs.readFileSync(path.join(process.env.USERPROFILE || process.env.HOME, ".mohicano", "api.json"), "utf8")).order_key || "").trim(); } catch (_) {}
  if (!clave) { console.error("Falta la clave en %USERPROFILE%\\.mohicano\\api.json"); process.exit(1); }

  const filas = fs.readFileSync(ORIGEN, "latin1").split(/\r?\n/).filter(Boolean).slice(1).map((l) => l.split(";"));
  const porRut = new Map();
  for (const c of filas) {
    const d = digitos(c[6]);
    if (!rutValido(d)) continue;
    const razon = limpio(c[0]);
    if (!razon || /^CLIENTES VARIOS$/i.test(razon)) continue;
    porRut.set(d, {
      rut: formatRut(d),
      razon_social: razon,
      giro: limpio(c[2]),
      direccion: limpio(c[1]),
      comuna: limpio(c[3]) || limpio(c[4]),
      telefono: telefono(c[5]) || telefono(c[20]),
    });
  }
  const lista = [...porRut.values()];
  console.log(`ERP: ${filas.length} filas · clientes con RUT válido: ${lista.length}`);
  const con = (k) => lista.filter((x) => x[k]).length;
  console.log(`traen giro ${con("giro")} · dirección ${con("direccion")} · comuna ${con("comuna")} · teléfono ${con("telefono")}`);
  console.log("(el transporte no está en el ERP: se guarda solo cuando el cliente hace su primer pedido)");

  if (!APLICAR) { console.log("\nSIMULACIÓN: no se escribió nada. Corre con --apply para cargarlos."); return; }

  let creados = 0, completados = 0, sinCambio = 0, errores = 0;
  for (let i = 0; i < lista.length; i += 5) {
    const lote = lista.slice(i, i + 5);
    await Promise.all(lote.map(async (c) => {
      try {
        const r = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json", "X-Api-Key": clave }, body: JSON.stringify(c) });
        const j = await r.json();
        if (!j.ok) { errores++; return; }
        if (j.creado) creados++;
        else if (/Datos guardados/.test(j.mensaje || "")) completados++;
        else sinCambio++;
      } catch (_) { errores++; }
    }));
    if (i % 50 === 0) { process.stdout.write(`  ${i + lote.length}/${lista.length}\r`); await sleep(200); }
  }
  console.log(`\nlisto: ${creados} fichas nuevas · ${completados} completadas · ${sinCambio} ya estaban al día · errores: ${errores}`);
})();
