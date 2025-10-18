"use client"

import { useEffect, useState } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { BarChart3, TrendingUp, Package, Clock, Download, Calendar } from "lucide-react"
import { toast } from "sonner"
import { format, subDays, startOfDay, endOfDay } from "date-fns"
import { ptBR } from "date-fns/locale"

interface VendaPorProduto {
  produto_id: string
  nome_produto: string
  quantidade: number
  total: number
}

interface VendaPorDia {
  data: string
  total_vendas: number
  quantidade_pedidos: number
}

interface VendaPorHorario {
  hora: number
  quantidade: number
}

export default function RelatoriosPage() {
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState(7) // últimos 7 dias
  const [stats, setStats] = useState({
    totalVendas: 0,
    totalPedidos: 0,
    ticketMedio: 0,
    produtoMaisVendido: "",
  })
  const [produtosMaisVendidos, setProdutosMaisVendidos] = useState<VendaPorProduto[]>([])
  const [vendasPorDia, setVendasPorDia] = useState<VendaPorDia[]>([])
  const [vendasPorHorario, setVendasPorHorario] = useState<VendaPorHorario[]>([])

  useEffect(() => {
    loadRelatorios()
  }, [periodo])

  const loadRelatorios = async () => {
    try {
      setLoading(true)
      
      const dataInicio = startOfDay(subDays(new Date(), periodo))
      const dataFim = endOfDay(new Date())

      // Buscar pedidos do período
      const { data: pedidos, error: pedidosError } = await supabase
        .from("pedidos")
        .select(`
          id,
          total,
          created_at,
          pedido_itens (
            produto_id,
            quantidade,
            produtos (nome)
          )
        `)
        .gte("created_at", dataInicio.toISOString())
        .lte("created_at", dataFim.toISOString())
        .eq("status", "finalizado")

      if (pedidosError) throw pedidosError

      // Calcular estatísticas gerais
      const totalVendas = pedidos?.reduce((sum, p) => sum + p.total, 0) || 0
      const totalPedidos = pedidos?.length || 0
      const ticketMedio = totalPedidos > 0 ? totalVendas / totalPedidos : 0

      // Produtos mais vendidos
      const produtosMap = new Map<string, VendaPorProduto>()
      pedidos?.forEach(pedido => {
        pedido.pedido_itens?.forEach((item: any) => {
          const key = item.produto_id
          if (!produtosMap.has(key)) {
            produtosMap.set(key, {
              produto_id: key,
              nome_produto: item.produtos?.nome || "Produto",
              quantidade: 0,
              total: 0,
            })
          }
          const produto = produtosMap.get(key)!
          produto.quantidade += item.quantidade
        })
      })

      const produtosArray = Array.from(produtosMap.values())
        .sort((a, b) => b.quantidade - a.quantidade)
        .slice(0, 10)

      setProdutosMaisVendidos(produtosArray)

      const produtoMaisVendido = produtosArray[0]?.nome_produto || "N/A"

      // Vendas por dia
      const vendasDiaMap = new Map<string, VendaPorDia>()
      pedidos?.forEach(pedido => {
        const data = format(new Date(pedido.created_at), "dd/MM", { locale: ptBR })
        if (!vendasDiaMap.has(data)) {
          vendasDiaMap.set(data, {
            data,
            total_vendas: 0,
            quantidade_pedidos: 0,
          })
        }
        const venda = vendasDiaMap.get(data)!
        venda.total_vendas += pedido.total
        venda.quantidade_pedidos += 1
      })

      const vendasDiaArray = Array.from(vendasDiaMap.values())
        .sort((a, b) => {
          const [diaA, mesA] = a.data.split('/').map(Number)
          const [diaB, mesB] = b.data.split('/').map(Number)
          return mesA !== mesB ? mesA - mesB : diaA - diaB
        })

      setVendasPorDia(vendasDiaArray)

      // Vendas por horário
      const horariosMap = new Map<number, number>()
      for (let i = 0; i < 24; i++) {
        horariosMap.set(i, 0)
      }
      pedidos?.forEach(pedido => {
        const hora = new Date(pedido.created_at).getHours()
        horariosMap.set(hora, (horariosMap.get(hora) || 0) + 1)
      })

      const horariosArray = Array.from(horariosMap.entries())
        .map(([hora, quantidade]) => ({ hora, quantidade }))
        .filter(h => h.quantidade > 0)

      setVendasPorHorario(horariosArray)

      setStats({
        totalVendas,
        totalPedidos,
        ticketMedio,
        produtoMaisVendido,
      })
    } catch (error) {
      console.error("Erro ao carregar relatórios:", error)
      toast.error("Erro ao carregar relatórios")
    } finally {
      setLoading(false)
    }
  }

  const handleExportar = () => {
    try {
      // Criar CSV
      let csv = "Relatório de Vendas\n\n"
      csv += `Período: Últimos ${periodo} dias\n\n`
      csv += `Total de Vendas: ${formatCurrency(stats.totalVendas)}\n`
      csv += `Total de Pedidos: ${stats.totalPedidos}\n`
      csv += `Ticket Médio: ${formatCurrency(stats.ticketMedio)}\n\n`
      
      csv += "Produtos Mais Vendidos\n"
      csv += "Produto,Quantidade\n"
      produtosMaisVendidos.forEach(p => {
        csv += `${p.nome_produto},${p.quantidade}\n`
      })

      // Download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `relatorio_vendas_${format(new Date(), 'dd-MM-yyyy')}.csv`
      link.click()

      toast.success("Relatório exportado com sucesso!")
    } catch (error) {
      console.error("Erro ao exportar:", error)
      toast.error("Erro ao exportar relatório")
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const getMaxVendas = () => {
    return Math.max(...vendasPorDia.map(v => v.total_vendas), 1)
  }

  const getMaxHorario = () => {
    return Math.max(...vendasPorHorario.map(v => v.quantidade), 1)
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Relatórios e Analytics</h1>
            <p className="text-gray-600 mt-1">Análise de desempenho e vendas</p>
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={periodo}
              onChange={(e) => setPeriodo(Number(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value={7}>Últimos 7 dias</option>
              <option value={15}>Últimos 15 dias</option>
              <option value={30}>Últimos 30 dias</option>
              <option value={90}>Últimos 90 dias</option>
            </select>
            <Button
              onClick={handleExportar}
              variant="outline"
              className="border-red-600 text-red-600 hover:bg-red-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Carregando relatórios...</div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Total de Vendas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <span className="text-2xl font-bold text-gray-900">
                      {formatCurrency(stats.totalVendas)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Total de Pedidos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    <span className="text-2xl font-bold text-gray-900">
                      {stats.totalPedidos}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Ticket Médio
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                    <span className="text-2xl font-bold text-gray-900">
                      {formatCurrency(stats.ticketMedio)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Mais Vendido
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <Package className="h-5 w-5 text-orange-600" />
                    <span className="text-lg font-bold text-gray-900 truncate">
                      {stats.produtoMaisVendido}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Vendas por Dia */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-red-600" />
                    <span>Vendas por Dia</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {vendasPorDia.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      Nenhuma venda no período
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {vendasPorDia.map((venda) => (
                        <div key={venda.data} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-gray-700">{venda.data}</span>
                            <span className="font-bold text-gray-900">
                              {formatCurrency(venda.total_vendas)}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-red-600 h-2 rounded-full transition-all"
                              style={{
                                width: `${(venda.total_vendas / getMaxVendas()) * 100}%`,
                              }}
                            />
                          </div>
                          <p className="text-xs text-gray-500">
                            {venda.quantidade_pedidos} pedidos
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Produtos Mais Vendidos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Package className="h-5 w-5 text-red-600" />
                    <span>Top 10 Produtos</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {produtosMaisVendidos.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      Nenhum produto vendido
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {produtosMaisVendidos.map((produto, index) => (
                        <div key={produto.produto_id} className="flex items-center space-x-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-red-600">
                              {index + 1}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {produto.nome_produto}
                            </p>
                            <p className="text-xs text-gray-500">
                              {produto.quantidade} unidades
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Horários de Pico */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-red-600" />
                    <span>Horários de Pico</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {vendasPorHorario.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      Nenhuma venda no período
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {vendasPorHorario.map((horario) => (
                        <div key={horario.hora} className="text-center">
                          <div className="mb-2">
                            <div
                              className="bg-red-600 rounded-t-lg mx-auto transition-all"
                              style={{
                                height: `${(horario.quantidade / getMaxHorario()) * 100}px`,
                                minHeight: '20px',
                                width: '40px',
                              }}
                            />
                          </div>
                          <p className="text-xs font-medium text-gray-700">
                            {horario.hora}h
                          </p>
                          <p className="text-xs text-gray-500">
                            {horario.quantidade}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Info Card */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-3">
                  <BarChart3 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-semibold text-blue-900 mb-1">
                      💡 Dica: Análise de Dados
                    </h3>
                    <p className="text-sm text-blue-700">
                      Use os relatórios para identificar padrões de venda, horários de maior
                      movimento e produtos mais populares. Ajuste seu estoque e equipe com base
                      nessas informações.
                    </p>
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
