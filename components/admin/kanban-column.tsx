"use client"

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Badge } from '@/components/ui/badge'
import { PedidoCard } from './pedido-card'
import type { Pedido, ColunaKanban } from '@/types/pedido'
import { 
  Clock, 
  ChefHat, 
  Truck, 
  CheckCircle, 
  XCircle 
} from 'lucide-react'

interface KanbanColumnProps {
  coluna: ColunaKanban
  pedidos: Pedido[]
  onDetalhes?: (pedido: Pedido) => void
  onAceitar?: (pedido: Pedido) => void
  onCancelar?: (pedido: Pedido) => void
  onImprimir?: (pedido: Pedido) => void
  onEnviarEntrega?: (pedido: Pedido) => void
  onFinalizar?: (pedido: Pedido) => void
}

export function KanbanColumn({ 
  coluna, 
  pedidos, 
  onDetalhes, 
  onAceitar, 
  onCancelar, 
  onImprimir,
  onEnviarEntrega,
  onFinalizar
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: coluna.id
  })

  const getIcon = () => {
    const icons = {
      pendente: Clock,
      em_preparo: ChefHat,
      saiu_entrega: Truck,
      finalizado: CheckCircle,
      cancelado: XCircle
    }
    const Icon = icons[coluna.id] || Clock
    return <Icon className="h-5 w-5" />
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const totalValor = pedidos.reduce((sum, p) => sum + p.total, 0)

  // Mapear cores de fundo para cada status (estilo Anota AI)
  const getBackgroundColor = () => {
    const bgColors = {
      pendente: 'bg-orange-400',
      em_preparo: 'bg-orange-500',
      saiu_entrega: 'bg-blue-500',
      finalizado: 'bg-green-500',
      cancelado: 'bg-red-500'
    }
    return bgColors[coluna.id] || 'bg-gray-400'
  }

  return (
    <div className="w-full h-full">
      {/* Container com cor de fundo da coluna */}
      <div className={`${getBackgroundColor()} rounded-lg shadow-lg h-full flex flex-col ${isOver ? 'ring-2 ring-white ring-offset-2' : ''}`}>
        {/* Header da coluna */}
        <div className="p-3 md:p-4 pb-3 flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-white">
              {getIcon()}
              <h3 className="font-bold text-base md:text-lg">{coluna.titulo}</h3>
            </div>
            <Badge variant="secondary" className="bg-white/90 text-gray-900 font-bold px-2.5 py-1">
              {pedidos.length}
            </Badge>
          </div>
          {totalValor > 0 && (
            <p className="text-white text-xs md:text-sm font-semibold">
              Total: {formatCurrency(totalValor)}
            </p>
          )}
        </div>

        {/* Área de drop dos cards */}
        <div
          ref={setNodeRef}
          className="px-2 md:px-3 pb-3 overflow-y-auto flex-1"
          style={{ minHeight: '300px', maxHeight: 'calc(100vh - 280px)' }}
        >
          <SortableContext
            items={pedidos.map(p => p.id)}
            strategy={verticalListSortingStrategy}
          >
            {pedidos.length === 0 ? (
              <div className="text-center py-12 text-white/80">
                <p className="text-sm font-medium">Nenhum pedido</p>
              </div>
            ) : (
              pedidos.map(pedido => (
                <PedidoCard
                  key={pedido.id}
                  pedido={pedido}
                  onDetalhes={onDetalhes}
                  onAceitar={onAceitar}
                  onCancelar={onCancelar}
                  onImprimir={onImprimir}
                  onEnviarEntrega={onEnviarEntrega}
                  onFinalizar={onFinalizar}
                />
              ))
            )}
          </SortableContext>
        </div>
      </div>
    </div>
  )
}
