/**
 * @fileoverview Tipos TypeScript para o sistema de pedidos Kanban
 * @module types/pedido
 */

/**
 * Status possíveis de um pedido no fluxo Kanban
 */
export type StatusPedido = 
  | 'pendente' 
  | 'em_preparo' 
  | 'saiu_entrega' 
  | 'finalizado' 
  | 'cancelado'

/**
 * Tipo de entrega do pedido
 */
export type TipoEntrega = 'delivery' | 'balcao' | 'mesa'

/**
 * Forma de pagamento
 */
export type FormaPagamento = 'dinheiro' | 'pix' | 'credito' | 'debito'

/**
 * Item resumido do pedido (para preview no card)
 */
export interface ItemResumoPedido {
  nome: string
  quantidade: number
  tamanho?: string
  sabores?: any // JSONB array
  adicionais?: any // JSONB array
  borda_recheada?: any // JSONB object
  observacoes?: string
  preco_unitario?: number
  preco_total?: number
}

/**
 * Item completo do pedido
 */
export interface ItemPedido {
  id: string
  pedido_id: string
  produto_id: string | null
  nome_produto: string
  quantidade: number
  tamanho?: string
  sabores?: any[] // JSONB array
  adicionais?: any[] // JSONB array
  borda_recheada?: any // JSONB object
  preco_unitario: number
  preco_total: number
  observacoes?: string
  created_at: string
}

/**
 * Histórico de mudança de status
 */
export interface HistoricoPedido {
  id: string
  pedido_id: string
  status_anterior?: string
  status_novo: string
  alterado_por?: string
  observacao?: string
  created_at: string
}

/**
 * Pedido completo do sistema
 */
export interface Pedido {
  id: string
  numero_pedido: string
  
  // Dados do cliente
  user_id?: string
  nome_cliente?: string
  telefone_cliente?: string
  
  // Dados da entrega
  tipo_entrega: TipoEntrega
  endereco_entrega?: string
  
  // Campos de endereço separados (da view atualizada)
  endereco_rua?: string
  endereco_numero?: string
  endereco_bairro?: string
  endereco_cidade?: string
  endereco_estado?: string
  endereco_cep?: string
  endereco_complemento?: string
  
  // Status e controle
  status: StatusPedido
  status_anterior?: string
  ordem_kanban: number
  
  // Valores
  subtotal: number
  taxa_entrega: number
  total: number
  forma_pagamento: FormaPagamento
  troco_para?: number
  
  // Observações
  observacoes?: string
  motivo_cancelamento?: string
  
  // Auditoria
  created_at: string
  updated_at: string
  alterado_por?: string
  
  // Dados agregados (da view)
  total_itens?: number
  itens_resumo?: ItemResumoPedido[]
}

/**
 * Configuração de uma coluna do Kanban
 */
export interface ColunaKanban {
  id: StatusPedido
  titulo: string
  cor: string
  corTexto: string
  icone: string
  ordem: number
}

/**
 * Estatísticas do Kanban
 */
export interface EstatisticasKanban {
  status: StatusPedido
  total_pedidos: number
  valor_total: number
}

/**
 * Filtros para busca de pedidos
 */
export interface FiltrosPedidos {
  busca?: string
  status?: StatusPedido[]
  tipo_entrega?: TipoEntrega[]
  data_inicio?: string
  data_fim?: string
}

/**
 * Dados para atualização de status
 */
export interface AtualizacaoStatus {
  pedido_id: string
  status_novo: StatusPedido
  alterado_por?: string
  observacao?: string
}

/**
 * Dados para cancelamento de pedido
 */
export interface CancelamentoPedido {
  pedido_id: string
  motivo_cancelamento: string
  alterado_por?: string
}
