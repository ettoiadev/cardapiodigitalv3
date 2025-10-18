# 📋 PLANO DETALHADO: Implementação de Pedidos Kanban - PARTE 2

## 🎨 PARTE 2: FRONTEND - ESTRUTURA DE COMPONENTES

### 2.1 Estrutura de Arquivos

```
app/admin/pedidos/
├── page.tsx                          # Página principal Kanban
├── [id]/
│   └── page.tsx                      # Detalhes do pedido
├── components/
│   ├── kanban-board.tsx              # Board principal
│   ├── kanban-column.tsx             # Coluna do Kanban
│   ├── pedido-card.tsx               # Card de pedido
│   ├── pedido-modal.tsx              # Modal de detalhes
│   ├── status-badge.tsx              # Badge de status
│   ├── filtros-pedidos.tsx           # Filtros e busca
│   ├── cancelar-pedido-modal.tsx     # Modal de cancelamento
│   └── historico-status.tsx          # Timeline de mudanças
└── hooks/
    ├── use-pedidos-kanban.ts         # Hook para gerenciar pedidos
    └── use-drag-drop.ts              # Hook para drag & drop
```

### 2.2 Dependências Necessárias

```json
{
  "dependencies": {
    "@dnd-kit/core": "^6.1.0",
    "@dnd-kit/sortable": "^8.0.0",
    "@dnd-kit/utilities": "^3.2.2",
    "date-fns": "^3.0.0",
    "sonner": "^1.3.1"
  }
}
```

### 2.3 Tipos TypeScript

```typescript
// types/pedido.ts
export type PedidoStatus = 
  | 'pendente' 
  | 'em_preparo' 
  | 'saiu_entrega' 
  | 'finalizado' 
  | 'cancelado'

export interface PedidoItem {
  id: string
  nome_produto: string
  quantidade: number
  tamanho?: 'broto' | 'tradicional'
  preco_unitario: number
  preco_total: number
  sabores?: string[]
  adicionais?: any[]
  borda_recheada?: any
}

export interface Pedido {
  id: string
  numero_pedido: string
  nome_cliente: string
  telefone_cliente: string
  tipo_entrega: 'delivery' | 'balcao'
  endereco_entrega?: string
  status: PedidoStatus
  subtotal: number
  taxa_entrega: number
  total: number
  forma_pagamento: string
  observacoes?: string
  created_at: string
  updated_at: string
  ordem_kanban: number
  total_itens: number
  itens_resumo?: Array<{
    nome: string
    quantidade: number
    tamanho?: string
  }>
  itens?: PedidoItem[]
}

export interface KanbanColumn {
  id: PedidoStatus
  title: string
  color: string
  icon: React.ComponentType
  pedidos: Pedido[]
}
```

### 2.4 Configuração das Colunas

```typescript
// app/admin/pedidos/config/kanban-columns.ts
import { 
  Clock, 
  ChefHat, 
  Truck, 
  CheckCircle2, 
  XCircle 
} from 'lucide-react'

export const KANBAN_COLUMNS = [
  {
    id: 'pendente',
    title: 'Pendente',
    description: 'Aguardando confirmação',
    color: 'bg-yellow-500',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    textColor: 'text-yellow-700',
    icon: Clock,
  },
  {
    id: 'em_preparo',
    title: 'Em Preparo',
    description: 'Sendo preparado',
    color: 'bg-blue-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
    icon: ChefHat,
  },
  {
    id: 'saiu_entrega',
    title: 'Saiu p/ Entrega',
    description: 'Em rota de entrega',
    color: 'bg-purple-500',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-700',
    icon: Truck,
  },
  {
    id: 'finalizado',
    title: 'Finalizado',
    description: 'Pedido concluído',
    color: 'bg-green-500',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-700',
    icon: CheckCircle2,
  },
  {
    id: 'cancelado',
    title: 'Cancelado',
    description: 'Pedido cancelado',
    color: 'bg-red-500',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-700',
    icon: XCircle,
  },
] as const
```

### 2.5 Hook Principal - use-pedidos-kanban.ts

```typescript
// app/admin/pedidos/hooks/use-pedidos-kanban.ts
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Pedido, PedidoStatus } from '@/types/pedido'

export function usePedidosKanban() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Carregar pedidos
  const loadPedidos = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('vw_pedidos_kanban')
        .select('*')
        .order('ordem_kanban', { ascending: true })
        .order('created_at', { ascending: false })

      if (error) throw error
      setPedidos(data || [])
    } catch (err: any) {
      setError(err.message)
      console.error('Erro ao carregar pedidos:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Atualizar status do pedido
  const updateStatus = useCallback(async (
    pedidoId: string,
    novoStatus: PedidoStatus,
    alteradoPor: string,
    motivoCancelamento?: string
  ) => {
    try {
      const updateData: any = {
        status: novoStatus,
        alterado_por: alteradoPor,
        updated_at: new Date().toISOString()
      }

      if (novoStatus === 'cancelado' && motivoCancelamento) {
        updateData.motivo_cancelamento = motivoCancelamento
      }

      const { error } = await supabase
        .from('pedidos')
        .update(updateData)
        .eq('id', pedidoId)

      if (error) throw error

      // Atualizar estado local
      setPedidos(prev => prev.map(p => 
        p.id === pedidoId 
          ? { ...p, status: novoStatus, updated_at: new Date().toISOString() }
          : p
      ))

      return { success: true }
    } catch (err: any) {
      console.error('Erro ao atualizar status:', err)
      return { success: false, error: err.message }
    }
  }, [])

  // Atualizar ordem no Kanban
  const updateOrdem = useCallback(async (
    pedidoId: string,
    novaOrdem: number
  ) => {
    try {
      const { error } = await supabase
        .from('pedidos')
        .update({ ordem_kanban: novaOrdem })
        .eq('id', pedidoId)

      if (error) throw error

      setPedidos(prev => prev.map(p => 
        p.id === pedidoId ? { ...p, ordem_kanban: novaOrdem } : p
      ))
    } catch (err: any) {
      console.error('Erro ao atualizar ordem:', err)
    }
  }, [])

  // Realtime subscription
  useEffect(() => {
    loadPedidos()

    const channel = supabase
      .channel('pedidos-kanban')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pedidos'
        },
        () => {
          loadPedidos()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [loadPedidos])

  return {
    pedidos,
    loading,
    error,
    updateStatus,
    updateOrdem,
    reload: loadPedidos
  }
}
```

### 2.6 Componente Principal - page.tsx

```typescript
// app/admin/pedidos/page.tsx
"use client"

import { useState } from 'react'
import { AdminLayout } from '@/components/admin-layout'
import { KanbanBoard } from './components/kanban-board'
import { FiltrosPedidos } from './components/filtros-pedidos'
import { usePedidosKanban } from './hooks/use-pedidos-kanban'
import { Button } from '@/components/ui/button'
import { RefreshCw, Plus } from 'lucide-react'

export default function PedidosPage() {
  const { pedidos, loading, updateStatus, updateOrdem, reload } = usePedidosKanban()
  const [filtros, setFiltros] = useState({
    busca: '',
    tipo_entrega: 'todos',
    data_inicio: null,
    data_fim: null
  })

  // Filtrar pedidos
  const pedidosFiltrados = pedidos.filter(pedido => {
    if (filtros.busca) {
      const busca = filtros.busca.toLowerCase()
      return (
        pedido.numero_pedido.toLowerCase().includes(busca) ||
        pedido.nome_cliente?.toLowerCase().includes(busca) ||
        pedido.telefone_cliente?.includes(busca)
      )
    }
    return true
  }).filter(pedido => {
    if (filtros.tipo_entrega !== 'todos') {
      return pedido.tipo_entrega === filtros.tipo_entrega
    }
    return true
  })

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Gerenciamento de Pedidos
            </h1>
            <p className="text-gray-600 mt-1">
              Arraste os pedidos entre as colunas para atualizar o status
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={reload}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <FiltrosPedidos
          filtros={filtros}
          onFiltrosChange={setFiltros}
          totalPedidos={pedidosFiltrados.length}
        />

        {/* Kanban Board */}
        <KanbanBoard
          pedidos={pedidosFiltrados}
          onStatusChange={updateStatus}
          onOrdemChange={updateOrdem}
          loading={loading}
        />
      </div>
    </AdminLayout>
  )
}
```

---

**Continua na PARTE 3...**
