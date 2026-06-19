const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const SESSION_KEY       = 'humand_session'

export async function login(employeeInternalId, password) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/humand-login-proxy`, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'apikey':        SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ employeeInternalId, password }),
  })
  if (!res.ok) throw new Error('Credenciales incorrectas')
  return res.json()
}

export async function refreshSession() {
  const session = getSession()
  if (!session?.userId) return

  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/humand-refresh-session`, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey':        SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ userInternalId: session.userId }),
    })
    if (!res.ok) return
    const data = await res.json()
    saveSession({ ...session, ...data })
  } catch (e) {
    console.error('refresh error:', e)
  }
}

export function saveSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function getSession() {
  const raw = localStorage.getItem(SESSION_KEY)
  return raw ? JSON.parse(raw) : null
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
}