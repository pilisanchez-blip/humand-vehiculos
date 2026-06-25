import { useState } from 'react'
import { login, saveSession } from '../lib/humandAuth'
import { supabase } from '../lib/supabase'
import { getSubordinados } from '../lib/redash'

const AZUL        = '#5b6ef5'
const AZUL_HOVER  = '#4a5de0'
const TEXTO       = '#303036'
const TEXTO_SEC   = '#636271'
const BORDE       = '#e0e0e8'
const BG          = '#f5f6f8'

export default function Login() {
  const [employeeId, setEmployeeId] = useState('')
  const [password, setPassword]     = useState('')
  const [error, setError]           = useState(null)
  const [loading, setLoading]       = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const data   = await login(employeeId, password)
      const userId = data.user.id

      const { data: porteria } = await supabase
        .from('usuarios_porteria')
        .select('rol')
        .eq('user_id', userId)
        .eq('activo', true)
        .maybeSingle()

      const esAdmin      = data.user.permissions?.MANAGE_USERS === true
      const subordinados = await getSubordinados(userId)
      const esJefe       = subordinados.length > 0

      let rol = 'colaborador'
      if (porteria?.rol)  rol = 'porteria'
      else if (esJefe)    rol = 'jefe'

      const jefeInternalId = data.jefeInternalId ?? null

      saveSession({
        userId:         String(userId),
        nombre:         `${data.user.firstName} ${data.user.lastName}`,
        rol,
        esAdmin,
        token:          data.accessToken,
        seccionIds:     data.seccionIds ?? [],
        seccion:        data.seccion ?? '',
        jefeInternalId,
      })

      window.location.href = '/'
    } catch (err) {
      setError('Usuario o contraseña incorrectos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#fff',
      display: 'flex',
      flexDirection: 'column',
      padding: '32px 24px',
      fontFamily: 'Roboto, sans-serif',
      letterSpacing: '0.2px',
    }}>

      {/* Logo */}
      <div style={{ marginBottom: 64 }}>
        <svg width="120" height="28" viewBox="0 0 120 28" fill="none" xmlns="http://www.w3.org/2000/svg">
          <text x="0" y="22" fontFamily="Roboto, sans-serif" fontSize="22" fontWeight="400" fill="#213478" letterSpacing="2">humand</text>
        </svg>
      </div>

      {/* Contenido */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', maxWidth: 480 }}>
        <h1 style={{
          fontSize: 32,
          fontWeight: 600,
          color: TEXTO,
          lineHeight: 1.3,
          margin: '0 0 40px',
          letterSpacing: '0.2px',
        }}>
          Inicia sesión en<br />tu comunidad
        </h1>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 14, fontWeight: 600, color: TEXTO }}>Usuario</label>
            <input
              type="text"
              value={employeeId}
              onChange={e => setEmployeeId(e.target.value)}
              required
              style={{
                padding: '14px 16px',
                border: `1.5px solid ${error ? '#ef4444' : BORDE}`,
                borderRadius: 8,
                fontSize: 16,
                fontFamily: 'Roboto, sans-serif',
                color: TEXTO,
                outline: 'none',
                background: '#fff',
                letterSpacing: '0.2px',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 14, fontWeight: 600, color: TEXTO }}>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{
                padding: '14px 16px',
                border: `1.5px solid ${error ? '#ef4444' : BORDE}`,
                borderRadius: 8,
                fontSize: 16,
                fontFamily: 'Roboto, sans-serif',
                color: TEXTO,
                outline: 'none',
                background: '#fff',
                letterSpacing: '0.2px',
              }}
            />
          </div>

          {error && (
            <p style={{ margin: 0, fontSize: 14, color: '#ef4444', letterSpacing: '0.2px' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 8,
              padding: '16px',
              background: loading ? '#a0aaf8' : AZUL,
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 16,
              fontWeight: 600,
              fontFamily: 'Roboto, sans-serif',
              cursor: loading ? 'not-allowed' : 'pointer',
              letterSpacing: '0.2px',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => { if (!loading) e.target.style.background = AZUL_HOVER }}
            onMouseLeave={e => { if (!loading) e.target.style.background = AZUL }}
          >
            {loading ? 'Ingresando...' : 'Continuar'}
          </button>
        </form>
      </div>
    </div>
  )
}
