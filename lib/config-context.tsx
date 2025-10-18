"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { supabase } from "@/lib/supabase"

interface PizzariaConfig {
  habilitar_broto: boolean
  habilitar_bordas_recheadas: boolean
}

interface ConfigContextType {
  config: PizzariaConfig
  updateConfig: (newConfig: Partial<PizzariaConfig>) => Promise<void>
  loading: boolean
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined)

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<PizzariaConfig>({
    habilitar_broto: true,
    habilitar_bordas_recheadas: true
  })
  const [configId, setConfigId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const loadConfig = async () => {
    try {
      const { data, error } = await supabase
        .from("pizzaria_config")
        .select("id, habilitar_broto, habilitar_bordas_recheadas")
        .single()

      if (error) {
        console.error("Erro ao carregar configurações:", error)
        return
      }

      if (data) {
        setConfigId(data.id)
        setConfig({
          habilitar_broto: data.habilitar_broto ?? true,
          habilitar_bordas_recheadas: data.habilitar_bordas_recheadas ?? true
        })
      }
    } catch (error) {
      console.error("Erro ao carregar configurações:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateConfig = async (newConfig: Partial<PizzariaConfig>) => {
    try {
      if (!configId) {
        throw new Error("ID da configuração não encontrado")
      }

      const { error } = await supabase
        .from("pizzaria_config")
        .update(newConfig)
        .eq("id", configId)

      if (error) throw error

      setConfig(prev => ({ ...prev, ...newConfig }))
    } catch (error) {
      console.error("Erro ao atualizar configurações:", error)
      throw error
    }
  }

  useEffect(() => {
    loadConfig()
  }, [])

  return (
    <ConfigContext.Provider value={{ config, updateConfig, loading }}>
      {children}
    </ConfigContext.Provider>
  )
}

export function useConfig() {
  const context = useContext(ConfigContext)
  if (context === undefined) {
    throw new Error("useConfig deve ser usado dentro de um ConfigProvider")
  }
  return context
} 