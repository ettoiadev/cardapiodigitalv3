/**
 * AUTH HELPERS
 * Funções auxiliares para autenticação com Supabase
 */

import { supabase } from './supabase'

export interface SignUpData {
  nome: string
  email: string
  telefone: string
  senha: string
}

export interface SignInData {
  email: string
  senha: string
}

/**
 * Cadastrar novo cliente
 */
export async function signUp({ nome, email, telefone, senha }: SignUpData) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        data: {
          nome,
          telefone
        }
      }
    })

    if (error) throw error

    return { data, error: null }
  } catch (error: any) {
    console.error('Erro no cadastro:', error)
    return { data: null, error: error.message }
  }
}

/**
 * Fazer login
 */
export async function signIn({ email, senha }: SignInData) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha
    })

    if (error) throw error

    return { data, error: null }
  } catch (error: any) {
    console.error('Erro no login:', error)
    return { data: null, error: error.message }
  }
}

/**
 * Fazer logout
 */
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    return { error: null }
  } catch (error: any) {
    console.error('Erro no logout:', error)
    return { error: error.message }
  }
}

/**
 * Obter sessão atual
 */
export async function getSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    return { session, error: null }
  } catch (error: any) {
    console.error('Erro ao obter sessão:', error)
    return { session: null, error: error.message }
  }
}

/**
 * Obter usuário atual
 */
export async function getUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return { user, error: null }
  } catch (error: any) {
    console.error('Erro ao obter usuário:', error)
    return { user: null, error: error.message }
  }
}

/**
 * Recuperar senha
 */
export async function resetPassword(email: string) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/recuperar-senha`
    })

    if (error) throw error
    return { error: null }
  } catch (error: any) {
    console.error('Erro ao recuperar senha:', error)
    return { error: error.message }
  }
}

/**
 * Atualizar senha
 */
export async function updatePassword(novaSenha: string) {
  try {
    const { error } = await supabase.auth.updateUser({
      password: novaSenha
    })

    if (error) throw error
    return { error: null }
  } catch (error: any) {
    console.error('Erro ao atualizar senha:', error)
    return { error: error.message }
  }
}

/**
 * Verificar se usuário está autenticado
 */
export async function isAuthenticated(): Promise<boolean> {
  const { session } = await getSession()
  return !!session
}

/**
 * Obter dados do cliente da tabela clientes
 */
export async function getClienteData(userId: string) {
  try {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error: any) {
    console.error('Erro ao obter dados do cliente:', error)
    return { data: null, error: error.message }
  }
}

/**
 * Atualizar dados do cliente
 */
export async function updateClienteData(userId: string, updates: any) {
  try {
    const { data, error } = await supabase
      .from('clientes')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error: any) {
    console.error('Erro ao atualizar dados do cliente:', error)
    return { data: null, error: error.message }
  }
}

/**
 * Listener para mudanças de autenticação
 */
export function onAuthStateChange(callback: (event: string, session: any) => void) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session)
  })
}
