import styles from './Stepper.module.css'

const PASOS = ['Mis datos', 'Vehículo', 'Acomp.', 'Confirmar']

export function Stepper({ paso }) {
  return (
    <div className={styles.wrap}>
      <div className={styles.steps}>
        {PASOS.map((label, i) => (
          <div key={i} className={styles.stepGroup}>
            <div className={[
              styles.dot,
              i < paso ? styles.done : i === paso ? styles.active : styles.pending
            ].join(' ')}>
              {i < paso ? '✓' : i + 1}
            </div>
            {i < PASOS.length - 1 && (
              <div className={[styles.line, i < paso ? styles.lineDone : styles.linePending].join(' ')} />
            )}
          </div>
        ))}
      </div>
      <div className={styles.labels}>
        {PASOS.map((label, i) => (
          <span key={i} className={[styles.label, i === paso ? styles.labelActive : ''].join(' ')}>
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}
