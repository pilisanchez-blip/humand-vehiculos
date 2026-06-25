import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Btn, Field, Input, Spinner, Banner } from '../../components/UI'
import * as XLSX from 'xlsx'
import styles from './Admin.module.css'

export function AdminReportes() {
  const [desde, setDesde]     = useState('')
  const [hasta, setHasta]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  async function descargar() {
    if (!desde || !hasta) { setError('Seleccioná rango de fechas'); return }
    setLoading(true)
    setError('')
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .gte('ts_solicitud', new Date(desde).toISOString())
        .lte('ts_solicitud', new Date(hasta + 'T23:59:59').toISOString())
        .order('ts_solicitud', { ascending: false })
      if (error) throw error

      const columnas = {
        id:                     'Ticket',
        colaborador_nombre:     'Colaborador',
        seccion:                'Sección',
        vehiculo_placa:         'Vehículo',
        km_inicial:             'KM Inicial',
        km_final:               'KM Final',
        km_recorrido:           'KM Recorrido',
        estado:                 'Estado',
        ts_solicitud:           'Fecha Solicitud',
        ts_aprobacion:          'Fecha Aprobación',
        ts_salida:              'Fecha Salida',
        ts_llegada:             'Fecha Llegada',
        ts_retorno:             'Fecha Retorno',
        jefe_nombre:            'Jefe',
        jefe_comentario:        'Comentario Jefe',
        portero_salida_nombre:  'Portería Salida',
        portero_retorno_nombre: 'Portería Retorno',
        observaciones:          'Observaciones',
      }

      const filas = data.map(r => {
        const kmRecorrido = (r.km_final != null && r.km_inicial != null)
          ? r.km_final - r.km_inicial
          : ''

        const fila = {}
        for (const [key, label] of Object.entries(columnas)) {
          if (key === 'km_recorrido') {
            fila[label] = kmRecorrido
            continue
          }
          let val = r[key] ?? ''
          if (typeof val === 'string' && val.includes('T') && val.includes('Z')) {
            val = new Date(val).toLocaleString('es-AR', {
              day: '2-digit', month: '2-digit', year: 'numeric',
              hour: '2-digit', minute: '2-digit'
            })
          }
          fila[label] = val
        }
        return fila
      })

      const ws = XLSX.utils.json_to_sheet(filas)
      ws['!cols'] = Object.values(columnas).map(h => ({ wch: Math.max(h.length + 2, 16) }))

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Reporte')
      XLSX.writeFile(wb, `reporte_vehiculos_${desde}_${hasta}.xlsx`)
    } catch (e) {
      setError('Error al generar reporte')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.form}>
      <p style={{ fontWeight: 600, margin: 0 }}>Descargar reporte de tickets</p>
      {error && <Banner type="error" icon="⚠️">{error}</Banner>}
      <div className={styles.formRow}>
        <Field label="Desde"><Input type="date" value={desde} onChange={e => setDesde(e.target.value)} /></Field>
        <Field label="Hasta"><Input type="date" value={hasta} onChange={e => setHasta(e.target.value)} /></Field>
      </div>
      {loading ? <Spinner /> : (
        <Btn onClick={descargar}>⬇ Descargar Excel</Btn>
      )}
    </div>
  )
}