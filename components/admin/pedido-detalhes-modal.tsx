"use client"

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { 
  User, 
  Phone, 
  MapPin, 
  Clock, 
  Package,
  CreditCard,
  MessageSquare,
  XCircle,
  Loader2
} from 'lucide-react'
import type { Pedido, StatusPedido, ItemPedido, HistoricoPedido } from '@/types/pedido'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { formatDistanceToNow, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { PedidoStatusActions } from './pedido-status-actions'

interface PedidoDetalhesModalProps {
  pedido: Pedido | null
  open: boolean
  onClose: () => void
  onStatusChange?: () => void
}

export function PedidoDetalhesModal({ 
  pedido, 
  open, 
  onClose,
  onStatusChange 
}: PedidoDetalhesModalProps) {
  const [itens, setItens] = useState<ItemPedido[]>([])
  const [historico, setHistorico] = useState<HistoricoPedido[]>([])
  const [loadingItens, setLoadingItens] = useState(false)
  const [loadingHistorico, setLoadingHistorico] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [motivoCancelamento, setMotivoCancelamento] = useState('')
  const [cancelando, setCancelando] = useState(false)

  useEffect(() => {
    if (pedido && open) {
      carregarItens()
      carregarHistorico()
    }
  }, [pedido, open])

  const carregarItens = async () => {
    if (!pedido) return

    setLoadingItens(true)
    try {
      const { data, error } = await supabase
        .from('pedido_itens')
        .select('*')
        .eq('pedido_id', pedido.id)
        .order('created_at', { ascending: true })

      if (error) throw error
      setItens(data || [])
    } catch (error) {
      console.error('Erro ao carregar itens:', error)
      toast.error('Erro ao carregar itens do pedido')
    } finally {
      setLoadingItens(false)
    }
  }

  const carregarHistorico = async () => {
    if (!pedido) return

    setLoadingHistorico(true)
    try {
      const { data, error } = await supabase
        .from('pedido_historico')
        .select('*')
        .eq('pedido_id', pedido.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setHistorico(data || [])
    } catch (error) {
      console.error('Erro ao carregar histórico:', error)
    } finally {
      setLoadingHistorico(false)
    }
  }

  const handleCancelar = async () => {
    if (!pedido || !motivoCancelamento.trim()) {
      toast.error('Informe o motivo do cancelamento')
      return
    }

    setCancelando(true)
    try {
      const { error } = await supabase
        .from('pedidos')
        .update({
          status: 'cancelado',
          motivo_cancelamento: motivoCancelamento,
          updated_at: new Date().toISOString()
        })
        .eq('id', pedido.id)

      if (error) throw error

      toast.success('Pedido cancelado com sucesso')
      setShowCancelDialog(false)
      setMotivoCancelamento('')
      onStatusChange?.()
      onClose()
    } catch (error) {
      console.error('Erro ao cancelar pedido:', error)
      toast.error('Erro ao cancelar pedido')
    } finally {
      setCancelando(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const getStatusBadge = (status: StatusPedido) => {
    const badges = {
      pendente: { label: 'Pendente', cor: 'bg-yellow-100 text-yellow-800' },
      em_preparo: { label: 'Em Preparo', cor: 'bg-blue-100 text-blue-800' },
      saiu_entrega: { label: 'Saiu para Entrega', cor: 'bg-purple-100 text-purple-800' },
      finalizado: { label: 'Finalizado', cor: 'bg-green-100 text-green-800' },
      cancelado: { label: 'Cancelado', cor: 'bg-red-100 text-red-800' }
    }
    const badge = badges[status] || badges.pendente
    return <Badge className={badge.cor}>{badge.label}</Badge>
  }

  if (!pedido) return null

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Pedido {pedido.numero_pedido}</span>
              {getStatusBadge(pedido.status)}
            </DialogTitle>
            <DialogDescription>
              Criado {formatDistanceToNow(new Date(pedido.created_at), { 
                addSuffix: true, 
                locale: ptBR 
              })}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(90vh-200px)]">
            <div className="space-y-6 pr-4">
              {/* Informações do Cliente */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Informações do Cliente
                </h3>
                <div className="space-y-2 text-sm">
                  {pedido.nome_cliente && (
                    <p><strong>Nome:</strong> {pedido.nome_cliente}</p>
                  )}
                  {pedido.telefone_cliente && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span>{pedido.telefone_cliente}</span>
                    </div>
                  )}
                  {pedido.endereco_entrega && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                      <span>{pedido.endereco_entrega}</span>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Itens do Pedido */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Itens do Pedido
                </h3>
                {loadingItens ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {itens.map(item => (
                      <div key={item.id} className="flex justify-between items-start p-2 bg-gray-50 rounded">
                        <div>
                          <p className="font-medium">
                            {item.quantidade}x {item.nome_produto}
                          </p>
                          {item.tamanho && (
                            <p className="text-sm text-gray-600">Tamanho: {item.tamanho}</p>
                          )}
                          {item.observacoes && (
                            <p className="text-sm text-gray-600 italic">Obs: {item.observacoes}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(item.subtotal)}</p>
                          <p className="text-xs text-gray-500">
                            {formatCurrency(item.preco_unitario)} un.
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Resumo Financeiro */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Resumo Financeiro
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(pedido.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxa de Entrega:</span>
                    <span>{formatCurrency(pedido.taxa_entrega)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-base">
                    <span>Total:</span>
                    <span className="text-green-600">{formatCurrency(pedido.total)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Forma de Pagamento:</span>
                    <span className="capitalize">{pedido.forma_pagamento}</span>
                  </div>
                </div>
              </div>

              {/* Observações */}
              {pedido.observacoes && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Observações
                    </h3>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                      {pedido.observacoes}
                    </p>
                  </div>
                </>
              )}

              {/* Motivo de Cancelamento */}
              {pedido.status === 'cancelado' && pedido.motivo_cancelamento && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2 text-red-600">
                      <XCircle className="h-4 w-4" />
                      Motivo do Cancelamento
                    </h3>
                    <p className="text-sm text-gray-600 bg-red-50 p-3 rounded border border-red-200">
                      {pedido.motivo_cancelamento}
                    </p>
                  </div>
                </>
              )}

              {/* Histórico */}
              {historico.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Histórico de Status
                    </h3>
                    <div className="space-y-2">
                      {historico.map(h => (
                        <div key={h.id} className="text-sm p-2 bg-gray-50 rounded">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">
                                {h.status_anterior ? `${h.status_anterior} → ` : ''}
                                <span className="text-blue-600">{h.status_novo}</span>
                              </p>
                              {h.observacao && (
                                <p className="text-gray-600 text-xs mt-1">{h.observacao}</p>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">
                              {format(new Date(h.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </ScrollArea>

          {/* Ações */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div>
              {pedido.status !== 'cancelado' && pedido.status !== 'finalizado' && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowCancelDialog(true)}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancelar Pedido
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <PedidoStatusActions
                pedidoId={pedido.id}
                statusAtual={pedido.status}
                onStatusChange={() => {
                  onStatusChange?.()
                  carregarHistorico()
                }}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Cancelamento */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Pedido</AlertDialogTitle>
            <AlertDialogDescription>
              Informe o motivo do cancelamento do pedido {pedido.numero_pedido}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="Ex: Cliente solicitou cancelamento, produto indisponível..."
            value={motivoCancelamento}
            onChange={(e) => setMotivoCancelamento(e.target.value)}
            rows={4}
          />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelando}>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelar}
              disabled={cancelando || !motivoCancelamento.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              {cancelando && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirmar Cancelamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
