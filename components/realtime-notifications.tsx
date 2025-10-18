"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { Bell } from "lucide-react"

interface RealtimeNotificationsProps {
  userId?: string
  isAdmin?: boolean
}

export function RealtimeNotifications({ userId, isAdmin = false }: RealtimeNotificationsProps) {
  const [channel, setChannel] = useState<any>(null)

  useEffect(() => {
    if (!userId) return

    // Criar canal de notificações
    const notificationChannel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'pedidos'
        },
        (payload) => {
          if (isAdmin) {
            handleNewPedido(payload.new)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pedidos',
          filter: `cliente_id=eq.${userId}`
        },
        (payload) => {
          if (!isAdmin) {
            handleStatusUpdate(payload.new)
          }
        }
      )
      .subscribe()

    setChannel(notificationChannel)

    return () => {
      if (notificationChannel) {
        supabase.removeChannel(notificationChannel)
      }
    }
  }, [userId, isAdmin])

  const handleNewPedido = (pedido: any) => {
    // Tocar som
    playNotificationSound()

    // Mostrar notificação
    toast.success(
      `Novo pedido recebido!`,
      {
        description: `Pedido ${pedido.numero_pedido} - ${formatCurrency(pedido.total)}`,
        duration: 5000,
        icon: <Bell className="h-4 w-4" />
      }
    )
  }

  const handleStatusUpdate = (pedido: any) => {
    const statusMessages: { [key: string]: { title: string; description: string } } = {
      confirmado: {
        title: "Pedido Confirmado! 🎉",
        description: `Seu pedido ${pedido.numero_pedido} foi confirmado e está sendo preparado.`
      },
      em_preparo: {
        title: "Pedido em Preparo 👨‍🍳",
        description: `Seu pedido ${pedido.numero_pedido} está sendo preparado com carinho.`
      },
      saiu_entrega: {
        title: "Pedido Saiu para Entrega! 🚚",
        description: `Seu pedido ${pedido.numero_pedido} está a caminho.`
      },
      entregue: {
        title: "Pedido Entregue! ✅",
        description: `Seu pedido ${pedido.numero_pedido} foi entregue. Bom apetite!`
      },
      cancelado: {
        title: "Pedido Cancelado ❌",
        description: `Seu pedido ${pedido.numero_pedido} foi cancelado.`
      }
    }

    const message = statusMessages[pedido.status]
    if (message) {
      // Tocar som
      playNotificationSound()

      // Mostrar notificação
      toast.info(message.title, {
        description: message.description,
        duration: 5000
      })
    }
  }

  const playNotificationSound = () => {
    try {
      // Criar som de notificação usando Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.value = 800
      oscillator.type = 'sine'

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.5)
    } catch (error) {
      console.error('Erro ao tocar som:', error)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  return null // Componente invisível
}
