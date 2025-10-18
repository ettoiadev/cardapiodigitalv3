"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Package, 
  Search, 
  Clock, 
  MapPin, 
  DollarSign, 
  ChevronRight,
  Loader2,
  ShoppingBag,
  Home
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { getUser } from "@/lib/auth-helpers"
import { formatCurrency } from "@/lib/currency-utils"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Pedido {
  id: string
  numero_pedido: string
  status: string
  tipo_entrega: string
  endereco_bairro?: string
  forma_pagamento: string
  total: number
  created_at: string
  itens_count?: number
}

export default function MeusPedidosPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [filteredPedidos, setFilteredPedidos] = useState<Pedido[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("todos")

  useEffect(() => {
    loadPedidos()
  }, [])

  useEffect(() => {
    filterPedidos()
  }, [searchTerm, filterStatus, pedidos])

  const loadPedidos = async () => {
    try {
      setLoading(true)

      // Obter usuário atual
      const { user } = await getUser()
      if (!user) {
        router.push("/login?returnUrl=/meus-pedidos")
        return
      }

      // Buscar pedidos do cliente
      const { data, error } = await supabase
        .from("pedidos")
        .select(`
          id,
          numero_pedido,
          status,
          tipo_entrega,
          endereco_bairro,
          forma_pagamento,
          total,
          created_at
        `)
        .eq("cliente_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error

      // Buscar contagem de itens para cada pedido
      const pedidosComItens = await Promise.all(
        (data || []).map(async (pedido) => {
          const { count } = await supabase
            .from("pedido_itens")
            .select("*", { count: "exact", head: true })
            .eq("pedido_id", pedido.id)

          return {
            ...pedido,
            itens_count: count || 0
          }
        })
      )

      setPedidos(pedidosComItens)
      setFilteredPedidos(pedidosComItens)
    } catch (error) {
      console.error("Erro ao carregar pedidos:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterPedidos = () => {
    let filtered = [...pedidos]

    // Filtrar por status
    if (filterStatus !== "todos") {
      filtered = filtered.filter(p => p.status === filterStatus)
    }

    // Filtrar por busca
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.numero_pedido.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.endereco_bairro?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredPedidos(filtered)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pendente":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "confirmado":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "em_preparo":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "saiu_entrega":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "entregue":
        return "bg-green-100 text-green-800 border-green-200"
      case "cancelado":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "pendente":
        return "Aguardando"
      case "confirmado":
        return "Confirmado"
      case "em_preparo":
        return "Em Preparo"
      case "saiu_entrega":
        return "Saiu para Entrega"
      case "entregue":
        return "Entregue"
      case "cancelado":
        return "Cancelado"
      default:
        return status
    }
  }

  const getFormaPagamentoText = (forma: string) => {
    switch (forma) {
      case "pix":
        return "PIX"
      case "dinheiro":
        return "Dinheiro"
      case "debito":
        return "Débito"
      case "credito":
        return "Crédito"
      case "ticket_alimentacao":
        return "Ticket"
      default:
        return forma
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-red-600 mx-auto" />
          <p className="mt-4 text-gray-600">Carregando pedidos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <Home className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Meus Pedidos</h1>
                <p className="text-sm text-gray-600">
                  {pedidos.length} {pedidos.length === 1 ? "pedido" : "pedidos"}
                </p>
              </div>
            </div>
          </div>

          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por número ou bairro..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filtros de Status */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
            <Button
              variant={filterStatus === "todos" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("todos")}
              className={filterStatus === "todos" ? "bg-red-600 hover:bg-red-700" : ""}
            >
              Todos
            </Button>
            <Button
              variant={filterStatus === "pendente" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("pendente")}
              className={filterStatus === "pendente" ? "bg-yellow-600 hover:bg-yellow-700" : ""}
            >
              Aguardando
            </Button>
            <Button
              variant={filterStatus === "em_preparo" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("em_preparo")}
              className={filterStatus === "em_preparo" ? "bg-purple-600 hover:bg-purple-700" : ""}
            >
              Em Preparo
            </Button>
            <Button
              variant={filterStatus === "saiu_entrega" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("saiu_entrega")}
              className={filterStatus === "saiu_entrega" ? "bg-orange-600 hover:bg-orange-700" : ""}
            >
              A Caminho
            </Button>
            <Button
              variant={filterStatus === "entregue" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("entregue")}
              className={filterStatus === "entregue" ? "bg-green-600 hover:bg-green-700" : ""}
            >
              Entregue
            </Button>
          </div>
        </div>
      </div>

      {/* Lista de Pedidos */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {filteredPedidos.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || filterStatus !== "todos" 
                  ? "Nenhum pedido encontrado" 
                  : "Você ainda não fez nenhum pedido"}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || filterStatus !== "todos"
                  ? "Tente ajustar os filtros ou busca"
                  : "Que tal fazer seu primeiro pedido?"}
              </p>
              {!searchTerm && filterStatus === "todos" && (
                <Link href="/">
                  <Button className="bg-red-600 hover:bg-red-700">
                    Ver Cardápio
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredPedidos.map((pedido) => (
              <Card 
                key={pedido.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(`/pedido/${pedido.id}/detalhes`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                        <Package className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {pedido.numero_pedido}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {pedido.itens_count} {pedido.itens_count === 1 ? "item" : "itens"}
                        </p>
                      </div>
                    </div>
                    <Badge className={`${getStatusColor(pedido.status)} border`}>
                      {getStatusText(pedido.status)}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>
                        {format(new Date(pedido.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span>
                        {pedido.tipo_entrega === "delivery" 
                          ? `Entrega${pedido.endereco_bairro ? ` - ${pedido.endereco_bairro}` : ""}`
                          : "Retirada no Local"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-2 text-gray-600">
                        <DollarSign className="h-4 w-4" />
                        <span>{getFormaPagamentoText(pedido.forma_pagamento)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-red-600">
                          {formatCurrency(pedido.total)}
                        </span>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
