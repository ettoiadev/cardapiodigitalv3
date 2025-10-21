/**
 * @fileoverview Hook para gerenciar pedidos no sistema Kanban
 * @module hooks/use-pedidos-kanban
 */

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Pedido, StatusPedido, FiltrosPedidos } from '@/types/pedido'
import { toast } from 'sonner'

interface UsePedidosKanbanReturn {
  pedidos: Pedido[]
  loading: boolean
  error: string | null
  atualizarStatus: (pedidoId: string, novoStatus: StatusPedido, alteradoPor?: string) => Promise<boolean>
  atualizarOrdem: (pedidoId: string, novaOrdem: number) => Promise<boolean>
  recarregar: () => Promise<void>
  filtrar: (filtros: FiltrosPedidos) => void
}

/**
 * Hook customizado para gerenciar pedidos no Kanban
 * 
 * Funcionalidades:
 * - Carrega pedidos da view otimizada vw_pedidos_kanban
 * - Atualiza em tempo real via Supabase Realtime
 * - Permite atualizar status e ordem dos pedidos
 * - Suporta filtros de busca
 * 
 * @param {FiltrosPedidos} filtrosIniciais - Filtros iniciais para carregar pedidos
 * @returns {UsePedidosKanbanReturn} Estado e funções para gerenciar pedidos
 */
export function usePedidosKanban(filtrosIniciais: FiltrosPedidos = {}): UsePedidosKanbanReturn {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filtros, setFiltros] = useState<FiltrosPedidos>(filtrosIniciais)

  /**
   * Carrega pedidos do banco de dados
   */
  const carregarPedidos = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('vw_pedidos_kanban')
        .select('*')
        .neq('status', 'cancelado') // Excluir pedidos cancelados do Kanban

      // Aplicar filtros
      if (filtros.status && filtros.status.length > 0) {
        query = query.in('status', filtros.status)
      }

      if (filtros.tipo_entrega && filtros.tipo_entrega.length > 0) {
        query = query.in('tipo_entrega', filtros.tipo_entrega)
      }

      if (filtros.data_inicio) {
        query = query.gte('created_at', filtros.data_inicio)
      }

      if (filtros.data_fim) {
        query = query.lte('created_at', filtros.data_fim)
      }

      if (filtros.busca) {
        query = query.or(`numero_pedido.ilike.%${filtros.busca}%,nome_cliente.ilike.%${filtros.busca}%,telefone_cliente.ilike.%${filtros.busca}%`)
      }

      const { data, error: queryError } = await query

      if (queryError) throw queryError

      setPedidos(data || [])
    } catch (err) {
      console.error('Erro ao carregar pedidos:', err)
      setError('Erro ao carregar pedidos')
      toast.error('Erro ao carregar pedidos')
    } finally {
      setLoading(false)
    }
  }, [filtros])

  /**
   * Atualiza o status de um pedido com atualização otimista
   */
  const atualizarStatus = useCallback(async (
    pedidoId: string, 
    novoStatus: StatusPedido,
    alteradoPor?: string
  ): Promise<boolean> => {
    // Salvar estado anterior para rollback
    const pedidoAnterior = pedidos.find(p => p.id === pedidoId)
    
    // Atualização otimista - atualiza UI imediatamente
    setPedidos(prev => prev.map(p => 
      p.id === pedidoId 
        ? { ...p, status: novoStatus, updated_at: new Date().toISOString() }
        : p
    ))

    try {
      const { error: updateError } = await supabase
        .from('pedidos')
        .update({
          status: novoStatus,
          alterado_por: alteradoPor || 'admin',
          updated_at: new Date().toISOString()
        })
        .eq('id', pedidoId)

      if (updateError) throw updateError

      // NÃO recarregar aqui - deixar o Realtime fazer isso
      // O Realtime vai atualizar automaticamente quando detectar a mudança
      
      return true
    } catch (err) {
      console.error('Erro ao atualizar status:', err)
      toast.error('Erro ao atualizar status')
      
      // Reverter para estado anterior em caso de erro
      if (pedidoAnterior) {
        setPedidos(prev => prev.map(p => 
          p.id === pedidoId ? pedidoAnterior : p
        ))
      }
      return false
    }
  }, [pedidos])

  /**
   * Atualiza a ordem de um pedido no Kanban
   */
  const atualizarOrdem = useCallback(async (
    pedidoId: string,
    novaOrdem: number
  ): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('pedidos')
        .update({
          ordem_kanban: novaOrdem,
          updated_at: new Date().toISOString()
        })
        .eq('id', pedidoId)

      if (updateError) throw updateError

      return true
    } catch (err) {
      console.error('Erro ao atualizar ordem:', err)
      return false
    }
  }, [])

  /**
   * Recarrega os pedidos
   */
  const recarregar = useCallback(async () => {
    await carregarPedidos()
  }, [carregarPedidos])

  /**
   * Aplica filtros aos pedidos
   */
  const filtrar = useCallback((novosFiltros: FiltrosPedidos) => {
    setFiltros(novosFiltros)
  }, [])

  // Carregar pedidos inicialmente e quando filtros mudarem
  useEffect(() => {
    carregarPedidos()
  }, [carregarPedidos])

  // Configurar Realtime
  useEffect(() => {
    const channel = supabase
      .channel('pedidos-kanban-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pedidos'
        },
        (payload) => {
          console.log('Mudança em pedidos:', payload)
          
          if (payload.eventType === 'INSERT') {
            // Recarregar para pegar dados da view
            carregarPedidos()
          } else if (payload.eventType === 'UPDATE') {
            // CORREÇÃO: Recarregar da view ao invés de merge
            // Evita sobrescrever campos agregados (itens_resumo, total_itens) com NULL
            console.log('🔄 Realtime UPDATE detectado, recarregando da view...')
            carregarPedidos()
          } else if (payload.eventType === 'DELETE') {
            // Remover pedido
            setPedidos(prev => prev.filter(p => p.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [carregarPedidos])

  return {
    pedidos,
    loading,
    error,
    atualizarStatus,
    atualizarOrdem,
    recarregar,
    filtrar
  }
}
