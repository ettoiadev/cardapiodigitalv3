// lib/supabase-helpers.ts
// Helpers avançados para interações com Supabase

import { supabase } from './supabase'
import { logger, logApiError } from './logger'

/**
 * Executa query com retry automático
 * @param queryFn - Função que executa a query
 * @param maxRetries - Número máximo de tentativas (padrão: 3)
 * @param delay - Delay inicial entre tentativas em ms (padrão: 1000)
 * @param backoffMultiplier - Multiplicador do delay (padrão: 2)
 * @returns Resultado da query ou erro
 */
export async function queryWithRetry<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  maxRetries = 3,
  delay = 1000,
  backoffMultiplier = 2
): Promise<{ data: T | null; error: any }> {
  let lastError: any

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.debug(`Tentativa ${attempt}/${maxRetries} de query`)

      const result = await queryFn()

      if (!result.error) {
        if (attempt > 1) {
          logger.debug(`✅ Query executada com sucesso na tentativa ${attempt}`)
        }
        return result
      }

      // Se erro não é retryable, não tentar novamente
      if (isNonRetryableError(result.error)) {
        logger.debug('Erro não retryable, retornando imediatamente')
        return result
      }

      lastError = result.error

      // Se é a última tentativa, não aguardar
      if (attempt === maxRetries) {
        break
      }

      // Aguardar antes de tentar novamente
      const currentDelay = delay * Math.pow(backoffMultiplier, attempt - 1)
      logger.debug(`Aguardando ${currentDelay}ms antes da próxima tentativa`)
      await new Promise(resolve => setTimeout(resolve, currentDelay))

    } catch (error) {
      lastError = error

      if (attempt === maxRetries) {
        break
      }

      const currentDelay = delay * Math.pow(backoffMultiplier, attempt - 1)
      logger.debug(`Erro na tentativa ${attempt}, aguardando ${currentDelay}ms:`, error)
      await new Promise(resolve => setTimeout(resolve, currentDelay))
    }
  }

  logger.error(`❌ Query falhou após ${maxRetries} tentativas:`, lastError)
  return { data: null, error: lastError }
}

/**
 * Verifica se um erro é retryable
 */
function isNonRetryableError(error: any): boolean {
  // Erros que não devem ser retryados
  const nonRetryableCodes = [
    'PGRST301', // Unauthorized
    'PGRST302', // Forbidden
    'PGRST303', // Not found (para alguns casos)
    '23505',    // Unique constraint violation
    '23503',    // Foreign key constraint violation
    '42501'     // Insufficient privilege
  ]

  // Erros de validação/autenticação
  if (error?.code && nonRetryableCodes.includes(error.code)) {
    return true
  }

  // Erros de validação de dados
  if (error?.message) {
    const message = error.message.toLowerCase()
    if (message.includes('invalid') ||
        message.includes('required') ||
        message.includes('formato') ||
        message.includes('obrigatório')) {
      return true
    }
  }

  return false
}

/**
 * Busca dados com retry automático
 */
export async function fetchWithRetry<T>(
  table: string,
  options: {
    select?: string
    eq?: Record<string, any>
    neq?: Record<string, any>
    in?: Record<string, any[]>
    order?: string
    ascending?: boolean
    limit?: number
    single?: boolean
  } = {},
  retryOptions: {
    maxRetries?: number
    delay?: number
  } = {}
): Promise<{ data: T | null; error: any }> {
  const { maxRetries = 3, delay = 1000 } = retryOptions

  return queryWithRetry(async () => {
    let query = supabase.from(table).select(options.select || '*')

    // Aplicar filtros
    if (options.eq) {
      Object.entries(options.eq).forEach(([column, value]) => {
        query = query.eq(column, value)
      })
    }

    if (options.neq) {
      Object.entries(options.neq).forEach(([column, value]) => {
        query = query.neq(column, value)
      })
    }

    if (options.in) {
      Object.entries(options.in).forEach(([column, values]) => {
        query = query.in(column, values)
      })
    }

    // Ordenação
    if (options.order) {
      query = query.order(options.order, { ascending: options.ascending ?? true })
    }

    // Limit
    if (options.limit) {
      query = query.limit(options.limit)
    }

    // Single result
    if (options.single) {
      query = query.single()
    }

    return await query
  }, maxRetries, delay)
}

/**
 * Busca cliente com retry
 */
export async function getClienteWithRetry(userId?: string) {
  const log = logger.context('getClienteWithRetry')

  return fetchWithRetry('clientes', {
    eq: { id: userId || await getCurrentUserId() },
    single: true
  }, {
    maxRetries: 3,
    delay: 1000
  })
}

/**
 * Busca pedidos com retry
 */
export async function getPedidosWithRetry(options: {
  clienteId?: string
  status?: string[]
  limit?: number
  order?: string
} = {}) {
  const filters: any = {}

  if (options.clienteId) filters.eq = { cliente_id: options.clienteId }
  if (options.status) filters.in = { status: options.status }

  return fetchWithRetry('vw_pedidos_kanban', {
    ...filters,
    order: options.order || 'created_at',
    ascending: false,
    limit: options.limit || 50
  }, {
    maxRetries: 2, // Menos retries para queries de lista
    delay: 500
  })
}

/**
 * Atualiza dados com retry
 */
export async function updateWithRetry<T>(
  table: string,
  updates: any,
  matchConditions: Record<string, any>,
  retryOptions: {
    maxRetries?: number
    delay?: number
  } = {}
): Promise<{ data: T | null; error: any }> {
  const { maxRetries = 3, delay = 1000 } = retryOptions

  return queryWithRetry(async () => {
    let query = supabase.from(table).update(updates)

    // Aplicar condições de match
    Object.entries(matchConditions).forEach(([column, value]) => {
      query = query.eq(column, value)
    })

    return await query.select().single()
  }, maxRetries, delay)
}

/**
 * Obtém ID do usuário atual (com cache)
 */
let currentUserIdCache: string | null = null
let userIdCacheTime = 0
const USER_ID_CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

async function getCurrentUserId(): Promise<string | null> {
  const now = Date.now()

  // Verificar cache
  if (currentUserIdCache && (now - userIdCacheTime) < USER_ID_CACHE_DURATION) {
    return currentUserIdCache
  }

  try {
    const { data: { user } } = await supabase.auth.getUser()
    currentUserIdCache = user?.id || null
    userIdCacheTime = now

    return currentUserIdCache
  } catch (error) {
    logger.error('Erro ao buscar usuário atual:', error)
    return null
  }
}

/**
 * Limpa cache de usuário (chamar após logout)
 */
export function clearUserCache() {
  currentUserIdCache = null
  userIdCacheTime = 0
  logger.debug('Cache de usuário limpo')
}

/**
 * Testa conectividade com Supabase
 */
export async function testConnectionWithRetry(): Promise<{
  success: boolean
  error?: string
  details?: string
  responseTime?: number
}> {
  const startTime = Date.now()

  try {
    const result = await queryWithRetry(
      () => supabase.from('pizzaria_config').select('id').limit(1),
      2, // Apenas 2 tentativas para teste de conexão
      500 // Delay menor
    )

    const responseTime = Date.now() - startTime

    if (result.error) {
      return {
        success: false,
        error: 'Erro na consulta',
        details: result.error.message,
        responseTime
      }
    }

    return {
      success: true,
      responseTime
    }
  } catch (error) {
    return {
      success: false,
      error: 'Erro de rede',
      details: error instanceof Error ? error.message : 'Erro desconhecido',
      responseTime: Date.now() - startTime
    }
  }
}
