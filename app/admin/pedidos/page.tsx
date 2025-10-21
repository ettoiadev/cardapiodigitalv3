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
// Nota: Pedidos cancelados não aparecem no Kanban, apenas em relatórios
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

    if (!over) {
      toast.info('Pedido não foi movido')
      return
    }

    const pedidoId = active.id as string
    const pedido = pedidos.find(p => p.id === pedidoId)
    
    if (!pedido) {
      toast.error('Pedido não encontrado')
      return
    }

    const novoStatus = over.id as StatusPedido
    const statusAtual = pedido.status

    // Se mudou de coluna (status)
    if (novoStatus !== statusAtual) {
      // Validar transição
      if (!validarTransicao(statusAtual, novoStatus)) {
        const statusLabels = {
          pendente: 'Pendente',
          em_preparo: 'Em Preparo',
          saiu_entrega: 'Saiu para Entrega',
          finalizado: 'Finalizado',
          cancelado: 'Cancelado'
        }
        toast.error(
          `Transição não permitida: ${statusLabels[statusAtual]} → ${statusLabels[novoStatus]}`,
          { duration: 4000 }
        )
        return
      }

      // Mostrar loading toast
      const loadingToast = toast.loading('Atualizando pedido...')

      // Atualizar status
      const sucesso = await atualizarStatus(pedidoId, novoStatus, 'admin')
      
      // Remover loading toast
      toast.dismiss(loadingToast)
      
      if (sucesso) {
        const statusLabels = {
          pendente: 'Pendente',
          em_preparo: 'Em Preparo',
          saiu_entrega: 'Saiu para Entrega',
          finalizado: 'Finalizado',
          cancelado: 'Cancelado'
        }
        toast.success(
          `Pedido ${pedido.numero_pedido} movido para "${statusLabels[novoStatus]}"`,
          { duration: 3000 }
        )
      }
    } else {
      toast.info('Pedido permaneceu na mesma coluna')
    }
  }

  const handleDetalhes = (pedido: Pedido) => {
    setPedidoSelecionado(pedido)
    setModalAberto(true)
  }

  const handleAceitar = async (pedido: Pedido) => {
    const loadingToast = toast.loading(`Aceitando pedido ${pedido.numero_pedido}...`)
    
    const sucesso = await atualizarStatus(pedido.id, 'em_preparo', 'admin')
    
    toast.dismiss(loadingToast)
    
    if (sucesso) {
      toast.success(`Pedido ${pedido.numero_pedido} aceito e movido para "Em Preparo"`, {
        duration: 3000
      })
    }
  }

  const handleCancelar = (pedido: Pedido) => {
    setPedidoSelecionado(pedido)
    setModalAberto(true)
    // O modal de detalhes já tem opção de cancelar
  }

  const handleEnviarEntrega = async (pedido: Pedido) => {
    const loadingToast = toast.loading(`Enviando pedido ${pedido.numero_pedido} para entrega...`)
    
    const sucesso = await atualizarStatus(pedido.id, 'saiu_entrega', 'admin')
    
    toast.dismiss(loadingToast)
    
    if (sucesso) {
      toast.success(`Pedido ${pedido.numero_pedido} saiu para entrega! 🚚`, {
        duration: 3000
      })
    }
  }

  const handleFinalizar = async (pedido: Pedido) => {
    const loadingToast = toast.loading(`Finalizando pedido ${pedido.numero_pedido}...`)
    
    const sucesso = await atualizarStatus(pedido.id, 'finalizado', 'admin')
    
    toast.dismiss(loadingToast)
    
    if (sucesso) {
      toast.success(`Pedido ${pedido.numero_pedido} finalizado com sucesso! ✅`, {
        duration: 3000
      })
    }
  }

  const handleImprimir = (pedido: Pedido) => {
    try {
      toast.info(`Preparando impressão do pedido ${pedido.numero_pedido}...`)
      
      // Abrir janela de impressão
      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        toast.error('Não foi possível abrir a janela de impressão. Verifique se pop-ups estão bloqueados.')
        return
      }

      printWindow.document.write(`
        <html>
          <head>
            <title>Pedido ${pedido.numero_pedido}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; }
              h1 { font-size: 24px; margin-bottom: 10px; text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; }
              .info { margin: 10px 0; padding: 5px 0; }
              .items { margin-top: 20px; border-top: 1px solid #ccc; padding-top: 10px; }
              .item { margin: 8px 0; padding: 5px; background: #f9f9f9; border-left: 3px solid #333; }
              .total { font-size: 20px; font-weight: bold; margin-top: 20px; text-align: center; border-top: 2px solid #333; padding-top: 10px; }
              .header { background: #f0f0f0; padding: 10px; margin-bottom: 20px; text-align: center; }
              @media print {
                body { padding: 10px; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Pedido ${pedido.numero_pedido}</h1>
              <p><strong>Status:</strong> ${pedido.status}</p>
            </div>
            <div class="info"><strong>Cliente:</strong> ${pedido.nome_cliente || 'N/A'}</div>
            <div class="info"><strong>Telefone:</strong> ${pedido.telefone_cliente || 'N/A'}</div>
            <div class="info"><strong>Tipo:</strong> ${pedido.tipo_entrega === 'delivery' ? 'Delivery' : pedido.tipo_entrega === 'balcao' ? 'Balcão' : 'Mesa'}</div>
            ${pedido.endereco_entrega ? `<div class="info"><strong>Endereço:</strong> ${pedido.endereco_entrega}${pedido.endereco_bairro ? `, ${pedido.endereco_bairro}` : ''}</div>` : ''}
            <div class="info"><strong>Pagamento:</strong> ${pedido.forma_pagamento}</div>
            <div class="items">
              <h2>Itens do Pedido:</h2>
              ${pedido.itens_resumo?.map(item => `
                <div class="item">
                  <strong>${item.quantidade}x ${item.nome}</strong>
                  ${item.tamanho ? `<br>Tamanho: ${item.tamanho}` : ''}
                  ${item.sabores && item.sabores.length > 0 ? `<br>Sabores: ${item.sabores.join(', ')}` : ''}
                </div>
              `).join('') || '<p>Nenhum item</p>'}
            </div>
            ${pedido.observacoes ? `<div class="info" style="background: #fff3cd; padding: 10px; border-left: 3px solid #ffc107;"><strong>Observações:</strong> ${pedido.observacoes}</div>` : ''}
            <div class="total">
              <p>Subtotal: R$ ${pedido.subtotal.toFixed(2)}</p>
              <p>Taxa de Entrega: R$ ${pedido.taxa_entrega.toFixed(2)}</p>
              <p style="font-size: 24px; color: #28a745;">TOTAL: R$ ${pedido.total.toFixed(2)}</p>
            </div>
            <script>
              window.onload = function() {
                window.print();
                setTimeout(function() { window.close(); }, 500);
              }
            </script>
          </body>
        </html>
      `)
      printWindow.document.close()
      
      toast.success('Documento de impressão gerado com sucesso')
    } catch (error) {
      console.error('Erro ao imprimir:', error)
      toast.error('Erro ao gerar documento de impressão')
    }
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

      {/* Loading State */}
      {loading && pedidos.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <RefreshCw className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Carregando pedidos...</p>
          </div>
        </div>
      )}

      {/* Kanban Board */}
      {!loading || pedidos.length > 0 ? (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pb-4 px-1">
          {COLUNAS.map(coluna => (
            <KanbanColumn
              key={coluna.id}
              coluna={coluna}
              pedidos={pedidosPorStatus[coluna.id]}
              onDetalhes={handleDetalhes}
              onAceitar={handleAceitar}
              onCancelar={handleCancelar}
              onImprimir={handleImprimir}
              onEnviarEntrega={handleEnviarEntrega}
              onFinalizar={handleFinalizar}
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
      ) : null}

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
