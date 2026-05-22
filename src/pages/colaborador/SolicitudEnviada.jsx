import { QRCodeSVG } from 'qrcode.react'
import { PageHeader, Banner, SummaryCard, SummaryRow } from '../../components/UI'
import styles from './SolicitudEnviada.module.css'

export function SolicitudEnviada() {
  const params = new URLSearchParams(window.location.search)
  const id = params.get('id')

  return (
    <div className={styles.page}>
      <PageHeader title="Solicitud enviada" subtitle="Tu jefe recibirá una notificación" />
      <div className={styles.content}>
        <Banner type="ok" icon="✅">Solicitud enviada correctamente</Banner>

        <SummaryCard>
          <SummaryRow label="Número de solicitud" value={id} highlight />
          <SummaryRow label="Estado" value="Pendiente de aprobación" />
        </SummaryCard>

        <div className={styles.qrWrap}>
          <p className={styles.qrTitle}>Tu código QR</p>
          <p className={styles.qrSub}>Presentalo en portería al salir y al regresar</p>
          <div className={styles.qrBox}>
            <QRCodeSVG
              value={id}
              size={200}
              level="H"
              includeMargin={true}
            />
          </div>
          <p className={styles.qrId}>{id}</p>
        </div>

        <p className={styles.note}>
          Recibirás una notificación cuando tu jefe apruebe o rechace la solicitud.
        </p>
      </div>
    </div>
  )
}
