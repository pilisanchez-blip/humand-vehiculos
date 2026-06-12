import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const BOT_TOKEN    = Deno.env.get('HUMAND_BOT_TOKEN')!

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const { employeeInternalId, password } = await req.json()
    console.log('login intento:', employeeInternalId)

    // Paso 1 — login
    const loginRes = await fetch('https://api-prod.humand.co/api/v1/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeInternalId, instanceId: 7723, password }),
    })
    const loginData = await loginRes.json()
    if (!loginRes.ok) {
      return new Response(JSON.stringify(loginData), {
        status: loginRes.status,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    console.log('login ok')

    // Paso 2 — traer segmentaciones con bot token
    const userRes = await fetch('https://api-prod.humand.co/api/v1/users/' + employeeInternalId, {
      headers: { 'Authorization': 'Basic ' + BOT_TOKEN },
    })
    const userData = await userRes.json()
    const segmentaciones = userData.segmentations ?? []
    console.log('segmentaciones:', JSON.stringify(segmentaciones))

    const seccionNombres = segmentaciones.map((s) => s.item).filter(Boolean)
    const seccion = seccionNombres[0] ?? ''

    // Paso 3 — buscar seccionIds en Supabase
    const nombres = seccionNombres.map((n) => '"' + n + '"').join(',')
    const mapRes = await fetch(
      SUPABASE_URL + '/rest/v1/vehiculo_segmentacion_map?select=segmentation_item_id,seccion_spreadsheet&seccion_spreadsheet=in.(' + encodeURIComponent(nombres) + ')',
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': 'Bearer ' + SUPABASE_KEY,
        },
      }
    )
    const mapData = await mapRes.json()
    console.log('mapData:', JSON.stringify(mapData))

    const seccionIds = Array.isArray(mapData) ? mapData.map((r) => r.segmentation_item_id) : []

    return new Response(JSON.stringify({ ...loginData, seccionIds, seccion }), {
      status: 200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })

  } catch (e) {
    console.log('ERROR:', e.message)
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})
