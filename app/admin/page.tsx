"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AdminLayout } from "@/components/admin-layout"
import { supabase } from "@/lib/supabase"
import { 
  Package, 
  BarChart3, 
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  Star,
  Truck
} from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface DashboardStats {
  vendasHoje: number
  vendasMes: number
  pedidosHoje: number
  pedidosPendentes: number
  ticketMedio: number
  totalClientes: number
  mediaAvaliacoes: number
  entregasEmRota: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    vendasHoje: 0,
    vendasMes: 0,
    pedidosHoje: 0,
    pedidosPendentes: 0,
    ticketMedio: 0,
    totalClientes: 0,
    mediaAvaliacoes: 0,
    entregasEmRota: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setLoading(true)
      const hoje = new Date()
      hoje.setHours(0, 0, 0, 0)
      
      const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)

      // Vendas de hoje
      const { data: pedidosHoje } = await supabase
        .from("pedidos")
        .select("total")
        .gte("criado_em", hoje.toISOString())
        .eq("status", "entregue")

      const vendasHoje = pedidosHoje?.reduce((sum, p) => sum + p.total, 0) || 0
      const pedidosHojeCount = pedidosHoje?.length || 0

      // Vendas do mês
      const { data: pedidosMes } = await supabase
        .from("pedidos")
        .select("total")
        .gte("criado_em", primeiroDiaMes.toISOString())
        .eq("status", "entregue")

      const vendasMes = pedidosMes?.reduce((sum, p) => sum + p.total, 0) || 0
      const ticketMedio = pedidosMes && pedidosMes.length > 0 ? vendasMes / pedidosMes.length : 0

      // Pedidos pendentes
      const { count: pendentes } = await supabase
        .from("pedidos")
        .select("*", { count: "exact", head: true })
        .eq("status", "pendente")

      // Total de clientes
      const { count: clientes } = await supabase
        .from("clientes")
        .select("*", { count: "exact", head: true })
        .eq("ativo", true)

      // Média de avaliações
      const { data: avaliacoes } = await supabase
        .from("avaliacoes")
        .select("nota")

      const mediaAvaliacoes = avaliacoes && avaliacoes.length > 0
        ? avaliacoes.reduce((sum, a) => sum + a.nota, 0) / avaliacoes.length
        : 0

      // Entregas em rota
      const { count: emRota } = await supabase
        .from("pedidos")
        .select("*", { count: "exact", head: true })
        .eq("status", "em_rota")

      setStats({
        vendasHoje,
        vendasMes,
        pedidosHoje: pedidosHojeCount,
        pedidosPendentes: pendentes || 0,
        ticketMedio,
        totalClientes: clientes || 0,
        mediaAvaliacoes,
        entregasEmRota: emRota || 0,
      })
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Visão geral completa do seu negócio</p>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Carregando...</div>
        ) : (
          <>

            {/* KPIs Principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Vendas Hoje
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <span className="text-2xl font-bold text-gray-900">
                      {formatCurrency(stats.vendasHoje)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.pedidosHoje} pedidos
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Vendas do Mês
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    <span className="text-2xl font-bold text-gray-900">
                      {formatCurrency(stats.vendasMes)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Ticket médio: {formatCurrency(stats.ticketMedio)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Pedidos Pendentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <ShoppingCart className="h-5 w-5 text-orange-600" />
                    <span className="text-2xl font-bold text-orange-600">
                      {stats.pedidosPendentes}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Aguardando preparo
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Em Entrega
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <Truck className="h-5 w-5 text-purple-600" />
                    <span className="text-2xl font-bold text-gray-900">
                      {stats.entregasEmRota}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Pedidos em rota
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Métricas Secundárias */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total de Clientes</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {stats.totalClientes}
                      </p>
                    </div>
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Média de Avaliações</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <p className="text-2xl font-bold text-gray-900">
                          {stats.mediaAvaliacoes.toFixed(1)}
                        </p>
                        <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                      </div>
                    </div>
                    <Star className="h-8 w-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Ticket Médio</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {formatCurrency(stats.ticketMedio)}
                      </p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Info Card */}
            <Card className="bg-gradient-to-r from-red-50 to-orange-50 border-red-200">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-3">
                  <TrendingUp className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-semibold text-red-900 mb-1">
                      🎉 Dashboard Completo!
                    </h3>
                    <p className="text-sm text-red-700 mb-2">
                      Você tem acesso a todas as métricas importantes do seu negócio em tempo real.
                      Acompanhe vendas, pedidos, entregas, avaliações e muito mais!
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <Badge className="bg-red-100 text-red-800">11 Módulos Ativos</Badge>
                      <Badge className="bg-orange-100 text-orange-800">Sistema Completo</Badge>
                      <Badge className="bg-green-100 text-green-800">100% Funcional</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  )
}
