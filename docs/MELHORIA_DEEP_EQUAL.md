# Melhoria Sugerida: deepEqual para Objetos Complexos

## Problema Potencial

A função `deepEqual` em `cart-context.tsx` usa `.sort()` em arrays, mas o sort padrão do JavaScript converte elementos para string, o que pode causar comparações incorretas para objetos complexos.

## Exemplo do Problema

```typescript
const arr1 = [{ nome: "Bacon", preco: 5 }, { nome: "Cheddar", preco: 3 }]
const arr2 = [{ nome: "Cheddar", preco: 3 }, { nome: "Bacon", preco: 5 }]

// Sort padrão converte para string: "[object Object]"
// Pode não ordenar corretamente
```

## Solução Recomendada

```typescript
const deepEqual = (a: any, b: any): boolean => {
  if (a === b) return true
  if (a == null || b == null) return false
  if (typeof a !== 'object' || typeof b !== 'object') return false
  
  // Para arrays
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    
    // MELHORIA: Sort com comparador customizado para objetos
    const sortedA = [...a].sort((x, y) => {
      const strX = JSON.stringify(x)
      const strY = JSON.stringify(y)
      return strX.localeCompare(strY)
    })
    const sortedB = [...b].sort((x, y) => {
      const strX = JSON.stringify(x)
      const strY = JSON.stringify(y)
      return strX.localeCompare(strY)
    })
    
    return sortedA.every((item, i) => deepEqual(item, sortedB[i]))
  }
  
  // Para objetos
  const keysA = Object.keys(a).sort()
  const keysB = Object.keys(b).sort()
  if (keysA.length !== keysB.length) return false
  if (!keysA.every((k, i) => k === keysB[i])) return false
  
  return keysA.every(key => deepEqual(a[key], b[key]))
}
```

## Alternativa: Biblioteca Especializada

Para casos mais complexos, considerar usar biblioteca como `lodash.isequal`:

```bash
npm install lodash.isequal
npm install --save-dev @types/lodash.isequal
```

```typescript
import isEqual from 'lodash.isequal'

// Uso
if (isEqual(item.adicionais, action.payload.adicionais)) {
  // ...
}
```

## Prioridade

**BAIXA** - A implementação atual funciona bem para os casos de uso atuais (adicionais, bordas). Considerar apenas se houver bugs reportados relacionados a comparação de itens no carrinho.

## Testes Recomendados

```typescript
// Teste 1: Adicionais em ordem diferente
const item1 = {
  adicionais: [
    { sabor: "Calabresa", itens: [{ nome: "Bacon", preco: 5 }] },
    { sabor: "Frango", itens: [{ nome: "Cheddar", preco: 3 }] }
  ]
}

const item2 = {
  adicionais: [
    { sabor: "Frango", itens: [{ nome: "Cheddar", preco: 3 }] },
    { sabor: "Calabresa", itens: [{ nome: "Bacon", preco: 5 }] }
  ]
}

// Deve retornar true (mesmos adicionais, ordem diferente)
console.assert(deepEqual(item1.adicionais, item2.adicionais) === true)

// Teste 2: Itens dentro de adicionais em ordem diferente
const item3 = {
  adicionais: [
    { sabor: "Calabresa", itens: [
      { nome: "Bacon", preco: 5 },
      { nome: "Cheddar", preco: 3 }
    ]}
  ]
}

const item4 = {
  adicionais: [
    { sabor: "Calabresa", itens: [
      { nome: "Cheddar", preco: 3 },
      { nome: "Bacon", preco: 5 }
    ]}
  ]
}

// Deve retornar true
console.assert(deepEqual(item3.adicionais, item4.adicionais) === true)
```
