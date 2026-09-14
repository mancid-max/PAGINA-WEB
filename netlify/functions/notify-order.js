exports.handler = async function(event) {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

  let order;
  try { order = JSON.parse(event.body); } catch { return { statusCode: 400, body: "Bad JSON" }; }

  const TOKEN = process.env.TELEGRAM_TOKEN;
  const CHAT  = process.env.TELEGRAM_CHAT_ID || "-5261495560";

  /* Cole 44 (catalogo-44 / dolce-vita-44) o Cole 40-43 (catalogo-43, catalogo-2, catalogo-mixto).
     Sin source se asume Cole 44, que era el unico que avisaba antes. */
  const src   = String(order.source || "").toLowerCase();
  const es44  = !src || src.includes("44");
  const id6   = order.quoteId ? String(order.quoteId).slice(-6).toUpperCase() : "???";
  const titulo = es44 ? "Nuevo pedido Cole 44" : "Nuevo pedido Cole 40-43";
  const ref  = (es44 ? "DV44-" : "C43-") + id6;
  const link = es44
    ? (order.quoteId ? "https://mohicanojeans.netlify.app/catalogo-44/?pedido=" + order.quoteId : "https://mohicanojeans.netlify.app/catalogo-44/")
    : "https://mohicanojeans.netlify.app/?admin=1#admin";

  const lineas = (order.items || []).map(it =>
    `  - ${it.codigo}${it.nombre ? " (" + it.nombre + ")" : ""}: ${it.totalUnidades} u`
  ).join("\n");

  const texto = [
    titulo + "  [" + ref + "]",
    "",
    "Cliente: "    + (order.storeName  || "—"),
    "RUT: "        + (order.rut        || "—"),
    "Telefono: "   + (order.phone      || "—"),
    "Transporte: " + (order.transporte || "—"),
    "Ciudad: "     + (order.ciudad     || "—"),
    "",
    "Modelos:",
    lineas || "  (sin detalle)",
    "",
    "Total unidades: " + (order.totalUnidades || "—"),
    "",
    "Ver pedido: " + link,
  ].join("\n");

  await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: CHAT, text: texto, disable_web_page_preview: true }),
  });

  return { statusCode: 200, body: JSON.stringify({ ok: true, ref }) };
};
