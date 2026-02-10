'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const { signIn } = useAuth()
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await signIn(formData.email, formData.password)

    if (error) {
      setError(error.message === 'Invalid login credentials' 
        ? 'Email o contraseña incorrectos' 
        : 'Error al iniciar sesión. Por favor intenta de nuevo.')
      setLoading(false)
    } else {
      router.push('/')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo/Título */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <svg className="w-16 h-16 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              {/* Cuerpo de la bomba */}
              <rect x="6" y="4" width="8" height="14" rx="1" strokeWidth="2"/>
              {/* Pantalla/Display */}
              <rect x="8" y="7" width="4" height="3" fill="currentColor" opacity="0.3"/>
              {/* Manguera */}
              <path d="M14 10 L17 10 C18 10 18.5 10.5 18.5 11.5 L18.5 14.5" strokeWidth="2" strokeLinecap="round"/>
              {/* Boquilla */}
              <circle cx="18.5" cy="15.5" r="1.5" fill="currentColor"/>
              {/* Base */}
              <line x1="5" y1="18" x2="15" y2="18" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Control Combustible
          </h1>
          <p className="text-gray-600">
            Gestiona el consumo de tus vehículos
          </p>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Iniciar Sesión
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 text-gray-900 bg-white"
                placeholder="tu@email.com"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 text-gray-900 bg-white"
                placeholder="••••••••"
              />
            </div>

            {/* Botón Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-700 text-white py-2 px-4 rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>

          {/* Link a Registro */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              ¿No tienes cuenta?{' '}
              <Link href="/registro" className="text-blue-600 hover:text-blue-800 font-medium">
                Regístrate aquí
              </Link>
            </p>
          </div>

          {/* Link a Recuperar Contraseña */}
          <div className="mt-3 text-center">
            <Link href="/recuperar-password" className="text-sm text-gray-600 hover:text-gray-800">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>Control de Combustible v1.0</p>
        </div>
      </div>
    </div>
  )
}