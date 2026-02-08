'use client'

import { useAuth } from '@/contexts/AuthContext'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'

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
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-900">
              ⛽ Control de Combustible
            </h1>
          </div>
          
          {user && (
            <>
              {/* Links de navegación */}
              <div className="hidden md:flex space-x-4">
                <a 
                  href="/registros" 
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    pathname === '/registros' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  Registros
                </a>
                <a 
                  href="/vehiculos" 
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    pathname === '/vehiculos' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  Vehículos
                </a>
              </div>

              {/* Usuario y menú */}
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  <span className="hidden sm:inline">{user.email}</span>
                  <span className="sm:hidden">👤</span>
                  <span>{showMenu ? '▲' : '▼'}</span>
                </button>

                {/* Menú desplegable */}
                {showMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
                    <div className="px-4 py-2 text-xs text-gray-500 border-b border-gray-200 sm:hidden">
                      {user.email}
                    </div>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      Cerrar Sesión
                    </button>
                  </div>
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
            <a
              href="/registros"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                pathname === '/registros'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Registros
            </a>
            <a
              href="/vehiculos"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                pathname === '/vehiculos'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Vehículos
            </a>
          </div>
        </div>
      )}
    </nav>
  )
}
