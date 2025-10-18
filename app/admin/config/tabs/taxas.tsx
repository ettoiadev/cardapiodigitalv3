"use client"

import { useEffect, useState } from "react"
// AdminLayout removido - componente será usado dentro de uma aba
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { Plus, Search, Edit, Trash2, MapPin, DollarSign, Clock } from "lucide-react"
import { TaxaFormModal } from "@/components/taxas/taxa-form-modal"
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

interface Taxa {
  id: string
  bairro: string
  cep_inicial?: string
  cep_final?: string
  taxa: number
  tempo_estimado_min: number
  tempo_estimado_max: number
  ativo: boolean
  criado_em: string
}

export default function TaxasTab() {
  const [taxas, setTaxas] = useState<Taxa[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedTaxa, setSelectedTaxa] = useState<Taxa | null>(null)
  const [taxaToDelete, setTaxaToDelete] = useState<string | null>(null)
  const [stats, setStats] = useState({
    total: 0,
    ativas: 0,
    inativas: 0,
    taxaMedia: 0,
  })

  useEffect(() => {
    loadTaxas()
  }, [])

  const loadTaxas = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("taxas_entrega")
        .select("*")
        .order("bairro", { ascending: true })

      if (error) throw error

      setTaxas(data || [])
      
      // Calcular estatísticas
      const total = data?.length || 0
      const ativas = data?.filter(t => t.ativo).length || 0
      const inativas = total - ativas
      const taxaMedia = data?.length 
        ? data.reduce((sum, t) => sum + Number(t.taxa), 0) / data.length 
        : 0
      
      setStats({ total, ativas, inativas, taxaMedia })
    } catch (error) {
      console.error("Erro ao carregar taxas:", error)
      toast.error("Erro ao carregar taxas de entrega")
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (taxa: Taxa) => {
    setSelectedTaxa(taxa)
    setIsFormOpen(true)
  }

  const handleNew = () => {
    setSelectedTaxa(null)
    setIsFormOpen(true)
  }

  const handleDelete = async () => {
    if (!taxaToDelete) return

    try {
      const { error } = await supabase
        .from("taxas_entrega")
        .delete()
        .eq("id", taxaToDelete)

      if (error) throw error

      toast.success("Taxa excluída com sucesso")
      loadTaxas()
    } catch (error) {
      console.error("Erro ao excluir taxa:", error)
      toast.error("Erro ao excluir taxa")
    } finally {
      setTaxaToDelete(null)
    }
  }

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("taxas_entrega")
        .update({ ativo: !currentStatus })
        .eq("id", id)

      if (error) throw error

      toast.success(`Taxa ${!currentStatus ? "ativada" : "desativada"} com sucesso`)
      loadTaxas()
    } catch (error) {
      console.error("Erro ao atualizar status:", error)
      toast.error("Erro ao atualizar status da taxa")
    }
  }

  const filteredTaxas = taxas.filter(taxa => {
    const searchLower = searchTerm.toLowerCase()
    return (
      taxa.bairro.toLowerCase().includes(searchLower) ||
      taxa.cep_inicial?.includes(searchTerm) ||
      taxa.cep_final?.includes(searchTerm)
    )
  })

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const formatCep = (cep?: string) => {
    if (!cep) return "-"
    const cleaned = cep.replace(/\D/g, "")
    if (cleaned.length === 8) {
      return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`
    }
    return cep
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Taxas de Entrega por Bairro</h2>
            <p className="text-gray-600 mt-1">Gerencie as taxas de entrega por bairro e CEP</p>
          </div>
          <Button onClick={handleNew} className="bg-red-600 hover:bg-red-700">
            <Plus className="h-4 w-4 mr-2" />
            Nova Taxa
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total de Áreas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Áreas Ativas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.ativas}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Áreas Inativas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-400">{stats.inativas}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Taxa Média
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {formatCurrency(stats.taxaMedia)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por bairro ou CEP..."
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
              <div className="text-center py-8 text-gray-500">Carregando taxas...</div>
            ) : filteredTaxas.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? "Nenhuma taxa encontrada" : "Nenhuma taxa cadastrada"}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bairro</TableHead>
                      <TableHead>Faixa de CEP</TableHead>
                      <TableHead>Taxa</TableHead>
                      <TableHead>Tempo Estimado</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTaxas.map((taxa) => (
                      <TableRow key={taxa.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0 h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
                              <MapPin className="h-5 w-5 text-red-600" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{taxa.bairro}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-600">
                            {taxa.cep_inicial && taxa.cep_final ? (
                              <>
                                {formatCep(taxa.cep_inicial)} até {formatCep(taxa.cep_final)}
                              </>
                            ) : (
                              <span className="text-gray-400">Não especificado</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-gray-900 font-semibold">
                            <DollarSign className="h-4 w-4 mr-1 text-green-600" />
                            {formatCurrency(taxa.taxa)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-gray-600">
                            <Clock className="h-4 w-4 mr-2" />
                            {taxa.tempo_estimado_min} - {taxa.tempo_estimado_max} min
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={taxa.ativo ? "default" : "secondary"}
                            className={taxa.ativo ? "bg-green-100 text-green-800" : ""}
                          >
                            {taxa.ativo ? "Ativa" : "Inativa"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(taxa)}
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setTaxaToDelete(taxa.id)}
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

        {/* Info Card */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <MapPin className="h-5 w-5 text-blue-600 mt-0.5" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-blue-900 mb-1">
                  Como funciona o cálculo de taxa?
                </h3>
                <p className="text-sm text-blue-700">
                  Quando um cliente informa o CEP no checkout, o sistema busca automaticamente
                  a taxa correspondente. Se o CEP estiver dentro de uma faixa cadastrada ou
                  corresponder ao bairro, a taxa será aplicada. Caso contrário, uma mensagem
                  informará que não há entrega para aquela região.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <TaxaFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false)
          setSelectedTaxa(null)
        }}
        taxa={selectedTaxa}
        onSuccess={loadTaxas}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!taxaToDelete} onOpenChange={() => setTaxaToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta taxa? Esta ação não pode ser desfeita.
              Clientes não poderão mais fazer pedidos para esta área.
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
    </>
  )
}
