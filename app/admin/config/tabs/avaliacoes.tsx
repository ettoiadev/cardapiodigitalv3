"use client"

import { useEffect, useState } from "react"
// AdminLayout removido - componente será usado dentro de uma aba
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabase"
import { Star, MessageCircle, TrendingUp, ThumbsUp, ThumbsDown } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"

interface Avaliacao {
  id: string
  pedido_id: string
  cliente_id: string
  nota: number
  comentario?: string
  resposta_admin?: string
  criado_em: string
  respondido_em?: string
  clientes?: {
    nome: string
  }
}

export default function AvaliacoesTab() {
  const [loading, setLoading] = useState(true)
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([])
  const [filtroNota, setFiltroNota] = useState<number | null>(null)
  const [respostaTexto, setRespostaTexto] = useState<Record<string, string>>({})
  const [stats, setStats] = useState({
    total: 0,
    media: 0,
    estrela5: 0,
    estrela4: 0,
    estrela3: 0,
    estrela2: 0,
    estrela1: 0,
    comComentario: 0,
    semResposta: 0,
  })

  useEffect(() => {
    loadAvaliacoes()
  }, [filtroNota])

  const loadAvaliacoes = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from("avaliacoes")
        .select(`
          *,
          clientes (nome)
        `)
        .order("criado_em", { ascending: false })

      if (filtroNota !== null) {
        query = query.eq("nota", filtroNota)
      }

      const { data, error } = await query

      if (error) throw error

      setAvaliacoes(data || [])

      // Calcular estatísticas
      if (!filtroNota) {
        const total = data?.length || 0
        const soma = data?.reduce((acc, a) => acc + a.nota, 0) || 0
        const media = total > 0 ? soma / total : 0
        
        const estrela5 = data?.filter(a => a.nota === 5).length || 0
        const estrela4 = data?.filter(a => a.nota === 4).length || 0
        const estrela3 = data?.filter(a => a.nota === 3).length || 0
        const estrela2 = data?.filter(a => a.nota === 2).length || 0
        const estrela1 = data?.filter(a => a.nota === 1).length || 0
        
        const comComentario = data?.filter(a => a.comentario).length || 0
        const semResposta = data?.filter(a => !a.resposta_admin).length || 0

        setStats({
          total,
          media,
          estrela5,
          estrela4,
          estrela3,
          estrela2,
          estrela1,
          comComentario,
          semResposta,
        })
      }
    } catch (error) {
      console.error("Erro ao carregar avaliações:", error)
      toast.error("Erro ao carregar avaliações")
    } finally {
      setLoading(false)
    }
  }

  const handleResponder = async (avaliacaoId: string) => {
    const resposta = respostaTexto[avaliacaoId]
    
    if (!resposta || !resposta.trim()) {
      toast.error("Digite uma resposta")
      return
    }

    try {
      const { error } = await supabase
        .from("avaliacoes")
        .update({
          resposta_admin: resposta,
          respondido_em: new Date().toISOString(),
        })
        .eq("id", avaliacaoId)

      if (error) throw error

      toast.success("Resposta enviada com sucesso!")
      setRespostaTexto({ ...respostaTexto, [avaliacaoId]: "" })
      loadAvaliacoes()
    } catch (error) {
      console.error("Erro ao responder avaliação:", error)
      toast.error("Erro ao responder avaliação")
    }
  }

  const formatDateTime = (date: string) => {
    try {
      return format(new Date(date), "dd/MM/yyyy HH:mm", { locale: ptBR })
    } catch {
      return "-"
    }
  }

  const renderStars = (nota: number, size: "sm" | "md" | "lg" = "md") => {
    const sizeClasses = {
      sm: "h-3 w-3",
      md: "h-4 w-4",
      lg: "h-5 w-5",
    }

    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClasses[size]} ${
              star <= nota
                ? "text-yellow-500 fill-yellow-500"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    )
  }

  const getNotaBadge = (nota: number) => {
    if (nota >= 4) {
      return <Badge className="bg-green-100 text-green-800">Positiva</Badge>
    } else if (nota === 3) {
      return <Badge className="bg-yellow-100 text-yellow-800">Neutra</Badge>
    } else {
      return <Badge className="bg-red-100 text-red-800">Negativa</Badge>
    }
  }

  return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Avaliações dos Clientes</h2>
          <p className="text-gray-600 mt-1">Gerencie o feedback dos clientes</p>
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
                    Total de Avaliações
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    <span className="text-2xl font-bold text-gray-900">
                      {stats.total}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Média Geral
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <span className="text-2xl font-bold text-green-600">
                      {stats.media.toFixed(1)}
                    </span>
                    {renderStars(Math.round(stats.media), "sm")}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Com Comentário
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <MessageCircle className="h-5 w-5 text-blue-600" />
                    <span className="text-2xl font-bold text-gray-900">
                      {stats.comComentario}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Sem Resposta
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <MessageCircle className="h-5 w-5 text-orange-600" />
                    <span className="text-2xl font-bold text-orange-600">
                      {stats.semResposta}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Distribuição de Notas */}
            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Notas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[5, 4, 3, 2, 1].map((nota) => {
                    const count = stats[`estrela${nota}` as keyof typeof stats] as number
                    const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0

                    return (
                      <div key={nota} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-2">
                            {renderStars(nota, "sm")}
                            <span className="text-gray-600">({count})</span>
                          </div>
                          <span className="font-medium text-gray-900">
                            {percentage.toFixed(0)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-yellow-500 h-2 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Filtros */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">Filtrar por:</span>
                  <Button
                    size="sm"
                    variant={filtroNota === null ? "default" : "outline"}
                    onClick={() => setFiltroNota(null)}
                    className={filtroNota === null ? "bg-red-600 hover:bg-red-700" : ""}
                  >
                    Todas
                  </Button>
                  {[5, 4, 3, 2, 1].map((nota) => (
                    <Button
                      key={nota}
                      size="sm"
                      variant={filtroNota === nota ? "default" : "outline"}
                      onClick={() => setFiltroNota(nota)}
                      className={filtroNota === nota ? "bg-red-600 hover:bg-red-700" : ""}
                    >
                      {nota} ⭐
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Lista de Avaliações */}
            <div className="space-y-4">
              {avaliacoes.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center text-gray-500">
                    Nenhuma avaliação encontrada
                  </CardContent>
                </Card>
              ) : (
                avaliacoes.map((avaliacao) => (
                  <Card key={avaliacao.id}>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <p className="font-semibold text-gray-900">
                                {avaliacao.clientes?.nome || "Cliente"}
                              </p>
                              {getNotaBadge(avaliacao.nota)}
                            </div>
                            {renderStars(avaliacao.nota, "md")}
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDateTime(avaliacao.criado_em)}
                            </p>
                          </div>
                        </div>

                        {/* Comentário */}
                        {avaliacao.comentario && (
                          <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-700">
                              {avaliacao.comentario}
                            </p>
                          </div>
                        )}

                        {/* Resposta do Admin */}
                        {avaliacao.resposta_admin ? (
                          <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                            <p className="text-xs font-semibold text-blue-900 mb-1">
                              Resposta do Administrador
                            </p>
                            <p className="text-sm text-blue-700">
                              {avaliacao.resposta_admin}
                            </p>
                            {avaliacao.respondido_em && (
                              <p className="text-xs text-blue-600 mt-2">
                                Respondido em {formatDateTime(avaliacao.respondido_em)}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Textarea
                              placeholder="Digite sua resposta..."
                              value={respostaTexto[avaliacao.id] || ""}
                              onChange={(e) =>
                                setRespostaTexto({
                                  ...respostaTexto,
                                  [avaliacao.id]: e.target.value,
                                })
                              }
                              rows={3}
                            />
                            <Button
                              onClick={() => handleResponder(avaliacao.id)}
                              className="bg-red-600 hover:bg-red-700"
                              size="sm"
                            >
                              Responder
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Info Card */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-3">
                  <Star className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-semibold text-blue-900 mb-1">
                      💡 Sobre as Avaliações
                    </h3>
                    <p className="text-sm text-blue-700 mb-2">
                      As avaliações são coletadas após a conclusão do pedido. Clientes podem
                      avaliar de 1 a 5 estrelas e deixar comentários opcionais.
                    </p>
                    <p className="text-sm text-blue-700">
                      <strong>Dica:</strong> Responda todas as avaliações, especialmente as
                      negativas. Isso mostra que você se importa com o feedback dos clientes
                      e está sempre buscando melhorar.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
  )
}
