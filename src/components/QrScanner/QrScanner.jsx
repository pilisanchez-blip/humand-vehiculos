import { useEffect, useRef } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import styles from './QrScanner.module.css'

export function QrScanner({ onResult, onError }) {
  const scannerRef  = useRef(null)
  const onResultRef = useRef(onResult)
  const onErrorRef  = useRef(onError)
  const containerId = 'qr-reader'

  // Mantener refs actualizadas sin reiniciar el scanner
  useEffect(() => { onResultRef.current = onResult }, [onResult])
  useEffect(() => { onErrorRef.current  = onError  }, [onError])

  useEffect(() => {
    const scanner = new Html5Qrcode(containerId)
    scannerRef.current = scanner

    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 220, height: 220 } },
      (decodedText) => {
        alert('QR leído: ' + decodedText) 
        onResultRef.current?.(decodedText)
        scanner.stop().catch(() => {})
      },
      () => {}
    ).catch((err) => {
      onErrorRef.current?.(err)
    })

    return () => {
      scanner.stop().catch(() => {})
    }
  }, [])

  return (
    <div className={styles.wrapper}>
      <div id={containerId} className={styles.reader} />
      <p className={styles.hint}>Apuntá la cámara al QR del ticket</p>
    </div>
  )
}