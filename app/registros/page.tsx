'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { RegistroCalculado, Vehiculo, MarcaEstacion, EstacionServicio } from '@/lib/supabase'
import ProtectedRoute from '@/components/ProtectedRoute'

type Filtros = {
  vehiculo_id: string
  mes: string
  anio: string
  marca_estacion_id: string
  estacion_servicio_id: string
  tipo_recorrido: string
  ordenar_por: string
}

function RegistrosPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const vehiculoIdFromUrl = searchParams.get('vehiculo')
  
  const [registros, setRegistros] = useState<RegistroCalculado[]>([])
  const [registrosFiltrados, setRegistrosFiltrados] = useState<RegistroCalculado[]>([])
  const [expandidos, setExpandidos] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [mostrarFiltros, setMostrarFiltros] = useState(false)
  const [eliminando, setEliminando] = useState<number | null>(null)
  
  // Paginación
  const [paginaActual, setPaginaActual] = useState(1)
  const registrosPorPagina = 10

  // Datos para los filtros
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [marcasEstacion, setMarcasEstacion] = useState<MarcaEstacion[]>([])
  const [estaciones, setEstaciones] = useState<EstacionServicio[]>([])
  const [estacionesFiltradas, setEstacionesFiltradas] = useState<EstacionServicio[]>([])

  // Estado de filtros
  const [filtros, setFiltros] = useState<Filtros>({
    vehiculo_id: vehiculoIdFromUrl || '',
    mes: '',
    anio: '',
    marca_estacion_id: '',
    estacion_servicio_id: '',
    tipo_recorrido: '',
    ordenar_por: 'fecha_desc'
  })

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatos()
  }, [])

  // Aplicar filtro de vehículo desde URL cuando se cargan los datos
  useEffect(() => {
    if (vehiculoIdFromUrl && vehiculos.length > 0) {
      setFiltros(prev => ({ ...prev, vehiculo_id: vehiculoIdFromUrl }))
      setMostrarFiltros(true) // Mostrar filtros para que el usuario vea qué está filtrado
    }
  }, [vehiculoIdFromUrl, vehiculos])

  // Filtrar estaciones cuando cambia la marca
  useEffect(() => {
    if (filtros.marca_estacion_id) {
      const filtradas = estaciones.filter(
        e => e.marca_estacion_id === parseInt(filtros.marca_estacion_id)
      )
      setEstacionesFiltradas(filtradas)
    } else {
      setEstacionesFiltradas(estaciones)
    }
  }, [filtros.marca_estacion_id, estaciones])

  // Aplicar filtros y ordenamiento
  useEffect(() => {
    aplicarFiltros()
  }, [registros, filtros])

  async function cargarDatos() {
    try {
      setLoading(true)

      // Cargar registros desde la vista calculada
      const { data: registrosData, error: registrosError } = await supabase
        .from('vista_registros_combustible_calculados')
        .select('*')
        .order('fecha', { ascending: false })

      if (registrosError) throw registrosError
      setRegistros(registrosData || [])
      setRegistrosFiltrados(registrosData || [])

      // Cargar vehículos
      const { data: vehiculosData, error: vehiculosError } = await supabase
        .from('vehiculos')
        .select('*')
        .order('placa')

      if (vehiculosError) throw vehiculosError
      setVehiculos(vehiculosData || [])

      // Cargar marcas de estación
      const { data: marcasData, error: marcasError } = await supabase
        .from('marcas_estacion')
        .select('*')
        .order('nombre')

      if (marcasError) throw marcasError
      setMarcasEstacion(marcasData || [])

      // Cargar estaciones
      const { data: estacionesData, error: estacionesError } = await supabase
        .from('estaciones_servicio')
        .select('*')
        .order('nombre')

      if (estacionesError) throw estacionesError
      setEstaciones(estacionesData || [])
      setEstacionesFiltradas(estacionesData || [])

    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setLoading(false)
    }
  }

  function aplicarFiltros() {
    let resultados = [...registros]

    // Filtro por vehículo
    if (filtros.vehiculo_id) {
      resultados = resultados.filter(r => r.vehiculo_id === parseInt(filtros.vehiculo_id))
    }

    // Filtro por mes y año
    if (filtros.mes && filtros.anio) {
      resultados = resultados.filter(r => {
        const fecha = new Date(r.fecha)
        return fecha.getMonth() + 1 === parseInt(filtros.mes) && 
               fecha.getFullYear() === parseInt(filtros.anio)
      })
    } else if (filtros.anio) {
      resultados = resultados.filter(r => {
        const fecha = new Date(r.fecha)
        return fecha.getFullYear() === parseInt(filtros.anio)
      })
    }

    // Filtro por marca de estación
    if (filtros.marca_estacion_id) {
      resultados = resultados.filter(r => r.marca_estacion === marcasEstacion.find(m => m.id === parseInt(filtros.marca_estacion_id))?.nombre)
    }

    // Filtro por estación específica
    if (filtros.estacion_servicio_id) {
      resultados = resultados.filter(r => r.estacion === estacionesFiltradas.find(e => e.id === parseInt(filtros.estacion_servicio_id))?.nombre)
    }

    // Filtro por tipo de recorrido
    if (filtros.tipo_recorrido) {
      resultados = resultados.filter(r => r.tipo_recorrido === filtros.tipo_recorrido)
    }

    // Ordenamiento
    switch (filtros.ordenar_por) {
      case 'fecha_desc':
        resultados.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
        break
      case 'fecha_asc':
        resultados.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
        break
      case 'mejor_rendimiento':
        resultados.sort((a, b) => b.km_por_galon_real - a.km_por_galon_real)
        break
      case 'peor_rendimiento':
        resultados.sort((a, b) => a.km_por_galon_real - b.km_por_galon_real)
        break
      case 'mayor_costo':
        resultados.sort((a, b) => b.valor_recarga - a.valor_recarga)
        break
      case 'menor_costo':
        resultados.sort((a, b) => a.valor_recarga - b.valor_recarga)
        break
    }

    setRegistrosFiltrados(resultados)
  }

  function handleFiltroChange(campo: keyof Filtros, valor: string) {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor,
      // Reset estación si cambia la marca
      ...(campo === 'marca_estacion_id' ? { estacion_servicio_id: '' } : {})
    }))
  }

  function limpiarFiltros() {
    setFiltros({
      vehiculo_id: '',
      mes: '',
      anio: '',
      marca_estacion_id: '',
      estacion_servicio_id: '',
      tipo_recorrido: '',
      ordenar_por: 'fecha_desc'
    })
  }

  async function handleEliminar(id: number, fecha: string, placa: string) {
    // Confirmación con detalles del registro
    const confirmar = window.confirm(
      `¿Estás seguro de eliminar este registro?\n\n` +
      `Fecha: ${formatearFecha(fecha)}\n` +
      `Vehículo: ${placa}\n\n` +
      `Esta acción no se puede deshacer.`
    )

    if (!confirmar) return

    try {
      setEliminando(id)

      const { error } = await supabase
        .from('registros_combustible')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Actualizar la lista local sin recargar todo
      setRegistros(prev => prev.filter(r => r.id !== id))
      setRegistrosFiltrados(prev => prev.filter(r => r.id !== id))

      // Mostrar mensaje temporal (opcional)
      alert('Registro eliminado exitosamente')

    } catch (error) {
      console.error('Error al eliminar:', error)
      alert('Error al eliminar el registro. Por favor intenta de nuevo.')
    } finally {
      setEliminando(null)
    }
  }

  function toggleExpanded(id: number) {
    setExpandidos(prev => {
      const nuevo = new Set(prev)
      if (nuevo.has(id)) {
        nuevo.delete(id)
      } else {
        nuevo.add(id)
      }
      return nuevo
    })
  }

  function formatearFecha(fecha: string) {
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  function formatearNumero(numero: number, decimales: number = 1) {
    return numero.toLocaleString('es-CO', {
      minimumFractionDigits: decimales,
      maximumFractionDigits: decimales
    })
  }

  function formatearMoneda(valor: number) {
    return valor.toLocaleString('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })
  }

  // Calcular estadísticas de los registros filtrados
  const estadisticas = {
    total: registrosFiltrados.length,
    totalKmRecorridos: registrosFiltrados.reduce((sum, r) => sum + r.kilometraje_parcial, 0),
    promedioKmGalon: registrosFiltrados.length > 0
      ? registrosFiltrados.reduce((sum, r) => sum + r.km_por_galon_real, 0) / registrosFiltrados.length
      : 0,
    totalGastado: registrosFiltrados.reduce((sum, r) => sum + r.valor_recarga, 0),
    mejorRendimiento: registrosFiltrados.length > 0
      ? Math.max(...registrosFiltrados.map(r => r.km_por_galon_real))
      : 0,
    peorRendimiento: registrosFiltrados.length > 0
      ? Math.min(...registrosFiltrados.map(r => r.km_por_galon_real))
      : 0
  }

  // Paginación
  const totalPaginas = Math.ceil(registrosFiltrados.length / registrosPorPagina)
  const indiceInicio = (paginaActual - 1) * registrosPorPagina
  const indiceFin = indiceInicio + registrosPorPagina
  const registrosPaginados = registrosFiltrados.slice(indiceInicio, indiceFin)

  // Resetear a página 1 cuando cambian los filtros
  useEffect(() => {
    setPaginaActual(1)
  }, [filtros])

  const meses = [
    { value: '1', label: 'Enero' },
    { value: '2', label: 'Febrero' },
    { value: '3', label: 'Marzo' },
    { value: '4', label: 'Abril' },
    { value: '5', label: 'Mayo' },
    { value: '6', label: 'Junio' },
    { value: '7', label: 'Julio' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Septiembre' },
    { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' },
    { value: '12', label: 'Diciembre' }
  ]

  const anios = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-lg text-gray-600">Cargando registros...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Registros de Combustible</h1>
          {vehiculoIdFromUrl && (
            <p className="text-sm text-gray-600 mt-1">
              Filtrando por vehículo: <span className="font-semibold text-gray-700">
                {vehiculos.find(v => v.id === parseInt(vehiculoIdFromUrl))?.placa || 'Cargando...'}
              </span>
              {' '}
              <button
                onClick={() => window.location.href = '/registros'}
                className="text-gray-700 hover:text-blue-800 underline"
              >
                Ver todos
              </button>
            </p>
          )}
        </div>
        <button
          onClick={() => {
            const url = filtros.vehiculo_id 
              ? `/registros/nuevo?vehiculo=${filtros.vehiculo_id}`
              : '/registros/nuevo'
            window.location.href = url
          }}
          className="bg-gray-700 text-white px-4 py-2 rounded-md hover:bg-gray-800"
        >
          + Nuevo Registro
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <button
          onClick={() => setMostrarFiltros(!mostrarFiltros)}
          className="w-full px-6 py-4 flex justify-between items-center hover:bg-gray-50 transition-colors"
        >
          <span className="text-lg font-semibold text-gray-900">
            Filtros
          </span>
          <span className="text-gray-600">
            {mostrarFiltros ? '▲' : '▼'}
          </span>
        </button>

        {mostrarFiltros && (
          <div className="px-6 pb-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {/* Vehículo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vehículo
                </label>
                <select
                  value={filtros.vehiculo_id}
                  onChange={(e) => handleFiltroChange('vehiculo_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 text-gray-900 bg-white"
                >
                  <option value="">Todos los vehículos</option>
                  {vehiculos.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.placa} - {v.marca} {v.linea}
                    </option>
                  ))}
                </select>
              </div>

              {/* Año */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Año
                </label>
                <select
                  value={filtros.anio}
                  onChange={(e) => handleFiltroChange('anio', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 text-gray-900 bg-white"
                >
                  <option value="">Todos</option>
                  {anios.map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>

              {/* Mes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mes
                </label>
                <select
                  value={filtros.mes}
                  onChange={(e) => handleFiltroChange('mes', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 text-gray-900 bg-white"
                >
                  <option value="">Todos</option>
                  {meses.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              {/* Marca Estación */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Marca de Estación
                </label>
                <select
                  value={filtros.marca_estacion_id}
                  onChange={(e) => handleFiltroChange('marca_estacion_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 text-gray-900 bg-white"
                >
                  <option value="">Todas las marcas</option>
                  {marcasEstacion.map(m => (
                    <option key={m.id} value={m.id}>{m.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Estación */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estación de Servicio
                </label>
                <select
                  value={filtros.estacion_servicio_id}
                  onChange={(e) => handleFiltroChange('estacion_servicio_id', e.target.value)}
                  disabled={!filtros.marca_estacion_id && estacionesFiltradas.length === estaciones.length}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:bg-gray-100"
                >
                  <option value="">Todas las estaciones</option>
                  {estacionesFiltradas.map(e => (
                    <option key={e.id} value={e.id}>{e.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Tipo de Recorrido */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Recorrido
                </label>
                <select
                  value={filtros.tipo_recorrido}
                  onChange={(e) => handleFiltroChange('tipo_recorrido', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 text-gray-900 bg-white"
                >
                  <option value="">Todos</option>
                  <option value="Urbano">Urbano</option>
                  <option value="Carretera">Carretera</option>
                  <option value="Mixto">Mixto</option>
                </select>
              </div>

              {/* Ordenar por */}
              <div className="md:col-span-2 lg:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ordenar por
                </label>
                <select
                  value={filtros.ordenar_por}
                  onChange={(e) => handleFiltroChange('ordenar_por', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 text-gray-900 bg-white"
                >
                  <option value="fecha_desc">Fecha (más reciente primero)</option>
                  <option value="fecha_asc">Fecha (más antigua primero)</option>
                  <option value="mejor_rendimiento">Mejor rendimiento</option>
                  <option value="peor_rendimiento">Peor rendimiento</option>
                  <option value="mayor_costo">Mayor costo</option>
                  <option value="menor_costo">Menor costo</option>
                </select>
              </div>
            </div>

            <div className="flex gap-4 mt-4">
              <button
                onClick={limpiarFiltros}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Estadísticas */}
      {registrosFiltrados.length > 0 && (
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-6 border border-gray-300">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Estadísticas {registrosFiltrados.length !== registros.length && '(Filtradas)'}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div>
              <div className="text-sm text-gray-600">KM Recorridos</div>
              <div className="text-2xl font-bold text-gray-900">
                {formatearNumero(estadisticas.totalKmRecorridos, 0)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Promedio km/gal</div>
              <div className="text-2xl font-bold text-gray-900">
                {formatearNumero(estadisticas.promedioKmGalon)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Total gastado</div>
              <div className="text-2xl font-bold text-gray-900">
                {formatearMoneda(estadisticas.totalGastado)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Mejor carga</div>
              <div className="text-2xl font-bold text-gray-900">
                {formatearNumero(estadisticas.mejorRendimiento)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Peor carga</div>
              <div className="text-2xl font-bold text-gray-900">
                {formatearNumero(estadisticas.peorRendimiento)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Total registros</div>
              <div className="text-2xl font-bold text-gray-900">{estadisticas.total}</div>
            </div>
          </div>
        </div>
      )}

      {/* Tarjetas de Registros */}
      {registrosFiltrados.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No hay registros
          </h3>
          <p className="text-gray-600 mb-6">
            {registros.length === 0
              ? 'Aún no has registrado ninguna carga de combustible.'
              : 'No hay registros que coincidan con los filtros seleccionados.'}
          </p>
          {registros.length === 0 && (
            <button
              onClick={() => window.location.href = '/registros/nuevo'}
              className="bg-gray-700 text-white px-6 py-3 rounded-md hover:bg-gray-800"
            >
              Crear primer registro
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {registrosPaginados.map(registro => {
            const isExpanded = expandidos.has(registro.id)
            const variacionColor = registro.variacion_porcentaje > 0 ? 'text-green-600' :
                                  registro.variacion_porcentaje < 0 ? 'text-red-600' : 'text-gray-600'

            return (
              <div
                key={registro.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Header - Siempre visible */}
                <div
                  onClick={() => toggleExpanded(registro.id)}
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      {/* Línea 1: Fecha, Vehículo y KM Total */}
                      <div className="flex items-center gap-3 mb-3">
                        <span className="font-semibold text-gray-900">
                          {formatearFecha(registro.fecha)}
                        </span>
                        <span className="text-gray-400">•</span>
                        <span className="font-semibold text-gray-700">
                          {registro.placa}
                        </span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          {registro.tipo_recorrido}
                        </span>
                        <span className="text-gray-400">•</span>
                        <span className="text-xs text-gray-500">
                          Odómetro: {formatearNumero(registro.kilometraje_total, 0)} km
                        </span>
                      </div>
                      
                      {/* Línea 2: Métricas principales */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-2">
                        <div>
                          <div className="text-gray-500 text-xs">Distancia</div>
                          <div className="font-semibold text-gray-900">
                            {formatearNumero(registro.kilometraje_parcial, 0)} km
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500 text-xs">Galones</div>
                          <div className="font-semibold text-gray-900">
                            {formatearNumero(registro.galones_recargados)} gal
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500 text-xs">Rendimiento</div>
                          <div className="font-semibold text-gray-900">
                            {formatearNumero(registro.km_por_galon_real)} km/gal
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500 text-xs">Valor</div>
                          <div className="font-semibold text-gray-900">
                            {formatearMoneda(registro.valor_recarga)}
                          </div>
                        </div>
                      </div>
                      
                      {/* Línea 3: Estación */}
                      <div className="text-sm text-gray-500">
                        {registro.estacion} • {registro.marca_estacion}
                      </div>
                    </div>
                    
                    {/* Botón expandir */}
                    <button className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0">
                      {isExpanded ? '▲' : '▼'}
                    </button>
                  </div>
                </div>

                {/* Detalles expandidos */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-gray-200 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                      {/* Costos */}
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <h4 className="font-semibold text-gray-900 mb-3">
                          Costos
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Valor recarga:</span>
                            <span className="font-semibold">{formatearMoneda(registro.valor_recarga)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Costo por galón:</span>
                            <span className="font-semibold">{formatearMoneda(registro.costo_por_galon)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Costo por km:</span>
                            <span className="font-semibold">{formatearMoneda(registro.costo_por_km)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Rendimiento */}
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <h4 className="font-semibold text-gray-900 mb-3">
                          Rendimiento
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Km/galón real:</span>
                            <span className="font-semibold">{formatearNumero(registro.km_por_galon_real)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Km/galón compu:</span>
                            <span className="font-semibold">{formatearNumero(registro.km_por_galon_computadora)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Variación:</span>
                            <span className={`font-semibold ${variacionColor}`}>
                              {formatearNumero(registro.variacion_porcentaje)}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Detalles adicionales */}
                      <div className="bg-white rounded-lg p-4 shadow-sm md:col-span-2">
                        <h4 className="font-semibold text-gray-900 mb-3">
                          Detalles adicionales
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <div className="text-gray-600 text-xs mb-1">Kilometraje total</div>
                            <div className="font-semibold">{formatearNumero(registro.kilometraje_total, 0)} km</div>
                          </div>
                          <div>
                            <div className="text-gray-600 text-xs mb-1">Galones recargados</div>
                            <div className="font-semibold">{formatearNumero(registro.galones_recargados)} gal</div>
                          </div>
                          <div>
                            <div className="text-gray-600 text-xs mb-1">Tipo de recorrido</div>
                            <div className="font-semibold">{registro.tipo_recorrido}</div>
                          </div>
                        </div>
                      </div>

                      {/* Notas / Comentarios */}
                      {registro.notas && (
                        <div className="bg-gray-50 rounded-lg p-4 shadow-sm md:col-span-2 border border-gray-200">
                          <h4 className="font-semibold text-gray-900 mb-2 text-sm">
                            Notas
                          </h4>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">
                            {registro.notas}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Botones de Editar y Eliminar */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex flex-col md:flex-row gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/registros/editar/${registro.id}`)
                          }}
                          className="flex-1 md:flex-initial px-6 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEliminar(registro.id, registro.fecha, registro.placa)
                          }}
                          disabled={eliminando === registro.id}
                          className="flex-1 md:flex-initial px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                          {eliminando === registro.id ? 'Eliminando...' : 'Eliminar'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
          <div className="text-sm text-gray-600">
            Página {paginaActual} de {totalPaginas} • {registrosFiltrados.length} registros
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPaginaActual(prev => Math.max(1, prev - 1))}
              disabled={paginaActual === 1}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Anterior
            </button>
            
            {/* Números de página */}
            <div className="hidden sm:flex gap-1">
              {[...Array(totalPaginas)].map((_, i) => {
                const numeroPagina = i + 1
                // Mostrar solo algunas páginas para no saturar
                if (
                  numeroPagina === 1 ||
                  numeroPagina === totalPaginas ||
                  (numeroPagina >= paginaActual - 1 && numeroPagina <= paginaActual + 1)
                ) {
                  return (
                    <button
                      key={numeroPagina}
                      onClick={() => setPaginaActual(numeroPagina)}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        paginaActual === numeroPagina
                          ? 'bg-gray-700 text-white'
                          : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {numeroPagina}
                    </button>
                  )
                } else if (
                  numeroPagina === paginaActual - 2 ||
                  numeroPagina === paginaActual + 2
                ) {
                  return <span key={numeroPagina} className="px-2 py-2 text-gray-400">...</span>
                }
                return null
              })}
            </div>

            <button
              onClick={() => setPaginaActual(prev => Math.min(totalPaginas, prev + 1))}
              disabled={paginaActual === totalPaginas}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function RegistrosPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-lg text-gray-600">Cargando registros...</div>
        </div>
      }>
        <RegistrosPageContent />
      </Suspense>
    </ProtectedRoute>
  )
}