// Los datos del usuario llegan desde Humand como query params en la URL
// Ej: ?userId=EMP-00423&nombre=Juan%20Pérez&seccionId=212100&rol=colaborador
export function useUsuario() {
  const params = new URLSearchParams(window.location.search)
  const seccionIdsRaw = params.get('seccionIds') ?? params.get('seccionId') ?? ''
  
  // Soporta tanto un solo ID como array separado por comas
  const seccionIds = seccionIdsRaw
    .split(',')
    .map(id => parseInt(id.trim()))
    .filter(id => !isNaN(id))

  return {
    userId:    params.get('userId')  ?? '',
    nombre:    params.get('nombre')  ?? '',
    seccionIds,
    seccion:   params.get('seccion') ?? '',
    rol:       params.get('rol')     ?? 'colaborador',
  }
}
