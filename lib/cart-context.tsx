"use client"

import type React from "react"
import { createContext, useContext, useReducer, useEffect, type ReactNode } from "react"

export interface CartItem {
  id: string
  nome: string
  tamanho: "broto" | "tradicional"
  sabores: string[]
  preco: number
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
  | { type: "CLEAR_CART" }

const CartContext = createContext<{
  state: CartState
  dispatch: React.Dispatch<CartAction>
  clearLocalStorage: () => void
} | null>(null)

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case "ADD_ITEM": {
      const existingItemIndex = state.items.findIndex(
        (item) =>
          item.id === action.payload.id &&
          item.tamanho === action.payload.tamanho &&
          JSON.stringify(item.sabores.sort()) === JSON.stringify(action.payload.sabores.sort()) &&
          JSON.stringify(item.adicionais || []) === JSON.stringify(action.payload.adicionais || []) &&
          JSON.stringify(item.bordaRecheada || null) === JSON.stringify(action.payload.bordaRecheada || null),
      )

      let newItems: CartItem[]

      if (existingItemIndex >= 0) {
        newItems = state.items.map((item, index) =>
          index === existingItemIndex ? { ...item, quantidade: item.quantidade + 1 } : item,
        )
      } else {
        newItems = [...state.items, { ...action.payload, quantidade: 1 }]
      }

      const newTotal = newItems.reduce((sum, item) => sum + item.preco * item.quantidade, 0)

      return {
        items: newItems,
        total: newTotal,
      }
    }

    case "REMOVE_ITEM": {
      const newItems = state.items.filter((item) => item.id !== action.payload)
      const newTotal = newItems.reduce((sum, item) => sum + item.preco * item.quantidade, 0)

      return {
        items: newItems,
        total: newTotal,
      }
    }

    case "UPDATE_QUANTITY": {
      const newItems = state.items
        .map((item) => (item.id === action.payload.id ? { ...item, quantidade: action.payload.quantidade } : item))
        .filter((item) => item.quantidade > 0)

      const newTotal = newItems.reduce((sum, item) => sum + item.preco * item.quantidade, 0)

      return {
        items: newItems,
        total: newTotal,
      }
    }

    case "UPDATE_ADICIONAIS": {
      const newItems = state.items.map((item) => {
        if (item.id === action.payload.id) {
          // Calcular novo preço incluindo adicionais
          const adicionaisPrice = action.payload.adicionais.reduce((sum, grupo) => 
            sum + grupo.itens.reduce((itemSum, adicional) => itemSum + adicional.preco, 0), 0
          )
          
          // O preço base do item (sem adicionais anteriores)
          const basePrice = item.preco - (item.adicionais?.reduce((sum, grupo) => 
            sum + grupo.itens.reduce((itemSum, adicional) => itemSum + adicional.preco, 0), 0
          ) || 0)
          
          const newPrice = basePrice + adicionaisPrice
          
          return {
            ...item,
            adicionais: action.payload.adicionais,
            preco: newPrice
          }
        }
        return item
      })

      const newTotal = newItems.reduce((sum, item) => sum + item.preco * item.quantidade, 0)

      return {
        items: newItems,
        total: newTotal,
      }
    }

    case "UPDATE_BORDA": {
      const newItems = state.items.map((item) => {
        if (item.id === action.payload.id) {
          // Calcular preço base (sem borda anterior)
          const basePrice = item.preco - (item.bordaRecheada?.preco || 0)
          
          // Calcular novo preço com nova borda
          const newPrice = basePrice + (action.payload.bordaRecheada?.preco || 0)
          
          return {
            ...item,
            bordaRecheada: action.payload.bordaRecheada,
            preco: newPrice
          }
        }
        return item
      })

      const newTotal = newItems.reduce((sum, item) => sum + item.preco * item.quantidade, 0)

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

      const newTotal = newItems.reduce((sum, item) => sum + item.preco * item.quantidade, 0)

      return {
        items: newItems,
        total: newTotal,
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

  // Salvar no localStorage sempre que o estado mudar
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("pizzaria-cart", JSON.stringify(state))
      } catch (error) {
        console.error("Erro ao salvar carrinho no localStorage:", error)
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
