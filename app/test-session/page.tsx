"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import Link from "next/link"

export default function TestSessionPage() {
  const [session, setSession] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkSession()
  }, [])

  const checkSession = async () => {
    try {
      // Verificar sessão
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      setSession(currentSession)
      
      // Verificar usuário
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      setUser(currentUser)
      
      console.log('📊 Session Check:', {
        session: currentSession,
        user: currentUser
      })
    } catch (error) {
      console.error('❌ Error checking session:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">🔍 Teste de Sessão</h1>
          <Link href="/">
            <Button variant="outline">← Voltar</Button>
          </Link>
        </div>

        {/* Status da Sessão */}
        <Card>
          <CardHeader>
            <CardTitle>
              {session ? '✅ Sessão Ativa' : '❌ Sem Sessão'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {session ? (
              <>
                <div>
                  <p className="font-semibold">Email:</p>
                  <p className="text-gray-600">{session.user?.email}</p>
                </div>
                <div>
                  <p className="font-semibold">User ID:</p>
                  <p className="text-gray-600 text-xs">{session.user?.id}</p>
                </div>
                <div>
                  <p className="font-semibold">Expires At:</p>
                  <p className="text-gray-600">
                    {new Date(session.expires_at! * 1000).toLocaleString('pt-BR')}
                  </p>
                </div>
                <Button onClick={handleLogout} variant="destructive">
                  Fazer Logout
                </Button>
              </>
            ) : (
              <>
                <p className="text-gray-600">Nenhuma sessão ativa encontrada.</p>
                <Link href="/login">
                  <Button>Fazer Login</Button>
                </Link>
              </>
            )}
          </CardContent>
        </Card>

        {/* Dados do Usuário */}
        {user && (
          <Card>
            <CardHeader>
              <CardTitle>👤 Dados do Usuário</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs">
                {JSON.stringify(user, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* Dados da Sessão */}
        {session && (
          <Card>
            <CardHeader>
              <CardTitle>🔐 Dados da Sessão</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs">
                {JSON.stringify(session, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* Botões de Teste */}
        <Card>
          <CardHeader>
            <CardTitle>🧪 Testes de Navegação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/perfil">
              <Button className="w-full">Ir para Perfil</Button>
            </Link>
            <Link href="/checkout">
              <Button className="w-full" variant="outline">Ir para Checkout</Button>
            </Link>
            <Link href="/meus-pedidos">
              <Button className="w-full" variant="outline">Ir para Meus Pedidos</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
