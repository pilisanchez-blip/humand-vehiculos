import { useState } from 'react'
import { useUsuario } from '../../hooks/useUsuario'
import { buscarTicketsPorteria, confirmarSalida } from '../../lib/tickets'
import { PageHeader, Btn, Field, Input, SummaryCard, SummaryRow, StatusBadge, Banner, Spinner } from '../../components/UI'
import { QrScanner } from '../../components/QrScanner/QrScanner'
import styles from './Porteria.module.css'

export function PorteriaSalida() {
  const usuario = useUsuario()
  const [codigo,         setCodigo]         = useState('')
  const [resultados,     setResultados]     = useState([])
  const [ticket,         setTicket]         = useState(null)
  const [loading,        setLoading]        = useState(false)
  const [saving,         setSaving]         = useState(false)
  const [error,          setError]          = useState('')
  const [confirmado,     setConfirmado]     = useState(false)
  const [mostrarScanner, setMostrarScanner] = useState(false)

  async function buscar(codigoParam) {
    const val = (codigoParam ?? codigo).trim().toUpperCase()
    if (!val) return
    setLoading(true)
    setError('')
    setTicket(null)
    setResultados([])
    setConfirmado(false)
    try {
      const res = await buscarTicketsPorteria(val)
      setLoading(false)
      if (res.length === 0) {
        setError('No se encontró ningún ticket con ese código.')
      } else if (res.length === 1) {
        setTicket(res[0])
      } else {
        setResultados(res)
      }
    } catch (e) {
      setLoading(false)
      setError(`Error al buscar "${val}": ${e?.message ?? 'Intentá de nuevo.'}`)
    }
  }

  async function confirmar() {
    setSaving(true)
    setError('')
    try {
      await confirmarSalida(ticket.id, usuario.userId, usuario.nombre)
      setConfirmado(true)
    } catch (e) {
      setError(`Error al confirmar: ${e?.message ?? 'Intentá de nuevo.'}`)
    } finally {
      setSaving(false)
    }
  }

  function reset() {
    setCodigo('')
    setTicket(null)
    setResultados([])
    setConfirmado(false)
    setError('')
    setMostrarScanner(false)
  }

  return (
    <div className={styles.page}>
      <PageHeader title="Portería — Salida" subtitle="Verificá el formulario antes de habilitar" />
  
      <div className={styles.content}>
  
        {/* BÚSQUEDA — siempre montado, oculto cuando hay ticket o confirmado */}
        <div style={{ display: ticket || confirmado ? 'none' : 'block' }}>
          {mostrarScanner ? (
            <QrScanner
              onResult={(texto) => {
                setMostrarScanner(false)
                buscar(texto)
              }}
              onError={(err) => {
                setMostrarScanner(false)
                setError(`Error cámara: ${err?.message ?? err}`)
              }}
            />
          ) : (
            <div
              className={styles.scanArea}
              onClick={() => setMostrarScanner(true)}
              style={{ cursor: 'pointer' }}
            >
              <div className={styles.scanIcon}>📷</div>
              <p className={styles.scanText}>Tocá para escanear el QR</p>
              <p className={styles.scanSub}>O ingresá el código manualmente</p>
            </div>
          )}
  
          <div className={styles.orDiv}>o</div>
  
          <Field label="Código de ticket">
            <div className={styles.searchRow}>
              <Input
                value={codigo}
                onChange={e => setCodigo(e.target.value)}
                placeholder="Ej: VEH-2026-0001"
                onKeyDown={e => e.key === 'Enter' && buscar()}
              />
              <Btn variant="primary" onClick={() => buscar()}>Buscar</Btn>
            </div>
          </Field>
  
          {loading && <Spinner />}
          {error   && <Banner type="error" icon="⚠️">{error}</Banner>}
  
          {resultados.length > 1 && (
            <>
              <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-lighter)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10 }}>
                {resultados.length} tickets encontrados — seleccioná uno
              </p>
              {resultados.map(t => (
                <div
                  key={t.id}
                  onClick={() => { setTicket(t); setResultados([]) }}
                  className={styles.resultCard}
                >
                  <div className={styles.resultLeft}>
                    <span className={styles.resultId}>{t.id}</span>
                    <span className={styles.resultNombre}>{t.colaborador_nombre}</span>
                    <span className={styles.resultDet}>{t.vehiculo_placa} · {new Date(t.ts_solicitud).toLocaleDateString('es-AR')}</span>
                  </div>
                  <StatusBadge estado={t.estado} />
                </div>
              ))}
            </>
          )}
        </div>
  
        {/* DETALLE DEL TICKET */}
        {ticket && !confirmado && (
          <>
            <EstadoBanner estado={ticket.estado} />
            <SummaryCard>
              <SummaryRow label="Ticket"       value={ticket.id} />
              <SummaryRow label="Colaborador"  value={ticket.colaborador_nombre} />
              <SummaryRow label="Vehículo"     value={ticket.vehiculo_placa} />
              <SummaryRow label="KM salida"    value={`${ticket.km_inicial} km`} />
              <SummaryRow label="Salida est."  value={new Date(ticket.ts_solicitud).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })} />
              {(ticket.acompanantes ?? []).length > 0 && (
                <SummaryRow label="Acompañantes" value={ticket.acompanantes.map(a => a.nombre).join(', ')} />
              )}
              {ticket.jefe_comentario && (
                <SummaryRow label="Nota del jefe" value={ticket.jefe_comentario} />
              )}
            </SummaryCard>
            {error && <Banner type="error" icon="⚠️">{error}</Banner>}
            {ticket.estado !== 'APROBADO' && (
              <Banner type="warn" icon="ℹ️">
                {ticket.estado === 'PENDIENTE' ? 'La solicitud aún no fue aprobada por el jefe.' :
                 ticket.estado === 'EN_VIAJE'  ? 'Este vehículo ya está en viaje.' :
                 'Este ticket ya fue procesado.'}
              </Banner>
            )}
            <div style={{ marginTop: 8 }}>
              <Btn variant="secondary" onClick={() => setTicket(null)} full>← Volver a buscar</Btn>
            </div>
          </>
        )}
  
        {/* CONFIRMADO */}
        {confirmado && (
          <>
            <Banner type="ok" icon="✅">Salida confirmada correctamente</Banner>
            <SummaryCard>
              <SummaryRow label="Ticket"      value={ticket.id} />
              <SummaryRow label="Colaborador" value={ticket.colaborador_nombre} />
              <SummaryRow label="Vehículo"    value={ticket.vehiculo_placa} />
              <SummaryRow label="Hora salida" value={new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} />
            </SummaryCard>
          </>
        )}
      </div>
  
      <div className={styles.actions}>
        {ticket && !confirmado && ticket.estado === 'APROBADO' && (
          <Btn variant="success" onClick={confirmar} disabled={saving} full>
            {saving ? 'Confirmando...' : '✓ Confirmar salida'}
          </Btn>
        )}
        {confirmado && (
          <Btn variant="primary" onClick={reset} full>← Nuevo escaneo</Btn>
        )}
        {!ticket && !confirmado && resultados.length === 0 && <div style={{ height: 44 }} />}
      </div>
    </div>
  )
}

function EstadoBanner({ estado }) {
  if (estado === 'APROBADO')  return <Banner type="ok"    icon="✅">Solicitud APROBADA — podés habilitar la salida</Banner>
  if (estado === 'RECHAZADO') return <Banner type="error" icon="🚫">Solicitud RECHAZADA — no habilitar salida</Banner>
  if (estado === 'PENDIENTE') return <Banner type="warn"  icon="⏳">Solicitud PENDIENTE — aún no fue aprobada</Banner>
  if (estado === 'EN_VIAJE')  return <Banner type="info"  icon="🚗">Vehículo ya en viaje</Banner>
  return null
}