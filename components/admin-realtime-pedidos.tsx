"use client"

import { useEffect, useState, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { Badge } from "@/components/ui/badge"
import { Bell } from "lucide-react"

interface AdminRealtimePedidosProps {
  onNewPedido?: () => void
}

export function AdminRealtimePedidos({ onNewPedido }: AdminRealtimePedidosProps) {
  const [novosPedidos, setNovosPedidos] = useState(0)
  const timersRef = useRef<Set<NodeJS.Timeout>>(new Set())
  const callbackRef = useRef(onNewPedido)

  // Atualizar callback ref quando mudar (sem re-criar subscription)
  useEffect(() => {
    callbackRef.current = onNewPedido
  }, [onNewPedido])

  useEffect(() => {
    let mounted = true

    // Criar canal para escutar novos pedidos
    const channel = supabase
      .channel('admin-pedidos')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'pedidos'
        },
        (payload) => {
          if (!mounted) return // Não processar se desmontado
          
          console.log('🔔 Novo pedido recebido:', payload.new)
          
          // Incrementar contador
          setNovosPedidos(prev => prev + 1)
          
          // Tocar som
          playNotificationSound()
          
          // Callback para recarregar lista (usando ref)
          if (callbackRef.current) {
            callbackRef.current()
          }

          // Resetar contador após 5 segundos
          const timer = setTimeout(() => {
            if (mounted) {
              setNovosPedidos(prev => Math.max(0, prev - 1))
            }
            // Remover timer do Set após execução
            timersRef.current.delete(timer)
          }, 5000)
          
          // Adicionar timer ao Set para cleanup posterior
          timersRef.current.add(timer)
        }
      )
      .subscribe()

    return () => {
      mounted = false
      
      // Limpar TODOS os timers pendentes
      timersRef.current.forEach(timer => clearTimeout(timer))
      timersRef.current.clear()
      
      // Remover channel
      supabase.removeChannel(channel)
    }
  }, []) // Sem dependências - subscription criada apenas uma vez

  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      
      // Tom 1
      const osc1 = audioContext.createOscillator()
      const gain1 = audioContext.createGain()
      osc1.connect(gain1)
      gain1.connect(audioContext.destination)
      osc1.frequency.value = 800
      osc1.type = 'sine'
      gain1.gain.setValueAtTime(0.3, audioContext.currentTime)
      gain1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)
      osc1.start(audioContext.currentTime)
      osc1.stop(audioContext.currentTime + 0.2)

      // Tom 2 (mais agudo)
      const osc2 = audioContext.createOscillator()
      const gain2 = audioContext.createGain()
      osc2.connect(gain2)
      gain2.connect(audioContext.destination)
      osc2.frequency.value = 1000
      osc2.type = 'sine'
      gain2.gain.setValueAtTime(0.3, audioContext.currentTime + 0.2)
      gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4)
      osc2.start(audioContext.currentTime + 0.2)
      osc2.stop(audioContext.currentTime + 0.4)
    } catch (error) {
      console.error('Erro ao tocar som:', error)
    }
  }

  if (novosPedidos === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 animate-bounce">
      <Badge className="bg-red-600 text-white px-4 py-2 flex items-center gap-2 shadow-lg">
        <Bell className="h-4 w-4" />
        {novosPedidos} {novosPedidos === 1 ? 'Novo Pedido' : 'Novos Pedidos'}
      </Badge>
    </div>
  )
}
