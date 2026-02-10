'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Vehiculo, MarcaEstacion, EstacionServicio } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

function NuevoRegistroForm() {
  const searchParams = useSearchParams()
  const vehiculoIdFromUrl = searchParams.get('vehiculo')
  const { user } = useAuth()

  // Estados para los selects
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [marcasEstacion, setMarcasEstacion] = useState<MarcaEstacion[]>([])
  const [estaciones, setEstaciones] = useState<EstacionServicio[]>([])
  const [estacionesFiltradas, setEstacionesFiltradas] = useState<EstacionServicio[]>([])
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    vehiculo_id: vehiculoIdFromUrl || '',
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
  const [advertencias, setAdvertencias] = useState<string[]>([])
  const [mostrarModalConfirmacion, setMostrarModalConfirmacion] = useState(false)
  const [datosParaGuardar, setDatosParaGuardar] = useState<any>(null)

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

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Función para validar datos y detectar inconsistencias
  async function validarDatos(registro: any): Promise<string[]> {
    const advertenciasDetectadas: string[] = []

    try {
      // 1. Obtener el último registro del vehículo
      const { data: ultimoRegistro } = await supabase
        .from('registros_combustible')
        .select('*')
        .eq('vehiculo_id', registro.vehiculo_id)
        .order('fecha', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (ultimoRegistro) {
        // 2. Validar que el odómetro avanzó
        if (registro.kilometraje_total <= ultimoRegistro.kilometraje_total) {
          advertenciasDetectadas.push(
            `⚠️ El odómetro (${registro.kilometraje_total.toLocaleString()} km) debe ser mayor al último registro (${ultimoRegistro.kilometraje_total.toLocaleString()} km)`
          )
        } else {
          // 3. Calcular km recorridos según odómetro
          const kmRecorridosSegunOdometro = registro.kilometraje_total - ultimoRegistro.kilometraje_total
          const kmParcial = registro.kilometraje_parcial

          // 4. Comparar km del trip vs km del odómetro
          const diferencia = Math.abs(kmRecorridosSegunOdometro - kmParcial)
          const porcentajeDiferencia = (diferencia / kmRecorridosSegunOdometro) * 100

          if (porcentajeDiferencia > 10) {
            advertenciasDetectadas.push(
              `⚠️ Diferencia del ${porcentajeDiferencia.toFixed(1)}% entre el km recorrido según odómetro (${kmRecorridosSegunOdometro.toLocaleString()} km) y el km parcial del trip (${kmParcial.toLocaleString()} km). ¿Olvidaste resetear el trip?`
            )
          }
        }
      }

      // 5. Validar rendimiento razonable
      const rendimiento = registro.kilometraje_parcial / registro.galones_recargados
      if (rendimiento < 5) {
        advertenciasDetectadas.push(
          `⚠️ Rendimiento muy bajo (${rendimiento.toFixed(1)} km/gal). Verifica los datos.`
        )
      } else if (rendimiento > 80) {
        advertenciasDetectadas.push(
          `⚠️ Rendimiento muy alto (${rendimiento.toFixed(1)} km/gal). Verifica los datos.`
        )
      }

      // 6. Validar galones razonables (no más de 25 galones para tanques normales)
      if (registro.galones_recargados > 25) {
        advertenciasDetectadas.push(
          `⚠️ Cantidad de galones muy alta (${registro.galones_recargados} gal). ¿Es correcto?`
        )
      }

      // 7. Validar que el km parcial no sea 0
      if (registro.kilometraje_parcial === 0) {
        advertenciasDetectadas.push(
          `⚠️ El kilometraje parcial es 0. Esto no es válido.`
        )
      }

    } catch (error) {
      console.log('No hay registros previos, saltando validaciones comparativas')
    }

    return advertenciasDetectadas
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMensaje(null)
    setAdvertencias([])

    try {
      // Validaciones básicas
      if (!formData.vehiculo_id || !formData.marca_estacion_id || !formData.estacion_servicio_id) {
        throw new Error('Por favor completa todos los campos obligatorios')
      }

      // Verificar que el usuario esté autenticado
      if (!user) {
        throw new Error('Debes estar autenticado para crear un registro')
      }

      // Convertir a números los campos numéricos
      const registro = {
        vehiculo_id: parseInt(formData.vehiculo_id),
        user_id: user.id,
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

      // Validar datos y detectar inconsistencias
      const advertenciasDetectadas = await validarDatos(registro)
      
      if (advertenciasDetectadas.length > 0) {
        // Hay advertencias - mostrar modal de confirmación
        setAdvertencias(advertenciasDetectadas)
        setDatosParaGuardar(registro)
        setMostrarModalConfirmacion(true)
        setLoading(false)
        return
      }

      // No hay advertencias - guardar directamente
      await guardarRegistro(registro)

    } catch (error: any) {
      console.error('Error al validar:', error)
      setMensaje({ 
        tipo: 'error', 
        texto: error.message || 'Error al validar el registro. Por favor intenta de nuevo.' 
      })
      setLoading(false)
    }
  }

  // Función para guardar el registro (reutilizable)
  async function guardarRegistro(registro: any) {
    setLoading(true)
    try {
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
      
      // Cerrar modal si estaba abierto
      setMostrarModalConfirmacion(false)
      setDatosParaGuardar(null)
      setAdvertencias([])

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

  // Manejar confirmación desde el modal
  function confirmarGuardado() {
    if (datosParaGuardar) {
      guardarRegistro(datosParaGuardar)
    }
  }

  // Cancelar guardado y volver al formulario
  function cancelarGuardado() {
    setMostrarModalConfirmacion(false)
    setDatosParaGuardar(null)
    setAdvertencias([])
    setLoading(false)
  } 
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
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Nuevo Registro de Combustible
          </h1>
          {vehiculoIdFromUrl && (
            <p className="text-sm text-gray-600 mt-2">
              Para vehículo: <span className="font-semibold text-gray-700">
                {vehiculos.find(v => v.id === parseInt(vehiculoIdFromUrl))?.placa || 'Cargando...'}
              </span>
            </p>
          )}
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
            <select
              id="marca_estacion_id"
              name="marca_estacion_id"
              value={formData.marca_estacion_id}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 text-gray-900 bg-white"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 text-gray-900 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
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
              disabled={loading}
              className="flex-1 bg-gray-700 text-white py-2 px-4 rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Guardando...' : 'Guardar Registro'}
            </button>
            <button
              type="button"
              onClick={() => window.history.back()}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>

      {/* Modal de Confirmación de Advertencias */}
      {mostrarModalConfirmacion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start gap-3 mb-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                  <span className="text-2xl">⚠️</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    Advertencias Detectadas
                  </h3>
                  <p className="text-sm text-gray-600">
                    Hemos detectado posibles inconsistencias en los datos. Revisa y confirma si quieres guardar de todos modos.
                  </p>
                </div>
              </div>

              {/* Lista de Advertencias */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <ul className="space-y-3">
                  {advertencias.map((advertencia, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="flex-shrink-0 mt-0.5 text-yellow-600">•</span>
                      <span className="text-gray-700">{advertencia}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Botones */}
              <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end">
                <button
                  onClick={cancelarGuardado}
                  type="button"
                  className="w-full sm:w-auto px-6 py-2.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                >
                  Corregir Datos
                </button>
                <button
                  onClick={confirmarGuardado}
                  type="button"
                  disabled={loading}
                  className="w-full sm:w-auto px-6 py-2.5 bg-gray-700 text-white rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? 'Guardando...' : 'Guardar de Todos Modos'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function NuevoRegistro() {
  return (
    <ProtectedRoute>
      <Suspense fallback={
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-lg text-gray-600">Cargando formulario...</div>
        </div>
      }>
        <NuevoRegistroForm />
      </Suspense>
    </ProtectedRoute>
  )
}