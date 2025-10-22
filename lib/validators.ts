// lib/validators.ts
// Validações centralizadas para todo o sistema

import { logger } from './logger'

/**
 * Valida e limpa CEP brasileiro
 */
export function validateAndCleanCEP(cep: string): { valid: boolean; cleaned: string; error?: string } {
  const cleaned = cep.replace(/\D/g, '')

  if (cleaned.length === 0) {
    return { valid: false, cleaned: '', error: 'CEP é obrigatório' }
  }

  if (cleaned.length !== 8) {
    return { valid: false, cleaned: '', error: 'CEP deve ter 8 dígitos' }
  }

  if (!/^\d{8}$/.test(cleaned)) {
    return { valid: false, cleaned: '', error: 'CEP deve conter apenas números' }
  }

  logger.debug('CEP validado:', cleaned)
  return { valid: true, cleaned }
}

/**
 * Valida formato de email
 */
export function validateEmail(email: string): { valid: boolean; error?: string } {
  const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$/

  if (!email || email.trim().length === 0) {
    return { valid: false, error: 'Email é obrigatório' }
  }

  if (!EMAIL_REGEX.test(email.trim())) {
    return { valid: false, error: 'Email inválido' }
  }

  return { valid: true }
}

/**
 * Valida telefone brasileiro
 */
export function validateTelefone(telefone: string): { valid: boolean; cleaned: string; error?: string } {
  const cleaned = telefone.replace(/\D/g, '')

  if (cleaned.length === 0) {
    return { valid: false, cleaned: '', error: 'Telefone é obrigatório' }
  }

  if (cleaned.length < 10 || cleaned.length > 11) {
    return { valid: false, cleaned: '', error: 'Telefone deve ter 10 ou 11 dígitos' }
  }

  if (!/^\d{10,11}$/.test(cleaned)) {
    return { valid: false, cleaned: '', error: 'Telefone deve conter apenas números' }
  }

  logger.debug('Telefone validado:', cleaned)
  return { valid: true, cleaned }
}

/**
 * Valida estado brasileiro (UF)
 */
export function validateEstado(estado: string): { valid: boolean; error?: string } {
  const ESTADO_REGEX = /^[A-Z]{2}$/

  if (!estado || estado.trim().length === 0) {
    return { valid: false, error: 'Estado é obrigatório' }
  }

  if (!ESTADO_REGEX.test(estado.toUpperCase())) {
    return { valid: false, error: 'Estado deve ter 2 letras (ex: SP, RJ)' }
  }

  return { valid: true }
}

/**
 * Valida nome
 */
export function validateNome(nome: string): { valid: boolean; error?: string } {
  if (!nome || nome.trim().length === 0) {
    return { valid: false, error: 'Nome é obrigatório' }
  }

  if (nome.trim().length < 2) {
    return { valid: false, error: 'Nome deve ter pelo menos 2 caracteres' }
  }

  return { valid: true }
}

/**
 * Valida senha
 */
export function validateSenha(senha: string): { valid: boolean; error?: string } {
  if (!senha || senha.length === 0) {
    return { valid: false, error: 'Senha é obrigatória' }
  }

  if (senha.length < 6) {
    return { valid: false, error: 'Senha deve ter pelo menos 6 caracteres' }
  }

  return { valid: true }
}

/**
 * Valida se um valor é um UUID válido
 */
export function validateUUID(uuid: string): { valid: boolean; error?: string } {
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

  if (!uuid || uuid.trim().length === 0) {
    return { valid: false, error: 'ID é obrigatório' }
  }

  if (!UUID_REGEX.test(uuid.trim())) {
    return { valid: false, error: 'ID inválido' }
  }

  return { valid: true }
}

/**
 * Valida valor monetário (para troco, etc)
 */
export function validateMoney(value: string): { valid: boolean; cleaned: number; error?: string } {
  if (!value || value.trim().length === 0) {
    return { valid: false, cleaned: 0, error: 'Valor é obrigatório' }
  }

  // Remover tudo exceto dígitos, vírgula e ponto
  const cleaned = value.replace(/[^\d,]/g, '').replace(/\./g, '').replace(',', '.')

  if (!/^\d+\.\d{2}$/.test(cleaned)) {
    return { valid: false, cleaned: 0, error: 'Valor inválido. Use formato: 10,00' }
  }

  const numericValue = parseFloat(cleaned)

  if (isNaN(numericValue) || numericValue < 0) {
    return { valid: false, cleaned: 0, error: 'Valor deve ser maior que zero' }
  }

  if (numericValue > 999999.99) {
    return { valid: false, cleaned: 0, error: 'Valor muito alto (máximo: R$ 999.999,99)' }
  }

  logger.debug('Valor monetário validado:', numericValue)
  return { valid: true, cleaned: numericValue }
}

/**
 * Validação completa para cadastro de usuário
 */
export function validateSignUp(data: {
  nome: string
  email: string
  telefone: string
  senha: string
}): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  const nomeValidation = validateNome(data.nome)
  if (!nomeValidation.valid) errors.push(nomeValidation.error!)

  const emailValidation = validateEmail(data.email)
  if (!emailValidation.valid) errors.push(emailValidation.error!)

  const telefoneValidation = validateTelefone(data.telefone)
  if (!telefoneValidation.valid) errors.push(telefoneValidation.error!)

  const senhaValidation = validateSenha(data.senha)
  if (!senhaValidation.valid) errors.push(senhaValidation.error!)

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Validação completa para endereço
 */
export function validateEndereco(data: {
  apelido: string
  cep: string
  logradouro: string
  numero: string
  bairro: string
  cidade: string
  estado: string
}): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  const apelidoValidation = validateNome(data.apelido)
  if (!apelidoValidation.valid) errors.push(`Apelido: ${apelidoValidation.error}`)

  const cepValidation = validateAndCleanCEP(data.cep)
  if (!cepValidation.valid) errors.push(cepValidation.error!)

  const estadoValidation = validateEstado(data.estado)
  if (!estadoValidation.valid) errors.push(estadoValidation.error!)

  if (!data.logradouro || data.logradouro.trim().length < 3) {
    errors.push('Logradouro deve ter pelo menos 3 caracteres')
  }

  if (!data.numero || data.numero.trim().length === 0) {
    errors.push('Número é obrigatório')
  }

  if (!data.bairro || data.bairro.trim().length < 2) {
    errors.push('Bairro deve ter pelo menos 2 caracteres')
  }

  if (!data.cidade || data.cidade.trim().length < 2) {
    errors.push('Cidade deve ter pelo menos 2 caracteres')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}
