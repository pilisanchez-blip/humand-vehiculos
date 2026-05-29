import { supabase } from './supabase'

// ─── VEHÍCULOS ───────────────────────────────────────────────────────────────

export async function getVehiculosPorSeccion(seccionIds) {
  const ids = Array.isArray(seccionIds) ? seccionIds : [seccionIds]
  
  const { data, error } = await supabase
    .from('vehiculo_segmentacion_map')
    .select('seccion_spreadsheet')
    .in('segmentation_item_id', ids)

  if (error) throw error
  if (!data.length) return []

  const secciones = data.map(r => r.seccion_spreadsheet)

  const { data: vehiculos, error: err2 } = await supabase
    .from('vehiculos')
    .select('placa, clase, marca, tipo, anio, km_acumulado, km_proximo_service')
    .in('seccion', secciones)
    .eq('activo', true)
    .order('placa')

  if (err2) throw err2
  return vehiculos
}

// ─── TICKETS ─────────────────────────────────────────────────────────────────

export async function crearTicket(datos) {
  const { data, error } = await supabase
    .from('tickets')
    .insert(datos)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getTicket(id) {
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function getTicketsPendientesJefe(jefeId) {
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .order('ts_solicitud', { ascending: false })
  if (error) throw error
  return data
}

export async function aprobarTicket(id, jefeId, jefeNombre, comentario = '') {
  const { data, error } = await supabase
    .from('tickets')
    .update({
      estado: 'APROBADO',
      ts_aprobacion: new Date().toISOString(),
      jefe_id: jefeId,
      jefe_nombre: jefeNombre,
      jefe_comentario: comentario,
      jefe_humand_id: jefeId,
    })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function rechazarTicket(id, jefeId, jefeNombre, comentario) {
  const { data, error } = await supabase
    .from('tickets')
    .update({
      estado: 'RECHAZADO',
      ts_aprobacion: new Date().toISOString(),
      jefe_id: jefeId,
      jefe_nombre: jefeNombre,
      jefe_comentario: comentario,
      jefe_humand_id: jefeId,
    })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function confirmarSalida(id, porteroId, porteroNombre) {
  const { data, error } = await supabase
    .from('tickets')
    .update({
      estado: 'EN_VIAJE',
      ts_salida: new Date().toISOString(),
      portero_salida_id: porteroId,
      portero_salida_nombre: porteroNombre,
    })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function confirmarLlegada(id, porteroId, porteroNombre) {
  const { data, error } = await supabase
    .from('tickets')
    .update({
      ts_llegada: new Date().toISOString(),
      portero_retorno_id: porteroId,
      portero_retorno_nombre: porteroNombre,
    })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function cerrarTicket(id, kmFinal, observaciones) {
  const { data, error } = await supabase
    .from('tickets')
    .update({
      estado: 'CERRADO',
      ts_retorno: new Date().toISOString(),
      km_final: kmFinal,
      observaciones,
    })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function buscarTicketsPorteria(codigo) {
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .ilike('id', `%${codigo}%`)
    .not('estado', 'eq', 'CERRADO')
    .order('ts_solicitud', { ascending: false })
    .limit(5)
  if (error) throw error
  return data ?? []
}
