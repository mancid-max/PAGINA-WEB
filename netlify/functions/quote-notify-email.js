exports.handler = async (event) => {
  console.log("quote-notify-email invoked", {
    method: event.httpMethod,
    hasBody: Boolean(event.body),
  });

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: "Method Not Allowed",
    };
  }

  const resendApiKey = process.env.RESEND_API_KEY || "";
  const from = process.env.QUOTE_NOTIFY_FROM || "";
  const toRaw = process.env.QUOTE_NOTIFY_TO || "";
  const replyTo = process.env.QUOTE_NOTIFY_REPLY_TO || "";

  if (!resendApiKey || !from || !toRaw) {
    console.warn("quote-notify-email skipped: missing env", {
      hasApiKey: Boolean(resendApiKey),
      hasFrom: Boolean(from),
      hasTo: Boolean(toRaw),
    });
    return {
      statusCode: 202,
      body: JSON.stringify({ skipped: true, reason: "missing_email_env" }),
    };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch (_) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "invalid_json" }),
    };
  }

  const quoteId = String(payload?.quote_id || payload?.quote?.id || "").trim();
  const quote = payload?.quote || {};
  const items = Array.isArray(payload?.items) ? payload.items : [];
  const client = payload?.client || {};
  const recipients = toRaw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (!quoteId || !items.length || !recipients.length) {
    console.warn("quote-notify-email skipped: missing quote data", {
      quoteId,
      items: items.length,
      recipients: recipients.length,
    });
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "missing_quote_data" }),
    };
  }

  const source = String(quote?.source || "web").trim() || "web";
  const storeName = String(client?.razon_social || quote?.store_name || "").trim() || "Sin nombre";
  const clientRut = String(client?.rut || quote?.client_rut || "").trim() || "Sin RUT";
  const clientPhone = String(client?.client_phone || quote?.client_phone || "").trim() || "Sin telefono";
  const totalItems = Number(quote?.total_items || 0) || 0;
  const createdAt = String(quote?.created_at_client || "").trim() || new Date().toISOString();
  const visibleCode = `COT-${quoteId.replace(/[^0-9A-Za-z]/g, "").slice(-5) || quoteId.slice(0, 8)}`;

  const itemLines = items.map((item) => {
    const sku = String(item?.sku || "").trim();
    const size = String(item?.talla || item?.size || "").trim();
    const quantity = Number(item?.cantidad || item?.quantity || 0) || 0;
    return {
      sku,
      size,
      quantity,
    };
  }).filter((item) => item.sku && item.size && item.quantity > 0);

  const detailHtml = itemLines.map((item) =>
    `<li><strong>${escapeHtml(item.sku)}</strong> · T${escapeHtml(item.size)} · ${escapeHtml(String(item.quantity))}</li>`
  ).join("");

  const detailText = itemLines.map((item) =>
    `- ${item.sku} · T${item.size} · ${item.quantity}`
  ).join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;color:#111827">
      <h2 style="margin:0 0 12px">Nueva cotización recibida</h2>
      <p style="margin:0 0 8px"><strong>Código:</strong> ${escapeHtml(visibleCode)}</p>
      <p style="margin:0 0 8px"><strong>UUID:</strong> ${escapeHtml(quoteId)}</p>
      <p style="margin:0 0 8px"><strong>Colección:</strong> ${escapeHtml(source)}</p>
      <p style="margin:0 0 8px"><strong>Cliente:</strong> ${escapeHtml(storeName)}</p>
      <p style="margin:0 0 8px"><strong>RUT:</strong> ${escapeHtml(clientRut)}</p>
      <p style="margin:0 0 8px"><strong>Teléfono:</strong> ${escapeHtml(clientPhone)}</p>
      <p style="margin:0 0 8px"><strong>Total prendas:</strong> ${escapeHtml(String(totalItems))}</p>
      <p style="margin:0 0 12px"><strong>Fecha cliente:</strong> ${escapeHtml(createdAt)}</p>
      <h3 style="margin:16px 0 8px">Detalle</h3>
      <ul style="padding-left:18px;margin:0">${detailHtml}</ul>
    </div>
  `.trim();

  const text = [
    "Nueva cotización recibida",
    `Código: ${visibleCode}`,
    `UUID: ${quoteId}`,
    `Colección: ${source}`,
    `Cliente: ${storeName}`,
    `RUT: ${clientRut}`,
    `Teléfono: ${clientPhone}`,
    `Total prendas: ${totalItems}`,
    `Fecha cliente: ${createdAt}`,
    "",
    "Detalle:",
    detailText,
  ].join("\n");

  const emailPayload = {
    from,
    to: recipients,
    subject: `Nueva cotización ${visibleCode} · ${storeName}`,
    html,
    text,
    tags: [
      { name: "quote_source", value: sanitizeTagValue(source) },
      { name: "quote_code", value: sanitizeTagValue(visibleCode) },
    ],
  };

  if (replyTo) emailPayload.reply_to = replyTo;

  const resendRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(emailPayload),
  });

  if (!resendRes.ok) {
    const errorText = await resendRes.text().catch(() => "");
    console.error("quote-notify-email resend error", {
      status: resendRes.status,
      details: errorText,
    });
    return {
      statusCode: resendRes.status,
      body: JSON.stringify({ error: "email_send_failed", details: errorText }),
    };
  }

  const data = await resendRes.json().catch(() => ({}));
  console.log("quote-notify-email sent", {
    resendId: data?.id || null,
    quoteId,
    recipients,
  });
  return {
    statusCode: 200,
    body: JSON.stringify({ ok: true, id: data?.id || null }),
  };
};

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sanitizeTagValue(value) {
  return String(value || "")
    .replace(/[^A-Za-z0-9_-]/g, "-")
    .slice(0, 256) || "unknown";
}
