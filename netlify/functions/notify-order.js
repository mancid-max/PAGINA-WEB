exports.handler = async function(event) {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

  let order;
  try { order = JSON.parse(event.body); } catch { return { statusCode: 400, body: "Bad JSON" }; }

  const TOKEN = process.env.TELEGRAM_TOKEN;
  const CHAT  = process.env.TELEGRAM_CHAT_ID;

  const lineas = (order.items || []).map(it =>
    `  - ${it.codigo} ${it.nombre ? "(" + it.nombre + ")" : ""}: ${it.totalUnidades} u`
  ).join("\n");

  const texto = [
    "Nuevo pedido Cole 44",
    "",
    "Cliente: " + (order.storeName || order.clientName || "—"),
    "RUT: "     + (order.rut      || "—"),
    "Telefono: "+ (order.phone    || "—"),
    "Transporte: " + (order.transporte || "—"),
    "Ciudad: "  + (order.ciudad   || "—"),
    "",
    "Modelos:",
    lineas || "  (sin detalle)",
    "",
    "Total unidades: " + (order.totalUnidades || "—"),
  ].join("\n");

  const results = await Promise.allSettled([
    // Telegram
    fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: CHAT, text: texto })
    }),
  ]);

  const ok = results.every(r => r.status === "fulfilled");
  return { statusCode: ok ? 200 : 500, body: JSON.stringify({ ok }) };
};
