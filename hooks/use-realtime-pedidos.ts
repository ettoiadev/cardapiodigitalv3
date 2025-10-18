/**
 * @fileoverview Hook React para sincronização em tempo real de pedidos via Supabase Realtime
 * @module use-realtime-pedidos
 */

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'

/**
 * Interface que representa um pedido no sistema
 * @interface Pedido
 * @property {string} id - ID único do pedido (UUID)
 * @property {string} numero_pedido - Número sequencial do pedido para exibição
 * @property {string} status - Status atual do pedido (ex: 'pendente', 'em_preparo', 'entregue')
 * @property {number} total - Valor total do pedido em reais
 * @property {string} created_at - Data/hora de criação do pedido (ISO 8601)
 */
interface Pedido {
  id: string
  numero_pedido: string
  status: string
  total: number
  created_at: string
}

/**
 * Hook customizado para sincronização em tempo real de pedidos
 * 
 * Utiliza Supabase Realtime para escutar mudanças na tabela 'pedidos'
 * e atualizar automaticamente o estado local quando ocorrem:
 * - INSERT: Novos pedidos são adicionados ao início da lista
 * - UPDATE: Pedidos existentes são atualizados
 * - DELETE: Pedidos são removidos da lista
 * 
 * O hook gerencia automaticamente a inscrição e cancelamento do canal
 * Realtime para evitar vazamentos de memória.
 * 
 * @param {Pedido[]} [initialPedidos=[]] - Lista inicial de pedidos (geralmente do SSR ou fetch inicial)
 * @returns {Pedido[]} Lista atualizada de pedidos em tempo real
 * 
 * @example
 * // Em um componente de dashboard
 * function PedidosPage() {
 *   // Buscar pedidos iniciais
 *   const [initialData, setInitialData] = useState([])
 *   
 *   useEffect(() => {
 *     async function fetchPedidos() {
 *       const { data } = await supabase
 *         .from('pedidos')
 *         .select('*')
 *         .order('created_at', { ascending: false })
 *       setInitialData(data || [])
 *     }
 *     fetchPedidos()
 *   }, [])
 *   
 *   // Hook mantém lista sincronizada em tempo real
 *   const pedidos = useRealtimePedidos(initialData)
 *   
 *   return (
 *     <div>
 *       {pedidos.map(pedido => (
 *         <PedidoCard key={pedido.id} pedido={pedido} />
 *       ))}
 *     </div>
 *   )
 * }
 * 
 * @example
 * // Uso simples sem dados iniciais
 * function MeusPedidos() {
 *   const pedidos = useRealtimePedidos()
 *   // pedidos começa vazio e é populado via realtime
 * }
 */
export function useRealtimePedidos(initialPedidos: Pedido[] = []) {
  const [pedidos, setPedidos] = useState<Pedido[]>(initialPedidos)
  const isInitialized = useRef(false)

  // Atualiza estado apenas na primeira vez que recebe dados
  useEffect(() => {
    if (!isInitialized.current && initialPedidos.length > 0) {
      setPedidos(initialPedidos)
      isInitialized.current = true
    }
  }, [initialPedidos])

  // Configura realtime - executa apenas uma vez
  useEffect(() => {
    const channel = supabase
      .channel('pedidos-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'pedidos'
        },
        (payload) => {
          console.log('Novo pedido:', payload.new)
          setPedidos(prev => {
            // Evita duplicação
            const novoPedido = payload.new as Pedido
            if (prev.some(p => p.id === novoPedido.id)) {
              return prev
            }
            return [novoPedido, ...prev]
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pedidos'
        },
        (payload) => {
          console.log('Pedido atualizado:', payload.new)
          setPedidos(prev =>
            prev.map(p => p.id === payload.new.id ? payload.new as Pedido : p)
          )
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'pedidos'
        },
        (payload) => {
          console.log('Pedido deletado:', payload.old)
          setPedidos(prev => prev.filter(p => p.id !== payload.old.id))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, []) // Executa apenas na montagem/desmontagem

  return pedidos
}
