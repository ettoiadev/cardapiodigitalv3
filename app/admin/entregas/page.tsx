"use client"

import { useEffect, useState } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { Package, Truck, CheckCircle, Clock, User, Phone, MapPin } from "lucide-react"
import { AtribuirMotoboyModal } from "@/components/entregas/atribuir-motoboy-modal"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Pedido {
  id: string
  created_at: string
  nome_cliente?: string
  telefone_cliente?: string
  endereco_entrega?: string
  total: number
  status: string
  tipo_entrega: string
}

interface Entrega {
  id: string
  pedido_id: string
  motoboy_id?: string
  status: string
  horario_saida?: string
  horario_entrega?: string
  observacoes?: string
  pedidos?: Pedido
  motoboys?: {
    id: string
    nome: string
    telefone: string
  }
}

export default function EntregasPage() {
  const [entregas, setEntregas] = useState<Entrega[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEntrega, setSelectedEntrega] = useState<Entrega | null>(null)
  const [isAtribuirOpen, setIsAtribuirOpen] = useState(false)
  const [stats, setStats] = useState({
    pendentes: 0,
    emRota: 0,
    entregues: 0,
  })

  useEffect(() => {
    loadEntregas()
    
    // Configurar Realtime
    const channel = supabase
      .channel('entregas-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'entregas'
        },
        () => {
          console.log('Entregas atualizadas, recarregando...')
          loadEntregas()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const loadEntregas = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("entregas")
        .select(`
          *,
          pedidos (*),
          motoboys (id, nome, telefone)
        `)
        .order("criado_em", { ascending: false })

      if (error) throw error

      setEntregas(data || [])
      
      // Calcular estatísticas
      const pendentes = data?.filter(e => e.status === 'pendente').length || 0
      const emRota = data?.filter(e => e.status === 'em_rota').length || 0
      const entregues = data?.filter(e => e.status === 'entregue').length || 0
      
      setStats({ pendentes, emRota, entregues })
    } catch (error) {
      console.error("Erro ao carregar entregas:", error)
      toast.error("Erro ao carregar entregas")
    } finally {
      setLoading(false)
    }
  }

  const handleAtribuirMotoboy = (entrega: Entrega) => {
    setSelectedEntrega(entrega)
    setIsAtribuirOpen(true)
  }

  const handleIniciarEntrega = async (entregaId: string) => {
    try {
      const { error } = await supabase
        .from("entregas")
        .update({
          status: 'em_rota',
          horario_saida: new Date().toISOString()
        })
        .eq("id", entregaId)

      if (error) throw error

      toast.success("Entrega iniciada!")
      loadEntregas()
    } catch (error) {
      console.error("Erro ao iniciar entrega:", error)
      toast.error("Erro ao iniciar entrega")
    }
  }

  const handleConcluirEntrega = async (entregaId: string) => {
    try {
      const { error } = await supabase
        .from("entregas")
        .update({
          status: 'entregue',
          horario_entrega: new Date().toISOString()
        })
        .eq("id", entregaId)

      if (error) throw error

      toast.success("Entrega concluída!")
      loadEntregas()
    } catch (error) {
      console.error("Erro ao concluir entrega:", error)
      toast.error("Erro ao concluir entrega")
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const formatTime = (date?: string) => {
    if (!date) return "-"
    try {
      return format(new Date(date), "HH:mm", { locale: ptBR })
    } catch {
      return "-"
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      pendente: { label: "Pendente", className: "bg-yellow-100 text-yellow-800" },
      em_rota: { label: "Em Rota", className: "bg-blue-100 text-blue-800" },
      entregue: { label: "Entregue", className: "bg-green-100 text-green-800" },
      cancelada: { label: "Cancelada", className: "bg-red-100 text-red-800" },
    }

    const statusInfo = statusMap[status] || { label: status, className: "" }

    return (
      <Badge variant="secondary" className={statusInfo.className}>
        {statusInfo.label}
      </Badge>
    )
  }

  const EntregaCard = ({ entrega }: { entrega: Entrega }) => {
    const pedido = entrega.pedidos

    return (
      <Card className="mb-3 hover:shadow-md transition-shadow">
        <CardContent className="pt-4">
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2">
                <Package className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-semibold text-gray-900">
                    {pedido?.nome_cliente || "Cliente"}
                  </p>
                  {pedido?.telefone_cliente && (
                    <p className="text-sm text-gray-500 flex items-center">
                      <Phone className="h-3 w-3 mr-1" />
                      {pedido.telefone_cliente}
                    </p>
                  )}
                </div>
              </div>
              {getStatusBadge(entrega.status)}
            </div>

            {/* Endereço */}
            {pedido?.endereco_entrega && (
              <div className="flex items-start space-x-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p className="line-clamp-2">{pedido.endereco_entrega}</p>
              </div>
            )}

            {/* Motoboy */}
            {entrega.motoboys ? (
              <div className="flex items-center space-x-2 text-sm">
                <User className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-600">
                  {entrega.motoboys.nome}
                </span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <User className="h-4 w-4" />
                <span>Sem motoboy</span>
              </div>
            )}

            {/* Horários */}
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>Saída: {formatTime(entrega.horario_saida)}</span>
              </div>
              {entrega.horario_entrega && (
                <div className="flex items-center space-x-1">
                  <CheckCircle className="h-3 w-3" />
                  <span>Entrega: {formatTime(entrega.horario_entrega)}</span>
                </div>
              )}
            </div>

            {/* Valor */}
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-lg font-bold text-gray-900">
                {formatCurrency(pedido?.total || 0)}
              </span>

              {/* Actions */}
              <div className="flex space-x-2">
                {entrega.status === 'pendente' && !entrega.motoboy_id && (
                  <Button
                    size="sm"
                    onClick={() => handleAtribuirMotoboy(entrega)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Atribuir Motoboy
                  </Button>
                )}
                {entrega.status === 'pendente' && entrega.motoboy_id && (
                  <Button
                    size="sm"
                    onClick={() => handleIniciarEntrega(entrega.id)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Iniciar Entrega
                  </Button>
                )}
                {entrega.status === 'em_rota' && (
                  <Button
                    size="sm"
                    onClick={() => handleConcluirEntrega(entrega.id)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Concluir
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const entregasPendentes = entregas.filter(e => e.status === 'pendente')
  const entregasEmRota = entregas.filter(e => e.status === 'em_rota')
  const entregasEntregues = entregas.filter(e => e.status === 'entregue')

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Entregas</h1>
          <p className="text-gray-600 mt-1">Gerencie as entregas em tempo real</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{stats.pendentes}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Em Rota
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats.emRota}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Entregues Hoje
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.entregues}</div>
            </CardContent>
          </Card>
        </div>

        {/* Kanban */}
        {loading ? (
          <div className="text-center py-8 text-gray-500">Carregando entregas...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Coluna: Pendentes */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Clock className="h-5 w-5 text-yellow-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Pendentes ({entregasPendentes.length})
                </h2>
              </div>
              <div className="space-y-3">
                {entregasPendentes.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center text-gray-500">
                      Nenhuma entrega pendente
                    </CardContent>
                  </Card>
                ) : (
                  entregasPendentes.map(entrega => (
                    <EntregaCard key={entrega.id} entrega={entrega} />
                  ))
                )}
              </div>
            </div>

            {/* Coluna: Em Rota */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Truck className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Em Rota ({entregasEmRota.length})
                </h2>
              </div>
              <div className="space-y-3">
                {entregasEmRota.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center text-gray-500">
                      Nenhuma entrega em rota
                    </CardContent>
                  </Card>
                ) : (
                  entregasEmRota.map(entrega => (
                    <EntregaCard key={entrega.id} entrega={entrega} />
                  ))
                )}
              </div>
            </div>

            {/* Coluna: Entregues */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Entregues ({entregasEntregues.length})
                </h2>
              </div>
              <div className="space-y-3">
                {entregasEntregues.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center text-gray-500">
                      Nenhuma entrega concluída
                    </CardContent>
                  </Card>
                ) : (
                  entregasEntregues.slice(0, 10).map(entrega => (
                    <EntregaCard key={entrega.id} entrega={entrega} />
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Info Card */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <Truck className="h-5 w-5 text-blue-600 mt-0.5" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-blue-900 mb-1">
                  🔄 Atualização em Tempo Real
                </h3>
                <p className="text-sm text-blue-700">
                  Esta tela é atualizada automaticamente quando há mudanças nas entregas.
                  Não é necessário recarregar a página.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal */}
      <AtribuirMotoboyModal
        isOpen={isAtribuirOpen}
        onClose={() => {
          setIsAtribuirOpen(false)
          setSelectedEntrega(null)
        }}
        entrega={selectedEntrega}
        onSuccess={loadEntregas}
      />
    </AdminLayout>
  )
}
