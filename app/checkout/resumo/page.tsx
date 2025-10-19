"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Bike, Store, Loader2, ChevronRight, Trash2, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { useCart } from "@/lib/cart-context"
import { formatCurrency } from "@/lib/currency-utils"
import { supabase } from "@/lib/supabase"
import { getCliente } from "@/lib/auth"
import { toast } from "sonner"

export default function CheckoutResumoPage() {
  const router = useRouter()
  const { state, dispatch } = useCart()
  
  const [loading, setLoading] = useState(true)
  const [deliveryType, setDeliveryType] = useState<"delivery" | "balcao">("delivery")
  const [taxaEntrega, setTaxaEntrega] = useState<number>(0)
  const [clienteLogado, setClienteLogado] = useState<any>(null)
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set())
  const [produtosData, setProdutosData] = useState<Map<string, any>>(new Map())
  
  // Carregar dados dos produtos para obter adicionais disponíveis
  useEffect(() => {
    const loadProdutos = async () => {
      if (!state.items || state.items.length === 0) return
      
      try {
        // Extrair IDs únicos dos produtos
        const produtoIds = state.items
          .map(item => {
            // Remover sufixos -tradicional, -broto, multi-
            let id = item.id
            if (id.startsWith('multi-')) return null
            id = id.replace(/-tradicional$|-broto$/g, '')
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
            return uuidRegex.test(id) ? id : null
          })
          .filter(Boolean)
        
        if (produtoIds.length === 0) return
        
        const { data, error } = await supabase
          .from("produtos")
          .select("id, nome, descricao, adicionais")
          .in("id", produtoIds)
        
        if (!error && data) {
          const produtosMap = new Map()
          data.forEach(produto => {
            produtosMap.set(produto.id, produto)
          })
          setProdutosData(produtosMap)
          console.log("✅ Produtos carregados:", data)
        }
      } catch (error) {
        console.error("❌ Erro ao carregar produtos:", error)
      }
    }
    
    loadProdutos()
  }, [state.items])
  
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
    } else if (state.items && state.items.length > 0) {
      console.log("🛒 Itens no carrinho:", state.items.map(item => ({ nome: item.nome, tipo: item.tipo })))
    }
  }, [state.items, loading, router])
  
  // Calcular totais
  const subtotal = state.total || 0
  const deliveryFee = deliveryType === "delivery" ? taxaEntrega : 0
  const total = subtotal + deliveryFee
  
  // Remover item do carrinho
  const handleRemoverItem = (index: number) => {
    const item = state.items[index]
    dispatch({ 
      type: 'REMOVE_ITEM', 
      payload: item.id
    })
    toast.success("Item removido do carrinho")
  }
  
  // Atualizar quantidade do item
  const handleQuantidadeChange = (itemId: string, novaQuantidade: number) => {
    if (novaQuantidade < 1) return
    if (novaQuantidade > 50) {
      toast.error("Quantidade máxima: 50 unidades")
      return
    }
    
    dispatch({
      type: 'UPDATE_QUANTITY',
      payload: { id: itemId, quantidade: novaQuantidade }
    })
  }
  
  // Toggle expandir item
  const toggleExpandItem = (index: number) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedItems(newExpanded)
  }
  
  // Adicionar/remover adicional do item
  const handleAdicionalToggle = (itemId: string, adicional: { nome: string; preco: number }, checked: boolean) => {
    const item = state.items.find(i => i.id === itemId)
    if (!item) return
    
    // Para pizzas de 1 sabor, adicionar ao sabor principal
    const sabor = item.sabores[0] || ""
    const currentAdicionais = item.adicionais || []
    
    // Encontrar o grupo de adicionais para este sabor
    const saborIndex = currentAdicionais.findIndex(a => a.sabor === sabor)
    
    let newAdicionais
    if (checked) {
      // Adicionar o adicional
      if (saborIndex >= 0) {
        // Sabor já existe, adicionar item
        newAdicionais = currentAdicionais.map((a, idx) => {
          if (idx === saborIndex) {
            return {
              ...a,
              itens: [...a.itens, adicional]
            }
          }
          return a
        })
      } else {
        // Criar novo grupo para o sabor
        newAdicionais = [
          ...currentAdicionais,
          {
            sabor,
            itens: [adicional]
          }
        ]
      }
    } else {
      // Remover o adicional
      newAdicionais = currentAdicionais.map(a => ({
        ...a,
        itens: a.itens.filter(i => i.nome !== adicional.nome)
      })).filter(a => a.itens.length > 0)
    }
    
    // Recalcular preço
    const adicionaisTotal = newAdicionais.reduce((sum, grupo) => 
      sum + grupo.itens.reduce((itemSum, item) => itemSum + item.preco, 0), 0
    )
    const bordaPreco = item.bordaRecheada?.preco || 0
    const novoPreco = item.precoBase + adicionaisTotal + bordaPreco
    
    dispatch({
      type: 'UPDATE_ADICIONAIS',
      payload: { id: itemId, adicionais: newAdicionais }
    })
  }
  
  // Atualizar observações do item
  const handleObservacoesChange = (itemId: string, observacoes: string) => {
    dispatch({
      type: 'UPDATE_OBSERVACOES',
      payload: { id: itemId, observacoes }
    })
  }
  
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
            <Card key={index} className="p-4 relative">
              {/* Botão Remover */}
              <button
                onClick={() => handleRemoverItem(index)}
                className="absolute top-3 right-3 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                aria-label="Remover item"
              >
                <Trash2 className="w-5 h-5" />
              </button>
              
              <div className="flex justify-between items-start mb-2 pr-10">
                <div className="flex-1">
                  <div className="flex items-start gap-3">
                    {/* Controles de Quantidade */}
                    <div className="flex flex-col items-center gap-2 mt-1">
                      <button
                        onClick={() => handleQuantidadeChange(item.id, item.quantidade + 1)}
                        className="text-red-600 hover:text-red-700 transition-colors"
                        aria-label="Aumentar quantidade"
                      >
                        <ChevronUp className="w-5 h-5" strokeWidth={3} />
                      </button>
                      <span className="text-xl font-bold text-gray-900 min-w-[24px] text-center">{item.quantidade}</span>
                      <button
                        onClick={() => handleQuantidadeChange(item.id, item.quantidade - 1)}
                        className="text-red-600 hover:text-red-700 transition-colors"
                        aria-label="Diminuir quantidade"
                      >
                        <ChevronDown className="w-5 h-5" strokeWidth={3} />
                      </button>
                    </div>
                    
                    <div className="flex-1">
                      {/* Mostrar nome e ingredientes */}
                      {(() => {
                        // Para pizza de 1 sabor
                        if (item.sabores.length === 1) {
                          return (
                            <>
                              <p className="font-medium text-gray-900">{item.nome}</p>
                              {item.tamanho && (
                                <p className="text-sm text-gray-600 capitalize">
                                  Tamanho: {item.tamanho}
                                </p>
                              )}
                              {(() => {
                                const produtoId = item.id.replace(/-tradicional$|-broto$/g, '')
                                const produto = produtosData.get(produtoId)
                                if (produto?.descricao) {
                                  return (
                                    <p className="text-sm text-gray-600">
                                      {produto.descricao}
                                    </p>
                                  )
                                }
                                return null
                              })()}
                            </>
                          )
                        }
                        
                        // Para pizzas meio a meio (múltiplos sabores)
                        if (item.sabores && item.sabores.length > 1) {
                          return (
                            <>
                              <div className="space-y-2">
                                {item.sabores.map((sabor, idx) => {
                                  // Buscar produto pelo nome do sabor
                                  const produtoSabor = Array.from(produtosData.values()).find(p => p.nome === sabor)
                                  return (
                                    <div key={idx} className="border-l-2 border-red-600 pl-2">
                                      <p className="font-medium text-gray-900">
                                        1/{item.sabores.length} {sabor}
                                      </p>
                                      {produtoSabor?.descricao && (
                                        <p className="text-xs text-gray-600">
                                          {produtoSabor.descricao}
                                        </p>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                              {item.tamanho && (
                                <p className="text-sm text-gray-600 capitalize mt-2">
                                  Tamanho: {item.tamanho}
                                </p>
                              )}
                            </>
                          )
                        }
                        return null
                      })()}
                      
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
                      
                      {/* Mostrar observações */}
                      {item.observacoes && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Obs:</span> {item.observacoes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <p className="font-medium text-gray-900 ml-4">
                  {formatCurrency(item.preco * item.quantidade)}
                </p>
              </div>
              
              {/* Botão para expandir opcionais */}
              {(item.tipo === "pizza" || item.tipo === "salgada" || item.tipo === "doce") && (
                <button
                  onClick={() => toggleExpandItem(index)}
                  className="w-full mt-3 pt-3 border-t flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-red-600 transition-colors"
                >
                  {expandedItems.has(index) ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      <span className="font-bold text-green-600">Ocultar opcionais</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      <span className="font-bold text-green-600">Personalizar pizza</span>
                    </>
                  )}
                </button>
              )}
              
              {/* Seção expansível de adicionais e observações */}
              {expandedItems.has(index) && (item.tipo === "pizza" || item.tipo === "salgada" || item.tipo === "doce") && (() => {
                // Para pizza de 1 sabor
                if (item.sabores.length === 1) {
                  const produtoId = item.id.replace(/-tradicional$|-broto$/g, '')
                  const produto = produtosData.get(produtoId)
                  const adicionaisDisponiveis = produto?.adicionais || []
                  const adicionaisSelecionados = item.adicionais?.flatMap(a => a.itens.map(i => i.nome)) || []
                  
                  return (
                    <div className="mt-4 pt-4 border-t space-y-4">
                      {/* Adicionais Pagos */}
                      {adicionaisDisponiveis.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-3">Adicionais</h4>
                          <div className="space-y-2">
                            {adicionaisDisponiveis.map((adicional: any, idx: number) => (
                              <div key={idx} className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`${item.id}-adicional-${idx}`}
                                    checked={adicionaisSelecionados.includes(adicional.nome)}
                                    onCheckedChange={(checked) => 
                                      handleAdicionalToggle(item.id, adicional, checked as boolean)
                                    }
                                  />
                                  <label
                                    htmlFor={`${item.id}-adicional-${idx}`}
                                    className="text-sm text-gray-700 cursor-pointer"
                                  >
                                    {adicional.nome}
                                  </label>
                                </div>
                                <span className="text-sm font-medium text-red-600">
                                  + {formatCurrency(adicional.preco)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Observações */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Observações</h4>
                        <Textarea
                          placeholder="Ex: sem cebola..."
                          value={item.observacoes || ""}
                          onChange={(e) => handleObservacoesChange(item.id, e.target.value)}
                          className="resize-none h-20 text-sm"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Use este campo para preferências como: sem cebola
                        </p>
                      </div>
                    </div>
                  )
                }
                
                // Para pizzas meio a meio (múltiplos sabores)
                if (item.sabores.length > 1) {
                  return (
                    <div className="mt-4 pt-4 border-t space-y-6">
                      {item.sabores.map((sabor, saborIdx) => {
                        // Buscar produto pelo nome do sabor
                        const produtoSabor = Array.from(produtosData.values()).find(p => p.nome === sabor)
                        const adicionaisDisponiveis = produtoSabor?.adicionais || []
                        
                        // Obter adicionais já selecionados para este sabor
                        const adicionaisDoSabor = item.adicionais?.find(a => a.sabor === sabor)
                        const adicionaisSelecionados = adicionaisDoSabor?.itens.map(i => i.nome) || []
                        
                        return (
                          <div key={saborIdx} className="border-l-2 border-red-600 pl-3 space-y-4">
                            <h3 className="text-sm font-bold text-gray-900">
                              1/{item.sabores.length} {sabor}
                            </h3>
                            
                            {/* Adicionais por sabor */}
                            {adicionaisDisponiveis.length > 0 && (
                              <div>
                                <h4 className="text-sm font-medium text-gray-900 mb-2">Adicionais</h4>
                                <div className="space-y-2">
                                  {adicionaisDisponiveis.map((adicional: any, idx: number) => (
                                    <div key={idx} className="flex items-center justify-between">
                                      <div className="flex items-center space-x-2">
                                        <Checkbox
                                          id={`${item.id}-${saborIdx}-adicional-${idx}`}
                                          checked={adicionaisSelecionados.includes(adicional.nome)}
                                          onCheckedChange={(checked) => {
                                            // Atualizar adicionais para este sabor específico
                                            const currentAdicionais = item.adicionais || []
                                            let newAdicionais
                                            
                                            const saborIndex = currentAdicionais.findIndex(a => a.sabor === sabor)
                                            
                                            if (checked) {
                                              if (saborIndex >= 0) {
                                                newAdicionais = currentAdicionais.map((a, i) => {
                                                  if (i === saborIndex) {
                                                    return { ...a, itens: [...a.itens, adicional] }
                                                  }
                                                  return a
                                                })
                                              } else {
                                                newAdicionais = [...currentAdicionais, { sabor, itens: [adicional] }]
                                              }
                                            } else {
                                              newAdicionais = currentAdicionais.map(a => ({
                                                ...a,
                                                itens: a.itens.filter(i => i.nome !== adicional.nome)
                                              })).filter(a => a.itens.length > 0)
                                            }
                                            
                                            dispatch({
                                              type: 'UPDATE_ADICIONAIS',
                                              payload: { id: item.id, adicionais: newAdicionais }
                                            })
                                          }}
                                        />
                                        <label
                                          htmlFor={`${item.id}-${saborIdx}-adicional-${idx}`}
                                          className="text-sm text-gray-700 cursor-pointer"
                                        >
                                          {adicional.nome}
                                        </label>
                                      </div>
                                      <span className="text-sm font-medium text-red-600">
                                        + {formatCurrency(adicional.preco)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Observações por sabor */}
                            <div>
                              <h4 className="text-sm font-medium text-gray-900 mb-2">Observações</h4>
                              <Textarea
                                placeholder="Ex: sem cebola..."
                                value={item.observacoes || ""}
                                onChange={(e) => handleObservacoesChange(item.id, e.target.value)}
                                className="resize-none h-16 text-sm"
                              />
                            </div>
                          </div>
                        )
                      })}
                      
                      <p className="text-xs text-gray-500">
                        Use os campos acima para preferências de cada sabor
                      </p>
                    </div>
                  )
                }
                
                return null
              })()}
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
