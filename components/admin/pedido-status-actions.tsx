"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { 
  CheckCircle, 
  Clock, 
  Truck, 
  Package, 
  XCircle,
  Loader2
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

interface PedidoStatusActionsProps {
  pedidoId: string
  statusAtual: string
  onStatusChange?: () => void
}

export function PedidoStatusActions({ 
  pedidoId, 
  statusAtual, 
  onStatusChange 
}: PedidoStatusActionsProps) {
  const [loading, setLoading] = useState(false)

  const updateStatus = async (novoStatus: string) => {
    setLoading(true)

    try {
      const { error } = await supabase
        .from('pedidos')
        .update({ 
          status: novoStatus,
          atualizado_em: new Date().toISOString()
        })
        .eq('id', pedidoId)

      if (error) throw error

      toast.success(`Status atualizado para: ${getStatusLabel(novoStatus)}`)
      
      if (onStatusChange) {
        onStatusChange()
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      toast.error('Erro ao atualizar status')
    } finally {
      setLoading(false)
    }
  }

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      pendente: 'Aguardando',
      confirmado: 'Confirmado',
      em_preparo: 'Em Preparo',
      saiu_entrega: 'Saiu para Entrega',
      entregue: 'Entregue',
      cancelado: 'Cancelado'
    }
    return labels[status] || status
  }

  const getNextActions = () => {
    switch (statusAtual) {
      case 'pendente':
        return [
          { status: 'confirmado', label: 'Confirmar', icon: CheckCircle, color: 'bg-blue-600 hover:bg-blue-700' },
          { status: 'cancelado', label: 'Cancelar', icon: XCircle, color: 'bg-red-600 hover:bg-red-700' }
        ]
      case 'confirmado':
        return [
          { status: 'em_preparo', label: 'Iniciar Preparo', icon: Clock, color: 'bg-purple-600 hover:bg-purple-700' },
          { status: 'cancelado', label: 'Cancelar', icon: XCircle, color: 'bg-red-600 hover:bg-red-700' }
        ]
      case 'em_preparo':
        return [
          { status: 'saiu_entrega', label: 'Saiu para Entrega', icon: Truck, color: 'bg-orange-600 hover:bg-orange-700' },
          { status: 'entregue', label: 'Marcar como Entregue', icon: Package, color: 'bg-green-600 hover:bg-green-700' }
        ]
      case 'saiu_entrega':
        return [
          { status: 'entregue', label: 'Marcar como Entregue', icon: Package, color: 'bg-green-600 hover:bg-green-700' }
        ]
      default:
        return []
    }
  }

  const actions = getNextActions()

  if (actions.length === 0 || statusAtual === 'entregue' || statusAtual === 'cancelado') {
    return null
  }

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => {
        const Icon = action.icon
        return (
          <Button
            key={action.status}
            onClick={() => updateStatus(action.status)}
            disabled={loading}
            className={`${action.color} text-white`}
            size="sm"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Icon className="h-4 w-4 mr-2" />
            )}
            {action.label}
          </Button>
        )
      })}
    </div>
  )
}
