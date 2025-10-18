"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { supabase } from "@/lib/supabase"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ShoppingBag, Calendar, DollarSign, MapPin, Clock } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Cliente {
  id: string
  nome: string
  telefone: string
}

interface Pedido {
  id: string
  created_at: string
  tipo_entrega: string
  endereco_entrega?: string
  forma_pagamento?: string
  total: number
  status: string
  observacoes?: string
}

interface ClienteHistoricoModalProps {
  isOpen: boolean
  onClose: () => void
  cliente: Cliente | null
}

export function ClienteHistoricoModal({ isOpen, onClose, cliente }: ClienteHistoricoModalProps) {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({
    totalPedidos: 0,
    totalGasto: 0,
    ultimoPedido: null as string | null,
  })

  useEffect(() => {
    if (isOpen && cliente) {
      loadPedidos()
    }
  }, [isOpen, cliente])

  const loadPedidos = async () => {
    if (!cliente) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("pedidos")
        .select("*")
        .eq("cliente_id", cliente.id)
        .order("created_at", { ascending: false })

      if (error) throw error

      setPedidos(data || [])

      // Calcular estatísticas
      const totalPedidos = data?.length || 0
      const totalGasto = data?.reduce((sum, p) => sum + Number(p.total), 0) || 0
      const ultimoPedido = data?.[0]?.created_at || null

      setStats({ totalPedidos, totalGasto, ultimoPedido })
    } catch (error) {
      console.error("Erro ao carregar histórico:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      pendente: { label: "Pendente", className: "bg-yellow-100 text-yellow-800" },
      confirmado: { label: "Confirmado", className: "bg-blue-100 text-blue-800" },
      preparando: { label: "Preparando", className: "bg-purple-100 text-purple-800" },
      saiu_entrega: { label: "Saiu para entrega", className: "bg-orange-100 text-orange-800" },
      entregue: { label: "Entregue", className: "bg-green-100 text-green-800" },
      cancelado: { label: "Cancelado", className: "bg-red-100 text-red-800" },
    }

    const statusInfo = statusMap[status] || { label: status, className: "" }

    return (
      <Badge variant="secondary" className={statusInfo.className}>
        {statusInfo.label}
      </Badge>
    )
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const formatDate = (date: string) => {
    try {
      return format(new Date(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
    } catch {
      return date
    }
  }

  if (!cliente) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Histórico de Pedidos - {cliente.nome}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <ShoppingBag className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total de Pedidos</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalPedidos}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <DollarSign className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Gasto</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(stats.totalGasto)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Último Pedido</p>
                    <p className="text-sm font-medium text-gray-900">
                      {stats.ultimoPedido
                        ? format(new Date(stats.ultimoPedido), "dd/MM/yyyy", { locale: ptBR })
                        : "Nunca"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pedidos List */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Pedidos Realizados</h3>

            {loading ? (
              <div className="text-center py-8 text-gray-500">Carregando histórico...</div>
            ) : pedidos.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Nenhum pedido encontrado para este cliente
              </div>
            ) : (
              <div className="space-y-3">
                {pedidos.map((pedido) => (
                  <Card key={pedido.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Clock className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-600">
                                {formatDate(pedido.created_at)}
                              </span>
                            </div>
                            {getStatusBadge(pedido.status)}
                          </div>

                          <div className="flex items-center space-x-4 text-sm">
                            <div className="flex items-center space-x-1">
                              <MapPin className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-600">
                                {pedido.tipo_entrega === "entrega" ? "Entrega" : "Retirada"}
                              </span>
                            </div>
                            {pedido.forma_pagamento && (
                              <div className="flex items-center space-x-1">
                                <DollarSign className="h-4 w-4 text-gray-400" />
                                <span className="text-gray-600 capitalize">
                                  {pedido.forma_pagamento}
                                </span>
                              </div>
                            )}
                          </div>

                          {pedido.endereco_entrega && (
                            <p className="text-sm text-gray-500 line-clamp-1">
                              {pedido.endereco_entrega}
                            </p>
                          )}

                          {pedido.observacoes && (
                            <p className="text-sm text-gray-500 italic line-clamp-2">
                              Obs: {pedido.observacoes}
                            </p>
                          )}
                        </div>

                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-900">
                            {formatCurrency(pedido.total)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
