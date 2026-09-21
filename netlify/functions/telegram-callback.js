/* telegram-callback — botones del grupo "Mohicano Pedidos": "Lo tomo yo" y "Marcar listo";
   y del grupo Ayuda: "Resuelta" en las solicitudes de clientes (sol:<uuid> → solicitudes.estado = resuelta).
   Telegram manda aquí (webhook) cada toque de botón. Se valida el secreto del webhook
   (header X-Telegram-Bot-Api-Secret-Token = TELEGRAM_WEBHOOK_SECRET) y:
     tomar:<uuid>  → toma el pedido en Supabase (quotes.tomado_por / tomado_at, atómico: solo si nadie lo tomó)
                     y edita el aviso: "Tomado por <persona> · hh:mm" + botón "Marcar listo".
     listo:<uuid>  → marca el pedido como "Pedido listo" en Supabase (quotes.is_ready / ready_at, igual que el
                     admin) y recién si eso resultó edita el aviso: "Listo · <persona> · hh:mm" y quita botones.
   Si dos personas tocan "Lo tomo yo" a la vez, gana la primera en Supabase; la otra recibe "Ya lo tomó X".
   Si la tabla aún no tiene las columnas tomado_por/tomado_at (database/supabase_quotes_tomado.sql), se usa
   el texto del mensaje como respaldo (sin garantía frente a toques simultáneos).

   Registro del webhook (una vez, con el token del bot y el mismo secreto que TELEGRAM_WEBHOOK_SECRET):
     POST https://api.telegram.org/bot<TOKEN>/setWebhook
          { "url": "https://mohicanojeans.netlify.app/.netlify/functions/telegram-callback",
            "secret_token": "<TELEGRAM_WEBHOOK_SECRET>", "allowed_updates": ["callback_query"] }
     GET  https://api.telegram.org/bot<TOKEN>/getWebhookInfo   → revisar url y last_error_message
   Con el webhook activo, getUpdates deja de funcionar para ese bot (409). Hecho el 2026-09-16. */
const SUPABASE_URL = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const SERVICE_KEY = (process.env.SUPABASE_SERVICE_KEY || "").trim();
const TOKEN = process.env.TELEGRAM_TOKEN;
const WEBHOOK_SECRET = (process.env.TELEGRAM_WEBHOOK_SECRET || "").trim();

const ok = (body) => ({ statusCode: 200, headers: { "Content-Type": "application/json; charset=utf-8" }, body: JSON.stringify(body) });
const tg = (metodo, payload) => fetch(`https://api.telegram.org/bot${TOKEN}/${metodo}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }).then((r) => r.json()).catch(() => ({ ok: false }));
const horaCL = () => {
  try { return new Intl.DateTimeFormat("es-CL", { timeZone: "America/Santiago", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date()); }
  catch (_) { return new Date().toISOString().slice(11, 16); }
};
const quien = (from = {}) => [from.first_name, from.last_name].filter(Boolean).join(" ") || (from.username ? `@${from.username}` : "alguien");
const RE_TOMADO = /\n\n🙋 Tomado por .+$/s;
const RE_LISTO = /\n\n✅ Listo · /s;
const LIMITE_TG = 4096;

/* PATCH a quotes con filtro; devuelve { ok, filas, status } (filas = las actualizadas, con return=representation) */
async function patchQuote(filtro, body) {
  if (!SUPABASE_URL || !SERVICE_KEY) return { ok: false, status: 0, filas: [], error: "Supabase sin configurar" };
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/quotes?${filtro}`, {
      method: "PATCH",
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify(body),
    });
    const text = await r.text();
    let filas = [];
    try { filas = text ? JSON.parse(text) : []; } catch (_) {}
    return { ok: r.ok, status: r.status, filas: Array.isArray(filas) ? filas : [], error: r.ok ? null : text.slice(0, 200) };
  } catch (e) { return { ok: false, status: 0, filas: [], error: e.message }; }
}
async function leerQuote(id, select) {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/quotes?id=eq.${id}&select=${select}&limit=1`, { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } });
    if (!r.ok) return null;
    return ((await r.json()) || [])[0] || null;
  } catch (_) { return null; }
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };
  const h = event.headers || {};
  const secreto = h["x-telegram-bot-api-secret-token"] || h["X-Telegram-Bot-Api-Secret-Token"] || "";
  if (!WEBHOOK_SECRET || secreto !== WEBHOOK_SECRET) return { statusCode: 401, body: "No autorizado" };
  if (!TOKEN) return { statusCode: 500, body: "TELEGRAM_TOKEN no configurado" };

  let update;
  try { update = JSON.parse(event.body || "{}"); } catch { return { statusCode: 400, body: "Bad JSON" }; }
  const cq = update.callback_query;
  if (!cq) return ok({ ignorado: true }); /* solo nos interesan los botones */
  const responder = (text) => tg("answerCallbackQuery", { callback_query_id: cq.id, text });

  const [accion, id] = String(cq.data || "").split(":");
  const msg = cq.message || {};
  const chatId = msg.chat && msg.chat.id;
  const messageId = msg.message_id;
  const texto = String(msg.text || "");
  const persona = quien(cq.from);
  const hora = horaCL();

  if (!chatId || !messageId || !texto || !/^[0-9a-f-]{36}$/i.test(String(id || ""))) {
    await responder("Botón no válido");
    return ok({ ignorado: true, motivo: "datos incompletos" });
  }

  if (accion === "tomar") {
    if (RE_LISTO.test(texto)) { await responder("Este pedido ya está listo"); return ok({ sin_cambio: "ya listo" }); }
    /* Lock atómico: solo actualiza si tomado_por es null. [] = otro lo tomó antes. 400 = columnas aún no creadas → respaldo por texto. */
    const lock = await patchQuote(`id=eq.${id}&tomado_por=is.null`, { tomado_por: persona, tomado_at: new Date().toISOString() });
    let modo = "supabase";
    if (lock.ok && lock.filas.length === 0) {
      const q = await leerQuote(id, "tomado_por,is_ready");
      if (q && q.is_ready) { await responder("Este pedido ya está listo"); return ok({ sin_cambio: "ya listo" }); }
      await responder(q && q.tomado_por ? `Ya lo tomó ${q.tomado_por}` : "Ya lo tomó otra persona");
      return ok({ sin_cambio: "ya tomado", por: q && q.tomado_por });
    }
    if (!lock.ok) {
      modo = "texto";
      const ya = texto.match(/🙋 Tomado por ([^\n]+?) · \d/);
      if (ya) { await responder(`Ya lo tomó ${ya[1].trim()}`); return ok({ sin_cambio: "ya tomado", modo }); }
    }
    const nuevo = `${texto}\n\n🙋 Tomado por ${persona} · ${hora}`;
    if (nuevo.length > LIMITE_TG) { await responder(`Pedido tomado por ${persona} (el aviso es muy largo para editarlo)`); return ok({ tomado: true, por: persona, modo, sin_editar: true }); }
    const r = await tg("editMessageText", { chat_id: chatId, message_id: messageId, text: nuevo, disable_web_page_preview: true,
      reply_markup: { inline_keyboard: [[{ text: "✅ Marcar listo", callback_data: `listo:${id}` }]] } });
    await responder(r.ok ? "Pedido tomado" : "Tomado, pero no pude actualizar el mensaje");
    return ok({ tomado: true, por: persona, modo, editado: !!r.ok });
  }

  if (accion === "listo") {
    if (RE_LISTO.test(texto)) { await responder("Ya estaba listo"); return ok({ sin_cambio: "ya listo" }); }
    /* Primero el admin (Supabase); si falla, no se toca el mensaje y el botón queda para reintentar */
    const up = await patchQuote(`id=eq.${id}`, { is_ready: true, ready_at: new Date().toISOString() });
    if (!up.ok || up.filas.length !== 1) {
      await responder(up.ok ? "No encontré ese pedido en el admin" : "No pude marcarlo en el admin, intenta de nuevo");
      return ok({ listo: false, supabase: up.status, error: up.error || "sin filas" });
    }
    /* Envío mixto (44 + 40-43): son dos pedidos con el mismo RUT y la misma hora; se marcan listos juntos */
    let hermanos = 0;
    try {
      const q = up.filas[0] || {};
      if (q.client_rut_normalized && q.created_at_client) {
        const h = await patchQuote(`id=neq.${id}&client_rut_normalized=eq.${encodeURIComponent(q.client_rut_normalized)}&created_at_client=eq.${encodeURIComponent(q.created_at_client)}`, { is_ready: true, ready_at: new Date().toISOString() });
        hermanos = h.ok ? h.filas.length : 0;
      }
    } catch (_) {}
    const base = texto.replace(RE_TOMADO, "");
    const nuevo = `${base}\n\n✅ Listo · ${persona} · ${hora}`;
    const r = await tg("editMessageText", { chat_id: chatId, message_id: messageId, text: nuevo.slice(0, LIMITE_TG), disable_web_page_preview: true, reply_markup: { inline_keyboard: [] } });
    await responder(r.ok ? "Pedido marcado como listo" : "Marcado en el admin, pero no pude actualizar el mensaje");
    return ok({ listo: true, por: persona, editado: !!r.ok, hermanos });
  }

  if (accion === "sol") {
    /* Solicitud de cliente (registrar-solicitud): marcar resuelta en Supabase y dejar constancia en el aviso. */
    let filas = [];
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/solicitudes?id=eq.${id}&estado=eq.pendiente`, {
        method: "PATCH",
        headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" },
        body: JSON.stringify({ estado: "resuelta", resuelta_at: new Date().toISOString(), resuelta_por: persona }),
      });
      filas = r.ok ? await r.json() : null;
    } catch (_) { filas = null; }
    if (filas === null) { await responder("No pude marcarla en la base; intenta de nuevo"); return ok({ error: "supabase" }); }
    if (!filas.length) { await responder("Esa solicitud ya estaba resuelta"); return ok({ sin_cambio: "ya resuelta" }); }
    /* El aviso original tiene formato HTML (negrita, link de WhatsApp); editar el texto lo perdería. Se quita el botón y se responde debajo. */
    const r = await tg("editMessageReplyMarkup", { chat_id: chatId, message_id: messageId, reply_markup: { inline_keyboard: [] } });
    await tg("sendMessage", { chat_id: chatId, reply_to_message_id: messageId, text: `✅ Resuelta · ${persona} · ${hora}` });
    await responder("Solicitud marcada como resuelta");
    return ok({ resuelta: true, por: persona, editado: !!r.ok });
  }

  await responder("Acción desconocida");
  return ok({ ignorado: true, accion });
};
