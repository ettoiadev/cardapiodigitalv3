import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Pedido {
  id: string
  numero_pedido: string
  status: string
  total: number
  created_at: string
}

export function useRealtimePedidos(initialPedidos: Pedido[] = []) {
  const [pedidos, setPedidos] = useState<Pedido[]>(initialPedidos)

  useEffect(() => {
    // Atualizar estado inicial
    setPedidos(initialPedidos)

    // Criar canal para escutar mudanças
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
          setPedidos(prev => [payload.new as Pedido, ...prev])
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
  }, [initialPedidos])

  return pedidos
}
