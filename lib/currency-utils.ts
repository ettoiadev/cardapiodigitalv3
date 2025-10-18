/**
 * @fileoverview Utilitários para formatação e manipulação de valores monetários brasileiros (BRL)
 * @module currency-utils
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Configuração de formatação para moeda brasileira
 */
const BRL_CURRENCY_CONFIG = {
  locale: 'pt-BR',
  currency: 'BRL',
  style: 'currency',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
} as const

/**
 * Constantes de formatação
 */
const CURRENCY_CONSTANTS = {
  PREFIX: 'R$ ',
  DECIMAL_SEPARATOR: ',',
  THOUSAND_SEPARATOR: '.',
  CENTS_DIVISOR: 100,
  DECIMAL_PLACES: 2
} as const

/**
 * Regex patterns para processamento de moeda
 */
const CURRENCY_PATTERNS = {
  NON_DIGITS: /\D/g,
  CURRENCY_PREFIX: /R\$\s?/g,
  THOUSAND_SEPARATOR: /(\d)(?=(\d{3})+(?!\d))/g
} as const

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Verifica se um valor é válido para formatação
 */
function isValidNumber(value: number | null | undefined): value is number {
  return value !== null && value !== undefined && !isNaN(value)
}

/**
 * Remove caracteres não numéricos de uma string
 */
function extractDigits(input: string): string {
  return input.replace(CURRENCY_PATTERNS.NON_DIGITS, '')
}

/**
 * Adiciona separador de milhar a um número formatado
 */
function addThousandSeparator(value: string): string {
  return value.replace(
    CURRENCY_PATTERNS.THOUSAND_SEPARATOR, 
    `$1${CURRENCY_CONSTANTS.THOUSAND_SEPARATOR}`
  )
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Formata um valor numérico para o formato de moeda brasileira
 * 
 * Converte números em strings formatadas seguindo o padrão brasileiro:
 * - Símbolo R$ no início
 * - Separador de milhar: ponto (.)
 * - Separador decimal: vírgula (,)
 * - Sempre exibe 2 casas decimais
 * 
 * @param {number | null | undefined} value - Valor numérico a ser formatado
 * @returns {string} Valor formatado como moeda brasileira (ex: "R$ 1.234,56")
 * 
 * @example
 * formatCurrency(1234.56)  // "R$ 1.234,56"
 * formatCurrency(10)       // "R$ 10,00"
 * formatCurrency(null)     // "R$ 0,00"
 * formatCurrency(undefined) // "R$ 0,00"
 * formatCurrency(NaN)      // "R$ 0,00"
 */
export function formatCurrency(value: number | null | undefined): string {
  if (!isValidNumber(value)) {
    return `${CURRENCY_CONSTANTS.PREFIX}0${CURRENCY_CONSTANTS.DECIMAL_SEPARATOR}00`
  }
  
  return new Intl.NumberFormat(BRL_CURRENCY_CONFIG.locale, {
    style: BRL_CURRENCY_CONFIG.style,
    currency: BRL_CURRENCY_CONFIG.currency,
    minimumFractionDigits: BRL_CURRENCY_CONFIG.minimumFractionDigits,
    maximumFractionDigits: BRL_CURRENCY_CONFIG.maximumFractionDigits
  }).format(value)
}

/**
 * Formata entrada de texto para moeda brasileira em tempo real
 * 
 * Processa a digitação do usuário removendo caracteres não numéricos
 * e aplicando formatação monetária automaticamente. Ideal para uso
 * em campos de input durante a digitação.
 * 
 * Comportamento:
 * - Remove todos os caracteres não numéricos
 * - Trata os dígitos como centavos
 * - Formata com separadores de milhar e decimal
 * - Adiciona prefixo R$
 * 
 * @param {string} input - Texto digitado pelo usuário
 * @returns {string} Texto formatado como moeda ou string vazia se input vazio
 * 
 * @example
 * formatCurrencyInput('1234')    // "R$ 12,34"
 * formatCurrencyInput('123456')  // "R$ 1.234,56"
 * formatCurrencyInput('abc123')  // "R$ 1,23"
 * formatCurrencyInput('')        // ""
 */
export function formatCurrencyInput(input: string): string {
  const digits = extractDigits(input)
  
  if (digits === '') {
    return ''
  }
  
  const valueInCents = parseInt(digits, 10)
  const valueInReais = valueInCents / CURRENCY_CONSTANTS.CENTS_DIVISOR
  
  const formattedValue = valueInReais
    .toFixed(CURRENCY_CONSTANTS.DECIMAL_PLACES)
    .replace('.', CURRENCY_CONSTANTS.DECIMAL_SEPARATOR)
  
  const withThousandSeparator = addThousandSeparator(formattedValue)
  
  return `${CURRENCY_CONSTANTS.PREFIX}${withThousandSeparator}`
}

/**
 * Converte string formatada como moeda brasileira para número
 * 
 * Realiza o parsing reverso, removendo formatação e convertendo
 * para valor numérico utilizável em cálculos.
 * 
 * Processo:
 * - Remove prefixo R$ e espaços
 * - Remove pontos (separadores de milhar)
 * - Substitui vírgula por ponto (separador decimal)
 * - Converte para float
 * 
 * @param {string} formattedValue - Valor formatado como moeda (ex: "R$ 1.234,56")
 * @returns {number} Valor numérico (ex: 1234.56) ou 0 se inválido
 * 
 * @example
 * parseCurrencyInput('R$ 1.234,56')  // 1234.56
 * parseCurrencyInput('R$ 10,00')     // 10
 * parseCurrencyInput('R$ 0,50')      // 0.5
 * parseCurrencyInput('')             // 0
 * parseCurrencyInput('abc')          // 0
 */
export function parseCurrencyInput(formattedValue: string): number {
  if (!formattedValue) return 0
  
  const withoutPrefix = formattedValue.replace(CURRENCY_PATTERNS.CURRENCY_PREFIX, '')
  const withoutThousandSeparator = withoutPrefix.replace(
    new RegExp(`\\${CURRENCY_CONSTANTS.THOUSAND_SEPARATOR}`, 'g'), 
    ''
  )
  const normalizedDecimal = withoutThousandSeparator.replace(
    CURRENCY_CONSTANTS.DECIMAL_SEPARATOR, 
    '.'
  )
  
  const parsedNumber = parseFloat(normalizedDecimal)
  return isNaN(parsedNumber) ? 0 : parsedNumber
}

/**
 * Formata valor numérico para exibição inicial em campos de input
 * 
 * Similar ao formatCurrency, mas retorna string vazia para valores
 * nulos ou zero, ideal para campos de formulário que devem iniciar vazios.
 * 
 * @param {number | null | undefined} value - Valor numérico a formatar
 * @returns {string} Valor formatado (ex: "R$ 45,00") ou string vazia se zero/null/undefined
 * 
 * @example
 * formatCurrencyForInput(45)        // "R$ 45,00"
 * formatCurrencyForInput(1234.56)   // "R$ 1.234,56"
 * formatCurrencyForInput(0)         // ""
 * formatCurrencyForInput(null)      // ""
 * formatCurrencyForInput(undefined) // ""
 */
export function formatCurrencyForInput(value: number | null | undefined): string {
  if (!isValidNumber(value) || value === 0) {
    return ''
  }
  
  const formattedValue = value
    .toFixed(CURRENCY_CONSTANTS.DECIMAL_PLACES)
    .replace('.', CURRENCY_CONSTANTS.DECIMAL_SEPARATOR)
  
  const withThousandSeparator = addThousandSeparator(formattedValue)
  
  return `${CURRENCY_CONSTANTS.PREFIX}${withThousandSeparator}`
}

/**
 * Aplica máscara de moeda em evento de mudança de input
 * 
 * Handler de evento React que formata automaticamente o valor do input
 * e retorna o valor numérico para uso no estado do componente.
 * 
 * Uso típico:
 * - Conectar ao evento onChange de um input
 * - Formata visualmente o campo
 * - Retorna valor numérico para armazenar no state
 * 
 * @param {React.ChangeEvent<HTMLInputElement>} event - Evento de mudança do input React
 * @returns {number} Valor numérico parseado do input formatado
 * 
 * @example
 * // Em um componente React
 * const [valor, setValor] = useState(0)
 * 
 * <input
 *   type="text"
 *   onChange={(e) => {
 *     const numericValue = applyCurrencyMask(e)
 *     setValor(numericValue)
 *   }}
 * />
 * 
 * // Usuário digita "1234" → Campo exibe "R$ 12,34" → valor = 12.34
 */
export function applyCurrencyMask(
  event: { target: { value: string } }
): number {
  const input = event.target as HTMLInputElement
  const currentValue = input.value
  const formattedValue = formatCurrencyInput(currentValue)
  
  // Só atualiza se o valor mudou (evita loop infinito)
  if (formattedValue !== currentValue) {
    input.value = formattedValue
  }
  
  return parseCurrencyInput(formattedValue)
}