// Utilitários para formatação de moeda brasileira

/**
 * Formata um valor numérico para o formato de moeda brasileira (R$ 9,90)
 */
export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return "R$ 0,00"
  }
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}

/**
 * Formata um campo de entrada para moeda brasileira conforme o usuário digita
 * Remove caracteres não numéricos, formata automaticamente
 */
export function formatCurrencyInput(input: string): string {
  // Remove tudo que não é dígito
  let valor = input.replace(/\D/g, '')
  
  // Se não há valor, retorna vazio
  if (valor === '') {
    return ''
  }
  
  // Converte para centavos e depois para reais
  let valorNumerico = parseInt(valor) / 100
  
  // Formata com vírgula decimal
  let valorFormatado = valorNumerico.toFixed(2).replace('.', ',')
  
  // Adiciona separador de milhar
  valorFormatado = valorFormatado.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.')
  
  return `R$ ${valorFormatado}`
}

/**
 * Converte um valor formatado como moeda para número
 * "R$ 12,50" -> 12.5
 */
export function parseCurrencyInput(formattedValue: string): number {
  if (!formattedValue) return 0
  
  // Remove R$, espaços e pontos (separadores de milhar)
  let valor = formattedValue.replace(/R\$\s?/g, '').replace(/\./g, '')
  
  // Substitui vírgula por ponto
  valor = valor.replace(',', '.')
  
  const numero = parseFloat(valor)
  return isNaN(numero) ? 0 : numero
}

/**
 * Formata um valor numérico para exibição em campos de input
 * 45.00 -> "R$ 45,00"
 */
export function formatCurrencyForInput(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value) || value === 0) {
    return ''
  }
  
  // Formata com vírgula decimal
  let valorFormatado = value.toFixed(2).replace('.', ',')
  
  // Adiciona separador de milhar
  valorFormatado = valorFormatado.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.')
  
  return `R$ ${valorFormatado}`
}

/**
 * Aplica formatação de moeda em um campo de input durante a digitação
 */
export function applyCurrencyMask(event: React.ChangeEvent<HTMLInputElement>) {
  const input = event.target
  const formattedValue = formatCurrencyInput(input.value)
  input.value = formattedValue
  
  // Retorna o valor numérico para uso interno
  return parseCurrencyInput(formattedValue)
}