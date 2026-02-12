'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Vehiculo, MarcaEstacion, EstacionServicio, RegistroCombustible } from '@/lib/supabase'

export default function EditarRegistro() {
  const params = useParams()
  const router = useRouter()
  const registroId = params.id as string

  // Estados para los selects
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [marcasEstacion, setMarcasEstacion] = useState<MarcaEstacion[]>([])
  const [estaciones, setEstaciones] = useState<EstacionServicio[]>([])
  const [estacionesFiltradas, setEstacionesFiltradas] = useState<EstacionServicio[]>([])
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    vehiculo_id: '',
    fecha: '',
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

  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error', texto: string } | null>(null)
  
  // Estados para agregar nueva estación
  const [mostrarModalNuevaEstacion, setMostrarModalNuevaEstacion] = useState(false)
  const [nuevaEstacion, setNuevaEstacion] = useState({
    nombre: '',
    direccion: ''
  })
  const [guardandoEstacion, setGuardandoEstacion] = useState(false)

  // Estados para agregar nueva marca
  const [mostrarModalNuevaMarca, setMostrarModalNuevaMarca] = useState(false)
  const [nuevaMarca, setNuevaMarca] = useState('')
  const [guardandoMarca, setGuardandoMarca] = useState(false)

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
    } else {
      setEstacionesFiltradas(estaciones)
    }
  }, [formData.marca_estacion_id, estaciones])

  async function cargarDatos() {
    try {
      setLoading(true)

      // Cargar el registro a editar
      const { data: registroData, error: registroError } = await supabase
        .from('registros_combustible')
        .select('*')
        .eq('id', registroId)
        .single()

      if (registroError) throw registroError
      if (!registroData) {
        setMensaje({ tipo: 'error', texto: 'Registro no encontrado' })
        return
      }

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

      // Pre-llenar el formulario con los datos del registro
      setFormData({
        vehiculo_id: registroData.vehiculo_id.toString(),
        fecha: registroData.fecha,
        kilometraje_total: registroData.kilometraje_total.toString(),
        kilometraje_parcial: registroData.kilometraje_parcial.toString(),
        galones_recargados: registroData.galones_recargados.toString(),
        valor_recarga: registroData.valor_recarga.toString(),
        km_por_litro_computadora: registroData.km_por_litro_computadora.toString(),
        marca_estacion_id: registroData.marca_estacion_id.toString(),
        estacion_servicio_id: registroData.estacion_servicio_id.toString(),
        tipo_recorrido: registroData.tipo_recorrido,
        notas: registroData.notas || ''
      })

    } catch (error) {
      console.error('Error cargando datos:', error)
      setMensaje({ tipo: 'error', texto: 'Error al cargar los datos. Por favor recarga la página.' })
    } finally {
      setLoading(false)
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setGuardando(true)
    setMensaje(null)

    try {
      // Validaciones básicas
      if (!formData.vehiculo_id || !formData.marca_estacion_id || !formData.estacion_servicio_id) {
        throw new Error('Por favor completa todos los campos obligatorios')
      }

      // Convertir a números los campos numéricos
      const registroActualizado = {
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
        .update(registroActualizado)
        .eq('id', registroId)

      if (error) throw error

      setMensaje({ tipo: 'success', texto: '¡Registro actualizado exitosamente!' })
      
      // Redireccionar después de 1.5 segundos
      setTimeout(() => {
        router.push('/registros')
      }, 1500)

    } catch (error: any) {
      console.error('Error al guardar:', error)
      setMensaje({ 
        tipo: 'error', 
        texto: error.message || 'Error al actualizar el registro. Por favor intenta de nuevo.' 
      })
    } finally {
      setGuardando(false)
    }
  }

  async function guardarNuevaEstacion() {
    if (!nuevaEstacion.nombre.trim()) {
      alert('El nombre de la estación es requerido')
      return
    }

    if (!formData.marca_estacion_id) {
      alert('Debes seleccionar primero una marca de estación')
      return
    }

    setGuardandoEstacion(true)

    try {
      const { data, error } = await supabase
        .from('estaciones_servicio')
        .insert([{
          nombre: nuevaEstacion.nombre.trim(),
          direccion: nuevaEstacion.direccion.trim() || null,
          marca_estacion_id: parseInt(formData.marca_estacion_id),
          municipio_id: null,
          departamento_id: null
        }])
        .select()
        .single()

      if (error) throw error

      // Actualizar lista de estaciones
      setEstaciones(prev => [...prev, data])
      setEstacionesFiltradas(prev => [...prev, data])
      
      // Seleccionar automáticamente la nueva estación
      setFormData(prev => ({
        ...prev,
        estacion_servicio_id: data.id.toString()
      }))

      // Cerrar modal y limpiar formulario
      setMostrarModalNuevaEstacion(false)
      setNuevaEstacion({ nombre: '', direccion: '' })
      
      // Mostrar mensaje de éxito
      setMensaje({ 
        tipo: 'success', 
        texto: 'Estación creada exitosamente' 
      })
      setTimeout(() => setMensaje(null), 3000)

    } catch (error) {
      console.error('Error creando estación:', error)
      alert('Error al crear la estación. Por favor intenta de nuevo.')
    } finally {
      setGuardandoEstacion(false)
    }
  }

  function abrirModalNuevaEstacion() {
    if (!formData.marca_estacion_id) {
      alert('Debes seleccionar primero una marca de estación')
      return
    }
    setMostrarModalNuevaEstacion(true)
  }

  function cerrarModalNuevaEstacion() {
    setMostrarModalNuevaEstacion(false)
    setNuevaEstacion({ nombre: '', direccion: '' })
  }

  async function guardarNuevaMarca() {
    if (!nuevaMarca.trim()) {
      alert('El nombre de la marca es requerido')
      return
    }

    setGuardandoMarca(true)

    try {
      const { data, error } = await supabase
        .from('marcas_estacion')
        .insert([{
          nombre: nuevaMarca.trim()
        }])
        .select()
        .single()

      if (error) throw error

      // Actualizar lista de marcas
      setMarcasEstacion(prev => [...prev, data])
      
      // Seleccionar automáticamente la nueva marca
      setFormData(prev => ({
        ...prev,
        marca_estacion_id: data.id.toString(),
        estacion_servicio_id: '' // Limpiar estación porque cambió la marca
      }))

      // Cerrar modal y limpiar formulario
      setMostrarModalNuevaMarca(false)
      setNuevaMarca('')
      
      // Mostrar mensaje de éxito
      setMensaje({ 
        tipo: 'success', 
        texto: 'Marca creada exitosamente' 
      })
      setTimeout(() => setMensaje(null), 3000)

    } catch (error) {
      console.error('Error creando marca:', error)
      alert('Error al crear la marca. Por favor intenta de nuevo.')
    } finally {
      setGuardandoMarca(false)
    }
  }

  function abrirModalNuevaMarca() {
    setMostrarModalNuevaMarca(true)
  }

  function cerrarModalNuevaMarca() {
    setMostrarModalNuevaMarca(false)
    setNuevaMarca('')
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-lg text-gray-600">Cargando registro...</div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Editar Registro de Combustible
          </h1>
          <button
            onClick={() => router.push('/registros')}
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 text-gray-900 bg-white"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 text-gray-900 bg-white"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 text-gray-900 bg-white"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 text-gray-900 bg-white"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 text-gray-900 bg-white"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 text-gray-900 bg-white"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 text-gray-900 bg-white"
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
            <div className="flex gap-2">
              <select
                id="marca_estacion_id"
                name="marca_estacion_id"
                value={formData.marca_estacion_id}
                onChange={handleChange}
                required
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 text-gray-900 bg-white"
              >
                <option value="">Selecciona una marca</option>
                {marcasEstacion.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.nombre}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={abrirModalNuevaMarca}
                className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-800 transition-colors whitespace-nowrap"
                title="Agregar nueva marca"
              >
                + Nueva
              </button>
            </div>
          </div>

          {/* Estación */}
          <div>
            <label htmlFor="estacion_servicio_id" className="block text-sm font-medium text-gray-700 mb-1">
              Estación de Servicio *
            </label>
            <div className="flex gap-2">
              <select
                id="estacion_servicio_id"
                name="estacion_servicio_id"
                value={formData.estacion_servicio_id}
                onChange={handleChange}
                required
                disabled={!formData.marca_estacion_id}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 text-gray-900 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
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
              <button
                type="button"
                onClick={abrirModalNuevaEstacion}
                disabled={!formData.marca_estacion_id}
                className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                title={!formData.marca_estacion_id ? 'Selecciona primero una marca' : 'Agregar nueva estación'}
              >
                + Nueva
              </button>
            </div>
            {!formData.marca_estacion_id && (
              <p className="mt-1 text-xs text-gray-500">
                Selecciona una marca para poder agregar estaciones
              </p>
            )}
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 text-gray-900 bg-white resize-none"
            />
            <p className="mt-1 text-xs text-gray-500">
              Agrega cualquier observación relevante sobre este registro
            </p>
          </div>

          {/* Botones */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={guardando}
              className="flex-1 bg-gray-700 text-white py-2 px-4 rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {guardando ? 'Guardando cambios...' : 'Guardar Cambios'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/registros')}
              disabled={guardando}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>

      {/* Modal de Nueva Marca */}
      {mostrarModalNuevaMarca && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Agregar Nueva Marca
                </h3>
                <button
                  onClick={cerrarModalNuevaMarca}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  type="button"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Formulario */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="nombreMarca" className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de la Marca *
                  </label>
                  <input
                    type="text"
                    id="nombreMarca"
                    value={nuevaMarca}
                    onChange={(e) => setNuevaMarca(e.target.value)}
                    placeholder="Ej: Terpel, Esso, Mobil"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 text-gray-900 bg-white"
                    autoFocus
                  />
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                  <p className="text-xs text-gray-600">
                    Una vez creada la marca, podrás agregar estaciones de servicio asociadas a ella.
                  </p>
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={cerrarModalNuevaMarca}
                  type="button"
                  disabled={guardandoMarca}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
                <button
                  onClick={guardarNuevaMarca}
                  type="button"
                  disabled={guardandoMarca || !nuevaMarca.trim()}
                  className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {guardandoMarca ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Nueva Estación */}
      {mostrarModalNuevaEstacion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Agregar Nueva Estación
                </h3>
                <button
                  onClick={cerrarModalNuevaEstacion}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  type="button"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Formulario */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="nombreEstacion" className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de la Estación *
                  </label>
                  <input
                    type="text"
                    id="nombreEstacion"
                    value={nuevaEstacion.nombre}
                    onChange={(e) => setNuevaEstacion(prev => ({ ...prev, nombre: e.target.value }))}
                    placeholder="Ej: Texaco Calle 10"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 text-gray-900 bg-white"
                    autoFocus
                  />
                </div>

                <div>
                  <label htmlFor="direccionEstacion" className="block text-sm font-medium text-gray-700 mb-1">
                    Dirección (opcional)
                  </label>
                  <input
                    type="text"
                    id="direccionEstacion"
                    value={nuevaEstacion.direccion}
                    onChange={(e) => setNuevaEstacion(prev => ({ ...prev, direccion: e.target.value }))}
                    placeholder="Ej: Calle 10 # 45-67"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 text-gray-900 bg-white"
                  />
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                  <p className="text-xs text-gray-600">
                    <strong>Marca seleccionada:</strong> {marcasEstacion.find(m => m.id.toString() === formData.marca_estacion_id)?.nombre || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={cerrarModalNuevaEstacion}
                  type="button"
                  disabled={guardandoEstacion}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
                <button
                  onClick={guardarNuevaEstacion}
                  type="button"
                  disabled={guardandoEstacion || !nuevaEstacion.nombre.trim()}
                  className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {guardandoEstacion ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}