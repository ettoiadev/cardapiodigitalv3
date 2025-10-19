"use client"

import type React from "react"
import { createContext, useContext, useReducer, useEffect, type ReactNode } from "react"

export interface CartItem {
  id: string
  nome: string
  tamanho: "broto" | "tradicional"
  sabores: string[]
  precoBase: number // Preço base do produto (sem adicionais/borda)
  preco: number // Preço total calculado
  quantidade: number
  tipo: string
  adicionais?: { 
    sabor: string
    itens: { nome: string; preco: number }[]
  }[]
  bordaRecheada?: {
    id: string
    nome: string
    preco: number
  }
  observacoes?: string // Observações específicas do item (preferências, instruções)
}

interface CartState {
  items: CartItem[]
  total: number
}

type CartAction =
  | { type: "ADD_ITEM"; payload: Omit<CartItem, "quantidade"> }
  | { type: "REMOVE_ITEM"; payload: string }
  | { type: "UPDATE_QUANTITY"; payload: { id: string; quantidade: number } }
  | { type: "UPDATE_ADICIONAIS"; payload: { id: string; adicionais: { sabor: string; itens: { nome: string; preco: number }[] }[] } }
  | { type: "UPDATE_BORDA"; payload: { id: string; bordaRecheada?: { id: string; nome: string; preco: number } } }
  | { type: "UPDATE_TAMANHO"; payload: { id: string; tamanho: "broto" | "tradicional"; novoPreco: number } }
  | { type: "UPDATE_OBSERVACOES"; payload: { id: string; observacoes: string } }
  | { type: "CLEAR_CART" }

const CartContext = createContext<{
  state: CartState
  dispatch: React.Dispatch<CartAction>
  clearLocalStorage: () => void
} | null>(null)

// Constante para quantidade máxima por item
const MAX_QUANTITY_PER_ITEM = 50

// Função auxiliar para arredondar valores monetários (previne erros de ponto flutuante)
const roundMoney = (value: number): number => {
  return Math.round(value * 100) / 100
}

// Função auxiliar para comparação profunda determinística
const deepEqual = (a: any, b: any): boolean => {
  if (a === b) return true
  if (a == null || b == null) return false
  if (typeof a !== 'object' || typeof b !== 'object') return false
  
  // Para arrays
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    // Não mutar arrays originais
    const sortedA = [...a].sort()
    const sortedB = [...b].sort()
    return sortedA.every((item, i) => deepEqual(item, sortedB[i]))
  }
  
  // Para objetos
  const keysA = Object.keys(a).sort()
  const keysB = Object.keys(b).sort()
  if (keysA.length !== keysB.length) return false
  if (!keysA.every((k, i) => k === keysB[i])) return false
  
  return keysA.every(key => deepEqual(a[key], b[key]))
}

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case "ADD_ITEM": {
      const existingItemIndex = state.items.findIndex(
        (item) =>
          item.id === action.payload.id &&
          item.tamanho === action.payload.tamanho &&
          deepEqual(item.sabores, action.payload.sabores) &&
          deepEqual(item.adicionais || [], action.payload.adicionais || []) &&
          deepEqual(item.bordaRecheada || null, action.payload.bordaRecheada || null)
      )

      let newItems: CartItem[]

      if (existingItemIndex >= 0) {
        newItems = state.items.map((item, index) => {
          if (index === existingItemIndex) {
            const newQuantity = item.quantidade + 1
            
            // Validar quantidade máxima
            if (newQuantity > MAX_QUANTITY_PER_ITEM) {
              console.warn(`Quantidade máxima atingida: ${MAX_QUANTITY_PER_ITEM}`)
              return item // Não adiciona mais
            }
            
            return { ...item, quantidade: newQuantity }
          }
          return item
        })
      } else {
        // Garantir que precoBase existe ao adicionar novo item
        const itemWithBase = {
          ...action.payload,
          precoBase: action.payload.precoBase || action.payload.preco,
          quantidade: 1
        }
        newItems = [...state.items, itemWithBase]
      }

      const newTotal = roundMoney(newItems.reduce((sum, item) => sum + item.preco * item.quantidade, 0))

      return {
        items: newItems,
        total: newTotal,
      }
    }

    case "REMOVE_ITEM": {
      const newItems = state.items.filter((item) => item.id !== action.payload)
      const newTotal = roundMoney(newItems.reduce((sum, item) => sum + item.preco * item.quantidade, 0))

      return {
        items: newItems,
        total: newTotal,
      }
    }

    case "UPDATE_QUANTITY": {
      const newItems = state.items
        .map((item) => {
          if (item.id === action.payload.id) {
            // Validar quantidade máxima
            const newQuantity = Math.min(action.payload.quantidade, MAX_QUANTITY_PER_ITEM)
            
            if (action.payload.quantidade > MAX_QUANTITY_PER_ITEM) {
              console.warn(`Quantidade máxima atingida: ${MAX_QUANTITY_PER_ITEM}`)
            }
            
            return { ...item, quantidade: newQuantity }
          }
          return item
        })
        .filter((item) => item.quantidade > 0)

      const newTotal = roundMoney(newItems.reduce((sum, item) => sum + item.preco * item.quantidade, 0))

      return {
        items: newItems,
        total: newTotal,
      }
    }

    case "UPDATE_ADICIONAIS": {
      const newItems = state.items.map((item) => {
        if (item.id === action.payload.id) {
          // Calcular preço dos novos adicionais
          const adicionaisPrice = action.payload.adicionais.reduce((sum, grupo) => 
            sum + grupo.itens.reduce((itemSum, adicional) => itemSum + adicional.preco, 0), 0
          )
          
          // Calcular preço da borda (se existir)
          const bordaPrice = item.bordaRecheada?.preco || 0
          
          // Preço total = preço base + adicionais + borda
          const newPrice = roundMoney(item.precoBase + adicionaisPrice + bordaPrice)
          
          return {
            ...item,
            adicionais: action.payload.adicionais,
            preco: newPrice
          }
        }
        return item
      })

      const newTotal = roundMoney(newItems.reduce((sum, item) => sum + item.preco * item.quantidade, 0))

      return {
        items: newItems,
        total: newTotal,
      }
    }

    case "UPDATE_BORDA": {
      const newItems = state.items.map((item) => {
        if (item.id === action.payload.id) {
          // Calcular preço dos adicionais (se existirem)
          const adicionaisPrice = item.adicionais?.reduce((sum, grupo) => 
            sum + grupo.itens.reduce((itemSum, adicional) => itemSum + adicional.preco, 0), 0
          ) || 0
          
          // Calcular preço da nova borda
          const novaBordaPrice = action.payload.bordaRecheada?.preco || 0
          
          // Preço total = preço base + adicionais + nova borda
          const newPrice = roundMoney(item.precoBase + adicionaisPrice + novaBordaPrice)
          
          return {
            ...item,
            bordaRecheada: action.payload.bordaRecheada,
            preco: newPrice
          }
        }
        return item
      })

      const newTotal = roundMoney(newItems.reduce((sum, item) => sum + item.preco * item.quantidade, 0))

      return {
        items: newItems,
        total: newTotal,
      }
    }

    case "UPDATE_TAMANHO": {
      const newItems = state.items.map((item) => {
        if (item.id === action.payload.id) {
          // Atualizar o ID para refletir o novo tamanho
          const newId = item.id.replace(/-tradicional$|-broto$/, `-${action.payload.tamanho}`)
          
          return {
            ...item,
            id: newId,
            tamanho: action.payload.tamanho,
            preco: action.payload.novoPreco
          }
        }
        return item
      })

      const newTotal = roundMoney(newItems.reduce((sum, item) => sum + item.preco * item.quantidade, 0))

      return {
        items: newItems,
        total: newTotal,
      }
    }

    case "UPDATE_OBSERVACOES": {
      const newItems = state.items.map((item) => {
        if (item.id === action.payload.id) {
          return {
            ...item,
            observacoes: action.payload.observacoes
          }
        }
        return item
      })

      return {
        items: newItems,
        total: state.total, // Observações não alteram o preço
      }
    }

    case "CLEAR_CART":
      return {
        items: [],
        total: 0,
      }

    default:
      return state
  }
}

export const CartProvider = ({ children }: { children: ReactNode }) => {
  // Função para carregar estado do localStorage
  const loadInitialState = (): CartState => {
    if (typeof window !== "undefined") {
      try {
        const savedCart = localStorage.getItem("pizzaria-cart")
        if (savedCart) {
          const parsedCart = JSON.parse(savedCart)
          return parsedCart
        }
      } catch (error) {
        console.error("Erro ao carregar carrinho do localStorage:", error)
      }
    }
    return { items: [], total: 0 }
  }

  const [state, dispatch] = useReducer(cartReducer, { items: [], total: 0 }, loadInitialState)

  // Função para limpar localStorage
  const clearLocalStorage = () => {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("pizzaria-cart")
      } catch (error) {
        console.error("Erro ao limpar carrinho do localStorage:", error)
      }
    }
  }

  // Salvar no localStorage imediatamente + backup com debounce
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const cartData = JSON.stringify(state)
        
        // CORREÇÃO: Salvar imediatamente no localStorage
        // Evita perda de dados se usuário fechar aba rapidamente
        localStorage.setItem("pizzaria-cart", cartData)
        
        // Debounce apenas para backup em sessionStorage
        const timer = setTimeout(() => {
          try {
            sessionStorage.setItem("pizzaria-cart-backup", cartData)
          } catch (backupError) {
            console.error("Erro ao salvar backup:", backupError)
          }
        }, 300)
        
        return () => clearTimeout(timer)
      } catch (error) {
        console.error("Erro ao salvar carrinho no localStorage:", error)
        
        // Tentar recuperar do backup se falhar
        try {
          const backup = sessionStorage.getItem("pizzaria-cart-backup")
          if (backup) {
            localStorage.setItem("pizzaria-cart", backup)
            console.log("✅ Carrinho recuperado do backup")
          }
        } catch (backupError) {
          console.error("Erro ao recuperar backup:", backupError)
        }
      }
    }
  }, [state])

  return <CartContext.Provider value={{ state, dispatch, clearLocalStorage }}>{children}</CartContext.Provider>
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
