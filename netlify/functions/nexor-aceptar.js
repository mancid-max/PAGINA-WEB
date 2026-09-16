/* Aceptar / rechazar un lead "desconocido" de Nexor desde el aviso de Telegram, con confirmación.
   1) GET  /.netlify/functions/nexor-aceptar?lead=<uuid>&a=aceptar|rechazar&t=<firma>
      → muestra una página "¿Seguro?" con nombre y teléfono del lead y un botón de confirmar (nada se ejecuta todavía).
   2) POST (el botón de confirmar) → ejecuta la acción.
   - La firma la genera notify-nexor.js con HMAC-SHA256(lead|accion, NEXOR_ORDER_KEY): nadie puede armar el link a mano.
   - aceptar : quita tag "desconocido", pone "mayorista", mueve a "Lead creado" (core_new) en el agente B2B y reanuda la automatización → Sofía lo atiende.
   - rechazar: archiva el lead en Nexor.
   - devolver: (aviso "necesita ayuda") saca el lead de "Necesita ayuda (humano)", que deja a Sofía muda, y lo vuelve a "Información entregada".
   Env Netlify: NEXOR_API_KEY (clave REST nxr_live_…), NEXOR_ORDER_KEY (secreto para firmar). */
const crypto = require("crypto");
const NEXOR_API = "https://api.getnexor.ai/api/public";
const API_KEY = (process.env.NEXOR_API_KEY || "").trim();
const SECRET = (process.env.NEXOR_ORDER_KEY || "").trim();
const WORKFLOW_B2B = "a914d7c0-fccc-4eb1-947a-ac5f875111d1";

const firma = (lead, accion) => crypto.createHmac("sha256", SECRET).update(`${lead}|${accion}`).digest("hex").slice(0, 32);
const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const pagina = (titulo, cuerpo, { ok = true, status = 200 } = {}) => ({
  statusCode: status,
  headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  body: `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(titulo)}</title>
<style>body{font-family:system-ui,sans-serif;background:#f6f6f6;margin:0;padding:32px 16px;text-align:center}.c{max-width:440px;margin:0 auto;background:#fff;border-radius:12px;padding:28px 22px;box-shadow:0 2px 12px rgba(0,0,0,.08)}h1{font-size:1.2rem;margin:0 0 .6rem;color:${ok ? "#111827" : "#b91c1c"}}p{color:#374151;margin:.4rem 0;line-height:1.45}.dato{background:#f3f4f6;border-radius:8px;padding:.6rem .8rem;margin:.9rem 0;text-align:left;font-size:.95rem}.dato b{display:inline-block;min-width:88px;color:#6b7280;font-weight:600}.btn{display:inline-block;border:0;border-radius:10px;padding:.8rem 1.2rem;font-size:1rem;font-weight:700;cursor:pointer;margin:.35rem;text-decoration:none}.ok{background:#15803d;color:#fff}.no{background:#b91c1c;color:#fff}.gris{background:#e5e7eb;color:#111827}</style></head>
<body><div class="c"><h1>${esc(titulo)}</h1>${cuerpo}</div></body></html>`,
});

async function nx(method, path, body) {
  const r = await fetch(`${NEXOR_API}${path}`, {
    method,
    headers: { "X-API-Key": API_KEY, "Content-Type": "application/json", Accept: "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const txt = await r.text();
  let data = null; try { data = txt ? JSON.parse(txt) : null; } catch { data = { raw: txt }; }
  if (!r.ok) throw new Error(`${method} ${path} → HTTP ${r.status}: ${txt.slice(0, 200)}`);
  return data;
}
async function datosLead(lead) {
  try {
    const info = await nx("GET", `/leads/${lead}`);
    const l = (info && (info.lead || info.data || info)) || {};
    return {
      nombre: [l.first_name, l.last_name].filter(Boolean).join(" ") || "—",
      phone: l.phone || "—",
      tags: (Array.isArray(l.tags) ? l.tags : []).map((x) => String((x && (x.slug || x.name)) || x)).filter(Boolean),
      creado: l.created_at ? new Date(l.created_at).toLocaleString("es-CL", { timeZone: "America/Santiago" }) : "—",
    };
  } catch (e) { return { nombre: "—", phone: "—", tags: [], creado: "—", error: e.message }; }
}
function leerParams(event) {
  const q = { ...(event.queryStringParameters || {}) };
  if (event.httpMethod === "POST" && event.body) {
    const raw = event.isBase64Encoded ? Buffer.from(event.body, "base64").toString("utf8") : event.body;
    for (const [k, v] of new URLSearchParams(raw)) q[k] = v;
  }
  return q;
}

exports.handler = async (event) => {
  const q = leerParams(event);
  const lead = String(q.lead || "").trim();
  const accion = String(q.a || "aceptar").toLowerCase();
  const t = String(q.t || "").trim();
  if (!/^[0-9a-f-]{36}$/i.test(lead) || !["aceptar", "rechazar", "devolver"].includes(accion)) return pagina("Link inválido", "<p>Faltan datos del lead.</p>", { ok: false, status: 400 });
  if (!SECRET || !API_KEY) return pagina("Falta configuración", "<p>Revisa NEXOR_API_KEY y NEXOR_ORDER_KEY en Netlify.</p>", { ok: false, status: 500 });
  if (t !== firma(lead, accion)) return pagina("Link no válido", "<p>La firma no coincide. Usa el botón del aviso de Telegram.</p>", { ok: false, status: 400 });

  const d = await datosLead(lead);
  const ficha = `<div class="dato"><div><b>Nombre</b> ${esc(d.nombre)}</div><div><b>Teléfono</b> ${esc(d.phone)}</div><div><b>Escribió</b> ${esc(d.creado)}</div><div><b>Etiquetas</b> ${esc(d.tags.join(", ") || "—")}</div></div>`;

  /* 1) Confirmación (GET): no se ejecuta nada todavía */
  if (event.httpMethod !== "POST" || q.confirmar !== "1") {
    const esAceptar = accion === "aceptar";
    const esDevolver = accion === "devolver";
    const titulo = esDevolver ? "¿Devolver este cliente a Sofía?" : esAceptar ? "¿Seguro que quieres aceptarlo como mayorista?" : "¿Seguro que quieres rechazar este lead?";
    const detalle = esDevolver
      ? "Úsalo cuando ya lo atendiste. Al confirmar, el lead sale de <b>Necesita ayuda (humano)</b>, vuelve a <b>Información entregada</b> y Sofía le responde de nuevo."
      : esAceptar
        ? "Al confirmar, Sofía lo atenderá por WhatsApp desde ahora y quedará con la etiqueta <b>mayorista</b>. Contará como lead."
        : "Al confirmar, el lead se archiva en Nexor y Sofía no le responderá.";
    const form = `<form method="POST" action=""><input type="hidden" name="lead" value="${esc(lead)}"><input type="hidden" name="a" value="${esc(accion)}"><input type="hidden" name="t" value="${esc(t)}"><input type="hidden" name="confirmar" value="1">
      <button class="btn ${esAceptar || esDevolver ? "ok" : "no"}" type="submit">${esDevolver ? "Sí, devolver a Sofía" : esAceptar ? "Sí, aceptar como mayorista" : "Sí, rechazar"}</button></form>
      <p style="margin-top:.8rem"><a class="btn gris" href="https://app.getnexor.ai" target="_blank" rel="noopener">Cancelar / ver en Nexor</a></p>`;
    return pagina(titulo, `${ficha}<p>${detalle}</p>${form}`);
  }

  /* 2) Ejecutar (POST confirmado) */
  try {
    if (accion === "devolver") {
      /* "Necesita ayuda (humano)" apaga a Sofía para ese lead; al volver a una etapa normal se reactiva */
      await nx("POST", `/leads/${lead}/status`, { status_key: "informed", workflow_id: WORKFLOW_B2B, reason: "Atendido por una persona; devuelto a Sofía desde Telegram" });
      await nx("POST", `/leads/${lead}/automation/resume`, { workflow_id: WORKFLOW_B2B }).catch(() => {});
      return pagina("Cliente devuelto a Sofía", `${ficha}<p>Volvió a <b>Información entregada</b>. Sofía le responde de nuevo.</p>`);
    }
    if (accion === "rechazar") {
      await nx("PATCH", `/leads/${lead}`, { metadata: { filtro: "rechazado", rechazado_en: new Date().toISOString() } }).catch(() => {});
      await nx("DELETE", `/leads/${lead}`);
      return pagina("Lead rechazado", `${ficha}<p>Quedó archivado en Nexor. Sofía no le responderá.</p>`);
    }
    const tags = Array.from(new Set(d.tags.filter((x) => x !== "desconocido").concat("mayorista")));
    await nx("POST", `/leads/tags`, { lead_id: lead, tags });
    await nx("PATCH", `/leads/${lead}`, { metadata: { filtro: "aceptado", aceptado_en: new Date().toISOString(), lista_blanca: true, segmento: "b2b" } }).catch(() => {});
    await nx("POST", `/leads/${lead}/status`, { status_key: "core_new", workflow_id: WORKFLOW_B2B, reason: "Aceptado como mayorista desde Telegram" });
    await nx("POST", `/leads/${lead}/automation/resume`, { workflow_id: WORKFLOW_B2B, resume_cadence: true });
    return pagina("Lead aceptado", `${ficha}<p>Quedó como <b>mayorista</b>. Sofía lo atiende desde ahora.</p>`);
  } catch (e) {
    console.error("nexor-aceptar:", e.message);
    return pagina("No se pudo completar", `<p>Nexor respondió con error: ${esc(String(e.message).slice(0, 180))}.</p><p>Puedes hacerlo a mano en el panel de Nexor.</p>`, { ok: false, status: 502 });
  }
};
