"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  MapPin, 
  Bike,
  Loader2,
  CreditCard,
  Banknote,
  Smartphone,
  Edit
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useCart } from "@/lib/cart-context"
import { formatCurrency } from "@/lib/currency-utils"
import { supabase } from "@/lib/supabase"
import { getCliente } from "@/lib/auth"
import { toast } from "sonner"

export default function EntregaPagamentoPage() {
  const router = useRouter()
  const { state, dispatch } = useCart()
  
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  // Dados do checkout
  const [deliveryType, setDeliveryType] = useState<"delivery" | "balcao">("delivery")
  const [taxaEntrega, setTaxaEntrega] = useState<number>(0)
  
  // Dados do cliente
  const [clienteLogado, setClienteLogado] = useState<any>(null)
  const [enderecoSalvo, setEnderecoSalvo] = useState<any>(null)
  
  // Forma de pagamento
  const [tipoPagamento, setTipoPagamento] = useState<"app" | "entrega">("entrega")
  const [formaPagamento, setFormaPagamento] = useState<"pix" | "mercado_pago" | "dinheiro" | "cartao_debito" | "cartao_credito">("dinheiro")
  
  // Observações e troco
  const [observacoes, setObservacoes] = useState("")
  const [trocoPara, setTrocoPara] = useState("")
  
  // Carregar dados
  useEffect(() => {
    const loadData = async () => {
      try {
        // Recuperar dados do localStorage
        const savedDeliveryType = localStorage.getItem("checkout_delivery_type") as "delivery" | "balcao"
        const savedTaxa = localStorage.getItem("checkout_taxa_entrega")
        
        if (savedDeliveryType) setDeliveryType(savedDeliveryType)
        if (savedTaxa) setTaxaEntrega(parseFloat(savedTaxa))
        
        // Buscar cliente
        const { data: cliente } = await getCliente()
        if (cliente) {
          setClienteLogado(cliente)
          
          // Se tem endereço salvo
          if (cliente.endereco_cep) {
            setEnderecoSalvo({
              rua: cliente.endereco_rua,
              numero: cliente.endereco_numero,
              bairro: cliente.endereco_bairro,
              cidade: cliente.endereco_cidade,
              estado: cliente.endereco_estado,
              cep: cliente.endereco_cep,
              complemento: cliente.endereco_complemento
            })
          }
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error)
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [])
  
  // Verificar carrinho vazio
  useEffect(() => {
    if (!loading && (!state.items || state.items.length === 0)) {
      toast.error("Carrinho vazio")
      router.push("/")
    }
  }, [state.items, loading, router])
  
  // Calcular totais
  const subtotal = state.total || 0
  const deliveryFee = deliveryType === "delivery" ? taxaEntrega : 0
  const total = subtotal + deliveryFee
  
  // Preparar dados do pedido
  const prepararDadosPedido = () => {
    return {
      cliente_id: clienteLogado?.id || null,
      nome_cliente: clienteLogado?.nome || "",
      telefone_cliente: clienteLogado?.telefone || "",
      tipo_entrega: deliveryType,
      endereco: deliveryType === "delivery" && enderecoSalvo ? {
        rua: enderecoSalvo.rua,
        numero: enderecoSalvo.numero,
        bairro: enderecoSalvo.bairro,
        cidade: enderecoSalvo.cidade,
        estado: enderecoSalvo.estado,
        cep: enderecoSalvo.cep,
        complemento: enderecoSalvo.complemento || ""
      } : {},
      forma_pagamento: formaPagamento,
      subtotal,
      taxa_entrega: deliveryFee,
      total,
      observacoes: observacoes || null,
      troco_para: formaPagamento === "dinheiro" && trocoPara ? parseFloat(trocoPara) : null
    }
  }
  
  // Preparar itens
  const prepararItensPedido = () => {
    return (state.items || []).map(item => ({
      produto_id: item.productId || null,
      nome_produto: item.name,
      tamanho: item.size || null,
      sabores: item.flavors || [],
      adicionais: item.adicionais || [],
      borda_recheada: item.bordaRecheada || null,
      quantidade: item.quantity,
      preco_unitario: item.price,
      preco_total: item.price * item.quantity,
      observacoes: item.observacoes || null
    }))
  }
  
  // Finalizar pedido
  const handleFinalizarPedido = async () => {
    try {
      // Validações
      if (deliveryType === "delivery" && !enderecoSalvo) {
        toast.error("Endereço de entrega não encontrado")
        return
      }
      
      if (!clienteLogado) {
        toast.error("Você precisa estar logado para finalizar o pedido")
        router.push("/login?returnUrl=/checkout/entrega-pagamento")
        return
      }
      
      if (formaPagamento === "dinheiro" && trocoPara) {
        const trocoValor = parseFloat(trocoPara)
        if (trocoValor < total) {
          toast.error("O valor do troco deve ser maior que o total do pedido")
          return
        }
      }
      
      setSubmitting(true)
      
      const dadosPedido = prepararDadosPedido()
      const itensPedido = prepararItensPedido()
      
      console.log("📦 Criando pedido:", dadosPedido)
      
      // Chamar função do Supabase
      const { data, error } = await supabase.rpc('criar_pedido_online', {
        p_cliente_id: dadosPedido.cliente_id,
        p_nome_cliente: dadosPedido.nome_cliente,
        p_telefone_cliente: dadosPedido.telefone_cliente,
        p_tipo_entrega: dadosPedido.tipo_entrega,
        p_endereco: dadosPedido.endereco,
        p_forma_pagamento: dadosPedido.forma_pagamento,
        p_subtotal: dadosPedido.subtotal,
        p_taxa_entrega: dadosPedido.taxa_entrega,
        p_total: dadosPedido.total,
        p_observacoes: dadosPedido.observacoes,
        p_troco_para: dadosPedido.troco_para,
        p_itens: itensPedido
      })
      
      if (error) {
        console.error("❌ Erro ao criar pedido:", error)
        throw error
      }
      
      if (!data || !data.success) {
        console.error("❌ Erro retornado pela função:", data)
        throw new Error(data?.error || 'Erro ao criar pedido')
      }
      
      console.log("✅ Pedido criado com sucesso:", data)
      
      // Sucesso!
      toast.success(`Pedido ${data.numero_pedido} criado com sucesso!`, {
        description: "Você será redirecionado para acompanhar seu pedido"
      })
      
      // Limpar carrinho e localStorage
      dispatch({ type: 'CLEAR_CART' })
      localStorage.removeItem("checkout_delivery_type")
      localStorage.removeItem("checkout_taxa_entrega")
      
      // Redirecionar
      setTimeout(() => {
        router.push(`/pedido/${data.pedido_id}`)
      }, 1500)
      
    } catch (error) {
      console.error("❌ Erro ao criar pedido:", error)
      toast.error("Erro ao finalizar pedido", {
        description: "Por favor, tente novamente"
      })
      setSubmitting(false)
    }
  }
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-lg font-normal text-purple-600">entrega e pagamento</h1>
        </div>
      </div>
      
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Endereço de Entrega */}
        {deliveryType === "delivery" && (
          <div>
            <h2 className="text-sm font-normal text-gray-600 mb-3">endereço de entrega</h2>
            {enderecoSalvo ? (
              <Card className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-gray-900">Casa</span>
                      <span className="text-gray-400">•</span>
                      <div className="flex items-center gap-1 text-teal-600">
                        <Bike className="w-4 h-4" />
                        <span className="text-sm">{formatCurrency(taxaEntrega)}</span>
                      </div>
                    </div>
                    <p className="text-gray-700">
                      {enderecoSalvo.rua}, {enderecoSalvo.numero}
                    </p>
                    <p className="text-gray-600 text-sm">
                      {enderecoSalvo.bairro}, {enderecoSalvo.cidade}
                    </p>
                  </div>
                  <button 
                    onClick={() => router.push("/perfil")}
                    className="text-teal-600 hover:text-teal-700"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                </div>
              </Card>
            ) : (
              <Card className="p-4">
                <p className="text-gray-600 mb-3">Você não tem endereço cadastrado</p>
                <Button
                  onClick={() => router.push("/perfil")}
                  variant="outline"
                  className="w-full"
                >
                  Adicionar Endereço
                </Button>
              </Card>
            )}
          </div>
        )}
        
        {/* Resumo do Pedido */}
        <div>
          <h2 className="text-sm font-normal text-gray-600 mb-3">seu pedido</h2>
          <Card className="p-4">
            <div className="space-y-2 mb-4">
              {state.items?.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-gray-700">
                    {item.quantity}x {item.name}
                  </span>
                  <span className="text-gray-900 font-medium">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
            
            <div className="border-t pt-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">subtotal:</span>
                <span className="text-gray-900">{formatCurrency(subtotal)}</span>
              </div>
              {deliveryType === "delivery" && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">entrega:</span>
                  <span className="text-teal-600">{formatCurrency(deliveryFee)}</span>
                </div>
              )}
              <div className="flex justify-between font-medium pt-2 border-t">
                <span className="text-gray-700">total:</span>
                <span className="text-gray-900 text-lg">{formatCurrency(total)}</span>
              </div>
            </div>
          </Card>
        </div>
        
        {/* Observações */}
        <div>
          <Textarea
            placeholder="alguma observação?"
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            className="resize-none h-20"
          />
        </div>
        
        {/* Forma de Pagamento */}
        <div>
          <h2 className="text-sm font-normal text-gray-600 mb-3">como vai ser o pagamento?</h2>
          
          {/* Tipo de Pagamento */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              onClick={() => {
                setTipoPagamento("app")
                setFormaPagamento("pix")
              }}
              className={`p-4 rounded-lg border-2 transition-all ${
                tipoPagamento === "app"
                  ? "border-purple-600 bg-purple-50"
                  : "border-gray-200 bg-white"
              }`}
            >
              <p className="font-medium text-center">pelo app</p>
            </button>
            <button
              onClick={() => {
                setTipoPagamento("entrega")
                setFormaPagamento("dinheiro")
              }}
              className={`p-4 rounded-lg border-2 transition-all ${
                tipoPagamento === "entrega"
                  ? "border-purple-600 bg-purple-50"
                  : "border-gray-200 bg-white"
              }`}
            >
              <p className="font-medium text-center">na entrega</p>
            </button>
          </div>
          
          {/* Opções de Pagamento */}
          <div className="space-y-3">
            {tipoPagamento === "app" ? (
              <>
                {/* Pix */}
                <button
                  onClick={() => setFormaPagamento("pix")}
                  className={`w-full p-4 rounded-lg border-2 flex items-center gap-3 transition-all ${
                    formaPagamento === "pix"
                      ? "border-purple-600 bg-purple-50"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <Smartphone className="w-6 h-6 text-teal-600" />
                  <span className="font-medium">Pix</span>
                </button>
                
                {/* Mercado Pago */}
                <button
                  onClick={() => setFormaPagamento("mercado_pago")}
                  className={`w-full p-4 rounded-lg border-2 flex items-center gap-3 transition-all opacity-50 cursor-not-allowed ${
                    formaPagamento === "mercado_pago"
                      ? "border-purple-600 bg-purple-50"
                      : "border-gray-200 bg-white"
                  }`}
                  disabled
                >
                  <CreditCard className="w-6 h-6 text-blue-600" />
                  <div className="flex-1 text-left">
                    <span className="font-medium">Mercado Pago</span>
                    <span className="ml-2 text-xs bg-orange-500 text-white px-2 py-0.5 rounded">
                      em breve
                    </span>
                  </div>
                </button>
              </>
            ) : (
              <>
                {/* Dinheiro */}
                <button
                  onClick={() => setFormaPagamento("dinheiro")}
                  className={`w-full p-4 rounded-lg border-2 flex items-center gap-3 transition-all ${
                    formaPagamento === "dinheiro"
                      ? "border-purple-600 bg-purple-50"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <Banknote className="w-6 h-6 text-green-600" />
                  <span className="font-medium">Dinheiro</span>
                </button>
                
                {/* Campo de Troco */}
                {formaPagamento === "dinheiro" && (
                  <div className="ml-9">
                    <Input
                      type="number"
                      placeholder="Troco para quanto? (opcional)"
                      value={trocoPara}
                      onChange={(e) => setTrocoPara(e.target.value)}
                      className="w-full"
                    />
                  </div>
                )}
                
                {/* Cartão Débito */}
                <button
                  onClick={() => setFormaPagamento("cartao_debito")}
                  className={`w-full p-4 rounded-lg border-2 flex items-center gap-3 transition-all ${
                    formaPagamento === "cartao_debito"
                      ? "border-purple-600 bg-purple-50"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <CreditCard className="w-6 h-6 text-blue-600" />
                  <span className="font-medium">Cartão Débito</span>
                </button>
                
                {/* Cartão Crédito */}
                <button
                  onClick={() => setFormaPagamento("cartao_credito")}
                  className={`w-full p-4 rounded-lg border-2 flex items-center gap-3 transition-all ${
                    formaPagamento === "cartao_credito"
                      ? "border-purple-600 bg-purple-50"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <CreditCard className="w-6 h-6 text-purple-600" />
                  <span className="font-medium">Cartão Crédito</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Botão Fixo */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
        <div className="max-w-2xl mx-auto">
          <Button
            onClick={handleFinalizarPedido}
            disabled={submitting || (deliveryType === "delivery" && !enderecoSalvo)}
            className="w-full h-14 text-lg font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Finalizando...
              </>
            ) : (
              "FINALIZAR PEDIDO"
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
