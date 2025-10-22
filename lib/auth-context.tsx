"use client"
import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { supabase, testSupabaseConnection, getSupabaseDebugInfo } from "@/lib/supabase"
import { logger, logWithContext, logPerformance } from "@/lib/logger"

interface Admin {
  id: string
  email: string
  nome: string
}

interface AuthContextType {
  admin: Admin | null
  login: (email: string, senha: string) => Promise<boolean>
  logout: () => void
  updateCredentials: (novoEmail: string, novaSenha: string) => Promise<boolean>
  loading: boolean
  connectionTest: () => Promise<any>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar se há admin logado no localStorage
    try {
      const savedAdmin = localStorage.getItem("admin")
      if (savedAdmin) {
        const parsed = JSON.parse(savedAdmin)
        // Validar estrutura básica
        if (parsed && typeof parsed === 'object' && parsed.id) {
          setAdmin(parsed)
        } else {
          logger.warn("Dados de admin inválidos no localStorage")
          localStorage.removeItem("admin")
        }
      }
    } catch (error) {
      logger.error("Erro ao carregar admin do localStorage:", error)
      localStorage.removeItem("admin")
    }
    setLoading(false)

    // Debug info on load
    getSupabaseDebugInfo()
  }, [])

  const connectionTest = async () => {
    logger.debug("🔧 Testando conexão com Supabase...")
    const result = await testSupabaseConnection()
    logger.debug("📊 Resultado do teste:", result)
    return result
  }

  const login = async (email: string, senha: string): Promise<boolean> => {
    const log = logWithContext('AdminLogin')
    const startTime = Date.now()

    try {
      log("Iniciando processo de login...")
      log("Email fornecido:", email)
      log("Senha fornecida (length):", senha.length)

      // Test connection first
      const connectionResult = await testSupabaseConnection()
      if (!connectionResult.success) {
        logger.error("Falha na conexão:", connectionResult.error)
        logger.error("Detalhes:", connectionResult.details)
        throw new Error(`Erro de conexão: ${connectionResult.error}`)
      }

      log("Conexão com Supabase verificada")

      // Primeiro, vamos verificar se existem admins na tabela
      log("Verificando todos os admins na tabela...")
      const { data: allAdmins, error: allAdminsError } = await supabase
        .from("admins")
        .select("*")

      if (allAdminsError) {
        logger.error("Erro ao consultar todos os admins:", allAdminsError)
      } else {
        log("Todos os admins encontrados:", allAdmins)
        log("Total de admins:", allAdmins?.length || 0)
      }

      // Agora vamos tentar a consulta específica com logs detalhados
      log("Buscando admin específico com email:", email)
      const { data, error, count } = await supabase
        .from("admins")
        .select("*", { count: 'exact' })
        .eq("email", email)
        .eq("ativo", true)

      log("Resultado da consulta:", { data, error, count })

      if (error) {
        logger.error("Erro na consulta de admin:", error)
        logger.error("Código do erro:", error.code)
        logger.error("Mensagem do erro:", error.message)
        logger.error("Detalhes do erro:", error.details)

        if (error.code === 'PGRST116') {
          logger.error("PGRST116: Nenhum admin encontrado com este email")
          // Vamos tentar uma consulta mais permissiva
          log("Tentando consulta sem filtro de ativo...")
          const { data: dataWithoutActive, error: errorWithoutActive } = await supabase
            .from("admins")
            .select("*")
            .eq("email", email)

          log("Resultado sem filtro ativo:", { dataWithoutActive, errorWithoutActive })
        } else {
          logger.error("Erro técnico:", error.message)
        }
        return false
      }

      if (!data || data.length === 0) {
        logger.error("Erro: Nenhum admin encontrado com este email")
        log("Dados retornados:", data)
        log("Count:", count)
        return false
      }

      const adminData = data[0]
      log("Admin encontrado:", adminData)
      log("Verificando senha com bcrypt...")

      // Verificar senha usando a função PostgreSQL com bcrypt
      const { data: passwordCheck, error: passwordError } = await supabase
        .rpc('verify_admin_password', {
          admin_email: email,
          password_input: senha
        })

      if (passwordError) {
        logger.error("Erro ao verificar senha:", passwordError)
        return false
      }

      if (!passwordCheck) {
        logger.error("Erro: Senha incorreta")
        return false
      }

      log("Senha verificada com sucesso")

      const responseAdminData = {
        id: adminData.id,
        email: adminData.email,
        nome: adminData.nome,
      }

      setAdmin(responseAdminData)
      localStorage.setItem("admin", JSON.stringify(responseAdminData))
      log("Login realizado com sucesso")

      logPerformance('AdminLogin', startTime)
      return true
    } catch (error) {
      logger.error("Erro no sistema de login:", error)
      if (error instanceof Error) {
        logger.error("Stack trace:", error.stack)
      }
      return false
    }
  }

  const updateCredentials = async (novoEmail: string, novaSenha: string): Promise<boolean> => {
    try {
      if (!admin) {
        return false
      }

      // Test connection first
      const connectionResult = await testSupabaseConnection()
      if (!connectionResult.success) {
        logger.error("Falha na conexão para atualizar credenciais:", connectionResult.error)
        throw new Error(`Erro de conexão: ${connectionResult.error}`)
      }

      // Por enquanto, vamos simular a atualização para desenvolvimento
      // Em produção, isso deveria ser feito com hash seguro no backend
      logger.debug("Simulando atualização de credenciais:", { novoEmail, novaSenha })

      // Atualizar dados locais
      const updatedAdmin = { ...admin, email: novoEmail }
      setAdmin(updatedAdmin)
      localStorage.setItem("admin", JSON.stringify(updatedAdmin))

      // Simular sucesso
      return true
    } catch (error) {
      logger.error("Erro ao atualizar credenciais:", error)
      return false
    }
  }

  const logout = () => {
    setAdmin(null)
    localStorage.removeItem("admin")
    logger.log("🚪 Logout realizado")
  }

  return (
    <AuthContext.Provider value={{ admin, login, logout, updateCredentials, loading, connectionTest }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
