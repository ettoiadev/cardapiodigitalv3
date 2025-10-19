"use client"

import { useEffect, useState } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { Plus, Search, Edit, Trash2, Eye, Phone, MapPin, User } from "lucide-react"
import { ClienteFormModal } from "@/components/clientes/cliente-form-modal"
import { ClienteHistoricoModal } from "@/components/clientes/cliente-historico-modal"
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

interface Cliente {
  id: string
  codigo_cliente: string
  nome: string
  telefone: string
  email?: string
  endereco_rua?: string
  endereco_numero?: string
  endereco_complemento?: string
  endereco_bairro?: string
  endereco_cep?: string
  endereco_referencia?: string
  ativo: boolean
  criado_em: string
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isHistoricoOpen, setIsHistoricoOpen] = useState(false)
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null)
  const [clienteToDelete, setClienteToDelete] = useState<string | null>(null)
  const [stats, setStats] = useState({
    total: 0,
    ativos: 0,
    inativos: 0,
  })

  useEffect(() => {
    loadClientes()
  }, [])

  const loadClientes = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("clientes")
        .select("*")
        .order("criado_em", { ascending: false })

      if (error) throw error

      setClientes(data || [])
      
      // Calcular estatísticas
      const total = data?.length || 0
      const ativos = data?.filter(c => c.ativo).length || 0
      const inativos = total - ativos
      
      setStats({ total, ativos, inativos })
    } catch (error) {
      console.error("Erro ao carregar clientes:", error)
      toast.error("Erro ao carregar clientes")
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (cliente: Cliente) => {
    setSelectedCliente(cliente)
    setIsFormOpen(true)
  }

  const handleNew = () => {
    setSelectedCliente(null)
    setIsFormOpen(true)
  }

  const handleViewHistorico = (cliente: Cliente) => {
    setSelectedCliente(cliente)
    setIsHistoricoOpen(true)
  }

  const handleDelete = async () => {
    if (!clienteToDelete) return

    try {
      const { error } = await supabase
        .from("clientes")
        .delete()
        .eq("id", clienteToDelete)

      if (error) throw error

      toast.success("Cliente excluído com sucesso")
      loadClientes()
    } catch (error) {
      console.error("Erro ao excluir cliente:", error)
      toast.error("Erro ao excluir cliente")
    } finally {
      setClienteToDelete(null)
    }
  }

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("clientes")
        .update({ ativo: !currentStatus })
        .eq("id", id)

      if (error) throw error

      toast.success(`Cliente ${!currentStatus ? "ativado" : "desativado"} com sucesso`)
      loadClientes()
    } catch (error) {
      console.error("Erro ao atualizar status:", error)
      toast.error("Erro ao atualizar status do cliente")
    }
  }

  const filteredClientes = clientes.filter(cliente => {
    const searchLower = searchTerm.toLowerCase()
    return (
      cliente.codigo_cliente.includes(searchTerm) ||
      cliente.nome.toLowerCase().includes(searchLower) ||
      cliente.telefone.includes(searchTerm) ||
      cliente.email?.toLowerCase().includes(searchLower) ||
      cliente.endereco_bairro?.toLowerCase().includes(searchLower)
    )
  })

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "")
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`
    }
    return phone
  }

  const formatAddress = (cliente: Cliente) => {
    const parts = []
    if (cliente.endereco_rua) parts.push(cliente.endereco_rua)
    if (cliente.endereco_numero) parts.push(cliente.endereco_numero)
    if (cliente.endereco_bairro) parts.push(cliente.endereco_bairro)
    return parts.join(", ") || "Não informado"
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
            <p className="text-gray-600 mt-1">Gerencie o cadastro de clientes</p>
          </div>
          <Button onClick={handleNew} className="bg-red-600 hover:bg-red-700">
            <Plus className="h-4 w-4 mr-2" />
            Novo Cliente
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total de Clientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Clientes Ativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.ativos}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Clientes Inativos
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
                placeholder="Buscar por código, nome, telefone, email ou bairro..."
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
              <div className="text-center py-8 text-gray-500">Carregando clientes...</div>
            ) : filteredClientes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Endereço</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClientes.map((cliente) => (
                      <TableRow key={cliente.id}>
                        <TableCell>
                          <div className="font-mono font-bold text-red-600">
                            {cliente.codigo_cliente}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0 h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
                              <User className="h-5 w-5 text-red-600" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{cliente.nome}</div>
                              {cliente.email && (
                                <div className="text-sm text-gray-500">{cliente.email}</div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-gray-600">
                            <Phone className="h-4 w-4 mr-2" />
                            {formatPhone(cliente.telefone)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-start text-gray-600 max-w-xs">
                            <MapPin className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{formatAddress(cliente)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={cliente.ativo ? "default" : "secondary"}
                            className={cliente.ativo ? "bg-green-100 text-green-800" : ""}
                          >
                            {cliente.ativo ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewHistorico(cliente)}
                              title="Ver histórico"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(cliente)}
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setClienteToDelete(cliente.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Excluir"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <ClienteFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false)
          setSelectedCliente(null)
        }}
        cliente={selectedCliente}
        onSuccess={loadClientes}
      />

      <ClienteHistoricoModal
        isOpen={isHistoricoOpen}
        onClose={() => {
          setIsHistoricoOpen(false)
          setSelectedCliente(null)
        }}
        cliente={selectedCliente}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!clienteToDelete} onOpenChange={() => setClienteToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.
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
