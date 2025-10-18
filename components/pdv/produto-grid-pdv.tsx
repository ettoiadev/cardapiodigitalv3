"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, Plus, Package } from 'lucide-react'
import type { ProdutoPDV, CategoriaPDV } from '@/types/pdv'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface ProdutoGridPDVProps {
  onAdicionarProduto: (produto: ProdutoPDV) => void
}

export function ProdutoGridPDV({ onAdicionarProduto }: ProdutoGridPDVProps) {
  const [produtos, setProdutos] = useState<ProdutoPDV[]>([])
  const [categorias, setCategorias] = useState<CategoriaPDV[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('todas')

  useEffect(() => {
    carregarDados()
  }, [])

  const carregarDados = async () => {
    try {
      setLoading(true)

      // Carregar categorias
      const { data: categoriasData, error: categoriasError } = await supabase
        .from('categorias')
        .select('id, nome, ordem')
        .eq('ativo', true)
        .order('ordem')

      if (categoriasError) throw categoriasError
      setCategorias(categoriasData || [])

      // Carregar produtos
      const { data: produtosData, error: produtosError } = await supabase
        .from('produtos')
        .select(`
          id,
          nome,
          preco_tradicional,
          preco_broto,
          categoria_id,
          tipo,
          categorias (nome)
        `)
        .eq('ativo', true)
        .order('nome')

      if (produtosError) throw produtosError

      const produtosFormatados: ProdutoPDV[] = (produtosData || []).map((p: any) => ({
        id: p.id,
        nome: p.nome,
        // Usar preco_tradicional como padrão, ou preco_broto se tradicional não existir
        preco: p.preco_tradicional || p.preco_broto || 0,
        categoria_id: p.categoria_id,
        categoria_nome: p.categorias?.nome || '',
        disponivel: true, // Produtos ativos são sempre disponíveis
        destaque: false
      }))

      setProdutos(produtosFormatados)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar produtos')
    } finally {
      setLoading(false)
    }
  }

  const produtosFiltrados = produtos.filter(produto => {
    const matchBusca = produto.nome.toLowerCase().includes(busca.toLowerCase())
    const matchCategoria = categoriaFiltro === 'todas' || produto.categoria_id === categoriaFiltro
    return matchBusca && matchCategoria
  })

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar produto..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={categoriaFiltro} onValueChange={setCategoriaFiltro}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas Categorias</SelectItem>
            {categorias.map(cat => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Grid de Produtos */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-20 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-6 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : produtosFiltrados.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">Nenhum produto encontrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {produtosFiltrados.map(produto => (
            <Card
              key={produto.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                !produto.disponivel ? 'opacity-50' : ''
              }`}
            >
              <CardContent className="p-4">
                <div className="space-y-2">
                  {/* Nome do Produto */}
                  <h3 className="font-semibold text-sm line-clamp-2 min-h-[40px]">
                    {produto.nome}
                  </h3>

                  {/* Categoria */}
                  {produto.categoria_nome && (
                    <Badge variant="secondary" className="text-xs">
                      {produto.categoria_nome}
                    </Badge>
                  )}

                  {/* Preço */}
                  <p className="text-lg font-bold text-green-600">
                    {formatCurrency(produto.preco)}
                  </p>

                  {/* Botão Adicionar */}
                  <Button
                    onClick={() => onAdicionarProduto(produto)}
                    disabled={!produto.disponivel}
                    className="w-full"
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar
                  </Button>

                  {/* Status */}
                  {!produto.disponivel && (
                    <p className="text-xs text-red-600 text-center">
                      Indisponível
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
