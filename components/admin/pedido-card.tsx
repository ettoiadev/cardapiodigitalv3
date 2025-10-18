"use client"

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Clock, 
  MapPin, 
  Phone, 
  User, 
  Package,
  Eye,
  GripVertical
} from 'lucide-react'
import type { Pedido } from '@/types/pedido'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface PedidoCardProps {
  pedido: Pedido
  onDetalhes?: (pedido: Pedido) => void
}

export function PedidoCard({ pedido, onDetalhes }: PedidoCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: pedido.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const getTipoEntregaBadge = () => {
    const tipos = {
      delivery: { label: 'Delivery', cor: 'bg-blue-100 text-blue-800' },
      balcao: { label: 'Balcão', cor: 'bg-green-100 text-green-800' },
      mesa: { label: 'Mesa', cor: 'bg-purple-100 text-purple-800' }
    }
    const tipo = tipos[pedido.tipo_entrega] || tipos.delivery
    return <Badge className={tipo.cor}>{tipo.label}</Badge>
  }

  const getFormaPagamentoBadge = () => {
    const formas = {
      dinheiro: 'Dinheiro',
      pix: 'PIX',
      credito: 'Crédito',
      debito: 'Débito'
    }
    return formas[pedido.forma_pagamento] || pedido.forma_pagamento
  }

  const tempoDecorrido = formatDistanceToNow(new Date(pedido.created_at), {
    addSuffix: true,
    locale: ptBR
  })

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`mb-3 cursor-pointer hover:shadow-lg transition-shadow ${
        isDragging ? 'shadow-2xl ring-2 ring-primary' : ''
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing touch-none"
            >
              <GripVertical className="h-5 w-5 text-gray-400" />
            </div>
            <div>
              <h3 className="font-bold text-lg">{pedido.numero_pedido}</h3>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {tempoDecorrido}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-1 items-end">
            {getTipoEntregaBadge()}
            <span className="text-xs text-gray-600">{getFormaPagamentoBadge()}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Informações do Cliente */}
        <div className="space-y-1">
          {pedido.nome_cliente && (
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-gray-500" />
              <span className="font-medium">{pedido.nome_cliente}</span>
            </div>
          )}
          {pedido.telefone_cliente && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="h-4 w-4 text-gray-500" />
              <span>{pedido.telefone_cliente}</span>
            </div>
          )}
          {pedido.endereco_entrega && (
            <div className="flex items-start gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
              <span className="line-clamp-2">{pedido.endereco_entrega}</span>
            </div>
          )}
        </div>

        {/* Itens do Pedido */}
        {pedido.itens_resumo && pedido.itens_resumo.length > 0 && (
          <div className="border-t pt-2">
            <div className="flex items-center gap-2 mb-1">
              <Package className="h-4 w-4 text-gray-500" />
              <span className="text-xs font-semibold text-gray-700">
                {pedido.total_itens} {pedido.total_itens === 1 ? 'item' : 'itens'}
              </span>
            </div>
            <div className="space-y-1">
              {pedido.itens_resumo.slice(0, 3).map((item, index) => (
                <div key={index} className="text-xs text-gray-600 flex items-center gap-1">
                  <span className="font-medium">{item.quantidade}x</span>
                  <span>{item.nome}</span>
                  {item.tamanho && (
                    <span className="text-gray-500">({item.tamanho})</span>
                  )}
                </div>
              ))}
              {pedido.itens_resumo.length > 3 && (
                <p className="text-xs text-gray-500 italic">
                  +{pedido.itens_resumo.length - 3} mais...
                </p>
              )}
            </div>
          </div>
        )}

        {/* Observações */}
        {pedido.observacoes && (
          <div className="border-t pt-2">
            <p className="text-xs text-gray-600 italic line-clamp-2">
              💬 {pedido.observacoes}
            </p>
          </div>
        )}

        {/* Total e Ações */}
        <div className="border-t pt-2 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Total</p>
            <p className="text-lg font-bold text-green-600">
              {formatCurrency(pedido.total)}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDetalhes?.(pedido)}
          >
            <Eye className="h-4 w-4 mr-1" />
            Detalhes
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
