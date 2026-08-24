exports.handler = async function(event) {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

  let order;
  try { order = JSON.parse(event.body); } catch { return { statusCode: 400, body: "Bad JSON" }; }

  const TOKEN = process.env.TELEGRAM_TOKEN;
  const CHAT  = process.env.TELEGRAM_CHAT_ID;

  const ref  = order.quoteId ? "DV44-" + order.quoteId.slice(-6).toUpperCase() : "DV44-???";
  const link = order.quoteId
    ? "https://mohicanojeans.netlify.app/catalogo-44/?pedido=" + order.quoteId
    : "https://mohicanojeans.netlify.app/catalogo-44/";

  const lineas = (order.items || []).map(it =>
    `  - ${it.codigo}${it.nombre ? " (" + it.nombre + ")" : ""}: ${it.totalUnidades} u`
  ).join("\n");

  const texto = [
    "Nuevo pedido Cole 44  [" + ref + "]",
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
