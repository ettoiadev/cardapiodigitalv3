"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  ArrowLeft, 
  Package, 
  Clock, 
  MapPin, 
  CreditCard,
  Phone,
  User,
  FileText,
  Loader2
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { formatCurrency } from "@/lib/currency-utils"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface PedidoDetalhes {
  id: string
  numero_pedido: string
  status: string
  tipo_entrega: string
  endereco_rua?: string
  endereco_numero?: string
  endereco_bairro?: string
  endereco_cidade?: string
  endereco_estado?: string
  endereco_cep?: string
  endereco_complemento?: string
  forma_pagamento: string
  troco_para?: number
  subtotal: number
  taxa_entrega: number
  desconto: number
  total: number
  observacoes?: string
  nome_cliente: string
  telefone_cliente: string
  created_at: string
  confirmado_em?: string
  finalizado_em?: string
}

interface PedidoItem {
  id: string
  nome_produto: string
  tamanho?: string
  sabores?: string[]
  quantidade: number
  preco_unitario: number
  preco_total: number
  adicionais?: any
  borda_recheada?: any
  observacoes?: string
}

export default function DetalhesPedidoPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [pedido, setPedido] = useState<PedidoDetalhes | null>(null)
  const [itens, setItens] = useState<PedidoItem[]>([])

  useEffect(() => {
    loadPedido()
  }, [params.id])

  const loadPedido = async () => {
    try {
      setLoading(true)

      // Buscar pedido
      const { data: pedidoData, error: pedidoError } = await supabase
        .from("pedidos")
        .select("*")
        .eq("id", params.id)
        .single()

      if (pedidoError) throw pedidoError

      setPedido(pedidoData)

      // Buscar itens do pedido
      const { data: itensData, error: itensError } = await supabase
        .from("pedido_itens")
        .select("*")
        .eq("pedido_id", params.id)
        .order("created_at", { ascending: true })

      if (itensError) throw itensError

      setItens(itensData || [])
    } catch (error) {
      console.error("Erro ao carregar pedido:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pendente":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "confirmado":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "em_preparo":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "saiu_entrega":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "entregue":
        return "bg-green-100 text-green-800 border-green-200"
      case "cancelado":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "pendente":
        return "Aguardando Confirmação"
      case "confirmado":
        return "Confirmado"
      case "em_preparo":
        return "Em Preparo"
      case "saiu_entrega":
        return "Saiu para Entrega"
      case "entregue":
        return "Entregue"
      case "cancelado":
        return "Cancelado"
      default:
        return status
    }
  }

  const getFormaPagamentoText = (forma: string) => {
    switch (forma) {
      case "pix":
        return "PIX"
      case "dinheiro":
        return "Dinheiro"
      case "debito":
        return "Cartão de Débito"
      case "credito":
        return "Cartão de Crédito"
      case "ticket_alimentacao":
        return "Ticket Alimentação"
      default:
        return forma
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-red-600 mx-auto" />
          <p className="mt-4 text-gray-600">Carregando detalhes...</p>
        </div>
      </div>
    )
  }

  if (!pedido) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <p className="text-gray-600 mb-4">Pedido não encontrado</p>
            <Link href="/meus-pedidos">
              <Button className="bg-red-600 hover:bg-red-700">
                Voltar para Meus Pedidos
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/meus-pedidos">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">
              Pedido {pedido.numero_pedido}
            </h1>
            <p className="text-sm text-gray-600">
              {format(new Date(pedido.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>
          <Badge className={`${getStatusColor(pedido.status)} border`}>
            {getStatusText(pedido.status)}
          </Badge>
        </div>

        {/* Itens do Pedido */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-red-600" />
              Itens do Pedido
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {itens.map((item, index) => (
              <div key={item.id}>
                {index > 0 && <Separator className="my-4" />}
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-start gap-2">
                      <span className="font-medium text-gray-900">
                        {item.quantidade}x
                      </span>
                      <div>
                        <p className="font-medium text-gray-900">
                          {item.nome_produto}
                        </p>
                        {item.tamanho && (
                          <p className="text-sm text-gray-600">
                            {item.tamanho === "broto" ? "Broto" : "Tradicional"}
                          </p>
                        )}
                        {item.sabores && item.sabores.length > 0 && (
                          <p className="text-sm text-gray-600">
                            {item.sabores.length === 1 
                              ? item.sabores[0]
                              : item.sabores.join(" + ")}
                          </p>
                        )}
                        {item.adicionais && item.adicionais.length > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            + {item.adicionais.map((a: any) => 
                              a.itens.map((i: any) => i.nome).join(", ")
                            ).join(", ")}
                          </p>
                        )}
                        {item.borda_recheada && (
                          <p className="text-xs text-gray-500">
                            + Borda: {item.borda_recheada.nome}
                          </p>
                        )}
                        {item.observacoes && (
                          <p className="text-xs text-gray-500 italic mt-1">
                            Obs: {item.observacoes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      {formatCurrency(item.preco_total)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatCurrency(item.preco_unitario)} cada
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Informações de Entrega */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-red-600" />
              {pedido.tipo_entrega === "delivery" ? "Endereço de Entrega" : "Retirada"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pedido.tipo_entrega === "delivery" ? (
              <div className="space-y-1 text-sm">
                <p className="font-medium text-gray-900">
                  {pedido.endereco_rua}, {pedido.endereco_numero}
                </p>
                {pedido.endereco_complemento && (
                  <p className="text-gray-600">{pedido.endereco_complemento}</p>
                )}
                <p className="text-gray-600">
                  {pedido.endereco_bairro} - {pedido.endereco_cidade}/{pedido.endereco_estado}
                </p>
                <p className="text-gray-600">CEP: {pedido.endereco_cep}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-600">
                Retirada no local da pizzaria
              </p>
            )}
          </CardContent>
        </Card>

        {/* Informações de Contato */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-red-600" />
              Informações de Contato
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-400" />
              <span className="text-gray-900">{pedido.nome_cliente}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-gray-400" />
              <span className="text-gray-900">{pedido.telefone_cliente}</span>
            </div>
          </CardContent>
        </Card>

        {/* Pagamento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-red-600" />
              Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Forma de pagamento</span>
              <span className="font-medium text-gray-900">
                {getFormaPagamentoText(pedido.forma_pagamento)}
              </span>
            </div>
            {pedido.troco_para && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Troco para</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(pedido.troco_para)}
                </span>
              </div>
            )}
            <Separator />
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-gray-900">{formatCurrency(pedido.subtotal)}</span>
              </div>
              {pedido.taxa_entrega > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Taxa de entrega</span>
                  <span className="text-gray-900">{formatCurrency(pedido.taxa_entrega)}</span>
                </div>
              )}
              {pedido.desconto > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Desconto</span>
                  <span className="text-green-600">-{formatCurrency(pedido.desconto)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-red-600">{formatCurrency(pedido.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Observações */}
        {pedido.observacoes && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-red-600" />
                Observações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700">{pedido.observacoes}</p>
            </CardContent>
          </Card>
        )}

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-red-600" />
              Histórico
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-gray-400 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Pedido realizado</p>
                <p className="text-xs text-gray-500">
                  {format(new Date(pedido.created_at), "dd/MM/yyyy 'às' HH:mm")}
                </p>
              </div>
            </div>
            {pedido.confirmado_em && (
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Pedido confirmado</p>
                  <p className="text-xs text-gray-500">
                    {format(new Date(pedido.confirmado_em), "dd/MM/yyyy 'às' HH:mm")}
                  </p>
                </div>
              </div>
            )}
            {pedido.finalizado_em && (
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Pedido finalizado</p>
                  <p className="text-xs text-gray-500">
                    {format(new Date(pedido.finalizado_em), "dd/MM/yyyy 'às' HH:mm")}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Botão Voltar */}
        <Link href="/meus-pedidos">
          <Button variant="outline" className="w-full">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Meus Pedidos
          </Button>
        </Link>
      </div>
    </div>
  )
}
