import { useState } from 'react'
import { login, saveSession } from '../lib/humandAuth'
import { supabase } from '../lib/supabase'
import { getSubordinados } from '../lib/redash'

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

      const esAdmin = data.user.permissions?.MANAGE_USERS === true
      const subordinados = await getSubordinados(userId)
      const esJefe = subordinados.length > 0

      let rol = 'colaborador'
      if (porteria?.rol) {
        rol = 'porteria'
      } else if (esJefe) {
        rol = 'jefe'
      }

      saveSession({
        userId:     String(userId),
  nombre:     `${data.user.firstName} ${data.user.lastName}`,
  rol,
  esAdmin,
  token:      data.accessToken,
  seccionIds: data.seccionIds ?? [],
  seccion:    data.seccion ?? '',
})

      window.location.href = '/'
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'100vh' }}>
      <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:12, width:300 }}>
        <h2>Solicitud de Vehículo</h2>
        <input
          type="text"
          placeholder="Usuario (ej: juan.perez@humand.co)"
          value={employeeId}
          onChange={e => setEmployeeId(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        {error && <p style={{ color:'red', margin:0 }}>{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
    </div>
  )
}
