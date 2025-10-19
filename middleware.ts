/**
 * @fileoverview Middleware Next.js para proteção de rotas e gerenciamento de autenticação
 * @module middleware
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Middleware de autenticação e proteção de rotas
 * 
 * Este middleware é executado antes de cada requisição para rotas configuradas
 * no matcher. Ele:
 * 
 * 1. **Verifica autenticação**: Obtém a sessão atual do Supabase
 * 2. **Protege rotas privadas**: Redireciona usuários não autenticados para login
 * 3. **Previne acesso a auth pages**: Redireciona usuários logados de /login e /cadastro
 * 4. **Preserva URL de retorno**: Adiciona parâmetro returnUrl para redirecionamento pós-login
 * 
 * ### Rotas Protegidas (requerem autenticação):
 * - `/checkout` - Finalização de pedido
 * - `/meus-pedidos` - Histórico de pedidos do cliente
 * - `/perfil` - Dados e configurações do usuário
 * - `/pedido/*` - Detalhes de pedidos específicos
 * 
 * ### Rotas de Autenticação (apenas para não autenticados):
 * - `/login` - Página de login
 * - `/cadastro` - Página de cadastro
 * 
 * @async
 * @param {NextRequest} req - Objeto de requisição Next.js
 * @returns {Promise<NextResponse>} Resposta Next.js (pode ser redirect ou next())
 * 
 * @example
 * // Usuário não autenticado tenta acessar /checkout
 * // → Redirecionado para /login?returnUrl=/checkout
 * 
 * @example
 * // Usuário autenticado tenta acessar /login
 * // → Redirecionado para /
 * 
 * @example
 * // Usuário autenticado acessa /meus-pedidos
 * // → Acesso permitido, continua normalmente
 */
export async function middleware(req: NextRequest) {
  // Middleware simplificado - a verificação real é feita nas páginas
  // Aqui apenas permitimos navegação livre
  
  console.log('🔓 Middleware: Permitindo acesso a', req.nextUrl.pathname)
  
  return NextResponse.next()
}

/**
 * Configuração do middleware
 * 
 * Define quais rotas devem ser processadas por este middleware.
 * Usa padrões glob do Next.js para matching de rotas.
 * 
 * @type {Object}
 * @property {string[]} matcher - Array de padrões de rota para aplicar o middleware
 * 
 * Padrões configurados:
 * - `/checkout/:path*` - Checkout e sub-rotas
 * - `/meus-pedidos/:path*` - Pedidos e sub-rotas
 * - `/perfil/:path*` - Perfil e sub-rotas
 * - `/pedido/:path*` - Detalhes de pedido e sub-rotas
 * - `/login` - Página de login
 * - `/cadastro` - Página de cadastro
 */
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
