'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Vehiculo } from '@/lib/supabase'
import ProtectedRoute from '@/components/ProtectedRoute'

type EstadisticasVehiculo = {
  vehiculo: Vehiculo
  totalRegistros: number
  urbano: { promedio: number, registros: number }
  carretera: { promedio: number, registros: number }
  mixto: { promedio: number, registros: number }
  promedioGeneral: number
  totalGastado: number
  costoPorKm: number
}

function VehiculosPageContent() {
  const [vehiculos, setVehiculos] = useState<EstadisticasVehiculo[]>([])
  const [expandidos, setExpandidos] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [eliminando, setEliminando] = useState<number | null>(null)
  const [cambiandoEstado, setCambiandoEstado] = useState<number | null>(null)

  useEffect(() => {
    cargarVehiculos()
  }, [])

  async function cargarVehiculos() {
    try {
      setLoading(true)

      // Cargar todos los vehículos
      const { data: vehiculosData, error: vehiculosError } = await supabase
        .from('vehiculos')
        .select('*')
        .order('placa')

      if (vehiculosError) throw vehiculosError

      // Cargar estadísticas para cada vehículo
      const vehiculosConEstadisticas = await Promise.all(
        (vehiculosData || []).map(async (vehiculo) => {
          const { data: registros } = await supabase
            .from('vista_registros_combustible_calculados')
            .select('tipo_recorrido, km_por_galon_real, valor_recarga, kilometraje_parcial')
            .eq('vehiculo_id', vehiculo.id)

          if (!registros || registros.length === 0) {
            return {
              vehiculo,
              totalRegistros: 0,
              urbano: { promedio: 0, registros: 0 },
              carretera: { promedio: 0, registros: 0 },
              mixto: { promedio: 0, registros: 0 },
              promedioGeneral: 0,
              totalGastado: 0,
              costoPorKm: 0
            }
          }

          // Calcular estadísticas por tipo de recorrido
          const urbano = registros.filter(r => r.tipo_recorrido === 'Urbano')
          const carretera = registros.filter(r => r.tipo_recorrido === 'Carretera')
          const mixto = registros.filter(r => r.tipo_recorrido === 'Mixto')

          const promedioUrbano = urbano.length > 0
            ? urbano.reduce((sum, r) => sum + r.km_por_galon_real, 0) / urbano.length
            : 0

          const promedioCarretera = carretera.length > 0
            ? carretera.reduce((sum, r) => sum + r.km_por_galon_real, 0) / carretera.length
            : 0

          const promedioMixto = mixto.length > 0
            ? mixto.reduce((sum, r) => sum + r.km_por_galon_real, 0) / mixto.length
            : 0

          const promedioGeneral = registros.reduce((sum, r) => sum + r.km_por_galon_real, 0) / registros.length
          const totalGastado = registros.reduce((sum, r) => sum + r.valor_recarga, 0)
          const totalKm = registros.reduce((sum, r) => sum + r.kilometraje_parcial, 0)
          const costoPorKm = totalKm > 0 ? totalGastado / totalKm : 0

          return {
            vehiculo,
            totalRegistros: registros.length,
            urbano: { promedio: promedioUrbano, registros: urbano.length },
            carretera: { promedio: promedioCarretera, registros: carretera.length },
            mixto: { promedio: promedioMixto, registros: mixto.length },
            promedioGeneral,
            totalGastado,
            costoPorKm
          }
        })
      )

      setVehiculos(vehiculosConEstadisticas)

    } catch (error) {
      console.error('Error cargando vehículos:', error)
      alert('Error al cargar los vehículos')
    } finally {
      setLoading(false)
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

  async function handleCambiarEstado(vehiculo: Vehiculo) {
    const accion = vehiculo.activo ? 'desactivar' : 'activar'
    const confirmar = window.confirm(
      `¿Estás seguro de ${accion} este vehículo?\n\n` +
      `${vehiculo.placa} - ${vehiculo.marca} ${vehiculo.linea}\n\n` +
      (vehiculo.activo 
        ? 'Al desactivarlo, no aparecerá en los formularios de nuevos registros.'
        : 'Al activarlo, volverá a aparecer en los formularios de nuevos registros.')
    )

    if (!confirmar) return

    try {
      setCambiandoEstado(vehiculo.id)

      const { error } = await supabase
        .from('vehiculos')
        .update({ activo: !vehiculo.activo })
        .eq('id', vehiculo.id)

      if (error) throw error

      // Actualizar localmente
      setVehiculos(prev => prev.map(v => 
        v.vehiculo.id === vehiculo.id 
          ? { ...v, vehiculo: { ...v.vehiculo, activo: !v.vehiculo.activo } }
          : v
      ))

    } catch (error) {
      console.error('Error cambiando estado:', error)
      alert('Error al cambiar el estado del vehículo')
    } finally {
      setCambiandoEstado(null)
    }
  }

  async function handleEliminar(vehiculo: Vehiculo, totalRegistros: number) {
    if (totalRegistros > 0) {
      alert(
        `No se puede eliminar este vehículo porque tiene ${totalRegistros} registro(s) asociado(s).\n\n` +
        `Primero debes eliminar todos los registros de combustible de este vehículo, ` +
        `o puedes desactivarlo en lugar de eliminarlo.`
      )
      return
    }

    const confirmar = window.confirm(
      `¿Estás ABSOLUTAMENTE seguro de eliminar este vehículo?\n\n` +
      `${vehiculo.placa} - ${vehiculo.marca} ${vehiculo.linea} (${vehiculo.modelo})\n\n` +
      `Esta acción NO se puede deshacer.\n\n` +
      `Si solo quieres que no aparezca en los formularios, usa "Desactivar" en su lugar.`
    )

    if (!confirmar) return

    try {
      setEliminando(vehiculo.id)

      const { error } = await supabase
        .from('vehiculos')
        .delete()
        .eq('id', vehiculo.id)

      if (error) throw error

      // Actualizar localmente
      setVehiculos(prev => prev.filter(v => v.vehiculo.id !== vehiculo.id))
      alert('Vehículo eliminado exitosamente')

    } catch (error) {
      console.error('Error eliminando vehículo:', error)
      alert('Error al eliminar el vehículo. Por favor intenta de nuevo.')
    } finally {
      setEliminando(null)
    }
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-lg text-gray-600">Cargando vehículos...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Mis Vehículos</h1>
        <button
          onClick={() => window.location.href = '/vehiculos/nuevo'}
          className="bg-gray-700 text-white px-4 py-2 rounded-md hover:bg-gray-800"
        >
          + Agregar Vehículo
        </button>
      </div>

      {/* Resumen */}
      {vehiculos.length > 0 && (
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Resumen General
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-700">Total vehículos</div>
              <div className="text-2xl font-bold text-gray-900">{vehiculos.length}</div>
            </div>
            <div>
              <div className="text-sm text-gray-700">Activos</div>
              <div className="text-2xl font-bold text-gray-900">
                {vehiculos.filter(v => v.vehiculo.activo).length}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-700">Total registros</div>
              <div className="text-2xl font-bold text-gray-900">
                {vehiculos.reduce((sum, v) => sum + v.totalRegistros, 0)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-700">Gasto total</div>
              <div className="text-2xl font-bold text-gray-900">
                {formatearMoneda(vehiculos.reduce((sum, v) => sum + v.totalGastado, 0))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Vehículos */}
      {vehiculos.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="text-gray-300 text-6xl mb-4">🚗</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No hay vehículos registrados
          </h3>
          <p className="text-gray-600 mb-6">
            Agrega tu primer vehículo para empezar a registrar consumos de combustible.
          </p>
          <button
            onClick={() => window.location.href = '/vehiculos/nuevo'}
            className="bg-gray-700 text-white px-6 py-3 rounded-md hover:bg-gray-800"
          >
            Agregar primer vehículo
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {vehiculos.map(({ vehiculo, totalRegistros, urbano, carretera, mixto, promedioGeneral, totalGastado, costoPorKm }) => {
            const isExpanded = expandidos.has(vehiculo.id)
            
            return (
              <div
                key={vehiculo.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Header - Siempre visible */}
                <div
                  onClick={() => toggleExpanded(vehiculo.id)}
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      {/* Placa y vehículo */}
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xl font-bold text-gray-600">
                          {vehiculo.placa}
                        </span>
                        <span className="font-semibold text-gray-900">
                          {vehiculo.marca} {vehiculo.linea} ({vehiculo.modelo})
                        </span>
                        {vehiculo.activo ? (
                          <span className="text-xs bg-green-100 text-gray-700 px-2 py-1 rounded">
                            ✓ Activo
                          </span>
                        ) : (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            ○ Inactivo
                          </span>
                        )}
                      </div>
                      
                      {/* Detalles técnicos */}
                      <div className="text-sm text-gray-600 mb-2">
                        {vehiculo.combustible_tipo} • {vehiculo.motorizacion_tipo_id === 1 ? 'Térmico' : vehiculo.motorizacion_tipo_id === 2 ? 'Eléctrico' : 'Híbrido'} • {vehiculo.cilindrada_motor} cc
                      </div>

                      {/* Resumen rápido */}
                      <div className="text-sm text-gray-500">
                        {totalRegistros} {totalRegistros === 1 ? 'registro' : 'registros'}
                        {totalRegistros > 0 && ` • Promedio: ${formatearNumero(promedioGeneral)} km/gal`}
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
                    {totalRegistros > 0 ? (
                      <div className="space-y-6 mt-4">
                        {/* Rendimiento por tipo de recorrido */}
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <h4 className="font-semibold text-gray-900 mb-4">
                            Rendimiento por tipo de recorrido
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {/* Urbano */}
                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                              <div className="text-sm text-gray-700 mb-1">Urbano</div>
                              <div className="text-2xl font-bold text-gray-900">
                                {urbano.registros > 0 ? formatearNumero(urbano.promedio) : '-'}
                              </div>
                              <div className="text-xs text-gray-600">
                                {urbano.registros > 0 ? 'km/gal' : 'Sin datos'}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {urbano.registros} {urbano.registros === 1 ? 'registro' : 'registros'}
                              </div>
                            </div>

                            {/* Carretera */}
                            <div className="text-center p-3 bg-gray-100 rounded-lg">
                              <div className="text-sm text-gray-700 mb-1">Carretera</div>
                              <div className="text-2xl font-bold text-gray-900">
                                {carretera.registros > 0 ? formatearNumero(carretera.promedio) : '-'}
                              </div>
                              <div className="text-xs text-gray-600">
                                {carretera.registros > 0 ? 'km/gal' : 'Sin datos'}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {carretera.registros} {carretera.registros === 1 ? 'registro' : 'registros'}
                              </div>
                            </div>

                            {/* Mixto */}
                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                              <div className="text-sm text-gray-700 mb-1">Mixto</div>
                              <div className="text-2xl font-bold text-gray-900">
                                {mixto.registros > 0 ? formatearNumero(mixto.promedio) : '-'}
                              </div>
                              <div className="text-xs text-gray-600">
                                {mixto.registros > 0 ? 'km/gal' : 'Sin datos'}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {mixto.registros} {mixto.registros === 1 ? 'registro' : 'registros'}
                              </div>
                            </div>

                            {/* General */}
                            <div className="text-center p-3 bg-gray-100 rounded-lg">
                              <div className="text-sm text-gray-700 mb-1">General</div>
                              <div className="text-2xl font-bold text-gray-900">
                                {formatearNumero(promedioGeneral)}
                              </div>
                              <div className="text-xs text-gray-600">km/gal</div>
                              <div className="text-xs text-gray-500 mt-1">
                                {totalRegistros} total
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Costos */}
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <h4 className="font-semibold text-gray-900 mb-3">
                            Costos
                          </h4>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <div className="text-gray-600 text-xs mb-1">Total gastado</div>
                              <div className="font-semibold text-lg">{formatearMoneda(totalGastado)}</div>
                            </div>
                            <div>
                              <div className="text-gray-600 text-xs mb-1">Costo por km</div>
                              <div className="font-semibold text-lg">{formatearMoneda(costoPorKm)}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500">
                          Este vehículo aún no tiene registros de combustible
                        </p>
                      </div>
                    )}

                    {/* Botones de acción */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex flex-col md:flex-row gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            window.location.href = `/registros/nuevo?vehiculo=${vehiculo.id}`
                          }}
                          className="flex-1 md:flex-initial px-6 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                        >
                          Nuevo Registro
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            window.location.href = `/registros?vehiculo=${vehiculo.id}`
                          }}
                          className="flex-1 md:flex-initial px-6 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                        >
                          Ver Registros
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            window.location.href = `/vehiculos/editar/${vehiculo.id}`
                          }}
                          className="flex-1 md:flex-initial px-6 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleCambiarEstado(vehiculo)
                          }}
                          disabled={cambiandoEstado === vehiculo.id}
                          className={`flex-1 md:flex-initial px-6 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed ${
                            vehiculo.activo
                              ? 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500'
                              : 'bg-gray-700 text-white hover:bg-gray-800 focus:ring-gray-500'
                          }`}
                        >
                          {cambiandoEstado === vehiculo.id
                            ? 'Procesando...'
                            : vehiculo.activo
                            ? 'Desactivar'
                            : 'Activar'}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEliminar(vehiculo, totalRegistros)
                          }}
                          disabled={eliminando === vehiculo.id}
                          className="flex-1 md:flex-initial px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                          {eliminando === vehiculo.id ? 'Eliminando...' : 'Eliminar'}
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
    </div>
  )
}

export default function VehiculosPage() {
  return (
    <ProtectedRoute>
      <VehiculosPageContent />
    </ProtectedRoute>
  )
}