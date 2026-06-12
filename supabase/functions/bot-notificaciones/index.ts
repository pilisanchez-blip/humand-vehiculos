import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const BOT_BASIC    = Deno.env.get('HUMAND_BOT_BASIC')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const APP_URL      = 'https://humand-vehiculos.vercel.app'

function ulid() {
  return Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 10).toUpperCase()
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
    const { evento, ticketId } = await req.json()
    console.log('evento:', evento, 'ticketId:', ticketId)

    const ticketRes = await fetch(
      SUPABASE_URL + '/rest/v1/tickets?id=eq.' + ticketId + '&select=*&limit=1',
      {
        headers: {
          'apikey':        SUPABASE_KEY,
          'Authorization': 'Bearer ' + SUPABASE_KEY,
        },
      }
    )
    const tickets = await ticketRes.json()
    const ticket = tickets[0]
    if (!ticket) throw new Error('Ticket no encontrado: ' + ticketId)
    console.log('jefe_id:', ticket.jefe_id)

    if (evento === 'SOLICITUD_ENVIADA') {
      if (!ticket.jefe_id) {
        console.log('sin jefe_id, skip')
        return new Response(JSON.stringify({ ok: true, skipped: true }), { status: 200, headers: CORS })
      }

      const jefeRes = await fetch(
        'https://api-prod.humand.co/public/api/v1/users/' + encodeURIComponent(ticket.jefe_id),
        { headers: { 'Authorization': 'Basic ' + BOT_BASIC } }
      )
      const jefeData = await jefeRes.json()
      const jefeNumericId = jefeData.id
      console.log('jefeNumericId:', jefeNumericId)
      if (!jefeNumericId) throw new Error('No se pudo resolver numeric ID del jefe')

      const channelId = await abrirCanal(jefeNumericId)
      if (!channelId) throw new Error('No se pudo abrir canal con jefe')

      const salida = new Date(ticket.ts_solicitud).toLocaleString('es-AR', {
        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
      })
      const mensaje = `🚗 *Nueva solicitud de vehículo*\n\n*Colaborador:* ${ticket.colaborador_nombre}\n*Vehículo:* ${ticket.vehiculo_placa}\n*Salida:* ${salida}\n\nIngresá para aprobar o rechazar:\n${APP_URL}/jefe`
      await mandarMensaje(channelId, mensaje)
    }

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
