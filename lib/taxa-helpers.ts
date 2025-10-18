/**
 * @fileoverview Helpers para cálculo, validação e busca de taxas de entrega
 * @module taxa-helpers
 */

import { supabase } from "./supabase"

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

/**
 * Comprimento válido de um CEP brasileiro
 */
const CEP_LENGTH = 8

/**
 * URL base da API ViaCEP
 */
const VIACEP_API_URL = 'https://viacep.com.br/ws'

/**
 * Regex para remover caracteres não numéricos
 */
const NON_DIGIT_PATTERN = /\D/g

/**
 * Interface para resposta da API ViaCEP
 */
interface ViaCepResponse {
  logradouro?: string
  bairro?: string
  localidade?: string
  uf?: string
  erro?: boolean
}

/**
 * Interface para endereço normalizado
 */
export interface Endereco {
  logradouro: string
  bairro: string
  localidade: string
  uf: string
}

/**
 * Interface que representa os dados de uma taxa de entrega
 * @interface TaxaEntrega
 * @property {number} taxa - Valor da taxa de entrega em reais (BRL)
 * @property {string} bairro - Nome do bairro atendido
 * @property {number} tempo_min - Tempo mínimo estimado de entrega em minutos
 * @property {number} tempo_max - Tempo máximo estimado de entrega em minutos
 */
export interface TaxaEntrega {
  taxa: number
  bairro: string
  tempo_min: number
  tempo_max: number
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Remove formatação do CEP, mantendo apenas dígitos
 */
function normalizeCep(cep: string): string {
  return cep.replace(NON_DIGIT_PATTERN, '')
}

/**
 * Valida se o CEP tem o comprimento correto
 */
function isValidCepLength(cep: string): boolean {
  return cep.length === CEP_LENGTH
}

/**
 * Mapeia dados da resposta do banco para interface TaxaEntrega
 */
function mapToTaxaEntrega(data: any): TaxaEntrega {
  return {
    taxa: Number(data.taxa),
    bairro: data.bairro,
    tempo_min: data.tempo_min || data.tempo_estimado_min,
    tempo_max: data.tempo_max || data.tempo_estimado_max
  }
}

/**
 * Trata erros de forma consistente
 */
function handleError(error: unknown, context: string): void {
  const errorMessage = error instanceof Error ? error.message : String(error)
  console.error(`[Taxa Error - ${context}]:`, errorMessage)
}

// ============================================================================
// PUBLIC API - BUSCA DE TAXAS
// ============================================================================

/**
 * Busca a taxa de entrega baseada no CEP do cliente
 * 
 * Utiliza a função RPC do Supabase 'buscar_taxa_por_cep' que consulta
 * a tabela de taxas de entrega e faixas de CEP. O CEP é normalizado
 * automaticamente (remove formatação).
 * 
 * @async
 * @param {string} cep - CEP do cliente (aceita com ou sem formatação: "12345-678" ou "12345678")
 * @returns {Promise<TaxaEntrega | null>} Dados da taxa de entrega ou null se CEP não atendido
 * @throws {Error} Lança erro se houver problema na consulta ao banco
 * 
 * @example
 * const taxa = await buscarTaxaPorCep('01310-100')
 * if (taxa) {
 *   console.log(`Taxa: R$ ${taxa.taxa}`)
 *   console.log(`Bairro: ${taxa.bairro}`)
 *   console.log(`Tempo: ${taxa.tempo_min}-${taxa.tempo_max} min`)
 * } else {
 *   console.log('CEP não atendido')
 * }
 */
export async function buscarTaxaPorCep(cep: string): Promise<TaxaEntrega | null> {
  try {
    const cepNormalizado = normalizeCep(cep)

    if (!isValidCepLength(cepNormalizado)) {
      handleError(new Error(`CEP inválido: ${cep}`), 'buscarTaxaPorCep')
      return null
    }

    const { data, error } = await supabase.rpc("buscar_taxa_por_cep", {
      cep_input: cepNormalizado,
    })

    if (error) {
      handleError(error, 'buscarTaxaPorCep')
      return null
    }

    if (!data || data.length === 0) {
      console.log(`Nenhuma taxa encontrada para o CEP: ${cep}`)
      return null
    }

    return mapToTaxaEntrega(data[0])
  } catch (error) {
    handleError(error, 'buscarTaxaPorCep')
    return null
  }
}

/**
 * Busca a taxa de entrega baseada no nome do bairro
 * 
 * Realiza busca case-insensitive na tabela de taxas de entrega.
 * Retorna apenas taxas ativas.
 * 
 * @async
 * @param {string} bairro - Nome do bairro (busca case-insensitive)
 * @returns {Promise<TaxaEntrega | null>} Dados da taxa de entrega ou null se bairro não atendido
 * @throws {Error} Lança erro se houver problema na consulta ao banco
 * 
 * @example
 * const taxa = await buscarTaxaPorBairro('Centro')
 * if (taxa) {
 *   console.log(`Entrega para ${taxa.bairro}: R$ ${taxa.taxa}`)
 * }
 */
export async function buscarTaxaPorBairro(bairro: string): Promise<TaxaEntrega | null> {
  try {
    const { data, error } = await supabase
      .from("taxas_entrega")
      .select("taxa, bairro, tempo_estimado_min, tempo_estimado_max")
      .eq("ativo", true)
      .ilike("bairro", bairro)
      .limit(1)
      .single()

    if (error || !data) {
      console.log(`Nenhuma taxa encontrada para o bairro: ${bairro}`)
      return null
    }

    return mapToTaxaEntrega(data)
  } catch (error) {
    handleError(error, 'buscarTaxaPorBairro')
    return null
  }
}

/**
 * Valida se o CEP está em uma área de entrega atendida
 * 
 * Função auxiliar que verifica se existe taxa de entrega cadastrada
 * para o CEP fornecido. Útil para validação de formulários.
 * 
 * @async
 * @param {string} cep - CEP a ser validado (com ou sem formatação)
 * @returns {Promise<boolean>} true se CEP é atendido, false caso contrário
 * 
 * @example
 * const atende = await validarAreaEntrega('01310-100')
 * if (!atende) {
 *   alert('Desculpe, não entregamos neste CEP')
 * }
 */
export async function validarAreaEntrega(cep: string): Promise<boolean> {
  const taxa = await buscarTaxaPorCep(cep)
  return taxa !== null
}

// ============================================================================
// PUBLIC API - FORMATAÇÃO
// ============================================================================

/**
 * Formata CEP para o padrão brasileiro de exibição
 * 
 * Adiciona hífen no formato 00000-000. Se o CEP não tiver 8 dígitos,
 * retorna o valor original sem formatação.
 * 
 * @param {string} cep - CEP sem formatação (apenas dígitos)
 * @returns {string} CEP formatado (00000-000) ou valor original se inválido
 * 
 * @example
 * formatarCep('01310100')  // "01310-100"
 * formatarCep('123')       // "123" (inválido, retorna original)
 */
export function formatarCep(cep: string): string {
  const cepNormalizado = normalizeCep(cep)
  
  if (!isValidCepLength(cepNormalizado)) {
    return cep
  }
  
  return `${cepNormalizado.slice(0, 5)}-${cepNormalizado.slice(5)}`
}

/**
 * Formata valor monetário para exibição no padrão brasileiro
 * 
 * Utiliza Intl.NumberFormat para formatação consistente com locale pt-BR.
 * 
 * @param {number} valor - Valor numérico em reais
 * @returns {string} Valor formatado (ex: "R$ 12,50")
 * 
 * @example
 * formatarMoeda(12.5)    // "R$ 12,50"
 * formatarMoeda(1234.56) // "R$ 1.234,56"
 */
/**
 * @deprecated Use formatCurrency de currency-utils.ts para consistência
 */
export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor)
}

// ============================================================================
// PUBLIC API - CÁLCULOS
// ============================================================================

/**
 * Calcula o valor total do pedido incluindo taxa de entrega
 * 
 * Soma simples do subtotal dos produtos com a taxa de entrega.
 * 
 * @param {number} subtotal - Valor total dos produtos do pedido
 * @param {number} taxaEntrega - Valor da taxa de entrega
 * @returns {number} Valor total do pedido (subtotal + taxa)
 * 
 * @example
 * const subtotal = 45.00
 * const taxa = 5.00
 * const total = calcularTotal(subtotal, taxa) // 50.00
 */
export function calcularTotal(subtotal: number, taxaEntrega: number): number {
  return subtotal + taxaEntrega
}

/**
 * Busca informações completas de endereço usando a API ViaCEP
 * 
 * Consulta a API pública ViaCEP para obter dados de logradouro, bairro,
 * cidade e estado baseado no CEP. Útil para preenchimento automático
 * de formulários de endereço.
 * 
 * @async
 * @param {string} cep - CEP a ser consultado (com ou sem formatação)
 * @returns {Promise<Object | null>} Objeto com dados do endereço ou null se CEP inválido/não encontrado
 * @returns {string} return.logradouro - Nome da rua/avenida
 * @returns {string} return.bairro - Nome do bairro
 * @returns {string} return.localidade - Nome da cidade
 * @returns {string} return.uf - Sigla do estado (2 letras)
 * @throws {Error} Lança erro se houver falha na requisição HTTP
 * 
 * @example
 * const endereco = await buscarEnderecoPorCep('01310-100')
 * if (endereco) {
 *   console.log(`${endereco.logradouro}, ${endereco.bairro}`)
 *   console.log(`${endereco.localidade}/${endereco.uf}`)
 * } else {
 *   console.log('CEP não encontrado')
 * }
 */
// ============================================================================
// PUBLIC API - INTEGRAÇÕES EXTERNAS
// ============================================================================

export async function buscarEnderecoPorCep(cep: string): Promise<Endereco | null> {
  try {
    const cepNormalizado = normalizeCep(cep)
    
    if (!isValidCepLength(cepNormalizado)) {
      return null
    }

    const response = await fetch(`${VIACEP_API_URL}/${cepNormalizado}/json/`)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data: ViaCepResponse = await response.json()

    if (data.erro) {
      return null
    }

    return {
      logradouro: data.logradouro || "",
      bairro: data.bairro || "",
      localidade: data.localidade || "",
      uf: data.uf || "",
    }
  } catch (error) {
    handleError(error, 'buscarEnderecoPorCep')
    return null
  }
}
