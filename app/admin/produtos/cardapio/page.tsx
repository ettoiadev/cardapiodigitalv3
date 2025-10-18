"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { AdminLayout } from "@/components/admin-layout"
import { supabase } from "@/lib/supabase"
import { 
  Plus, 
  Edit, 
  Trash2, 
  Settings, 
  Tag, 
  Pizza, 
  Layers,
  CheckCircle2,
  XCircle,
  ArrowUpDown,
  ChefHat
} from "lucide-react"

interface Categoria {
  id: string
  nome: string
  descricao: string | null
  ordem: number
  ativo: boolean
}

interface TamanhoPizza {
  id: string
  nome: string
  fatias: number
  descricao: string | null
  ordem: number
  ativo: boolean
}

interface OpcaoSabor {
  id: string
  nome: string
  maximo_sabores: number
  descricao: string | null
  ordem: number
  ativo: boolean
}

export default function AdminCardapioPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [tamanhosPizza, setTamanhosPizza] = useState<TamanhoPizza[]>([])
  const [opcoesSabores, setOpcoesSabores] = useState<OpcaoSabor[]>([])
  const [activeTab, setActiveTab] = useState("categorias")

  // Estados para modais
  const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(null)
  const [editingTamanho, setEditingTamanho] = useState<TamanhoPizza | null>(null)
  const [editingOpcao, setEditingOpcao] = useState<OpcaoSabor | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [categoriasRes, tamanhosRes, opcoesRes] = await Promise.all([
        supabase.from("categorias").select("*").order("ordem"),
        supabase.from("tamanhos_pizza").select("*").order("ordem"),
        supabase.from("opcoes_sabores").select("*").order("ordem"),
      ])

      if (categoriasRes.data) setCategorias(categoriasRes.data)
      if (tamanhosRes.data) setTamanhosPizza(tamanhosRes.data)
      if (opcoesRes.data) setOpcoesSabores(opcoesRes.data)
    } catch (error) {
      console.error("❌ Erro ao carregar dados de configuração:", error)
      console.error("   Verifique a conexão com o banco de dados")
      // Manter arrays vazios - funcionalidade será limitada até resolver conexão
    }
  }

  // Funcoes para categorias
  const handleSaveCategoria = async (categoria: Partial<Categoria>) => {
    try {
      if (editingCategoria?.id) {
        const { error } = await supabase.from("categorias").update(categoria).eq("id", editingCategoria.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from("categorias").insert(categoria)
        if (error) throw error
      }
      loadData()
      setIsDialogOpen(false)
      setEditingCategoria(null)
    } catch (error) {
      console.error("Erro ao salvar categoria:", error)
    }
  }

  const handleDeleteCategoria = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta categoria?")) {
      try {
        const { error } = await supabase.from("categorias").delete().eq("id", id)
        if (error) throw error
        loadData()
      } catch (error) {
        console.error("Erro ao excluir categoria:", error)
      }
    }
  }

  // Funcoes para tamanhos de pizza
  const handleSaveTamanho = async (tamanho: Partial<TamanhoPizza>) => {
    try {
      if (editingTamanho?.id) {
        const { error } = await supabase.from("tamanhos_pizza").update(tamanho).eq("id", editingTamanho.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from("tamanhos_pizza").insert(tamanho)
        if (error) throw error
      }
      loadData()
      setIsDialogOpen(false)
      setEditingTamanho(null)
    } catch (error) {
      console.error("Erro ao salvar tamanho:", error)
    }
  }

  const handleDeleteTamanho = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este tamanho?")) {
      try {
        const { error } = await supabase.from("tamanhos_pizza").delete().eq("id", id)
        if (error) throw error
        loadData()
      } catch (error) {
        console.error("Erro ao excluir tamanho:", error)
      }
    }
  }

  // Funcoes para opcoes de sabores
  const handleSaveOpcao = async (opcao: Partial<OpcaoSabor>) => {
    try {
      if (editingOpcao?.id) {
        const { error } = await supabase.from("opcoes_sabores").update(opcao).eq("id", editingOpcao.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from("opcoes_sabores").insert(opcao)
        if (error) throw error
      }
      loadData()
      setIsDialogOpen(false)
      setEditingOpcao(null)
    } catch (error) {
      console.error("Erro ao salvar opcao:", error)
    }
  }

  const handleDeleteOpcao = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta opcao?")) {
      try {
        const { error } = await supabase.from("opcoes_sabores").delete().eq("id", id)
        if (error) throw error
        loadData()
      } catch (error) {
        console.error("Erro ao excluir opcao:", error)
      }
    }
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-8 border border-indigo-100 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <ChefHat className="h-8 w-8 text-indigo-600" />
                Gerenciar Itens de Cardápio
              </h1>
              <p className="text-gray-600 max-w-2xl">
                Configure categorias, tamanhos de pizza e opções de sabores para personalizar completamente seu cardápio.
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-indigo-600 bg-indigo-100 px-4 py-2 rounded-lg">
              <Settings className="h-4 w-4" />
              Configurações Avançadas
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="mb-8">
            <TabsList className="grid w-full grid-cols-3 bg-gray-100 p-1 rounded-xl h-14">
              <TabsTrigger 
                value="categorias" 
                className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm h-12"
              >
                <Tag className="h-4 w-4" />
                Categorias
              </TabsTrigger>
              <TabsTrigger 
                value="tamanhos" 
                className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm h-12"
              >
                <Pizza className="h-4 w-4" />
                Tamanhos de Pizza
              </TabsTrigger>
              <TabsTrigger 
                value="sabores" 
                className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm h-12"
              >
                <Layers className="h-4 w-4" />
                Opções de Sabores
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="categorias">
            <Card className="shadow-lg border-0 bg-white rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100 p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Tag className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-semibold text-gray-900">
                        Gerenciar Categorias
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        Organize produtos por categorias para facilitar a navegação
                      </p>
                    </div>
                  </div>
                  <Dialog open={isDialogOpen && activeTab === "categorias"} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        onClick={() => {
                          setEditingCategoria(null)
                          setIsDialogOpen(true)
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Nova Categoria
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{editingCategoria ? "Editar Categoria" : "Nova Categoria"}</DialogTitle>
                      </DialogHeader>
                      <CategoriaForm
                        categoria={editingCategoria}
                        onSave={handleSaveCategoria}
                        onCancel={() => setIsDialogOpen(false)}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {categorias.map((categoria) => (
                    <Card key={categoria.id} className="shadow-md border-0 bg-gradient-to-br from-white to-gray-50 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
                      <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-100 p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                              <Tag className="h-4 w-4 text-green-600" />
                            </div>
                            <CardTitle className="text-lg font-semibold text-gray-900">{categoria.nome}</CardTitle>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-blue-50 text-blue-600"
                              onClick={() => {
                                setEditingCategoria(categoria)
                                setIsDialogOpen(true)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-red-50 text-red-600"
                              onClick={() => handleDeleteCategoria(categoria.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4">
                        {categoria.descricao && (
                          <p className="text-sm text-gray-600 mb-4 leading-relaxed">{categoria.descricao}</p>
                        )}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-600 flex items-center gap-2">
                              <ArrowUpDown className="h-3 w-3" />
                              Ordem
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {categoria.ordem}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-600">Status</span>
                            {categoria.ativo ? (
                              <Badge className="bg-green-100 text-green-800 text-xs">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Ativo
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-red-100 text-red-800 text-xs">
                                <XCircle className="h-3 w-3 mr-1" />
                                Inativo
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tamanhos">
            <Card className="shadow-lg border-0 bg-white rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100 p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Pizza className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-semibold text-gray-900">
                        Gerenciar Tamanhos de Pizza
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        Configure os diferentes tamanhos disponíveis para as pizzas
                      </p>
                    </div>
                  </div>
                  <Dialog open={isDialogOpen && activeTab === "tamanhos"} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        onClick={() => {
                          setEditingTamanho(null)
                          setIsDialogOpen(true)
                        }}
                        className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-xl"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Novo Tamanho
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{editingTamanho ? "Editar Tamanho" : "Novo Tamanho"}</DialogTitle>
                      </DialogHeader>
                      <TamanhoForm
                        tamanho={editingTamanho}
                        onSave={handleSaveTamanho}
                        onCancel={() => setIsDialogOpen(false)}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {tamanhosPizza.map((tamanho) => (
                    <Card key={tamanho.id} className="shadow-md border-0 bg-gradient-to-br from-white to-gray-50 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
                      <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-100 p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-100 rounded-lg">
                              <Pizza className="h-4 w-4 text-orange-600" />
                            </div>
                            <CardTitle className="text-lg font-semibold text-gray-900">{tamanho.nome}</CardTitle>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-blue-50 text-blue-600"
                              onClick={() => {
                                setEditingTamanho(tamanho)
                                setIsDialogOpen(true)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-red-50 text-red-600"
                              onClick={() => handleDeleteTamanho(tamanho.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4">
                        {tamanho.descricao && (
                          <p className="text-sm text-gray-600 mb-4 leading-relaxed">{tamanho.descricao}</p>
                        )}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-2 bg-orange-50 rounded-lg">
                            <span className="text-sm text-orange-600 flex items-center gap-2">
                              🍕 Fatias
                            </span>
                            <Badge className="bg-orange-100 text-orange-800 text-xs">
                              {tamanho.fatias}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-600 flex items-center gap-2">
                              <ArrowUpDown className="h-3 w-3" />
                              Ordem
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {tamanho.ordem}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-600">Status</span>
                            {tamanho.ativo ? (
                              <Badge className="bg-green-100 text-green-800 text-xs">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Ativo
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-red-100 text-red-800 text-xs">
                                <XCircle className="h-3 w-3 mr-1" />
                                Inativo
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sabores">
            <Card className="shadow-lg border-0 bg-white rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 border-b border-purple-100 p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Layers className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-semibold text-gray-900">
                        Gerenciar Opções de Sabores
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        Configure quantos sabores podem ser escolhidos por pizza
                      </p>
                    </div>
                  </div>
                  <Dialog open={isDialogOpen && activeTab === "sabores"} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        onClick={() => {
                          setEditingOpcao(null)
                          setIsDialogOpen(true)
                        }}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Nova Opção
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{editingOpcao ? "Editar Opção" : "Nova Opção"}</DialogTitle>
                      </DialogHeader>
                      <OpcaoSaborForm
                        opcao={editingOpcao}
                        onSave={handleSaveOpcao}
                        onCancel={() => setIsDialogOpen(false)}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {opcoesSabores.map((opcao) => (
                    <Card key={opcao.id} className="shadow-md border-0 bg-gradient-to-br from-white to-gray-50 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
                      <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-100 p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                              <Layers className="h-4 w-4 text-purple-600" />
                            </div>
                            <CardTitle className="text-lg font-semibold text-gray-900">{opcao.nome}</CardTitle>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-blue-50 text-blue-600"
                              onClick={() => {
                                setEditingOpcao(opcao)
                                setIsDialogOpen(true)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-red-50 text-red-600"
                              onClick={() => handleDeleteOpcao(opcao.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4">
                        {opcao.descricao && (
                          <p className="text-sm text-gray-600 mb-4 leading-relaxed">{opcao.descricao}</p>
                        )}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-2 bg-purple-50 rounded-lg">
                            <span className="text-sm text-purple-600 flex items-center gap-2">
                              🍕 Máximo de sabores
                            </span>
                            <Badge className="bg-purple-100 text-purple-800 text-xs">
                              {opcao.maximo_sabores}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-600 flex items-center gap-2">
                              <ArrowUpDown className="h-3 w-3" />
                              Ordem
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {opcao.ordem}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-600">Status</span>
                            {opcao.ativo ? (
                              <Badge className="bg-green-100 text-green-800 text-xs">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Ativo
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-red-100 text-red-800 text-xs">
                                <XCircle className="h-3 w-3 mr-1" />
                                Inativo
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  )
}

function CategoriaForm({
  categoria,
  onSave,
  onCancel,
}: {
  categoria: Categoria | null
  onSave: (categoria: Partial<Categoria>) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    nome: categoria?.nome || "",
    descricao: categoria?.descricao || "",
    ordem: categoria?.ordem || 0,
    ativo: categoria?.ativo ?? true,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="nome">Nome da Categoria</Label>
        <Input
          id="nome"
          value={formData.nome}
          onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="descricao">Descricao</Label>
        <Textarea
          id="descricao"
          value={formData.descricao}
          onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="ordem">Ordem</Label>
          <Input
            id="ordem"
            type="number"
            value={formData.ordem}
            onChange={(e) => setFormData({ ...formData, ordem: parseInt(e.target.value) || 0 })}
          />
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="ativo"
            checked={formData.ativo}
            onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
          />
          <Label htmlFor="ativo">Categoria ativa</Label>
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">Salvar</Button>
      </div>
    </form>
  )
}

function TamanhoForm({
  tamanho,
  onSave,
  onCancel,
}: {
  tamanho: TamanhoPizza | null
  onSave: (tamanho: Partial<TamanhoPizza>) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    nome: tamanho?.nome || "",
    fatias: tamanho?.fatias || 8,
    descricao: tamanho?.descricao || "",
    ordem: tamanho?.ordem || 0,
    ativo: tamanho?.ativo ?? true,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="nome">Nome do Tamanho</Label>
        <Input
          id="nome"
          value={formData.nome}
          onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="fatias">Quantidade de Fatias</Label>
        <Input
          id="fatias"
          type="number"
          value={formData.fatias}
          onChange={(e) => setFormData({ ...formData, fatias: parseInt(e.target.value) || 8 })}
          required
        />
      </div>

      <div>
        <Label htmlFor="descricao">Descricao</Label>
        <Textarea
          id="descricao"
          value={formData.descricao}
          onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="ordem">Ordem</Label>
          <Input
            id="ordem"
            type="number"
            value={formData.ordem}
            onChange={(e) => setFormData({ ...formData, ordem: parseInt(e.target.value) || 0 })}
          />
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="ativo"
            checked={formData.ativo}
            onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
          />
          <Label htmlFor="ativo">Tamanho ativo</Label>
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">Salvar</Button>
      </div>
    </form>
  )
}

function OpcaoSaborForm({
  opcao,
  onSave,
  onCancel,
}: {
  opcao: OpcaoSabor | null
  onSave: (opcao: Partial<OpcaoSabor>) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    nome: opcao?.nome || "",
    maximo_sabores: opcao?.maximo_sabores || 1,
    descricao: opcao?.descricao || "",
    ordem: opcao?.ordem || 0,
    ativo: opcao?.ativo ?? true,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="nome">Nome da Opcao</Label>
        <Input
          id="nome"
          value={formData.nome}
          onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="maximo_sabores">Maximo de Sabores</Label>
        <Input
          id="maximo_sabores"
          type="number"
          min="1"
          max="5"
          value={formData.maximo_sabores}
          onChange={(e) => setFormData({ ...formData, maximo_sabores: parseInt(e.target.value) || 1 })}
          required
        />
      </div>

      <div>
        <Label htmlFor="descricao">Descricao</Label>
        <Textarea
          id="descricao"
          value={formData.descricao}
          onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="ordem">Ordem</Label>
          <Input
            id="ordem"
            type="number"
            value={formData.ordem}
            onChange={(e) => setFormData({ ...formData, ordem: parseInt(e.target.value) || 0 })}
          />
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="ativo"
            checked={formData.ativo}
            onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
          />
          <Label htmlFor="ativo">Opcao ativa</Label>
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">Salvar</Button>
      </div>
    </form>
  )
}
