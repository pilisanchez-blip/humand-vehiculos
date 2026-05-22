import styles from './Timeline.module.css'

export function Timeline({ eventos }) {
  // eventos: [{ label, timestamp, done, active }]
  return (
    <div className={styles.timeline}>
      {eventos.map((ev, i) => (
        <div key={i} className={[
          styles.item,
          ev.done ? styles.done : ev.active ? styles.active : ''
        ].join(' ')}>
          <div className={styles.dot} />
          <div className={styles.content}>
            {ev.timestamp && <span className={styles.time}>{formatTs(ev.timestamp)}</span>}
            <span className={styles.label}>{ev.done || ev.active ? '✓ ' : ''}{ev.label}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function formatTs(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }) +
    ' — ' + d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}
