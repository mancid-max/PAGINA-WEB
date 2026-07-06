// netlify/functions/crm-ps-sync.js
// Sincroniza clientes aprobados de PrestaShop WholeSale B2B → CRM Supabase
// Llamar con POST { secret: "..." } o desde un cron

const SUPABASE_URL = process.env.SUPABASE_URL || "https://kdtydxihrflhziclgiof.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_CRM_KEY || process.env.SUPABASE_SERVICE_KEY;
const PS_URL       = (process.env.PRESTASHOP_URL || "https://mohicano.cl").replace(/\/$/, "");
const PS_KEY       = process.env.PRESTASHOP_API_KEY;
const CRM_SECRET   = process.env.CRM_SECRET || "mohicano-crm-2026";

const SB_HEADERS = {
  "apikey":        SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
  "Content-Type":  "application/json",
  "Prefer":        "return=minimal",
};

async function sbGet(table, params) {
  const qs = new URLSearchParams({ select: "*", ...params }).toString();
  const r  = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${qs}`, {
    headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` },
  });
  return r.ok ? r.json() : [];
}

async function sbPost(table, data) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method:  "POST",
    headers: SB_HEADERS,
    body:    JSON.stringify(data),
  });
  if (!r.ok) console.error(`[crm-ps-sync] ${table} error ${r.status}: ${await r.text()}`);
  return r.ok;
}

async function psGet(resource, params = {}) {
  const qs = new URLSearchParams({ output_format: "JSON", ...params }).toString();
  const r  = await fetch(`${PS_URL}/api/${resource}?ws_key=${PS_KEY}&${qs}`);
  if (!r.ok) { console.error(`[crm-ps-sync] PS ${resource} error ${r.status}`); return null; }
  return r.json();
}

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin":  "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers, body: "" };

  // Verificar secret (acepta GET con ?secret= o POST con body)
  let secret = event.queryStringParameters?.secret;
  if (!secret && event.httpMethod === "POST") {
    try { secret = JSON.parse(event.body || "{}").secret; } catch {}
  }
  if (secret !== CRM_SECRET) {
    return { statusCode: 401, headers, body: JSON.stringify({ ok: false, error: "Unauthorized" }) };
  }

  const log = [];

  try {
    // 1. Obtener todos los grupos de clientes de PrestaShop
    const gruposData = await psGet("groups", { display: "full" });
    if (!gruposData) throw new Error("No se pudo conectar a PrestaShop API");

    const grupos = gruposData.groups || [];
    log.push(`Grupos PS encontrados: ${grupos.length}`);

    const todosGrupos = grupos.map(g => ({ id: g.id, name: g.name?.[0]?.value || g.name }));
    log.push(`Grupos: ${JSON.stringify(todosGrupos)}`);

    // Permitir forzar group_id por query param
    const grupoIdForzado = event.queryStringParameters?.group_id;

    // Buscar grupo mayorista (por nombre) o usar el forzado
    const grupoMay = grupoIdForzado
      ? grupos.find(g => String(g.id) === String(grupoIdForzado))
      : grupos.find(g =>
          (g.name?.[0]?.value || g.name || "").toLowerCase().includes("mayor") ||
          (g.name?.[0]?.value || g.name || "").toLowerCase().includes("wholesale")
        );

    if (!grupoMay) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          ok: false,
          log,
          grupos: todosGrupos,
          error: "No se encontró grupo mayorista — usa ?group_id=X con el id correcto de la lista",
        }),
      };
    }

    const grupoId = grupoMay.id;
    log.push(`Grupo mayorista: id=${grupoId}, nombre=${grupoMay.name?.[0]?.value || grupoMay.name}`);

    // 2. Obtener clientes en ese grupo
    const clientesData = await psGet("customers", {
      display:    "[id,email,firstname,lastname,id_default_group,date_add]",
      "filter[id_default_group]": `[${grupoId}]`,
      limit:      "250",
      sort:       "date_add_DESC",
    });

    const psClientes = clientesData?.customers || [];
    log.push(`Clientes mayoristas en PS: ${psClientes.length}`);

    // 3. Sincronizar cada uno con el CRM
    let aprobados = 0;
    let noEncontrados = 0;

    for (const ps of psClientes) {
      const email = (ps.email || "").toLowerCase().trim();
      if (!email) continue;

      // Buscar en CRM por email
      const crm = await sbGet("crm_clientes", { correo: `eq.${email}` });

      if (!crm.length) {
        noEncontrados++;
        continue;
      }

      const rut = crm[0].rut;

      // Revisar si ya está aprobado en el pipeline
      const pipeline = await sbGet("crm_pipeline", {
        "cliente_rut": `eq.${rut}`,
        "etapa":       "eq.Aprobado",
        "cambiado_por":"eq.prestashop",
      });

      if (pipeline.length) continue; // ya estaba sincronizado

      // Marcar como Aprobado
      await sbPost("crm_pipeline", {
        cliente_rut:  rut,
        etapa:        "Aprobado",
        automatico:   true,
        notas:        `Aprobado como mayorista en PrestaShop. Email: ${email}`,
        cambiado_por: "prestashop",
      });

      await sbPost("crm_interacciones", {
        cliente_rut: rut,
        tipo:        "aprobacion_mayorista",
        detalle:     `Cliente aprobado como mayorista en PrestaShop WholeSale B2B`,
        automatico:  true,
        usuario:     "prestashop",
        metadata:    { ps_id: ps.id, email, nombre: `${ps.firstname} ${ps.lastname}` },
      });

      aprobados++;
      log.push(`✓ Aprobado: ${email} (rut: ${rut})`);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ok:             true,
        grupo_mayorista: grupoId,
        total_ps:        psClientes.length,
        aprobados,
        no_encontrados_en_crm: noEncontrados,
        log,
      }),
    };

  } catch (err) {
    console.error("[crm-ps-sync] Error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ ok: false, error: err.message, log }),
    };
  }
};
