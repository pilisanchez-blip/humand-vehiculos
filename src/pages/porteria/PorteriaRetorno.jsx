import { useState } from 'react'
import { useUsuario } from '../../hooks/useUsuario'
import { buscarTicketsPorteria, confirmarLlegada } from '../../lib/tickets'
import { PageHeader, Btn, Field, Input, SummaryCard, SummaryRow, StatusBadge, Banner, Spinner } from '../../components/UI'
import styles from './Porteria.module.css'

export function PorteriaRetorno() {
  const usuario = useUsuario()
  const [codigo,     setCodigo]     = useState('')
  const [resultados, setResultados] = useState([])
  const [ticket,     setTicket]     = useState(null)
  const [loading,    setLoading]    = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState('')
  const [confirmado, setConfirmado] = useState(false)

  async function buscar() {
    if (!codigo.trim()) return
    setLoading(true)
    setError('')
    setTicket(null)
    setResultados([])
    setConfirmado(false)
    try {
      const res = await buscarTicketsPorteria(codigo.trim().toUpperCase())
      const enViaje = res.filter(t => t.estado === 'EN_VIAJE')
      if (enViaje.length === 0) {
        setError('No se encontró ningún vehículo en viaje con ese código.')
      } else if (enViaje.length === 1) {
        setTicket(enViaje[0])
      } else {
        setResultados(enViaje)
      }
    } catch {
      setError('Error al buscar. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  async function confirmar() {
    setSaving(true)
    setError('')
    try {
      await confirmarLlegada(ticket.id, usuario.userId, usuario.nombre)
      await fetch('/api/bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ evento: 'LLEGADA_CONFIRMADA', ticketId: ticket.id }),
      }).catch(() => {})
      setConfirmado(true)
    } catch {
      setError('Error al confirmar. Intentá de nuevo.')
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
  }

  return (
    <div className={styles.page}>
      <PageHeader title="Portería — Retorno" subtitle="Confirmá la llegada del vehículo" />

      <div className={styles.content}>

        {/* BÚSQUEDA */}
        {!ticket && !confirmado && (
          <>
            <div className={styles.scanArea}>
              <div className={styles.scanIcon}>📷</div>
              <p className={styles.scanText}>Escaneá el QR del colaborador</p>
              <p className={styles.scanSub}>O ingresá el código manualmente</p>
            </div>
            <div className={styles.orDiv}>o</div>
            <Field label="Código de ticket">
              <div className={styles.searchRow}>
                <Input
                  value={codigo}
                  onChange={e => setCodigo(e.target.value)}
                  placeholder="Ej: VEH-2026-0001"
                  onKeyDown={e => e.key === 'Enter' && buscar()}
                />
                <Btn variant="primary" onClick={buscar}>Buscar</Btn>
              </div>
            </Field>
            {loading && <Spinner />}
            {error   && <Banner type="error" icon="⚠️">{error}</Banner>}

            {resultados.length > 1 && (
              <>
                <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-lighter)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10 }}>
                  {resultados.length} vehículos en viaje — seleccioná uno
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
          </>
        )}

        {/* DETALLE */}
        {ticket && !confirmado && (
          <>
            <Banner type="info" icon="🚗">Vehículo en viaje — confirmá la llegada</Banner>
            <SummaryCard>
              <SummaryRow label="Ticket"      value={ticket.id} />
              <SummaryRow label="Colaborador" value={ticket.colaborador_nombre} />
              <SummaryRow label="Vehículo"    value={ticket.vehiculo_placa} />
              <SummaryRow label="Salida"      value={new Date(ticket.ts_salida).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })} />
              <SummaryRow label="Portero"     value={usuario.nombre} />
            </SummaryCard>
            <Banner type="warn" icon="⚠️">
              Al confirmar, se notificará al colaborador para que complete los datos del retorno.
            </Banner>
            {error && <Banner type="error" icon="⚠️">{error}</Banner>}
            <div style={{ marginTop: 8 }}>
              <Btn variant="secondary" onClick={() => setTicket(null)} full>← Volver a buscar</Btn>
            </div>
          </>
        )}

        {/* CONFIRMADO */}
        {confirmado && (
          <>
            <Banner type="ok" icon="✅">Llegada confirmada. Notificación enviada al colaborador.</Banner>
            <SummaryCard>
              <SummaryRow label="Ticket"             value={ticket.id} />
              <SummaryRow label="Colaborador"        value={ticket.colaborador_nombre} />
              <SummaryRow label="Vehículo"           value={ticket.vehiculo_placa} />
              <SummaryRow label="Llegada registrada" value={new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} />
            </SummaryCard>
            <Banner type="info" icon="ℹ️">
              El colaborador debe completar los datos de retorno en su app.
            </Banner>
          </>
        )}
      </div>

      <div className={styles.actions}>
        {ticket && !confirmado && (
          <Btn variant="success" onClick={confirmar} disabled={saving} full>
            {saving ? 'Confirmando...' : '✓ Confirmar llegada'}
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
