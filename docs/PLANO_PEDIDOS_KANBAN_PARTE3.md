# 📋 PLANO DETALHADO: Implementação de Pedidos Kanban - PARTE 3

## 🎨 PARTE 3: COMPONENTES KANBAN

### 3.1 Componente KanbanBoard

```typescript
// app/admin/pedidos/components/kanban-board.tsx
"use client"

import { useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { KanbanColumn } from './kanban-column'
import { PedidoCard } from './pedido-card'
import { KANBAN_COLUMNS } from '../config/kanban-columns'
import type { Pedido, PedidoStatus } from '@/types/pedido'
import { toast } from 'sonner'

interface KanbanBoardProps {
  pedidos: Pedido[]
  onStatusChange: (id: string, status: PedidoStatus, alteradoPor: string) => Promise<any>
  onOrdemChange: (id: string, ordem: number) => Promise<void>
  loading: boolean
}

export function KanbanBoard({ 
  pedidos, 
  onStatusChange, 
  onOrdemChange,
  loading 
}: KanbanBoardProps) {
  const [activePedido, setActivePedido] = useState<Pedido | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  // Agrupar pedidos por status
  const pedidosPorStatus = KANBAN_COLUMNS.reduce((acc, column) => {
    acc[column.id] = pedidos
      .filter(p => p.status === column.id)
      .sort((a, b) => a.ordem_kanban - b.ordem_kanban)
    return acc
  }, {} as Record<PedidoStatus, Pedido[]>)

  const handleDragStart = (event: DragStartEvent) => {
    const pedido = pedidos.find(p => p.id === event.active.id)
    setActivePedido(pedido || null)
    setIsDragging(true)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    setIsDragging(false)
    setActivePedido(null)

    const { active, over } = event

    if (!over) return

    const pedidoId = active.id as string
    const novoStatus = over.id as PedidoStatus

    const pedido = pedidos.find(p => p.id === pedidoId)
    if (!pedido) return

    // Se mudou de coluna
    if (pedido.status !== novoStatus) {
      // Validar transição de status
      if (!isValidTransition(pedido.status, novoStatus)) {
        toast.error('Transição de status inválida')
        return
      }

      const result = await onStatusChange(pedidoId, novoStatus, 'Admin')
      
      if (result.success) {
        toast.success(`Pedido ${pedido.numero_pedido} movido para ${novoStatus}`)
      } else {
        toast.error('Erro ao atualizar status')
      }
    }
  }

  const isValidTransition = (atual: PedidoStatus, novo: PedidoStatus): boolean => {
    // Qualquer status pode ir para cancelado
    if (novo === 'cancelado') return true
    
    // Finalizado não pode voltar
    if (atual === 'finalizado') return false
    
    // Cancelado não pode sair
    if (atual === 'cancelado') return false

    // Fluxo normal
    const fluxo: Record<PedidoStatus, PedidoStatus[]> = {
      pendente: ['em_preparo', 'cancelado'],
      em_preparo: ['saiu_entrega', 'cancelado'],
      saiu_entrega: ['finalizado', 'cancelado'],
      finalizado: [],
      cancelado: []
    }

    return fluxo[atual]?.includes(novo) || false
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando pedidos...</p>
        </div>
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {KANBAN_COLUMNS.map(column => (
          <KanbanColumn
            key={column.id}
            column={column}
            pedidos={pedidosPorStatus[column.id] || []}
            isDragging={isDragging}
          />
        ))}
      </div>

      <DragOverlay>
        {activePedido && (
          <div className="rotate-3 opacity-80">
            <PedidoCard pedido={activePedido} isDragging />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
```

### 3.2 Componente KanbanColumn

```typescript
// app/admin/pedidos/components/kanban-column.tsx
"use client"

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { PedidoCard } from './pedido-card'
import { Badge } from '@/components/ui/badge'
import type { Pedido } from '@/types/pedido'

interface KanbanColumnProps {
  column: {
    id: string
    title: string
    description: string
    color: string
    bgColor: string
    borderColor: string
    textColor: string
    icon: React.ComponentType<{ className?: string }>
  }
  pedidos: Pedido[]
  isDragging: boolean
}

export function KanbanColumn({ column, pedidos, isDragging }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  })

  const Icon = column.icon

  return (
    <div
      ref={setNodeRef}
      className={`
        flex flex-col h-full min-h-[600px] rounded-lg border-2 transition-all
        ${isOver ? 'border-red-500 bg-red-50' : column.borderColor}
        ${column.bgColor}
      `}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${column.color} bg-opacity-10`}>
              <Icon className={`h-5 w-5 ${column.color.replace('bg-', 'text-')}`} />
            </div>
            <h3 className="font-semibold text-gray-900">{column.title}</h3>
          </div>
          <Badge variant="secondary" className="font-mono">
            {pedidos.length}
          </Badge>
        </div>
        <p className="text-xs text-gray-500">{column.description}</p>
      </div>

      {/* Pedidos */}
      <div className="flex-1 p-2 space-y-2 overflow-y-auto">
        <SortableContext
          items={pedidos.map(p => p.id)}
          strategy={verticalListSortingStrategy}
        >
          {pedidos.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
              Nenhum pedido
            </div>
          ) : (
            pedidos.map(pedido => (
              <PedidoCard
                key={pedido.id}
                pedido={pedido}
                columnColor={column.color}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  )
}
```

### 3.3 Componente PedidoCard

```typescript
// app/admin/pedidos/components/pedido-card.tsx
"use client"

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Clock, 
  MapPin, 
  Phone, 
  User, 
  Package,
  MoreVertical,
  Eye
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { formatCurrency } from '@/lib/currency-utils'
import type { Pedido } from '@/types/pedido'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface PedidoCardProps {
  pedido: Pedido
  columnColor?: string
  isDragging?: boolean
}

export function PedidoCard({ pedido, columnColor, isDragging }: PedidoCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: pedido.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  }

  const tempoDecorrido = formatDistanceToNow(new Date(pedido.created_at), {
    addSuffix: true,
    locale: ptBR
  })

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        p-4 cursor-grab active:cursor-grabbing hover:shadow-lg transition-shadow
        ${isDragging ? 'shadow-2xl' : ''}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-bold text-lg text-gray-900">
            {pedido.numero_pedido}
          </h4>
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {tempoDecorrido}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Eye className="h-4 w-4 mr-2" />
              Ver Detalhes
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Cliente */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-2 text-sm">
          <User className="h-4 w-4 text-gray-400" />
          <span className="font-medium text-gray-700">
            {pedido.nome_cliente || 'Cliente'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Phone className="h-4 w-4 text-gray-400" />
          <span>{pedido.telefone_cliente}</span>
        </div>
      </div>

      {/* Tipo de Entrega */}
      <div className="flex items-center gap-2 mb-3">
        {pedido.tipo_entrega === 'delivery' ? (
          <>
            <MapPin className="h-4 w-4 text-orange-500" />
            <Badge variant="outline" className="text-xs">
              Delivery
            </Badge>
          </>
        ) : (
          <>
            <Package className="h-4 w-4 text-blue-500" />
            <Badge variant="outline" className="text-xs">
              Retirada
            </Badge>
          </>
        )}
      </div>

      {/* Itens Resumo */}
      {pedido.itens_resumo && pedido.itens_resumo.length > 0 && (
        <div className="mb-3 p-2 bg-gray-50 rounded text-xs">
          <p className="font-medium text-gray-700 mb-1">
            {pedido.total_itens} {pedido.total_itens === 1 ? 'item' : 'itens'}
          </p>
          <ul className="space-y-1">
            {pedido.itens_resumo.slice(0, 2).map((item, idx) => (
              <li key={idx} className="text-gray-600">
                {item.quantidade}x {item.nome}
                {item.tamanho && ` (${item.tamanho})`}
              </li>
            ))}
            {pedido.itens_resumo.length > 2 && (
              <li className="text-gray-500 italic">
                +{pedido.itens_resumo.length - 2} mais...
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Total */}
      <div className="pt-3 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Total</span>
          <span className="text-lg font-bold text-green-600">
            {formatCurrency(pedido.total)}
          </span>
        </div>
      </div>
    </Card>
  )
}
```

---

**Continua na PARTE 4...**
