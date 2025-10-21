"use client"

import { useState, useEffect, useCallback } from 'react'
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
  Loader2,
  Check,
  X,
  Printer,
  ShoppingCart
} from 'lucide-react'
import type { Pedido, StatusPedido, ItemPedido, HistoricoPedido } from '@/types/pedido'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { formatDistanceToNow, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { createLogger } from '@/lib/utils/logger'
import {
  validateBordaRecheada,
  validateAdicionais,
  validateSabores,
  escapeHtml,
  formatAdicionaisDisplay,
  formatSaboresDisplay,
  getProximoStatus,
  isTransicaoPermitida
} from '@/lib/validators/pedido-validators'

const logger = createLogger('PedidoDetalhesModal')

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
  const [atualizandoStatus, setAtualizandoStatus] = useState(false)

  useEffect(() => {
    if (!pedido?.id || !open) {
      return
    }

    logger.info('Modal aberto', { pedidoId: pedido.id, numeroPedido: pedido.numero_pedido })
    
    let cancelled = false

    const carregarDados = async () => {
      if (cancelled) return
      
      await Promise.all([
        carregarItens(),
        carregarHistorico()
      ])
    }

    carregarDados()

    return () => {
      cancelled = true
      logger.debug('Modal fechado, cancelando requisições')
    }
  }, [pedido?.id, open])

  const carregarItens = useCallback(async () => {
    if (!pedido) return

    setLoadingItens(true)
    
    try {
      const result = await logger.measureTime(
        `Carregar itens do pedido ${pedido?.numero_pedido}`,
        async () => {
          const { data, error } = await supabase
            .from('pedido_itens')
            .select('*')
            .eq('pedido_id', pedido!.id)
            .order('created_at', { ascending: true })

          if (error) throw error
          return data || []
        }
      )

      logger.info(`${result.length} itens carregados`)
      setItens(result)
    } catch (error) {
      logger.error('Erro ao carregar itens', error)
      toast.error('Erro ao carregar itens do pedido')
      setItens([])
    } finally {
      setLoadingItens(false)
    }
  }, [pedido?.id, pedido?.numero_pedido])

  const carregarHistorico = useCallback(async () => {
    if (!pedido) return

    setLoadingHistorico(true)
    
    try {
      const result = await logger.measureTime(
        `Carregar histórico do pedido ${pedido?.numero_pedido}`,
        async () => {
          const { data, error } = await supabase
            .from('pedido_historico')
            .select('*')
            .eq('pedido_id', pedido!.id)
            .order('created_at', { ascending: false })

          if (error) throw error
          return data || []
        }
      )

      logger.info(`${result.length} registros de histórico carregados`)
      setHistorico(result)
    } catch (error) {
      logger.warn('Erro ao carregar histórico (não crítico)', error)
      setHistorico([])
    } finally {
      setLoadingHistorico(false)
    }
  }, [pedido?.id, pedido?.numero_pedido])

  const atualizarStatusPedido = async (novoStatus: StatusPedido, observacao?: string) => {
    if (!pedido) {
      logger.warn('Tentativa de atualizar status sem pedido')
      return false
    }

    // Validar transição
    if (!isTransicaoPermitida(pedido.status, novoStatus)) {
      logger.warn('Transição de status não permitida', {
        statusAtual: pedido.status,
        statusNovo: novoStatus
      })
      toast.error(`Não é possível mudar de "${pedido.status}" para "${novoStatus}"`)
      return false
    }

    logger.info('Atualizando status do pedido', {
      pedidoId: pedido.id,
      statusAtual: pedido.status,
      statusNovo: novoStatus
    })

    try {
      // Atualizar status
      const { error: updateError } = await supabase
        .from('pedidos')
        .update({
          status: novoStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', pedido.id)

      if (updateError) throw updateError

      // Criar histórico
      const { error: historyError } = await supabase
        .from('pedido_historico')
        .insert({
          pedido_id: pedido.id,
          status_anterior: pedido.status,
          status_novo: novoStatus,
          observacao: observacao || `Status alterado para ${novoStatus}`,
          alterado_por: 'admin'
        })

      if (historyError) {
        logger.error('Erro ao criar histórico (não crítico)', historyError)
        toast.warning('Status atualizado, mas histórico não foi registrado')
      }

      logger.info('Status atualizado com sucesso')
      toast.success(`Pedido movido para "${novoStatus}"`)
      onStatusChange?.()
      onClose()
      return true
    } catch (error) {
      logger.error('Erro ao atualizar status', error)
      toast.error('Erro ao atualizar pedido')
      return false
    }
  }

  const handleCancelar = async () => {
    if (!pedido || !motivoCancelamento.trim()) {
      toast.error('Informe o motivo do cancelamento')
      return
    }

    logger.info('Cancelando pedido', { pedidoId: pedido.id, motivo: motivoCancelamento })
    setCancelando(true)
    
    try {
      const sucesso = await atualizarStatusPedido('cancelado', `Cancelado: ${motivoCancelamento}`)
      if (sucesso) {
        // Atualizar motivo de cancelamento
        const { error } = await supabase
          .from('pedidos')
          .update({ motivo_cancelamento: motivoCancelamento })
          .eq('id', pedido.id)

        if (error) {
          logger.error('Erro ao salvar motivo de cancelamento', error)
        }

        setShowCancelDialog(false)
        setMotivoCancelamento('')
      }
    } catch (error) {
      logger.error('Erro ao cancelar pedido', error)
      toast.error('Erro ao cancelar pedido')
    } finally {
      setCancelando(false)
    }
  }

  const handleAceitar = async () => {
    setAtualizandoStatus(true)
    try {
      await atualizarStatusPedido('em_preparo', 'Pedido aceito e iniciado')
    } finally {
      setAtualizandoStatus(false)
    }
  }

  const handleConfirmar = async () => {
    if (!pedido) return
    
    const proximoStatus = getProximoStatus(pedido.status)
    
    if (!proximoStatus) {
      toast.error('Não é possível avançar este pedido')
      return
    }

    setAtualizandoStatus(true)
    try {
      await atualizarStatusPedido(proximoStatus)
    } finally {
      setAtualizandoStatus(false)
    }
  }

  const handleImprimir = () => {
    if (!pedido) {
      logger.warn('Tentativa de imprimir sem pedido')
      return
    }

    logger.info('Imprimindo pedido', { pedidoId: pedido.id })
    
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Pedido ${escapeHtml(pedido.numero_pedido)}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; }
              h1 { font-size: 24px; margin-bottom: 10px; text-align: center; }
              .info { margin: 10px 0; padding: 5px 0; border-bottom: 1px solid #eee; }
              .items { margin-top: 20px; }
              .item { margin: 8px 0; padding: 5px; background: #f9f9f9; }
              .total { font-size: 20px; font-weight: bold; margin-top: 20px; text-align: center; }
              .header { background: #f0f0f0; padding: 10px; margin-bottom: 20px; text-align: center; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Pedido ${escapeHtml(pedido.numero_pedido)}</h1>
              <p>Status: ${escapeHtml(pedido.status)}</p>
              <p>Data: ${pedido.created_at ? format(new Date(pedido.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : 'Data não disponível'}</p>
            </div>

            <div class="info"><strong>Cliente:</strong> ${escapeHtml(pedido.nome_cliente || 'N/A')}</div>
            <div class="info"><strong>Telefone:</strong> ${escapeHtml(pedido.telefone_cliente || 'N/A')}</div>
            <div class="info"><strong>Endereço:</strong> ${escapeHtml(pedido.endereco_entrega || 'Retirada no balcão')}</div>
            <div class="info"><strong>Pagamento:</strong> ${escapeHtml(pedido.forma_pagamento)}</div>
            ${pedido.forma_pagamento === 'dinheiro' && pedido.troco_para ? `
              <div class="info" style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 10px; margin: 10px 0;">
                <strong>💵 Cliente vai pagar com:</strong> R$ ${pedido.troco_para.toFixed(2)}<br>
                <strong>💰 Troco a devolver:</strong> <span style="font-size: 18px; color: #b45309;">R$ ${(pedido.troco_para - pedido.total).toFixed(2)}</span>
              </div>
            ` : ''}

            <div class="items">
              <h2>Itens:</h2>
              ${itens.map(item => `
                <div class="item">
                  <strong>${escapeHtml(String(item.quantidade))}x ${escapeHtml(item.nome_produto)}</strong>
                  ${item.tamanho ? `<br>Tamanho: ${escapeHtml(item.tamanho)}` : ''}
                  ${validateSabores(item.sabores) ? `<br>Sabores: ${escapeHtml(item.sabores.join(', '))}` : ''}
                  ${item.observacoes ? `<br><em>Obs: ${escapeHtml(item.observacoes)}</em>` : ''}
                </div>
              `).join('')}
            </div>

            ${pedido.observacoes ? `<div class="info"><strong>Observações Gerais:</strong> ${escapeHtml(pedido.observacoes)}</div>` : ''}

            <div class="total">
              Total: R$ ${pedido?.total.toFixed(2)}
            </div>
            <script>window.print(); window.close();</script>
          </body>
        </html>
      `)
      printWindow.document.close()
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
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Pedido {pedido.numero_pedido}
              </span>
              {getStatusBadge(pedido.status)}
            </DialogTitle>
            <DialogDescription>
              Criado {formatDistanceToNow(new Date(pedido.created_at), {
                addSuffix: true,
                locale: ptBR
              })}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 overflow-y-auto max-h-[calc(90vh-250px)]">
            <div className="space-y-6 pr-4">
              {/* Informações do Cliente */}
              <div className="bg-white p-4 rounded-lg border">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Informações do Cliente
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {pedido.nome_cliente && (
                    <div>
                      <span className="font-medium text-gray-600">Nome:</span>
                      <p className="font-semibold">{pedido.nome_cliente}</p>
                    </div>
                  )}
                  {pedido.telefone_cliente && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{pedido.telefone_cliente}</span>
                    </div>
                  )}
                  {pedido.endereco_entrega && (
                    <div className="md:col-span-2 flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                      <span>
                        {pedido.endereco_entrega}
                        {pedido.endereco_bairro && (
                          <span className="font-bold">, {pedido.endereco_bairro}</span>
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Itens do Pedido */}
              <div className="bg-white p-4 rounded-lg border">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Itens do Pedido ({itens.length})
                </h3>

                {loadingItens ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : itens.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhum item encontrado</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {itens.map((item, index) => (
                      <div key={item.id} className="p-4 bg-gray-50 rounded-lg border">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1">
                            {/* Nome e quantidade */}
                            <div className="flex items-center gap-2 mb-2">
                              <span className="bg-red-600 text-white px-2 py-1 rounded text-sm font-bold">
                                {item.quantidade}x
                              </span>
                              <h4 className="text-lg font-bold text-gray-900">
                                {(() => {
                                  // Verificar se é pizza meio a meio (múltiplos sabores)
                                  if (validateSabores(item.sabores) && item.sabores.length > 1) {
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
                                  return item.nome_produto
                                })()}
                              </h4>
                            </div>

                            {/* Tamanho */}
                            {item.tamanho && (
                              <p className="text-sm text-gray-700 mb-2">
                                <strong>Tamanho:</strong> <span className="capitalize">{item.tamanho}</span>
                              </p>
                            )}

                            {/* Sabores (se for meio a meio) */}
                            {validateSabores(item.sabores) && item.sabores.length > 1 && (
                              <div className="mb-2">
                                <p className="text-sm font-semibold text-gray-700 mb-1">Sabores:</p>
                                <div className="flex flex-wrap gap-1">
                                  {item.sabores.map((sabor, idx) => (
                                    <span key={idx} className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                                      {sabor}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Adicionais */}
                            {validateAdicionais(item.adicionais) && (
                              <div className="mb-2">
                                <p className="text-sm font-semibold text-gray-700 mb-1">Adicionais:</p>
                                {item.adicionais.map((adicional, idx) => {
                                  const sabor = adicional.sabor || 'Geral'
                                  const itens = adicional.itens.map(i => i.nome).join(', ')
                                  
                                  if (!itens) return null
                                  
                                  return (
                                    <div key={idx} className="ml-2 text-sm text-gray-600">
                                      <strong>{sabor}:</strong> {itens}
                                    </div>
                                  )
                                })}
                              </div>
                            )}

                            {/* Borda Recheada */}
                            {validateBordaRecheada(item.borda_recheada) && (
                              <p className="text-sm text-gray-700 mb-2">
                                <strong>Borda:</strong> <span className="text-orange-600">{item.borda_recheada.nome}</span>
                              </p>
                            )}

                            {/* Observações */}
                            {item.observacoes && (
                              <div className="mt-2 p-2 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                                <p className="text-sm text-gray-700">
                                  <strong>💬 Obs:</strong> {item.observacoes}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Preços */}
                          <div className="text-right flex-shrink-0">
                            <p className="text-xl font-bold text-green-600">{formatCurrency(item.preco_total)}</p>
                            <p className="text-sm text-gray-500">
                              {formatCurrency(item.preco_unitario)} un.
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Resumo Financeiro */}
              <div className="bg-white p-4 rounded-lg border">
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
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span className="text-green-600">{formatCurrency(pedido.total)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Forma de Pagamento:</span>
                    <span className="capitalize font-medium">{pedido.forma_pagamento}</span>
                  </div>
                  {pedido.forma_pagamento === 'dinheiro' && pedido.troco_para && (
                    <>
                      <Separator />
                      <div className="bg-yellow-50 border border-yellow-200 rounded p-3 space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-yellow-700 font-semibold">💵 Cliente vai pagar com:</span>
                          <span className="font-bold text-yellow-900">{formatCurrency(pedido.troco_para)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-yellow-700 font-semibold">💰 Troco a devolver:</span>
                          <span className="font-bold text-yellow-900 text-lg">
                            {formatCurrency(pedido.troco_para - pedido.total)}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Observações Gerais */}
              {pedido.observacoes && (
                <div className="bg-white p-4 rounded-lg border">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Observações Gerais
                  </h3>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                    {pedido.observacoes}
                  </p>
                </div>
              )}

              {/* Motivo de Cancelamento */}
              {pedido.status === 'cancelado' && pedido.motivo_cancelamento && (
                <div className="bg-white p-4 rounded-lg border border-red-200">
                  <h3 className="font-semibold mb-3 flex items-center gap-2 text-red-600">
                    <XCircle className="h-4 w-4" />
                    Motivo do Cancelamento
                  </h3>
                  <p className="text-sm text-gray-600 bg-red-50 p-3 rounded">
                    {pedido.motivo_cancelamento}
                  </p>
                </div>
              )}

              {/* Histórico de Status */}
              {historico.length > 0 && (
                <div className="bg-white p-4 rounded-lg border">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Histórico de Status
                  </h3>
                  <div className="space-y-2">
                    {historico.map(h => (
                      <div key={h.id} className="text-sm p-3 bg-gray-50 rounded">
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
              )}
            </div>
          </ScrollArea>

          {/* Ações - Botões em uma linha */}
          <div className="flex-shrink-0 pt-3 border-t mt-auto">
            <div className="grid grid-cols-3 gap-2">
              {/* Cancelar - esquerda */}
              {pedido.status !== 'cancelado' && pedido.status !== 'finalizado' ? (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowCancelDialog(true)}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs md:text-sm"
                >
                  <X className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-1.5" />
                  Cancelar
                </Button>
              ) : (
                <div></div>
              )}

              {/* Imprimir - centro */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleImprimir}
                className="bg-gray-100 border-gray-300 hover:bg-gray-200 font-semibold text-xs md:text-sm"
              >
                <Printer className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-1.5" />
                Imprimir
              </Button>

              {/* Aceitar/Confirmar - direita */}
              {pedido.status === 'pendente' ? (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleAceitar}
                  disabled={atualizandoStatus}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold text-xs md:text-sm"
                >
                  {atualizandoStatus && <Loader2 className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-1.5 animate-spin" />}
                  {!atualizandoStatus && <Check className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-1.5" />}
                  Aceitar
                </Button>
              ) : pedido.status !== 'cancelado' && pedido.status !== 'finalizado' ? (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleConfirmar}
                  disabled={atualizandoStatus}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs md:text-sm"
                >
                  {atualizandoStatus && <Loader2 className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-1.5 animate-spin" />}
                  {!atualizandoStatus && <Check className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-1.5" />}
                  Confirmar
                </Button>
              ) : (
                <div></div>
              )}
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
