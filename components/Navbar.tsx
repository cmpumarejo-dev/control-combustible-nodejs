'use client'

import { useAuth } from '@/contexts/AuthContext'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'

export default function Navbar() {
  const { user, signOut, loading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [showMenu, setShowMenu] = useState(false)

  // No mostrar navbar en páginas de auth
  const isAuthPage = pathname === '/login' || pathname === '/registro'
  if (isAuthPage || loading) return null

  async function handleLogout() {
    await signOut()
    router.push('/login')
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo clickeable */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              {/* Ícono de bomba de gasolina */}
              <svg className="w-7 h-7 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor">
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
              <h1 className="text-xl font-bold text-gray-900">
                Control de Combustible
              </h1>
            </Link>
          </div>
          
          {user && (
            <>
              {/* Links de navegación - Desktop */}
              <div className="hidden md:flex space-x-1">
                <Link 
                  href="/" 
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === '/' 
                      ? 'bg-gray-900 text-white' 
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  Dashboard
                </Link>
                <Link 
                  href="/registros" 
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname?.startsWith('/registros')
                      ? 'bg-gray-900 text-white' 
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  Registros
                </Link>
                <Link 
                  href="/vehiculos" 
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname?.startsWith('/vehiculos')
                      ? 'bg-gray-900 text-white' 
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  Vehículos
                </Link>
              </div>

              {/* Usuario y menú */}
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <span className="hidden sm:inline text-gray-900">{user.email?.split('@')[0]}</span>
                  <svg className={`w-4 h-4 text-gray-500 transition-transform ${showMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Menú desplegable */}
                {showMenu && (
                  <>
                    {/* Overlay para cerrar el menú */}
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-20 border border-gray-200">
                      <div className="px-4 py-3 border-b border-gray-200">
                        <p className="text-xs text-gray-500">Sesión iniciada como</p>
                        <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          <span>Cerrar Sesión</span>
                        </div>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Menú móvil */}
      {user && (
        <div className="md:hidden border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link
              href="/"
              className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                pathname === '/'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/registros"
              className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                pathname?.startsWith('/registros')
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Registros
            </Link>
            <Link
              href="/vehiculos"
              className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                pathname?.startsWith('/vehiculos')
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Vehículos
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}