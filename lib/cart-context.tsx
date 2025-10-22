"use client"

import type React from "react"
import { createContext, useContext, useReducer, useEffect, useRef, type ReactNode } from "react"

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
  observacoes?: string // Observações gerais do item
  observacoesPorSabor?: { // Observações específicas por sabor (para meio-a-meio)
    sabor: string
    observacoes: string
  }[]
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
  | { type: "UPDATE_OBSERVACOES_SABOR"; payload: { id: string; sabor: string; observacoes: string } }
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
      const newItems = state.items.map((item) =>
        item.id === action.payload.id
          ? { ...item, observacoes: action.payload.observacoes }
          : item
      )

      return {
        ...state,
        items: newItems,
      }
    }

    case "UPDATE_OBSERVACOES_SABOR": {
      const newItems = state.items.map((item) => {
        if (item.id === action.payload.id) {
          const observacoesPorSabor = item.observacoesPorSabor || []
          const saborIndex = observacoesPorSabor.findIndex(obs => obs.sabor === action.payload.sabor)
          
          let newObservacoesPorSabor
          if (saborIndex >= 0) {
            // Atualizar observação existente
            newObservacoesPorSabor = observacoesPorSabor.map((obs, idx) =>
              idx === saborIndex
                ? { ...obs, observacoes: action.payload.observacoes }
                : obs
            )
          } else {
            // Adicionar nova observação para o sabor
            newObservacoesPorSabor = [
              ...observacoesPorSabor,
              { sabor: action.payload.sabor, observacoes: action.payload.observacoes }
            ]
          }
          
          // Remover observações vazias
          newObservacoesPorSabor = newObservacoesPorSabor.filter(obs => obs.observacoes.trim() !== '')
          
          return {
            ...item,
            observacoesPorSabor: newObservacoesPorSabor.length > 0 ? newObservacoesPorSabor : undefined
          }
        }
        return item
      })

      return {
        ...state,
        items: newItems,
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

  // Ref para gerenciar o timer do backup (evita memory leak)
  const backupTimeoutRef = useRef<NodeJS.Timeout | null>(null)

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

  // Salvar no localStorage imediatamente + backup com debounce (SEM memory leak)
  useEffect(() => {
    if (typeof window === "undefined") return

    const cartData = JSON.stringify(state)

    // Salvar imediatamente no localStorage (sempre atualizado)
    try {
      localStorage.setItem("pizzaria-cart", cartData)
    } catch (error) {
      console.error("Erro ao salvar carrinho no localStorage:", error)
    }

    // Backup com debounce (usando ref para evitar memory leak)
    if (backupTimeoutRef.current) {
      clearTimeout(backupTimeoutRef.current)
    }

    backupTimeoutRef.current = setTimeout(() => {
      try {
        sessionStorage.setItem("pizzaria-cart-backup", cartData)
      } catch (backupError) {
        console.error("Erro ao salvar backup:", backupError)
      }
    }, 300)

    // Cleanup function limpa o timeout
    return () => {
      if (backupTimeoutRef.current) {
        clearTimeout(backupTimeoutRef.current)
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
