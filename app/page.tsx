'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import type { Vehiculo, RegistroCalculado } from '@/lib/supabase'

type Metricas = {
  kmTotales: number
  gastoTotal: number
  rendimientoPromedio: number
  totalRegistros: number
}

export default function Home() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [metricas, setMetricas] = useState<Metricas>({
    kmTotales: 0,
    gastoTotal: 0,
    rendimientoPromedio: 0,
    totalRegistros: 0
  })
  const [ultimosRegistros, setUltimosRegistros] = useState<RegistroCalculado[]>([])
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [periodo, setPeriodo] = useState<'mes_vigente' | 'ultimos_30_dias'>('mes_vigente')

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
    if (user) {
      cargarDatos()
    }
  }, [user, loading, router, periodo])

  async function cargarDatos() {
    try {
      const hoy = new Date()
      let fechaInicio: string

      // Calcular fecha de inicio según período seleccionado
      if (periodo === 'mes_vigente') {
        // Primer día del mes actual
        const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
        fechaInicio = inicioMes.toISOString().split('T')[0]
      } else {
        // Últimos 30 días (restar 30 días a la fecha de hoy)
        const hace30Dias = new Date(hoy)
        hace30Dias.setDate(hace30Dias.getDate() - 30)
        fechaInicio = hace30Dias.toISOString().split('T')[0]
      }

      // Cargar registros del período seleccionado
      const { data: registrosMes, error: errorRegistros } = await supabase
        .from('vista_registros_combustible_calculados')
        .select('*')
        .gte('fecha', fechaInicio)
        .order('fecha', { ascending: false })

      if (errorRegistros) throw errorRegistros

      // Calcular métricas del período
      let kmTotales = 0
      let gastoTotal = 0
      let sumaRendimiento = 0
      
      registrosMes?.forEach(registro => {
        if (registro.km_recorridos) {
          kmTotales += registro.km_recorridos
        }
        gastoTotal += registro.valor_recarga
        sumaRendimiento += registro.km_por_galon_real
      })

      const rendimientoPromedio = registrosMes?.length 
        ? sumaRendimiento / registrosMes.length 
        : 0

      setMetricas({
        kmTotales: Math.round(kmTotales),
        gastoTotal: Math.round(gastoTotal),
        rendimientoPromedio: Math.round(rendimientoPromedio * 10) / 10,
        totalRegistros: registrosMes?.length || 0
      })

      // Cargar últimos 5 registros
      const { data: ultimos, error: errorUltimos } = await supabase
        .from('vista_registros_combustible_calculados')
        .select('*')
        .order('fecha', { ascending: false })
        .limit(5)

      if (errorUltimos) throw errorUltimos
      setUltimosRegistros(ultimos || [])

      // Cargar vehículos activos
      const { data: vehiculosData, error: errorVehiculos } = await supabase
        .from('vehiculos')
        .select('*')
        .order('placa')

      if (errorVehiculos) throw errorVehiculos
      setVehiculos(vehiculosData || [])

    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setLoadingData(false)
    }
  }

  if (loading || loadingData) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-lg text-gray-600">Cargando...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Bienvenido de nuevo, {user.email?.split('@')[0]}
        </h1>
        <div className="flex items-center gap-4 mt-3">
          <p className="text-gray-600">
            Resumen de {periodo === 'mes_vigente' ? 'este mes' : 'los últimos 30 días'}
          </p>
          
          {/* Selector de período */}
          <div className="flex gap-2">
            <button
              onClick={() => setPeriodo('mes_vigente')}
              className={`px-4 py-1.5 text-sm rounded-md transition-colors ${
                periodo === 'mes_vigente'
                  ? 'bg-gray-700 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Mes vigente
            </button>
            <button
              onClick={() => setPeriodo('ultimos_30_dias')}
              className={`px-4 py-1.5 text-sm rounded-md transition-colors ${
                periodo === 'ultimos_30_dias'
                  ? 'bg-gray-700 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Últimos 30 días
            </button>
          </div>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Km Totales */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Km Totales</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {metricas.kmTotales.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {periodo === 'mes_vigente' ? 'Este mes' : 'Últimos 30 días'}
              </p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>

        {/* Gasto Total */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Gasto Total</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                ${metricas.gastoTotal.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {periodo === 'mes_vigente' ? 'Este mes' : 'Últimos 30 días'}
              </p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Rendimiento Promedio */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Rendimiento</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {metricas.rendimientoPromedio}
              </p>
              <p className="text-xs text-gray-500 mt-1">km/gal promedio</p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Registros */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Registros</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {metricas.totalRegistros}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {periodo === 'mes_vigente' ? 'Este mes' : 'Últimos 30 días'}
              </p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Últimos Registros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Últimos Registros</h2>
            <Link 
              href="/registros"
              className="text-sm text-gray-700 hover:text-gray-900 font-medium"
            >
              Ver todos →
            </Link>
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {ultimosRegistros.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No hay registros todavía. ¡Crea tu primer registro!
            </div>
          ) : (
            ultimosRegistros.map((registro) => (
              <div key={registro.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-900">
                        {new Date(registro.fecha + 'T00:00:00').toLocaleDateString('es-CO', { 
                          day: '2-digit', 
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                      <span className="text-sm text-gray-600">•</span>
                      <span className="text-sm font-medium text-gray-700">
                        {registro.placa}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-4 text-xs text-gray-500">
                      <span>{registro.galones_recargados} gal</span>
                      <span>•</span>
                      <span>{registro.estacion}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">
                      {registro.km_por_galon_real} km/gal
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      ${registro.valor_recarga.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Tus Vehículos */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Tus Vehículos</h2>
            <Link 
              href="/vehiculos/nuevo"
              className="text-sm text-blue-600 hover:text-gray-700 font-medium"
            >
              + Agregar Vehículo
            </Link>
          </div>
        </div>
        <div className="p-6">
          {vehiculos.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No tienes vehículos registrados. ¡Agrega tu primer vehículo!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vehiculos.map((vehiculo) => (
                <Link 
                  key={vehiculo.id} 
                  href={`/vehiculos/editar/${vehiculo.id}`}
                  className="block"
                >
                  <div className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-sm transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{vehiculo.placa}</h3>
                        <p className="text-sm text-gray-600">{vehiculo.marca} {vehiculo.linea}</p>
                      </div>
                      {vehiculo.activo ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Inactivo
                        </span>
                      )}
                    </div>
                    <div className="space-y-1 text-xs text-gray-500">
                      <div className="flex items-center justify-between">
                        <span>Modelo:</span>
                        <span className="font-medium text-gray-700">{vehiculo.modelo}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Combustible:</span>
                        <span className="font-medium text-gray-700">{vehiculo.combustible_tipo}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Acciones Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link 
          href="/registros/nuevo"
          className="block bg-gray-700 hover:bg-gray-800 text-white rounded-lg p-6 shadow-sm transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-1">Nuevo Registro</h3>
              <p className="text-sm text-gray-300">Registra una nueva carga de combustible</p>
            </div>
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
        </Link>

        <Link 
          href="/registros"
          className="block bg-gray-700 hover:bg-gray-800 text-white rounded-lg p-6 shadow-sm transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-1">Ver Estadísticas</h3>
              <p className="text-sm text-gray-300">Analiza el rendimiento de tus vehículos</p>
            </div>
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
        </Link>
      </div>
    </div>
  )
}