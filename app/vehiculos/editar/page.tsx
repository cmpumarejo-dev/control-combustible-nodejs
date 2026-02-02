'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function EditarVehiculo() {
  const params = useParams()
  const router = useRouter()
  const vehiculoId = params.id as string

  const [formData, setFormData] = useState({
    placa: '',
    marca: '',
    linea: '',
    modelo: new Date().getFullYear(),
    combustible_tipo: 'Gasolina',
    cilindrada_motor: '',
    motorizacion_tipo_id: '1',
    activo: true
  })

  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error', texto: string } | null>(null)
  const [placaOriginal, setPlacaOriginal] = useState('')

  useEffect(() => {
    cargarVehiculo()
  }, [])

  async function cargarVehiculo() {
    try {
      setLoading(true)

      const { data: vehiculoData, error: vehiculoError } = await supabase
        .from('vehiculos')
        .select('*')
        .eq('id', vehiculoId)
        .single()

      if (vehiculoError) throw vehiculoError
      if (!vehiculoData) {
        setMensaje({ tipo: 'error', texto: 'Vehículo no encontrado' })
        return
      }

      setFormData({
        placa: vehiculoData.placa,
        marca: vehiculoData.marca,
        linea: vehiculoData.linea,
        modelo: vehiculoData.modelo,
        combustible_tipo: vehiculoData.combustible_tipo,
        cilindrada_motor: vehiculoData.cilindrada_motor.toString(),
        motorizacion_tipo_id: vehiculoData.motorizacion_tipo_id.toString(),
        activo: vehiculoData.activo
      })
      setPlacaOriginal(vehiculoData.placa)

    } catch (error) {
      console.error('Error cargando vehículo:', error)
      setMensaje({ tipo: 'error', texto: 'Error al cargar los datos del vehículo' })
    } finally {
      setLoading(false)
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value, type } = e.target
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setGuardando(true)
    setMensaje(null)

    try {
      // Validar placa
      if (formData.placa.trim().length < 3) {
        throw new Error('La placa debe tener al menos 3 caracteres')
      }

      // Si cambió la placa, verificar que no exista
      const placaNueva = formData.placa.trim().toUpperCase()
      if (placaNueva !== placaOriginal) {
        const { data: placaExistente } = await supabase
          .from('vehiculos')
          .select('id')
          .eq('placa', placaNueva)
          .single()

        if (placaExistente) {
          throw new Error('Ya existe un vehículo con esta placa')
        }
      }

      const vehiculoActualizado = {
        placa: placaNueva,
        marca: formData.marca.trim(),
        linea: formData.linea.trim(),
        modelo: parseInt(formData.modelo.toString()),
        combustible_tipo: formData.combustible_tipo,
        cilindrada_motor: parseFloat(formData.cilindrada_motor),
        motorizacion_tipo_id: parseInt(formData.motorizacion_tipo_id),
        activo: formData.activo
      }

      const { error } = await supabase
        .from('vehiculos')
        .update(vehiculoActualizado)
        .eq('id', vehiculoId)

      if (error) throw error

      setMensaje({ tipo: 'success', texto: '¡Vehículo actualizado exitosamente!' })
      
      setTimeout(() => {
        router.push('/vehiculos')
      }, 1500)

    } catch (error: any) {
      console.error('Error al guardar:', error)
      setMensaje({ 
        tipo: 'error', 
        texto: error.message || 'Error al actualizar el vehículo. Por favor intenta de nuevo.' 
      })
    } finally {
      setGuardando(false)
    }
  }

  const anios = Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i)

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-lg text-gray-600">Cargando vehículo...</div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Editar Vehículo
          </h1>
          <button
            onClick={() => router.push('/vehiculos')}
            className="text-gray-600 hover:text-gray-900"
          >
            ← Volver
          </button>
        </div>

        {mensaje && (
          <div className={`mb-4 p-4 rounded-md ${
            mensaje.tipo === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {mensaje.texto}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Placa */}
          <div>
            <label htmlFor="placa" className="block text-sm font-medium text-gray-700 mb-1">
              Placa *
            </label>
            <input
              type="text"
              id="placa"
              name="placa"
              value={formData.placa}
              onChange={handleChange}
              required
              placeholder="ABC123"
              maxLength={10}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white uppercase"
            />
            <p className="mt-1 text-xs text-gray-500">
              La placa se guardará en mayúsculas
            </p>
          </div>

          {/* Marca y Línea */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="marca" className="block text-sm font-medium text-gray-700 mb-1">
                Marca *
              </label>
              <input
                type="text"
                id="marca"
                name="marca"
                value={formData.marca}
                onChange={handleChange}
                required
                placeholder="Chevrolet"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              />
            </div>

            <div>
              <label htmlFor="linea" className="block text-sm font-medium text-gray-700 mb-1">
                Línea / Modelo *
              </label>
              <input
                type="text"
                id="linea"
                name="linea"
                value={formData.linea}
                onChange={handleChange}
                required
                placeholder="Swift Dzire"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              />
            </div>
          </div>

          {/* Año/Modelo */}
          <div>
            <label htmlFor="modelo" className="block text-sm font-medium text-gray-700 mb-1">
              Año del Vehículo *
            </label>
            <select
              id="modelo"
              name="modelo"
              value={formData.modelo}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            >
              {anios.map(anio => (
                <option key={anio} value={anio}>{anio}</option>
              ))}
            </select>
          </div>

          {/* Tipo de Combustible */}
          <div>
            <label htmlFor="combustible_tipo" className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Combustible *
            </label>
            <select
              id="combustible_tipo"
              name="combustible_tipo"
              value={formData.combustible_tipo}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            >
              <option value="Gasolina">Gasolina</option>
              <option value="Diesel">Diesel</option>
              <option value="Gas Natural">Gas Natural</option>
              <option value="Eléctrico">Eléctrico</option>
              <option value="Híbrido">Híbrido</option>
            </select>
          </div>

          {/* Cilindrada */}
          <div>
            <label htmlFor="cilindrada_motor" className="block text-sm font-medium text-gray-700 mb-1">
              Cilindrada del Motor (cc) *
            </label>
            <input
              type="number"
              id="cilindrada_motor"
              name="cilindrada_motor"
              value={formData.cilindrada_motor}
              onChange={handleChange}
              required
              min="0"
              step="1"
              placeholder="1200"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            />
            <p className="mt-1 text-xs text-gray-500">
              En centímetros cúbicos (ej: 1200, 1600, 2000)
            </p>
          </div>

          {/* Tipo de Motorización */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Motorización *
            </label>
            <div className="flex gap-6">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="motorizacion_tipo_id"
                  value="1"
                  checked={formData.motorizacion_tipo_id === '1'}
                  onChange={handleChange}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Térmico</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="motorizacion_tipo_id"
                  value="2"
                  checked={formData.motorizacion_tipo_id === '2'}
                  onChange={handleChange}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Eléctrico</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="motorizacion_tipo_id"
                  value="3"
                  checked={formData.motorizacion_tipo_id === '3'}
                  onChange={handleChange}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Híbrido</span>
              </label>
            </div>
          </div>

          {/* Estado Activo */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="activo"
                checked={formData.activo}
                onChange={handleChange}
                className="mr-3 h-5 w-5"
              />
              <div>
                <span className="text-sm font-medium text-gray-900">Vehículo activo</span>
                <p className="text-xs text-gray-600 mt-1">
                  Los vehículos activos aparecen en los formularios de registro de combustible
                </p>
              </div>
            </label>
          </div>

          {/* Botones */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={guardando}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {guardando ? 'Guardando cambios...' : 'Guardar Cambios'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/vehiculos')}
              disabled={guardando}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}