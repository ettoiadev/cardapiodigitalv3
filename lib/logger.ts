// lib/logger.ts
// Sistema de logging inteligente que adapta ao ambiente

type LogLevel = 'debug' | 'log' | 'warn' | 'error'

interface Logger {
  debug: (...args: any[]) => void
  log: (...args: any[]) => void
  warn: (...args: any[]) => void
  error: (...args: any[]) => void
}

// Detectar ambiente automaticamente
const isDev = process.env.NODE_ENV === 'development'
const isTest = process.env.NODE_ENV === 'test'
const isProduction = !isDev && !isTest

// Configurar níveis de log por ambiente
const LOG_LEVELS: Record<string, LogLevel[]> = {
  development: ['debug', 'log', 'warn', 'error'],
  test: ['error'], // Apenas erros em testes
  production: ['warn', 'error'] // Apenas avisos e erros em produção
}

const activeLevels = LOG_LEVELS[process.env.NODE_ENV || 'development'] || ['debug', 'log', 'warn', 'error']

// Função auxiliar para verificar se um nível está ativo
const isLevelActive = (level: LogLevel): boolean => activeLevels.includes(level)

// Logger principal
export const logger: Logger = {
  debug: (...args: any[]) => {
    if (isLevelActive('debug')) {
      console.debug('[DEBUG]', ...args)
    }
  },

  log: (...args: any[]) => {
    if (isLevelActive('log')) {
      console.log('[LOG]', ...args)
    }
  },

  warn: (...args: any[]) => {
    if (isLevelActive('warn')) {
      console.warn('[WARN]', ...args)
    }
  },

  error: (...args: any[]) => {
    // Erros sempre são logados, independente do ambiente
    console.error('[ERROR]', ...args)

    // TODO: Em produção, enviar para serviço de monitoring (Sentry, LogRocket, etc)
    if (isProduction) {
      // sendToMonitoring('error', args)
    }
  }
}

// Função para logar com contexto adicional
export const logWithContext = (context: string, level: LogLevel = 'log') => {
  return (...args: any[]) => {
    const timestamp = new Date().toISOString()
    logger[level](`[${timestamp}] [${context}]`, ...args)
  }
}

// Helper para logar performance
export const logPerformance = (operation: string, startTime: number) => {
  const duration = Date.now() - startTime
  logger.debug(`Performance: ${operation} took ${duration}ms`)

  if (duration > 1000) {
    logger.warn(`Slow operation: ${operation} took ${duration}ms`)
  }
}

// Helper para logar erros de API
export const logApiError = (endpoint: string, error: any, data?: any) => {
  logger.error(`API Error [${endpoint}]:`, {
    error: error?.message || error,
    data,
    timestamp: new Date().toISOString()
  })
}

// Exportar configuração atual para debugging
export const getLoggerConfig = () => ({
  environment: process.env.NODE_ENV,
  activeLevels,
  isDev,
  isTest,
  isProduction
})
