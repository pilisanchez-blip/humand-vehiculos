import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUsuario } from '../../hooks/useUsuario'
import { supabase } from '../../lib/supabase'
import { QRCodeSVG } from 'qrcode.react'
import { PageHeader, StatusBadge, Banner, Spinner, Btn } from '../../components/UI'
import styles from './MisSolicitudes.module.css'

export function MisSolicitudes() {
  const usuario  = useUsuario()
  const navigate = useNavigate()
  const [tickets,  setTickets]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [expanded, setExpanded] = useState(null) // id del ticket con QR expandido

  useEffect(() => {
    cargar()
  }, [usuario.userId])

  async function cargar() {
    setLoading(true)
    const { data } = await supabase
      .from('tickets')
      .select('*')
      .eq('colaborador_id', usuario.userId)
      .order('ts_solicitud', { ascending: false })
      .limit(20)
    setTickets(data ?? [])
    setLoading(false)

    // Si hay un ticket activo (aprobado o pendiente), expandir el QR automáticamente
    const activo = (data ?? []).find(t => ['PENDIENTE','APROBADO','EN_VIAJE'].includes(t.estado))
    if (activo) setExpanded(activo.id)
  }

  const activos = tickets.filter(t => ['PENDIENTE','APROBADO','EN_VIAJE','COMPLETAR_DATOS'].includes(t.estado))
  const cerrados = tickets.filter(t => ['CERRADO','RECHAZADO'].includes(t.estado))

  return (
    <div className={styles.page}>
      <PageHeader
        title="Mis solicitudes"
        subtitle={`${usuario.nombre}`}
      />
      <div className={styles.content}>
        {loading && <Spinner />}

        {!loading && activos.length === 0 && cerrados.length === 0 && (
          <Banner type="info" icon="ℹ️">No tenés solicitudes todavía.</Banner>
        )}

        {activos.length > 0 && (
          <>
            <p className={styles.secTitle}>Activas</p>
            {activos.map(t => (
              <TicketCard
                key={t.id}
                ticket={t}
                expanded={expanded === t.id}
                onToggle={() => setExpanded(expanded === t.id ? null : t.id)}
                onRetorno={() => navigate(`/retorno/${t.id}${window.location.search}`)}
              />
            ))}
          </>
        )}

        {cerrados.length > 0 && (
          <>
            <p className={styles.secTitle} style={{ marginTop: 20 }}>Historial</p>
            {cerrados.map(t => (
              <TicketCard
                key={t.id}
                ticket={t}
                expanded={expanded === t.id}
                onToggle={() => setExpanded(expanded === t.id ? null : t.id)}
              />
            ))}
          </>
        )}
      </div>

      <div className={styles.actions}>
        <Btn variant="primary" full onClick={() => navigate(`/solicitud${window.location.search}`)}>
          + Nueva solicitud
        </Btn>
      </div>
    </div>
  )
}

function TicketCard({ ticket, expanded, onToggle, onRetorno }) {
  const showQR     = ['PENDIENTE','APROBADO','EN_VIAJE'].includes(ticket.estado)
  const showRetorno = ticket.estado === 'COMPLETAR_DATOS'

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader} onClick={onToggle}>
        <div className={styles.cardLeft}>
          <span className={styles.cardId}>{ticket.id}</span>
          <span className={styles.cardVehiculo}>{ticket.vehiculo_placa}</span>
          <span className={styles.cardFecha}>
            {new Date(ticket.ts_solicitud).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
          </span>
        </div>
        <div className={styles.cardRight}>
          <StatusBadge estado={ticket.estado} />
          <span className={styles.chevron}>{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {expanded && (
        <div className={styles.cardBody}>
          {showQR && (
            <div className={styles.qrWrap}>
              <p className={styles.qrTitle}>
                {ticket.estado === 'APROBADO' ? '✅ Solicitud aprobada — presentá este QR en portería' :
                 ticket.estado === 'EN_VIAJE' ? '🚗 En viaje' :
                 '⏳ Esperando aprobación del jefe'}
              </p>
              <div className={styles.qrBox}>
                <QRCodeSVG value={ticket.id} size={180} level="H" includeMargin={true} />
              </div>
              <p className={styles.qrId}>{ticket.id}</p>
            </div>
          )}

          {ticket.jefe_comentario && (
            <div className={styles.comentario}>
              <span className={styles.comentarioLabel}>Comentario del jefe:</span>
              <span>{ticket.jefe_comentario}</span>
            </div>
          )}

          {showRetorno && (
            <div style={{ marginTop: 12 }}>
              <Btn variant="primary" full onClick={onRetorno}>
                Completar datos de retorno →
              </Btn>
            </div>
          )}

          {ticket.estado === 'CERRADO' && ticket.km_recorridos && (
            <div className={styles.resumen}>
              <span>KM recorridos: <strong>{ticket.km_recorridos} km</strong></span>
              {ticket.observaciones && <span>Obs: {ticket.observaciones}</span>}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
