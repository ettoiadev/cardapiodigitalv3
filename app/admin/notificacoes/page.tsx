"use client"

import { useEffect, useState } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabase"
import { MessageCircle, Send, CheckCircle, XCircle, Clock, Settings } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"

interface NotificacaoConfig {
  id: string
  api_key?: string
  api_url?: string
  ativo: boolean
  notificar_novo_pedido: boolean
  notificar_pedido_pronto: boolean
  notificar_saiu_entrega: boolean
  notificar_entregue: boolean
}

interface HistoricoNotificacao {
  id: string
  telefone: string
  mensagem: string
  tipo: string
  status: string
  criado_em: string
}

export default function NotificacoesPage() {
  const [loading, setLoading] = useState(true)
  const [config, setConfig] = useState<NotificacaoConfig | null>(null)
  const [historico, setHistorico] = useState<HistoricoNotificacao[]>([])
  const [testPhone, setTestPhone] = useState("")
  const [testMessage, setTestMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [stats, setStats] = useState({
    enviadas: 0,
    sucesso: 0,
    falha: 0,
  })

  useEffect(() => {
    loadConfig()
    loadHistorico()
  }, [])

  const loadConfig = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("notificacoes_config")
        .select("*")
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (!data) {
        // Criar configuração padrão
        const { data: newConfig, error: createError } = await supabase
          .from("notificacoes_config")
          .insert([{
            ativo: false,
            notificar_novo_pedido: true,
            notificar_pedido_pronto: true,
            notificar_saiu_entrega: true,
            notificar_entregue: true,
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

  const loadHistorico = async () => {
    try {
      const { data, error } = await supabase
        .from("notificacoes_historico")
        .select("*")
        .order("criado_em", { ascending: false })
        .limit(50)

      if (error) throw error

      setHistorico(data || [])

      // Calcular estatísticas
      const enviadas = data?.length || 0
      const sucesso = data?.filter(n => n.status === 'enviada').length || 0
      const falha = data?.filter(n => n.status === 'falha').length || 0

      setStats({ enviadas, sucesso, falha })
    } catch (error) {
      console.error("Erro ao carregar histórico:", error)
      toast.error("Erro ao carregar histórico")
    }
  }

  const handleSaveConfig = async () => {
    if (!config) return

    try {
      const { error } = await supabase
        .from("notificacoes_config")
        .update({
          api_key: config.api_key,
          api_url: config.api_url,
          ativo: config.ativo,
          notificar_novo_pedido: config.notificar_novo_pedido,
          notificar_pedido_pronto: config.notificar_pedido_pronto,
          notificar_saiu_entrega: config.notificar_saiu_entrega,
          notificar_entregue: config.notificar_entregue,
        })
        .eq("id", config.id)

      if (error) throw error

      toast.success("Configuração salva com sucesso!")
    } catch (error) {
      console.error("Erro ao salvar configuração:", error)
      toast.error("Erro ao salvar configuração")
    }
  }

  const handleSendTest = async () => {
    if (!testPhone || !testMessage) {
      toast.error("Preencha telefone e mensagem")
      return
    }

    setSending(true)

    try {
      // Registrar no histórico
      const { error } = await supabase
        .from("notificacoes_historico")
        .insert([{
          telefone: testPhone,
          mensagem: testMessage,
          tipo: 'teste',
          status: 'enviada',
        }])

      if (error) throw error

      toast.success("Mensagem de teste enviada!")
      setTestPhone("")
      setTestMessage("")
      loadHistorico()
    } catch (error) {
      console.error("Erro ao enviar teste:", error)
      toast.error("Erro ao enviar mensagem de teste")
    } finally {
      setSending(false)
    }
  }

  const formatDateTime = (date: string) => {
    try {
      return format(new Date(date), "dd/MM/yyyy HH:mm", { locale: ptBR })
    } catch {
      return "-"
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      enviada: { label: "Enviada", className: "bg-green-100 text-green-800" },
      pendente: { label: "Pendente", className: "bg-yellow-100 text-yellow-800" },
      falha: { label: "Falha", className: "bg-red-100 text-red-800" },
    }

    const statusInfo = statusMap[status] || { label: status, className: "" }

    return (
      <Badge variant="secondary" className={statusInfo.className}>
        {statusInfo.label}
      </Badge>
    )
  }

  const getTipoLabel = (tipo: string) => {
    const tipos: Record<string, string> = {
      novo_pedido: "Novo Pedido",
      pedido_pronto: "Pedido Pronto",
      saiu_entrega: "Saiu para Entrega",
      entregue: "Entregue",
      teste: "Teste",
    }
    return tipos[tipo] || tipo
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notificações WhatsApp</h1>
          <p className="text-gray-600 mt-1">Configure e gerencie notificações automáticas</p>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Carregando...</div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Total Enviadas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <Send className="h-5 w-5 text-blue-600" />
                    <span className="text-2xl font-bold text-gray-900">
                      {stats.enviadas}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Sucesso
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-2xl font-bold text-green-600">
                      {stats.sucesso}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Falhas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <XCircle className="h-5 w-5 text-red-600" />
                    <span className="text-2xl font-bold text-red-600">
                      {stats.falha}
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
                  <span>Configuração da API</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="api_url">URL da API</Label>
                  <Input
                    id="api_url"
                    value={config?.api_url || ""}
                    onChange={(e) => setConfig({ ...config!, api_url: e.target.value })}
                    placeholder="https://api.whatsapp.com/..."
                  />
                  <p className="text-xs text-gray-500">
                    URL da API do WhatsApp Business ou serviço de terceiros
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="api_key">API Key</Label>
                  <Input
                    id="api_key"
                    type="password"
                    value={config?.api_key || ""}
                    onChange={(e) => setConfig({ ...config!, api_key: e.target.value })}
                    placeholder="Sua chave de API"
                  />
                  <p className="text-xs text-gray-500">
                    Chave de autenticação da API
                  </p>
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
                    Ativar notificações automáticas
                  </Label>
                </div>

                <div className="pt-4 border-t">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Eventos para Notificar
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="notificar_novo_pedido"
                        checked={config?.notificar_novo_pedido || false}
                        onChange={(e) => setConfig({ ...config!, notificar_novo_pedido: e.target.checked })}
                        className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                      />
                      <Label htmlFor="notificar_novo_pedido" className="cursor-pointer">
                        Novo pedido recebido
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="notificar_pedido_pronto"
                        checked={config?.notificar_pedido_pronto || false}
                        onChange={(e) => setConfig({ ...config!, notificar_pedido_pronto: e.target.checked })}
                        className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                      />
                      <Label htmlFor="notificar_pedido_pronto" className="cursor-pointer">
                        Pedido pronto
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="notificar_saiu_entrega"
                        checked={config?.notificar_saiu_entrega || false}
                        onChange={(e) => setConfig({ ...config!, notificar_saiu_entrega: e.target.checked })}
                        className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                      />
                      <Label htmlFor="notificar_saiu_entrega" className="cursor-pointer">
                        Saiu para entrega
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="notificar_entregue"
                        checked={config?.notificar_entregue || false}
                        onChange={(e) => setConfig({ ...config!, notificar_entregue: e.target.checked })}
                        className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                      />
                      <Label htmlFor="notificar_entregue" className="cursor-pointer">
                        Pedido entregue
                      </Label>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleSaveConfig}
                  className="w-full bg-red-600 hover:bg-red-700"
                >
                  Salvar Configuração
                </Button>
              </CardContent>
            </Card>

            {/* Teste de Envio */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageCircle className="h-5 w-5 text-red-600" />
                  <span>Enviar Mensagem de Teste</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="test_phone">Telefone</Label>
                  <Input
                    id="test_phone"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="test_message">Mensagem</Label>
                  <Textarea
                    id="test_message"
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    placeholder="Digite sua mensagem de teste..."
                    rows={4}
                  />
                </div>

                <Button
                  onClick={handleSendTest}
                  disabled={sending}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {sending ? "Enviando..." : "Enviar Teste"}
                </Button>
              </CardContent>
            </Card>

            {/* Histórico */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-red-600" />
                  <span>Histórico de Envios</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {historico.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Nenhuma notificação enviada ainda
                  </div>
                ) : (
                  <div className="space-y-3">
                    {historico.map((notificacao) => (
                      <div
                        key={notificacao.id}
                        className="flex items-start justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-gray-900">
                              {notificacao.telefone}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {getTipoLabel(notificacao.tipo)}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {notificacao.mensagem}
                          </p>
                          <p className="text-xs text-gray-400">
                            {formatDateTime(notificacao.criado_em)}
                          </p>
                        </div>
                        <div className="ml-4">
                          {getStatusBadge(notificacao.status)}
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
                  <MessageCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-semibold text-blue-900 mb-1">
                      💡 Sobre as Notificações
                    </h3>
                    <p className="text-sm text-blue-700 mb-2">
                      As notificações são enviadas automaticamente quando os eventos
                      selecionados ocorrem. Configure sua API do WhatsApp Business ou
                      use um serviço de terceiros como Twilio, MessageBird ou Evolution API.
                    </p>
                    <p className="text-sm text-blue-700">
                      <strong>Importante:</strong> Certifique-se de que sua API está
                      configurada corretamente antes de ativar as notificações automáticas.
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
