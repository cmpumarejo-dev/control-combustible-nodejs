import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos para la base de datos
export type Vehiculo = {
  id: number
  placa: string
  marca: string
  linea: string
  modelo: number
  combustible_tipo: string
  cilindrada_motor: number
  activo: boolean
  motorizacion_tipo_id: number
  created_at: string
}

export type RegistroCombustible = {
  id?: number
  vehiculo_id: number
  fecha: string
  kilometraje_total: number
  kilometraje_parcial: number
  galones_recargados: number
  valor_recarga: number
  km_por_litro_computadora: number
  marca_estacion_id: number
  estacion_servicio_id: number
  tipo_recorrido: 'Urbano' | 'Carretera' | 'Mixto'
  created_at?: string
}

export type MarcaEstacion = {
  id: number
  nombre: string
  created_at: string
}

export type EstacionServicio = {
  id: number
  nombre: string
  marca_estacion_id: number
  municipio_id?: number
  departamento_id?: number
  direccion?: string
  created_at: string
}
