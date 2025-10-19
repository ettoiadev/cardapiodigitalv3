import { createClient } from "@supabase/supabase-js"

// Check if environment variables exist, otherwise use fallback values
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key"

// Only show warning if we're using fallback values
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn("⚠️ Supabase environment variables not found. Using mock data mode.")
  console.warn("Please create .env.local file with:")
  console.warn("NEXT_PUBLIC_SUPABASE_URL=your-supabase-url")
  console.warn("NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key")
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper function to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

// Helper function to test Supabase connectivity
export const testSupabaseConnection = async () => {
  try {
    if (!isSupabaseConfigured()) {
      return {
        success: false,
        error: "Supabase não configurado - variáveis de ambiente ausentes",
        details: "Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY"
      }
    }

    // Test simple query to verify connection
    const { data, error } = await supabase
      .from('pizzaria_config')
      .select('id')
      .limit(1)

    if (error) {
      return {
        success: false,
        error: "Erro na consulta ao banco",
        details: error.message
      }
    }

    return {
      success: true,
      message: "Conexão com Supabase funcionando",
      hasData: data && data.length > 0
    }
  } catch (error) {
    return {
      success: false,
      error: "Erro de rede ou configuração",
      details: error instanceof Error ? error.message : "Erro desconhecido"
    }
  }
}

// Helper function to get detailed environment info for debugging
export const getSupabaseDebugInfo = () => {
  const info = {
    configured: isSupabaseConfigured(),
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || "NOT_SET",
    hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    anonKeyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0,
    environment: process.env.NODE_ENV || "unknown"
  }

  // Don't log actual keys for security
  console.log("🔍 Supabase Debug Info:", {
    ...info,
    url: info.url.includes('placeholder') ? 'PLACEHOLDER (NOT CONFIGURED)' : 'CONFIGURED'
  })

  return info
}

export type Database = {
  public: {
    Tables: {
      pizzaria_config: {
        Row: {
          id: string
          nome: string
          foto_capa: string | null
          foto_perfil: string | null
          tempo_entrega_min: number
          tempo_entrega_max: number
          aceita_dinheiro: boolean
          aceita_cartao: boolean
          endereco: string | null
          telefone: string | null
          whatsapp: string | null
          horario_funcionamento: any
          created_at: string
          updated_at: string
        }
        Insert: {
          nome: string
          foto_capa?: string | null
          foto_perfil?: string | null
          tempo_entrega_min?: number
          tempo_entrega_max?: number
          aceita_dinheiro?: boolean
          aceita_cartao?: boolean
          endereco?: string | null
          telefone?: string | null
          whatsapp?: string | null
          horario_funcionamento?: any
        }
        Update: {
          nome?: string
          foto_capa?: string | null
          foto_perfil?: string | null
          tempo_entrega_min?: number
          tempo_entrega_max?: number
          aceita_dinheiro?: boolean
          aceita_cartao?: boolean
          endereco?: string | null
          telefone?: string | null
          whatsapp?: string | null
          horario_funcionamento?: any
        }
      }
      categorias: {
        Row: {
          id: string
          nome: string
          descricao: string | null
          ordem: number
          ativo: boolean
          created_at: string
        }
        Insert: {
          nome: string
          descricao?: string | null
          ordem?: number
          ativo?: boolean
        }
        Update: {
          nome?: string
          descricao?: string | null
          ordem?: number
          ativo?: boolean
        }
      }
      produtos: {
        Row: {
          id: string
          categoria_id: string | null
          nome: string
          descricao: string | null
          preco_tradicional: number | null
          preco_broto: number | null
          tipo: string
          ativo: boolean
          ordem: number
          created_at: string
        }
        Insert: {
          categoria_id?: string | null
          nome: string
          descricao?: string | null
          preco_tradicional?: number | null
          preco_broto?: number | null
          tipo?: string
          ativo?: boolean
          ordem?: number
        }
        Update: {
          categoria_id?: string | null
          nome?: string
          descricao?: string | null
          preco_tradicional?: number | null
          preco_broto?: number | null
          tipo?: string
          ativo?: boolean
          ordem?: number
        }
      }

      pedidos: {
        Row: {
          id: string
          tipo_entrega: string
          endereco_entrega: string | null
          forma_pagamento: string | null
          subtotal: number
          taxa_entrega: number
          total: number
          status: string
          observacoes: string | null
          enviado_whatsapp: boolean
          created_at: string
        }
        Insert: {
          tipo_entrega: string
          endereco_entrega?: string | null
          forma_pagamento?: string | null
          subtotal: number
          taxa_entrega?: number
          total: number
          status?: string
          observacoes?: string | null
          enviado_whatsapp?: boolean
        }
        Update: {
          tipo_entrega?: string
          endereco_entrega?: string | null
          forma_pagamento?: string | null
          subtotal?: number
          taxa_entrega?: number
          total?: number
          status?: string
          observacoes?: string | null
          enviado_whatsapp?: boolean
        }
      }
      pedido_itens: {
        Row: {
          id: string
          pedido_id: string
          produto_id: string | null
          nome_produto: string
          tamanho: string | null
          sabores: any
          quantidade: number
          preco_unitario: number
          preco_total: number
          created_at: string
        }
        Insert: {
          pedido_id: string
          produto_id?: string | null
          nome_produto: string
          tamanho?: string | null
          sabores?: any
          quantidade?: number
          preco_unitario: number
          preco_total: number
        }
        Update: {
          pedido_id?: string
          produto_id?: string | null
          nome_produto?: string
          tamanho?: string | null
          sabores?: any
          quantidade?: number
          preco_unitario?: number
          preco_total?: number
        }
      }
    }
  }
}
