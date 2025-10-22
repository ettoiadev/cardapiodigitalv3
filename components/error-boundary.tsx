"use client"

import React, { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { logger } from '@/lib/logger'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: any) => void
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: any
  errorId?: string
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    // Gerar ID único para o erro
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    return {
      hasError: true,
      error,
      errorId
    }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Log detalhado do erro
    logger.error('ErrorBoundary capturou erro:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId
    })

    // Chamar callback do usuário se fornecido
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // TODO: Em produção, enviar para serviço de monitoring
    // sendToMonitoring(error, errorInfo, this.state.errorId)
  }

  handleRetry = () => {
    logger.debug('Usuário clicou em tentar novamente')
    this.setState({ hasError: false, error: undefined, errorInfo: undefined, errorId: undefined })
  }

  handleGoHome = () => {
    logger.debug('Usuário navegou para home após erro')
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      // Se usuário forneceu fallback customizado, usar ele
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Fallback padrão
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <CardTitle className="text-red-900">Algo deu errado</CardTitle>
              <CardDescription>
                Ocorreu um erro inesperado na aplicação. Nossa equipe foi notificada automaticamente.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Informações de debug (apenas em desenvolvimento) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="bg-gray-100 p-3 rounded-md text-sm">
                  <summary className="cursor-pointer font-medium text-gray-700">
                    Detalhes do erro (desenvolvimento)
                  </summary>
                  <div className="mt-2 space-y-2">
                    <div>
                      <strong>Erro:</strong> {this.state.error.message}
                    </div>
                    {this.state.error.stack && (
                      <div>
                        <strong>Stack:</strong>
                        <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-32">
                          {this.state.error.stack}
                        </pre>
                      </div>
                    )}
                    {this.state.errorId && (
                      <div>
                        <strong>ID do erro:</strong> {this.state.errorId}
                      </div>
                    )}
                  </div>
                </details>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={this.handleRetry}
                  className="flex-1"
                  variant="default"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Tentar novamente
                </Button>

                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="flex-1"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Ir para início
                </Button>
              </div>

              <div className="text-center text-sm text-gray-500">
                Se o problema persistir, entre em contato conosco.
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook para usar Error Boundary em componentes funcionais
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: any) => void
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback} onError={onError}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`

  return WrappedComponent
}

// Error Boundary específico para páginas
export function PageErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Log específico para erros de página
        logger.error('Erro em página:', {
          error: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        })
      }}
    >
      {children}
    </ErrorBoundary>
  )
}

// Error Boundary específico para componentes admin
export function AdminErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <CardTitle className="text-red-900">Erro no Painel Admin</CardTitle>
              <CardDescription>
                Ocorreu um erro no painel administrativo. Tente atualizar a página.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <Button
                onClick={() => window.location.reload()}
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Recarregar página
              </Button>

              <div className="text-center">
                <Button
                  variant="link"
                  onClick={() => window.location.href = '/'}
                >
                  Voltar ao site
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      }
      onError={(error, errorInfo) => {
        // Log específico para admin
        logger.error('Erro no painel admin:', {
          error: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          adminUrl: window.location.pathname,
          timestamp: new Date().toISOString()
        })
      }}
    >
      {children}
    </ErrorBoundary>
  )
}
