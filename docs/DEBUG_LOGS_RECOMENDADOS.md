# Logs de Debug Recomendados

## 1. Hook usePedidosKanban

### Adicionar no carregarPedidos (após linha 76):

```typescript
console.log('📊 Pedidos Kanban Carregados:', {
  timestamp: new Date().toISOString(),
  total: data?.length || 0,
  porStatus: data?.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1
    return acc
  }, {} as Record<string, number>),
  comItensResumo: data?.filter(p => p.itens_resumo?.length > 0).length || 0,
  semItensResumo: data?.filter(p => !p.itens_resumo || p.itens_resumo.length === 0).length || 0,
  filtrosAplicados: filtros
})
```

### Adicionar no Realtime UPDATE (após linha 179):

```typescript
console.log('🔄 Realtime UPDATE:', {
  timestamp: new Date().toISOString(),
  pedidoId: payload.new.id,
  camposRecebidos: Object.keys(payload.new),
  statusNovo: payload.new.status,
  statusAnterior: payload.old?.status,
  recarregandoDaView: true
})
```

### Adicionar no atualizarStatus (após linha 106):

```typescript
console.log('✅ Status Atualizado:', {
  timestamp: new Date().toISOString(),
  pedidoId,
  statusNovo: novoStatus,
  alteradoPor: alteradoPor || 'sistema',
  success: true
})
```

---

## 2. CartContext

### Adicionar no reducer (início da função, linha 79):

```typescript
console.log('🛒 Cart Action:', {
  timestamp: new Date().toISOString(),
  action: action.type,
  payload: action.payload,
  estadoAtual: {
    totalItens: state.items.length,
    valorTotal: state.total
  }
})
```

### Adicionar após cálculo do total (linha 117, 127, 152, etc):

```typescript
console.log('💰 Total Recalculado:', {
  timestamp: new Date().toISOString(),
  action: action.type,
  itemsCount: newItems.length,
  totalAnterior: state.total,
  totalNovo: newTotal,
  diferenca: roundMoney(newTotal - state.total)
})
```

### Adicionar no useEffect de localStorage (após linha 295):

```typescript
console.log('💾 Carrinho Salvo:', {
  timestamp: new Date().toISOString(),
  itemsCount: state.items.length,
  total: state.total,
  tamanhoBytes: new Blob([cartData]).size,
  localStorage: 'success',
  sessionStorage: 'pending'
})
```

---

## 3. Checkout Page

### Adicionar no searchCep (após linha 387):

```typescript
console.log('📍 CEP Encontrado:', {
  timestamp: new Date().toISOString(),
  cep: cleanCep,
  endereco: {
    logradouro: data.logradouro,
    bairro: data.bairro,
    cidade: data.localidade,
    uf: data.uf
  },
  temLogradouro: !!data.logradouro,
  temBairro: !!data.bairro
})
```

### Adicionar no handleCepChange (após linha 421):

```typescript
console.log('⌨️ CEP Digitado:', {
  timestamp: new Date().toISOString(),
  valorDigitado: value,
  valorSanitizado: masked,
  digitos: masked.replace(/\D/g, "").length,
  completo: masked.replace(/\D/g, "").length === 8,
  debounceAtivo: !!cepDebounceRef.current
})
```

### Adicionar no isFormValid (após linha 446):

```typescript
console.log('✅ Validação Formulário:', {
  timestamp: new Date().toISOString(),
  checks: {
    carrinhoVazio: !state.items || state.items.length === 0,
    nomeValido: customerName.length >= 3,
    telefoneValido: customerPhone.replace(/\D/g, "").length >= 10,
    cepValido: deliveryType === 'delivery' ? customerCep.length === 9 : true,
    enderecoValido: deliveryType === 'delivery' ? !!addressData : true,
    numeroValido: deliveryType === 'delivery' ? addressNumber.length > 0 : true
  },
  resultado: isFormValid() // Assumindo que a função retorna boolean
})
```

### Adicionar no handleSubmit (início da função):

```typescript
console.log('🚀 Iniciando Checkout:', {
  timestamp: new Date().toISOString(),
  carrinho: {
    itens: state.items.length,
    total: state.total
  },
  cliente: {
    nome: customerName,
    telefone: customerPhone,
    tipoEntrega: deliveryType
  },
  pagamento: paymentMethod,
  temPromocao: hasPromocaoPizzas()
})
```

---

## 4. Admin Pedidos Page

### Adicionar no handleDragEnd (após linha 196):

```typescript
console.log('🎯 Drag & Drop:', {
  timestamp: new Date().toISOString(),
  pedidoId: active.id,
  origem: pedidoArrastando?.status,
  destino: over?.id,
  validacao: validarTransicao(
    pedidoArrastando?.status as StatusPedido,
    over?.id as StatusPedido
  )
})
```

### Adicionar após atualização de status (após chamada de atualizarStatus):

```typescript
console.log('✅ Status Atualizado no Kanban:', {
  timestamp: new Date().toISOString(),
  pedidoId: active.id,
  numeroPedido: pedidoArrastando?.numero_pedido,
  statusAnterior: pedidoArrastando?.status,
  statusNovo: over?.id,
  success: resultado // Assumindo que atualizarStatus retorna boolean
})
```

---

## 5. Realtime Subscriptions

### Adicionar no useEffect de Realtime (após subscribe):

```typescript
console.log('🔌 Realtime Conectado:', {
  timestamp: new Date().toISOString(),
  canal: 'pedidos-kanban-changes',
  tabela: 'pedidos',
  eventos: ['INSERT', 'UPDATE', 'DELETE'],
  status: 'subscribed'
})
```

### Adicionar no cleanup (dentro do return):

```typescript
return () => {
  console.log('🔌 Realtime Desconectado:', {
    timestamp: new Date().toISOString(),
    canal: 'pedidos-kanban-changes',
    status: 'unsubscribed'
  })
  supabase.removeChannel(channel)
}
```

---

## 6. Configuração de Ambiente

### Variável de ambiente para controlar logs:

Adicionar em `.env.local`:

```env
NEXT_PUBLIC_DEBUG_MODE=true
NEXT_PUBLIC_DEBUG_LEVEL=verbose # verbose | info | error
```

### Wrapper de log condicional:

```typescript
// lib/debug-logger.ts
export const debugLog = (category: string, message: string, data?: any) => {
  if (process.env.NEXT_PUBLIC_DEBUG_MODE !== 'true') return
  
  const level = process.env.NEXT_PUBLIC_DEBUG_LEVEL || 'info'
  
  const emoji = {
    cart: '🛒',
    pedidos: '📊',
    realtime: '🔌',
    checkout: '💳',
    cep: '📍',
    validation: '✅',
    error: '❌'
  }[category] || '📝'
  
  const logData = {
    timestamp: new Date().toISOString(),
    category,
    message,
    ...data
  }
  
  if (level === 'verbose' || category === 'error') {
    console.log(`${emoji} ${message}`, logData)
  } else if (level === 'info' && category !== 'error') {
    console.log(`${emoji} ${message}`)
  }
}

// Uso:
import { debugLog } from '@/lib/debug-logger'

debugLog('cart', 'Item adicionado', { itemId, quantidade })
```

---

## 7. Monitoramento de Performance

### Adicionar em componentes críticos:

```typescript
useEffect(() => {
  const startTime = performance.now()
  
  // Operação pesada
  carregarPedidos()
  
  const endTime = performance.now()
  console.log('⏱️ Performance:', {
    operacao: 'carregarPedidos',
    duracao: `${(endTime - startTime).toFixed(2)}ms`,
    timestamp: new Date().toISOString()
  })
}, [])
```

---

## 8. Logs de Erro Estruturados

### Substituir console.error por:

```typescript
const logError = (context: string, error: any, additionalData?: any) => {
  console.error('❌ Erro:', {
    timestamp: new Date().toISOString(),
    context,
    errorMessage: error?.message || String(error),
    errorStack: error?.stack,
    errorName: error?.name,
    ...additionalData
  })
  
  // Opcional: Enviar para serviço de monitoramento
  // sendToSentry(error, { context, ...additionalData })
}

// Uso:
try {
  await carregarPedidos()
} catch (error) {
  logError('usePedidosKanban.carregarPedidos', error, {
    filtros,
    tentativa: retryCount
  })
}
```

---

## Prioridade de Implementação

1. **ALTA**: Logs de erro estruturados (item 8)
2. **ALTA**: Logs de Realtime (item 5)
3. **MÉDIA**: Logs de validação (item 3)
4. **MÉDIA**: Logs de Cart (item 2)
5. **BAIXA**: Logs de performance (item 7)
6. **BAIXA**: Wrapper condicional (item 6)

## Notas

- Remover logs verbosos em produção ou usar variável de ambiente
- Considerar usar biblioteca de logging estruturado (Winston, Pino)
- Logs devem ser JSON-serializáveis para facilitar análise
- Evitar logar dados sensíveis (senhas, tokens, dados pessoais completos)
