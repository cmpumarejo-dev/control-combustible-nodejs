import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          req.cookies.set({
            name,
            value,
            ...options,
          })
          supabaseResponse.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          req.cookies.set({
            name,
            value: '',
            ...options,
          })
          supabaseResponse.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Obtener usuario actual
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Rutas públicas que no requieren autenticación
  const publicPaths = ['/login', '/registro']
  // Verificar coincidencia exacta o que termine con /
  const isPublicPath = publicPaths.some(path => 
    req.nextUrl.pathname === path || req.nextUrl.pathname.startsWith(path + '/')
  )

  const timestamp = new Date().toLocaleTimeString('es-CO', { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit',
    hour12: false 
  })

  console.log(`[${timestamp}] 🔒 Middleware:`, {
    path: req.nextUrl.pathname,
    hasUser: !!user,
    isPublicPath,
  })

  // Si no hay usuario y la ruta no es pública, redirigir a login
  if (!user && !isPublicPath) {
    console.log(`[${timestamp}] ❌ No autenticado, redirigiendo a login`)
    const redirectUrl = new URL('/login', req.url)
    redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Si hay usuario y está en login/registro, redirigir a registros
  if (user && isPublicPath) {
    console.log(`[${timestamp}] ✅ Ya autenticado, redirigiendo a registros`)
    const redirectUrl = new URL('/registros', req.url)
    return NextResponse.redirect(redirectUrl)
  }

  console.log(`[${timestamp}] ✅ Acceso permitido`)
  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}