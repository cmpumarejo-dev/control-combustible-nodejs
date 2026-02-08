'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login')
      } else {
        setIsChecking(false)
      }
    }
  }, [user, loading, router])

  // Siempre mostrar loading hasta confirmar que hay usuario
  if (loading || isChecking) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-lg text-gray-600">Verificando sesión...</div>
      </div>
    )
  }

  // Si no hay usuario, no mostrar nada (está redirigiendo)
  if (!user) {
    return null
  }

  // Solo mostrar contenido si confirmamos que hay usuario
  return <>{children}</>
}