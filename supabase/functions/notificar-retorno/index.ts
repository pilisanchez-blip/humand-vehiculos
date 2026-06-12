import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const BOT_BASIC    = Deno.env.get('HUMAND_BOT_BASIC')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const APP_URL      = 'https://humand-vehiculos.vercel.app/'

function ulid() {
  const t = Date.now()
  const chars = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
  let result = ''
  let time = t
  for (let i = 9; i >= 0; i--) {
    result = chars[time % 32] + result
    time = Math.floor(time / 32)
  }
  for (let i = 0; i < 16; i++) {
    result += chars[Math.floor(Math.random() * 32)]
  }
  return result
}

async function abrirCanal(userId: number) {
  const res = await fetch('https://api-prod.humand.co/api/v1/marty/conversations.open', {
    method: 'POST',
    headers: {
      'Authorization':   'Basic ' + BOT_BASIC,
      'Idempotency-Key': ulid(),
      'Content-Type':    'application/json',
    },
    body: JSON.stringify({ users: [userId] }),
  })
  const data = await res.json()
  console.log('abrirCanal status:', res.status, JSON.stringify(data))
  return data.channel?.id
}

async function mandarMensaje(channelId: string, texto: string) {
  const res = await fetch('https://api-prod.humand.co/api/v1/marty/chat.postMessage', {
    method: 'POST',
    headers: {
      'Authorization':   'Basic ' + BOT_BASIC,
      'Idempotency-Key': ulid(),
      'Content-Type':    'application/json',
    },
    body: JSON.stringify({ channel: channelId, text: texto }),
  })
  const data = await res.json()
  console.log('mandarMensaje status:', res.status, JSON.stringify(data))
  return data.ok
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  try {
    const { colaboradorId, ticketId } = await req.json()
    console.log('colaboradorId:', colaboradorId, 'ticketId:', ticketId)

    const channelId = await abrirCanal(Number(colaboradorId))
    if (!channelId) throw new Error('No se pudo abrir canal con colaborador')

    const mensaje = `✅ *Tu vehículo ha retornado*\n\n*Ticket:* ${ticketId}\n\nPor favor completá los datos de retorno (km final y observaciones):\n${APP_URL}`
    await mandarMensaje(channelId, mensaje)

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  } catch (e: any) {
    console.log('ERROR:', e.message)
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})
