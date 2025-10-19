"use client"

import { useState, useMemo } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { AdminLayout } from '@/components/admin-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  RefreshCw, 
  Search, 
  Filter,
  Package
} from 'lucide-react'
import { KanbanColumn } from '@/components/admin/kanban-column'
import { PedidoCard } from '@/components/admin/pedido-card'
import { PedidoDetalhesModal } from '@/components/admin/pedido-detalhes-modal'
import { AdminRealtimePedidos } from '@/components/admin-realtime-pedidos'
import { usePedidosKanban } from '@/hooks/use-pedidos-kanban'
import type { Pedido, StatusPedido, ColunaKanban, TipoEntrega } from '@/types/pedido'
import { toast } from 'sonner'

// Configuração das colunas do Kanban
const COLUNAS: ColunaKanban[] = [
  {
    id: 'pendente',
    titulo: 'Pendente',
    cor: 'bg-yellow-500',
    corTexto: 'text-white',
    icone: 'clock',
    ordem: 1
  },
  {
    id: 'em_preparo',
    titulo: 'Em Preparo',
    cor: 'bg-blue-500',
    corTexto: 'text-white',
    icone: 'chef-hat',
    ordem: 2
  },
  {
    id: 'saiu_entrega',
    titulo: 'Saiu para Entrega',
    cor: 'bg-purple-500',
    corTexto: 'text-white',
    icone: 'truck',
    ordem: 3
  },
  {
    id: 'finalizado',
    titulo: 'Finalizado',
    cor: 'bg-green-500',
    corTexto: 'text-white',
    icone: 'check-circle',
    ordem: 4
  },
  {
    id: 'cancelado',
    titulo: 'Cancelado',
    cor: 'bg-red-500',
    corTexto: 'text-white',
    icone: 'x-circle',
    ordem: 5
  }
]

export default function PedidosPage() {
  const [busca, setBusca] = useState('')
  const [tipoEntregaFiltro, setTipoEntregaFiltro] = useState<TipoEntrega | 'todos'>('todos')
  const [pedidoSelecionado, setPedidoSelecionado] = useState<Pedido | null>(null)
  const [modalAberto, setModalAberto] = useState(false)
  const [pedidoArrastando, setPedidoArrastando] = useState<Pedido | null>(null)

  const { 
    pedidos, 
    loading, 
    error,
    atualizarStatus,
    atualizarOrdem,
    recarregar,
    filtrar
  } = usePedidosKanban()

  // Configurar sensores para drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Previne cliques acidentais
      },
    })
  )

  // Filtrar pedidos por busca e tipo de entrega
  const pedidosFiltrados = useMemo(() => {
    let resultado = pedidos

    // Filtro de busca
    if (busca.trim()) {
      const buscaLower = busca.toLowerCase()
      resultado = resultado.filter(p => 
        p.numero_pedido.toLowerCase().includes(buscaLower) ||
        p.nome_cliente?.toLowerCase().includes(buscaLower) ||
        p.telefone_cliente?.toLowerCase().includes(buscaLower)
      )
    }

    // Filtro de tipo de entrega
    if (tipoEntregaFiltro !== 'todos') {
      resultado = resultado.filter(p => p.tipo_entrega === tipoEntregaFiltro)
    }

    return resultado
  }, [pedidos, busca, tipoEntregaFiltro])

  // Agrupar pedidos por status
  const pedidosPorStatus = useMemo(() => {
    const grupos: Record<StatusPedido, Pedido[]> = {
      pendente: [],
      em_preparo: [],
      saiu_entrega: [],
      finalizado: [],
      cancelado: []
    }

    pedidosFiltrados.forEach(pedido => {
      if (grupos[pedido.status]) {
        grupos[pedido.status].push(pedido)
      }
    })

    // Ordenar por ordem_kanban dentro de cada status
    Object.keys(grupos).forEach(status => {
      grupos[status as StatusPedido].sort((a, b) => a.ordem_kanban - b.ordem_kanban)
    })

    return grupos
  }, [pedidosFiltrados])

  // CORREÇÃO: Validar transições de status com regras mais restritivas
  const validarTransicao = (statusAtual: StatusPedido, novoStatus: StatusPedido): boolean => {
    // Não permitir transição para o mesmo status
    if (statusAtual === novoStatus) {
      return false
    }

    // Cancelado pode vir de qualquer status NÃO FINAL
    if (novoStatus === 'cancelado' && statusAtual !== 'finalizado' && statusAtual !== 'cancelado') {
      return true
    }

    // Finalizado APENAS de saiu_entrega ou em_preparo (para pedidos balcão)
    // Garante que o fluxo seja seguido
    if (novoStatus === 'finalizado') {
      return statusAtual === 'saiu_entrega' || statusAtual === 'em_preparo'
    }

    // Transições normais (fluxo sequencial)
    const transicoesPermitidas: Record<StatusPedido, StatusPedido[]> = {
      pendente: ['em_preparo', 'cancelado'],
      em_preparo: ['saiu_entrega', 'finalizado', 'cancelado'], // finalizado apenas para balcão
      saiu_entrega: ['finalizado', 'cancelado'],
      finalizado: [], // Status final, não permite mudanças
      cancelado: [] // Status final, não permite mudanças
    }

    return transicoesPermitidas[statusAtual]?.includes(novoStatus) || false
  }

  const handleDragStart = (event: DragStartEvent) => {
    const pedido = pedidos.find(p => p.id === event.active.id)
    setPedidoArrastando(pedido || null)
  }

  const handleDragOver = (event: DragOverEvent) => {
    // Aqui podemos adicionar feedback visual se necessário
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setPedidoArrastando(null)

    if (!over) return

    const pedidoId = active.id as string
    const pedido = pedidos.find(p => p.id === pedidoId)
    
    if (!pedido) return

    const novoStatus = over.id as StatusPedido
    const statusAtual = pedido.status

    // Se mudou de coluna (status)
    if (novoStatus !== statusAtual) {
      // Validar transição
      if (!validarTransicao(statusAtual, novoStatus)) {
        toast.error(`Não é possível mover de "${statusAtual}" para "${novoStatus}"`)
        return
      }

      // Atualizar status
      const sucesso = await atualizarStatus(pedidoId, novoStatus)
      
      if (sucesso) {
        toast.success(`Pedido movido para "${novoStatus}"`)
      }
    }
  }

  const handleDetalhes = (pedido: Pedido) => {
    setPedidoSelecionado(pedido)
    setModalAberto(true)
  }

  const handleFecharModal = () => {
    setModalAberto(false)
    setPedidoSelecionado(null)
  }

  const handleLimparFiltros = () => {
    setBusca('')
    setTipoEntregaFiltro('todos')
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Package className="h-8 w-8" />
              Gerenciamento de Pedidos
            </h1>
            <p className="text-gray-600 mt-1">
              Arraste os cards para alterar o status dos pedidos
            </p>
          </div>
          <Button
            onClick={recarregar}
            variant="outline"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {/* Filtros */}
        <div className="flex gap-3 items-center flex-wrap">
          <div className="flex-1 min-w-[300px] relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por número, cliente ou telefone..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select
            value={tipoEntregaFiltro}
            onValueChange={(value) => setTipoEntregaFiltro(value as TipoEntrega | 'todos')}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tipo de Entrega" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="delivery">Delivery</SelectItem>
              <SelectItem value="balcao">Balcão</SelectItem>
              <SelectItem value="mesa">Mesa</SelectItem>
            </SelectContent>
          </Select>

          {(busca || tipoEntregaFiltro !== 'todos') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLimparFiltros}
            >
              <Filter className="h-4 w-4 mr-2" />
              Limpar Filtros
            </Button>
          )}

          <Badge variant="secondary" className="px-3 py-1">
            {pedidosFiltrados.length} {pedidosFiltrados.length === 1 ? 'pedido' : 'pedidos'}
          </Badge>
        </div>
      </div>

      {/* Erro */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-3 overflow-x-auto pb-4 px-1">
          {COLUNAS.map(coluna => (
            <KanbanColumn
              key={coluna.id}
              coluna={coluna}
              pedidos={pedidosPorStatus[coluna.id]}
              onDetalhes={handleDetalhes}
            />
          ))}
        </div>

        <DragOverlay>
          {pedidoArrastando && (
            <div className="opacity-80">
              <PedidoCard pedido={pedidoArrastando} />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Modal de Detalhes */}
      <PedidoDetalhesModal
        pedido={pedidoSelecionado}
        open={modalAberto}
        onClose={handleFecharModal}
        onStatusChange={recarregar}
      />

      {/* Notificações em Tempo Real */}
      <AdminRealtimePedidos onNewPedido={recarregar} />
      </div>
    </AdminLayout>
  )
}
