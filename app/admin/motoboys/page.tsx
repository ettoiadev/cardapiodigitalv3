"use client"

import { useEffect, useState } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { Plus, Search, Edit, Trash2, Bike, Phone, User, TrendingUp } from "lucide-react"
import { MotoboyFormModal } from "@/components/motoboys/motoboy-form-modal"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

interface Motoboy {
  id: string
  nome: string
  telefone: string
  cpf?: string
  placa_moto?: string
  status: string
  ativo: boolean
  criado_em: string
}

interface EntregasCount {
  motoboy_id: string
  total_entregas: number
  entregas_hoje: number
}

export default function MotoboysPage() {
  const [motoboys, setMotoboys] = useState<Motoboy[]>([])
  const [entregasCount, setEntregasCount] = useState<Record<string, EntregasCount>>({})
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedMotoboy, setSelectedMotoboy] = useState<Motoboy | null>(null)
  const [motoboyToDelete, setMotoboyToDelete] = useState<string | null>(null)
  const [stats, setStats] = useState({
    total: 0,
    disponiveis: 0,
    emEntrega: 0,
    inativos: 0,
  })

  useEffect(() => {
    loadMotoboys()
    loadEntregasCount()
  }, [])

  const loadMotoboys = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("motoboys")
        .select("*")
        .order("nome", { ascending: true })

      if (error) throw error

      setMotoboys(data || [])
      
      // Calcular estatísticas
      const total = data?.length || 0
      const disponiveis = data?.filter(m => m.status === 'disponivel' && m.ativo).length || 0
      const emEntrega = data?.filter(m => m.status === 'em_entrega').length || 0
      const inativos = data?.filter(m => !m.ativo || m.status === 'inativo').length || 0
      
      setStats({ total, disponiveis, emEntrega, inativos })
    } catch (error) {
      console.error("Erro ao carregar motoboys:", error)
      toast.error("Erro ao carregar motoboys")
    } finally {
      setLoading(false)
    }
  }

  const loadEntregasCount = async () => {
    try {
      // Buscar total de entregas por motoboy
      const { data: totalData, error: totalError } = await supabase
        .from("entregas")
        .select("motoboy_id")
        .not("motoboy_id", "is", null)

      if (totalError) throw totalError

      // Buscar entregas de hoje
      const hoje = new Date()
      hoje.setHours(0, 0, 0, 0)
      
      const { data: hojeData, error: hojeError } = await supabase
        .from("entregas")
        .select("motoboy_id")
        .not("motoboy_id", "is", null)
        .gte("criado_em", hoje.toISOString())

      if (hojeError) throw hojeError

      // Contar entregas
      const counts: Record<string, EntregasCount> = {}
      
      totalData?.forEach(e => {
        if (!counts[e.motoboy_id]) {
          counts[e.motoboy_id] = { motoboy_id: e.motoboy_id, total_entregas: 0, entregas_hoje: 0 }
        }
        counts[e.motoboy_id].total_entregas++
      })

      hojeData?.forEach(e => {
        if (!counts[e.motoboy_id]) {
          counts[e.motoboy_id] = { motoboy_id: e.motoboy_id, total_entregas: 0, entregas_hoje: 0 }
        }
        counts[e.motoboy_id].entregas_hoje++
      })

      setEntregasCount(counts)
    } catch (error) {
      console.error("Erro ao carregar contagem de entregas:", error)
    }
  }

  const handleEdit = (motoboy: Motoboy) => {
    setSelectedMotoboy(motoboy)
    setIsFormOpen(true)
  }

  const handleNew = () => {
    setSelectedMotoboy(null)
    setIsFormOpen(true)
  }

  const handleDelete = async () => {
    if (!motoboyToDelete) return

    try {
      const { error } = await supabase
        .from("motoboys")
        .delete()
        .eq("id", motoboyToDelete)

      if (error) throw error

      toast.success("Motoboy excluído com sucesso")
      loadMotoboys()
    } catch (error) {
      console.error("Erro ao excluir motoboy:", error)
      toast.error("Erro ao excluir motoboy")
    } finally {
      setMotoboyToDelete(null)
    }
  }

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("motoboys")
        .update({ ativo: !currentStatus })
        .eq("id", id)

      if (error) throw error

      toast.success(`Motoboy ${!currentStatus ? "ativado" : "desativado"} com sucesso`)
      loadMotoboys()
    } catch (error) {
      console.error("Erro ao atualizar status:", error)
      toast.error("Erro ao atualizar status do motoboy")
    }
  }

  const filteredMotoboys = motoboys.filter(motoboy => {
    const searchLower = searchTerm.toLowerCase()
    return (
      motoboy.nome.toLowerCase().includes(searchLower) ||
      motoboy.telefone.includes(searchTerm) ||
      motoboy.cpf?.includes(searchTerm) ||
      motoboy.placa_moto?.toLowerCase().includes(searchLower)
    )
  })

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "")
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`
    }
    return phone
  }

  const getStatusBadge = (status: string, ativo: boolean) => {
    if (!ativo) {
      return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Inativo</Badge>
    }

    const statusMap: Record<string, { label: string; className: string }> = {
      disponivel: { label: "Disponível", className: "bg-green-100 text-green-800" },
      em_entrega: { label: "Em Entrega", className: "bg-blue-100 text-blue-800" },
      inativo: { label: "Inativo", className: "bg-gray-100 text-gray-800" },
    }

    const statusInfo = statusMap[status] || { label: status, className: "" }

    return (
      <Badge variant="secondary" className={statusInfo.className}>
        {statusInfo.label}
      </Badge>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Motoboys</h1>
            <p className="text-gray-600 mt-1">Gerencie os entregadores</p>
          </div>
          <Button onClick={handleNew} className="bg-red-600 hover:bg-red-700">
            <Plus className="h-4 w-4 mr-2" />
            Novo Motoboy
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total de Motoboys
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Disponíveis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.disponiveis}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Em Entrega
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats.emEntrega}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Inativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-400">{stats.inativos}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome, telefone, CPF ou placa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <div className="text-center py-8 text-gray-500">Carregando motoboys...</div>
            ) : filteredMotoboys.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? "Nenhum motoboy encontrado" : "Nenhum motoboy cadastrado"}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Motoboy</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Placa</TableHead>
                      <TableHead>Entregas</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMotoboys.map((motoboy) => {
                      const entregas = entregasCount[motoboy.id] || { total_entregas: 0, entregas_hoje: 0 }
                      
                      return (
                        <TableRow key={motoboy.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0 h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
                                <Bike className="h-5 w-5 text-red-600" />
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">{motoboy.nome}</div>
                                {motoboy.cpf && (
                                  <div className="text-sm text-gray-500">CPF: {motoboy.cpf}</div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center text-gray-600">
                              <Phone className="h-4 w-4 mr-2" />
                              {formatPhone(motoboy.telefone)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm font-mono text-gray-900">
                              {motoboy.placa_moto || "-"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center text-sm text-gray-900">
                                <TrendingUp className="h-4 w-4 mr-1 text-blue-600" />
                                <span className="font-semibold">{entregas.total_entregas}</span>
                                <span className="ml-1 text-gray-500">total</span>
                              </div>
                              {entregas.entregas_hoje > 0 && (
                                <div className="text-xs text-green-600">
                                  {entregas.entregas_hoje} hoje
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(motoboy.status, motoboy.ativo)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(motoboy)}
                                title="Editar"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setMotoboyToDelete(motoboy.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                title="Excluir"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <MotoboyFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false)
          setSelectedMotoboy(null)
        }}
        motoboy={selectedMotoboy}
        onSuccess={() => {
          loadMotoboys()
          loadEntregasCount()
        }}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!motoboyToDelete} onOpenChange={() => setMotoboyToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este motoboy? Esta ação não pode ser desfeita.
              As entregas já realizadas serão mantidas no histórico.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  )
}
