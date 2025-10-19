/**
 * AUTH HELPERS LEGACY
 * 
 * @deprecated Este arquivo é mantido apenas para compatibilidade com código antigo.
 * Use lib/auth.ts para novos desenvolvimentos.
 * 
 * Este arquivo redireciona todas as chamadas para o novo sistema em lib/auth.ts
 */

import {
  signUp as signUpV2,
  signIn as signInV2,
  signOut as signOutV2,
  getSession as getSessionV2,
  getUser as getUserV2,
  type SignUpInput,
  type SignInInput,
  type AuthResponse
} from './auth'

// ============================================================================
// TYPES (Compatibilidade com código antigo)
// ============================================================================

export type AuthResult<T = any> = AuthResponse<T>

export type AuthErrorResult = {
  error: string | null
}

export interface SignUpData extends SignUpInput {}
export interface SignInData extends SignInInput {}

// ============================================================================
// FUNÇÕES (Redirecionam para lib/auth.ts)
// ============================================================================

/**
 * @deprecated Use signUp from lib/auth.ts
 */
export async function signUp(data: SignUpData): Promise<AuthResult> {
  return await signUpV2(data)
}

/**
 * @deprecated Use signIn from lib/auth.ts
 */
export async function signIn(data: SignInData): Promise<AuthResult> {
  return await signInV2(data)
}

/**
 * @deprecated Use signOut from lib/auth.ts
 */
export async function signOut(): Promise<AuthErrorResult> {
  const result = await signOutV2()
  return { error: result.error }
}

/**
 * @deprecated Use getSession from lib/auth.ts
 */
export async function getSession(): Promise<AuthResult> {
  return await getSessionV2()
}

/**
 * @deprecated Use getUser from lib/auth.ts
 */
export async function getUser(): Promise<AuthResult> {
  return await getUserV2()
}

/**
 * @deprecated Use resetPassword from lib/auth.ts
 */
export async function requestPasswordReset(email: string): Promise<AuthErrorResult> {
  const { resetPassword } = await import('./auth')
  const result = await resetPassword(email)
  return { error: result.error }
}

/**
 * @deprecated Use updatePassword from lib/auth.ts
 */
export async function updatePassword(newPassword: string): Promise<AuthResult> {
  const { updatePassword: updatePasswordV2 } = await import('./auth')
  return await updatePasswordV2(newPassword)
}

/**
 * @deprecated Use getCliente from lib/auth.ts
 */
export async function getClienteData(userId: string): Promise<AuthResult> {
  const { getCliente } = await import('./auth')
  return await getCliente(userId)
}
