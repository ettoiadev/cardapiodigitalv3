"use client"

import { useEffect, useState } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"
import { FileText, CheckCircle, XCircle, AlertCircle, Settings, Printer } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"

interface CupomFiscalConfig {
  id: string
  cnpj?: string
  inscricao_estadual?: string
  razao_social?: string
  nome_fantasia?: string
  api_url?: string
  api_token?: string
  ambiente: string
  serie_nfce?: string
  ativo: boolean
}

interface CupomFiscal {
  id: string
  pedido_id: string
  numero_nota: string
  serie: string
  chave_acesso?: string
  status: string
  valor_total: number
  data_emissao: string
  data_cancelamento?: string
  motivo_cancelamento?: string
  xml_url?: string
  pdf_url?: string
}

export default function CupomFiscalPage() {
  const [loading, setLoading] = useState(true)
  const [config, setConfig] = useState<CupomFiscalConfig | null>(null)
  const [cupons, setCupons] = useState<CupomFiscal[]>([])
  const [stats, setStats] = useState({
    emitidos: 0,
    autorizados: 0,
    cancelados: 0,
    rejeitados: 0,
  })

  useEffect(() => {
    loadConfig()
    loadCupons()
  }, [])

  const loadConfig = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("cupom_fiscal_config")
        .select("*")
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (!data) {
        // Criar configuração padrão
        const { data: newConfig, error: createError } = await supabase
          .from("cupom_fiscal_config")
          .insert([{
            ambiente: 'homologacao',
            serie_nfce: '1',
            ativo: false,
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

  const loadCupons = async () => {
    try {
      const { data, error } = await supabase
        .from("cupons_fiscais")
        .select("*")
        .order("data_emissao", { ascending: false })
        .limit(50)

      if (error) throw error

      setCupons(data || [])

      // Calcular estatísticas
      const emitidos = data?.length || 0
      const autorizados = data?.filter(c => c.status === 'autorizado').length || 0
      const cancelados = data?.filter(c => c.status === 'cancelado').length || 0
      const rejeitados = data?.filter(c => c.status === 'rejeitado').length || 0

      setStats({ emitidos, autorizados, cancelados, rejeitados })
    } catch (error) {
      console.error("Erro ao carregar cupons:", error)
      toast.error("Erro ao carregar cupons")
    }
  }

  const handleSaveConfig = async () => {
    if (!config) return

    if (!config.cnpj || !config.razao_social) {
      toast.error("CNPJ e Razão Social são obrigatórios")
      return
    }

    try {
      const { error } = await supabase
        .from("cupom_fiscal_config")
        .update({
          cnpj: config.cnpj,
          inscricao_estadual: config.inscricao_estadual,
          razao_social: config.razao_social,
          nome_fantasia: config.nome_fantasia,
          api_url: config.api_url,
          api_token: config.api_token,
          ambiente: config.ambiente,
          serie_nfce: config.serie_nfce,
          ativo: config.ativo,
        })
        .eq("id", config.id)

      if (error) throw error

      toast.success("Configuração salva com sucesso!")
    } catch (error) {
      console.error("Erro ao salvar configuração:", error)
      toast.error("Erro ao salvar configuração")
    }
  }

  const handleEmitirCupom = async (pedidoId: string) => {
    if (!config?.ativo) {
      toast.error("Emissão de cupom fiscal não está ativa")
      return
    }

    try {
      // Simular emissão (em produção, chamar API real)
      const numeroCupom = Math.floor(Math.random() * 999999) + 1
      const chaveAcesso = `${config.cnpj}${Date.now()}`.substring(0, 44)

      const { error } = await supabase
        .from("cupons_fiscais")
        .insert([{
          pedido_id: pedidoId,
          numero_nota: numeroCupom.toString(),
          serie: config.serie_nfce || '1',
          chave_acesso: chaveAcesso,
          status: 'autorizado',
          valor_total: 0, // Buscar do pedido
          data_emissao: new Date().toISOString(),
        }])

      if (error) throw error

      toast.success("Cupom fiscal emitido com sucesso!")
      loadCupons()
    } catch (error) {
      console.error("Erro ao emitir cupom:", error)
      toast.error("Erro ao emitir cupom fiscal")
    }
  }

  const handleCancelarCupom = async (cupomId: string) => {
    const motivo = prompt("Informe o motivo do cancelamento:")
    if (!motivo) return

    try {
      const { error } = await supabase
        .from("cupons_fiscais")
        .update({
          status: 'cancelado',
          data_cancelamento: new Date().toISOString(),
          motivo_cancelamento: motivo,
        })
        .eq("id", cupomId)

      if (error) throw error

      toast.success("Cupom fiscal cancelado com sucesso!")
      loadCupons()
    } catch (error) {
      console.error("Erro ao cancelar cupom:", error)
      toast.error("Erro ao cancelar cupom fiscal")
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const formatDateTime = (date: string) => {
    try {
      return format(new Date(date), "dd/MM/yyyy HH:mm", { locale: ptBR })
    } catch {
      return "-"
    }
  }

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    if (numbers.length <= 2) return numbers
    if (numbers.length <= 5) return `${numbers.slice(0, 2)}.${numbers.slice(2)}`
    if (numbers.length <= 8) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`
    if (numbers.length <= 12) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8)}`
    return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12, 14)}`
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string; icon: any }> = {
      autorizado: { label: "Autorizado", className: "bg-green-100 text-green-800", icon: CheckCircle },
      processando: { label: "Processando", className: "bg-yellow-100 text-yellow-800", icon: AlertCircle },
      cancelado: { label: "Cancelado", className: "bg-gray-100 text-gray-800", icon: XCircle },
      rejeitado: { label: "Rejeitado", className: "bg-red-100 text-red-800", icon: XCircle },
    }

    const statusInfo = statusMap[status] || { label: status, className: "", icon: AlertCircle }
    const Icon = statusInfo.icon

    return (
      <Badge variant="secondary" className={`${statusInfo.className} flex items-center space-x-1`}>
        <Icon className="h-3 w-3" />
        <span>{statusInfo.label}</span>
      </Badge>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cupom Fiscal (NFC-e)</h1>
          <p className="text-gray-600 mt-1">Gerencie a emissão de cupons fiscais eletrônicos</p>
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
                    Total Emitidos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <span className="text-2xl font-bold text-gray-900">
                      {stats.emitidos}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Autorizados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-2xl font-bold text-green-600">
                      {stats.autorizados}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Cancelados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <XCircle className="h-5 w-5 text-gray-600" />
                    <span className="text-2xl font-bold text-gray-600">
                      {stats.cancelados}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Rejeitados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <span className="text-2xl font-bold text-red-600">
                      {stats.rejeitados}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Configuração */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5 text-red-600" />
                  <span>Configuração da Empresa</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cnpj">CNPJ *</Label>
                    <Input
                      id="cnpj"
                      value={config?.cnpj || ""}
                      onChange={(e) => setConfig({ ...config!, cnpj: formatCNPJ(e.target.value) })}
                      placeholder="00.000.000/0000-00"
                      maxLength={18}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="inscricao_estadual">Inscrição Estadual</Label>
                    <Input
                      id="inscricao_estadual"
                      value={config?.inscricao_estadual || ""}
                      onChange={(e) => setConfig({ ...config!, inscricao_estadual: e.target.value })}
                      placeholder="000.000.000.000"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="razao_social">Razão Social *</Label>
                  <Input
                    id="razao_social"
                    value={config?.razao_social || ""}
                    onChange={(e) => setConfig({ ...config!, razao_social: e.target.value })}
                    placeholder="Razão social da empresa"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nome_fantasia">Nome Fantasia</Label>
                  <Input
                    id="nome_fantasia"
                    value={config?.nome_fantasia || ""}
                    onChange={(e) => setConfig({ ...config!, nome_fantasia: e.target.value })}
                    placeholder="Nome fantasia da empresa"
                  />
                </div>

                <div className="pt-4 border-t">
                  <h3 className="font-semibold text-gray-900 mb-3">Configuração da API</h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="api_url">URL da API</Label>
                      <Input
                        id="api_url"
                        value={config?.api_url || ""}
                        onChange={(e) => setConfig({ ...config!, api_url: e.target.value })}
                        placeholder="https://api.nfce.com.br/..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="api_token">Token de Acesso</Label>
                      <Input
                        id="api_token"
                        type="password"
                        value={config?.api_token || ""}
                        onChange={(e) => setConfig({ ...config!, api_token: e.target.value })}
                        placeholder="Token de autenticação"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="ambiente">Ambiente</Label>
                        <select
                          id="ambiente"
                          value={config?.ambiente || 'homologacao'}
                          onChange={(e) => setConfig({ ...config!, ambiente: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        >
                          <option value="homologacao">Homologação</option>
                          <option value="producao">Produção</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="serie_nfce">Série NFC-e</Label>
                        <Input
                          id="serie_nfce"
                          value={config?.serie_nfce || ""}
                          onChange={(e) => setConfig({ ...config!, serie_nfce: e.target.value })}
                          placeholder="1"
                        />
                      </div>
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
                    Ativar emissão automática de cupom fiscal
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

            {/* Histórico de Cupons */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-red-600" />
                  <span>Histórico de Cupons Fiscais</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {cupons.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Nenhum cupom fiscal emitido ainda
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cupons.map((cupom) => (
                      <div
                        key={cupom.id}
                        className="flex items-start justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="font-semibold text-gray-900">
                              NFC-e Nº {cupom.numero_nota}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              Série {cupom.serie}
                            </Badge>
                            {getStatusBadge(cupom.status)}
                          </div>
                          
                          {cupom.chave_acesso && (
                            <p className="text-xs text-gray-500 mb-1 font-mono">
                              Chave: {cupom.chave_acesso}
                            </p>
                          )}
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span className="font-bold text-gray-900">
                              {formatCurrency(cupom.valor_total)}
                            </span>
                            <span>{formatDateTime(cupom.data_emissao)}</span>
                          </div>

                          {cupom.status === 'cancelado' && cupom.motivo_cancelamento && (
                            <p className="text-xs text-red-600 mt-2">
                              Cancelado: {cupom.motivo_cancelamento}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-col space-y-2 ml-4">
                          {cupom.status === 'autorizado' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-blue-600 border-blue-600 hover:bg-blue-50"
                              >
                                <Printer className="h-4 w-4 mr-1" />
                                Imprimir
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-600 hover:bg-red-50"
                                onClick={() => handleCancelarCupom(cupom.id)}
                              >
                                Cancelar
                              </Button>
                            </>
                          )}
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
                  <FileText className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-semibold text-blue-900 mb-1">
                      💡 Sobre o Cupom Fiscal Eletrônico
                    </h3>
                    <p className="text-sm text-blue-700 mb-2">
                      O NFC-e (Nota Fiscal de Consumidor Eletrônica) é obrigatório para
                      estabelecimentos que realizam vendas presenciais. Configure sua API
                      de emissão (Focus NFe, Bling, Tiny, etc.) e ative a emissão automática.
                    </p>
                    <p className="text-sm text-blue-700">
                      <strong>Importante:</strong> Use o ambiente de homologação para testes
                      antes de ativar em produção. Certifique-se de ter um certificado digital
                      válido (A1 ou A3).
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  )
}
