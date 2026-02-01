'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Vehiculo, MarcaEstacion, EstacionServicio } from '@/lib/supabase'

export default function NuevoRegistro() {
  // Estados para los selects
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [marcasEstacion, setMarcasEstacion] = useState<MarcaEstacion[]>([])
  const [estaciones, setEstaciones] = useState<EstacionServicio[]>([])
  const [estacionesFiltradas, setEstacionesFiltradas] = useState<EstacionServicio[]>([])
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    vehiculo_id: '',
    fecha: new Date().toISOString().split('T')[0],
    kilometraje_total: '',
    kilometraje_parcial: '',
    galones_recargados: '',
    valor_recarga: '',
    km_por_litro_computadora: '',
    marca_estacion_id: '',
    estacion_servicio_id: '',
    tipo_recorrido: 'Urbano' as 'Urbano' | 'Carretera' | 'Mixto',
    notas: ''
  })

  const [loading, setLoading] = useState(false)
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error', texto: string } | null>(null)

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatos()
  }, [])

  // Filtrar estaciones cuando cambia la marca
  useEffect(() => {
    if (formData.marca_estacion_id) {
      const filtradas = estaciones.filter(
        e => e.marca_estacion_id === parseInt(formData.marca_estacion_id)
      )
      setEstacionesFiltradas(filtradas)
      // Reset estación seleccionada si no está en las filtradas
      if (!filtradas.find(e => e.id === parseInt(formData.estacion_servicio_id))) {
        setFormData(prev => ({ ...prev, estacion_servicio_id: '' }))
      }
    } else {
      setEstacionesFiltradas([])
    }
  }, [formData.marca_estacion_id, estaciones])

  async function cargarDatos() {
    try {
      // Cargar vehículos activos
      const { data: vehiculosData, error: vehiculosError } = await supabase
        .from('vehiculos')
        .select('*')
        .eq('activo', true)
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

      // Cargar todas las estaciones
      const { data: estacionesData, error: estacionesError } = await supabase
        .from('estaciones_servicio')
        .select('*')
        .order('nombre')

      if (estacionesError) throw estacionesError
      setEstaciones(estacionesData || [])

    } catch (error) {
      console.error('Error cargando datos:', error)
      setMensaje({ tipo: 'error', texto: 'Error al cargar los datos. Por favor recarga la página.' })
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMensaje(null)

    try {
      // Validaciones básicas
      if (!formData.vehiculo_id || !formData.marca_estacion_id || !formData.estacion_servicio_id) {
        throw new Error('Por favor completa todos los campos obligatorios')
      }

      // Convertir a números los campos numéricos
      const registro = {
        vehiculo_id: parseInt(formData.vehiculo_id),
        fecha: formData.fecha,
        kilometraje_total: parseFloat(formData.kilometraje_total),
        kilometraje_parcial: parseFloat(formData.kilometraje_parcial),
        galones_recargados: parseFloat(formData.galones_recargados),
        valor_recarga: parseFloat(formData.valor_recarga),
        km_por_litro_computadora: parseFloat(formData.km_por_litro_computadora),
        marca_estacion_id: parseInt(formData.marca_estacion_id),
        estacion_servicio_id: parseInt(formData.estacion_servicio_id),
        tipo_recorrido: formData.tipo_recorrido,
        notas: formData.notas || null
      }

      const { error } = await supabase
        .from('registros_combustible')
        .insert([registro])

      if (error) throw error

      setMensaje({ tipo: 'success', texto: '¡Registro guardado exitosamente!' })
      
      // Limpiar formulario
      setFormData({
        vehiculo_id: '',
        fecha: new Date().toISOString().split('T')[0],
        kilometraje_total: '',
        kilometraje_parcial: '',
        galones_recargados: '',
        valor_recarga: '',
        km_por_litro_computadora: '',
        marca_estacion_id: '',
        estacion_servicio_id: '',
        tipo_recorrido: 'Urbano',
        notas: ''
      })

    } catch (error: any) {
      console.error('Error al guardar:', error)
      setMensaje({ 
        tipo: 'error', 
        texto: error.message || 'Error al guardar el registro. Por favor intenta de nuevo.' 
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white shadow-md rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Nuevo Registro de Combustible
        </h1>

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
          {/* Vehículo */}
          <div>
            <label htmlFor="vehiculo_id" className="block text-sm font-medium text-gray-700 mb-1">
              Vehículo *
            </label>
            <select
              id="vehiculo_id"
              name="vehiculo_id"
              value={formData.vehiculo_id}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecciona un vehículo</option>
              {vehiculos.map(v => (
                <option key={v.id} value={v.id}>
                  {v.placa} - {v.marca} {v.linea} ({v.modelo})
                </option>
              ))}
            </select>
          </div>

          {/* Fecha */}
          <div>
            <label htmlFor="fecha" className="block text-sm font-medium text-gray-700 mb-1">
              Fecha *
            </label>
            <input
              type="date"
              id="fecha"
              name="fecha"
              value={formData.fecha}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Kilometrajes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="kilometraje_total" className="block text-sm font-medium text-gray-700 mb-1">
                Kilometraje Total *
              </label>
              <input
                type="number"
                id="kilometraje_total"
                name="kilometraje_total"
                value={formData.kilometraje_total}
                onChange={handleChange}
                step="0.01"
                required
                placeholder="123456.78"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="kilometraje_parcial" className="block text-sm font-medium text-gray-700 mb-1">
                Kilometraje Parcial *
              </label>
              <input
                type="number"
                id="kilometraje_parcial"
                name="kilometraje_parcial"
                value={formData.kilometraje_parcial}
                onChange={handleChange}
                step="0.01"
                required
                placeholder="450.25"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Kilómetros desde la última carga
              </p>
            </div>
          </div>

          {/* Galones y Valor */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="galones_recargados" className="block text-sm font-medium text-gray-700 mb-1">
                Galones Recargados *
              </label>
              <input
                type="number"
                id="galones_recargados"
                name="galones_recargados"
                value={formData.galones_recargados}
                onChange={handleChange}
                step="0.01"
                required
                placeholder="12.50"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="valor_recarga" className="block text-sm font-medium text-gray-700 mb-1">
                Valor de la Recarga *
              </label>
              <input
                type="number"
                id="valor_recarga"
                name="valor_recarga"
                value={formData.valor_recarga}
                onChange={handleChange}
                step="0.01"
                required
                placeholder="135000"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Km por litro computadora */}
          <div>
            <label htmlFor="km_por_litro_computadora" className="block text-sm font-medium text-gray-700 mb-1">
              Km/Litro según Computadora *
            </label>
            <input
              type="number"
              id="km_por_litro_computadora"
              name="km_por_litro_computadora"
              value={formData.km_por_litro_computadora}
              onChange={handleChange}
              step="0.01"
              required
              placeholder="15.5"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Rendimiento mostrado en el tablero del vehículo
            </p>
          </div>

          {/* Marca Estación */}
          <div>
            <label htmlFor="marca_estacion_id" className="block text-sm font-medium text-gray-700 mb-1">
              Marca de Estación *
            </label>
            <select
              id="marca_estacion_id"
              name="marca_estacion_id"
              value={formData.marca_estacion_id}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecciona una marca</option>
              {marcasEstacion.map(m => (
                <option key={m.id} value={m.id}>
                  {m.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Estación */}
          <div>
            <label htmlFor="estacion_servicio_id" className="block text-sm font-medium text-gray-700 mb-1">
              Estación de Servicio *
            </label>
            <select
              id="estacion_servicio_id"
              name="estacion_servicio_id"
              value={formData.estacion_servicio_id}
              onChange={handleChange}
              required
              disabled={!formData.marca_estacion_id}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">
                {formData.marca_estacion_id ? 'Selecciona una estación' : 'Primero selecciona una marca'}
              </option>
              {estacionesFiltradas.map(e => (
                <option key={e.id} value={e.id}>
                  {e.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Tipo de Recorrido */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Recorrido *
            </label>
            <div className="flex gap-4">
              {(['Urbano', 'Carretera', 'Mixto'] as const).map(tipo => (
                <label key={tipo} className="flex items-center">
                  <input
                    type="radio"
                    name="tipo_recorrido"
                    value={tipo}
                    checked={formData.tipo_recorrido === tipo}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">{tipo}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Notas / Comentarios */}
          <div>
            <label htmlFor="notas" className="block text-sm font-medium text-gray-700 mb-1">
              Notas / Comentarios (opcional)
            </label>
            <textarea
              id="notas"
              name="notas"
              value={formData.notas}
              onChange={handleChange}
              rows={3}
              placeholder="Ej: Aire acondicionado encendido todo el trayecto, tráfico pesado, subidas pronunciadas..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <p className="mt-1 text-xs text-gray-500">
              Agrega cualquier observación relevante sobre este registro
            </p>
          </div>

          {/* Botones */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Guardando...' : 'Guardar Registro'}
            </button>
            <button
              type="button"
              onClick={() => window.history.back()}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
