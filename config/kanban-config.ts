/**
 * @fileoverview Configuração das colunas do Kanban de Pedidos
 * @module config/kanban-config
 */

import type { ColunaKanban, StatusPedido } from '@/types/pedido'

/**
 * Configuração das colunas do Kanban
 */
export const COLUNAS_KANBAN: ColunaKanban[] = [
  {
    id: 'pendente',
    titulo: 'Pendente',
    cor: 'bg-yellow-500',
    corTexto: 'text-white',
    icone: 'clock',
    ordem: 1
  },
  {
    id: 'em_preparo',
    titulo: 'Em Preparo',
    cor: 'bg-blue-500',
    corTexto: 'text-white',
    icone: 'chef-hat',
    ordem: 2
  },
  {
    id: 'saiu_entrega',
    titulo: 'Saiu para Entrega',
    cor: 'bg-purple-500',
    corTexto: 'text-white',
    icone: 'truck',
    ordem: 3
  },
  {
    id: 'finalizado',
    titulo: 'Finalizado',
    cor: 'bg-green-500',
    corTexto: 'text-white',
    icone: 'check-circle',
    ordem: 4
  },
  {
    id: 'cancelado',
    titulo: 'Cancelado',
    cor: 'bg-red-500',
    corTexto: 'text-white',
    icone: 'x-circle',
    ordem: 5
  }
]

/**
 * Transições de status permitidas
 */
export const TRANSICOES_PERMITIDAS: Record<StatusPedido, StatusPedido[]> = {
  pendente: ['em_preparo', 'cancelado'],
  em_preparo: ['saiu_entrega', 'finalizado', 'cancelado'],
  saiu_entrega: ['finalizado', 'cancelado'],
  finalizado: [],
  cancelado: []
}

/**
 * Valida se uma transição de status é permitida
 */
export function validarTransicaoStatus(
  statusAtual: StatusPedido,
  novoStatus: StatusPedido
): boolean {
  // Cancelado pode vir de qualquer status (exceto finalizado)
  if (novoStatus === 'cancelado' && statusAtual !== 'finalizado') {
    return true
  }

  // Finalizado pode vir de qualquer status (exceto cancelado)
  if (novoStatus === 'finalizado' && statusAtual !== 'cancelado') {
    return true
  }

  // Verificar transições normais
  return TRANSICOES_PERMITIDAS[statusAtual]?.includes(novoStatus) || false
}

/**
 * Retorna o label amigável de um status
 */
export function getStatusLabel(status: StatusPedido): string {
  const labels: Record<StatusPedido, string> = {
    pendente: 'Pendente',
    em_preparo: 'Em Preparo',
    saiu_entrega: 'Saiu para Entrega',
    finalizado: 'Finalizado',
    cancelado: 'Cancelado'
  }
  return labels[status] || status
}

/**
 * Retorna a cor do badge de um status
 */
export function getStatusBadgeColor(status: StatusPedido): string {
  const colors: Record<StatusPedido, string> = {
    pendente: 'bg-yellow-100 text-yellow-800',
    em_preparo: 'bg-blue-100 text-blue-800',
    saiu_entrega: 'bg-purple-100 text-purple-800',
    finalizado: 'bg-green-100 text-green-800',
    cancelado: 'bg-red-100 text-red-800'
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}
