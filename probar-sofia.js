/* Prueba las funciones que usa Sofía con los casos que dispara un cliente real.

   No conversa con ella (Nexor no tiene API para eso): prueba la capa de datos, que es donde han estado
   casi todos los errores. Verifica además las reglas de Manu: sin stock al mostrar, el pie con código y
   precio, el handle de la imagen, los mínimos.

   Uso: node probar-sofia.js */
const BASE = "https://mohicanojeans.netlify.app/.netlify/functions";
const get = async (f, qs) => {
  try {
    const r = await fetch(`${BASE}/${f}?${new URLSearchParams(qs)}`, { headers: { "Cache-Control": "no-cache" } });
    return { status: r.status, json: await r.json().catch(() => null) };
  } catch (e) { return { status: 0, error: e.message }; }
};

const HANDLES = require("./handles-nexor.json").handles;
const R = [];
const ok = (n, cond, detalle) => R.push({ n, ok: !!cond, detalle: detalle || "" });

(async () => {
  /* ---- 1. Consulta por código ---- */
  const a = await get("stock-lookup", { codigo: "4222-00" });
  ok("código completo (4222-00)", a.json && a.json.ok, a.json && a.json.mensaje);
  ok("  la ficha NO trae stock", a.json && !/Stock:|unidades/.test(a.json.ficha_texto || ""), a.json && a.json.ficha_texto);
  ok("  el pie es código y precio", a.json && /^4222-00 · \$/.test(a.json.pie_foto || ""), a.json && a.json.pie_foto);
  ok("  el handle es el real de Nexor", a.json && a.json.imagen_handle === HANDLES["4222-00"], a.json && String(a.json.imagen_handle));
  ok("  el stock va aparte", a.json && /Stock:/.test(a.json.stock_texto || ""));
  ok("  el precio es neto + IVA", a.json && /\+ IVA/.test(a.json.precio_texto || ""), a.json && a.json.precio_texto);

  const b = await get("stock-lookup", { codigo: "4222" });
  ok("solo 4 dígitos (4222)", b.json && b.json.ok);
  const c = await get("stock-lookup", { codigo: "444800" });
  ok("6 dígitos sin guion (444800)", c.json && c.json.ok);
  const d = await get("stock-lookup", { codigo: "9999-00" });
  ok("código inexistente avisa sin romperse", d.json && d.json.ok === false && d.json.mensaje);

  /* ---- 2. Cole 44: handle con nombre ---- */
  const e = await get("stock-lookup", { codigo: "4448-00" });
  ok("Cole 44: handle con nombre", e.json && e.json.imagen_handle === HANDLES["4448-00"], e.json && String(e.json.imagen_handle));
  ok("Cole 44: sin cantidades por talla", e.json && !e.json.stock_por_talla);

  /* ---- 3. Búsqueda por estilo ---- */
  for (const corte of ["pitillo", "flare", "recto", "palazzo"]) {
    const s = await get("stock-lookup", { corte });
    const n = s.json && (s.json.modelos || []).length;
    ok(`busca "${corte}"`, s.json && s.json.ok && n > 0, `${n} modelos de ${s.json && s.json.total_encontrados}`);
    if (s.json && s.json.ok) {
      ok(`  "${corte}": tanda de 3`, n <= 3, String(n));
      ok(`  "${corte}": sin stock en la lista`, !/Stock:|unidades/.test(s.json.lista_texto || ""));
      ok(`  "${corte}": foto y pie emparejados`, (s.json.modelos || []).every((m) => m.pie && m.pie.startsWith(m.codigo)), JSON.stringify(s.json.modelos));
      ok(`  "${corte}": el handle es el real, no el deducido`, (s.json.modelos || []).every((m) => !m.foto || m.foto === (HANDLES[m.codigo] || null)), JSON.stringify((s.json.modelos || []).map((m) => m.codigo + " " + m.foto)));
    }
  }
  const z = await get("stock-lookup", { corte: "no-existe-este-corte" });
  ok("corte inexistente avisa sin inventar", z.json && z.json.ok === false && z.json.mensaje);

  /* ---- 4. Link del pedido ---- */
  const m1 = await get("link-pedido", { items: "4222-00:12" });
  ok("bajo el mínimo: lo rechaza", m1.json && m1.json.ok === false && /mínimo/i.test(m1.json.mensaje || ""), m1.json && m1.json.mensaje);
  const m2 = await get("link-pedido", { items: "4222-00:24" });
  ok("24 unidades: arma el link", m2.json && m2.json.ok && /catalogo-44|mohicanojeans/.test(m2.json.url || ""));
  const m3 = await get("link-pedido", { items: "4448-00:5" });
  ok("Cole 44 con menos de 12: lo rechaza", m3.json && m3.json.ok === false, m3.json && m3.json.mensaje);
  const m4 = await get("link-pedido", { items: "4222-00:24", rut: "16.388.334-1", transporte: "Starken" });
  ok("con RUT y transporte: van en el link", m4.json && m4.json.ok && /rut=/.test(m4.json.url || "") && /transporte=/.test(m4.json.url || ""));
  const m5 = await get("link-pedido", { items: "4222-00:24", rut: "11111111-1" });
  ok("RUT inválido: no rompe el link", m5.json && m5.json.ok !== undefined);

  /* ---- 5. Cliente ---- */
  const c1 = await get("datos-cliente", { rut: "16.388.334-1" });
  ok("cliente conocido", c1.json && c1.json.existe === true, c1.json && c1.json.razon_social);
  ok("  trae sus pedidos anteriores", c1.json && Array.isArray(c1.json.pedidos_anteriores), c1.json && c1.json.ultimo_pedido);
  const c2 = await get("datos-cliente", { rut: "1-9" });
  ok("RUT inválido: lo dice", c2.json && c2.json.valido === false);

  /* ---- 6. La ficha del link ---- */
  const r = await fetch(`https://mohicanojeans.netlify.app/m/4222-00`, { headers: { "User-Agent": "WhatsApp/2.23" } });
  const html = await r.text();
  ok("el link del modelo responde", r.ok);
  ok("  sin foto en la vista previa", !/property="og:image"/.test(html));
  ok("  con título y precio", /og:title/.test(html) && /IVA/.test(html));

  /* ---- Resultado ---- */
  const fallan = R.filter((x) => !x.ok);
  console.log(`\n${R.length - fallan.length} de ${R.length} pruebas OK\n`);
  for (const x of R) console.log(`  ${x.ok ? "ok  " : "FALLA"} ${x.n}${x.detalle && !x.ok ? "   -> " + String(x.detalle).replace(/\n/g, " ").slice(0, 90) : ""}`);
  if (fallan.length) { console.log(`\n${fallan.length} FALLAN:`); fallan.forEach((x) => console.log("  - " + x.n + (x.detalle ? "   " + String(x.detalle).replace(/\n/g, " ").slice(0, 110) : ""))); }
})();
