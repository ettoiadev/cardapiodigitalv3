"use client"

import { useEffect, useState } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { DollarSign, TrendingUp, TrendingDown, Calendar, Plus, X } from "lucide-react"
import { LancamentoFormModal } from "@/components/caixa/lancamento-form-modal"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Caixa {
  id: string
  data_abertura: string
  data_fechamento?: string
  saldo_inicial: number
  saldo_final?: number
  status: string
  observacoes?: string
}

interface Lancamento {
  id: string
  caixa_id: string
  tipo: string
  categoria: string
  valor: number
  descricao?: string
  criado_em: string
}

export default function CaixaPage() {
  const [caixaAtual, setCaixaAtual] = useState<Caixa | null>(null)
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([])
  const [loading, setLoading] = useState(true)
  const [isLancamentoOpen, setIsLancamentoOpen] = useState(false)
  const [saldoInicial, setSaldoInicial] = useState("")
  const [stats, setStats] = useState({
    entradas: 0,
    saidas: 0,
    saldoAtual: 0,
  })

  useEffect(() => {
    loadCaixaAtual()
  }, [])

  const loadCaixaAtual = async () => {
    try {
      setLoading(true)
      
      // Buscar caixa aberto
      const { data: caixa, error: caixaError } = await supabase
        .from("caixas")
        .select("*")
        .eq("status", "aberto")
        .order("data_abertura", { ascending: false })
        .limit(1)
        .single()

      if (caixaError && caixaError.code !== 'PGRST116') {
        throw caixaError
      }

      setCaixaAtual(caixa || null)

      if (caixa) {
        await loadLancamentos(caixa.id)
      }
    } catch (error) {
      console.error("Erro ao carregar caixa:", error)
      toast.error("Erro ao carregar caixa")
    } finally {
      setLoading(false)
    }
  }

  const loadLancamentos = async (caixaId: string) => {
    try {
      const { data, error } = await supabase
        .from("lancamentos")
        .select("*")
        .eq("caixa_id", caixaId)
        .order("criado_em", { ascending: false })

      if (error) throw error

      setLancamentos(data || [])

      // Calcular estatísticas
      const entradas = data?.filter(l => l.tipo === 'entrada').reduce((sum, l) => sum + l.valor, 0) || 0
      const saidas = data?.filter(l => l.tipo === 'saida').reduce((sum, l) => sum + l.valor, 0) || 0
      const saldoAtual = (caixaAtual?.saldo_inicial || 0) + entradas - saidas

      setStats({ entradas, saidas, saldoAtual })
    } catch (error) {
      console.error("Erro ao carregar lançamentos:", error)
      toast.error("Erro ao carregar lançamentos")
    }
  }

  const handleAbrirCaixa = async () => {
    if (!saldoInicial || parseFloat(saldoInicial) < 0) {
      toast.error("Informe um saldo inicial válido")
      return
    }

    try {
      const { data, error } = await supabase
        .from("caixas")
        .insert([{
          data_abertura: new Date().toISOString(),
          saldo_inicial: parseFloat(saldoInicial),
          status: 'aberto'
        }])
        .select()
        .single()

      if (error) throw error

      toast.success("Caixa aberto com sucesso!")
      setCaixaAtual(data)
      setSaldoInicial("")
      setLancamentos([])
      setStats({ entradas: 0, saidas: 0, saldoAtual: parseFloat(saldoInicial) })
    } catch (error) {
      console.error("Erro ao abrir caixa:", error)
      toast.error("Erro ao abrir caixa")
    }
  }

  const handleFecharCaixa = async () => {
    if (!caixaAtual) return

    if (!confirm("Deseja realmente fechar o caixa? Esta ação não pode ser desfeita.")) {
      return
    }

    try {
      const { error } = await supabase
        .from("caixas")
        .update({
          data_fechamento: new Date().toISOString(),
          saldo_final: stats.saldoAtual,
          status: 'fechado'
        })
        .eq("id", caixaAtual.id)

      if (error) throw error

      toast.success("Caixa fechado com sucesso!")
      setCaixaAtual(null)
      setLancamentos([])
      setStats({ entradas: 0, saidas: 0, saldoAtual: 0 })
    } catch (error) {
      console.error("Erro ao fechar caixa:", error)
      toast.error("Erro ao fechar caixa")
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const formatDateTime = (date: string) => {
    try {
      return format(new Date(date), "dd/MM/yyyy HH:mm", { locale: ptBR })
    } catch {
      return "-"
    }
  }

  const getCategoriaLabel = (categoria: string) => {
    const categorias: Record<string, string> = {
      venda: "Venda",
      taxa_entrega: "Taxa de Entrega",
      sangria: "Sangria",
      suprimento: "Suprimento",
      despesa: "Despesa",
      outros: "Outros",
    }
    return categorias[categoria] || categoria
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Caixa</h1>
            <p className="text-gray-600 mt-1">Gerencie o fluxo de caixa diário</p>
          </div>
          {caixaAtual && (
            <Button
              onClick={handleFecharCaixa}
              variant="outline"
              className="border-red-600 text-red-600 hover:bg-red-50"
            >
              <X className="h-4 w-4 mr-2" />
              Fechar Caixa
            </Button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Carregando...</div>
        ) : !caixaAtual ? (
          /* Caixa Fechado - Abertura */
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Abrir Caixa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Saldo Inicial
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={saldoInicial}
                    onChange={(e) => setSaldoInicial(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="0,00"
                  />
                </div>
              </div>
              <Button
                onClick={handleAbrirCaixa}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Abrir Caixa
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* Caixa Aberto */
          <>
            {/* Info do Caixa */}
            <Card className="bg-gradient-to-r from-red-600 to-red-700 text-white">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90">Caixa Aberto em</p>
                    <p className="text-lg font-semibold">
                      {formatDateTime(caixaAtual.data_abertura)}
                    </p>
                  </div>
                  <Badge className="bg-white text-red-600">Aberto</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Saldo Inicial
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-5 w-5 text-gray-400" />
                    <span className="text-2xl font-bold text-gray-900">
                      {formatCurrency(caixaAtual.saldo_inicial)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Entradas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <span className="text-2xl font-bold text-green-600">
                      {formatCurrency(stats.entradas)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Saídas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <TrendingDown className="h-5 w-5 text-red-600" />
                    <span className="text-2xl font-bold text-red-600">
                      {formatCurrency(stats.saidas)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-blue-50 border-blue-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-blue-900">
                    Saldo Atual
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-5 w-5 text-blue-600" />
                    <span className="text-2xl font-bold text-blue-900">
                      {formatCurrency(stats.saldoAtual)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Lançamentos */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Lançamentos</CardTitle>
                  <Button
                    onClick={() => setIsLancamentoOpen(true)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Lançamento
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {lancamentos.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Nenhum lançamento registrado
                  </div>
                ) : (
                  <div className="space-y-3">
                    {lancamentos.map((lancamento) => (
                      <div
                        key={lancamento.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center space-x-4">
                          <div
                            className={`h-10 w-10 rounded-full flex items-center justify-center ${
                              lancamento.tipo === 'entrada'
                                ? 'bg-green-100'
                                : 'bg-red-100'
                            }`}
                          >
                            {lancamento.tipo === 'entrada' ? (
                              <TrendingUp className="h-5 w-5 text-green-600" />
                            ) : (
                              <TrendingDown className="h-5 w-5 text-red-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {getCategoriaLabel(lancamento.categoria)}
                            </p>
                            {lancamento.descricao && (
                              <p className="text-sm text-gray-500">
                                {lancamento.descricao}
                              </p>
                            )}
                            <p className="text-xs text-gray-400">
                              {formatDateTime(lancamento.criado_em)}
                            </p>
                          </div>
                        </div>
                        <div
                          className={`text-lg font-bold ${
                            lancamento.tipo === 'entrada'
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        >
                          {lancamento.tipo === 'entrada' ? '+' : '-'}
                          {formatCurrency(lancamento.valor)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-3">
                  <Calendar className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-semibold text-blue-900 mb-1">
                      💡 Dica: Fechamento de Caixa
                    </h3>
                    <p className="text-sm text-blue-700">
                      Ao fechar o caixa, o saldo final será calculado automaticamente
                      e não será mais possível adicionar lançamentos. Certifique-se de
                      que todos os lançamentos foram registrados antes de fechar.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Modal */}
      {caixaAtual && (
        <LancamentoFormModal
          isOpen={isLancamentoOpen}
          onClose={() => setIsLancamentoOpen(false)}
          caixaId={caixaAtual.id}
          onSuccess={() => {
            setIsLancamentoOpen(false)
            loadLancamentos(caixaAtual.id)
          }}
        />
      )}
    </AdminLayout>
  )
}
