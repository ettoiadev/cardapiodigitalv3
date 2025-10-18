"use client"

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
}

export function KanbanColumn({ coluna, pedidos, onDetalhes }: KanbanColumnProps) {
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

  return (
    <div className="flex-shrink-0 w-80">
      <Card className={`h-full ${isOver ? 'ring-2 ring-primary' : ''}`}>
        <CardHeader className={`${coluna.cor} ${coluna.corTexto} pb-3`}>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getIcon()}
              <span>{coluna.titulo}</span>
            </div>
            <Badge variant="secondary" className="bg-white/20 text-white">
              {pedidos.length}
            </Badge>
          </CardTitle>
          {totalValor > 0 && (
            <p className="text-sm font-semibold opacity-90">
              {formatCurrency(totalValor)}
            </p>
          )}
        </CardHeader>

        <CardContent
          ref={setNodeRef}
          className="p-3 overflow-y-auto"
          style={{ maxHeight: 'calc(100vh - 280px)' }}
        >
          <SortableContext
            items={pedidos.map(p => p.id)}
            strategy={verticalListSortingStrategy}
          >
            {pedidos.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p className="text-sm">Nenhum pedido</p>
              </div>
            ) : (
              pedidos.map(pedido => (
                <PedidoCard
                  key={pedido.id}
                  pedido={pedido}
                  onDetalhes={onDetalhes}
                />
              ))
            )}
          </SortableContext>
        </CardContent>
      </Card>
    </div>
  )
}
