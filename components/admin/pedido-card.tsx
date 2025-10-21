"use client"

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Clock, 
  MapPin, 
  Phone, 
  User, 
  Package,
  Eye,
  GripVertical,
  Check,
  X,
  Printer
} from 'lucide-react'
import type { Pedido } from '@/types/pedido'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface PedidoCardProps {
  pedido: Pedido
  onDetalhes?: (pedido: Pedido) => void
  onAceitar?: (pedido: Pedido) => void
  onCancelar?: (pedido: Pedido) => void
  onImprimir?: (pedido: Pedido) => void
}

export function PedidoCard({ pedido, onDetalhes, onAceitar, onCancelar, onImprimir }: PedidoCardProps) {
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
    <div
      ref={setNodeRef}
      style={style}
      className={`mb-3 bg-white rounded-lg shadow-md hover:shadow-xl transition-all ${
        isDragging ? 'shadow-2xl ring-2 ring-blue-400 scale-105' : ''
      }`}
    >
      {/* Header do Card - Número do Pedido e Badges */}
      <div className="p-3 border-b border-gray-100">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing touch-none"
            >
              <GripVertical className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            </div>
            <div>
              <h3 className="font-bold text-xl text-gray-900">{pedido.numero_pedido}</h3>
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                <Clock className="h-3 w-3" />
                {tempoDecorrido}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-1.5 items-end">
            {getTipoEntregaBadge()}
          </div>
        </div>
      </div>

      {/* Corpo do Card */}
      <div className="p-3 space-y-2.5">
        {/* Informações do Cliente */}
        <div className="space-y-1.5">
          {pedido.nome_cliente && (
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span className="font-semibold text-gray-900">{pedido.nome_cliente}</span>
            </div>
          )}
          {pedido.telefone_cliente && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span>{pedido.telefone_cliente}</span>
            </div>
          )}
          {pedido.endereco_entrega && (
            <div className="flex items-start gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
              <span className="line-clamp-3">
                {pedido.endereco_entrega}
                {pedido.endereco_bairro && (
                  <span className="font-bold">, {pedido.endereco_bairro}</span>
                )}
              </span>
            </div>
          )}
        </div>

        {/* Forma de Pagamento */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">Pagamento:</span>
          <span className="font-semibold text-gray-900">{getFormaPagamentoBadge()}</span>
        </div>

        {/* Itens do Pedido */}
        {pedido.itens_resumo && pedido.itens_resumo.length > 0 && (
          <div className="border-t border-gray-100 pt-2.5">
            <div className="flex items-center gap-2 mb-1.5">
              <Package className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-bold text-gray-700 uppercase">
                {pedido.total_itens} {pedido.total_itens === 1 ? 'item' : 'itens'}
              </span>
            </div>
            <div className="space-y-1">
              {pedido.itens_resumo.slice(0, 2).map((item, index) => (
                <div key={index} className="text-sm text-gray-700 flex items-center gap-1.5">
                  <span className="font-bold text-gray-900">{item.quantidade}x</span>
                  <span className="font-medium">
                    {(() => {
                      // Verificar se é pizza meio a meio (múltiplos sabores)
                      if (item.sabores && Array.isArray(item.sabores) && item.sabores.length > 1) {
                        return (
                          <span>
                            {item.sabores.map((sabor, idx) => (
                              <span key={idx}>
                                {idx > 0 && <span className="text-gray-400"> + </span>}
                                1/{item.sabores.length} {sabor}
                              </span>
                            ))}
                          </span>
                        )
                      }
                      return item.nome
                    })()}
                  </span>
                  {item.tamanho && (
                    <span className="text-gray-500">({item.tamanho})</span>
                  )}
                </div>
              ))}
              {pedido.itens_resumo.length > 2 && (
                <p className="text-sm text-gray-500 font-medium">
                  +{pedido.itens_resumo.length - 2} item(s) a mais
                </p>
              )}
            </div>
          </div>
        )}

        {/* Observações */}
        {pedido.observacoes && (
          <div className="border-t border-gray-100 pt-2.5">
            <p className="text-sm text-gray-600 italic line-clamp-2 bg-gray-50 p-2 rounded">
              💬 {pedido.observacoes}
            </p>
          </div>
        )}
      </div>

      {/* Footer - Total e Ações */}
      <div className="p-3 bg-gray-50 border-t border-gray-100 rounded-b-lg">
        {/* Total */}
        <div className="mb-3">
          <p className="text-xs text-gray-500 font-medium mb-0.5">Total</p>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(pedido.total)}
          </p>
        </div>

        {/* Botões de Ação */}
        <div className="grid grid-cols-2 gap-2">
          {/* Linha 1: Aceitar e Cancelar */}
          {pedido.status === 'pendente' && (
            <>
              <Button
                variant="default"
                size="sm"
                onClick={() => onAceitar?.(pedido)}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold"
              >
                <Check className="h-4 w-4 mr-1.5" />
                Aceitar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onCancelar?.(pedido)}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold"
              >
                <X className="h-4 w-4 mr-1.5" />
                Cancelar
              </Button>
            </>
          )}
          
          {/* Linha 2: Imprimir e Ver Detalhes */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onImprimir?.(pedido)}
            className="bg-gray-100 border-gray-300 hover:bg-gray-200 font-semibold"
          >
            <Printer className="h-4 w-4 mr-1.5" />
            Imprimir
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => onDetalhes?.(pedido)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
          >
            <Eye className="h-4 w-4 mr-1.5" />
            Detalhes
          </Button>
        </div>
      </div>
    </div>
  )
}
