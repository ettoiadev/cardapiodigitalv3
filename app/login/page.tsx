"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LogIn, Mail, Lock, ArrowLeft, Loader2 } from "lucide-react"
import { signIn, validateEmail } from "@/lib/auth"
import { toast } from "sonner"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnUrl = searchParams.get("returnUrl") || "/perfil"
  
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validações básicas
    if (!email.trim()) {
      toast.error("Por favor, informe seu email")
      return
    }

    if (!validateEmail(email)) {
      toast.error("Por favor, informe um email válido")
      return
    }

    if (!senha) {
      toast.error("Por favor, informe sua senha")
      return
    }

    setLoading(true)

    // Fazer login usando novo sistema
    const { data, error } = await signIn({
      email,
      senha
    })

    if (error) {
      toast.error(error)
      setLoading(false)
      return
    }

    // Sucesso!
    toast.success("Login realizado com sucesso!")
    
    // DEBUG: Logs extensivos
    console.log('✅ Login successful!')
    console.log('📍 Return URL:', returnUrl)
    console.log('🔐 Session data:', data)
    
    // CORREÇÃO: Aguardar sessão ser salva em localStorage
    console.log('⏳ Aguardando sessão ser salva...')
    
    // Verificar se sessão foi salva
    let attempts = 0
    const maxAttempts = 10
    const checkInterval = setInterval(() => {
      const sessionToken = localStorage.getItem('sb-auth-token')
      attempts++
      
      if (sessionToken) {
        console.log('✅ Sessão salva em localStorage!')
        console.log('🚀 Redirecionando para:', returnUrl)
        clearInterval(checkInterval)
        window.location.href = returnUrl
      } else if (attempts >= maxAttempts) {
        console.log('⚠️ Timeout aguardando sessão, tentando redirecionar mesmo assim...')
        clearInterval(checkInterval)
        window.location.href = returnUrl
      }
    }, 100)
    
    // Timeout de segurança (1 segundo)
    setTimeout(() => {
      clearInterval(checkInterval)
      console.log('🔄 Timeout atingido, forçando redirecionamento')
      window.location.href = returnUrl
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Botão Voltar */}
        <Link href="/">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para o cardápio
          </Button>
        </Link>

        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto w-12 h-12 bg-red-600 rounded-full flex items-center justify-center mb-2">
              <LogIn className="h-6 w-6 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold">Entrar</CardTitle>
            <CardDescription>
              Faça login para continuar seu pedido
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    disabled={loading}
                    autoFocus
                  />
                </div>
              </div>

              {/* Senha */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="senha">Senha</Label>
                  <Link 
                    href="/recuperar-senha" 
                    className="text-xs text-red-600 hover:text-red-700"
                  >
                    Esqueceu a senha?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="senha"
                    name="senha"
                    type="password"
                    placeholder="Digite sua senha"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Botão Entrar */}
              <Button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4 mr-2" />
                    Entrar
                  </>
                )}
              </Button>

              {/* Link para Cadastro */}
              <div className="text-center text-sm text-gray-600">
                Não tem uma conta?{" "}
                <Link href="/cadastro" className="text-red-600 hover:text-red-700 font-medium">
                  Criar conta
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Informações */}
        <div className="mt-4 text-center text-xs text-gray-500">
          <p>Ao fazer login, você concorda com nossos termos de uso</p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
