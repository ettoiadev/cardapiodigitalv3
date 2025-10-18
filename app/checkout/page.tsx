"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, ShoppingBag, MapPin, Phone, User, CreditCard, DollarSign, Smartphone, Loader2, Plus, Minus, QrCode, Banknote, UtensilsCrossed, Bike, Pizza, MessageCircle, ScanLine, Wallet, ArrowDownToLine, ChevronUp, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { useCart } from "@/lib/cart-context"
import { useConfig } from "@/lib/config-context"
import { formatCurrency } from "@/lib/currency-utils"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"

interface StoreConfig {
  nome: string
  whatsapp: string | null
  taxa_entrega: number
  valor_minimo: number
  aceita_dinheiro?: boolean
  aceita_cartao?: boolean
  aceita_pix?: boolean
  aceita_ticket_alimentacao?: boolean
  habilitar_bordas_recheadas?: boolean
  habilitar_broto?: boolean
}

interface AddressData {
  logradouro: string
  bairro: string
  localidade: string
  uf: string
}

interface Adicional {
  nome: string
  preco: number
}

interface Produto {
  id: string
  nome: string
  descricao: string | null
  preco_tradicional: number | null
  preco_broto: number | null
  preco_promocional_tradicional: number | null
  preco_promocional_broto: number | null
  tipo: string
  ativo: boolean
  promocao: boolean
  adicionais?: Adicional[]
}

interface BordaRecheada {
  id: string
  nome: string
  preco: number
  ativo: boolean
  ordem: number
}

export default function CheckoutPage() {
  const router = useRouter()
  const { state, dispatch } = useCart()
  const { config } = useConfig()
  
  // Estados principais
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [storeConfig, setStoreConfig] = useState<StoreConfig | null>(null)
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [bordasRecheadas, setBordasRecheadas] = useState<BordaRecheada[]>([])
  
  // Tipo de entrega
  const [deliveryType, setDeliveryType] = useState<"balcao" | "delivery">("balcao")
  
  // Toast para promoção
  const [showPromocaoToast, setShowPromocaoToast] = useState(false)
  
  // Dados do cliente
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [customerCep, setCep] = useState("")
  const [addressData, setAddressData] = useState<AddressData | null>(null)
  const [addressNumber, setAddressNumber] = useState("")
  const [addressComplement, setAddressComplement] = useState("")
  const [deliveryNotes, setDeliveryNotes] = useState("")
  const [searchingCep, setSearchingCep] = useState(false)
  const [cepError, setCepError] = useState("")
  
  // Observações e pagamento
  const [orderNotes, setOrderNotes] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "dinheiro" | "debito" | "credito" | "ticket_alimentacao">("pix")
  
    // Carregar configurações da loja e produtos
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([loadStoreConfig(), loadProdutos(), loadBordasRecheadas()])
    }
    loadData()
  }, [])

  // Ajustar método de pagamento baseado nas configurações disponíveis
  useEffect(() => {
    if (storeConfig) {
      // Verificar se o método atual está habilitado
      const isCurrentMethodEnabled = 
        (paymentMethod === "pix" && storeConfig.aceita_pix) ||
        (paymentMethod === "dinheiro" && storeConfig.aceita_dinheiro) ||
        ((paymentMethod === "debito" || paymentMethod === "credito") && storeConfig.aceita_cartao) ||
        (paymentMethod === "ticket_alimentacao" && storeConfig.aceita_ticket_alimentacao)

      if (!isCurrentMethodEnabled) {
        // Definir o primeiro método disponível
        if (storeConfig.aceita_pix) {
          setPaymentMethod("pix")
        } else if (storeConfig.aceita_dinheiro) {
          setPaymentMethod("dinheiro")
        } else if (storeConfig.aceita_cartao) {
          setPaymentMethod("debito")
        } else if (storeConfig.aceita_ticket_alimentacao) {
          setPaymentMethod("ticket_alimentacao")
        }
      }
    }
  }, [storeConfig, paymentMethod])
  
  // Verificar carrinho vazio e redirecionar se necessário
  useEffect(() => {
    if (!loading && (!state.items || state.items.length === 0)) {
      // Aguardar um momento antes de redirecionar para evitar conflitos
      const timer = setTimeout(() => {
        router.push("/")
      }, 500)
      
      return () => clearTimeout(timer)
    }
  }, [state.items?.length, router, loading])

  const loadStoreConfig = async () => {
    try {
      if (!isSupabaseConfigured()) {
        // Mock data para desenvolvimento quando Supabase não está configurado
        console.warn("⚠️ Supabase não configurado. Usando dados de teste.")
        setStoreConfig({
          nome: "Pizzaria Teste",
          whatsapp: "5511999999999",
          taxa_entrega: 5.00,
          valor_minimo: 25.00,
          aceita_dinheiro: true,
          aceita_cartao: true,
          aceita_pix: true,
          aceita_ticket_alimentacao: false,
          habilitar_bordas_recheadas: true,
          habilitar_broto: true
        })
        return
      }

      const { data, error } = await supabase
        .from("pizzaria_config")
        .select("nome, whatsapp, taxa_entrega, valor_minimo, aceita_dinheiro, aceita_cartao, aceita_pix, aceita_ticket_alimentacao, habilitar_bordas_recheadas, habilitar_broto")
        .single()
      
      if (error || !data) {
        console.error("❌ Erro: Configuração da loja não encontrada")
        console.error("   Configure os dados da pizzaria no painel administrativo")
        // Fallback para dados de teste
        setStoreConfig({
          nome: "Pizzaria Configuração Pendente",
          whatsapp: "5511999999999",
          taxa_entrega: 5.00,
          valor_minimo: 25.00,
          aceita_dinheiro: true,
          aceita_cartao: true,
          aceita_pix: true,
          aceita_ticket_alimentacao: false,
          habilitar_bordas_recheadas: true,
          habilitar_broto: true
        })
        return
      }

      // Validar dados obrigatórios
      if (!data.nome || !data.whatsapp) {
        console.error("❌ Erro: Dados básicos da pizzaria (nome/WhatsApp) não configurados")
        // Aplicar fallbacks para campos ausentes
        const configComFallback = {
          ...data,
          nome: data.nome || "Pizzaria",
          whatsapp: data.whatsapp || "5511999999999"
        }
        setStoreConfig(configComFallback)
        return
      }

      setStoreConfig(data)
      console.log("✅ Configuração da loja carregada")
    } catch (error) {
      console.error("❌ Erro ao conectar com o banco de dados:", error)
      // Fallback para desenvolvimento
      setStoreConfig({
        nome: "Pizzaria Erro Conexão",
        whatsapp: "5511999999999",
        taxa_entrega: 5.00,
        valor_minimo: 25.00,
        aceita_dinheiro: true,
        aceita_cartao: true,
        aceita_pix: true,
        aceita_ticket_alimentacao: false,
        habilitar_bordas_recheadas: true,
        habilitar_broto: true
      })
    }
  }

  const loadProdutos = async () => {
    try {
      if (isSupabaseConfigured()) {
        const { data } = await supabase
          .from("produtos")
          .select("*")
          .eq("ativo", true)
          .order("ordem")
        
        if (data) {
          setProdutos(data)
        }
      }
    } catch (error) {
      console.error("Erro ao carregar produtos:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadBordasRecheadas = async () => {
    try {
      if (isSupabaseConfigured()) {
        const { data } = await supabase
          .from("bordas_recheadas")
          .select("*")
          .eq("ativo", true)
          .order("ordem")
        
        if (data) {
          setBordasRecheadas(data)
        }
      }
    } catch (error) {
      console.error("Erro ao carregar bordas recheadas:", error)
    }
  }

  // Função para verificar se há pizzas em promoção no carrinho
  const hasPromocaoPizzas = () => {
    return state.items?.some(item => {
      // Usar a mesma lógica da função isItemPromocao
      return isItemPromocao(item.id)
    }) || false
  }

  // Função para verificar se um item específico está em promoção
  const isItemPromocao = (itemId: string) => {
    // Para pizzas de 1 sabor: ID no carrinho é {produto.id}-{tamanho}
    if (itemId.includes('-tradicional') || itemId.includes('-broto')) {
      const produtoId = itemId.replace(/-tradicional$|-broto$/, '')
      const produto = produtos.find(p => p.id === produtoId)
      return produto?.promocao === true
    }
    
    // Para pizzas múltiplos sabores: ID no carrinho é multi-{productIds}-{tamanho}
    if (itemId.startsWith('multi-')) {
      // Extrair IDs dos produtos do ID do carrinho
      const productIdsString = itemId.replace(/^multi-/, '').replace(/-tradicional$|-broto$/, '')
      const productIds = productIdsString.split('-')
      
      // Verificar se algum dos produtos está em promoção usando IDs únicos
      const temPromocao = productIds.some(productId => {
        const produto = produtos.find(p => p.id === productId)
        return produto?.promocao === true
      })
      return temPromocao
    }
    
    // Para bebidas e outros produtos: ID no carrinho é igual ao ID do produto
    const produto = produtos.find(p => p.id === itemId)
    return produto?.promocao === true
  }

  // Função para lidar com a seleção de delivery
  const handleDeliveryTypeChange = (type: "balcao" | "delivery") => {
    if (type === "delivery" && hasPromocaoPizzas()) {
      setShowPromocaoToast(true)
      return
    }
    setDeliveryType(type)
  }
  
  // Buscar CEP
  const searchCep = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, "")
    
    if (cleanCep.length !== 8) {
      setCepError("CEP deve ter 8 dígitos")
      return
    }
    
    setSearchingCep(true)
    setCepError("")
    
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
      const data = await response.json()
      
      if (data.erro) {
        setCepError("CEP não encontrado")
        setAddressData(null)
      } else {
        setAddressData(data)
        setCepError("")
      }
    } catch (error) {
      setCepError("Erro ao buscar CEP")
      setAddressData(null)
    } finally {
      setSearchingCep(false)
    }
  }
  
  // Máscara de CEP
  const handleCepChange = (value: string) => {
    const masked = value
      .replace(/\D/g, "")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .slice(0, 9)
    
    setCep(masked)
    
    if (masked.replace(/\D/g, "").length === 8) {
      searchCep(masked)
    } else {
      setAddressData(null)
      setCepError("")
    }
  }
  
  // Máscara de telefone
  const handlePhoneChange = (value: string) => {
    const masked = value
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .slice(0, 15)
    
    setCustomerPhone(masked)
  }
  
  // Validar formulário
  const isFormValid = () => {
    if (deliveryType === "delivery") {
      const validacoes = {
        nome: customerName.trim() !== "",
        telefone: customerPhone.replace(/\D/g, "").length >= 10,
        cep: customerCep.replace(/\D/g, "").length === 8,
        endereco: addressData !== null,
        numero: addressNumber.trim() !== ""
      }
      
      console.log("📝 Validação delivery:", validacoes)
      
      return (
        validacoes.nome &&
        validacoes.telefone &&
        validacoes.cep &&
        validacoes.endereco &&
        validacoes.numero
      )
    } else {
      const validacoes = {
        nome: customerName.trim() !== "",
        telefone: customerPhone.replace(/\D/g, "").length >= 10
      }
      
      // console.log("📝 Validação balcão:", validacoes) // Log removido para evitar spam
      
      // Para retirada no balcão: apenas nome e telefone são obrigatórios
      return (
        validacoes.nome &&
        validacoes.telefone
      )
    }
  }
  
  // Gerar mensagem para WhatsApp
  const generateWhatsAppMessage = () => {
    const deliveryFee = deliveryType === "delivery" ? (storeConfig?.taxa_entrega || 0) : 0
    const subtotal = state.total || 0
    const total = subtotal + deliveryFee
    
    let message = `*NOVO PEDIDO - ${storeConfig?.nome}*\n\n`
    
    // Resumo dos itens com formatação melhorada
    message += `📋 *ITENS DO PEDIDO:*\n\n`
    state.items?.forEach((item) => {
      // Emoji baseado no tipo de item
      const emoji = item.tipo === "bebida" ? "🥤" : "🍕"
      
      // Linha principal do item com quantidade clara
      message += `${emoji} ${item.quantidade}x ${item.nome}`
      
      // Mostrar tamanho se for pizza
      if (item.tipo !== "bebida") {
        message += ` - ${item.tamanho === "broto" ? "Broto" : "Tradicional"}`
      }
      message += `\n`
      
      // Mostrar sabores se for pizza com múltiplos sabores (não mostrar para bebidas)
      if (item.sabores && item.sabores.length > 0 && item.tipo !== "bebida") {
        if (item.sabores.length === 1) {
          message += `  • Sabor: ${item.sabores[0]}\n`
        } else if (item.sabores.length === 2) {
          message += `  • Sabores:\n    1/2 ${item.sabores[0]}\n    1/2 ${item.sabores[1]}\n`
        } else {
          message += `  • Sabores: ${item.sabores.join(', ')}\n`
        }
      }
      
      // Mostrar adicionais se existirem, organizados por sabor
      if (item.adicionais && item.adicionais.length > 0) {
        item.adicionais.forEach((adicionalGrupo) => {
          if (adicionalGrupo.itens.length > 0) {
            message += `  • Adicionais (${adicionalGrupo.sabor}): ${adicionalGrupo.itens.map(adic => `${adic.nome} (+${formatCurrency(adic.preco)})`).join(', ')}\n`
          }
        })
      }
      
      // Mostrar borda recheada se existir
      if (item.bordaRecheada) {
        message += `  • Borda Recheada: ${item.bordaRecheada.nome} (+${formatCurrency(item.bordaRecheada.preco)})\n`
      }
      
      // Total do item
      message += `  • Total: ${formatCurrency(item.preco * item.quantidade)}\n\n`
    })
    
    // Tipo de entrega
    message += `🚚 *ENTREGA:* ${deliveryType === "delivery" ? "Delivery" : "Retirada no Balcão"}\n\n`
    
    // Dados do cliente
    message += `👤 *DADOS DO CLIENTE:*\n`
    message += `Nome: ${customerName}\n`
    message += `Telefone: ${customerPhone}\n\n`
    
    // Dados do cliente (se delivery)
    if (deliveryType === "delivery") {
      message += `📍 *ENDEREÇO DE ENTREGA:*\n`
      if (addressData) {
        message += `${addressData.logradouro}, ${addressNumber}\n`
        if (addressComplement) message += `${addressComplement}\n`
        message += `${addressData.bairro} - ${addressData.localidade}/${addressData.uf}\n`
        message += `CEP: ${customerCep}\n`
        if (deliveryNotes) message += `Observações: ${deliveryNotes}\n`
      }
      message += `\n`
    }
    
    // Observações do pedido
    if (orderNotes) {
      message += `📝 *OBSERVAÇÕES DO PEDIDO:*\n${orderNotes}\n\n`
    }
    
    // Forma de pagamento
    const paymentLabels = {
      pix: "PIX",
      dinheiro: "Dinheiro",
      debito: "Cartão de Débito",
      credito: "Cartão de Crédito",
      ticket_alimentacao: "Ticket Alimentação"
    }
    message += `💳 *FORMA DE PAGAMENTO:*\n${paymentLabels[paymentMethod]}\n\n`
    
    // Resumo financeiro
    message += `💰 *VALORES:*\n`
    message += `Subtotal: ${formatCurrency(subtotal)}\n`
    if (deliveryType === "delivery") {
      message += `Taxa de entrega: ${formatCurrency(deliveryFee)}\n`
    }
    message += `*TOTAL: ${formatCurrency(total)}*\n\n`
    
    message += `⏳ Aguardando confirmação!`
    
    return message
  }
  
  // Buscar adicionais de um sabor específico
  const getAdicionaisForSabor = (saborNome: string): Adicional[] => {
    const produto = produtos.find(p => p.nome === saborNome)
    return produto?.adicionais || []
  }
  
  const getIngredientesForSabor = (saborNome: string): string => {
    const produto = produtos.find(p => p.nome === saborNome)
    return produto?.descricao || ""
  }

  // Atualizar adicionais de um item do carrinho
  const handleToggleAdicional = (itemId: string, sabor: string, adicional: Adicional, checked: boolean) => {
    const item = state.items.find(i => i.id === itemId)
    if (!item) return

    let newAdicionais = item.adicionais || []

    // Encontrar ou criar grupo de adicionais para este sabor
    const saborIndex = newAdicionais.findIndex(a => a.sabor === sabor)

    if (saborIndex >= 0) {
      // Grupo existe, modificar lista de itens
      const currentItens = newAdicionais[saborIndex].itens
      
      if (checked) {
        // Adicionar se não existir
        if (!currentItens.some(i => i.nome === adicional.nome)) {
          newAdicionais[saborIndex].itens = [...currentItens, adicional]
        }
      } else {
        // Remover se existir
        newAdicionais[saborIndex].itens = currentItens.filter(i => i.nome !== adicional.nome)
      }
    } else if (checked) {
      // Criar novo grupo se não existir e estamos adicionando
      newAdicionais.push({
        sabor,
        itens: [adicional]
      })
    }

    // Filtrar grupos vazios
    newAdicionais = newAdicionais.filter(grupo => grupo.itens.length > 0)

    // Atualizar item no carrinho (o contexto recalcula o preço automaticamente)
    dispatch({
      type: "UPDATE_ADICIONAIS",
      payload: {
        id: itemId,
        adicionais: newAdicionais
      }
    })
  }

  // Atualizar quantidade de um item
  const handleUpdateQuantity = (itemId: string, novaQuantidade: number) => {
    if (novaQuantidade <= 0) {
      dispatch({
        type: "REMOVE_ITEM",
        payload: itemId
      })
    } else {
      dispatch({
        type: "UPDATE_QUANTITY",
        payload: {
          id: itemId,
          quantidade: novaQuantidade
        }
      })
    }
  }

  // Atualizar borda recheada de um item
  const handleUpdateBorda = (itemId: string, borda: BordaRecheada | null) => {
    dispatch({
      type: "UPDATE_BORDA",
      payload: {
        id: itemId,
        bordaRecheada: borda ? {
          id: borda.id,
          nome: borda.nome,
          preco: borda.preco
        } : undefined
      }
    })
  }

  // Sanitizar número do WhatsApp para formato internacional
  const sanitizeWhatsappNumber = (number: string): string => {
    // Se não tiver número configurado, usar o número padrão da pizzaria
    if (!number) return "5512991605573"
    
    // Remove todos os caracteres não numéricos
    let cleaned = number.replace(/\D/g, '')
    
    // Remove zero inicial se houver
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1)
    }
    
    // Se não começar com 55 (código do Brasil), adicionar
    if (!cleaned.startsWith('55')) {
      cleaned = '55' + cleaned
    }
    
    return cleaned
  }

  // Limpar caracteres problemáticos da mensagem
  const sanitizeMessage = (message: string): string => {
    return message
      .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width characters
      .replace(/[\uFFFD]/g, '') // Remove replacement characters
      // Remove control characters, exceto \n (0x0A)
      .replace(/[\u0000-\u0009\u000B-\u001F\u007F-\u009F]/g, '')
      .trim()
  }

  // Finalizar pedido
  const handleFinishOrder = () => {
    console.log("🔄 Iniciando processo de finalização do pedido...")
    console.log("📋 Validações:", {
      formValida: isFormValid(),
      valorMinimo: isMinimumMet,
      whatsappConfig: storeConfig?.whatsapp,
      carrinho: state.items?.length || 0
    })
    
    if (!storeConfig?.whatsapp) {
      console.error("❌ Erro: WhatsApp da pizzaria não configurado")
      alert("Erro: WhatsApp da pizzaria não configurado. Entre em contato com o administrador.")
      return
    }

    setSubmitting(true)
    
    try {
      const message = generateWhatsAppMessage()
      console.log("📝 Mensagem gerada:", message.length > 0 ? "✅ OK" : "❌ Vazia")
      
      const rawWhatsappNumber = storeConfig.whatsapp
      const whatsappNumber = sanitizeWhatsappNumber(rawWhatsappNumber)
      console.log("📱 Número processado:", { original: rawWhatsappNumber, processado: whatsappNumber })
      
      if (!whatsappNumber) {
        console.error("❌ Erro: Número WhatsApp inválido")
        alert("Erro: Número WhatsApp inválido. Entre em contato com o administrador.")
        setSubmitting(false)
        return
      }
      
      // Limpar caracteres problemáticos da mensagem
      let mensagemFinal = sanitizeMessage(message)
      
      // Verificar tamanho da mensagem (WhatsApp tem limite de ~2048 caracteres na URL)
      if (mensagemFinal.length > 1500) {
        console.warn("⚠️ Mensagem muito longa, truncando...")
        mensagemFinal = mensagemFinal.substring(0, 1400) + "\n\n... (mensagem truncada)"
      }
      
      // Construir URL do WhatsApp (wa.me é mais compatível)
      let whatsappWebUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(mensagemFinal)}`
      
      // Verificar se a URL final não excede limites do navegador
      if (whatsappWebUrl.length > 2000) {
        console.warn("⚠️ URL muito longa, reduzindo mensagem...")
        const reducedMessage = mensagemFinal.substring(0, 1000) + "\n\n... (mensagem reduzida)"
        whatsappWebUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(reducedMessage)}`
      }
      
      console.log("📱 Preparando envio para WhatsApp:", { 
        numeroProcessado: whatsappNumber, 
        tamanhoMensagem: mensagemFinal.length,
        urlLength: whatsappWebUrl.length 
      })
      
      // Usar wa.me em todos os casos para máxima compatibilidade
      try {
        console.log("📱 Abrindo WhatsApp via wa.me...")
        window.open(whatsappWebUrl, '_blank')
      } catch (error) {
        console.error("❌ Erro ao abrir WhatsApp:", error)
        // Fallback: tentar com window.location
        try {
          window.location.href = whatsappWebUrl
        } catch (fallbackError) {
          console.error("❌ Erro no fallback:", fallbackError)
          alert("Erro ao abrir WhatsApp. Copie o link manualmente: " + whatsappWebUrl)
        }
      }
      
      // Resetar estado após um pequeno delay
      setTimeout(() => {
        setSubmitting(false)
      }, 500)
      
    } catch (error) {
      console.error("❌ Erro ao processar pedido:", error)
      alert("Erro ao processar pedido. Tente novamente.")
      setSubmitting(false)
    }
  }
  
  // Loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    )
  }
  
  // Se carrinho estiver vazio, mostrar loading (redirecionamento será feito no useEffect)
  if (!state.items || state.items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    )
  }
  
  const subtotal = state.total || 0
  const deliveryFee = deliveryType === "delivery" ? (storeConfig?.taxa_entrega || 0) : 0
  const total = subtotal + deliveryFee
  const minimumValue = storeConfig?.valor_minimo || 0
  const isMinimumMet = subtotal >= minimumValue
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center sticky top-0 z-10">
        <Button variant="ghost" size="sm" onClick={() => router.push("/")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-lg font-semibold ml-2">Finalizar Pedido</h1>
      </div>
      
      <div className="max-w-2xl mx-auto p-4 pb-32 space-y-4">
        {/* Tipo de Entrega */}
        <Card className="rounded-xl shadow-md">
          <div className="p-4">
            <h2 className="text-[15px] font-semibold mb-6 text-neutral-800">Tipo de Entrega</h2>
            <div className="grid grid-cols-2 gap-4">
              <div 
                className={`relative p-6 rounded-xl border transition-all duration-200 hover:shadow-sm cursor-pointer ${
                  deliveryType === "balcao" 
                    ? "border-orange-300 bg-orange-50" 
                    : "border-gray-200 bg-white hover:border-orange-200"
                }`}
                onClick={() => handleDeliveryTypeChange("balcao")}
              >
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="bg-orange-600 text-white rounded-full p-3">
                    <UtensilsCrossed className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-semibold text-[15px] text-neutral-800 block">Balcão</span>
                    <p className="text-sm text-neutral-500 mt-1">Retire seu pedido na loja</p>
                  </div>
                </div>
              </div>
              <div 
                className={`relative p-6 rounded-xl border transition-all duration-200 hover:shadow-sm cursor-pointer ${
                  deliveryType === "delivery" 
                    ? "border-blue-300 bg-blue-50" 
                    : "border-gray-200 bg-white hover:border-blue-200"
                }`}
                onClick={() => handleDeliveryTypeChange("delivery")}
              >
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="bg-blue-600 text-white rounded-full p-3">
                    <Bike className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-semibold text-[15px] text-neutral-800 block">Delivery</span>
                    <p className="text-sm text-neutral-500 mt-1">Taxa: {formatCurrency(storeConfig?.taxa_entrega || 0)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
        
        {/* Dados do Cliente */}
        <Card className="rounded-xl shadow-md">
          <div className="p-4">
            <h2 className="text-[15px] font-semibold mb-4 text-neutral-800">
              {deliveryType === "delivery" ? "Dados para Entrega" : "Dados do Cliente"}
            </h2>
            
            {/* Verificar se delivery está selecionado e há pizzas em promoção */}
            {deliveryType === "delivery" && hasPromocaoPizzas() ? (
              /* Mensagem de restrição para promoções */
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Pizza className="w-8 h-8 text-yellow-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Pizzas em Promoção</h3>
                <p className="text-gray-600 text-center leading-relaxed">
                  As promoções de pizzas são exclusivas para pedidos com retirada no balcão.
                </p>
                <div className="mt-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <p className="text-orange-800 text-sm font-medium">
                    💡 Para continuar, selecione "Balcão" como tipo de entrega
                  </p>
                </div>
              </div>
            ) : (
              /* Formulário normal */
              <div className="space-y-4">
                {/* Nome */}
                <div>
                  <Label htmlFor="name" className="text-[15px]">Nome Completo *</Label>
                  <div className="relative mt-1">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="name"
                      placeholder="Ex: João Silva"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                
                {/* Telefone */}
                <div>
                  <Label htmlFor="phone" className="text-[15px]">Telefone *</Label>
                  <div className="relative mt-1">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="phone"
                      placeholder="Ex: (11) 99999-9999"
                      value={customerPhone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                
                {/* Campos específicos para Delivery */}
                {deliveryType === "delivery" && (
                  <>
                    {/* CEP */}
                    <div>
                      <Label htmlFor="cep">CEP *</Label>
                      <div className="relative mt-1">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="cep"
                          placeholder="00000-000"
                          value={customerCep}
                          onChange={(e) => handleCepChange(e.target.value)}
                          className="pl-10"
                          required
                        />
                        {searchingCep && (
                          <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-gray-400" />
                        )}
                      </div>
                      {cepError && <p className="text-red-600 text-sm mt-1">{cepError}</p>}
                      {addressData && (
                        <div className="mt-2 p-3 bg-green-50 rounded-lg text-sm">
                          <p className="font-medium text-green-800">Endereço encontrado:</p>
                          <p className="text-green-700">
                            {addressData.logradouro}, {addressData.bairro} - {addressData.localidade}/{addressData.uf}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {/* Campos adicionais após CEP */}
                    {addressData && (
                      <>
                        <div>
                          <Label htmlFor="number">Número *</Label>
                          <Input
                            id="number"
                            placeholder="123"
                            value={addressNumber}
                            onChange={(e) => setAddressNumber(e.target.value)}
                            className="mt-1"
                            required
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="complement">Complemento</Label>
                          <Input
                            id="complement"
                            placeholder="Apto 101, Bloco A..."
                            value={addressComplement}
                            onChange={(e) => setAddressComplement(e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="delivery-notes">Observações de Entrega</Label>
                          <Textarea
                            id="delivery-notes"
                            placeholder="Ponto de referência, instruções..."
                            value={deliveryNotes}
                            onChange={(e) => setDeliveryNotes(e.target.value)}
                            className="mt-1"
                            rows={2}
                          />
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </Card>
        
        {/* Resumo do Pedido */}
        <Card className="rounded-xl shadow-md">
          <div className="p-4">
            <div className="mb-4">
              <h2 className="text-[15px] font-semibold text-neutral-800">Resumo do Pedido</h2>
            </div>
            <div className="space-y-2">
              {state.items?.map((item, index) => {
                // Verifica se é a primeira bebida da lista para mostrar o título
                const isFirstBebida = item.tipo === "bebida" && 
                  state.items?.findIndex(i => i.tipo === "bebida") === index
                
                return (
                  <div key={index}>
                    {/* Título das Bebidas - exibido apenas antes da primeira bebida */}
                    {isFirstBebida && (
                      <h3 className="text-sm font-semibold text-gray-600 mt-4 mb-2 pt-4 border-t border-gray-200">Bebidas</h3>
                    )}
                    <div className="bg-white rounded-lg shadow-sm p-3">
                  {/* Header do item */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                      {/* Nome do produto com Stepper para bebidas e pizzas */}
                      <div className={`flex gap-3 ${item.tipo === "bebida" ? "items-center" : "items-start"}`}>
                        {/* Stepper para bebidas e pizzas */}
                        <div className="flex flex-col items-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-8 p-0 hover:bg-transparent"
                            onClick={() => handleUpdateQuantity(item.id, item.quantidade + 1)}
                          >
                            <ChevronUp className="h-4 w-4 text-red-600" />
                          </Button>
                          <span className="font-semibold text-sm text-black min-w-[20px] text-center py-1">
                            {item.quantidade}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-8 p-0 hover:bg-transparent"
                            onClick={() => handleUpdateQuantity(item.id, item.quantidade - 1)}
                          >
                            <ChevronDown className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                        
                        {/* Nome do produto */}
                        <div className="flex-1">
                          {item.sabores && item.sabores.length === 2 ? (
                            <div>
                              <div className="mb-2">
                                <span className="text-[15px] font-bold text-red-600">
                                  Pizza 1/2 {item.sabores[0]} + 1/2 {item.sabores[1]}
                                </span>
                                {isItemPromocao(item.id) && (
                                  <div className="mt-1">
                                    <span className="text-xs font-bold text-green-600">
                                      PROMOÇÃO BALCÃO
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="space-y-1">
                                {item.sabores.map((sabor, index) => {
                                  const ingredientes = getIngredientesForSabor(sabor)
                                  return ingredientes ? (
                                    <p key={index} className="text-sm text-gray-500">
                                      1/2 {sabor}: {ingredientes}
                                    </p>
                                  ) : null
                                })}
                              </div>
                            </div>
                          ) : item.sabores && item.sabores.length === 3 ? (
                            <div>
                              <div className="mb-2">
                                <span className="text-[15px] font-bold text-red-600">
                                  Pizza {item.sabores.join(" + ")}
                                </span>
                                {isItemPromocao(item.id) && (
                                  <div className="mt-1">
                                    <span className="text-xs font-bold text-green-600">
                                      PROMOÇÃO BALCÃO
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="space-y-1">
                                {item.sabores.map((sabor, index) => {
                                  const ingredientes = getIngredientesForSabor(sabor)
                                  return ingredientes ? (
                                    <p key={index} className="text-sm text-gray-500">
                                      {sabor}: {ingredientes}
                                    </p>
                                  ) : null
                                })}
                              </div>
                            </div>
                          ) : item.sabores && item.sabores.length === 1 ? (
                            <div>
                              <div className="mb-2">
                                <span className="text-[15px] font-bold text-red-600">{item.nome}</span>
                                {isItemPromocao(item.id) && (
                                  <div className="mt-1">
                                    <span className="text-xs font-bold text-green-600">
                                      PROMOÇÃO BALCÃO
                                    </span>
                                  </div>
                                )}
                              </div>
                              {(() => {
                                const ingredientes = getIngredientesForSabor(item.sabores[0])
                                return ingredientes ? (
                                  <p className="text-sm text-gray-500">{ingredientes}</p>
                                ) : null
                              })()}
                            </div>
                          ) : (
                            <div>
                              <span className="text-[15px] font-bold text-red-600">{item.nome}</span>
                              {isItemPromocao(item.id) && (
                                <div className="mt-1">
                                  <span className="text-xs font-bold text-green-600">
                                    PROMOÇÃO BALCÃO
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                      
                      {/* Valor total do item */}
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-green-600">
                          {formatCurrency(item.preco * item.quantidade)}
                        </span>
                      </div>
                    </div>
                    
                  {/* Informação de Tamanho da Pizza (apenas descritiva) */}
                  {item.tipo !== "bebida" && (
                    <div className="mt-1">
                      <span className="text-sm text-gray-700">
                        {item.tamanho === "broto" ? "Broto" : "Tradicional"} · {item.tamanho === "broto" ? "4" : "8"} fatias · {(() => {
                          const pizza = produtos.find(p => item.sabores?.includes(p.nome))
                          let preco: number | null = null
                          
                          // Se o produto está em promoção, usar preços promocionais
                          if (pizza?.promocao) {
                            preco = item.tamanho === "broto" ? (pizza.preco_promocional_broto || null) : (pizza.preco_promocional_tradicional || null)
                          } else {
                            preco = item.tamanho === "broto" ? (pizza?.preco_broto || null) : (pizza?.preco_tradicional || null)
                          }
                          
                          return preco ? formatCurrency(preco) : "-"
                        })()}
                      </span>
                    </div>
                  )}

                  {/* Seção de Adicionais Editáveis por Sabor */}
                  {item.sabores && item.sabores.length > 0 && (
                    <div className="border-t border-gray-200 mt-2 pt-2 space-y-3">
                      {item.sabores.map((sabor, saborIndex) => {
                        const adicionaisDisponiveis = getAdicionaisForSabor(sabor)
                        if (adicionaisDisponiveis.length === 0) return null
                        
                        return (
                          <div key={saborIndex} className="bg-gray-50 rounded-lg p-3">
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">
                              Opcionais para {sabor}:
                            </h4>
                            <div className="space-y-2">
                              {adicionaisDisponiveis.map((adicional, adIndex) => (
                                <div key={adIndex} className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`${item.id}-${sabor}-${adicional.nome}`}
                                      checked={item.adicionais?.find(a => a.sabor === sabor)?.itens.some(i => i.nome === adicional.nome) || false}
                                      onCheckedChange={(checked) => 
                                        handleToggleAdicional(item.id, sabor, adicional, checked as boolean)
                                      }
                                    />
                                    <Label 
                                      htmlFor={`${item.id}-${sabor}-${adicional.nome}`}
                                      className="cursor-pointer text-sm flex-1"
                                    >
                                      {adicional.nome}
                                    </Label>
                                  </div>
                                  <span className="text-sm font-medium text-green-600">
                                    +{formatCurrency(adicional.preco)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Seção de Bordas Recheadas (apenas para pizzas) */}
                  {item.tipo !== "bebida" && bordasRecheadas.length > 0 && config.habilitar_bordas_recheadas && (
                    <div className="border-t border-gray-200 mt-2 pt-2">
                      <div className="bg-[#fefaf0] border border-yellow-300 rounded-lg p-3">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">
                          Borda Recheada (Opcional):
                        </h4>
                      <div className="space-y-2">
                        {/* Opção "Sem borda" */}
                        <label className="flex items-center justify-between p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 cursor-pointer">
                          <div className="flex items-center space-x-3">
                            <input
                              type="radio"
                              name={`borda-${item.id}`}
                              checked={!item.bordaRecheada}
                              onChange={() => handleUpdateBorda(item.id, null)}
                              className="w-4 h-4 text-yellow-600 border-gray-300 focus:ring-yellow-500"
                            />
                            <span className="text-sm text-gray-700">Sem borda recheada</span>
                          </div>
                          <span className="text-sm text-gray-500">R$ 0,00</span>
                        </label>

                        {/* Opções de bordas disponíveis */}
                        {bordasRecheadas.map((borda) => (
                          <label 
                            key={borda.id} 
                            className="flex items-center justify-between p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 cursor-pointer"
                          >
                            <div className="flex items-center space-x-3">
                              <input
                                type="radio"
                                name={`borda-${item.id}`}
                                checked={item.bordaRecheada?.id === borda.id}
                                onChange={() => handleUpdateBorda(item.id, borda)}
                                className="w-4 h-4 text-yellow-600 border-gray-300 focus:ring-yellow-500"
                              />
                              <span className="text-sm text-gray-700">{borda.nome}</span>
                            </div>
                            <span className="text-sm font-medium text-green-600">
                              +{formatCurrency(borda.preco)}
                            </span>
                          </label>
                        ))}
                      </div>
                      </div>
                    </div>
                  )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </Card>
        
        {/* Observações do Pedido */}
        <Card className="rounded-xl shadow-md">
          <div className="p-4">
            <h2 className="text-[15px] font-semibold mb-4 text-neutral-800">Observações do Pedido</h2>
            <Textarea
              placeholder="Ex: Sem cebola...."
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              className="h-[80px] rounded-lg bg-neutral-50 border"
            />
          </div>
        </Card>
        
        {/* Forma de Pagamento */}
        <Card className="rounded-xl shadow-md">
          <div className="p-4">
            <h2 className="text-[15px] font-semibold mb-4 text-neutral-800">Forma de Pagamento</h2>
            <div className="grid grid-cols-2 gap-3">
              {storeConfig?.aceita_pix && (
                <div 
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    paymentMethod === "pix" 
                      ? "border-green-500 bg-green-50" 
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                  onClick={() => setPaymentMethod("pix")}
                >
                  <div className="flex items-center gap-2">
                    <ScanLine className="w-4 h-4 text-green-600" />
                    <span className="text-[15px]">PIX</span>
                  </div>
                </div>
              )}
              {storeConfig?.aceita_dinheiro && (
                <div 
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    paymentMethod === "dinheiro" 
                      ? "border-green-500 bg-green-50" 
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                  onClick={() => setPaymentMethod("dinheiro")}
                >
                  <div className="flex items-center gap-2">
                    <Banknote className="w-4 h-4 text-green-600" />
                    <span className="text-[15px]">Dinheiro</span>
                  </div>
                </div>
              )}
              {storeConfig?.aceita_cartao && (
                <>
                  <div 
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      paymentMethod === "debito" 
                        ? "border-green-500 bg-green-50" 
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                    onClick={() => setPaymentMethod("debito")}
                  >
                    <div className="flex items-center gap-2">
                      <ArrowDownToLine className="w-4 h-4 text-blue-600" />
                      <span className="text-[15px]">Débito</span>
                    </div>
                  </div>
                  <div 
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      paymentMethod === "credito" 
                        ? "border-green-500 bg-green-50" 
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                    onClick={() => setPaymentMethod("credito")}
                  >
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-purple-600" />
                      <span className="text-[15px]">Crédito</span>
                    </div>
                  </div>
                </>
              )}
              {storeConfig?.aceita_ticket_alimentacao && (
                <div 
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    paymentMethod === "ticket_alimentacao" 
                      ? "border-green-500 bg-green-50" 
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                  onClick={() => setPaymentMethod("ticket_alimentacao")}
                >
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-orange-600" />
                    <span className="text-[15px]">Ticket</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
        
        {/* Resumo de Valores */}
        <Card className="rounded-xl shadow-md mb-4">
          <div className="p-4">
            <h2 className="text-[15px] font-semibold mb-4 text-neutral-800">Resumo de Valores</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-[15px]">Subtotal</span>
                <span className="font-medium text-[15px]">{formatCurrency(subtotal)}</span>
              </div>
              {deliveryType === "delivery" && (
                <div className="flex justify-between">
                  <span className="text-[15px]">Taxa de entrega</span>
                  <span className="font-medium text-[15px]">{formatCurrency(deliveryFee)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t font-semibold text-lg">
                <span>Total</span>
                <span className="text-green-600">{formatCurrency(total)}</span>
              </div>
            </div>
            
            {!isMinimumMet && (
              <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                <p className="text-yellow-800 text-sm">
                  Valor mínimo: {formatCurrency(minimumValue)}
                  <br />
                  Faltam {formatCurrency(minimumValue - subtotal)} para atingir o mínimo
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>
      
      {/* Botão Fixo */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">

        
        <Button
          onClick={handleFinishOrder}
          disabled={!isMinimumMet || !isFormValid() || submitting}
          className="w-full h-12 text-lg rounded-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 font-bold py-3 flex items-center justify-center gap-2"
        >
          {submitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <MessageCircle className="w-5 h-5" />
              Finalizar Pedido
            </>
          )}
        </Button>
        <p className="text-sm text-green-600 font-semibold text-center mt-2">
          Você será redirecionado ao WhatsApp da pizzaria
        </p>
      </div>

      {/* Toast de Promoção */}
      {showPromocaoToast && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-lg relative">
            {/* Botão X para fechar */}
            <button
              onClick={() => setShowPromocaoToast(false)}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Fechar"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Pizza className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Pizzas em Promoção</h3>
              <p className="text-gray-600 mb-6">
                As promoções de pizzas são exclusivas para pedidos com retirada no balcão.
              </p>
              <Button
                onClick={() => setShowPromocaoToast(false)}
                className="w-full bg-green-600 hover:bg-green-700 text-white rounded-lg"
              >
                Entendi
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
