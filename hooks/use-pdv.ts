/**
 * @fileoverview Hook para gerenciar o estado do PDV (Ponto de Venda)
 * @module hooks/use-pdv
 */

import { useState, useCallback, useMemo } from 'react'
import type {
  ItemCarrinhoPDV,
  ClientePDV,
  FormaPagamentoPDV,
  TipoEntregaPDV,
  ResumoVendaPDV,
  VendaPDV
} from '@/types/pdv'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface UsePDVReturn {
  // Estado
  itens: ItemCarrinhoPDV[]
  cliente: ClientePDV | null
  tipoEntrega: TipoEntregaPDV
  formaPagamento: FormaPagamentoPDV
  observacoes: string
  trocoPara: number | null
  mesaNumero: string
  
  // Resumo
  resumo: ResumoVendaPDV
  
  // Ações do carrinho
  adicionarItem: (item: Omit<ItemCarrinhoPDV, 'id' | 'preco_total'>) => void
  removerItem: (itemId: string) => void
  atualizarQuantidade: (itemId: string, quantidade: number) => void
  limparCarrinho: () => void
  
  // Ações de cliente
  selecionarCliente: (cliente: ClientePDV | null) => void
  
  // Ações de configuração
  setTipoEntrega: (tipo: TipoEntregaPDV) => void
  setFormaPagamento: (forma: FormaPagamentoPDV) => void
  setObservacoes: (obs: string) => void
  setTrocoPara: (valor: number | null) => void
  setMesaNumero: (numero: string) => void
  
  // Finalização
  finalizarVenda: () => Promise<{ success: boolean; pedidoId?: string }>
  
  // Utilidades
  totalItens: number
  podeFinalizarVenda: boolean
}

/**
 * Hook customizado para gerenciar o PDV
 */
export function usePDV(): UsePDVReturn {
  const [itens, setItens] = useState<ItemCarrinhoPDV[]>([])
  const [cliente, setCliente] = useState<ClientePDV | null>(null)
  const [tipoEntrega, setTipoEntrega] = useState<TipoEntregaPDV>('balcao')
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamentoPDV>('dinheiro')
  const [observacoes, setObservacoes] = useState('')
  const [trocoPara, setTrocoPara] = useState<number | null>(null)
  const [mesaNumero, setMesaNumero] = useState('')

  /**
   * Calcula o resumo financeiro da venda
   */
  const resumo = useMemo((): ResumoVendaPDV => {
    const subtotal = itens.reduce((sum, item) => sum + item.preco_total, 0)
    const taxa_entrega = tipoEntrega === 'delivery' ? 5.00 : 0 // Taxa fixa por enquanto
    const desconto = 0 // Implementar lógica de desconto se necessário
    const total = subtotal + taxa_entrega - desconto

    return {
      subtotal,
      taxa_entrega,
      desconto,
      total
    }
  }, [itens, tipoEntrega])

  /**
   * Total de itens no carrinho
   */
  const totalItens = useMemo(() => {
    return itens.reduce((sum, item) => sum + item.quantidade, 0)
  }, [itens])

  /**
   * Verifica se pode finalizar a venda
   */
  const podeFinalizarVenda = useMemo(() => {
    if (itens.length === 0) return false
    if (tipoEntrega === 'delivery' && !cliente) return false
    if (tipoEntrega === 'mesa' && !mesaNumero) return false
    return true
  }, [itens, tipoEntrega, cliente, mesaNumero])

  /**
   * Adiciona item ao carrinho
   */
  const adicionarItem = useCallback((item: Omit<ItemCarrinhoPDV, 'id' | 'preco_total'>) => {
    const novoItem: ItemCarrinhoPDV = {
      ...item,
      id: `item-${Date.now()}-${Math.random()}`,
      preco_total: item.preco_unitario * item.quantidade
    }

    setItens(prev => [...prev, novoItem])
    toast.success(`${item.nome_produto} adicionado ao carrinho`)
  }, [])

  /**
   * Remove item do carrinho
   */
  const removerItem = useCallback((itemId: string) => {
    setItens(prev => prev.filter(item => item.id !== itemId))
    toast.success('Item removido do carrinho')
  }, [])

  /**
   * Atualiza quantidade de um item
   */
  const atualizarQuantidade = useCallback((itemId: string, quantidade: number) => {
    if (quantidade <= 0) {
      removerItem(itemId)
      return
    }

    setItens(prev =>
      prev.map(item =>
        item.id === itemId
          ? { ...item, quantidade, preco_total: item.preco_unitario * quantidade }
          : item
      )
    )
  }, [removerItem])

  /**
   * Limpa o carrinho
   */
  const limparCarrinho = useCallback(() => {
    setItens([])
    setCliente(null)
    setObservacoes('')
    setTrocoPara(null)
    setMesaNumero('')
    toast.success('Carrinho limpo')
  }, [])

  /**
   * Seleciona cliente
   */
  const selecionarCliente = useCallback((novoCliente: ClientePDV | null) => {
    setCliente(novoCliente)
  }, [])

  /**
   * Finaliza a venda e cria o pedido
   */
  const finalizarVenda = useCallback(async (): Promise<{ success: boolean; pedidoId?: string }> => {
    if (!podeFinalizarVenda) {
      toast.error('Preencha todos os campos obrigatórios')
      return { success: false }
    }

    try {
      // Criar pedido
      const { data: pedido, error: pedidoError } = await supabase
        .from('pedidos')
        .insert({
          nome_cliente: cliente?.nome || 'Cliente Balcão',
          telefone_cliente: cliente?.telefone || '',
          tipo_entrega: tipoEntrega,
          endereco_entrega: cliente?.endereco || null,
          subtotal: resumo.subtotal,
          taxa_entrega: resumo.taxa_entrega,
          total: resumo.total,
          forma_pagamento: formaPagamento,
          observacoes: observacoes || null,
          status: 'pendente'
        })
        .select()
        .single()

      if (pedidoError) throw pedidoError

      // Criar itens do pedido
      const itensParaInserir = itens.map(item => ({
        pedido_id: pedido.id,
        produto_id: item.produto_id,
        nome_produto: item.nome_produto,
        quantidade: item.quantidade,
        tamanho: item.tamanho || null,
        preco_unitario: item.preco_unitario,
        preco_total: item.preco_total,
        observacoes: item.observacoes || null,
        sabores: item.sabores || null,
        adicionais: item.adicionais || null,
        borda_recheada: item.borda_recheada || null
      }))

      const { error: itensError } = await supabase
        .from('pedido_itens')
        .insert(itensParaInserir)

      if (itensError) throw itensError

      toast.success('Venda finalizada com sucesso!')
      limparCarrinho()

      return { success: true, pedidoId: pedido.id }
    } catch (error) {
      console.error('Erro ao finalizar venda:', error)
      toast.error('Erro ao finalizar venda')
      return { success: false }
    }
  }, [podeFinalizarVenda, cliente, tipoEntrega, resumo, formaPagamento, observacoes, itens, limparCarrinho])

  return {
    // Estado
    itens,
    cliente,
    tipoEntrega,
    formaPagamento,
    observacoes,
    trocoPara,
    mesaNumero,
    
    // Resumo
    resumo,
    
    // Ações do carrinho
    adicionarItem,
    removerItem,
    atualizarQuantidade,
    limparCarrinho,
    
    // Ações de cliente
    selecionarCliente,
    
    // Ações de configuração
    setTipoEntrega,
    setFormaPagamento,
    setObservacoes,
    setTrocoPara,
    setMesaNumero,
    
    // Finalização
    finalizarVenda,
    
    // Utilidades
    totalItens,
    podeFinalizarVenda
  }
}
