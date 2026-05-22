import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useUsuario } from '../../hooks/useUsuario'
import { getTicket, aprobarTicket, rechazarTicket } from '../../lib/tickets'
import { PageHeader, Btn, Field, Textarea, SummaryCard, SummaryRow, StatusBadge, Banner, Spinner } from '../../components/UI'
import styles from './Jefe.module.css'

export function JefeDetalle() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const usuario  = useUsuario()
  const [ticket,    setTicket]    = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState('')
  const [comentario,setComentario]= useState('')

  useEffect(() => {
    getTicket(id)
      .then(setTicket)
      .catch(() => setError('No se pudo cargar el ticket.'))
      .finally(() => setLoading(false))
  }, [id])

  async function accion(tipo) {
    if (tipo === 'rechazar' && !comentario.trim()) {
      setError('Agregá un comentario al rechazar')
      return
    }
    setSaving(true)
    setError('')
    try {
      const fn = tipo === 'aprobar' ? aprobarTicket : rechazarTicket
      await fn(id, usuario.userId, usuario.nombre, comentario)
      await fetch('/api/bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ evento: tipo === 'aprobar' ? 'APROBADO' : 'RECHAZADO', ticketId: id }),
      }).catch(() => {})
      navigate('/jefe')
    } catch (e) {
      setError('Error al procesar. Intentá de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div style={{ padding: 32 }}><Spinner /></div>
  if (!ticket) return <div style={{ padding: 20 }}><Banner type="error" icon="⚠️">{error}</Banner></div>

  const isPendiente = ticket.estado === 'PENDIENTE'
  const acomps = ticket.acompanantes ?? []

  return (
    <div className={styles.page}>
      <PageHeader
        back="Solicitudes"
        onBack={() => navigate('/jefe')}
        title={ticket.id}
        subtitle={`${ticket.colaborador_nombre} · ${timeAgo(ticket.ts_solicitud)}`}
      />

      <div className={styles.content}>
        {error && <Banner type="error" icon="⚠️">{error}</Banner>}
        {!isPendiente && (
          <Banner type={ticket.estado === 'APROBADO' ? 'ok' : 'error'} icon={ticket.estado === 'APROBADO' ? '✅' : '❌'}>
            {ticket.estado === 'APROBADO' ? 'Solicitud aprobada' : `Solicitud rechazada${ticket.jefe_comentario ? ': ' + ticket.jefe_comentario : ''}`}
          </Banner>
        )}

        <p className={styles.secTitle}>Detalle de la solicitud</p>
        <SummaryCard>
          <SummaryRow label="Solicitante"     value={ticket.colaborador_nombre} />
          <SummaryRow label="Sección"         value={ticket.seccion} />
          <SummaryRow label="Vehículo"        value={ticket.vehiculo_placa} />
          <SummaryRow label="Salida estimada" value={new Date(ticket.ts_solicitud).toLocaleString('es-AR')} />
          <SummaryRow label="KM inicial"      value={`${ticket.km_inicial} km`} />
          <SummaryRow
            label="Acompañantes"
            value={acomps.length > 0 ? acomps.map(a => a.nombre).join(', ') : 'Ninguno'}
          />
        </SummaryCard>

        {isPendiente && (
          <Field label="Comentario (opcional)">
            <Textarea
              value={comentario}
              onChange={e => setComentario(e.target.value)}
              placeholder="Ej: Recordá cargar combustible antes de salir..."
              rows={3}
            />
          </Field>
        )}
      </div>

      {isPendiente && (
        <div className={styles.actions}>
          <Btn variant="danger"   onClick={() => accion('rechazar')} disabled={saving}>✕ Rechazar</Btn>
          <Btn variant="success"  onClick={() => accion('aprobar')}  disabled={saving}>✓ Aprobar</Btn>
        </div>
      )}
    </div>
  )
}

function timeAgo(ts) {
  if (!ts) return ''
  const diff = Date.now() - new Date(ts).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1)  return 'Hace un momento'
  if (min < 60) return `Hace ${min} min`
  const hs = Math.floor(min / 60)
  return `Hace ${hs}h`
}
