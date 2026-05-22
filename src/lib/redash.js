const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const QUERY_COLABORADOR  = import.meta.env.VITE_REDASH_QUERY_COLABORADOR
const QUERY_BUSCAR       = import.meta.env.VITE_REDASH_QUERY_BUSCAR
const QUERY_SUBORDINADOS = import.meta.env.VITE_REDASH_QUERY_SUBORDINADOS

async function queryRedash(queryId, params = {}) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/redash-proxy`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'apikey':        SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ queryId, params }),
  })
  if (!res.ok) throw new Error(`Proxy error: ${res.status}`)
  const data = await res.json()
  if (data.error) throw new Error(data.error)
  return data.rows
}

export async function getColaborador(userId) {
  const rows = await queryRedash(QUERY_COLABORADOR, { user_id: parseInt(userId) })
  if (!rows[0]) return null
  return { ...rows[0], seccion_ids: rows[0].seccion_ids }
}

export async function buscarColaboradores(texto) {
  return await queryRedash(QUERY_BUSCAR, { texto })
}

export async function getSubordinados(jefeId) {
  const rows = await queryRedash(QUERY_SUBORDINADOS, { jefe_id: parseInt(jefeId) })
  return rows.map(r => String(r.subordinado_id))
}
