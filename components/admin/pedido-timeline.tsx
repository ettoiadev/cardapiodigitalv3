"use client"

import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { 
  CheckCircle, 
  Clock, 
  Truck, 
  Package, 
  XCircle,
  AlertCircle
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface PedidoTimelineProps {
  pedido: {
    created_at: string
    confirmado_em?: string
    finalizado_em?: string
    status: string
  }
}

export function PedidoTimeline({ pedido }: PedidoTimelineProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pendente':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />
      case 'confirmado':
        return <CheckCircle className="h-5 w-5 text-blue-600" />
      case 'em_preparo':
        return <Clock className="h-5 w-5 text-purple-600" />
      case 'saiu_entrega':
        return <Truck className="h-5 w-5 text-orange-600" />
      case 'entregue':
        return <Package className="h-5 w-5 text-green-600" />
      case 'cancelado':
        return <XCircle className="h-5 w-5 text-red-600" />
      default:
        return <Clock className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: string, isActive: boolean) => {
    if (!isActive) return 'bg-gray-300'
    
    switch (status) {
      case 'pendente':
        return 'bg-yellow-500'
      case 'confirmado':
        return 'bg-blue-500'
      case 'em_preparo':
        return 'bg-purple-500'
      case 'saiu_entrega':
        return 'bg-orange-500'
      case 'entregue':
        return 'bg-green-500'
      case 'cancelado':
        return 'bg-red-500'
      default:
        return 'bg-gray-300'
    }
  }

  const formatDate = (date: string) => {
    return format(new Date(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
  }

  const getEstimatedTime = () => {
    const now = new Date()
    const createdAt = new Date(pedido.created_at)
    const elapsed = Math.floor((now.getTime() - createdAt.getTime()) / 60000) // minutos

    switch (pedido.status) {
      case 'pendente':
        return 'Aguardando confirmação'
      case 'confirmado':
        return `Tempo estimado: 30-45 minutos`
      case 'em_preparo':
        return `Em preparo há ${elapsed} minutos`
      case 'saiu_entrega':
        return `A caminho há ${elapsed} minutos`
      case 'entregue':
        return 'Pedido concluído'
      case 'cancelado':
        return 'Pedido cancelado'
      default:
        return ''
    }
  }

  const timeline = [
    {
      status: 'pendente',
      label: 'Pedido Recebido',
      timestamp: pedido.created_at,
      active: true
    },
    {
      status: 'confirmado',
      label: 'Confirmado',
      timestamp: pedido.confirmado_em,
      active: ['confirmado', 'em_preparo', 'saiu_entrega', 'entregue'].includes(pedido.status)
    },
    {
      status: 'em_preparo',
      label: 'Em Preparo',
      timestamp: null,
      active: ['em_preparo', 'saiu_entrega', 'entregue'].includes(pedido.status)
    },
    {
      status: 'saiu_entrega',
      label: 'Saiu para Entrega',
      timestamp: null,
      active: ['saiu_entrega', 'entregue'].includes(pedido.status)
    },
    {
      status: 'entregue',
      label: 'Entregue',
      timestamp: pedido.finalizado_em,
      active: pedido.status === 'entregue'
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Timeline do Pedido</span>
          <span className="text-sm font-normal text-gray-600">
            {getEstimatedTime()}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {timeline.map((item, index) => (
            <div key={item.status} className="flex items-start gap-4">
              {/* Linha vertical */}
              <div className="flex flex-col items-center">
                <div className={`w-3 h-3 rounded-full ${getStatusColor(item.status, item.active)}`} />
                {index < timeline.length - 1 && (
                  <div className={`w-0.5 h-12 ${item.active ? 'bg-gray-300' : 'bg-gray-200'}`} />
                )}
              </div>

              {/* Conteúdo */}
              <div className="flex-1 pb-4">
                <div className="flex items-center gap-2">
                  {getStatusIcon(item.status)}
                  <span className={`font-medium ${item.active ? 'text-gray-900' : 'text-gray-400'}`}>
                    {item.label}
                  </span>
                </div>
                {item.timestamp && (
                  <p className="text-sm text-gray-500 mt-1">
                    {formatDate(item.timestamp)}
                  </p>
                )}
                {!item.timestamp && item.active && pedido.status === item.status && (
                  <p className="text-sm text-gray-500 mt-1">
                    Em andamento...
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Cancelado */}
        {pedido.status === 'cancelado' && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-600" />
            <div>
              <p className="font-medium text-red-900">Pedido Cancelado</p>
              {pedido.finalizado_em && (
                <p className="text-sm text-red-700">
                  {formatDate(pedido.finalizado_em)}
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
