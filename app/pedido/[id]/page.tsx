"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle, 
  ChefHat, 
  Bike, 
  MapPin, 
  CreditCard,
  Phone,
  User,
  Package,
  Loader2,
  Home,
  List
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { formatCurrency } from "@/lib/currency-utils"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Pedido {
  id: string
  numero_pedido: string
  status: string
  tipo_entrega: string
  nome_cliente: string
  telefone_cliente: string
  endereco_rua?: string
  endereco_numero?: string
  endereco_bairro?: string
  endereco_cidade?: string
  endereco_estado?: string
  endereco_cep?: string
  endereco_complemento?: string
  forma_pagamento: string
  subtotal: number
  taxa_entrega: number
  total: number
  troco_para?: number
  observacoes?: string
  created_at: string
  confirmado_em?: string
  finalizado_em?: string
}

interface PedidoItem {
  id: string
  nome_produto: string
  tamanho?: string
  quantidade: number
  preco_unitario: number
  preco_total: number
  sabores?: any
  observacoes?: string
}

export default function PedidoPage() {
  const router = useRouter()
  const params = useParams()
  const pedidoId = params?.id as string
  
  const [loading, setLoading] = useState(true)
  const [pedido, setPedido] = useState<Pedido | null>(null)
  const [itens, setItens] = useState<PedidoItem[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (pedidoId) {
      loadPedido()
      
      // Configurar Realtime para atualizar status automaticamente
      const channel = supabase
        .channel(`pedido-${pedidoId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'pedidos',
            filter: `id=eq.${pedidoId}`
          },
          (payload) => {
            console.log('🔄 Pedido atualizado:', payload)
            setPedido(payload.new as Pedido)
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [pedidoId])

  const loadPedido = async () => {
    try {
      setLoading(true)
      setError(null)

      // Buscar pedido
      const { data: pedidoData, error: pedidoError } = await supabase
        .from("pedidos")
        .select("*")
        .eq("id", pedidoId)
        .single()

      if (pedidoError) throw pedidoError

      if (!pedidoData) {
        setError("Pedido não encontrado")
        return
      }

      setPedido(pedidoData)

      // Buscar itens do pedido
      const { data: itensData, error: itensError } = await supabase
        .from("pedido_itens")
        .select("*")
        .eq("pedido_id", pedidoId)

      if (itensError) throw itensError

      setItens(itensData || [])
    } catch (error) {
      console.error("Erro ao carregar pedido:", error)
      setError("Erro ao carregar pedido")
    } finally {
      setLoading(false)
    }
  }

  // Configuração de status
  const statusConfig = {
    pendente: {
      label: "Pedido Recebido",
      icon: Clock,
      color: "bg-yellow-100 text-yellow-800 border-yellow-300",
      description: "Aguardando confirmação"
    },
    em_preparo: {
      label: "Em Preparo",
      icon: ChefHat,
      color: "bg-blue-100 text-blue-800 border-blue-300",
      description: "Estamos preparando seu pedido"
    },
    saiu_entrega: {
      label: "Saiu para Entrega",
      icon: Bike,
      color: "bg-purple-100 text-purple-800 border-purple-300",
      description: "Pedido a caminho"
    },
    finalizado: {
      label: "Entregue",
      icon: CheckCircle,
      color: "bg-green-100 text-green-800 border-green-300",
      description: "Pedido finalizado"
    },
    cancelado: {
      label: "Cancelado",
      icon: Clock,
      color: "bg-red-100 text-red-800 border-red-300",
      description: "Pedido cancelado"
    }
  }

  // Timeline de status
  const getTimeline = () => {
    const statuses = ['pendente', 'em_preparo', 'saiu_entrega', 'finalizado']
    const currentIndex = statuses.indexOf(pedido?.status || 'pendente')
    
    return statuses.map((status, index) => ({
      status,
      label: statusConfig[status as keyof typeof statusConfig].label,
      icon: statusConfig[status as keyof typeof statusConfig].icon,
      completed: index <= currentIndex,
      active: status === pedido?.status
    }))
  }

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-red-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando pedido...</p>
        </div>
      </div>
    )
  }

  // Erro
  if (error || !pedido) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Pedido não encontrado</h2>
            <p className="text-gray-600 mb-6">
              Não foi possível encontrar este pedido
            </p>
            <Link href="/">
              <Button className="w-full">
                <Home className="w-4 h-4 mr-2" />
                Voltar ao Cardápio
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const StatusIcon = statusConfig[pedido.status as keyof typeof statusConfig].icon

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div className="text-right">
            <p className="text-sm text-gray-500">Pedido</p>
            <p className="font-bold text-red-600">{pedido.numero_pedido}</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Status Atual */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center mb-6">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${statusConfig[pedido.status as keyof typeof statusConfig].color}`}>
                <StatusIcon className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold mb-2">
                {statusConfig[pedido.status as keyof typeof statusConfig].label}
              </h2>
              <p className="text-gray-600">
                {statusConfig[pedido.status as keyof typeof statusConfig].description}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Pedido realizado em {format(new Date(pedido.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>

            {/* Timeline */}
            <div className="space-y-4">
              {getTimeline().map((item, index) => {
                const Icon = item.icon
                return (
                  <div key={item.status} className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                      item.completed 
                        ? 'bg-green-500 border-green-500' 
                        : 'bg-gray-200 border-gray-300'
                    }`}>
                      {item.completed ? (
                        <CheckCircle className="w-5 h-5 text-white" />
                      ) : (
                        <Icon className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={`font-semibold ${
                        item.completed ? 'text-green-600' : 'text-gray-400'
                      }`}>
                        {item.label}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Itens do Pedido */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Itens do Pedido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {itens.map((item) => (
                <div key={item.id} className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-semibold">{item.quantidade}x {item.nome_produto}</p>
                    {item.tamanho && (
                      <p className="text-sm text-gray-500 capitalize">{item.tamanho}</p>
                    )}
                    {item.sabores && Array.isArray(item.sabores) && item.sabores.length > 0 && (
                      <p className="text-sm text-gray-600">
                        {item.sabores.map((s: any) => s.nome || s).join(', ')}
                      </p>
                    )}
                    {item.observacoes && (
                      <p className="text-sm text-gray-500 italic">{item.observacoes}</p>
                    )}
                  </div>
                  <p className="font-semibold">{formatCurrency(item.preco_total)}</p>
                </div>
              ))}
            </div>

            <Separator className="my-4" />

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span>{formatCurrency(pedido.subtotal)}</span>
              </div>
              {pedido.taxa_entrega > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Taxa de Entrega</span>
                  <span>{formatCurrency(pedido.taxa_entrega)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-red-600">{formatCurrency(pedido.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informações de Entrega */}
        {pedido.tipo_entrega === "delivery" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Endereço de Entrega
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold">{pedido.nome_cliente}</p>
              <p className="text-gray-600">
                {pedido.endereco_rua}, {pedido.endereco_numero}
              </p>
              {pedido.endereco_complemento && (
                <p className="text-gray-600">{pedido.endereco_complemento}</p>
              )}
              <p className="text-gray-600">
                {pedido.endereco_bairro} - {pedido.endereco_cidade}/{pedido.endereco_estado}
              </p>
              <p className="text-gray-600">CEP: {pedido.endereco_cep}</p>
              <p className="text-gray-600 mt-2">
                <Phone className="w-4 h-4 inline mr-1" />
                {pedido.telefone_cliente}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Informações de Pagamento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold capitalize">{pedido.forma_pagamento.replace('_', ' ')}</p>
            {pedido.troco_para && (
              <p className="text-gray-600">
                Troco para: {formatCurrency(pedido.troco_para)}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Observações */}
        {pedido.observacoes && (
          <Card>
            <CardHeader>
              <CardTitle>Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">{pedido.observacoes}</p>
            </CardContent>
          </Card>
        )}

        {/* Botões */}
        <div className="grid grid-cols-2 gap-4 pt-4">
          <Link href="/meus-pedidos">
            <Button variant="outline" className="w-full">
              <List className="w-4 h-4 mr-2" />
              Meus Pedidos
            </Button>
          </Link>
          <Link href="/">
            <Button className="w-full bg-red-600 hover:bg-red-700">
              <Home className="w-4 h-4 mr-2" />
              Voltar ao Cardápio
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
