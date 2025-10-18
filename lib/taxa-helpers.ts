/**
 * Helpers para cálculo e validação de taxas de entrega
 */

import { supabase } from "./supabase"

export interface TaxaEntrega {
  taxa: number
  bairro: string
  tempo_min: number
  tempo_max: number
}

/**
 * Busca a taxa de entrega baseada no CEP
 * @param cep - CEP do cliente (com ou sem formatação)
 * @returns Taxa de entrega ou null se não encontrada
 */
export async function buscarTaxaPorCep(cep: string): Promise<TaxaEntrega | null> {
  try {
    // Remover formatação do CEP
    const cepLimpo = cep.replace(/\D/g, "")

    if (cepLimpo.length !== 8) {
      console.error("CEP inválido:", cep)
      return null
    }

    // Buscar usando a função do banco
    const { data, error } = await supabase.rpc("buscar_taxa_por_cep", {
      cep_input: cepLimpo,
    })

    if (error) {
      console.error("Erro ao buscar taxa:", error)
      return null
    }

    if (!data || data.length === 0) {
      console.log("Nenhuma taxa encontrada para o CEP:", cep)
      return null
    }

    const resultado = data[0]
    return {
      taxa: Number(resultado.taxa),
      bairro: resultado.bairro,
      tempo_min: resultado.tempo_min,
      tempo_max: resultado.tempo_max,
    }
  } catch (error) {
    console.error("Erro ao buscar taxa por CEP:", error)
    return null
  }
}

/**
 * Busca a taxa de entrega baseada no bairro
 * @param bairro - Nome do bairro
 * @returns Taxa de entrega ou null se não encontrada
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
      console.log("Nenhuma taxa encontrada para o bairro:", bairro)
      return null
    }

    return {
      taxa: Number(data.taxa),
      bairro: data.bairro,
      tempo_min: data.tempo_estimado_min,
      tempo_max: data.tempo_estimado_max,
    }
  } catch (error) {
    console.error("Erro ao buscar taxa por bairro:", error)
    return null
  }
}

/**
 * Valida se o CEP está em uma área de entrega
 * @param cep - CEP do cliente
 * @returns true se há entrega, false caso contrário
 */
export async function validarAreaEntrega(cep: string): Promise<boolean> {
  const taxa = await buscarTaxaPorCep(cep)
  return taxa !== null
}

/**
 * Formata o CEP para exibição
 * @param cep - CEP sem formatação
 * @returns CEP formatado (00000-000)
 */
export function formatarCep(cep: string): string {
  const cepLimpo = cep.replace(/\D/g, "")
  if (cepLimpo.length !== 8) return cep
  return `${cepLimpo.slice(0, 5)}-${cepLimpo.slice(5)}`
}

/**
 * Formata valor monetário para exibição
 * @param valor - Valor numérico
 * @returns Valor formatado (R$ 0,00)
 */
export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor)
}

/**
 * Calcula o total do pedido com taxa de entrega
 * @param subtotal - Subtotal dos produtos
 * @param taxaEntrega - Taxa de entrega
 * @returns Total do pedido
 */
export function calcularTotal(subtotal: number, taxaEntrega: number): number {
  return subtotal + taxaEntrega
}

/**
 * Busca informações de endereço pelo CEP usando ViaCEP
 * @param cep - CEP a ser consultado
 * @returns Dados do endereço ou null
 */
export async function buscarEnderecoPorCep(cep: string): Promise<{
  logradouro: string
  bairro: string
  localidade: string
  uf: string
} | null> {
  try {
    const cepLimpo = cep.replace(/\D/g, "")
    if (cepLimpo.length !== 8) return null

    const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
    const data = await response.json()

    if (data.erro) return null

    return {
      logradouro: data.logradouro || "",
      bairro: data.bairro || "",
      localidade: data.localidade || "",
      uf: data.uf || "",
    }
  } catch (error) {
    console.error("Erro ao buscar endereço:", error)
    return null
  }
}
