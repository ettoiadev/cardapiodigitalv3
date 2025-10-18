/**
 * @fileoverview Tipos TypeScript para o sistema de PDV (Ponto de Venda)
 * @module types/pdv
 */

/**
 * Forma de pagamento disponível no PDV
 */
export type FormaPagamentoPDV = 'dinheiro' | 'pix' | 'credito' | 'debito'

/**
 * Tipo de entrega do pedido
 */
export type TipoEntregaPDV = 'delivery' | 'balcao' | 'mesa'

/**
 * Item do carrinho do PDV
 */
export interface ItemCarrinhoPDV {
  id: string // ID temporário do item no carrinho
  produto_id: string
  nome_produto: string
  quantidade: number
  tamanho?: string
  preco_unitario: number
  preco_total: number
  observacoes?: string
  sabores?: any[] // Para pizzas com múltiplos sabores
  adicionais?: any[] // Adicionais selecionados
  borda_recheada?: any // Borda recheada
}

/**
 * Cliente selecionado no PDV
 */
export interface ClientePDV {
  id?: string
  nome: string
  telefone: string
  email?: string
  endereco?: string
  bairro?: string
  cep?: string
  numero?: string
  complemento?: string
}

/**
 * Resumo financeiro da venda
 */
export interface ResumoVendaPDV {
  subtotal: number
  taxa_entrega: number
  desconto: number
  total: number
}

/**
 * Dados completos da venda no PDV
 */
export interface VendaPDV {
  cliente?: ClientePDV
  tipo_entrega: TipoEntregaPDV
  forma_pagamento: FormaPagamentoPDV
  itens: ItemCarrinhoPDV[]
  resumo: ResumoVendaPDV
  observacoes?: string
  troco_para?: number // Quando pagamento em dinheiro
  mesa_numero?: string // Quando tipo_entrega = mesa
}

/**
 * Produto simplificado para exibição no grid do PDV
 */
export interface ProdutoPDV {
  id: string
  nome: string
  preco: number
  categoria_id: string
  categoria_nome?: string
  imagem_url?: string
  disponivel: boolean
  destaque?: boolean
}

/**
 * Categoria para filtro no PDV
 */
export interface CategoriaPDV {
  id: string
  nome: string
  ordem: number
  total_produtos?: number
}

/**
 * Configurações do PDV
 */
export interface ConfiguracaoPDV {
  permitir_desconto: boolean
  desconto_maximo_percentual: number
  exigir_cliente: boolean
  imprimir_automatico: boolean
  som_ao_adicionar: boolean
}

/**
 * Estatísticas do PDV
 */
export interface EstatisticasPDV {
  vendas_hoje: number
  total_vendas_hoje: number
  ticket_medio: number
  forma_pagamento_mais_usada: FormaPagamentoPDV
}
