import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUsuario } from '../../hooks/useUsuario'
import { getSubordinados } from '../../lib/redash'
import { supabase } from '../../lib/supabase'
import { PageHeader, StatusBadge, Spinner, Banner } from '../../components/UI'
import styles from './Jefe.module.css'

export function JefeLista() {
  const usuario  = useUsuario()
  const navigate = useNavigate()
  const [tickets,  setTickets]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')

  useEffect(() => {
    cargar()
  }, [usuario.userId])

  async function cargar() {
    setLoading(true)
    try {
      // Traer IDs de subordinados desde Redash
      const subordinadoIds = await getSubordinados(usuario.userId)

      if (subordinadoIds.length === 0) {
        setTickets([])
        setLoading(false)
        return
      }

      // Traer tickets de esos colaboradores
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .in('colaborador_id', subordinadoIds)
        .order('ts_solicitud', { ascending: false })

      if (error) throw error
      setTickets(data ?? [])
    } catch (e) {
      setError('Error al cargar solicitudes.')
    } finally {
      setLoading(false)
    }
  }

  const pendientes = tickets.filter(t => t.estado === 'PENDIENTE')
  const resto      = tickets.filter(t => t.estado !== 'PENDIENTE')

  return (
    <div className={styles.page}>
      <PageHeader
        title="Solicitudes de vehículo"
        subtitle={`${pendientes.length} pendiente${pendientes.length !== 1 ? 's' : ''} de aprobación`}
      />
      <div className={styles.content}>
        {loading && <Spinner />}
        {error   && <Banner type="error" icon="⚠️">{error}</Banner>}

        {!loading && tickets.length === 0 && (
          <p className={styles.empty}>No hay solicitudes de tus colaboradores.</p>
        )}

        {pendientes.length > 0 && (
          <>
            <p className={styles.secTitle}>Pendientes</p>
            {pendientes.map(t => (
              <TicketRow key={t.id} ticket={t} onClick={() => navigate(`/jefe/${t.id}${window.location.search}`)} />
            ))}
          </>
        )}

        {resto.length > 0 && (
          <>
            <p className={styles.secTitle} style={{ marginTop: 20 }}>Historial</p>
            {resto.map(t => (
              <TicketRow key={t.id} ticket={t} onClick={() => navigate(`/jefe/${t.id}${window.location.search}`)} />
            ))}
          </>
        )}
      </div>
    </div>
  )
}

function TicketRow({ ticket, onClick }) {
  return (
    <div className={styles.ticketCard} onClick={onClick}>
      <div className={styles.ticketHeader}>
        <div>
          <span className={styles.ticketId}>{ticket.id}</span>
          <span className={styles.ticketNombre}>{ticket.colaborador_nombre}</span>
        </div>
        <StatusBadge estado={ticket.estado} />
      </div>
      <div className={styles.ticketBody}>
        <div className={styles.ticketRow}>
          <span>Vehículo</span><strong>{ticket.vehiculo_placa}</strong>
        </div>
        <div className={styles.ticketRow}>
          <span>Solicitado</span>
          <strong>{new Date(ticket.ts_solicitud).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</strong>
        </div>
      </div>
    </div>
  )
}
