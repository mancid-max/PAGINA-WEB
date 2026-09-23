/* Qué versión está publicada ahora mismo.

   Netlify define COMMIT_REF y BRANCH al construir el sitio, así que esta función dice exactamente qué
   commit está sirviendo. Sirve para saber si un cambio ya subió o si el deploy todavía va en camino,
   sin tener que entrar al panel de Netlify.

   GET /.netlify/functions/version  →  { commit, commit_corto, rama, deploy_id, contexto }
   Se compara con el commit local usando: node estado.js */
exports.handler = async () => {
  const commit = (process.env.COMMIT_REF || "").trim();
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
    body: JSON.stringify({
      commit: commit || null,
      commit_corto: commit ? commit.slice(0, 7) : null,
      rama: process.env.BRANCH || null,
      deploy_id: process.env.DEPLOY_ID || null,
      contexto: process.env.CONTEXT || null,
      url_deploy: process.env.DEPLOY_URL || null,
    }),
  };
};
