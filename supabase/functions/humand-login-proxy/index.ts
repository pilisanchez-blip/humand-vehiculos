import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const BOT_BASIC    = Deno.env.get('HUMAND_BOT_BASIC')!

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const { userInternalId } = await req.json()
    if (!userInternalId) {
      return new Response(JSON.stringify({ error: 'missing userInternalId' }), {
        status: 400,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    const userRes = await fetch(
      'https://api-prod.humand.co/public/api/v1/users/' + encodeURIComponent(userInternalId),
      { headers: { 'Authorization': 'Basic ' + BOT_BASIC } }
    )
    const userData = await userRes.json()

    const segmentaciones = userData.segmentations ?? []
    const GRUPOS = ['DEPARTAMENTOS', 'SECCIONES', 'GERENCIAS']

    const seccionNombres = segmentaciones
      .filter((s: any) => GRUPOS.includes(s.group))
      .map((s: any) => s.item)
      .filter(Boolean)

    const seccion =
      segmentaciones.find((s: any) => s.group === 'SECCIONES')?.item ??
      segmentaciones.find((s: any) => s.group === 'DEPARTAMENTOS')?.item ??
      segmentaciones.find((s: any) => s.group === 'GERENCIAS')?.item ??
      ''

    const jefeInternalId =
      userData.relationships?.find((r: any) => r.name === 'BOSS')?.employeeInternalId ?? null

    const nombres = seccionNombres.map((n: string) => '"' + n + '"').join(',')
    const mapRes = await fetch(
      SUPABASE_URL +
        '/rest/v1/vehiculo_segmentacion_map?select=segmentation_item_id,seccion_spreadsheet&seccion_spreadsheet=in.(' +
        encodeURIComponent(nombres) +
        ')',
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': 'Bearer ' + SUPABASE_KEY,
        },
      }
    )
    const mapData = await mapRes.json()
    const seccionIds = Array.isArray(mapData)
      ? mapData.map((r: any) => r.segmentation_item_id)
      : []

    return new Response(JSON.stringify({ seccionIds, seccion, jefeInternalId }), {
      status: 200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})