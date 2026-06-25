import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import './styles/globals.css'
import { getSession, refreshSession, clearSession } from './lib/humandAuth'
import Login from './pages/Login'
import { MisSolicitudes }  from './pages/colaborador/MisSolicitudes'
import { SolicitudWizard } from './pages/colaborador/SolicitudWizard'
import { SolicitudEnviada } from './pages/colaborador/SolicitudEnviada'
import { Retorno }         from './pages/colaborador/Retorno'
import { JefeLista }   from './pages/jefe/JefeLista'
import { JefeDetalle } from './pages/jefe/JefeDetalle'
import { PorteriaSalida }  from './pages/porteria/PorteriaSalida'
import { PorteriaRetorno } from './pages/porteria/PorteriaRetorno'
import { Admin } from './pages/admin/Admin'

function FloatingButtons() {
  const session  = getSession()
  const location = useLocation()
  if (!session) return null
  if (location.pathname === '/login') return null

  const esAdmin = session.esAdmin && !location.pathname.startsWith('/admin')
  const navigate = useNavigate()

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 999,
      display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end',
    }}>
      {esAdmin && (
        <button
          onClick={() => navigate('/admin')}
          style={{
            background: 'var(--bp800)', color: 'white',
            border: 'none', borderRadius: 999,
            padding: '10px 18px', fontSize: 13, fontWeight: 600,
            boxShadow: 'var(--shadow-8dp)', cursor: 'pointer',
          }}
        >
          ⚙️ Admin
        </button>
      )}
      <button
        onClick={() => { clearSession(); window.location.href = '/login' }}
        style={{
          background: 'white', color: '#636271',
          border: '1.5px solid #e0e0e8', borderRadius: 999,
          padding: '10px 18px', fontSize: 13, fontWeight: 600,
          boxShadow: 'var(--shadow-8dp)', cursor: 'pointer',
        }}
      >
        Cerrar sesión
      </button>
    </div>
  )
}

function Guard({ children }) {
  const session = getSession()
  if (!session) return <Navigate to="/login" replace />
  return children
}

function RootRedirect() {
  const session = getSession()
  if (!session) return <Navigate to="/login" replace />
  const { rol } = session
  if (rol === 'jefe')     return <Navigate to="/jefe" replace />
  if (rol === 'porteria') return <Navigate to="/porteria/salida" replace />
  return <Navigate to="/mis-solicitudes" replace />
}

export default function App() {
  const [refreshed, setRefreshed] = useState(false)

  useEffect(() => {
    refreshSession().then(() => setRefreshed(true))
  }, [])

  if (!refreshed && getSession()) return null

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"             element={<Login />} />
        <Route path="/"                  element={<RootRedirect />} />
        <Route path="/mis-solicitudes"   element={<Guard><MisSolicitudes /></Guard>} />
        <Route path="/solicitud"         element={<Guard><SolicitudWizard /></Guard>} />
        <Route path="/solicitud/enviada" element={<Guard><SolicitudEnviada /></Guard>} />
        <Route path="/retorno/:id"       element={<Guard><Retorno /></Guard>} />
        <Route path="/jefe"              element={<Guard><JefeLista /></Guard>} />
        <Route path="/jefe/:id"          element={<Guard><JefeDetalle /></Guard>} />
        <Route path="/porteria/salida"   element={<Guard><PorteriaSalida /></Guard>} />
        <Route path="/porteria/retorno"  element={<Guard><PorteriaRetorno /></Guard>} />
        <Route path="/admin"             element={<Guard><Admin /></Guard>} />
      </Routes>
      <FloatingButtons />
    </BrowserRouter>
  )
}