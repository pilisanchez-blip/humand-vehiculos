import styles from './UI.module.css'

export function Btn({ children, variant = 'primary', onClick, disabled, full }) {
  return (
    <button
      className={[styles.btn, styles[variant], full ? styles.full : ''].join(' ')}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

export function Field({ label, hint, children }) {
  return (
    <div className={styles.field}>
      {label && <label className={styles.label}>{label}</label>}
      {children}
      {hint && <span className={styles.hint}>{hint}</span>}
    </div>
  )
}

export function Input({ value, onChange, placeholder, type = 'text', readOnly, auto }) {
  return (
    <input
      className={[styles.input, auto ? styles.inputAuto : ''].join(' ')}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      readOnly={readOnly}
    />
  )
}

export function Textarea({ value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea
      className={styles.textarea}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
    />
  )
}

export function AutoBadge() {
  return <span className={styles.autoBadge}>Auto</span>
}

export function StatusBadge({ estado }) {
  const map = {
    PENDIENTE:  { label: 'Pendiente',  cls: styles.badgePending },
    APROBADO:   { label: 'Aprobado',   cls: styles.badgeOk },
    RECHAZADO:  { label: 'Rechazado',  cls: styles.badgeNo },
    EN_VIAJE:   { label: 'En viaje',   cls: styles.badgeTransit },
    CERRADO:    { label: 'Cerrado',    cls: styles.badgeClosed },
  }
  const { label, cls } = map[estado] ?? { label: estado, cls: '' }
  return <span className={[styles.badge, cls].join(' ')}>{label}</span>
}

export function Card({ children, className }) {
  return <div className={[styles.card, className].join(' ')}>{children}</div>
}

export function SummaryRow({ label, value, highlight }) {
  return (
    <div className={styles.summaryRow}>
      <span className={styles.summaryKey}>{label}</span>
      <span className={[styles.summaryVal, highlight ? styles.summaryHighlight : ''].join(' ')}>{value}</span>
    </div>
  )
}

export function SummaryCard({ children }) {
  return <div className={styles.summaryCard}>{children}</div>
}

export function Banner({ type = 'ok', icon, children }) {
  const cls = { ok: styles.bannerOk, error: styles.bannerError, warn: styles.bannerWarn, info: styles.bannerInfo }
  return (
    <div className={[styles.banner, cls[type]].join(' ')}>
      {icon && <span className={styles.bannerIcon}>{icon}</span>}
      <span>{children}</span>
    </div>
  )
}

export function Spinner() {
  return <div className={styles.spinner} />
}

export function PageHeader({ back, onBack, title, subtitle }) {
  return (
    <div className={styles.pageHeader}>
      {back && <button className={styles.backBtn} onClick={onBack}>← {back}</button>}
      <h1 className={styles.pageTitle}>{title}</h1>
      {subtitle && <p className={styles.pageSubtitle}>{subtitle}</p>}
    </div>
  )
}
