"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Bike, Store, Loader2, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useCart } from "@/lib/cart-context"
import { formatCurrency } from "@/lib/currency-utils"
import { supabase } from "@/lib/supabase"
import { getCliente } from "@/lib/auth"
import { toast } from "sonner"

export default function CheckoutResumoPage() {
  const router = useRouter()
  const { state } = useCart()
  
  const [loading, setLoading] = useState(true)
  const [deliveryType, setDeliveryType] = useState<"delivery" | "balcao">("delivery")
  const [taxaEntrega, setTaxaEntrega] = useState<number>(0)
  const [clienteLogado, setClienteLogado] = useState<any>(null)
  
  // Carregar dados do cliente e taxa
  useEffect(() => {
    const loadData = async () => {
      try {
        // Buscar cliente
        const { data: cliente } = await getCliente()
        if (cliente) {
          setClienteLogado(cliente)
          
          // Se tem endereço, buscar taxa
          if (cliente.endereco_cep) {
            await buscarTaxaEntrega(cliente.endereco_cep)
            setDeliveryType("delivery")
          } else {
            setDeliveryType("balcao")
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
  
  // Buscar taxa de entrega
  const buscarTaxaEntrega = async (cep: string) => {
    try {
      const cepLimpo = cep.replace(/\D/g, "")
      const { data, error } = await supabase.rpc('buscar_taxa_por_cep', {
        cep_input: cepLimpo
      })
      
      // A função retorna um array, pegar o primeiro resultado
      if (!error && data && Array.isArray(data) && data.length > 0 && data[0].taxa !== undefined) {
        setTaxaEntrega(data[0].taxa)
        console.log("✅ Taxa encontrada:", data[0].taxa)
      } else {
        // Taxa padrão se não encontrar
        console.log("ℹ️ Taxa não encontrada para CEP, usando taxa padrão")
        const { data: config } = await supabase
          .from("pizzaria_config")
          .select("taxa_entrega")
          .single()
        
        setTaxaEntrega(config?.taxa_entrega || 0)
      }
    } catch (error) {
      console.error("Erro ao buscar taxa:", error)
      setTaxaEntrega(0)
    }
  }
  
  // Verificar se carrinho está vazio
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
  
  // Continuar para próxima etapa
  const handleContinuar = () => {
    // Salvar tipo de entrega no localStorage
    localStorage.setItem("checkout_delivery_type", deliveryType)
    localStorage.setItem("checkout_taxa_entrega", taxaEntrega.toString())
    
    // Redirecionar para página de entrega e pagamento
    router.push("/checkout/entrega-pagamento")
  }
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Toggle Delivery/Balcão */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-center gap-6">
            {/* Delivery */}
            <button
              onClick={() => setDeliveryType("delivery")}
              className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all ${
                deliveryType === "delivery"
                  ? "bg-red-600 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                deliveryType === "delivery" ? "border-white" : "border-gray-400"
              }`}>
                {deliveryType === "delivery" && (
                  <div className="w-3 h-3 rounded-full bg-white"></div>
                )}
              </div>
              <Bike className="w-5 h-5" />
              <span className="font-medium">delivery</span>
            </button>
            
            {/* Balcão */}
            <button
              onClick={() => setDeliveryType("balcao")}
              className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all ${
                deliveryType === "balcao"
                  ? "bg-red-600 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                deliveryType === "balcao" ? "border-white" : "border-gray-400"
              }`}>
                {deliveryType === "balcao" && (
                  <div className="w-3 h-3 rounded-full bg-white"></div>
                )}
              </div>
              <Store className="w-5 h-5" />
              <span className="font-medium">balcão</span>
            </button>
          </div>
        </div>
      </div>
      
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Título */}
        <h2 className="text-lg font-normal text-gray-600 mb-4">seu pedido</h2>
        
        {/* Lista de Itens */}
        <div className="space-y-4 mb-6">
          {state.items?.map((item, index) => (
            <Card key={index} className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <div className="flex items-start gap-2">
                    <span className="text-red-600 font-medium">{item.quantidade}x</span>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.nome}</p>
                      
                      {/* Detalhes da Pizza */}
                      {item.tamanho && (
                        <p className="text-sm text-gray-600 capitalize">
                          Tamanho: {item.tamanho}
                        </p>
                      )}
                      
                      {item.sabores && item.sabores.length > 0 && (
                        <p className="text-sm text-gray-600">
                          {item.sabores.length === 1 ? "Sabor" : "Sabores"}: {item.sabores.join(", ")}
                        </p>
                      )}
                      
                      {item.bordaRecheada && (
                        <p className="text-sm text-gray-600">
                          Borda: {item.bordaRecheada.nome}
                          <span className="text-red-600 ml-2">
                            + {formatCurrency(item.bordaRecheada.preco)}
                          </span>
                        </p>
                      )}
                      
                      {item.adicionais && item.adicionais.length > 0 && (
                        <div className="text-sm text-gray-600">
                          {item.adicionais.map((adicional, idx) => (
                            <div key={idx}>
                              {adicional.sabor && <span className="font-medium">{adicional.sabor}: </span>}
                              {adicional.itens.map((a: any) => a.nome).join(", ")}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <p className="font-medium text-gray-900 ml-4">
                  {formatCurrency(item.preco * item.quantidade)}
                </p>
              </div>
            </Card>
          ))}
        </div>
        
        {/* Resumo de Valores */}
        <div className="space-y-2 mb-6">
          {deliveryType === "delivery" && (
            <div className="flex justify-between text-gray-600">
              <span>entrega:</span>
              <span className="text-red-600">{formatCurrency(deliveryFee)}</span>
            </div>
          )}
          <div className="flex justify-between text-gray-600">
            <span>subtotal:</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
        </div>
        
        {/* Total */}
        <div className="text-center mb-8">
          <p className="text-gray-600 text-sm mb-1">total:</p>
          <p className="text-4xl font-bold text-gray-900">
            {formatCurrency(total)}
          </p>
        </div>
      </div>
      
      {/* Botão Fixo */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
        <div className="max-w-2xl mx-auto">
          <Button
            onClick={handleContinuar}
            className="w-full h-14 text-lg font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg"
          >
            CONTINUAR
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  )
}
