/**
 * @fileoverview Validadores para dados JSONB de pedidos
 * @module lib/validators/pedido-validators
 */

/**
 * Interface para borda recheada
 */
export interface BordaRecheada {
  id: string
  nome: string
  preco: number
}

/**
 * Interface para item adicional
 */
export interface ItemAdicional {
  nome: string
  preco: number
}

/**
 * Interface para adicional com sabor
 */
export interface AdicionalComSabor {
  sabor: string
  itens: ItemAdicional[]
}

/**
 * Valida se um valor é uma borda recheada válida
 */
export const validateBordaRecheada = (borda: any): borda is BordaRecheada => {
  if (!borda || typeof borda !== 'object') {
    return false
  }

  return (
    typeof borda.nome === 'string' &&
    borda.nome.trim().length > 0 &&
    (typeof borda.id === 'string' || typeof borda.id === 'number') &&
    (typeof borda.preco === 'number' || borda.preco === undefined)
  )
}

/**
 * Valida se um valor é um array de adicionais válido
 */
export const validateAdicionais = (adicionais: any): adicionais is AdicionalComSabor[] => {
  if (!Array.isArray(adicionais)) {
    return false
  }

  return adicionais.every(adicional => {
    if (!adicional || typeof adicional !== 'object') {
      return false
    }

    // Sabor é opcional, mas se existir deve ser string
    const saborValido = !adicional.sabor || typeof adicional.sabor === 'string'

    // Itens deve ser array
    const itensValido = Array.isArray(adicional.itens) &&
      adicional.itens.every((item: any) =>
        item &&
        typeof item === 'object' &&
        typeof item.nome === 'string' &&
        item.nome.trim().length > 0
      )

    return saborValido && itensValido
  })
}

/**
 * Valida se um valor é um array de sabores válido
 */
export const validateSabores = (sabores: any): sabores is string[] => {
  if (!Array.isArray(sabores)) {
    return false
  }

  return sabores.every(sabor =>
    typeof sabor === 'string' &&
    sabor.trim().length > 0
  )
}

/**
 * Sanitiza HTML para prevenir XSS
 */
export const escapeHtml = (text: string | null | undefined): string => {
  if (!text) return ''
  
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

/**
 * Formata adicionais para exibição segura
 */
export const formatAdicionaisDisplay = (adicionais: any[]): string => {
  if (!validateAdicionais(adicionais)) {
    return ''
  }

  return adicionais
    .map(adicional => {
      const sabor = adicional.sabor || 'Geral'
      const itens = adicional.itens.map((i: ItemAdicional) => i.nome).join(', ')
      return `${sabor}: ${itens}`
    })
    .join(' | ')
}

/**
 * Formata sabores para exibição
 */
export const formatSaboresDisplay = (sabores: any[]): string => {
  if (!validateSabores(sabores)) {
    return ''
  }

  if (sabores.length === 0) return ''
  if (sabores.length === 1) return sabores[0]
  
  return sabores.map((sabor, idx) => `1/${sabores.length} ${sabor}`).join(' + ')
}

/**
 * Valida transição de status
 */
export type StatusPedido = 'pendente' | 'em_preparo' | 'saiu_entrega' | 'finalizado' | 'cancelado'

export const TRANSICOES_PERMITIDAS: Record<StatusPedido, StatusPedido[]> = {
  pendente: ['em_preparo', 'cancelado'],
  em_preparo: ['saiu_entrega', 'cancelado'],
  saiu_entrega: ['finalizado', 'cancelado'],
  finalizado: [],
  cancelado: []
}

export const isTransicaoPermitida = (
  statusAtual: StatusPedido,
  statusNovo: StatusPedido
): boolean => {
  return TRANSICOES_PERMITIDAS[statusAtual]?.includes(statusNovo) || false
}

export const getProximoStatus = (statusAtual: StatusPedido): StatusPedido | null => {
  const transicoes: Record<StatusPedido, StatusPedido | null> = {
    pendente: 'em_preparo',
    em_preparo: 'saiu_entrega',
    saiu_entrega: 'finalizado',
    finalizado: null,
    cancelado: null
  }
  
  return transicoes[statusAtual]
}
