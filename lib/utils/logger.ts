/**
 * @fileoverview Sistema de logs estruturado para debugging
 * @module lib/utils/logger
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  timestamp: string
  level: LogLevel
  context: string
  message: string
  data?: any
}

class Logger {
  private context: string
  private isDevelopment: boolean

  constructor(context: string) {
    this.context = context
    this.isDevelopment = process.env.NODE_ENV === 'development'
  }

  private formatTimestamp(): string {
    return new Date().toISOString()
  }

  private createLogEntry(level: LogLevel, message: string, data?: any): LogEntry {
    return {
      timestamp: this.formatTimestamp(),
      level,
      context: this.context,
      message,
      data
    }
  }

  private shouldLog(level: LogLevel): boolean {
    // Em produção, apenas warn e error
    if (!this.isDevelopment) {
      return level === 'warn' || level === 'error'
    }
    return true
  }

  private formatMessage(entry: LogEntry): string {
    return `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.context}] ${entry.message}`
  }

  debug(message: string, data?: any): void {
    if (!this.shouldLog('debug')) return

    const entry = this.createLogEntry('debug', message, data)
    console.debug(this.formatMessage(entry), data || '')
  }

  info(message: string, data?: any): void {
    if (!this.shouldLog('info')) return

    const entry = this.createLogEntry('info', message, data)
    console.log(this.formatMessage(entry), data || '')
  }

  warn(message: string, data?: any): void {
    if (!this.shouldLog('warn')) return

    const entry = this.createLogEntry('warn', message, data)
    console.warn(this.formatMessage(entry), data || '')
  }

  error(message: string, error?: any): void {
    if (!this.shouldLog('error')) return

    const entry = this.createLogEntry('error', message, error)
    console.error(this.formatMessage(entry), error || '')

    // Em produção, poderia enviar para serviço de monitoramento
    if (!this.isDevelopment && error) {
      this.reportToMonitoring(entry, error)
    }
  }

  private reportToMonitoring(entry: LogEntry, error: any): void {
    // TODO: Integrar com Sentry, LogRocket, etc
    // Por enquanto, apenas console
    console.error('Error to be reported:', { entry, error })
  }

  /**
   * Mede tempo de execução de uma função
   */
  async measureTime<T>(
    label: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const start = performance.now()
    this.debug(`${label} - Iniciando...`)

    try {
      const result = await fn()
      const duration = performance.now() - start
      this.info(`${label} - Concluído em ${duration.toFixed(2)}ms`)
      return result
    } catch (error) {
      const duration = performance.now() - start
      this.error(`${label} - Falhou após ${duration.toFixed(2)}ms`, error)
      throw error
    }
  }

  /**
   * Cria um logger filho com contexto adicional
   */
  child(subContext: string): Logger {
    return new Logger(`${this.context}:${subContext}`)
  }
}

/**
 * Factory para criar loggers
 */
export const createLogger = (context: string): Logger => {
  return new Logger(context)
}

/**
 * Logger padrão para uso geral
 */
export const logger = createLogger('App')
