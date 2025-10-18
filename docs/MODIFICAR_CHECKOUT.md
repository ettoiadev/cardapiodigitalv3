# 🛒 MODIFICAÇÃO DO CHECKOUT

**Data:** 18/10/2025  
**Arquivo:** `/app/checkout/page.tsx`  
**Status:** Instruções de modificação

---

## 🎯 OBJETIVO

Substituir a função `handleFinishOrder()` que envia para WhatsApp por uma nova função que salva o pedido no banco de dados.

---

## 📝 MODIFICAÇÕES NECESSÁRIAS

### **1. Substituir a função `handleFinishOrder()`**

**Localização:** Linha 619-701

**REMOVER:** Toda a função antiga (83 linhas)

**ADICIONAR:** Nova função abaixo

```typescript
// Finalizar pedido - NOVA VERSÃO
const handleFinishOrder = async () => {
  console.log("🔄 Iniciando processo de finalização do pedido...")
  
  // Validações
  if (!isFormValid()) {
    toast.error("Por favor, preencha todos os campos obrigatórios")
    return
  }

  if (!isMinimumMet) {
    toast.error(`Valor mínimo do pedido é ${formatCurrency(storeConfig?.valor_minimo || 0)}`)
    return
  }

  setSubmitting(true)

  try {
    // Preparar dados do pedido
    const deliveryFee = deliveryType === "delivery" ? (storeConfig?.taxa_entrega || 0) : 0
    const subtotal = state.total || 0
    const total = subtotal + deliveryFee

    // Preparar endereço (se delivery)
    const endereco = deliveryType === "delivery" && addressData ? {
      rua: addressData.logradouro,
      numero: addressNumber,
      bairro: addressData.bairro,
      cidade: addressData.localidade,
      estado: addressData.uf,
      cep: customerCep,
      complemento: addressComplement
    } : null

    // Preparar itens do pedido
    const itens = state.items.map(item => ({
      produto_id: item.id,
      nome: item.nome,
      tamanho: item.tamanho,
      sabores: item.sabores,
      quantidade: item.quantidade,
      preco_unitario: item.preco / item.quantidade,
      preco_total: item.preco * item.quantidade,
      adicionais: item.adicionais || null,
      borda_recheada: item.bordaRecheada || null,
      observacoes: null
    }))

    // Preparar dados completos do pedido
    const pedidoData = {
      tipo_entrega: deliveryType,
      endereco,
      forma_pagamento: paymentMethod,
      troco_para: paymentMethod === 'dinheiro' && trocoValue ? parseFloat(trocoValue) : null,
      observacoes: orderNotes || null,
      subtotal,
      taxa_entrega: deliveryFee,
      desconto: 0,
      total,
      itens
    }

    console.log("📦 Enviando pedido para API...", pedidoData)

    // Chamar API para criar pedido
    const response = await fetch('/api/pedidos/criar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(pedidoData)
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Erro ao criar pedido')
    }

    console.log("✅ Pedido criado com sucesso!", result)

    // Mostrar sucesso
    toast.success("Pedido realizado com sucesso!")

    // Limpar carrinho
    dispatch({ type: 'CLEAR_CART' })

    // Redirecionar para página de confirmação
    setTimeout(() => {
      router.push(`/pedido/${result.pedido.id}/confirmacao`)
    }, 1000)

  } catch (error: any) {
    console.error("❌ Erro ao finalizar pedido:", error)
    toast.error(error.message || "Erro ao finalizar pedido. Tente novamente.")
  } finally {
    setSubmitting(false)
  }
}
```

---

### **2. Adicionar imports necessários**

**No topo do arquivo, adicionar:**

```typescript
import { toast } from "sonner"
```

---

### **3. Remover funções não utilizadas (OPCIONAL)**

Estas funções eram usadas apenas para WhatsApp:

```typescript
// Pode remover (linhas 587-606):
- sanitizeWhatsappNumber()
- sanitizeMessage()

// Pode remover (linhas 399-497):
- generateWhatsAppMessage()
```

**NOTA:** Mantenha essas funções se quiser enviar notificação para o admin via WhatsApp também.

---

## 🔄 FLUXO NOVO

### **Antes (WhatsApp):**
```
1. Cliente preenche checkout
2. Clica "Finalizar Pedido"
3. Gera mensagem formatada
4. Abre WhatsApp
5. Envia mensagem
6. ❌ Nada é salvo no banco
```

### **Agora (Banco de Dados):**
```
1. Cliente preenche checkout
2. Clica "Finalizar Pedido"
3. Valida dados
4. Chama API /api/pedidos/criar
5. ✅ Salva pedido no banco
6. ✅ Salva itens do pedido
7. ✅ Gera número do pedido (PED-001)
8. Limpa carrinho
9. Redireciona para /pedido/[id]/confirmacao
```

---

## 📊 DADOS ENVIADOS PARA API

```typescript
{
  tipo_entrega: "delivery" | "balcao",
  endereco: {
    rua: string,
    numero: string,
    bairro: string,
    cidade: string,
    estado: string,
    cep: string,
    complemento: string
  } | null,
  forma_pagamento: "pix" | "dinheiro" | "debito" | "credito" | "ticket_alimentacao",
  troco_para: number | null,
  observacoes: string | null,
  subtotal: number,
  taxa_entrega: number,
  desconto: number,
  total: number,
  itens: [
    {
      produto_id: string,
      nome: string,
      tamanho: "broto" | "tradicional",
      sabores: string[],
      quantidade: number,
      preco_unitario: number,
      preco_total: number,
      adicionais: object | null,
      borda_recheada: object | null,
      observacoes: string | null
    }
  ]
}
```

---

## ✅ VALIDAÇÕES

A nova função valida:
- ✅ Formulário completo
- ✅ Valor mínimo do pedido
- ✅ Autenticação (middleware já faz isso)
- ✅ Dados obrigatórios
- ✅ Resposta da API

---

## 🎨 FEEDBACK VISUAL

A nova função usa:
- ✅ `toast.error()` para erros
- ✅ `toast.success()` para sucesso
- ✅ `setSubmitting(true/false)` para loading
- ✅ Console.log para debug
- ✅ Redirecionamento automático

---

## 🧪 COMO TESTAR

### **1. Fazer login:**
```
http://localhost:3000/login
```

### **2. Adicionar produtos ao carrinho:**
```
http://localhost:3000
```

### **3. Ir para checkout:**
```
http://localhost:3000/checkout
```

### **4. Preencher todos os campos:**
- Tipo de entrega
- Endereço (se delivery)
- Forma de pagamento
- Observações (opcional)

### **5. Clicar "Finalizar Pedido"**

### **6. Verificar:**
- ✅ Toast de sucesso
- ✅ Redirecionamento para confirmação
- ✅ Pedido no banco (tabela `pedidos`)
- ✅ Itens no banco (tabela `pedido_itens`)
- ✅ Número gerado (PED-001, PED-002...)

---

## 🔍 VERIFICAR NO BANCO

```sql
-- Ver último pedido criado
SELECT * FROM pedidos ORDER BY created_at DESC LIMIT 1;

-- Ver itens do pedido
SELECT * FROM pedido_itens WHERE pedido_id = 'uuid-do-pedido';

-- Ver número gerado
SELECT numero_pedido FROM pedidos ORDER BY created_at DESC LIMIT 1;
```

---

## ⚠️ IMPORTANTE

### **Manter compatibilidade:**
Se quiser manter o envio para WhatsApp como **notificação adicional** para o admin:

1. Mantenha a função `generateWhatsAppMessage()`
2. Após salvar no banco com sucesso, chame:

```typescript
// Após criar pedido com sucesso
if (result.success && storeConfig?.whatsapp) {
  // Enviar notificação para admin via WhatsApp
  const message = generateWhatsAppMessage()
  const whatsappUrl = `https://wa.me/${storeConfig.whatsapp}?text=${encodeURIComponent(message)}`
  window.open(whatsappUrl, '_blank')
}
```

---

## 📝 RESUMO DAS MUDANÇAS

**Arquivo modificado:** 1
- `/app/checkout/page.tsx`

**Função substituída:** 1
- `handleFinishOrder()` (83 linhas → 70 linhas)

**Imports adicionados:** 1
- `import { toast } from "sonner"`

**Resultado:**
- ✅ Pedidos salvos no banco
- ✅ Números automáticos (PED-001...)
- ✅ Integração com admin
- ✅ Histórico de pedidos
- ✅ Rastreamento em tempo real

---

**Documentação criada em:** 18/10/2025  
**Última atualização:** 18/10/2025
