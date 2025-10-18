import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Verificar sessão
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Rotas protegidas que requerem autenticação
  const protectedRoutes = [
    '/checkout',
    '/meus-pedidos',
    '/perfil',
    '/pedido'
  ]

  // Verificar se a rota atual é protegida
  const isProtectedRoute = protectedRoutes.some(route => 
    req.nextUrl.pathname.startsWith(route)
  )

  // Se rota protegida e não logado, redirecionar para login
  if (isProtectedRoute && !session) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set('returnUrl', req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Se já logado e tentando acessar login/cadastro, redirecionar para home
  const authRoutes = ['/login', '/cadastro']
  const isAuthRoute = authRoutes.some(route => 
    req.nextUrl.pathname.startsWith(route)
  )

  if (isAuthRoute && session) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/'
    return NextResponse.redirect(redirectUrl)
  }

  return res
}

export const config = {
  matcher: [
    '/checkout/:path*',
    '/meus-pedidos/:path*',
    '/perfil/:path*',
    '/pedido/:path*',
    '/login',
    '/cadastro'
  ]
}
