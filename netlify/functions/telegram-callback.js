/* telegram-callback — botones del grupo "Mohicano Pedidos": "Lo tomo yo" y "Marcar listo".
   Telegram manda aquí (webhook) cada toque de botón. Se valida el secreto del webhook
   (header X-Telegram-Bot-Api-Secret-Token = TELEGRAM_WEBHOOK_SECRET) y:
     tomar:<uuid>  → edita el aviso: "Tomado por <persona> · hh:mm" y deja el botón "Marcar listo"
     listo:<uuid>  → edita el aviso: "Listo · <persona> · hh:mm", quita botones y marca el pedido
                     como "Pedido listo" en Supabase (quotes.is_ready / ready_at), igual que el admin.
   Si otra persona ya lo tomó, el segundo toque solo recibe un aviso y no cambia nada. */
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

  const [accion, id] = String(cq.data || "").split(":");
  const msg = cq.message || {};
  const chatId = msg.chat && msg.chat.id;
  const messageId = msg.message_id;
  const texto = String(msg.text || "");
  const persona = quien(cq.from);
  const hora = horaCL();

  if (!chatId || !messageId || !/^[0-9a-f-]{36}$/i.test(String(id || ""))) {
    await tg("answerCallbackQuery", { callback_query_id: cq.id, text: "Botón no válido" });
    return ok({ ignorado: true, motivo: "datos incompletos" });
  }

  if (accion === "tomar") {
    if (RE_LISTO.test(texto)) { await tg("answerCallbackQuery", { callback_query_id: cq.id, text: "Este pedido ya está listo" }); return ok({ sin_cambio: "ya listo" }); }
    const ya = texto.match(/🙋 Tomado por ([^·\n]+)/);
    if (ya) { await tg("answerCallbackQuery", { callback_query_id: cq.id, text: `Ya lo tomó ${ya[1].trim()}` }); return ok({ sin_cambio: "ya tomado" }); }
    const nuevo = `${texto}\n\n🙋 Tomado por ${persona} · ${hora}`;
    const r = await tg("editMessageText", { chat_id: chatId, message_id: messageId, text: nuevo, disable_web_page_preview: true,
      reply_markup: { inline_keyboard: [[{ text: "✅ Marcar listo", callback_data: `listo:${id}` }]] } });
    await tg("answerCallbackQuery", { callback_query_id: cq.id, text: r.ok ? "Pedido tomado" : "No pude marcarlo" });
    return ok({ tomado: r.ok, por: persona });
  }

  if (accion === "listo") {
    if (RE_LISTO.test(texto)) { await tg("answerCallbackQuery", { callback_query_id: cq.id, text: "Ya estaba listo" }); return ok({ sin_cambio: "ya listo" }); }
    let supabase = "sin configurar";
    if (SUPABASE_URL && SERVICE_KEY) {
      try {
        const r = await fetch(`${SUPABASE_URL}/rest/v1/quotes?id=eq.${id}`, {
          method: "PATCH",
          headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json", Prefer: "return=minimal" },
          body: JSON.stringify({ is_ready: true, ready_at: new Date().toISOString() }),
        });
        supabase = r.status;
      } catch (e) { supabase = e.message; }
    }
    const base = texto.replace(RE_TOMADO, "");
    const nuevo = `${base}\n\n✅ Listo · ${persona} · ${hora}`;
    const r = await tg("editMessageText", { chat_id: chatId, message_id: messageId, text: nuevo, disable_web_page_preview: true, reply_markup: { inline_keyboard: [] } });
    await tg("answerCallbackQuery", { callback_query_id: cq.id, text: r.ok ? "Pedido marcado como listo" : "No pude marcarlo" });
    return ok({ listo: r.ok, por: persona, supabase });
  }

  await tg("answerCallbackQuery", { callback_query_id: cq.id, text: "Acción desconocida" });
  return ok({ ignorado: true, accion });
};
