"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import { AlertCircle, RefreshCw, Wifi, WifiOff } from "lucide-react"
import { isSupabaseConfigured } from "@/lib/supabase"

export default function AdminLoginPage() {
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [isConfigured, setIsConfigured] = useState(true)
  const [testingConnection, setTestingConnection] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null)
  const { login, connectionTest } = useAuth()
  const router = useRouter()

  // Verificar configuração do Supabase ao carregar a página
  React.useEffect(() => {
    const checkConfig = () => {
      const configured = isSupabaseConfigured()
      setIsConfigured(configured)
      if (!configured) {
        setError("Sistema não configurado. Entre em contato com o administrador técnico.")
      }
    }
    checkConfig()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // Verificar se o Supabase está configurado
    if (!isSupabaseConfigured()) {
      setError("Sistema não configurado. Verifique as variáveis de ambiente do Supabase.")
      setLoading(false)
      return
    }

    try {
      const success = await login(email, senha)
      if (success) {
        router.push("/admin")
      } else {
        setError("Email ou senha incorretos")
      }
    } catch (error) {
      console.error("Erro durante login:", error)
      if (error instanceof Error) {
        if (error.message.includes("network") || error.message.includes("fetch")) {
          setError("Erro de conexão. Verifique sua internet e tente novamente.")
        } else if (error.message.includes("CORS") || error.message.includes("origin")) {
          setError("Erro de configuração do servidor. Entre em contato com o suporte.")
        } else {
          setError("Erro interno do sistema. Tente novamente.")
        }
      } else {
        setError("Erro inesperado. Tente novamente.")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRetry = () => {
    setError("")
    setConnectionStatus(null)
    const configured = isSupabaseConfigured()
    setIsConfigured(configured)
    if (!configured) {
      setError("Sistema ainda não configurado. Entre em contato com o administrador técnico.")
    }
  }

  const handleTestConnection = async () => {
    setTestingConnection(true)
    setConnectionStatus(null)
    
    try {
      const result = await connectionTest()
      if (result.success) {
        setConnectionStatus(`✅ ${result.message}${result.hasData ? ' - Dados encontrados' : ' - Banco vazio'}`)
        setError("")
      } else {
        setConnectionStatus(`❌ ${result.error}: ${result.details}`)
        setError(result.error)
      }
    } catch (error) {
      setConnectionStatus("❌ Erro ao testar conexão")
      setError("Falha no teste de conectividade")
    } finally {
      setTestingConnection(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card shadow-xl border-border rounded-2xl">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold text-foreground">
            Painel Administrativo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-muted-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-lg py-6"
                required
                disabled={!isConfigured || loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="senha" className="text-muted-foreground">Senha</Label>
              <Input
                id="senha"
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Sua senha"
                className="rounded-lg py-6"
                required
                disabled={!isConfigured || loading}
              />
            </div>
            
            {/* Status da conexão */}
            {connectionStatus && (
              <div className={`p-3 rounded-lg text-sm ${
                connectionStatus.startsWith('✅') 
                  ? 'bg-primary/10 text-primary border border-primary/20' 
                  : 'bg-destructive/10 text-destructive border border-destructive/20'
              }`}>
                {connectionStatus}
              </div>
            )}

            {error && (
              <div className="flex items-center space-x-2 text-destructive text-sm bg-destructive/10 p-3 rounded-lg border border-destructive/20">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span className="flex-1">{error}</span>
                {!isConfigured && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRetry}
                    className="text-destructive hover:bg-destructive/20 p-1 h-auto"
                  >
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                )}
              </div>
            )}

            <div className="space-y-3 pt-4">
              <Button 
                type="submit" 
                className="w-full py-6 text-base font-semibold" 
                disabled={loading || !isConfigured}
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Entrando...
                  </>
                ) : "Entrar"}
              </Button>

              {/* Botão de teste de conectividade */}
              <Button
                type="button"
                variant="outline"
                className="w-full py-6 text-base"
                onClick={handleTestConnection}
                disabled={testingConnection}
              >
                {testingConnection ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Testando...
                  </>
                ) : (
                  <>
                    {isConfigured ? (
                      <Wifi className="h-4 w-4 mr-2" />
                    ) : (
                      <WifiOff className="h-4 w-4 mr-2" />
                    )}
                    Testar Conexão
                  </>
                )}
              </Button>
            </div>

            {/* Informações adicionais */}
            <div className="text-center space-y-2 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Sistema de gerenciamento de cardápio digital
              </p>
              <div className="flex justify-center items-center gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  {isConfigured ? (
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                  ) : (
                    <div className="w-2 h-2 bg-destructive rounded-full"></div>
                  )}
                  {isConfigured ? "Sistema configurado" : "Sistema não configurado"}
                </span>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
