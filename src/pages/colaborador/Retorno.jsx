import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getTicket, cerrarTicket } from '../../lib/tickets'
import { Timeline } from '../../components/Timeline'
import { PageHeader, Btn, Field, Input, Textarea, SummaryCard, SummaryRow, Banner, Spinner } from '../../components/UI'
import styles from './Retorno.module.css'

export function Retorno() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [ticket, setTicket]     = useState(null)
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')
  const [cerrado, setCerrado]   = useState(false)
  const [kmFinal, setKmFinal]   = useState('')
  const [obs, setObs]           = useState('')

  useEffect(() => {
    getTicket(id)
      .then(setTicket)
      .catch(() => setError('No se pudo cargar el ticket.'))
      .finally(() => setLoading(false))
  }, [id])

  async function cerrar() {
    if (!kmFinal) { setError('Ingresá el kilometraje de retorno'); return }
    if (parseInt(kmFinal) < ticket.km_inicial) { setError('El KM de retorno no puede ser menor al inicial'); return }
    setSaving(true)
    setError('')
    try {
      const t = await cerrarTicket(id, parseInt(kmFinal), obs)
      await fetch('/api/bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ evento: 'RETORNO_COMPLETADO', ticketId: id }),
      }).catch(() => {})
      setTicket(t)
      setCerrado(true)
    } catch (e) {
      setError('Error al guardar. Intentá de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div style={{ padding: 32 }}><Spinner /></div>
  if (error && !ticket) return <div style={{ padding: 20 }}><Banner type="error" icon="⚠️">{error}</Banner></div>

  const eventos = [
    { label: 'Solicitud enviada',          timestamp: ticket.ts_solicitud,  done: true },
    { label: 'Aprobado por jefe',          timestamp: ticket.ts_aprobacion, done: !!ticket.ts_aprobacion },
    { label: 'Salida confirmada',          timestamp: ticket.ts_salida,     done: !!ticket.ts_salida },
    { label: 'Llegada confirmada por portería', timestamp: ticket.ts_llegada, done: !!ticket.ts_llegada },
    { label: cerrado ? 'Retorno completado' : 'Completando datos...', timestamp: ticket.ts_retorno, done: cerrado, active: !cerrado },
  ]

  const kmRec = cerrado && ticket.km_final ? ticket.km_final - ticket.km_inicial : null

  return (
    <div className={styles.page}>
      <PageHeader
        title="Datos de retorno"
        subtitle={`#${ticket.id} · ${ticket.vehiculo_placa}`}
      />

      <div className={styles.content}>
        {cerrado ? (
          <>
            <Banner type="ok" icon="🏁">Solicitud cerrada correctamente</Banner>
            <SummaryCard>
              <SummaryRow label="Vehículo"      value={ticket.vehiculo_placa} />
              <SummaryRow label="KM salida"     value={`${ticket.km_inicial} km`} />
              <SummaryRow label="KM retorno"    value={`${ticket.km_final} km`} />
              <SummaryRow label="KM recorridos" value={`${kmRec} km`} highlight />
              {ticket.observaciones && <SummaryRow label="Observaciones" value={ticket.observaciones} />}
            </SummaryCard>
          </>
        ) : (
          <>
            <p className={styles.secTitle}>Trazabilidad del viaje</p>
            <Timeline eventos={eventos} />

            <p className={styles.secTitle}>Datos de retorno</p>
            {error && <Banner type="error" icon="⚠️">{error}</Banner>}

            <Field label="Kilometraje de retorno" hint={kmFinal && parseInt(kmFinal) > ticket.km_inicial ? `KM recorridos: ${parseInt(kmFinal) - ticket.km_inicial} km` : ''}>
              <Input
                type="number"
                value={kmFinal}
                onChange={e => setKmFinal(e.target.value)}
                placeholder={`Más de ${ticket.km_inicial} km`}
              />
            </Field>

            <Field label="Fecha y hora de retorno">
              <Input
                value={ticket.ts_llegada ? new Date(ticket.ts_llegada).toLocaleString('es-AR') : ''}
                readOnly
                auto
              />
            </Field>

            <Field label="Observaciones (opcional)">
              <Textarea
                value={obs}
                onChange={e => setObs(e.target.value)}
                placeholder="Ej: Se detectó ruido en el motor, llanta baja..."
                rows={3}
              />
            </Field>
          </>
        )}
      </div>

      {!cerrado && (
        <div className={styles.actions}>
          <Btn variant="primary" onClick={cerrar} disabled={saving} full>
            {saving ? 'Guardando...' : 'Cerrar solicitud →'}
          </Btn>
        </div>
      )}
    </div>
  )
}
