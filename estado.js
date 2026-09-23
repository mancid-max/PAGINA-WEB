/* ¿Ya subió lo último que commiteé?

   Compara tres cosas: el commit que tienes en el equipo, el que está en GitHub, y el que Netlify está
   sirviendo de verdad. Así se ve si falta hacer push, si el deploy va en camino o si ya está arriba.

   Uso: node estado.js            (una foto del estado)
        node estado.js --esperar  (se queda esperando hasta que el deploy termine) */
const { execSync } = require("child_process");
const SITIO = "https://mohicanojeans.netlify.app";
const ESPERAR = process.argv.includes("--esperar");

const git = (c) => { try { return execSync(c, { encoding: "utf8" }).trim(); } catch (_) { return ""; } };
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

async function enVivo() {
  try {
    const r = await fetch(`${SITIO}/.netlify/functions/version`, { headers: { "Cache-Control": "no-cache" } });
    if (!r.ok) return null;
    return await r.json();
  } catch (_) { return null; }
}

(async () => {
  const local = git("git rev-parse HEAD");
  const mensaje = git("git log -1 --format=%s").slice(0, 70);
  const remoto = (git("git ls-remote origin main") || "").split(/\s+/)[0] || "";

  console.log(`en tu equipo : ${local.slice(0, 7)}  ${mensaje}`);
  console.log(`en GitHub    : ${remoto.slice(0, 7) || "(no se pudo leer)"}${remoto && remoto !== local ? "   ← te falta hacer push" : ""}`);

  let v = await enVivo();
  if (!v) { console.log("publicado   : la funcion /version todavia no existe en el sitio (sube este cambio primero)"); return; }

  const listo = () => v && v.commit === remoto;
  console.log(`publicado    : ${v.commit_corto || "?"}${listo() ? "   <-- al dia" : "   <-- el deploy va en camino"}`);

  if (!ESPERAR || listo()) return;
  process.stdout.write("esperando el deploy");
  for (let i = 0; i < 60; i++) {
    await dormir(10000);
    process.stdout.write(".");
    v = await enVivo();
    if (listo()) { console.log(`\nLISTO: ya esta publicado ${v.commit_corto}`); return; }
  }
  console.log("\npasaron 10 minutos y el deploy no termino: revisa el panel de Netlify");
})();
