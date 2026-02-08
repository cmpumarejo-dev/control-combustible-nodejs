'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'

export default function Home() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-lg text-gray-600">Cargando...</div>
      </div>
    )
  }

  if (!user) {
    return null // Se está redirigiendo
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Bienvenido al Sistema de Control de Combustible
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Registra y analiza el consumo de combustible de tus vehículos
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/registros/nuevo" className="block">
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200">
            <div className="text-4xl mb-4">📝</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Nuevo Registro
            </h2>
            <p className="text-gray-600">
              Registra una nueva carga de combustible
            </p>
          </div>
        </Link>

        <Link href="/registros" className="block">
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200">
            <div className="text-4xl mb-4">📊</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Ver Registros
            </h2>
            <p className="text-gray-600">
              Consulta el historial de cargas
            </p>
          </div>
        </Link>

        <Link href="/vehiculos" className="block">
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200">
            <div className="text-4xl mb-4">🚗</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Mis Vehículos
            </h2>
            <p className="text-gray-600">
              Administra tus vehículos
            </p>
          </div>
        </Link>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          💡 Características principales
        </h3>
        <ul className="space-y-2 text-blue-800">
          <li>✓ Registro detallado de cada carga de combustible</li>
          <li>✓ Cálculo automático de rendimiento (km/litro, km/galón)</li>
          <li>✓ Análisis de costos por kilómetro</li>
          <li>✓ Comparación entre rendimiento real vs computadora</li>
          <li>✓ Historial completo por vehículo</li>
        </ul>
      </div>
    </div>
  )
}
