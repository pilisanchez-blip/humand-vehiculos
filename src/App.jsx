import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './styles/globals.css'

// Colaborador
import { MisSolicitudes }  from './pages/colaborador/MisSolicitudes'
import { SolicitudWizard } from './pages/colaborador/SolicitudWizard'
import { SolicitudEnviada } from './pages/colaborador/SolicitudEnviada'
import { Retorno }         from './pages/colaborador/Retorno'

// Jefe
import { JefeLista }   from './pages/jefe/JefeLista'
import { JefeDetalle } from './pages/jefe/JefeDetalle'

// Portería
import { PorteriaSalida }  from './pages/porteria/PorteriaSalida'
import { PorteriaRetorno } from './pages/porteria/PorteriaRetorno'

export default function App() {
  const params = new URLSearchParams(window.location.search)
  const rol = params.get('rol') ?? 'colaborador'

  return (
    <BrowserRouter>
      <Routes>
        {/* Colaborador */}
        <Route path="/mis-solicitudes" element={<MisSolicitudes />} />
        <Route path="/solicitud"       element={<SolicitudWizard />} />
        <Route path="/solicitud/enviada" element={<SolicitudEnviada />} />
        <Route path="/retorno/:id"     element={<Retorno />} />

        {/* Jefe */}
        <Route path="/jefe"    element={<JefeLista />} />
        <Route path="/jefe/:id" element={<JefeDetalle />} />

        {/* Portería */}
        <Route path="/porteria/salida"  element={<PorteriaSalida />} />
        <Route path="/porteria/retorno" element={<PorteriaRetorno />} />

        {/* Redirect raíz según rol */}
        <Route path="/" element={
          rol === 'jefe'             ? <Navigate to={`/jefe${window.location.search}`} /> :
          rol === 'porteria_salida'  ? <Navigate to={`/porteria/salida${window.location.search}`} /> :
          rol === 'porteria_retorno' ? <Navigate to={`/porteria/retorno${window.location.search}`} /> :
                                      <Navigate to={`/mis-solicitudes${window.location.search}`} />
        } />
      </Routes>
    </BrowserRouter>
  )
}
