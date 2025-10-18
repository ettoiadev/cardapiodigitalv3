"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { KeyRound, Mail, ArrowLeft, Loader2, CheckCircle } from "lucide-react"
import { resetPassword } from "@/lib/auth-helpers"
import { toast } from "sonner"

export default function RecuperarSenhaPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [emailEnviado, setEmailEnviado] = useState(false)
  const [email, setEmail] = useState("")

  const validateForm = () => {
    if (!email.trim()) {
      toast.error("Por favor, informe seu email")
      return false
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Por favor, informe um email válido")
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)

    try {
      const { error } = await resetPassword(email)

      if (error) {
        toast.error(error)
        return
      }

      setEmailEnviado(true)
      toast.success("Email de recuperação enviado!")

    } catch (error: any) {
      console.error("Erro ao recuperar senha:", error)
      toast.error("Erro ao enviar email. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  if (emailEnviado) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-xl border-0">
            <CardHeader className="space-y-1 text-center">
              <div className="mx-auto w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mb-2">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold">Email Enviado!</CardTitle>
              <CardDescription>
                Verifique sua caixa de entrada
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="text-center text-sm text-gray-600 space-y-2">
                <p>
                  Enviamos um link de recuperação de senha para:
                </p>
                <p className="font-medium text-gray-900">{email}</p>
                <p className="text-xs text-gray-500 mt-4">
                  Não recebeu o email? Verifique sua pasta de spam ou tente novamente em alguns minutos.
                </p>
              </div>

              <div className="space-y-2">
                <Button
                  onClick={() => setEmailEnviado(false)}
                  variant="outline"
                  className="w-full"
                >
                  Enviar novamente
                </Button>

                <Link href="/login" className="block">
                  <Button className="w-full bg-red-600 hover:bg-red-700">
                    Voltar para o login
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Botão Voltar */}
        <Link href="/login">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para o login
          </Button>
        </Link>

        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto w-12 h-12 bg-red-600 rounded-full flex items-center justify-center mb-2">
              <KeyRound className="h-6 w-6 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold">Recuperar Senha</CardTitle>
            <CardDescription>
              Informe seu email para receber o link de recuperação
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

              {/* Botão Enviar */}
              <Button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Enviar Link de Recuperação
                  </>
                )}
              </Button>

              {/* Link para Login */}
              <div className="text-center text-sm text-gray-600">
                Lembrou sua senha?{" "}
                <Link href="/login" className="text-red-600 hover:text-red-700 font-medium">
                  Fazer login
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Informações */}
        <div className="mt-4 text-center text-xs text-gray-500">
          <p>O link de recuperação expira em 1 hora</p>
        </div>
      </div>
    </div>
  )
}
