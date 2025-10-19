"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Minus, CreditCard, Banknote, Check, User, LogIn } from "lucide-react"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"
import { useCart } from "@/lib/cart-context"
import { useConfig } from "@/lib/config-context"
import { StoreInfoModal } from "@/components/store-info-modal"
import { CartFooter } from "@/components/cart-footer"
import { SocialFooter } from "@/components/social-footer"
import { HomepageCarousel } from "@/components/homepage-carousel"
import { formatCurrency } from "@/lib/currency-utils"
import { getUser } from "@/lib/auth-helpers"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface PizzariaConfig {
  id: string
  nome: string
  foto_capa: string | null
  foto_perfil: string | null
  taxa_entrega: number
  tempo_entrega_min: number
  tempo_entrega_max: number
  aceita_dinheiro: boolean
  aceita_cartao: boolean
  endereco: string | null
  telefone: string | null
  whatsapp: string | null
  horario_funcionamento: any
  descricao_pizzas?: string
}

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
  ordem: number
  ativo: boolean
  multi_sabores_habilitado?: boolean
}

// Função utilitária para formatar nome da pizza com sabores
const formatPizzaName = (sabores: string[]): string => {
  if (sabores.length === 1) {
    return sabores[0]
  } else {
    return `Pizza ${sabores.join(" + ")}`
  }
}

// Função para formatar sabores na exibição (checkout e WhatsApp)
const formatSaboresDisplay = (sabores: string[]): string => {
  if (sabores.length === 1) {
    return sabores[0]
  } else if (sabores.length === 2) {
    return `1/2 ${sabores[0]}\n1/2 ${sabores[1]}`
  } else {
    return sabores.join(", ")
  }
}

function HomePageContent() {
  const [loading, setLoading] = useState(true)
  const [config, setConfig] = useState<PizzariaConfig | null>(null)
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [opcoesSabores, setOpcoesSabores] = useState<any[]>([])
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({})
  const [hasError, setHasError] = useState(false)

  const [showStoreInfo, setShowStoreInfo] = useState(false)
  const [flavorMode, setFlavorMode] = useState<1 | 2 | 3>(1)
  const [selectedFlavorsForMulti, setSelectedFlavorsForMulti] = useState<Produto[]>([])
  // selectedSingleFlavor removido - marcação visual agora baseada no carrinho

  // Estados para seleção de tamanho por pizza
  const [selectedSizes, setSelectedSizes] = useState<{ [pizzaId: string]: "tradicional" | "broto" }>({})

  // Estado para autenticação do usuário
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userName, setUserName] = useState<string | null>(null)

  const { dispatch, state: cartState } = useCart()
  const { config: pizzariaConfig } = useConfig()
  const router = useRouter()

  // Função para verificar se uma pizza tem múltiplos tamanhos disponíveis
  const hasMultipleSizes = (pizza: Produto): boolean => {
    return !!(pizzariaConfig.habilitar_broto && 
           pizza.preco_tradicional && 
           pizza.preco_broto && 
           pizza.preco_broto > 0)
  }

  // Função para obter o preço baseado no tamanho selecionado
  const getPriceBySize = (pizza: Produto, size: "tradicional" | "broto"): number => {
    // Se o produto está em promoção, usar preços promocionais
    if (pizza.promocao) {
      return size === "broto" ? (pizza.preco_promocional_broto || 0) : (pizza.preco_promocional_tradicional || 0)
    }
    // Caso contrário, usar preços normais
    return size === "broto" ? (pizza.preco_broto || 0) : (pizza.preco_tradicional || 0)
  }

  // Função para obter o tamanho selecionado para uma pizza específica
  const getSelectedSize = (pizzaId: string): "tradicional" | "broto" => {
    return selectedSizes[pizzaId] || "tradicional"
  }

  // Função para atualizar o tamanho selecionado de uma pizza
  const updateSelectedSize = (pizzaId: string, size: "tradicional" | "broto") => {
    setSelectedSizes(prev => ({
      ...prev,
      [pizzaId]: size
    }))
  }

  // Função para calcular o status da pizzaria
  const getStoreStatus = () => {
    const now = new Date()
    const currentDay = now.getDay() // 0 = domingo, 1 = segunda, etc.
    const currentTime = now.getHours() * 60 + now.getMinutes() // minutos desde meia-noite
    
    // Mapear dia da semana para chave do horário
    const dayMap = {
      0: 'domingo',
      1: 'segunda', 
      2: 'terca',
      3: 'quarta',
      4: 'quinta',
      5: 'sexta',
      6: 'sabado'
    }
    
    const dayKey = dayMap[currentDay as keyof typeof dayMap]
    const todaySchedule = config?.horario_funcionamento?.[dayKey]
    
    if (!todaySchedule || todaySchedule.toLowerCase() === 'fechado') {
      return {
        isOpen: false,
        status: 'Fechado',
        nextInfo: null
      }
    }
    
    // Parse do horário (formato: "18:00-23:00")
    const scheduleMatch = todaySchedule.match(/(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})/)
    if (!scheduleMatch) {
      return {
        isOpen: false,
        status: 'Fechado',
        nextInfo: null
      }
    }
    
    const [, openHour, openMin, closeHour, closeMin] = scheduleMatch
    const openTime = parseInt(openHour) * 60 + parseInt(openMin)
    let closeTime = parseInt(closeHour) * 60 + parseInt(closeMin)
    
    // Se fecha depois da meia-noite (ex: 00:00), ajustar para próximo dia
    if (closeTime < openTime) {
      closeTime += 24 * 60
    }
    
    // Verificar se está aberto
    const isOpen = currentTime >= openTime && currentTime < closeTime
    
    if (isOpen) {
      // Está aberto - mostrar horário de fechamento
      const closeHourFormatted = closeTime >= 24 * 60 
        ? `${Math.floor((closeTime - 24 * 60) / 60).toString().padStart(2, '0')}:${(closeTime % 60).toString().padStart(2, '0')}`
        : `${Math.floor(closeTime / 60).toString().padStart(2, '0')}:${(closeTime % 60).toString().padStart(2, '0')}`
      
      return {
        isOpen: true,
        status: 'Aberto',
        nextInfo: `fecha às ${closeHourFormatted}`
      }
    } else {
      // Está fechado - verificar se deve mostrar horário de abertura
      const timeUntilOpen = openTime - currentTime
      const twoHoursInMinutes = 2 * 60
      
      if (timeUntilOpen > 0 && timeUntilOpen <= twoHoursInMinutes) {
        // Mostrar horário de abertura se faltar 2 horas ou menos
        const openHourFormatted = `${openHour.padStart(2, '0')}:${openMin.padStart(2, '0')}`
        return {
          isOpen: false,
          status: 'Fechado',
          nextInfo: `abre às ${openHourFormatted}`
        }
      } else {
        // Muito cedo ou muito tarde - só mostrar "Fechado"
        return {
          isOpen: false,
          status: 'Fechado',
          nextInfo: null
        }
      }
    }
  }

  const [storeStatus, setStoreStatus] = useState(getStoreStatus())

  useEffect(() => {
    loadData()
    checkAuthentication()

    // Listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session && session.user) {
        setIsAuthenticated(true)
        setUserName(session.user.user_metadata?.nome || session.user.email || "Usuário")
      } else {
        setIsAuthenticated(false)
        setUserName(null)
      }
    })

    // Cleanup: remover listener ao desmontar componente
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Verificar autenticação do usuário
  const checkAuthentication = async () => {
    try {
      // Verificar sessão do Supabase primeiro
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session && session.user) {
        // Usuário está autenticado
        const user = session.user
        setIsAuthenticated(true)
        setUserName(user.user_metadata?.nome || user.email || "Usuário")
      } else {
        // Usuário não está autenticado
        setIsAuthenticated(false)
        setUserName(null)
      }
    } catch (error) {
      // Em caso de erro, considerar não autenticado
      console.log("ℹ️ Erro ao verificar autenticação:", error)
      setIsAuthenticated(false)
      setUserName(null)
    }
  }

  // Atualizar status da pizzaria a cada minuto
  useEffect(() => {
    const updateStatus = () => {
      setStoreStatus(getStoreStatus())
    }
    
    // Atualizar imediatamente
    updateStatus()
    
    // Configurar interval para atualizar a cada minuto
    const interval = setInterval(updateStatus, 60000)
    
    return () => clearInterval(interval)
  }, [config]) // Observar config completo para detectar todas as mudanças

  // Processamento automático APENAS para múltiplos sabores (2 ou 3)
  useEffect(() => {
    // Remover do carrinho se ambos os sabores forem desmarcados (apenas para 2 sabores)
    if (flavorMode === 2 && selectedFlavorsForMulti.length === 0) {
      // Monta o id do item de 2 sabores que pode estar no carrinho
      const cartItemId = cartState.items.find(item => item.sabores.length === 2 && item.id.startsWith('multi-'))?.id
      if (cartItemId) {
        dispatch({ type: 'REMOVE_ITEM', payload: cartItemId })
      }
    }
  }, [flavorMode, selectedFlavorsForMulti, dispatch, cartState.items])

  const loadData = async () => {
    try {
      if (!isSupabaseConfigured()) {
        console.error("❌ Aplicação não configurada para produção")
        console.error("   Configure as variáveis de ambiente:")
        console.error("   NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY")
        setHasError(true)
        setLoading(false)
        return
      }

      console.log("🔄 Carregando dados de produção...")
      
      // Carregar dados do Supabase
      const [configResult, produtosResult, categoriasResult, opcoesResult] = await Promise.all([
        supabase.from("pizzaria_config").select("*").single(),
        supabase.from("produtos").select("*").eq("ativo", true).order("ordem"),
        supabase.from("categorias").select("*").eq("ativo", true).order("ordem"),
        supabase.from("opcoes_sabores").select("*").eq("ativo", true).order("ordem"),
      ])

      // Configuração da pizzaria é obrigatória
      if (configResult.error || !configResult.data) {
        console.error("❌ Erro: Configuração da pizzaria não encontrada")
        setHasError(true)
        setLoading(false)
        return
      }
      
      setConfig(configResult.data)
      console.log("✅ Configuração da pizzaria carregada")

      // Produtos são obrigatórios
      if (produtosResult.error || !produtosResult.data || produtosResult.data.length === 0) {
        console.error("❌ Erro: Nenhum produto encontrado no cardápio")
        setHasError(true)
        setLoading(false)
        return
      }
      
      setProdutos(produtosResult.data)
      console.log(`✅ ${produtosResult.data.length} produtos carregados`)

      // Categorias são opcionais - usar padrão se não existir
      if (categoriasResult.data && categoriasResult.data.length > 0) {
        setCategorias(categoriasResult.data)
        console.log(`✅ ${categoriasResult.data.length} categorias carregadas`)
      } else {
        console.warn("⚠️ Nenhuma categoria encontrada")
        setCategorias([])
      }

      // Opções de sabores - usar padrão se não existir
      if (opcoesResult.data && opcoesResult.data.length > 0) {
        setOpcoesSabores(opcoesResult.data)
        console.log(`✅ ${opcoesResult.data.length} opções de sabores carregadas`)
        
        // Verificar se o modo atual ainda está ativo
        const opcaoAtual = opcoesResult.data.find(o => o.maximo_sabores === flavorMode && o.ativo)
        if (!opcaoAtual) {
          // Se o modo atual não está ativo, voltar para 1 sabor
          setFlavorMode(1)
          setSelectedFlavorsForMulti([])
        }
      } else {
        console.warn("⚠️ Usando opções de sabores padrão")
        // Configuração padrão de sabores
        setOpcoesSabores([
          { id: "1", nome: "1 Sabor", maximo_sabores: 1, ordem: 1, ativo: true },
          { id: "2", nome: "2 Sabores", maximo_sabores: 2, ordem: 2, ativo: true },
          { id: "3", nome: "3 Sabores", maximo_sabores: 3, ordem: 3, ativo: true }
        ])
      }

      console.log("✅ Aplicação carregada com dados reais")
    } catch (error) {
      console.error("❌ Erro crítico ao carregar dados:", error)
      console.error("   Verifique a configuração do Supabase")
      setHasError(true)
    } finally {
      setLoading(false)
    }
  }

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const scrollToNextCategory = () => {
    // Expandir automaticamente a seção de bebidas primeiro
    setExpandedSections(prev => ({ ...prev, bebidas: true }))
    
    // Aguardar a expansão e depois fazer scroll suave
    setTimeout(() => {
      const bebidasSection = document.querySelector('[data-section="bebidas"]')
      if (bebidasSection) {
        // Calcular posição de scroll considerando o header fixo e botão do carrinho
        const headerHeight = 60 // altura aproximada do header
        const elementTop = bebidasSection.getBoundingClientRect().top + window.pageYOffset
        const targetPosition = elementTop - headerHeight - 20 // 20px de margem adicional
        
        window.scrollTo({ 
          top: targetPosition,
          behavior: 'smooth'
        })
      }
    }, 200) // Aguardar a animação de expansão
  }

  const handleSingleFlavorSelection = (pizza: Produto) => {
    // Para 1 sabor: verificar se já está no carrinho para toggle
    const tamanho = getSelectedSize(pizza.id)
    const itemId = `${pizza.id}-${tamanho}`
    
    // Verificar se o item já está no carrinho
    const existingItem = cartState.items.find(item => item.id === itemId)
    
    if (existingItem) {
      // Se já está no carrinho, remover
      dispatch({
        type: "REMOVE_ITEM",
        payload: itemId,
      })
    } else {
      // Se não está no carrinho, adicionar
      const preco = getPriceBySize(pizza, tamanho)
      
      dispatch({
        type: "ADD_ITEM",
        payload: {
          id: itemId,
          nome: pizza.nome,
          tamanho: tamanho,
          sabores: [pizza.nome],
          precoBase: preco,
          preco: preco,
          tipo: pizza.tipo,
        },
      })
    }
    
    // Reset da seleção visual
    setSelectedFlavorsForMulti([])
  }

  const handleMultiFlavorSelection = (pizza: Produto) => {
    // Para múltiplos sabores: comportamento de seleção toggle
    const isCurrentlySelected = selectedFlavorsForMulti.find(p => p.id === pizza.id)
    
    if (isCurrentlySelected) {
      // Remove APENAS o sabor clicado se já estiver selecionado
      const newSelection = selectedFlavorsForMulti.filter(p => p.id !== pizza.id)
      setSelectedFlavorsForMulti(newSelection)
      
      // Para 2 sabores: se removeu um sabor e ainda tem 1, remover a pizza do carrinho
      if (flavorMode === 2 && newSelection.length === 1) {
        // Encontrar e remover qualquer pizza de 2 sabores existente no carrinho
        const existingMultiItem = cartState.items.find(item => 
          item.sabores.length === 2 && item.id.startsWith('multi-')
        )
        if (existingMultiItem) {
          dispatch({ type: 'REMOVE_ITEM', payload: existingMultiItem.id })
        }
      }
    } else if (selectedFlavorsForMulti.length < flavorMode) {
      // Adiciona se ainda não atingiu o limite
      const newSelection = [...selectedFlavorsForMulti, pizza]
      setSelectedFlavorsForMulti(newSelection)
      
      // Se completou a seleção de sabores, adicionar ao carrinho
      if (newSelection.length === flavorMode) {
        // Para 2 sabores: primeiro remover qualquer pizza de 2 sabores existente
        if (flavorMode === 2) {
          const existingMultiItem = cartState.items.find(item => 
            item.sabores.length === 2 && item.id.startsWith('multi-')
          )
          if (existingMultiItem) {
            dispatch({ type: 'REMOVE_ITEM', payload: existingMultiItem.id })
          }
        }
        
        // Para múltiplos sabores, usar o primeiro tamanho comum ou tradicional como padrão
        const tamanhosSelecionados = newSelection.map(p => getSelectedSize(p.id))
        const tamanhoComum = tamanhosSelecionados.every(t => t === tamanhosSelecionados[0]) 
          ? tamanhosSelecionados[0] 
          : "tradicional"
        
        const prices = newSelection.map(p => getPriceBySize(p, tamanhoComum))
        const preco = Math.max(...prices)
        const sabores = newSelection.map(p => p.nome)
        const nomeItem = formatPizzaName(sabores)
        // Usar IDs únicos dos produtos em vez de nomes para evitar conflitos entre categorias
        const pizzaIds = newSelection.map(p => p.id).sort()
        const itemId = `multi-${pizzaIds.join("-")}-${tamanhoComum}`
        
        // Adicionar a nova pizza ao carrinho
        dispatch({
          type: "ADD_ITEM",
          payload: {
            id: itemId,
            nome: nomeItem,
            tamanho: tamanhoComum,
            sabores: sabores,
            precoBase: preco,
            preco: preco,
            tipo: newSelection[0].tipo,
          },
        })
      }
    }
  }

  const handlePizzaSelection = (pizza: Produto) => {
    if (flavorMode === 1) {
      handleSingleFlavorSelection(pizza)
    } else {
      handleMultiFlavorSelection(pizza)
    }
  }

  const handleAddToCart = () => {
    if (selectedFlavorsForMulti.length !== flavorMode) return

    // Para múltiplos sabores, usar o primeiro tamanho comum ou tradicional como padrão
    const tamanhosSelecionados = selectedFlavorsForMulti.map(pizza => getSelectedSize(pizza.id))
    const tamanho = tamanhosSelecionados.every(t => t === tamanhosSelecionados[0]) 
      ? tamanhosSelecionados[0] 
      : "tradicional"

    // Calcula o maior preço entre os sabores selecionados usando o tamanho determinado
    const prices = selectedFlavorsForMulti.map(pizza => 
      getPriceBySize(pizza, tamanho)
    )
    const preco = Math.max(...prices)

    const sabores = selectedFlavorsForMulti.map(p => p.nome)
    const nomeItem = formatPizzaName(sabores)

    // Para múltiplos sabores, usar IDs únicos dos produtos em vez de nomes
    const itemId = flavorMode === 1 
      ? `${selectedFlavorsForMulti[0].id}-${tamanho}` 
      : `multi-${selectedFlavorsForMulti.map(p => p.id).sort().join("-")}-${tamanho}`

    dispatch({
      type: "ADD_ITEM",
      payload: {
        id: itemId,
        nome: nomeItem,
        tamanho: tamanho,
        sabores: sabores,
        precoBase: preco,
        preco: preco,
        tipo: selectedFlavorsForMulti[0].tipo,
      },
    })

    // Reset das seleções apenas para 1 sabor (múltiplos sabores mantêm seleção)
    if (flavorMode === 1) {
      setSelectedFlavorsForMulti([])
    }
  }

  // Função genérica para adicionar/remover produtos de outras categorias (não pizzas)
  const handleToggleProductInCart = (produto: Produto) => {
    // Verificar se o item já está no carrinho
    const isInCart = cartState.items.some(item => item.id === produto.id)
    
    if (isInCart) {
      // Se já está no carrinho, remover
      dispatch({
        type: "REMOVE_ITEM",
        payload: produto.id,
      })
    } else {
      // Se não está no carrinho, adicionar
      const precoFinal = produto.promocao ? (produto.preco_promocional_tradicional || 0) : (produto.preco_tradicional || 0)
      dispatch({
        type: "ADD_ITEM",
        payload: {
          id: produto.id,
          nome: produto.nome,
          tamanho: "tradicional", // Produtos não-pizza não têm variação de tamanho
          sabores: [produto.nome],
          precoBase: precoFinal,
          preco: precoFinal,
          tipo: produto.tipo,
        },
      })
    }
  }

  // Função específica para bebidas (mantida para compatibilidade)
  const handleAddBebidaToCart = (bebida: Produto) => {
    handleToggleProductInCart(bebida)
  }

  // Função para renderizar produtos de outras categorias com estilo consistente
  const renderCategoryProducts = (produtos: Produto[], categoryName: string) => {
    return produtos.map((produto) => {
      const isInCart = cartState.items.some(item => item.id === produto.id)
      
      return (
        <div
          key={produto.id}
          className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
            isInCart
              ? "bg-red-50 border-red-300 hover:border-red-400"
              : "border-gray-200 hover:bg-gray-50 hover:border-gray-300"
          }`}
          onClick={() => handleToggleProductInCart(produto)}
        >
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">{produto.nome}</h3>
              {produto.promocao && (
                <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded">
                  PROMOÇÃO BALCÃO
                </span>
              )}
            </div>
            {produto.descricao && <p className="text-sm text-gray-600 mt-1">{produto.descricao}</p>}
            
            {/* Verificar se o produto tem múltiplos tamanhos */}
            {hasMultipleSizes(produto) ? (
              <div className="flex items-center space-x-4 mt-2">
                <span className="text-sm text-black font-bold">
                  Broto: {formatCurrency(produto.promocao ? produto.preco_promocional_broto : produto.preco_broto)}
                </span>
                <span className="text-sm font-bold text-black">
                  Tradicional: {formatCurrency(produto.promocao ? produto.preco_promocional_tradicional : produto.preco_tradicional)}
                </span>
              </div>
            ) : (
              <div className="flex items-center space-x-4 mt-2">
                {pizzariaConfig.habilitar_broto && produto.preco_broto && (
                  <span className="text-sm text-black font-bold">
                    Broto: {formatCurrency(produto.promocao ? produto.preco_promocional_broto : produto.preco_broto)}
                  </span>
                )}
                {produto.preco_tradicional && (
                  <span className="text-sm font-bold text-red-600">
                    {produto.preco_broto ? 'Tradicional: ' : ''}{formatCurrency(produto.promocao ? produto.preco_promocional_tradicional : produto.preco_tradicional)}
                  </span>
                )}
              </div>
            )}
          </div>
          {isInCart ? (
            <div className="w-6 h-6 rounded border-2 flex items-center justify-center transition-all border-red-500 bg-red-500">
              <Check className="w-4 h-4 text-white" />
            </div>
          ) : (
            <Plus className="w-5 h-5 text-red-600" />
          )}
        </div>
      )
    })
  }

  // Organizar produtos por categoria real do banco de dados
  const produtosPorCategoria = categorias.reduce((acc, categoria) => {
    const produtosDaCategoria = produtos.filter(p => p.categoria_id === categoria.id)
    if (produtosDaCategoria.length > 0) {
      acc[categoria.id] = {
        categoria,
        produtos: produtosDaCategoria
      }
    }
    return acc
  }, {} as Record<string, { categoria: any, produtos: Produto[] }>)

  // Bebidas continuam sendo filtradas por tipo (para compatibilidade)
  const bebidas = produtos.filter((p) => p.tipo === "bebida")

  // Organizar todas as categorias por ordem para renderização
  const categoriasOrdenadas = categorias
    .sort((a, b) => a.ordem - b.ordem)
    .map(categoria => ({
      categoria,
      produtos: produtosPorCategoria[categoria.id]?.produtos || []
    }))
    .filter(({ produtos }) => produtos.length > 0)

  // Tela de carregamento
  if (loading) {
    return (
      <div className="max-w-md mx-auto bg-white min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="text-gray-600">Carregando cardápio...</p>
        </div>
      </div>
    )
  }

  // Tela de erro
  if (hasError || !config || produtos.length === 0) {
    return (
      <div className="max-w-md mx-auto bg-white min-h-screen flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <div className="text-6xl mb-4">🍕</div>
          <h2 className="text-xl font-semibold text-gray-900">Cardápio Indisponível</h2>
          <p className="text-gray-600 text-sm">
            Não foi possível carregar os dados da pizzaria.
          </p>
          <p className="text-gray-500 text-xs">
            Entre em contato pelo telefone ou tente novamente mais tarde.
          </p>
          <button 
            onClick={() => {
              setHasError(false)
              setLoading(true)
              loadData()
            }}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    )
  }

  return (
      <div className="min-h-screen flex flex-col bg-gray-50 scroll-smooth">
        {/* Header com foto de capa e perfil */}
        <div className="relative flex-shrink-0">
          <div
            className="h-48 bg-cover bg-center"
            style={{ backgroundImage: `url(${config?.foto_capa || "/placeholder.jpg"})` }}
          />
          <div className="absolute -bottom-12 left-4">
            <img
              src={config?.foto_perfil || "/placeholder-logo.png"}
              alt="Logo da pizzaria"
              className="w-24 h-24 rounded-lg border-4 border-white shadow-lg object-cover"
            />
          </div>
        </div>

        <div className="relative px-4 pt-6 pb-4 flex-shrink-0">
          <h1 className="text-2xl font-bold text-gray-900 ml-32">{config?.nome}</h1>
        </div>

        {/* Menu horizontal com informações */}
        <div className="px-4 py-4 bg-white border-b flex-shrink-0">
          <div className="flex items-center justify-between w-full flex-wrap gap-y-3">
            {/* Status da Pizzaria (dinâmico) */}
            <div className="w-auto mr-4 flex-shrink-0">
              <div className={`
                px-3 py-1 rounded-full border transition-all duration-200 shadow-sm font-medium text-sm
                ${storeStatus.isOpen 
                  ? "bg-green-100 border-green-300" 
                  : "bg-red-100 border-red-300"
                }
              `}>
                <div className="text-center min-w-0">
                  <div className={`leading-tight ${
                    storeStatus.isOpen 
                      ? "text-green-700" 
                      : "text-red-700"
                  }`}>
                    {storeStatus.status}
                  </div>
                  {storeStatus.nextInfo && (
                    <div className={`text-xs leading-tight mt-0.5 ${
                      storeStatus.isOpen 
                        ? "text-green-700/70" 
                        : "text-red-700/70"
                    }`}>
                      {storeStatus.nextInfo}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Grupos de informações centrais */}
            <div className="flex items-center space-x-4 md:space-x-6 flex-1 justify-center min-w-0">
              {/* Tempo de Entrega */}
              <div className="flex flex-col items-center flex-shrink-0">
                <div className="text-sm font-medium text-gray-900">
                  {config?.tempo_entrega_min}–{config?.tempo_entrega_max}
                </div>
                <div className="text-xs text-gray-600">minutos</div>
              </div>

              {/* Formas de Pagamento */}
              <div className="flex flex-col items-center flex-shrink-0">
                <div className="flex justify-center items-center gap-x-1 mb-1">
                  {config?.aceita_dinheiro && <Banknote className="w-4 h-4 text-gray-700" />}
                  {config?.aceita_cartao && <CreditCard className="w-4 h-4 text-gray-700" />}
                </div>
                <div className="text-xs text-gray-600">pagamento</div>
              </div>

              {/* Menu de Perfil do Usuário */}
              <div className="flex flex-col items-center flex-shrink-0">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <User className="h-4 w-4 text-gray-700" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {isAuthenticated ? (
                      <>
                        <DropdownMenuLabel className="font-normal">
                          <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">{userName}</p>
                            <p className="text-xs leading-none text-muted-foreground">
                              Cliente
                            </p>
                          </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => router.push("/perfil")}>
                          <User className="mr-2 h-4 w-4" />
                          Meu Perfil
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push("/meus-pedidos")}>
                          <Check className="mr-2 h-4 w-4" />
                          Meus Pedidos
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={async () => {
                            await supabase.auth.signOut()
                            setIsAuthenticated(false)
                            setUserName(null)
                            router.push("/")
                          }}
                          className="text-red-600"
                        >
                          <LogIn className="mr-2 h-4 w-4" />
                          Sair
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <>
                        <DropdownMenuItem onClick={() => router.push("/login")}>
                          <LogIn className="mr-2 h-4 w-4" />
                          Fazer Login
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push("/cadastro")}>
                          <User className="mr-2 h-4 w-4" />
                          Criar Conta
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
                <div className="text-xs text-gray-600">perfil</div>
              </div>
            </div>

            {/* Botão de ação fixado à direita */}
            <Button variant="outline" size="sm" onClick={() => setShowStoreInfo(true)} className="ml-auto flex-shrink-0">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Container principal flexível */}
        <div className="flex flex-col justify-between grow">
          {/* Cardápio - área de conteúdo principal */}
          <div className="px-4 py-4 space-y-4">
          {/* Carousel */}
          <HomepageCarousel />

          {/* Renderizar todas as categorias na ordem definida no banco */}
          {categoriasOrdenadas.map(({ categoria, produtos }) => {
            // Categorias com multi-sabores têm renderização especial
            if (categoria.multi_sabores_habilitado) {
              return (
                <Card key={categoria.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection(categoria.nome.toLowerCase())}>
                      <h2 className="text-lg font-semibold">{categoria.nome}</h2>
                      {expandedSections[categoria.nome.toLowerCase()] ? <Minus className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                    </div>

                    {expandedSections[categoria.nome.toLowerCase()] && (
                      <div className="mt-4 space-y-4">
                        <div className="text-sm text-gray-600">
                          {categoria.descricao || `Produtos da categoria ${categoria.nome} com seleção múltipla de sabores`}
                        </div>
                        <div className="text-sm text-green-600 font-semibold">
                          Você pode escolher até {Math.max(...opcoesSabores.filter(o => o.ativo).map(o => o.maximo_sabores))} sabores
                        </div>

                        {/* Botões de seleção de sabores dinamicos */}
                        <div className="flex space-x-3">
                          {opcoesSabores.filter(opcao => opcao.ativo).map((opcao, index) => {
                            // Função para obter o caminho da imagem baseado na quantidade de sabores
                            const getImagePath = (maxSabores: number) => {
                              switch (maxSabores) {
                                case 1:
                                  return "/images/sabores/1sabor.svg"
                                case 2:
                                  return "/images/sabores/2sabores.svg"
                                case 3:
                                  return "/images/sabores/3sabores.svg"
                                default:
                                  return "/images/sabores/1sabor.svg"
                              }
                            }

                            return (
                              <Button
                                key={opcao.id}
                                variant="outline"
                                className={`flex-1 h-20 flex flex-col items-center justify-center bg-transparent transition-all duration-200 hover:shadow-md ${
                                  flavorMode === opcao.maximo_sabores 
                                    ? "border-teal-500 bg-teal-50 shadow-lg" 
                                    : "border-gray-300 hover:border-gray-400"
                                }`}
                                onClick={() => {
                                  setFlavorMode(opcao.maximo_sabores as 1 | 2 | 3)
                                  setSelectedFlavorsForMulti([])
                                  // selectedSingleFlavor removido - marcação visual agora baseada no carrinho
                                }}
                              >
                                <div className="w-8 h-8 mb-2 flex-shrink-0 flex items-center justify-center relative">
                                  <Image
                                    src={getImagePath(opcao.maximo_sabores)}
                                    alt={`${opcao.maximo_sabores} sabor${opcao.maximo_sabores > 1 ? 'es' : ''}`}
                                    width={32}
                                    height={32}
                                    className={`object-contain transition-all duration-200 ${
                                      flavorMode === opcao.maximo_sabores 
                                        ? "scale-110 brightness-110" 
                                        : "opacity-80 hover:opacity-100"
                                    }`}
                                    priority={opcao.maximo_sabores <= 2} // Priorizar carregamento dos ícones mais comuns
                                  />
                                </div>
                                <span className={`text-xs font-medium transition-colors duration-200 ${
                                  flavorMode === opcao.maximo_sabores 
                                    ? "text-teal-700" 
                                    : "text-gray-600"
                                }`}>
                                  {opcao.maximo_sabores}
                                </span>
                              </Button>
                            )
                          })}
                        </div>

                        {/* Lista de produtos */}
                        <div className="space-y-3">
                          {produtos
                            .sort((a, b) => a.ordem - b.ordem) // Garantir ordenação por ordem
                            .map((pizza, index) => {
                            const isSelected = selectedFlavorsForMulti.find(p => p.id === pizza.id)
                            const isDisabled = selectedFlavorsForMulti.length >= flavorMode && !isSelected
                            // Para 1 sabor: verificar se a pizza está no carrinho usando ID único
                            const tamanho = getSelectedSize(pizza.id)
                            const expectedItemId = `${pizza.id}-${tamanho}`
                            const isSingleFlavorSelected = flavorMode === 1 && cartState.items.some(item => 
                              item.id === expectedItemId
                            )
                            const pizzaNumber = index + 1 // Numeração sequencial baseada na posição ordenada
                            
                            return (
                              <div
                                key={pizza.id}
                                className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                                  flavorMode === 1
                                    ? isSingleFlavorSelected
                                      ? "cursor-pointer bg-red-50 border-red-300 hover:border-red-400"
                                      : "cursor-pointer hover:bg-gray-50 border-gray-200 hover:border-gray-300"
                                    : flavorMode > 1 
                                      ? (isSelected 
                                          ? "border-red-500 bg-red-50" 
                                          : isDisabled 
                                            ? "border-gray-200 opacity-50 cursor-not-allowed"
                                            : "border-gray-200 hover:border-gray-300 cursor-pointer")
                                      : "cursor-pointer hover:bg-gray-50"
                                }`}
                                onClick={() => {
                                  if (!isDisabled) {
                                    handlePizzaSelection(pizza)
                                  }
                                }}
                              >
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <h3 className="font-bold text-red-600">{pizzaNumber}. {pizza.nome}</h3>
                                    {pizza.tipo === "doce" && (
                                      <Badge variant="secondary" className="text-xs">
                                        Doce
                                      </Badge>
                                    )}
                                  </div>
                                  {pizza.promocao && (
                                    <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded">
                                      PROMOÇÃO BALCÃO
                                    </span>
                                  )}
                                </div>
                                {pizza.descricao && <p className="text-sm text-gray-600 mt-1">{pizza.descricao}</p>}
                                
                                {/* Seleção de tamanho inline */}
                                {hasMultipleSizes(pizza) ? (
                                  <div className="mt-3">
                                    <div className="flex space-x-2">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          updateSelectedSize(pizza.id, "tradicional")
                                        }}
                                        className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                                          getSelectedSize(pizza.id) === "tradicional"
                                            ? "border-green-500 bg-green-50 text-green-700"
                                            : "border-gray-300 bg-white text-gray-600 hover:border-gray-400"
                                        }`}
                                      >
                                        <div className="text-center">
                                          <div className="font-semibold">Tradicional</div>
                                          <div className="text-xs opacity-75">8 fatias</div>
                                          <div className="font-bold text-black mt-1">
                                            {formatCurrency(pizza.promocao ? pizza.preco_promocional_tradicional : pizza.preco_tradicional)}
                                          </div>
                                        </div>
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          updateSelectedSize(pizza.id, "broto")
                                        }}
                                        className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                                          getSelectedSize(pizza.id) === "broto"
                                            ? "border-green-500 bg-green-50 text-green-700"
                                            : "border-gray-300 bg-white text-gray-600 hover:border-gray-400"
                                        }`}
                                      >
                                        <div className="text-center">
                                          <div className="font-semibold">Broto</div>
                                          <div className="text-xs opacity-75">4 fatias</div>
                                          <div className="font-bold text-black mt-1">
                                            {formatCurrency(pizza.promocao ? pizza.preco_promocional_broto : pizza.preco_broto)}
                                          </div>
                                        </div>
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center space-x-4 mt-2">
                                    {pizzariaConfig.habilitar_broto && pizza.preco_broto && (
                                      <span className="text-sm text-black font-bold">
                                        Broto: {formatCurrency(pizza.promocao ? pizza.preco_promocional_broto : pizza.preco_broto)}
                                      </span>
                                    )}
                                    {pizza.preco_tradicional && (
                                      <span className="text-sm font-bold text-black">
                                        Tradicional: {formatCurrency(pizza.promocao ? pizza.preco_promocional_tradicional : pizza.preco_tradicional)}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                              
                              {flavorMode > 1 && (
                                <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ml-4 ${
                                  isSelected
                                    ? "border-red-500 bg-red-500"
                                    : "border-red-500"
                                }`}>
                                  {isSelected && (
                                    <Check className="w-4 h-4 text-white" />
                                  )}
                                </div>
                              )}
                              
                              {flavorMode === 1 && (
                                <Plus className="w-5 h-5 text-red-600" />
                              )}
                              </div>
                            )
                          })}
                        </div>

                        {/* Resumo dos sabores selecionados - APENAS para múltiplos sabores */}
                        {flavorMode > 1 && selectedFlavorsForMulti.length === flavorMode && (
                          <div className="space-y-3 pt-4 border-t bg-green-50 rounded-lg p-4 mx-2">
                            <div className="text-center">
                              <div className="text-sm text-red-600 mb-2 font-medium">
                                Sabores selecionados: {selectedFlavorsForMulti.map(p => p.nome).join(" + ")}
                              </div>
                              <div className="text-sm text-green-600 font-bold">
                                ✓ Pizza adicionada ao carrinho!
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            }

            // Bebidas e outras categorias têm renderização padrão
            const sectionKey = categoria.nome.toLowerCase().replace(/\s+/g, '-')
            
            return (
              <Card key={categoria.id} data-section={sectionKey}>
                <CardContent className="p-4">
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => toggleSection(sectionKey)}
                  >
                    <h2 className="text-lg font-semibold">{categoria.nome}</h2>
                    {expandedSections[sectionKey] ? <Minus className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                  </div>

                  {expandedSections[sectionKey] && (
                    <div className="mt-4 space-y-3">
                      {categoria.descricao && (
                        <div className="text-sm text-gray-600 mb-3">
                          {categoria.descricao}
                        </div>
                      )}
                      {renderCategoryProducts(produtos, categoria.nome)}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
          </div>

          {/* Modals */}
          {config && <StoreInfoModal isOpen={showStoreInfo} onClose={() => setShowStoreInfo(false)} config={config} />}

          {/* Rodapé com redes sociais - sticky ao final do conteúdo */}
          <div className="mt-auto">
            <SocialFooter hasCartItems={cartState.items.length > 0} />
          </div>
        </div>

        {/* Carrinho fixo no rodapé */}
        <CartFooter />
      </div>
  )
}

export default function HomePage() {
  return <HomePageContent />
}
