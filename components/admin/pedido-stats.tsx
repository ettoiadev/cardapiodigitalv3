"use client"

import { Card, CardContent } from "@/components/ui/card"
import { 
  Clock, 
  TrendingUp, 
  Package,
  DollarSign
} from "lucide-react"

interface PedidoStatsProps {
  pedido: {
    created_at: string
    confirmado_em?: string
    finalizado_em?: string
    total: number
    status: string
  }
}

export function PedidoStats({ pedido }: PedidoStatsProps) {
  const calculateElapsedTime = () => {
    const now = new Date()
    const createdAt = new Date(pedido.created_at)
    const elapsed = Math.floor((now.getTime() - createdAt.getTime()) / 60000)
    
    if (elapsed < 60) {
      return `${elapsed} min`
    }
    const hours = Math.floor(elapsed / 60)
    const minutes = elapsed % 60
    return `${hours}h ${minutes}min`
  }

  const calculatePreparationTime = () => {
    if (!pedido.confirmado_em) return '-'
    
    const confirmedAt = new Date(pedido.confirmado_em)
    const now = pedido.finalizado_em ? new Date(pedido.finalizado_em) : new Date()
    const elapsed = Math.floor((now.getTime() - confirmedAt.getTime()) / 60000)
    
    if (elapsed < 60) {
      return `${elapsed} min`
    }
    const hours = Math.floor(elapsed / 60)
    const minutes = elapsed % 60
    return `${hours}h ${minutes}min`
  }

  const getStatusProgress = () => {
    const statusOrder = ['pendente', 'confirmado', 'em_preparo', 'saiu_entrega', 'entregue']
    const currentIndex = statusOrder.indexOf(pedido.status)
    
    if (pedido.status === 'cancelado') return 0
    if (currentIndex === -1) return 0
    
    return ((currentIndex + 1) / statusOrder.length) * 100
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tempo Total</p>
              <p className="text-2xl font-bold text-gray-900">
                {calculateElapsedTime()}
              </p>
            </div>
            <Clock className="h-8 w-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tempo de Preparo</p>
              <p className="text-2xl font-bold text-gray-900">
                {calculatePreparationTime()}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Progresso</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(getStatusProgress())}%
              </p>
            </div>
            <Package className="h-8 w-8 text-orange-600" />
          </div>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-orange-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getStatusProgress()}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Valor Total</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(pedido.total)}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
