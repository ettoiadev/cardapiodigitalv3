"use client"

import { useEffect, useState } from "react"
// AdminLayout removido - componente será usado dentro de uma aba
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabase"
import { Award, Gift, Star, TrendingUp, Plus, Edit, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { RecompensaFormModal } from "@/components/fidelidade/recompensa-form-modal"

interface FidelidadeConfig {
  id: string
  pontos_por_real: number
  ativo: boolean
  nivel_bronze_min: number
  nivel_prata_min: number
  nivel_ouro_min: number
}

interface Recompensa {
  id: string
  nome: string
  descricao?: string
  pontos_necessarios: number
  ativo: boolean
  estoque?: number
}

interface ClienteFidelidade {
  cliente_id: string
  pontos_atuais: number
  pontos_totais: number
  nivel: string
  clientes?: {
    nome: string
  }
}

export default function FidelidadeTab() {
  const [loading, setLoading] = useState(true)
  const [config, setConfig] = useState<FidelidadeConfig | null>(null)
  const [recompensas, setRecompensas] = useState<Recompensa[]>([])
  const [clientes, setClientes] = useState<ClienteFidelidade[]>([])
  const [isRecompensaOpen, setIsRecompensaOpen] = useState(false)
  const [selectedRecompensa, setSelectedRecompensa] = useState<Recompensa | null>(null)
  const [stats, setStats] = useState({
    totalClientes: 0,
    totalPontos: 0,
    recompensasAtivas: 0,
    resgatesRealizados: 0,
  })

  useEffect(() => {
    loadConfig()
    loadRecompensas()
    loadClientes()
  }, [])

  const loadConfig = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("fidelidade_config")
        .select("*")
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (!data) {
        // Criar configuração padrão
        const { data: newConfig, error: createError } = await supabase
          .from("fidelidade_config")
          .insert([{
            pontos_por_real: 1,
            ativo: false,
            nivel_bronze_min: 0,
            nivel_prata_min: 100,
            nivel_ouro_min: 500,
          }])
          .select()
          .single()

        if (createError) throw createError
        setConfig(newConfig)
      } else {
        setConfig(data)
      }
    } catch (error) {
      console.error("Erro ao carregar configuração:", error)
      toast.error("Erro ao carregar configuração")
    } finally {
      setLoading(false)
    }
  }

  const loadRecompensas = async () => {
    try {
      const { data, error } = await supabase
        .from("recompensas")
        .select("*")
        .order("pontos_necessarios", { ascending: true })

      if (error) throw error

      setRecompensas(data || [])
      
      const ativas = data?.filter(r => r.ativo).length || 0
      setStats(prev => ({ ...prev, recompensasAtivas: ativas }))
    } catch (error) {
      console.error("Erro ao carregar recompensas:", error)
      toast.error("Erro ao carregar recompensas")
    }
  }

  const loadClientes = async () => {
    try {
      const { data, error } = await supabase
        .from("clientes_fidelidade")
        .select(`
          *,
          clientes (nome)
        `)
        .order("pontos_atuais", { ascending: false })
        .limit(20)

      if (error) throw error

      setClientes(data || [])
      
      const totalClientes = data?.length || 0
      const totalPontos = data?.reduce((sum, c) => sum + c.pontos_atuais, 0) || 0
      
      setStats(prev => ({ ...prev, totalClientes, totalPontos }))
    } catch (error) {
      console.error("Erro ao carregar clientes:", error)
      toast.error("Erro ao carregar clientes")
    }
  }

  const handleSaveConfig = async () => {
    if (!config) return

    if (config.pontos_por_real <= 0) {
      toast.error("Pontos por real deve ser maior que zero")
      return
    }

    try {
      const { error } = await supabase
        .from("fidelidade_config")
        .update({
          pontos_por_real: config.pontos_por_real,
          ativo: config.ativo,
          nivel_bronze_min: config.nivel_bronze_min,
          nivel_prata_min: config.nivel_prata_min,
          nivel_ouro_min: config.nivel_ouro_min,
        })
        .eq("id", config.id)

      if (error) throw error

      toast.success("Configuração salva com sucesso!")
    } catch (error) {
      console.error("Erro ao salvar configuração:", error)
      toast.error("Erro ao salvar configuração")
    }
  }

  const handleDeleteRecompensa = async (id: string) => {
    if (!confirm("Deseja realmente excluir esta recompensa?")) return

    try {
      const { error } = await supabase
        .from("recompensas")
        .delete()
        .eq("id", id)

      if (error) throw error

      toast.success("Recompensa excluída com sucesso!")
      loadRecompensas()
    } catch (error) {
      console.error("Erro ao excluir recompensa:", error)
      toast.error("Erro ao excluir recompensa")
    }
  }

  const getNivelBadge = (nivel: string) => {
    const nivelMap: Record<string, { className: string; icon: any }> = {
      bronze: { className: "bg-orange-100 text-orange-800", icon: Award },
      prata: { className: "bg-gray-100 text-gray-800", icon: Award },
      ouro: { className: "bg-yellow-100 text-yellow-800", icon: Award },
    }

    const nivelInfo = nivelMap[nivel] || { className: "", icon: Award }
    const Icon = nivelInfo.icon

    return (
      <Badge variant="secondary" className={`${nivelInfo.className} flex items-center space-x-1`}>
        <Icon className="h-3 w-3" />
        <span className="capitalize">{nivel}</span>
      </Badge>
    )
  }

  return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Programa de Fidelidade</h2>
            <p className="text-gray-600 mt-1">Gerencie pontos, recompensas e níveis</p>
          </div>
          <Button
            onClick={() => {
              setSelectedRecompensa(null)
              setIsRecompensaOpen(true)
            }}
            className="bg-red-600 hover:bg-red-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Recompensa
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Carregando...</div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Clientes Ativos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <Star className="h-5 w-5 text-blue-600" />
                    <span className="text-2xl font-bold text-gray-900">
                      {stats.totalClientes}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Total de Pontos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <span className="text-2xl font-bold text-green-600">
                      {stats.totalPontos.toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Recompensas Ativas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <Gift className="h-5 w-5 text-purple-600" />
                    <span className="text-2xl font-bold text-gray-900">
                      {stats.recompensasAtivas}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Resgates
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <Award className="h-5 w-5 text-orange-600" />
                    <span className="text-2xl font-bold text-gray-900">
                      {stats.resgatesRealizados}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Configuração */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Star className="h-5 w-5 text-red-600" />
                  <span>Configuração do Programa</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pontos_por_real">Pontos por Real Gasto</Label>
                  <Input
                    id="pontos_por_real"
                    type="number"
                    min="0"
                    step="0.1"
                    value={config?.pontos_por_real || 0}
                    onChange={(e) => setConfig({ ...config!, pontos_por_real: parseFloat(e.target.value) })}
                    placeholder="1"
                  />
                  <p className="text-xs text-gray-500">
                    Ex: 1 ponto = R$ 1,00 gasto
                  </p>
                </div>

                <div className="pt-4 border-t">
                  <h3 className="font-semibold text-gray-900 mb-3">Níveis de Fidelidade</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nivel_bronze_min">Bronze (Mínimo)</Label>
                      <Input
                        id="nivel_bronze_min"
                        type="number"
                        min="0"
                        value={config?.nivel_bronze_min || 0}
                        onChange={(e) => setConfig({ ...config!, nivel_bronze_min: parseInt(e.target.value) })}
                        placeholder="0"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="nivel_prata_min">Prata (Mínimo)</Label>
                      <Input
                        id="nivel_prata_min"
                        type="number"
                        min="0"
                        value={config?.nivel_prata_min || 0}
                        onChange={(e) => setConfig({ ...config!, nivel_prata_min: parseInt(e.target.value) })}
                        placeholder="100"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="nivel_ouro_min">Ouro (Mínimo)</Label>
                      <Input
                        id="nivel_ouro_min"
                        type="number"
                        min="0"
                        value={config?.nivel_ouro_min || 0}
                        onChange={(e) => setConfig({ ...config!, nivel_ouro_min: parseInt(e.target.value) })}
                        placeholder="500"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="ativo"
                    checked={config?.ativo || false}
                    onChange={(e) => setConfig({ ...config!, ativo: e.target.checked })}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                  <Label htmlFor="ativo" className="cursor-pointer">
                    Ativar programa de fidelidade
                  </Label>
                </div>

                <Button
                  onClick={handleSaveConfig}
                  className="w-full bg-red-600 hover:bg-red-700"
                >
                  Salvar Configuração
                </Button>
              </CardContent>
            </Card>

            {/* Recompensas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Gift className="h-5 w-5 text-red-600" />
                  <span>Recompensas Disponíveis</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recompensas.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Nenhuma recompensa cadastrada
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {recompensas.map((recompensa) => (
                      <Card key={recompensa.id} className={!recompensa.ativo ? 'opacity-50' : ''}>
                        <CardContent className="pt-6">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900">
                                  {recompensa.nome}
                                </h3>
                                {recompensa.descricao && (
                                  <p className="text-sm text-gray-600 mt-1">
                                    {recompensa.descricao}
                                  </p>
                                )}
                              </div>
                              {!recompensa.ativo && (
                                <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                                  Inativo
                                </Badge>
                              )}
                            </div>

                            <div className="flex items-center space-x-2">
                              <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                              <span className="text-lg font-bold text-gray-900">
                                {recompensa.pontos_necessarios} pontos
                              </span>
                            </div>

                            {recompensa.estoque !== null && recompensa.estoque !== undefined && (
                              <p className="text-sm text-gray-500">
                                Estoque: {recompensa.estoque} unidades
                              </p>
                            )}

                            <div className="flex space-x-2 pt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedRecompensa(recompensa)
                                  setIsRecompensaOpen(true)
                                }}
                                className="flex-1"
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Editar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteRecompensa(recompensa.id)}
                                className="text-red-600 border-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Clientes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Award className="h-5 w-5 text-red-600" />
                  <span>Top 20 Clientes</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {clientes.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Nenhum cliente no programa ainda
                  </div>
                ) : (
                  <div className="space-y-3">
                    {clientes.map((cliente, index) => (
                      <div
                        key={cliente.cliente_id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-red-600">
                              {index + 1}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {cliente.clientes?.nome || "Cliente"}
                            </p>
                            <p className="text-sm text-gray-500">
                              Total acumulado: {cliente.pontos_totais} pontos
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          {getNivelBadge(cliente.nivel)}
                          <div className="text-right">
                            <p className="text-lg font-bold text-gray-900">
                              {cliente.pontos_atuais}
                            </p>
                            <p className="text-xs text-gray-500">pontos</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-3">
                  <Star className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-semibold text-blue-900 mb-1">
                      💡 Como Funciona o Programa
                    </h3>
                    <p className="text-sm text-blue-700 mb-2">
                      Clientes ganham pontos a cada compra baseado no valor gasto. Os pontos
                      podem ser trocados por recompensas cadastradas. Quanto mais pontos, maior
                      o nível de fidelidade (Bronze, Prata, Ouro).
                    </p>
                    <p className="text-sm text-blue-700">
                      <strong>Dica:</strong> Configure recompensas atrativas para incentivar
                      os clientes a acumularem pontos e voltarem sempre!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Modal */}
        <RecompensaFormModal
          isOpen={isRecompensaOpen}
          onClose={() => {
            setIsRecompensaOpen(false)
            setSelectedRecompensa(null)
          }}
          recompensa={selectedRecompensa}
          onSuccess={() => {
            setIsRecompensaOpen(false)
            setSelectedRecompensa(null)
            loadRecompensas()
          }}
        />
      </div>
  )
}
