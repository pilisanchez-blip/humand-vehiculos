import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const REDASH_URL     = Deno.env.get('REDASH_URL')     ?? ''
const REDASH_API_KEY = Deno.env.get('REDASH_API_KEY') ?? ''

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { queryId, params } = await req.json()

    const url = `${REDASH_URL}/api/queries/${queryId}/results`
    const res = await fetch(url, {
      method:  'POST',
      headers: {
        'Authorization': `Key ${REDASH_API_KEY}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({ parameters: params }),
    })

    if (!res.ok) {
      const text = await res.text()
      return new Response(
        JSON.stringify({ error: `Redash error ${res.status}: ${text}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const data = await res.json()
    const rows = data.query_result?.data?.rows ?? []

    return new Response(
      JSON.stringify({ rows }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})