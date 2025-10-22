/**
 * AUTH SYSTEM V2
 * Sistema de autenticação robusto e type-safe
 * 
 * @version 2.0.0
 * @description Sistema completo de autenticação com Supabase Auth,
 * validações robustas, error handling e sincronização automática
 */

import { logger, logWithContext } from './logger'
import { supabase } from './supabase'
import type { User, Session } from '@supabase/supabase-js'

/**
 * Dados completos do cliente (sincronizado com public.clientes)
 */
export interface Cliente {
  id: string
  codigo_cliente: string
  email: string
  nome: string
  telefone: string
  email_verificado: boolean
  telefone_verificado: boolean
  ativo: boolean
  endereco_rua: string | null
  endereco_numero: string | null
  endereco_bairro: string | null
  endereco_cidade: string | null
  endereco_estado: string | null
  endereco_cep: string | null
  endereco_complemento: string | null
  endereco_referencia: string | null
  aceita_marketing: boolean
  aceita_whatsapp: boolean
  criado_em: string
  atualizado_em: string
  ultimo_acesso: string | null
}

/**
 * Resposta genérica de operações de autenticação
 */
export interface AuthResponse<T = any> {
  data: T | null
  error: string | null
}

/**
 * Dados para cadastro de novo cliente
 */
export interface SignUpInput {
  nome: string
  email: string
  telefone: string
  senha: string
}

/**
 * Dados para login
 */
export interface SignInInput {
  email: string
  senha: string
}

/**
 * Dados para atualização de perfil
 */
export interface UpdateClienteInput {
  nome?: string
  telefone?: string
  endereco_rua?: string
  endereco_numero?: string
  endereco_bairro?: string
  endereco_cidade?: string
  endereco_estado?: string
  endereco_cep?: string
  endereco_complemento?: string
  endereco_referencia?: string
  aceita_marketing?: boolean
  aceita_whatsapp?: boolean
}

// ============================================================================
// VALIDAÇÕES
// ============================================================================

const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$/
const TELEFONE_REGEX = /^\d{10,11}$/
const CEP_REGEX = /^\d{8}$/
const ESTADO_REGEX = /^[A-Z]{2}$/

/**
 * Valida formato de email
 */
export function validateEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim())
}

/**
 * Valida telefone (10 ou 11 dígitos)
 */
export function validateTelefone(telefone: string): boolean {
  const cleaned = telefone.replace(/\D/g, '')
  return TELEFONE_REGEX.test(cleaned)
}

/**
 * Valida senha (mínimo 6 caracteres)
 */
export function validateSenha(senha: string): boolean {
  return senha.length >= 6
}

/**
 * Valida nome (mínimo 2 caracteres)
 */
export function validateNome(nome: string): boolean {
  return nome.trim().length >= 2
}

/**
 * Valida CEP (8 dígitos)
 */
export function validateCEP(cep: string): boolean {
  const cleaned = cep.replace(/\D/g, '')
  return CEP_REGEX.test(cleaned)
}

/**
 * Limpa telefone (remove caracteres não numéricos)
 */
export function cleanTelefone(telefone: string): string {
  return telefone.replace(/\D/g, '')
}

/**
 * Limpa CEP (remove caracteres não numéricos)
 */
export function cleanCEP(cep: string): string {
  return cep.replace(/\D/g, '')
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Converte erro do Supabase em mensagem amigável
 */
function getErrorMessage(error: any): string {
  if (!error) return 'Erro desconhecido'
  
  // Erros comuns do Supabase Auth
  const errorMessages: Record<string, string> = {
    'Invalid login credentials': 'Email ou senha incorretos',
    'User already registered': 'Este email já está cadastrado',
    'Email not confirmed': 'Por favor, confirme seu email',
    'Password should be at least 6 characters': 'A senha deve ter pelo menos 6 caracteres',
    'Unable to validate email address: invalid format': 'Formato de email inválido',
    'User not found': 'Usuário não encontrado',
    'Invalid email or password': 'Email ou senha inválidos',
    'Email rate limit exceeded': 'Muitas tentativas. Tente novamente mais tarde',
    'Signups not allowed for this instance': 'Cadastros desabilitados temporariamente',
  }
  
  const message = error.message || String(error)
  return errorMessages[message] || message
}

/**
 * Log de erro (pode ser integrado com serviço de monitoring)
 */
function logError(context: string, error: any): void {
  console.error(`[Auth Error - ${context}]:`, error)
  // TODO: Integrar com Sentry, LogRocket, etc
}

// ============================================================================
// SINCRONIZAÇÃO COM PUBLIC.CLIENTES
// ============================================================================

/**
 * Sincroniza usuário do Supabase Auth com tabela public.clientes
 * Esta função é chamada automaticamente após signup/signin
 * Usa a função RPC do banco para garantir sincronização correta
 */
async function syncClienteFromAuth(user: User): Promise<void> {
  try {
    // Extrair dados do usuário
    const nome = user.user_metadata?.nome || user.email?.split('@')[0] || 'Cliente'
    const telefone = cleanTelefone(user.user_metadata?.telefone || '')
    
    // Chamar função RPC do banco de dados para sincronizar
    const { data, error } = await supabase.rpc('sync_user_to_cliente', {
      user_id: user.id,
      user_email: user.email!,
      user_name: nome,
      user_phone: telefone || '00000000000'
    })
    
    if (error) {
      console.error('❌ Erro ao sincronizar cliente via RPC:', error)
      throw error
    }
    
    if (data?.success) {
      console.log('✅ Cliente sincronizado via RPC:', user.id, '-', data.action)
    } else {
      console.warn('⚠️ Sincronização retornou erro:', data?.error)
    }
  } catch (error) {
    logError('syncClienteFromAuth', error)
    // Não lançar erro - a sincronização pode falhar mas o login deve continuar
    // Tentar método alternativo (insert direto) como fallback
    try {
      const nome = user.user_metadata?.nome || user.email?.split('@')[0] || 'Cliente'
      const telefone = cleanTelefone(user.user_metadata?.telefone || '')
      
      await supabase
        .from('clientes')
        .upsert({
          id: user.id,
          email: user.email!,
          nome: nome,
          telefone: telefone || '00000000000',
          email_verificado: !!user.email_confirmed_at,
          ativo: true,
          atualizado_em: new Date().toISOString(),
          ultimo_acesso: new Date().toISOString()
        }, {
          onConflict: 'id'
        })
      
      console.log('✅ Cliente sincronizado via fallback (upsert direto):', user.id)
    } catch (fallbackError) {
      console.error('❌ Erro no fallback de sincronização:', fallbackError)
    }
  }
}

// ============================================================================
// AUTH OPERATIONS
// ============================================================================

/**
 * Cadastra um novo cliente no sistema
 * 
 * @param input - Dados do novo cliente (nome, email, telefone, senha)
 * @returns Dados do usuário criado ou erro
 * 
 * @example
 * const result = await signUp({
 *   nome: 'João Silva',
 *   email: 'joao@example.com',
 *   telefone: '11999999999',
 *   senha: 'senha123'
 * })
 */
export async function signUp(input: SignUpInput): Promise<AuthResponse<User>> {
  try {
    // Validações
    if (!validateNome(input.nome)) {
      throw new Error('Nome deve ter pelo menos 2 caracteres')
    }
    if (!validateEmail(input.email)) {
      throw new Error('Email inválido')
    }
    if (!validateTelefone(input.telefone)) {
      throw new Error('Telefone inválido (deve ter 10 ou 11 dígitos)')
    }
    if (!validateSenha(input.senha)) {
      throw new Error('Senha deve ter pelo menos 6 caracteres')
    }

    // Limpar telefone
    const telefoneLimpo = cleanTelefone(input.telefone)

    // Criar usuário no Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email: input.email.trim().toLowerCase(),
      password: input.senha,
      options: {
        data: {
          nome: input.nome.trim(),
          telefone: telefoneLimpo
        }
      }
    })

    if (error) throw error
    if (!data.user) throw new Error('Erro ao criar usuário')

    // Sincronizar com public.clientes
    await syncClienteFromAuth(data.user)

    return { data: data.user, error: null }
  } catch (error) {
    logError('signUp', error)
    return {
      data: null,
      error: getErrorMessage(error)
    }
  }
}

/**
 * Autentica um cliente existente
 * 
 * @param input - Credenciais (email e senha)
 * @returns Sessão ativa ou erro
 * 
 * @example
 * const result = await signIn({
 *   email: 'joao@example.com',
 *   senha: 'senha123'
 * })
 */
export async function signIn(input: SignInInput): Promise<AuthResponse<Session>> {
  try {
    // Validações
    if (!validateEmail(input.email)) {
      throw new Error('Email inválido')
    }
    if (!input.senha) {
      throw new Error('Senha é obrigatória')
    }

    // Fazer login
    const { data, error } = await supabase.auth.signInWithPassword({
      email: input.email.trim().toLowerCase(),
      password: input.senha
    })

    if (error) throw error
    if (!data.session) throw new Error('Erro ao criar sessão')

    // Sincronizar com public.clientes
    if (data.user) {
      await syncClienteFromAuth(data.user)
    }

    return { data: data.session, error: null }
  } catch (error) {
    logError('signIn', error)
    return {
      data: null,
      error: getErrorMessage(error)
    }
  }
}

/**
 * Encerra a sessão atual do usuário
 * 
 * @returns Erro se houver falha, ou null se sucesso
 */
export async function signOut(): Promise<AuthResponse<null>> {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    return { data: null, error: null }
  } catch (error) {
    logError('signOut', error)
    return {
      data: null,
      error: getErrorMessage(error)
    }
  }
}

/**
 * Obtém a sessão de autenticação atual
 * 
 * @returns Sessão ativa ou null
 */
export async function getSession(): Promise<AuthResponse<Session>> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    return { data: session, error: null }
  } catch (error) {
    logError('getSession', error)
    return {
      data: null,
      error: getErrorMessage(error)
    }
  }
}

/**
 * Obtém o usuário autenticado atual
 * 
 * @returns Dados do usuário ou null
 */
export async function getUser(): Promise<AuthResponse<User>> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) {
      return { data: user, error: error.message || String(error) }
    }
    return { data: user, error: null }
  } catch (error) {
    // Não logar erro se for apenas "session missing" (usuário não logado)
    if (error instanceof Error && !error.message.includes('Auth session missing')) {
      logger.error('[Auth Error - getUser]:', error)
    }
    return { data: null, error: error instanceof Error ? error.message : String(error) }
  }
}

// ============================================================================
// CLIENTE OPERATIONS
// ============================================================================

/**
 * Obtém dados completos do cliente da tabela public.clientes
 * 
 * @param userId - ID do usuário (opcional, usa o usuário logado se não informado)
 * @returns Dados do cliente ou erro
 */
export async function getCliente(userId?: string): Promise<{ data: any; error: any }> {
  const log = logWithContext('getCliente')

  try {
    let targetUserId = userId

    if (!targetUserId) {
      const { data: user, error: userError } = await getUser()
      if (userError) {
        // Erro ao buscar usuário - logar mas não expor detalhes
        logger.error('Erro ao buscar usuário autenticado:', userError)
        return { data: null, error: new Error('Erro de autenticação') }
      }

      if (!user) {
        // Usuário não autenticado - não logar erro (situação normal)
        return { data: null, error: new Error('Usuário não autenticado') }
      }
      targetUserId = user.id
    }

    // Validar UUID se fornecido
    if (userId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
      logger.error('UUID inválido fornecido:', userId)
      return { data: null, error: new Error('ID de usuário inválido') }
    }

    log('Buscando cliente:', targetUserId)
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', targetUserId)
      .single()

    if (error) {
      // Diferentes tipos de erro
      if (error.code === 'PGRST116') {
        // Cliente não encontrado
        logger.warn('Cliente não encontrado no banco:', targetUserId)
        return { data: null, error: new Error('Cliente não encontrado') }
      } else if (error.code?.startsWith('PGRST')) {
        // Erro de query Supabase
        logger.error('Erro de query ao buscar cliente:', error)
        return { data: null, error: new Error('Erro ao buscar dados do cliente') }
      } else {
        // Erro genérico
        logger.error('Erro desconhecido ao buscar cliente:', error)
        return { data: null, error: new Error('Erro interno do servidor') }
      }
    }

    if (!data) {
      logger.warn('Query retornou sucesso mas sem dados:', targetUserId)
      return { data: null, error: new Error('Dados do cliente não encontrados') }
    }

    log('Cliente encontrado com sucesso:', targetUserId)
    return { data, error: null }
  } catch (error) {
    // Erros de rede, parsing, etc
    logger.error('Erro crítico ao buscar cliente:', error)

    // Verificar tipo de erro
    if (error instanceof Error) {
      if (error.message.includes('fetch') || error.message.includes('network')) {
        return { data: null, error: new Error('Erro de conexão. Verifique sua internet.') }
      } else if (error.message.includes('timeout')) {
        return { data: null, error: new Error('Tempo limite excedido. Tente novamente.') }
      }
    }

    // Erro genérico
    return { data: null, error: new Error('Erro inesperado ao buscar dados') }
  }
}

/**
 * Atualiza dados do cliente na tabela public.clientes
 * 
 * @param userId - ID do usuário
 * @param updates - Dados a serem atualizados
 * @returns Dados atualizados ou erro
 */
export async function updateCliente(
  userId: string,
  updates: UpdateClienteInput
): Promise<AuthResponse<Cliente>> {
  try {
    // Validações
    if (updates.nome && !validateNome(updates.nome)) {
      throw new Error('Nome deve ter pelo menos 2 caracteres')
    }
    if (updates.telefone && !validateTelefone(updates.telefone)) {
      throw new Error('Telefone inválido (deve ter 10 ou 11 dígitos)')
    }
    if (updates.endereco_cep && !validateCEP(updates.endereco_cep)) {
      throw new Error('CEP inválido (deve ter 8 dígitos)')
    }
    if (updates.endereco_estado && !validateEstado(updates.endereco_estado)) {
      throw new Error('Estado inválido (deve ter 2 letras)')
    }

    // Limpar dados
    const cleanedUpdates: any = { ...updates }
    if (updates.telefone) {
      cleanedUpdates.telefone = cleanTelefone(updates.telefone)
    }
    if (updates.endereco_cep) {
      cleanedUpdates.endereco_cep = cleanCEP(updates.endereco_cep)
    }
    if (updates.endereco_estado) {
      cleanedUpdates.endereco_estado = updates.endereco_estado.toUpperCase()
    }

    // Atualizar
    const { data, error } = await supabase
      .from('clientes')
      .update({
        ...cleanedUpdates,
        atualizado_em: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    if (!data) throw new Error('Erro ao atualizar cliente')

    return { data, error: null }
  } catch (error) {
    logError('updateCliente', error)
    return {
      data: null,
      error: getErrorMessage(error)
    }
  }
}

/**
 * Atualiza senha do usuário
 * 
 * @param newPassword - Nova senha (mínimo 6 caracteres)
 * @returns Dados do usuário ou erro
 */
export async function updatePassword(newPassword: string): Promise<AuthResponse<User>> {
  try {
    if (!validateSenha(newPassword)) {
      throw new Error('Senha deve ter pelo menos 6 caracteres')
    }

    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) throw error
    if (!data.user) throw new Error('Erro ao atualizar senha')

    return { data: data.user, error: null }
  } catch (error) {
    logError('updatePassword', error)
    return {
      data: null,
      error: getErrorMessage(error)
    }
  }
}

/**
 * Solicita reset de senha por email
 * 
 * @param email - Email do usuário
 * @returns Sucesso ou erro
 */
export async function resetPassword(email: string): Promise<AuthResponse<null>> {
  try {
    if (!validateEmail(email)) {
      throw new Error('Email inválido')
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/recuperar-senha`
    })

    if (error) throw error

    return { data: null, error: null }
  } catch (error) {
    logError('resetPassword', error)
    return {
      data: null,
      error: getErrorMessage(error)
    }
  }
}

// ============================================================================
// AUTH STATE LISTENER
// ============================================================================

/**
 * Listener para mudanças no estado de autenticação
 * Sincroniza automaticamente com public.clientes quando usuário faz login
 * 
 * @param callback - Função a ser chamada quando o estado mudar
 * @returns Função para cancelar o listener
 * 
 * @example
 * const unsubscribe = onAuthStateChange((event, session) => {
 *   if (event === 'SIGNED_IN') {
 *     console.log('Usuário logado:', session?.user)
 *   }
 * })
 * 
 * // Cancelar listener
 * unsubscribe()
 */
export function onAuthStateChange(
  callback: (event: string, session: Session | null) => void
) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      // Sincronizar com public.clientes quando usuário faz login
      if (event === 'SIGNED_IN' && session?.user) {
        await syncClienteFromAuth(session.user)
      }
      
      // Chamar callback do usuário
      callback(event, session)
    }
  )
  
  // Retornar função para cancelar subscription
  return () => {
    subscription.unsubscribe()
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Verifica se o usuário está autenticado
 * 
 * @returns true se autenticado, false caso contrário
 */
export async function isAuthenticated(): Promise<boolean> {
  const { data } = await getSession()
  return !!data
}

/**
 * Verifica se o email do usuário foi verificado
 * 
 * @returns true se verificado, false caso contrário
 */
export async function isEmailVerified(): Promise<boolean> {
  const { data } = await getUser()
  return !!data?.email_confirmed_at
}

/**
 * Obtém o ID do usuário autenticado
 * 
 * @returns ID do usuário ou null
 */
export async function getUserId(): Promise<string | null> {
  const { data } = await getUser()
  return data?.id || null
}

// ============================================================================
// SISTEMA DE MÚLTIPLOS ENDEREÇOS
// ============================================================================

/**
 * Dados de um endereço do cliente
 */
export interface EnderecoCliente {
  id: string
  cliente_id: string
  apelido: string // Ex: "Casa", "Trabalho"
  principal: boolean
  cep: string
  logradouro: string
  numero: string
  complemento: string | null
  bairro: string
  cidade: string
  estado: string
  referencia: string | null
  criado_em: string
  atualizado_em: string
}

/**
 * Dados para criar/atualizar endereço
 */
export interface EnderecoInput {
  apelido: string
  principal?: boolean
  cep: string
  logradouro: string
  numero: string
  complemento?: string
  bairro: string
  cidade: string
  estado: string
  referencia?: string
}

/**
 * Resposta da API ViaCEP
 */
export interface ViaCEPResponse {
  cep: string
  logradouro: string
  complemento: string
  bairro: string
  localidade: string // cidade
  uf: string // estado
  erro?: boolean
}

/**
 * Busca endereço pelo CEP usando API ViaCEP
 * 
 * @param cep - CEP a ser consultado (com ou sem formatação)
 * @returns Dados do endereço ou erro
 */
export async function buscarCEP(cep: string): Promise<AuthResponse<ViaCEPResponse>> {
  try {
    // Limpar CEP (remover formatação)
    const cepLimpo = cep.replace(/\D/g, '')
    
    // Validar CEP
    if (!validateCEP(cepLimpo)) {
      return {
        data: null,
        error: 'CEP inválido. Deve conter 8 dígitos.'
      }
    }
    
    // Buscar na API ViaCEP
    const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
    
    if (!response.ok) {
      return {
        data: null,
        error: 'Erro ao consultar CEP. Tente novamente.'
      }
    }
    
    const data: ViaCEPResponse = await response.json()
    
    // Verificar se CEP foi encontrado
    if (data.erro) {
      return {
        data: null,
        error: 'CEP não encontrado.'
      }
    }
    
    return {
      data,
      error: null
    }
  } catch (error) {
    console.error('Erro ao buscar CEP:', error)
    return {
      data: null,
      error: 'Erro ao consultar CEP. Verifique sua conexão.'
    }
  }
}

/**
 * Lista todos os endereços do cliente autenticado
 * 
 * @returns Lista de endereços ou erro
 */
export async function listarEnderecos(): Promise<AuthResponse<EnderecoCliente[]>> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return {
        data: null,
        error: 'Usuário não autenticado'
      }
    }
    
    const { data, error } = await supabase
      .from('enderecos_clientes')
      .select('*')
      .eq('cliente_id', user.id)
      .order('principal', { ascending: false })
      .order('criado_em', { ascending: false })
    
    if (error) {
      console.error('Erro ao listar endereços:', error)
      return {
        data: null,
        error: 'Erro ao carregar endereços'
      }
    }
    
    return {
      data: data || [],
      error: null
    }
  } catch (error) {
    console.error('Erro ao listar endereços:', error)
    return {
      data: null,
      error: 'Erro ao carregar endereços'
    }
  }
}

/**
 * Busca o endereço principal do cliente
 * 
 * @returns Endereço principal ou null
 */
export async function getEnderecoPrincipal(): Promise<AuthResponse<EnderecoCliente>> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return {
        data: null,
        error: 'Usuário não autenticado'
      }
    }
    
    const { data, error } = await supabase
      .from('enderecos_clientes')
      .select('*')
      .eq('cliente_id', user.id)
      .eq('principal', true)
      .single()
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Erro ao buscar endereço principal:', error)
      return {
        data: null,
        error: 'Erro ao carregar endereço principal'
      }
    }
    
    return {
      data: data || null,
      error: null
    }
  } catch (error) {
    console.error('Erro ao buscar endereço principal:', error)
    return {
      data: null,
      error: 'Erro ao carregar endereço principal'
    }
  }
}

/**
 * Cria um novo endereço para o cliente
 * 
 * @param endereco - Dados do endereço
 * @returns Endereço criado ou erro
 */
export async function criarEndereco(endereco: EnderecoInput): Promise<AuthResponse<EnderecoCliente>> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return {
        data: null,
        error: 'Usuário não autenticado'
      }
    }
    
    // Validar dados
    const cepLimpo = cleanCEP(endereco.cep)
    if (!validateCEP(cepLimpo)) {
      return {
        data: null,
        error: 'CEP inválido'
      }
    }
    
    if (!validateEstado(endereco.estado)) {
      return {
        data: null,
        error: 'Estado inválido. Use a sigla (ex: SP)'
      }
    }
    
    if (!endereco.apelido || endereco.apelido.trim().length < 2) {
      return {
        data: null,
        error: 'Apelido do endereço é obrigatório (ex: Casa, Trabalho)'
      }
    }
    
    if (!endereco.numero || endereco.numero.trim().length < 1) {
      return {
        data: null,
        error: 'Número do endereço é obrigatório'
      }
    }
    
    // Criar endereço
    const { data, error } = await supabase
      .from('enderecos_clientes')
      .insert({
        cliente_id: user.id,
        apelido: endereco.apelido.trim(),
        principal: endereco.principal || false,
        cep: cepLimpo,
        logradouro: endereco.logradouro.trim(),
        numero: endereco.numero.trim(),
        complemento: endereco.complemento?.trim() || null,
        bairro: endereco.bairro.trim(),
        cidade: endereco.cidade.trim(),
        estado: endereco.estado.toUpperCase(),
        referencia: endereco.referencia?.trim() || null
      })
      .select()
      .single()
    
    if (error) {
      console.error('Erro ao criar endereço:', error)
      return {
        data: null,
        error: 'Erro ao salvar endereço'
      }
    }
    
    return {
      data,
      error: null
    }
  } catch (error) {
    console.error('Erro ao criar endereço:', error)
    return {
      data: null,
      error: 'Erro ao salvar endereço'
    }
  }
}

/**
 * Atualiza um endereço existente
 * 
 * @param id - ID do endereço
 * @param endereco - Dados a serem atualizados
 * @returns Endereço atualizado ou erro
 */
export async function atualizarEndereco(
  id: string,
  endereco: Partial<EnderecoInput>
): Promise<AuthResponse<EnderecoCliente>> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return {
        data: null,
        error: 'Usuário não autenticado'
      }
    }
    
    // Preparar dados para atualização
    const updateData: any = {}
    
    if (endereco.apelido !== undefined) {
      if (endereco.apelido.trim().length < 2) {
        return {
          data: null,
          error: 'Apelido do endereço é obrigatório'
        }
      }
      updateData.apelido = endereco.apelido.trim()
    }
    
    if (endereco.principal !== undefined) {
      updateData.principal = endereco.principal
    }
    
    if (endereco.cep !== undefined) {
      const cepLimpo = cleanCEP(endereco.cep)
      if (!validateCEP(cepLimpo)) {
        return {
          data: null,
          error: 'CEP inválido'
        }
      }
      updateData.cep = cepLimpo
    }
    
    if (endereco.logradouro !== undefined) {
      updateData.logradouro = endereco.logradouro.trim()
    }
    
    if (endereco.numero !== undefined) {
      if (endereco.numero.trim().length < 1) {
        return {
          data: null,
          error: 'Número do endereço é obrigatório'
        }
      }
      updateData.numero = endereco.numero.trim()
    }
    
    if (endereco.complemento !== undefined) {
      updateData.complemento = endereco.complemento?.trim() || null
    }
    
    if (endereco.bairro !== undefined) {
      updateData.bairro = endereco.bairro.trim()
    }
    
    if (endereco.cidade !== undefined) {
      updateData.cidade = endereco.cidade.trim()
    }
    
    if (endereco.estado !== undefined) {
      if (!validateEstado(endereco.estado)) {
        return {
          data: null,
          error: 'Estado inválido. Use a sigla (ex: SP)'
        }
      }
      updateData.estado = endereco.estado.toUpperCase()
    }
    
    if (endereco.referencia !== undefined) {
      updateData.referencia = endereco.referencia?.trim() || null
    }
    
    // Atualizar endereço
    const { data, error } = await supabase
      .from('enderecos_clientes')
      .update(updateData)
      .eq('id', id)
      .eq('cliente_id', user.id) // Garantir que é do usuário
      .select()
      .single()
    
    if (error) {
      console.error('Erro ao atualizar endereço:', error)
      return {
        data: null,
        error: 'Erro ao atualizar endereço'
      }
    }
    
    return {
      data,
      error: null
    }
  } catch (error) {
    console.error('Erro ao atualizar endereço:', error)
    return {
      data: null,
      error: 'Erro ao atualizar endereço'
    }
  }
}

/**
 * Define um endereço como principal
 * 
 * @param id - ID do endereço
 * @returns Endereço atualizado ou erro
 */
export async function definirEnderecoPrincipal(id: string): Promise<AuthResponse<EnderecoCliente>> {
  return atualizarEndereco(id, { principal: true })
}

/**
 * Deleta um endereço
 * 
 * @param id - ID do endereço
 * @returns Sucesso ou erro
 */
export async function deletarEndereco(id: string): Promise<AuthResponse<boolean>> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return {
        data: null,
        error: 'Usuário não autenticado'
      }
    }
    
    // Verificar se é o endereço principal
    const { data: endereco } = await supabase
      .from('enderecos_clientes')
      .select('principal')
      .eq('id', id)
      .eq('cliente_id', user.id)
      .single()
    
    if (endereco?.principal) {
      return {
        data: null,
        error: 'Não é possível excluir o endereço principal. Defina outro endereço como principal primeiro.'
      }
    }
    
    // Deletar endereço
    const { error } = await supabase
      .from('enderecos_clientes')
      .delete()
      .eq('id', id)
      .eq('cliente_id', user.id)
    
    if (error) {
      console.error('Erro ao deletar endereço:', error)
      return {
        data: null,
        error: 'Erro ao excluir endereço'
      }
    }
    
    return {
      data: true,
      error: null
    }
  } catch (error) {
    console.error('Erro ao deletar endereço:', error)
    return {
      data: null,
      error: 'Erro ao excluir endereço'
    }
  }
}
