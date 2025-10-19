# 🎯 NOVO FLUXO DE CHECKOUT - ESTILO IFOOD

**Data:** 19/10/2025  
**Objetivo:** Criar checkout em múltiplas etapas seguindo design das imagens

---

## 📋 ANÁLISE DAS IMAGENS

### **Imagem 1 e 3: Página de Resumo (ADAPTADO PARA PIZZARIA)**
```
┌─────────────────────────────────────┐
│  ○ delivery    ✓ balcão             │
├─────────────────────────────────────┤
│  seu pedido                         │
│                                     │
│  1x  Pizza Calabresa      R$ 45,00  │
│      Tamanho: Tradicional           │
│      Sabores: Calabresa             │
│      Borda: Catupiry      + R$ 8,00 │
│      Observações: Sem cebola        │
│                                     │
│  1x  Coca-Cola 2L         R$ 10,00  │
│                                     │
│                    entrega: R$ 5,00 │
│                   subtotal: R$ 63,00│
│                                     │
│                      total:         │
│                   R$ 68,00          │
│                                     │
│  [CONTINUAR]                        │
└─────────────────────────────────────┘
```

### **Imagem 2: Página de Entrega e Pagamento (ADAPTADO PARA PIZZARIA)**
```
┌─────────────────────────────────────┐
│  ← entrega e pagamento              │
├─────────────────────────────────────┤
│  endereço de entrega                │
│  ┌─────────────────────────────┐   │
│  │ Casa • 🏍️ R$ 5,00          │   │
│  │ Rua das Flores, 123         │ ↔ │
│  │ Centro, São José dos Campos │   │
│  └─────────────────────────────┘   │
│                                     │
│  seu pedido                         │
│  1x  Pizza Calabresa      R$ 45,00  │
│  1x  Coca-Cola 2L         R$ 10,00  │
│  1x  Borda Catupiry       R$  8,00  │
│                   subtotal: R$ 63,00│
│                    entrega: R$  5,00│
│                      total: R$ 68,00│
│                                     │
│  [alguma observação?]               │
│  Ex: Sem cebola, bem assada         │
│                                     │
│  como vai ser o pagamento?          │
│  ┌──────────┐  ┌──────────┐        │
│  │ pelo app │  │na entrega│        │
│  └──────────┘  └──────────┘        │
│                                     │
│  Se "pelo app":                     │
│  • Pix                              │
│  • Mercado Pago (futuro)            │
│                                     │
│  Se "na entrega":                   │
│  • Dinheiro (com troco)             │
│  • Cartão Débito                    │
│  • Cartão Crédito                   │
│                                     │
│  [FINALIZAR PEDIDO]                 │
└─────────────────────────────────────┘
```

---

## 🍕 ESTRUTURA DE PRODUTOS DA PIZZARIA

### **Tipos de Produtos:**
1. **Pizzas Salgadas** - tipo: 'salgada'
   - Tamanho: Tradicional ou Broto
   - Sabores: 1, 2 ou 3 sabores
   - Borda recheada (opcional)
   - Adicionais por sabor (opcional)
   - Observações

2. **Pizzas Doces** - tipo: 'doce'
   - Tamanho: Tradicional ou Broto
   - Sabores: 1, 2 ou 3 sabores
   - Observações

3. **Bebidas** - tipo: 'bebida'
   - Sem customização
   - Apenas quantidade

4. **Promoções** - tipo: 'salgada' + promocao: true
   - Apenas balcão (não delivery)

### **Estrutura do Item no Carrinho:**
```typescript
{
  productId: string,
  name: string,
  tipo: 'salgada' | 'doce' | 'bebida',
  size: 'tradicional' | 'broto' | null,
  flavors: [{ nome: string, preco: number }],
  bordaRecheada: { nome: string, preco: number } | null,
  adicionais: [{ nome: string, preco: number }],
  quantity: number,
  price: number,
  observacoes: string | null
}
```

### **Exibição no Resumo:**
```
Pizza (1 sabor):
  1x Pizza Calabresa          R$ 45,00
     Tamanho: Tradicional
     Sabor: Calabresa

Pizza (2 sabores):
  1x Pizza Mista              R$ 50,00
     Tamanho: Tradicional
     Sabores: Calabresa, Mussarela

Pizza com borda:
  1x Pizza Portuguesa         R$ 58,00
     Tamanho: Tradicional
     Sabor: Portuguesa
     Borda: Catupiry         + R$ 8,00

Bebida:
  1x Coca-Cola 2L             R$ 10,00
```

---

## 🎯 ESTRUTURA DO NOVO FLUXO

### **ETAPA 1: `/checkout` - Resumo do Pedido**

**Elementos:**
- ✅ Toggle: Delivery / Balcão (no topo)
- ✅ Título: "seu pedido"
- ✅ Lista de itens com detalhes
- ✅ Subtotal
- ✅ Taxa de entrega (se delivery)
- ✅ Total grande e destacado
- ✅ Botão: "CONTINUAR" (roxo)

**Lógica:**
- Se delivery: mostra taxa
- Se balcão: sem taxa
- Valida se tem itens no carrinho
- Redireciona para `/checkout/entrega-pagamento`

---

### **ETAPA 2: `/checkout/entrega-pagamento` - Finalização**

**Elementos:**
- ✅ Header: "← entrega e pagamento"
- ✅ Card de endereço (se delivery)
  - Nome do endereço
  - Taxa
  - Rua, número
  - Bairro, cidade
  - Botão para alterar (↔)
- ✅ Resumo do pedido (compacto)
- ✅ Campo de observações
- ✅ Forma de pagamento:
  - **Opção 1:** "pelo app" (Pix, Mercado Pago)
  - **Opção 2:** "na entrega" (Dinheiro, Cartão)
- ✅ Se dinheiro: campo "Troco para quanto?"
- ✅ Botão: "FINALIZAR PEDIDO"

---

## 🗄️ BANCO DE DADOS

### **Tabela `pedidos` - Já existe!**
```sql
✅ forma_pagamento VARCHAR
   - 'pix'
   - 'mercado_pago'
   - 'dinheiro'
   - 'cartao_debito'
   - 'cartao_credito'

✅ troco_para NUMERIC
✅ observacoes TEXT
```

### **Não precisa criar nada novo!** ✅

---

## 📁 ARQUIVOS A CRIAR/MODIFICAR

### **Criar:**
1. `app/checkout/page.tsx` (NOVO - Etapa 1)
2. `app/checkout/entrega-pagamento/page.tsx` (NOVO - Etapa 2)

### **Modificar:**
- Nenhum! Vamos criar do zero

---

## 🎨 DESIGN SYSTEM

### **Cores:**
```css
- Primary: #8B5CF6 (roxo)
- Success: #10B981 (verde)
- Text: #6B7280 (cinza)
- Background: #F9FAFB (cinza claro)
```

### **Componentes:**
- Toggle (Delivery/Balcão)
- Card de endereço
- Card de item do pedido
- Botões de pagamento
- Input de observações
- Input de troco

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### **Etapa 1: Página de Resumo**
- [ ] Criar `/checkout/page.tsx`
- [ ] Toggle delivery/balcão
- [ ] Lista de itens
- [ ] Cálculo de total
- [ ] Botão continuar
- [ ] Validações

### **Etapa 2: Página de Entrega e Pagamento**
- [ ] Criar `/checkout/entrega-pagamento/page.tsx`
- [ ] Card de endereço
- [ ] Resumo compacto
- [ ] Campo de observações
- [ ] Seleção de pagamento
- [ ] Campo de troco (condicional)
- [ ] Botão finalizar
- [ ] Integração com função SQL

---

## 🔄 FLUXO COMPLETO

```
1. Cliente adiciona produtos ao carrinho
2. Clica em "Finalizar Pedido"
3. → /checkout (Etapa 1)
   - Escolhe delivery ou balcão
   - Vê resumo do pedido
   - Clica "CONTINUAR"
4. → /checkout/entrega-pagamento (Etapa 2)
   - Se delivery: vê/edita endereço
   - Escolhe forma de pagamento
   - Adiciona observações
   - Se dinheiro: informa troco
   - Clica "FINALIZAR PEDIDO"
5. → Pedido criado no banco
6. → /pedido/[id] (Acompanhamento)
```

---

## 🚀 VANTAGENS DO NOVO FLUXO

✅ Mais limpo e organizado  
✅ Etapas claras  
✅ Foco em uma coisa por vez  
✅ Melhor UX mobile  
✅ Menos scroll  
✅ Visual moderno  
✅ Igual ao iFood  

---

**Pronto para implementar!** 🎊
