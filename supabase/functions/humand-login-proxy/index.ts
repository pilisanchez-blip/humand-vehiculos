import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  const { employeeInternalId, password } = await req.json()

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

  const token = loginData.token

  // Paso 2 — traer perfil con segmentaciones
  const meRes = await fetch('https://api-prod.humand.co/api/v1/users/me', {
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json',
    },
  })
  const meData = await meRes.json()
  console.log('meData:', JSON.stringify(meData)) 

  // Extraer seccionIds y nombre de sección
  const segmentacion = meData.segmentation ?? []
  const seccionIds = segmentacion.map((s) => s.id ?? s.itemId).filter(Boolean)
  const seccionNombres = segmentacion.map((s) => s.item ?? s.name).filter(Boolean)

  const resultado = {
    ...loginData,
    seccionIds,
    seccion: seccionNombres[0] ?? '',
  }

  return new Response(JSON.stringify(resultado), {
    status: 200,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
})
