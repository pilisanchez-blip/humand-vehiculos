import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUsuario } from '../../hooks/useUsuario'
import { getVehiculosPorSeccion, crearTicket } from '../../lib/tickets'
import { buscarColaboradores } from '../../lib/redash'
import { Stepper } from '../../components/Stepper'
import { PageHeader, Btn, Field, Input, Textarea, SummaryCard, SummaryRow, Banner, Spinner } from '../../components/UI'
import styles from './SolicitudWizard.module.css'

export function SolicitudWizard() {
  const usuario = useUsuario()
  const navigate = useNavigate()
  const [paso, setPaso] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Datos del formulario
  const [fechaSalida, setFechaSalida] = useState('')
  const [horaSalida, setHoraSalida]   = useState('')
  const [vehiculos, setVehiculos]     = useState([])
  const [vehiculoSel, setVehiculoSel] = useState(null)
  const [kmInicial, setKmInicial]     = useState('')
  const [acompanantes, setAcompanantes] = useState([])

  // ─── Paso 0 → 1: cargar vehículos ───────────────────────────────────────
  async function irPaso1() {
    if (!fechaSalida || !horaSalida) { setError('Completá fecha y hora de salida'); return }
    setError('')
    setLoading(true)
    try {
      const data = await getVehiculosPorSeccion(usuario.seccionIds)
      setVehiculos(data)
      setPaso(1)
    } catch (e) {
      setError('Error al cargar vehículos. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  // ─── Envío final ─────────────────────────────────────────────────────────
  async function enviar() {
    setLoading(true)
    setError('')
    try {
      const ticket = await crearTicket({
        colaborador_id:     usuario.userId,
        colaborador_nombre: usuario.nombre,
        colaborador_humand_id: usuario.userId,
        seccion:            usuario.seccion,
        vehiculo_placa:     vehiculoSel.placa,
        acompanantes,
        km_inicial:         parseInt(kmInicial),
        ts_solicitud:       new Date(fechaSalida + 'T' + horaSalida).toISOString(),
      })
      // Notificar al bot (fire & forget)
      notificarBot('SOLICITUD_ENVIADA', ticket.id)
      navigate('/solicitud/enviada?id=' + ticket.id)
    } catch (e) {
      setError('Error al enviar la solicitud. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  async function notificarBot(evento, ticketId) {
    fetch('https://uasntnkbhtqkljfqfksv.supabase.co/functions/v1/bot-notificaciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ evento, ticketId }),
    }).catch(() => {})
  }

  return (
    <div className={styles.page}>
      <PageHeader title="Solicitud de vehículo" subtitle="Completá los datos del viaje" />
      <Stepper paso={paso} />

      <div className={styles.content}>
        {error && <Banner type="error" icon="⚠️">{error}</Banner>}
        {loading && <Spinner />}

        {/* ── PASO 0: MIS DATOS ── */}
        {paso === 0 && !loading && (
          <>
            <p className={styles.secTitle}>Información del solicitante</p>
            <Field label="Nombre completo">
              <Input value={usuario.nombre} readOnly auto />
            </Field>
            <Field label="Sección">
              <Input value={usuario.seccion} readOnly auto />
            </Field>
            <Field label="Fecha de salida">
              <Input type="date" value={fechaSalida} onChange={e => setFechaSalida(e.target.value)} />
            </Field>
            <Field label="Hora de salida">
              <Input type="time" value={horaSalida} onChange={e => setHoraSalida(e.target.value)} />
            </Field>
          </>
        )}

        {/* ── PASO 1: VEHÍCULO ── */}
        {paso === 1 && !loading && (
          <>
            <p className={styles.secTitle}>{vehiculos.length} vehículos disponibles</p>
            {vehiculos.length === 0 && (
              <Banner type="warn" icon="⚠️">No hay vehículos habilitados para tu sección.</Banner>
            )}
            <div className={styles.vehicleList}>
              {vehiculos.map(v => (
                <div
                  key={v.placa}
                  className={[styles.vehicleCard, vehiculoSel?.placa === v.placa ? styles.selected : ''].join(' ')}
                  onClick={() => setVehiculoSel(v)}
                >
                  <div className={styles.vehicleIcon}>🚙</div>
                  <div className={styles.vehicleInfo}>
                    <span className={styles.vehiclePlaca}>{v.placa}</span>
                    <span className={styles.vehicleDet}>{v.marca} {v.tipo} · {v.anio}</span>
                  </div>
                  <div className={[styles.check, vehiculoSel?.placa === v.placa ? styles.checkOn : ''].join(' ')}>
                    {vehiculoSel?.placa === v.placa && '✓'}
                  </div>
                </div>
              ))}
            </div>
            <Field label="Kilometraje inicial" hint="Ingresá el km del odómetro antes de salir">
              <Input
                type="number"
                value={kmInicial}
                onChange={e => setKmInicial(e.target.value)}
                placeholder="Ej: 48320"
              />
            </Field>
          </>
        )}

        {/* ── PASO 2: ACOMPAÑANTES ── */}
        {paso === 2 && !loading && (
          <AcompanantesStep acompanantes={acompanantes} setAcompanantes={setAcompanantes} />
        )}

        {/* ── PASO 3: CONFIRMAR ── */}
        {paso === 3 && !loading && (
          <>
            <p className={styles.secTitle}>Revisá los datos antes de enviar</p>
            <SummaryCard>
              <SummaryRow label="Solicitante"     value={usuario.nombre} />
              <SummaryRow label="Sección"         value={usuario.seccion} />
              <SummaryRow label="Vehículo"        value={`${vehiculoSel?.placa} · ${vehiculoSel?.marca} ${vehiculoSel?.tipo}`} />
              <SummaryRow label="Salida estimada" value={`${fechaSalida} ${horaSalida}`} />
              <SummaryRow label="KM inicial"      value={`${kmInicial} km`} />
              <SummaryRow label="Acompañantes"    value={acompanantes.length > 0 ? acompanantes.map(a => a.nombre).join(', ') : 'Ninguno'} />
            </SummaryCard>
            <Banner type="warn" icon="⚠️">
              Tu jefe recibirá una notificación para aprobar esta solicitud.
            </Banner>
          </>
        )}
      </div>

      {/* ── ACCIONES ── */}
      {!loading && (
        <div className={styles.actions}>
          {paso > 0 && (
            <Btn variant="secondary" onClick={() => setPaso(p => p - 1)}>← Atrás</Btn>
          )}
          {paso < 3 && (
            <Btn variant="primary" onClick={() => {
              if (paso === 0) irPaso1()
              else if (paso === 1 && (!vehiculoSel || !kmInicial)) setError('Seleccioná un vehículo e ingresá el KM')
              else { setError(''); setPaso(p => p + 1) }
            }}>
              Siguiente →
            </Btn>
          )}
          {paso === 3 && (
            <Btn variant="primary" onClick={enviar}>Enviar solicitud</Btn>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Sub-componente: Acompañantes ────────────────────────────────────────────
function AcompanantesStep({ acompanantes, setAcompanantes }) {
  function agregar() {
    if (acompanantes.length >= 4) return
    setAcompanantes(prev => [...prev, { tipo: 'interno', nombre: '', codigo: '' }])
  }
  function actualizar(i, campo, valor) {
    setAcompanantes(prev => prev.map((a, idx) => idx === i ? { ...a, [campo]: valor } : a))
  }
  function quitar(i) {
    setAcompanantes(prev => prev.filter((_, idx) => idx !== i))
  }

  return (
    <>
      <p style={{ fontSize: '12px', color: 'var(--text-lighter)', marginBottom: 16 }}>
        Opcional — hasta 4 personas
      </p>
      {acompanantes.map((a, i) => (
        <AcompananteCard
          key={i}
          index={i}
          data={a}
          onUpdate={(campo, val) => actualizar(i, campo, val)}
          onQuitar={() => quitar(i)}
        />
      ))}
      {acompanantes.length < 4 && (
        <button
          style={{
            width: '100%', padding: 12, border: '1.5px dashed var(--border)',
            borderRadius: 8, background: 'none', color: 'var(--brand-400)',
            fontSize: 12, fontWeight: 600, cursor: 'pointer'
          }}
          onClick={agregar}
        >
          + Agregar acompañante
        </button>
      )}
    </>
  )
}

function AcompananteCard({ index, data, onUpdate, onQuitar }) {
  const [resultados, setResultados] = useState([])
  const [buscando, setBuscando]     = useState(false)

  async function buscar(texto) {
    onUpdate('nombre', texto)
    if (data.tipo === 'externo' || texto.length < 3) { setResultados([]); return }
    setBuscando(true)
    try {
      const rows = await buscarColaboradores(texto)
      setResultados(rows)
    } catch (_) {}
    finally { setBuscando(false) }
  }

  function seleccionar(row) {
    onUpdate('nombre', row.nombre)
    onUpdate('codigo', row.codigo)
    setResultados([])
  }

  return (
    <div style={{ background: 'white', border: '1.5px solid var(--border)', borderRadius: 8, padding: '12px 14px', marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-lighter)' }}>Acompañante {index + 1}</span>
        <button onClick={onQuitar} style={{ background: 'none', border: 'none', color: 'var(--border)', fontSize: 18, cursor: 'pointer' }}>×</button>
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        {['interno', 'externo'].map(t => (
          <button
            key={t}
            onClick={() => { onUpdate('tipo', t); setResultados([]) }}
            style={{
              flex: 1, padding: '6px', borderRadius: 6, fontSize: 11, fontWeight: 600,
              border: '1.5px solid', cursor: 'pointer',
              borderColor: data.tipo === t ? 'var(--bp800)' : 'var(--border)',
              background: data.tipo === t ? 'var(--bp800)' : 'white',
              color: data.tipo === t ? 'white' : 'var(--text-lighter)',
            }}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      <Field label={data.tipo === 'interno' ? 'Buscar por nombre o código' : 'Nombre completo'}>
        <Input
          value={data.nombre}
          onChange={e => buscar(e.target.value)}
          placeholder={data.tipo === 'interno' ? 'Nombre o código...' : 'Nombre del acompañante'}
        />
      </Field>
      {buscando && <Spinner />}
      {resultados.length > 0 && (
        <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', marginTop: -8 }}>
          {resultados.map((r, i) => (
            <div
              key={i}
              onClick={() => seleccionar(r)}
              style={{
                padding: '9px 12px', fontSize: 13, cursor: 'pointer',
                borderBottom: i < resultados.length - 1 ? '1px solid var(--border)' : 'none',
              }}
            >
              {r.nombre} · {r.codigo}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
