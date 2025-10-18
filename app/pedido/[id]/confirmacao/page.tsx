"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Package, Clock, MapPin, CreditCard, ArrowLeft, Home } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { formatCurrency } from "@/lib/currency-utils"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Pedido {
  id: string
  numero_pedido: string
  status: string
  tipo_entrega: string
  endereco_rua?: string
  endereco_numero?: string
  endereco_bairro?: string
  endereco_cidade?: string
  forma_pagamento: string
  subtotal: number
  taxa_entrega: number
  total: number
  created_at: string
}

export default function ConfirmacaoPedidoPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [pedido, setPedido] = useState<Pedido | null>(null)

  useEffect(() => {
    loadPedido()
  }, [params.id])

  const loadPedido = async () => {
    try {
      const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) throw error

      setPedido(data)
    } catch (error) {
      console.error('Erro ao carregar pedido:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
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
            <Link href="/">
              <Button className="bg-red-600 hover:bg-red-700">
                Voltar para o cardápio
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800'
      case 'confirmado':
        return 'bg-blue-100 text-blue-800'
      case 'em_preparo':
        return 'bg-purple-100 text-purple-800'
      case 'saiu_entrega':
        return 'bg-orange-100 text-orange-800'
      case 'entregue':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pendente':
        return 'Aguardando Confirmação'
      case 'confirmado':
        return 'Confirmado'
      case 'em_preparo':
        return 'Em Preparo'
      case 'saiu_entrega':
        return 'Saiu para Entrega'
      case 'entregue':
        return 'Entregue'
      default:
        return status
    }
  }

  const getFormaPagamentoText = (forma: string) => {
    switch (forma) {
      case 'pix':
        return 'PIX'
      case 'dinheiro':
        return 'Dinheiro'
      case 'debito':
        return 'Cartão de Débito'
      case 'credito':
        return 'Cartão de Crédito'
      case 'ticket_alimentacao':
        return 'Ticket Alimentação'
      default:
        return forma
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header de Sucesso */}
        <Card className="border-0 shadow-xl bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="pt-6 pb-6 text-center">
            <div className="mx-auto w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Pedido Realizado com Sucesso!</h1>
            <p className="text-green-50">Seu pedido foi recebido e está sendo processado</p>
          </CardContent>
        </Card>

        {/* Informações do Pedido */}
        <Card className="shadow-lg">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Package className="h-5 w-5 text-red-600" />
                Pedido {pedido.numero_pedido}
              </span>
              <span className={`text-sm px-3 py-1 rounded-full ${getStatusColor(pedido.status)}`}>
                {getStatusText(pedido.status)}
              </span>
            </CardTitle>
          </CardHeader>

          <CardContent className="pt-6 space-y-6">
            {/* Data e Hora */}
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Data do Pedido</p>
                <p className="text-sm text-gray-600">
                  {format(new Date(pedido.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
            </div>

            {/* Tipo de Entrega */}
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-gray-900">
                  {pedido.tipo_entrega === 'delivery' ? 'Entrega' : 'Retirada no Local'}
                </p>
                {pedido.tipo_entrega === 'delivery' && pedido.endereco_rua && (
                  <p className="text-sm text-gray-600 mt-1">
                    {pedido.endereco_rua}, {pedido.endereco_numero}<br />
                    {pedido.endereco_bairro} - {pedido.endereco_cidade}
                  </p>
                )}
              </div>
            </div>

            {/* Forma de Pagamento */}
            <div className="flex items-start gap-3">
              <CreditCard className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Forma de Pagamento</p>
                <p className="text-sm text-gray-600">
                  {getFormaPagamentoText(pedido.forma_pagamento)}
                </p>
              </div>
            </div>

            {/* Valores */}
            <div className="border-t pt-4 space-y-2">
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
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Total</span>
                <span className="text-red-600">{formatCurrency(pedido.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informações Adicionais */}
        <Card className="shadow-lg bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <Clock className="h-5 w-5 text-white" />
                </div>
              </div>
              <div>
                <p className="font-medium text-blue-900 mb-1">Acompanhe seu pedido</p>
                <p className="text-sm text-blue-700">
                  Você pode acompanhar o status do seu pedido em tempo real na página "Meus Pedidos"
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botões de Ação */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/meus-pedidos" className="flex-1">
            <Button className="w-full bg-red-600 hover:bg-red-700">
              <Package className="h-4 w-4 mr-2" />
              Ver Meus Pedidos
            </Button>
          </Link>
          <Link href="/" className="flex-1">
            <Button variant="outline" className="w-full">
              <Home className="h-4 w-4 mr-2" />
              Voltar ao Cardápio
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
