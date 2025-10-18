"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { AdminLayout } from "@/components/admin-layout"
import { supabase } from "@/lib/supabase"
import { useConfig } from "@/lib/config-context"
import { formatCurrency, formatCurrencyInput, formatCurrencyForInput, parseCurrencyInput } from '@/lib/currency-utils'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Package, 
  Tag, 
  Settings2, 
  Pizza, 
  Coffee,
  Utensils,
  Eye,
  EyeOff,
  MoreVertical,
  CheckCircle2,
  XCircle,
  ArrowUpDown,
  Filter,
  Search
} from "lucide-react"

interface Adicional {
  nome: string
  preco: number
}

interface Produto {
  id: string
  categoria_id: string | null
  nome: string
  descricao: string | null
  preco_tradicional: number | null
  preco_broto: number | null
  preco_promocional_tradicional: number | null
  preco_promocional_broto: number | null
  tipo: string
  ativo: boolean
  promocao: boolean
  ordem: number
  adicionais?: Adicional[]
}

interface Categoria {
  id: string
  nome: string
  descricao?: string | null
  ordem?: number
  ativo?: boolean
  multi_sabores_habilitado?: boolean
}

interface OpcaoSabor {
  id: string
  nome: string
  maximo_sabores: number
  ativo: boolean
}

interface BordaRecheada {
  id: string
  nome: string
  preco: number
  ativo: boolean
  ordem: number
}

export default function AdminProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [opcoesSabores, setOpcoesSabores] = useState<OpcaoSabor[]>([])
  const [bordasRecheadas, setBordasRecheadas] = useState<BordaRecheada[]>([])
  const [editingProduto, setEditingProduto] = useState<Produto | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(null)
  const [isCategoriaDialogOpen, setIsCategoriaDialogOpen] = useState(false)
  const [editingBorda, setEditingBorda] = useState<BordaRecheada | null>(null)
  const [isBordaDialogOpen, setIsBordaDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [proximaOrdem, setProximaOrdem] = useState<number>(0)
  
  const { config, updateConfig } = useConfig()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [produtosRes, categoriasRes, opcoesRes, bordasRes] = await Promise.all([
        supabase.from("produtos").select("*").order("ordem"),
        supabase.from("categorias").select("*").order("ordem"),
        supabase.from("opcoes_sabores").select("*").order("ordem"),
        supabase.from("bordas_recheadas").select("*").order("ordem"),
      ])

      if (produtosRes.data) {
        setProdutos(produtosRes.data)
        // Calcular próxima ordem disponível
        const maiorOrdem = produtosRes.data.reduce((max, produto) => 
          Math.max(max, produto.ordem || 0), 0
        )
        setProximaOrdem(maiorOrdem + 1)
      }
      if (categoriasRes.data) setCategorias(categoriasRes.data)
      if (opcoesRes.data) setOpcoesSabores(opcoesRes.data)
      if (bordasRes.data) setBordasRecheadas(bordasRes.data)
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      // Fallback para opções padrão
      setOpcoesSabores([
        { id: "1", nome: "1 Sabor", maximo_sabores: 1, ativo: true },
        { id: "2", nome: "2 Sabores", maximo_sabores: 2, ativo: true },
        { id: "3", nome: "3 Sabores", maximo_sabores: 3, ativo: true }
      ])
      setBordasRecheadas([])
      setProximaOrdem(1) // Se não há produtos, começar com ordem 1
    }
  }

  const handleSave = async (produto: Partial<Produto>) => {
    try {
      if (editingProduto?.id) {
        // Atualizar
        const { error } = await supabase.from("produtos").update(produto).eq("id", editingProduto.id)
        if (error) throw error
      } else {
        // Criar novo
        const { error } = await supabase.from("produtos").insert(produto)
        if (error) throw error
        
        // Atualizar próxima ordem disponível após criar um produto
        setProximaOrdem(prev => prev + 1)
      }

      loadData()
      setIsDialogOpen(false)
      setEditingProduto(null)
    } catch (error) {
      console.error("Erro ao salvar produto:", error)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este produto?")) {
      try {
        const { error } = await supabase.from("produtos").delete().eq("id", id)
        if (error) throw error
        loadData()
      } catch (error) {
        console.error("Erro ao excluir produto:", error)
      }
    }
  }

  const handleToggleOpcaoSabor = async (opcaoId: string, novoStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("opcoes_sabores")
        .update({ ativo: novoStatus })
        .eq("id", opcaoId)
      
      if (error) throw error
      
      // Atualizar estado local
      setOpcoesSabores(prev => 
        prev.map(opcao => 
          opcao.id === opcaoId ? { ...opcao, ativo: novoStatus } : opcao
        )
      )
    } catch (error) {
      console.error("Erro ao atualizar opcao de sabor:", error)
    }
  }

  const handleToggleBroto = async (novoStatus: boolean) => {
    try {
      await updateConfig({ habilitar_broto: novoStatus })
    } catch (error) {
      console.error("Erro ao atualizar configuração de broto:", error)
      alert("Erro ao salvar configuração. Tente novamente.")
    }
  }

  const handleToggleBordasRecheadas = async (novoStatus: boolean) => {
    try {
      await updateConfig({ habilitar_bordas_recheadas: novoStatus })
    } catch (error) {
      console.error("Erro ao atualizar configuração de bordas recheadas:", error)
      alert("Erro ao salvar configuração. Tente novamente.")
    }
  }

  const handleToggleDisponibilidade = async (produtoId: string, novoStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('produtos')
        .update({ ativo: novoStatus })
        .eq('id', produtoId)

      if (error) throw error
      await loadData()
    } catch (error) {
      console.error('Erro ao atualizar disponibilidade:', error)
      alert('Erro ao atualizar disponibilidade. Tente novamente.')
    }
  }

  const handleTogglePromocao = async (produtoId: string, novoStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('produtos')
        .update({ promocao: novoStatus })
        .eq('id', produtoId)

      if (error) throw error
      await loadData()
    } catch (error) {
      console.error('Erro ao atualizar promoção:', error)
      alert('Erro ao atualizar promoção. Tente novamente.')
    }
  }

  const handleSaveCategoria = async (categoria: Partial<Categoria>) => {
    try {
      if (editingCategoria?.id) {
        // Atualizar categoria existente
        const { error } = await supabase.from("categorias").update(categoria).eq("id", editingCategoria.id)
        if (error) throw error
      } else {
        // Criar nova categoria
        const { error } = await supabase.from("categorias").insert(categoria)
        if (error) throw error
      }

      await loadData()
      setIsCategoriaDialogOpen(false)
      setEditingCategoria(null)
    } catch (error) {
      console.error("Erro ao salvar categoria:", error)
      alert("Erro ao salvar categoria. Tente novamente.")
    }
  }

  const handleDeleteCategoria = async (id: string) => {
    try {
      // Verificar se existem produtos usando esta categoria
      const { data: produtosComCategoria, error: checkError } = await supabase
        .from("produtos")
        .select("id, nome")
        .eq("categoria_id", id)
      
      if (checkError) throw checkError

      if (produtosComCategoria && produtosComCategoria.length > 0) {
        const nomesProdutos = produtosComCategoria.map(p => p.nome).join(", ")
        const confirmacao = confirm(
          `Esta categoria possui ${produtosComCategoria.length} produto(s) associado(s): ${nomesProdutos}.\n\n` +
          `Ao excluir a categoria, estes produtos ficarão sem categoria.\n\n` +
          `Deseja continuar?`
        )
        
        if (!confirmacao) return

        // Remover a categoria dos produtos antes de excluir
        const { error: updateError } = await supabase
          .from("produtos")
          .update({ categoria_id: null })
          .eq("categoria_id", id)
        
        if (updateError) throw updateError
      } else {
        const confirmacao = confirm("Tem certeza que deseja excluir esta categoria?")
        if (!confirmacao) return
      }

      // Excluir a categoria
      const { error } = await supabase.from("categorias").delete().eq("id", id)
      if (error) throw error

      await loadData()
    } catch (error) {
      console.error("Erro ao excluir categoria:", error)
      alert("Erro ao excluir categoria. Tente novamente.")
    }
  }

  // Funções para bordas recheadas
  const handleToggleBorda = async (bordaId: string, novoStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("bordas_recheadas")
        .update({ ativo: novoStatus })
        .eq("id", bordaId)
      
      if (error) throw error
      
      setBordasRecheadas(prev => 
        prev.map(borda => 
          borda.id === bordaId ? { ...borda, ativo: novoStatus } : borda
        )
      )
    } catch (error) {
      console.error("Erro ao atualizar borda:", error)
      alert("Erro ao atualizar borda. Tente novamente.")
    }
  }

  const handleSaveBorda = async (borda: Partial<BordaRecheada>) => {
    try {
      if (editingBorda?.id) {
        const { error } = await supabase.from("bordas_recheadas").update(borda).eq("id", editingBorda.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from("bordas_recheadas").insert(borda)
        if (error) throw error
      }

      await loadData()
      setIsBordaDialogOpen(false)
      setEditingBorda(null)
    } catch (error) {
      console.error("Erro ao salvar borda:", error)
      alert("Erro ao salvar borda. Tente novamente.")
    }
  }

  const handleDeleteBorda = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta borda recheada?")) {
      try {
        const { error } = await supabase.from("bordas_recheadas").delete().eq("id", id)
        if (error) throw error
        await loadData()
      } catch (error) {
        console.error("Erro ao excluir borda:", error)
        alert("Erro ao excluir borda. Tente novamente.")
      }
    }
  }

  const filteredProdutos = produtos.filter(produto =>
    produto.nome.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Função para organizar produtos por categoria com prioridade
  const organizeProductsByCategory = () => {
    // Organizar produtos por categoria real do banco de dados
    const produtosPorCategoria = categorias.reduce((acc, categoria) => {
      const produtosDaCategoria = filteredProdutos.filter(p => p.categoria_id === categoria.id)
      if (produtosDaCategoria.length > 0) {
        acc[categoria.id] = {
          categoria,
          produtos: produtosDaCategoria
        }
      }
      return acc
    }, {} as Record<string, { categoria: any, produtos: Produto[] }>)

    // Para compatibilidade com a interface existente, identificar categorias específicas
    const pizzasTradicionaisCategoria = categorias.find(c => c.nome.toLowerCase().includes('pizzas tradicionais'))
    const bebidasCategoria = categorias.find(c => c.nome.toLowerCase() === 'bebidas')
    
    // Pizzas Tradicionais (categoria "Pizzas Tradicionais") com numeração sequencial
    const pizzasProdutos = pizzasTradicionaisCategoria ? produtosPorCategoria[pizzasTradicionaisCategoria.id]?.produtos || [] : []
    const pizzasComNumeracao = pizzasProdutos.map((pizza, index) => ({
      ...pizza,
      numeroSequencial: String(index + 1).padStart(2, '0')
    }))

    // Bebidas (categoria "Bebidas") 
    const bebidas = bebidasCategoria ? produtosPorCategoria[bebidasCategoria.id]?.produtos || [] : []

    // IDs das categorias especiais que têm seções dedicadas
    const categoriasEspeciais = new Set([
      pizzasTradicionaisCategoria?.id,
      bebidasCategoria?.id
    ].filter(Boolean))

    // Outras categorias (exceto Pizzas Tradicionais e Bebidas) com ordenação específica
    const outrasCategoriasDataUnsorted = Object.values(produtosPorCategoria)
      .filter(({ categoria }) => !categoriasEspeciais.has(categoria.id))

    // Definir ordem específica das categorias
    const ordemCategorias = [
      'pizzas promocionais',
      'mega promoção',
      'maga promoção', // Incluir variação com erro de digitação
      'pizzas veganas',
      'pizzas doces',
      'bordas recheadas'
    ]

    // Ordenar as categorias conforme a ordem especificada
    const outrasCategoriasData = outrasCategoriasDataUnsorted.sort((a, b) => {
      const nomeA = a.categoria.nome.toLowerCase()
      const nomeB = b.categoria.nome.toLowerCase()
      
      const indexA = ordemCategorias.findIndex(ordem => nomeA.includes(ordem))
      const indexB = ordemCategorias.findIndex(ordem => nomeB.includes(ordem))
      
      // Se ambas estão na lista de ordem, ordenar por índice
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB
      }
      
      // Se apenas uma está na lista, ela vem primeiro
      if (indexA !== -1) return -1
      if (indexB !== -1) return 1
      
      // Se nenhuma está na lista, manter ordem alfabética
      return nomeA.localeCompare(nomeB)
    })

    // Para compatibilidade, flatten dos produtos de outras categorias
    const outros = outrasCategoriasData.flatMap(({ produtos }) => produtos)

    return {
      pizzas: pizzasComNumeracao,
      bebidas,
      outros,
      outrasCategoriasData // Nova propriedade para acessar categorias com seus produtos separadamente
    }
  }

  const { pizzas, bebidas, outros, outrasCategoriasData } = organizeProductsByCategory()

  const getCategoryAppearance = (categoryName: string) => {
    const name = categoryName.toLowerCase()
    if (name.includes('tradicionais')) {
      return {
        header: "bg-red-600 text-white",
        card: "bg-red-50 border-red-100 hover:border-red-200",
        iconContainer: "bg-red-100",
        icon: "text-red-600",
      }
    }
    if (name.includes('promoção')) {
      return {
        header: "bg-amber-500 text-white",
        card: "bg-amber-50 border-amber-100 hover:border-amber-200",
        iconContainer: "bg-amber-100",
        icon: "text-amber-600",
      }
    }
    if (name.includes('veganas')) {
      return {
        header: "bg-green-600 text-white",
        card: "bg-green-50 border-green-100 hover:border-green-200",
        iconContainer: "bg-green-100",
        icon: "text-green-600",
      }
    }
    if (name.includes('doces')) {
      return {
        header: "bg-pink-500 text-white",
        card: "bg-pink-50 border-pink-100 hover:border-pink-200",
        iconContainer: "bg-pink-100",
        icon: "text-pink-600",
      }
    }
     if (name.includes('bebidas')) {
      return {
        header: "bg-blue-600 text-white",
        card: "bg-blue-50 border-blue-100 hover:border-blue-200",
        iconContainer: "bg-blue-100",
        icon: "text-blue-600",
      }
    }
    if (name.includes('bordas')) {
      return {
        header: "bg-gray-700 text-white",
        card: "bg-gray-100 border-gray-200 hover:border-gray-300",
        iconContainer: "bg-gray-200",
        icon: "text-gray-700",
      }
    }
    // Default/fallback
    return {
      header: "bg-slate-600 text-white",
      card: "bg-slate-50 border-slate-100 hover:border-slate-200",
      iconContainer: "bg-slate-100",
      icon: "text-slate-600",
    }
  }

  const getProductIcon = (tipo: string) => {
    switch (tipo) {
      case 'pizza':
      case 'salgada':
        return <Pizza className="h-5 w-5 text-orange-500" />
      case 'doce':
        return <Utensils className="h-5 w-5 text-pink-500" />
      case 'bebida':
        return <Coffee className="h-5 w-5 text-blue-500" />
      default:
        return <Package className="h-5 w-5 text-muted-foreground" />
    }
  }

  return (
    <AdminLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* 1. Header Section - Gerenciamento de Produtos */}
        <div className="bg-card rounded-2xl p-8 border border-border shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <div className="p-2 bg-secondary rounded-xl">
                  <Package className="h-8 w-8 text-primary" />
                </div>
                Gerenciamento de Produtos
              </h1>
              <p className="text-muted-foreground max-w-2xl text-lg">
                Gerencie produtos, categorias e configurações do seu cardápio digital.
              </p>
            </div>
          </div>
        </div>

        {/* 2. Lista de Produtos (exceto bebidas) */}
        <Card className="border-border shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="bg-card border-b border-border p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary rounded-xl">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl font-semibold text-foreground">
                    Lista de Produtos
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {filteredProdutos.filter(p => p.tipo !== 'bebida').length} produto{filteredProdutos.filter(p => p.tipo !== 'bebida').length !== 1 ? 's' : ''} encontrado{filteredProdutos.filter(p => p.tipo !== 'bebida').length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar produtos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64 rounded-xl border-gray-300 focus:border-primary/80 focus:ring-primary/20 bg-white text-gray-800"
                  />
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-xl shadow-sm hover:shadow-md transition-all border border-transparent"
                      onClick={() => {
                        setEditingProduto(null)
                        setIsDialogOpen(true)
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Produto
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl rounded-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-semibold">
                        {editingProduto ? "Editar Produto" : "Novo Produto"}
                      </DialogTitle>
                    </DialogHeader>
                    <ProdutoForm
                      produto={editingProduto}
                      categorias={categorias}
                      brotoHabilitado={config.habilitar_broto}
                      proximaOrdem={proximaOrdem}
                      onSave={handleSave}
                      onCancel={() => setIsDialogOpen(false)}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {filteredProdutos.filter(p => p.tipo !== 'bebida').length > 0 ? (
              <div className="space-y-8">
                {/* Seção de Pizzas Tradicionais */}
                {pizzas.length > 0 && (() => {
                  const appearance = getCategoryAppearance('Pizzas Tradicionais');
                  return (
                    <div>
                      <div className={`${appearance.header} rounded-xl p-4 mb-6 shadow-md`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`${appearance.iconContainer} p-2 rounded-xl`}>
                              <Pizza className={`h-6 w-6 ${appearance.icon}`} />
                            </div>
                            <div>
                              <h2 className="text-xl font-bold">Pizzas Tradicionais</h2>
                              <p className="text-sm opacity-80">{pizzas.length} pizza{pizzas.length !== 1 ? 's' : ''} cadastrada{pizzas.length !== 1 ? 's' : ''}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 bg-white/10 rounded-xl p-3">
                            <div className="flex items-center gap-2">
                              <Pizza className="h-4 w-4" />
                              <span className="text-sm font-medium">Habilitar Pizza Broto</span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={config.habilitar_broto}
                                onChange={(e) => handleToggleBroto(e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-white/30 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-white/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-400"></div>
                            </label>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {pizzas.map((produto) => (
                          <div
                            key={produto.id}
                            className={`group ${appearance.card} rounded-xl p-6 hover:shadow-lg transition-all duration-300 shadow-sm`}
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className={`${appearance.iconContainer} p-1.5 rounded-full`}>
                                  {getProductIcon(produto.tipo)}
                                </div>
                                <div>
                                  <h3 className="font-semibold text-gray-900 text-lg leading-tight">
                                    <span className={`inline-block ${appearance.iconContainer} ${appearance.icon} text-sm font-bold px-2 py-1 rounded-md mr-2`}>
                                      {produto.numeroSequencial}
                                    </span>
                                    {produto.nome}
                                  </h3>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge 
                                      variant={produto.ativo ? "default" : "secondary"}
                                      className={`text-xs font-medium ${produto.ativo ? 'bg-green-700 hover:bg-green-800 text-white' : 'bg-gray-200 text-gray-700'}`}
                                    >
                                      {produto.ativo ? "Disponível" : "Indisponível"}
                                    </Badge>
                                    {produto.promocao && <Badge variant="destructive" className="bg-orange-500 text-white">Promo</Badge>}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 hover:bg-gray-100 text-gray-700 hover:text-gray-900 rounded-lg border border-gray-200"
                                  onClick={() => {
                                    setEditingProduto(produto)
                                    setIsDialogOpen(true)
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 hover:bg-red-50 text-red-600 rounded-lg border border-gray-200"
                                  onClick={() => handleDelete(produto.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          
                            {produto.descricao && <p className="text-sm text-gray-600 mb-4">{produto.descricao}</p>}
                            
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between items-center bg-white/60 p-2 rounded-lg">
                                <span className="font-medium text-gray-600">Preço</span>
                                <span className="font-bold text-gray-800">
                                  {formatCurrency(produto.preco_tradicional)}
                                </span>
                              </div>
                              {config.habilitar_broto && produto.preco_broto && (
                                <div className="flex justify-between items-center bg-white/60 p-2 rounded-lg">
                                  <span className="font-medium text-gray-600">Broto</span>
                                  <span className="font-bold text-gray-800">
                                    {formatCurrency(produto.preco_broto)}
                                  </span>
                                </div>
                              )}
                              {produto.promocao && produto.preco_promocional_tradicional && (
                                <div className="flex justify-between items-center bg-orange-100 p-2 rounded-lg ring-1 ring-orange-300">
                                  <span className="font-medium text-orange-700">Promo</span>
                                  <span className="font-bold text-orange-800">
                                    {formatCurrency(produto.preco_promocional_tradicional)}
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="border-t border-gray-200 mt-4 pt-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-600">Disponível</span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={produto.ativo}
                                    onChange={(e) => handleToggleDisponibilidade(produto.id, e.target.checked)}
                                    className="sr-only peer"
                                  />
                                  <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[0.5px] after:left-[1px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
                                </label>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-600">Promoção</span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={produto.promocao}
                                    onChange={(e) => handleTogglePromocao(produto.id, e.target.checked)}
                                    className="sr-only peer"
                                  />
                                  <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[0.5px] after:left-[1px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500"></div>
                                </label>
                              </div>

                              <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
                                <span className="flex items-center gap-1">
                                  <ArrowUpDown className="h-3 w-3" />
                                  Ordem: {produto.ordem}
                                </span>
                                {produto.categoria_id && (
                                  <span className="flex items-center gap-1">
                                    <Tag className="h-3 w-3" />
                                    {categorias.find(c => c.id === produto.categoria_id)?.nome || 'Sem categoria'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })()}
                
                {/* Seção de Bebidas */}
                {bebidas.length > 0 && (() => {
                  const appearance = getCategoryAppearance('Bebidas');
                  return (
                    <Card className="border-border shadow-sm rounded-2xl overflow-hidden">
                      <CardHeader className={`${appearance.header} p-6`}>
                        <div className="flex items-center gap-3">
                          <div className={`${appearance.iconContainer} p-2 rounded-xl`}>
                            <Coffee className={`h-6 w-6 ${appearance.icon}`} />
                          </div>
                          <div>
                            <CardTitle className="text-xl font-semibold">
                              Bebidas
                            </CardTitle>
                            <p className="text-sm opacity-80 mt-1">
                              {bebidas.length} bebida{bebidas.length !== 1 ? 's' : ''} cadastrada{bebidas.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6 bg-gray-50">
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                          {bebidas.map((produto) => (
                            <div
                              key={produto.id}
                              className={`group ${appearance.card} rounded-xl p-6 hover:shadow-lg transition-all duration-300 shadow-sm`}
                            >
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                  <div className={`${appearance.iconContainer} p-1.5 rounded-full`}>
                                    {getProductIcon(produto.tipo)}
                                  </div>
                                  <div>
                                    <h3 className="font-semibold text-gray-900 text-lg leading-tight">
                                      {produto.nome}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Badge 
                                        variant={produto.ativo ? "default" : "secondary"}
                                        className={`text-xs font-medium ${produto.ativo ? 'bg-green-700 hover:bg-green-800 text-white' : 'bg-gray-200 text-gray-700'}`}
                                      >
                                        {produto.ativo ? "Ativo" : "Inativo"}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 hover:bg-gray-100 text-gray-700 hover:text-gray-900 rounded-lg border border-gray-200"
                                    onClick={() => {
                                      setEditingProduto(produto)
                                      setIsDialogOpen(true)
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 hover:bg-red-50 text-red-600 rounded-lg border border-gray-200"
                                    onClick={() => handleDelete(produto.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>

                              {produto.descricao && (
                                <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                                  {produto.descricao}
                                </p>
                              )}

                              <div className="space-y-3">
                                <div className="bg-white/60 rounded-lg p-3 border border-gray-200">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-700 flex items-center gap-2 font-medium">
                                      <Coffee className="h-4 w-4" />
                                      Preço
                                    </span>
                                    <span className="font-bold text-green-700 text-base">
                                      {produto.promocao && produto.preco_promocional_tradicional 
                                        ? formatCurrency(produto.preco_promocional_tradicional)
                                        : formatCurrency(produto.preco_tradicional)
                                      }
                                    </span>
                                  </div>
                                </div>

                                {/* Toggle de disponibilidade no card */}
                                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                                  <span className="text-sm text-gray-800 font-medium">
                                    {produto.ativo ? "Disponível" : "Indisponível"}
                                  </span>
                                  <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={produto.ativo}
                                      onChange={(e) => handleToggleDisponibilidade(produto.id, e.target.checked)}
                                      className="sr-only peer"
                                    />
                                    <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                                  </label>
                                </div>

                                {/* Toggle de promoção no card */}
                                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                                  <span className="text-sm text-gray-800 font-medium">
                                    {produto.promocao ? "Em Promoção" : "Preço Normal"}
                                  </span>
                                  <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={produto.promocao}
                                      onChange={(e) => handleTogglePromocao(produto.id, e.target.checked)}
                                      className="sr-only peer"
                                    />
                                    <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-600"></div>
                                  </label>
                                </div>

                                <div className="flex items-center justify-between text-xs text-gray-600 pt-2">
                                  <span className="flex items-center gap-1 font-medium">
                                    <ArrowUpDown className="h-3 w-3" />
                                    Ordem: {produto.ordem}
                                  </span>
                                  {produto.categoria_id && (
                                    <span className="flex items-center gap-1 font-medium">
                                      <Tag className="h-3 w-3" />
                                      {categorias.find(c => c.id === produto.categoria_id)?.nome || 'Sem categoria'}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })()}

                {/* Seções Dinâmicas para Outras Categorias */}
                {outrasCategoriasData && outrasCategoriasData.map(({ categoria, produtos }) => {
                  const appearance = getCategoryAppearance(categoria.nome);
                  return (
                    <Card key={categoria.id} className="border-border shadow-sm rounded-2xl overflow-hidden">
                      <CardHeader className={`${appearance.header} p-6`}>
                        <div className="flex items-center gap-3">
                          <div className={`${appearance.iconContainer} p-2 rounded-xl`}>
                            <Package className={`h-6 w-6 ${appearance.icon}`} />
                          </div>
                          <div>
                            <CardTitle className="text-xl font-semibold">
                              {categoria.nome}
                            </CardTitle>
                            <p className="text-sm opacity-80 mt-1">
                              {produtos.length} produto{produtos.length !== 1 ? 's' : ''} cadastrado{produtos.length !== 1 ? 's' : ''}
                              {categoria.descricao && ` • ${categoria.descricao}`}
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6 bg-gray-50">
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                          {produtos.map((produto) => (
                            <div
                              key={produto.id}
                              className={`group ${appearance.card} rounded-xl p-6 hover:shadow-lg transition-all duration-300 shadow-sm`}
                            >
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                  <div className={`${appearance.iconContainer} p-1.5 rounded-full`}>
                                    {getProductIcon(produto.tipo)}
                                  </div>
                                  <div>
                                    <h3 className="font-semibold text-gray-900 text-lg leading-tight">
                                      {produto.nome}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Badge 
                                        variant={produto.ativo ? "default" : "secondary"}
                                        className={`text-xs font-medium ${produto.ativo ? 'bg-green-700 hover:bg-green-800 text-white' : 'bg-gray-200 text-gray-700'}`}
                                      >
                                        {produto.ativo ? "Ativo" : "Inativo"}
                                      </Badge>
                                      <span className="text-xs text-muted-foreground capitalize">
                                        {produto.tipo}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 hover:bg-gray-100 text-gray-700 hover:text-gray-900 rounded-lg border border-gray-200"
                                    onClick={() => {
                                      setEditingProduto(produto)
                                      setIsDialogOpen(true)
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 hover:bg-red-50 text-red-600 rounded-lg border border-gray-200"
                                    onClick={() => handleDelete(produto.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                              {produto.descricao && <p className="text-sm text-gray-600 mb-4">{produto.descricao}</p>}
                              <div className="space-y-2">
                                <div className="bg-white/60 rounded-lg p-3 border border-gray-200">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-700 flex items-center gap-2 font-medium">
                                      <Package className="h-4 w-4" />
                                      Preço
                                    </span>
                                    <span className="font-bold text-green-700 text-base">
                                      {produto.promocao && produto.preco_promocional_tradicional 
                                        ? formatCurrency(produto.preco_promocional_tradicional)
                                        : formatCurrency(produto.preco_tradicional)
                                      }
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                                  <span className="text-sm text-gray-800 font-medium">
                                    {produto.ativo ? "Disponível" : "Indisponível"}
                                  </span>
                                  <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={produto.ativo}
                                      onChange={(e) => handleToggleDisponibilidade(produto.id, e.target.checked)}
                                      className="sr-only peer"
                                    />
                                    <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                                  </label>
                                </div>
                                <div className="flex items-center justify-between text-xs text-gray-600 pt-2">
                                  <span className="flex items-center gap-1 font-medium">
                                    <ArrowUpDown className="h-3 w-3" />
                                    Ordem: {produto.ordem}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">Nenhum produto encontrado</h3>
                <p className="text-muted-foreground mb-4">Ajuste os filtros ou adicione novos produtos</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 4. Bordas Recheadas */}
        <Card className="border-muted/30 shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-yellow-50/50 to-orange-50/30 border-b border-muted/20 px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100/80 rounded-xl">
                  <Pizza className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <CardTitle className="text-xl font-semibold text-foreground">
                    Bordas Recheadas
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Gerencie as opções de bordas recheadas disponíveis
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Toggle Global para Bordas Recheadas */}
                <div className="flex items-center gap-2 bg-card/50 rounded-xl px-4 py-3 border border-muted/30">
                  <div className="flex items-center gap-2">
                    <Pizza className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">Habilitar Bordas</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.habilitar_bordas_recheadas}
                      onChange={(e) => handleToggleBordasRecheadas(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-muted after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                <Dialog open={isBordaDialogOpen} onOpenChange={setIsBordaDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="border-muted/40 hover:bg-yellow-50/50 rounded-xl"
                      onClick={() => {
                        setEditingBorda(null)
                        setIsBordaDialogOpen(true)
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Borda
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md rounded-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-semibold">
                        {editingBorda ? "Editar Borda" : "Nova Borda"}
                      </DialogTitle>
                    </DialogHeader>
                    <BordaForm 
                      borda={editingBorda} 
                      onSave={handleSaveBorda}
                      onCancel={() => setIsBordaDialogOpen(false)}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-4 py-3">
            <div className="space-y-3">
              {bordasRecheadas.length > 0 ? (
                <div className="space-y-3">
                  {bordasRecheadas.map((borda) => (
                    <div 
                      key={borda.id} 
                      className="group bg-card/50 border border-muted/30 rounded-xl p-4 hover:shadow-md hover:border-muted/50 transition-all duration-200"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-foreground">{borda.nome}</h3>
                            <Badge variant={borda.ativo ? "default" : "secondary"} className="text-xs rounded-full">
                              {borda.ativo ? "Ativo" : "Inativo"}
                            </Badge>
                            <span className="text-sm font-medium text-green-600">
                              +{formatCurrency(borda.preco)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-6">
                              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                                <ArrowUpDown className="h-4 w-4" />
                                Ordem: {borda.ordem}
                              </span>
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                  {borda.ativo ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-muted-foreground" />
                                  )}
                                  <span className="text-sm text-muted-foreground">
                                    {borda.ativo ? "Disponível" : "Indisponível"}
                                  </span>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={borda.ativo}
                                    onChange={(e) => handleToggleBorda(borda.id, e.target.checked)}
                                    className="sr-only peer"
                                  />
                                  <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-muted after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity ml-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-gray-100 text-gray-700 hover:text-gray-900 rounded-lg border border-gray-200"
                            onClick={() => {
                              setEditingBorda(borda)
                              setIsBordaDialogOpen(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-red-50 text-red-600 rounded-lg border border-gray-200"
                            onClick={() => handleDeleteBorda(borda.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Pizza className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-2">Nenhuma borda recheada</h3>
                  <p className="text-muted-foreground mb-3">Crie sua primeira borda recheada para disponibilizar aos clientes</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 5. Categorias e Configurações de Sabores lado a lado */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Categories Management */}
          <Card className="border-muted/30 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-50/50 to-emerald-50/30 border-b border-muted/20 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100/80 rounded-xl">
                    <Tag className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-semibold text-foreground">
                      Categorias
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Organize seus produtos por categorias
                    </p>
                  </div>
                </div>
                <Dialog open={isCategoriaDialogOpen} onOpenChange={setIsCategoriaDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="border-muted/40 hover:bg-green-50/50 rounded-xl"
                      onClick={() => {
                        setEditingCategoria(null)
                        setIsCategoriaDialogOpen(true)
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Categoria
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md rounded-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-semibold">
                        {editingCategoria ? "Editar Categoria" : "Nova Categoria"}
                      </DialogTitle>
                    </DialogHeader>
                    <CategoriaForm
                      categoria={editingCategoria}
                      onSave={handleSaveCategoria}
                      onCancel={() => setIsCategoriaDialogOpen(false)}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {categorias.length > 0 ? (
                  <div className="space-y-3">
                    {categorias.map((categoria) => (
                      <div 
                        key={categoria.id} 
                        className="group bg-card/50 border border-muted/30 rounded-xl p-4 hover:shadow-md hover:border-muted/50 transition-all duration-200"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-3">
                              <h3 className="font-semibold text-foreground">{categoria.nome}</h3>
                              <Badge variant={categoria.ativo ? "default" : "secondary"} className="text-xs rounded-full">
                                {categoria.ativo ? "Ativo" : "Inativo"}
                              </Badge>
                            </div>
                            {categoria.descricao && (
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                {categoria.descricao}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <ArrowUpDown className="h-3 w-3" />
                                Ordem: {categoria.ordem || 0}
                              </span>
                              <span className="flex items-center gap-1">
                                <Package className="h-3 w-3" />
                                {produtos.filter(p => p.categoria_id === categoria.id).length} produtos
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-gray-100 text-gray-700 hover:text-gray-900 rounded-lg border border-gray-200"
                              onClick={() => {
                                setEditingCategoria(categoria)
                                setIsCategoriaDialogOpen(true)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-red-50 text-red-600 rounded-lg border border-gray-200"
                              onClick={() => handleDeleteCategoria(categoria.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Tag className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-2">Nenhuma categoria</h3>
                    <p className="text-muted-foreground mb-4">Crie sua primeira categoria para organizar os produtos</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Flavor Options Management */}
          <Card className="border-muted/30 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-50/50 to-violet-50/30 border-b border-muted/20 p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100/80 rounded-xl">
                  <Settings2 className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-xl font-semibold text-foreground">
                    Configurações de Sabores
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Controle as opções de sabores disponíveis
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {opcoesSabores.map((opcao) => (
                  <div 
                    key={opcao.id} 
                    className="flex items-center justify-between p-4 bg-card/50 border border-muted/30 rounded-xl hover:shadow-sm hover:border-muted/50 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-orange-100/80 rounded-xl">
                        <Pizza className="h-4 w-4 text-orange-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-foreground">{opcao.nome}</span>
                          {opcao.maximo_sabores === 1 && (
                            <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 border-blue-200 rounded-full">
                              Obrigatório
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Até {opcao.maximo_sabores} sabor{opcao.maximo_sabores > 1 ? 'es' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {opcao.ativo ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="text-sm text-muted-foreground">
                          {opcao.ativo ? "Ativo" : "Inativo"}
                        </span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={opcao.ativo}
                          onChange={(e) => handleToggleOpcaoSabor(opcao.id, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-muted after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}

function ProdutoForm({
  produto,
  categorias,
  brotoHabilitado,
  proximaOrdem,
  onSave,
  onCancel,
}: {
  produto: Produto | null
  categorias: Categoria[]
  brotoHabilitado: boolean
  proximaOrdem: number
  onSave: (produto: Partial<Produto>) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState<Partial<Produto>>(
    produto || {
      nome: "",
      categoria_id: null,
      descricao: "",
      preco_tradicional: 0,
      preco_broto: 0,
      preco_promocional_tradicional: 0,
      preco_promocional_broto: 0,
      tipo: "salgada",
      ativo: true,
      promocao: false,
      ordem: proximaOrdem,
      adicionais: [],
    }
  );

  useEffect(() => {
    if (produto) {
      setFormData({ ...produto, adicionais: produto.adicionais || [] });
    } else {
      setFormData({
        nome: "",
        categoria_id: null,
        descricao: "",
        preco_tradicional: 0,
        preco_broto: 0,
        preco_promocional_tradicional: 0,
        preco_promocional_broto: 0,
        tipo: "salgada",
        ativo: true,
        promocao: false,
        ordem: proximaOrdem,
        adicionais: [],
      });
    }
  }, [produto, proximaOrdem]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    // @ts-ignore
    const isCheckbox = type === "checkbox" ? e.target.checked : value;
    setFormData((prev) => ({ ...prev, [name]: isCheckbox }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const formattedValue = formatCurrencyInput(value)
    e.target.value = formattedValue
    const parsedValue = parseCurrencyInput(formattedValue)
    setFormData(prev => ({ ...prev, [name]: parsedValue }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedData = { ...formData };
    // @ts-ignore
    delete cleanedData.numeroSequencial;
    onSave(cleanedData);
  };

  const adicionarAdicional = () => {
    setFormData((prev) => ({
      ...prev,
      adicionais: [...(prev.adicionais || []), { nome: "", preco: 0 }],
    }));
  };

  const removerAdicional = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      adicionais: [...(prev.adicionais || [])].filter((_, i) => i !== index),
    }));
  };

  const atualizarAdicional = (
    index: number,
    campo: keyof Adicional,
    valor: string | number
  ) => {
    const novosAdicionais = [...(formData.adicionais || [])];
    novosAdicionais[index] = { ...novosAdicionais[index], [campo]: valor };
    setFormData((prev) => ({ ...prev, adicionais: novosAdicionais }));
  };

  const atualizarPrecoAdicional = (index: number, valor: string) => {
    const formattedValue = formatCurrencyInput(valor);
    const novosAdicionais = [...(formData.adicionais || [])];
    const precoNumerico = parseCurrencyInput(formattedValue);
    novosAdicionais[index] = { ...novosAdicionais[index], preco: precoNumerico };
    setFormData((prev) => ({ ...prev, adicionais: novosAdicionais }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="nome" className="text-sm font-medium text-gray-700">Nome do Produto</Label>
          <Input
            id="nome"
            name="nome"
            value={formData.nome}
            onChange={handleChange}
            className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/80"
            placeholder="Ex: Pizza de Calabresa"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="categoria_id" className="text-sm font-medium text-gray-700">Categoria</Label>
          <Select name="categoria_id" value={formData.categoria_id || ""} onValueChange={(value) => handleSelectChange('categoria_id', value)}>
            <SelectTrigger className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/80">
              <SelectValue placeholder="Selecione a categoria" />
            </SelectTrigger>
            <SelectContent>
              {categorias.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="descricao" className="text-sm font-medium text-gray-700">Descrição</Label>
        <Textarea
          id="descricao"
          name="descricao"
          value={formData.descricao || ""}
          onChange={handleChange}
          className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/80 min-h-[80px]"
          placeholder="Ingredientes e detalhes do produto"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="space-y-2">
          <Label htmlFor="preco_tradicional" className="text-sm font-medium text-gray-700">Preço Tradicional</Label>
          <Input
            id="preco_tradicional"
            name="preco_tradicional"
            value={formatCurrencyForInput(formData.preco_tradicional)}
            onChange={handlePriceChange}
            className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/80"
            placeholder="R$ 0,00"
          />
        </div>
        
        {brotoHabilitado && (
           <div className="space-y-2">
            <Label htmlFor="preco_broto" className="text-sm font-medium text-gray-700">Preço Broto</Label>
            <Input
              id="preco_broto"
              name="preco_broto"
              value={formatCurrencyForInput(formData.preco_broto)}
              onChange={handlePriceChange}
              className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/80"
              placeholder="R$ 0,00"
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="preco_promocional_tradicional" className="text-sm font-medium text-gray-700">Preço Promocional</Label>
          <Input
            id="preco_promocional_tradicional"
            name="preco_promocional_tradicional"
            value={formatCurrencyForInput(formData.preco_promocional_tradicional)}
            onChange={handlePriceChange}
            className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/80"
            placeholder="R$ 0,00"
          />
        </div>

        {brotoHabilitado && (
          <div className="space-y-2">
            <Label htmlFor="preco_promocional_broto" className="text-sm font-medium text-gray-700">Preço Promo Broto</Label>
            <Input
              id="preco_promocional_broto"
              name="preco_promocional_broto"
              value={formatCurrencyForInput(formData.preco_promocional_broto)}
              onChange={handlePriceChange}
              className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/80"
              placeholder="R$ 0,00"
            />
          </div>
        )}
      </div>

      {/* Adicionais */}
      <div className="space-y-4">
        <h4 className="text-md font-medium text-gray-800 border-b pb-2">Adicionais</h4>
        {formData.adicionais?.map((adicional, index) => (
          <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border">
            <div className="flex-1 space-y-2">
              <Label htmlFor={`adicional-nome-${index}`} className="text-xs font-medium text-gray-600">Nome do Adicional</Label>
              <Input
                id={`adicional-nome-${index}`}
                value={adicional.nome}
                onChange={(e) => atualizarAdicional(index, 'nome', e.target.value)}
                placeholder="Ex: Borda de Catupiry"
                className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/80"
              />
            </div>
            <div className="w-40 space-y-2">
              <Label htmlFor={`adicional-preco-${index}`} className="text-xs font-medium text-gray-600">Preço do Adicional</Label>
              <Input
                id={`adicional-preco-${index}`}
                value={formatCurrencyForInput(adicional.preco)}
                onChange={(e) => atualizarPrecoAdicional(index, e.target.value)}
                placeholder="R$ 0,00"
                className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/80"
              />
            </div>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => removerAdicional(index)}
              className="self-end !px-3 !py-2 border border-red-300 bg-red-50 text-red-600 hover:bg-red-100"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          onClick={adicionarAdicional}
          variant="outline"
          className="w-full border-dashed border-gray-400 text-gray-600 hover:bg-gray-50 hover:text-gray-800"
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Opcional
        </Button>
      </div>


      <div className="flex justify-end gap-4 pt-4 border-t">
        <Button type="button" onClick={onCancel} variant="outline" className="text-gray-700 bg-white border border-gray-300 hover:bg-gray-100">
          Cancelar
        </Button>
        <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
          Salvar Produto
        </Button>
      </div>
    </form>
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
  const [formData, setFormData] = useState<Partial<Categoria>>(
    categoria || {
      nome: "",
      descricao: "",
      ordem: 0,
      ativo: true,
      multi_sabores_habilitado: false,
    }
  );

  useEffect(() => {
    setFormData(
      categoria || {
        nome: "",
        descricao: "",
        ordem: 0,
        ativo: true,
        multi_sabores_habilitado: false,
      }
    );
  }, [categoria]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome.trim()) {
      alert("Nome da categoria é obrigatório")
      return
    }
    onSave(formData)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="nome-categoria" className="text-sm font-medium text-gray-700">Nome da Categoria</Label>
        <Input
          id="nome-categoria"
          name="nome"
          value={formData.nome || ""}
          onChange={handleChange}
          className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/80"
          placeholder="Ex: Pizzas Salgadas"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="descricao-categoria" className="text-sm font-medium text-gray-700">Descrição</Label>
        <Textarea
          id="descricao-categoria"
          name="descricao"
          value={formData.descricao || ""}
          onChange={handleChange}
          className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/80 min-h-[80px]"
          placeholder="Uma breve descrição da categoria"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="ordem-categoria" className="text-sm font-medium text-gray-700">Ordem de Exibição</Label>
        <Input
          id="ordem-categoria"
          name="ordem"
          type="number"
          value={formData.ordem || ""}
          onChange={handleChange}
          className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/80"
          placeholder="Ex: 1"
        />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="ativo"
            checked={formData.ativo}
            onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
            className="w-4 h-4 text-primary border-muted rounded focus:ring-primary/20"
          />
          <Label htmlFor="ativo" className="text-sm font-medium text-foreground">Categoria ativa</Label>
        </div>
        
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="multi_sabores"
            checked={formData.multi_sabores_habilitado}
            onChange={(e) => setFormData({ ...formData, multi_sabores_habilitado: e.target.checked })}
            className="w-4 h-4 text-primary border-muted rounded focus:ring-primary/20"
          />
          <Label htmlFor="multi_sabores" className="text-sm font-medium text-foreground">
            Habilitar seleção múltipla de sabores
          </Label>
        </div>
        <p className="text-xs text-muted-foreground ml-7">
          Quando habilitado, esta categoria funcionará como "Pizzas" com accordion e opções de 1, 2 ou 3 sabores
        </p>
      </div>

      <div className="flex justify-end gap-4 pt-4 border-t">
        <Button type="button" onClick={onCancel} variant="outline" className="text-gray-700 bg-white border border-gray-300 hover:bg-gray-100">
          Cancelar
        </Button>
        <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
          Salvar Categoria
        </Button>
      </div>
    </form>
  )
}

function BordaForm({
  borda,
  onSave,
  onCancel,
}: {
  borda: BordaRecheada | null
  onSave: (borda: Partial<BordaRecheada>) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState<Partial<BordaRecheada>>(
    borda || {
      nome: "",
      preco: 0,
      ativo: true,
      ordem: 0,
    }
  );

  useEffect(() => {
    setFormData(
      borda || {
        nome: "",
        preco: 0,
        ativo: true,
        ordem: 0,
      }
    );
  }, [borda]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome.trim()) {
      alert("Nome da borda é obrigatório")
      return
    }
    if (formData.preco <= 0) {
      alert("Preço deve ser maior que zero")
      return
    }
    onSave(formData)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    if (name === 'preco') {
      const formattedValue = formatCurrencyInput(value)
      e.target.value = formattedValue
      const parsedValue = parseCurrencyInput(formattedValue)
      setFormData(prev => ({ ...prev, [name]: parsedValue }))
    } else {
      const parsedValue = parseFloat(value)
      setFormData(prev => ({ ...prev, [name]: parsedValue }))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="nome-borda" className="text-sm font-medium text-gray-700">Nome da Borda</Label>
          <Input
            id="nome-borda"
            name="nome"
            value={formData.nome || ""}
            onChange={handleChange}
            className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/80"
            placeholder="Ex: Catupiry"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="preco-borda" className="text-sm font-medium text-gray-700">Preço</Label>
          <Input
            id="preco-borda"
            name="preco"
            value={formatCurrencyForInput(formData.preco)}
            onChange={handleChange}
            className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/80"
            placeholder="R$ 0,00"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="ordem-borda" className="text-sm font-medium text-gray-700">Ordem</Label>
          <Input
            id="ordem-borda"
            name="ordem"
            type="number"
            value={formData.ordem || ""}
            onChange={handleChange}
            className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/80"
            placeholder="1"
          />
        </div>
        <div className="flex items-center gap-2 pt-6">
          <input
            type="checkbox"
            id="ativo-borda"
            checked={formData.ativo}
            onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <Label htmlFor="ativo-borda" className="text-sm font-medium text-gray-700">Borda Ativa</Label>
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-4 border-t">
        <Button type="button" onClick={onCancel} variant="outline" className="text-gray-700 bg-white border border-gray-300 hover:bg-gray-100">
          Cancelar
        </Button>
        <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
          Salvar Borda
        </Button>
      </div>
    </form>
  )
}
