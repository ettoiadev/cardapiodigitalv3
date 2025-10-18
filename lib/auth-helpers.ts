/**
 * AUTH HELPERS
 * Funções auxiliares para autenticação com Supabase
 */

import { supabase } from './supabase'
import type { AuthError, User, Session } from '@supabase/supabase-js'

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

/**
 * Tipo genérico para respostas de operações de autenticação
 * @template T - Tipo dos dados retornados
 */
export type AuthResult<T = any> = {
  data: T | null
  error: string | null
}

/**
 * Tipo para respostas que retornam apenas erro
 */
export type AuthErrorResult = {
  error: string | null
}

/**
 * URL base para redirecionamento após recuperação de senha
 */
const PASSWORD_RESET_REDIRECT_PATH = '/recuperar-senha'

/**
 * Dados necessários para cadastro de novo cliente
 * @interface SignUpData
 * @property {string} nome - Nome completo do cliente
 * @property {string} email - Endereço de e-mail válido para autenticação
 * @property {string} telefone - Número de telefone do cliente
 * @property {string} senha - Senha para autenticação (mínimo recomendado: 6 caracteres)
 */
export interface SignUpData {
  nome: string
  email: string
  telefone: string
  senha: string
}

/**
 * Dados necessários para autenticação de cliente existente
 * @interface SignInData
 * @property {string} email - Endereço de e-mail cadastrado
 * @property {string} senha - Senha de autenticação
 */
export interface SignInData {
  email: string
  senha: string
}

/**
 * Cadastra um novo cliente no sistema usando Supabase Auth
 * 
 * Cria uma conta de autenticação e armazena dados adicionais (nome, telefone)
 * nos metadados do usuário. Os dados são posteriormente sincronizados com a
 * tabela 'clientes' através de triggers do banco de dados.
 * 
 * @async
 * @param {SignUpData} params - Dados do novo cliente
 * @param {string} params.nome - Nome completo do cliente
 * @param {string} params.email - E-mail único para autenticação
 * @param {string} params.telefone - Telefone de contato
 * @param {string} params.senha - Senha (mínimo 6 caracteres)
 * @returns {Promise<{data: any, error: string | null}>} Objeto com dados do usuário criado ou mensagem de erro
 * @throws {Error} Lança erro se o e-mail já estiver cadastrado ou dados inválidos
 * 
 * @example
 * const result = await signUp({
 *   nome: 'João Silva',
 *   email: 'joao@example.com',
 *   telefone: '11999999999',
 *   senha: 'senha123'
 * })
 * 
 * if (result.error) {
 *   console.error('Erro no cadastro:', result.error)
 * } else {
 *   console.log('Cliente cadastrado:', result.data.user)
 * }
 */
// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Trata erros de autenticação de forma consistente
 * @param error - Erro capturado
 * @param context - Contexto da operação para logging
 * @returns Mensagem de erro formatada
 */
function handleAuthError(error: unknown, context: string): string {
  const errorMessage = error instanceof Error ? error.message : String(error)
  console.error(`[Auth Error - ${context}]:`, errorMessage)
  return errorMessage
}

// ============================================================================
// AUTHENTICATION OPERATIONS
// ============================================================================

export async function signUp({ nome, email, telefone, senha }: SignUpData): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        data: { nome, telefone }
      }
    })

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    return { 
      data: null, 
      error: handleAuthError(error, 'signUp') 
    }
  }
}

/**
 * Autentica um cliente existente no sistema
 * 
 * Realiza login usando e-mail e senha, retornando a sessão ativa e dados do usuário.
 * A sessão é automaticamente gerenciada pelo Supabase e persiste entre recarregamentos.
 * 
 * @async
 * @param {SignInData} params - Credenciais de autenticação
 * @param {string} params.email - E-mail cadastrado
 * @param {string} params.senha - Senha do usuário
 * @returns {Promise<{data: any, error: string | null}>} Objeto com sessão e usuário ou mensagem de erro
 * @throws {Error} Lança erro se credenciais inválidas ou usuário não encontrado
 * 
 * @example
 * const result = await signIn({
 *   email: 'joao@example.com',
 *   senha: 'senha123'
 * })
 * 
 * if (result.error) {
 *   console.error('Erro no login:', result.error)
 * } else {
 *   console.log('Login bem-sucedido:', result.data.session)
 * }
 */
export async function signIn({ email, senha }: SignInData): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha
    })

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    return { 
      data: null, 
      error: handleAuthError(error, 'signIn') 
    }
  }
}

/**
 * Encerra a sessão atual do usuário
 * 
 * Remove a sessão ativa do Supabase Auth, invalidando tokens de acesso.
 * Após o logout, o usuário precisará fazer login novamente para acessar
 * rotas protegidas.
 * 
 * @async
 * @returns {Promise<{error: string | null}>} Objeto com erro se houver falha, ou null se sucesso
 * @throws {Error} Lança erro se houver problema ao invalidar a sessão
 * 
 * @example
 * const result = await signOut()
 * if (result.error) {
 *   console.error('Erro ao fazer logout:', result.error)
 * } else {
 *   // Redirecionar para página de login
 *   router.push('/login')
 * }
 */
export async function signOut(): Promise<AuthErrorResult> {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    return { error: null }
  } catch (error) {
    return { error: handleAuthError(error, 'signOut') }
  }
}

/**
 * Obtém a sessão de autenticação atual do usuário
 * 
 * Retorna informações sobre a sessão ativa, incluindo tokens de acesso
 * e dados do usuário autenticado. Útil para verificar estado de autenticação.
 * 
 * @async
 * @returns {Promise<{session: any, error: string | null}>} Objeto com sessão ativa ou null se não autenticado
 * @throws {Error} Lança erro se houver problema ao acessar a sessão
 * 
 * @example
 * const { session, error } = await getSession()
 * if (session) {
 *   console.log('Usuário autenticado:', session.user.email)
 * } else {
 *   console.log('Usuário não autenticado')
 * }
 */
export async function getSession(): Promise<AuthResult<Session>> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    return { data: session, error: null }
  } catch (error) {
    return { 
      data: null, 
      error: handleAuthError(error, 'getSession') 
    }
  }
}

/**
 * Obtém os dados do usuário autenticado
 * 
 * Retorna informações completas do usuário atual, incluindo metadados
 * personalizados (nome, telefone) armazenados durante o cadastro.
 * 
 * @async
 * @returns {Promise<{user: any, error: string | null}>} Objeto com dados do usuário ou null se não autenticado
 * @throws {Error} Lança erro se houver problema ao acessar dados do usuário
 * 
 * @example
 * const { user, error } = await getUser()
 * if (user) {
 *   console.log('Nome:', user.user_metadata.nome)
 *   console.log('Email:', user.email)
 * }
 */
export async function getUser(): Promise<AuthResult<User>> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return { data: user, error: null }
  } catch (error) {
    return { 
      data: null, 
      error: handleAuthError(error, 'getUser') 
    }
  }
}

/**
 * Inicia o processo de recuperação de senha
 * 
 * Envia um e-mail com link de redefinição de senha para o endereço fornecido.
 * O link redireciona para a página de recuperação configurada no sistema.
 * 
 * @async
 * @param {string} email - E-mail cadastrado do usuário
 * @returns {Promise<{error: string | null}>} Objeto com erro se houver falha, ou null se sucesso
 * @throws {Error} Lança erro se e-mail não encontrado ou inválido
 * 
 * @example
 * const result = await resetPassword('joao@example.com')
 * if (result.error) {
 *   console.error('Erro ao enviar e-mail:', result.error)
 * } else {
 *   console.log('E-mail de recuperação enviado com sucesso')
 * }
 */
export async function resetPassword(email: string): Promise<AuthErrorResult> {
  try {
    const redirectTo = `${window.location.origin}${PASSWORD_RESET_REDIRECT_PATH}`
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })

    if (error) throw error
    return { error: null }
  } catch (error) {
    return { error: handleAuthError(error, 'resetPassword') }
  }
}

/**
 * Atualiza a senha do usuário autenticado
 * 
 * Permite que o usuário altere sua senha. Requer que o usuário esteja
 * autenticado ou tenha um token válido de recuperação de senha.
 * 
 * @async
 * @param {string} novaSenha - Nova senha (mínimo 6 caracteres recomendado)
 * @returns {Promise<{error: string | null}>} Objeto com erro se houver falha, ou null se sucesso
 * @throws {Error} Lança erro se usuário não autenticado ou senha inválida
 * 
 * @example
 * const result = await updatePassword('novaSenha123')
 * if (result.error) {
 *   console.error('Erro ao atualizar senha:', result.error)
 * } else {
 *   console.log('Senha atualizada com sucesso')
 * }
 */
export async function updatePassword(novaSenha: string): Promise<AuthErrorResult> {
  try {
    const { error } = await supabase.auth.updateUser({ password: novaSenha })

    if (error) throw error
    return { error: null }
  } catch (error) {
    return { error: handleAuthError(error, 'updatePassword') }
  }
}

/**
 * Verifica se existe uma sessão ativa de autenticação
 * 
 * Função auxiliar para verificação rápida do estado de autenticação.
 * Útil para guards de rota e renderização condicional.
 * 
 * @async
 * @returns {Promise<boolean>} true se usuário autenticado, false caso contrário
 * 
 * @example
 * const isLoggedIn = await isAuthenticated()
 * if (!isLoggedIn) {
 *   router.push('/login')
 * }
 */
export async function isAuthenticated(): Promise<boolean> {
  const { data: session } = await getSession()
  return !!session
}

/**
 * Busca dados completos do cliente na tabela 'clientes'
 * 
 * Retorna informações detalhadas do cliente armazenadas no banco de dados,
 * incluindo endereços, histórico e preferências.
 * 
 * @async
 * @param {string} userId - ID único do usuário (UUID do Supabase Auth)
 * @returns {Promise<{data: any, error: string | null}>} Objeto com dados do cliente ou mensagem de erro
 * @throws {Error} Lança erro se usuário não encontrado
 * 
 * @example
 * const { data, error } = await getClienteData('uuid-do-usuario')
 * if (data) {
 *   console.log('Cliente:', data.nome)
 *   console.log('Endereços:', data.enderecos)
 * }
 */
// ============================================================================
// CLIENT DATA OPERATIONS
// ============================================================================

export async function getClienteData(userId: string): Promise<AuthResult> {
  try {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { 
      data: null, 
      error: handleAuthError(error, 'getClienteData') 
    }
  }
}

/**
 * Atualiza dados do cliente na tabela 'clientes'
 * 
 * Permite atualização parcial ou completa dos dados do cliente.
 * Apenas os campos fornecidos serão atualizados.
 * 
 * @async
 * @param {string} userId - ID único do usuário (UUID)
 * @param {Object} updates - Objeto com campos a serem atualizados
 * @param {string} [updates.nome] - Nome do cliente
 * @param {string} [updates.telefone] - Telefone de contato
 * @param {string} [updates.cpf] - CPF do cliente
 * @returns {Promise<{data: any, error: string | null}>} Objeto com dados atualizados ou mensagem de erro
 * @throws {Error} Lança erro se usuário não encontrado ou dados inválidos
 * 
 * @example
 * const result = await updateClienteData('uuid-do-usuario', {
 *   telefone: '11988888888',
 *   nome: 'João Silva Santos'
 * })
 * 
 * if (result.error) {
 *   console.error('Erro ao atualizar:', result.error)
 * } else {
 *   console.log('Dados atualizados:', result.data)
 * }
 */
export async function updateClienteData(
  userId: string, 
  updates: Record<string, any>
): Promise<AuthResult> {
  try {
    const { data, error } = await supabase
      .from('clientes')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { 
      data: null, 
      error: handleAuthError(error, 'updateClienteData') 
    }
  }
}

/**
 * Registra um listener para mudanças no estado de autenticação
 * 
 * Monitora eventos de autenticação em tempo real (login, logout, token refresh).
 * Útil para atualizar UI ou executar ações quando o estado de autenticação muda.
 * 
 * @param {Function} callback - Função executada quando estado de autenticação muda
 * @param {string} callback.event - Tipo do evento ('SIGNED_IN', 'SIGNED_OUT', 'TOKEN_REFRESHED', etc.)
 * @param {Object|null} callback.session - Sessão atual ou null se deslogado
 * @returns {Object} Subscription object com método unsubscribe()
 * 
 * @example
 * const { data: { subscription } } = onAuthStateChange((event, session) => {
 *   if (event === 'SIGNED_IN') {
 *     console.log('Usuário logou:', session.user.email)
 *   } else if (event === 'SIGNED_OUT') {
 *     console.log('Usuário deslogou')
 *   }
 * })
 * 
 * // Para remover o listener:
 * subscription.unsubscribe()
 */
export function onAuthStateChange(
  callback: (event: string, session: Session | null) => void
) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session)
  })
}
