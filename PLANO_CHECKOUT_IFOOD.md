# 🎯 REFORMULAÇÃO: CHECKOUT ESTILO IFOOD

## 📊 ANÁLISE COMPARATIVA

### **Atual (Problemático):**
```
1. Tipo de Entrega (Balcão/Delivery)
2. Dados do Cliente
3. Endereço (se delivery)
4. Forma de Pagamento
5. Observações
```

### **iFood (Correto):**
```
1. Endereço de Entrega (card clicável)
   - Se logado: mostra endereço salvo
   - Botão "Adicionar/Alterar endereço"
   
2. Tipo de Entrega (automático baseado em endereço)
   - Delivery (se tem endereço)
   - Retirada (opção alternativa)
   - Taxa calculada por CEP
   
3. Forma de Pagamento
   - Ícones grandes
   - Seleção visual
   
4. Resumo do Pedido (sidebar fixo)
   - Itens
   - Subtotal
   - Taxa de entrega
   - Total
```

## 🔄 MUDANÇAS NECESSÁRIAS

### **1. Ordem dos Cards:**
- ✅ Endereço PRIMEIRO
- ✅ Tipo de Entrega SEGUNDO (baseado em endereço)
- ✅ Forma de Pagamento TERCEIRO
- ✅ Resumo SEMPRE VISÍVEL (sidebar)

### **2. Lógica de Endereço:**
- ✅ Se logado: buscar endereço do cliente
- ✅ Mostrar card com endereço salvo
- ✅ Botão "Alterar endereço"
- ✅ Modal para editar endereço
- ✅ Calcular taxa por CEP automaticamente

### **3. Tipo de Entrega:**
- ✅ Delivery (padrão se tem endereço)
- ✅ Retirada (opção alternativa)
- ✅ Taxa exibida dinamicamente

### **4. Dados do Cliente:**
- ✅ Se logado: ocultar (já tem os dados)
- ✅ Se não logado: solicitar apenas nome e telefone

## 🎨 NOVO LAYOUT

```
┌─────────────────────────────────────┐
│  ← Voltar    Finalizar Pedido       │
├─────────────────────────────────────┤
│                                     │
│  📍 Endereço de Entrega             │
│  ┌─────────────────────────────┐   │
│  │ Rua das Flores, 123         │   │
│  │ Centro - São Paulo/SP       │   │
│  │ [Alterar endereço]          │   │
│  └─────────────────────────────┘   │
│                                     │
│  🚴 Tipo de Entrega                 │
│  ┌──────┐  ┌──────┐                │
│  │ 🏍️   │  │ 🏪   │                │
│  │Deliv │  │Retir │                │
│  │R$5,00│  │Grátis│                │
│  └──────┘  └──────┘                │
│                                     │
│  💳 Forma de Pagamento              │
│  ┌──────┐  ┌──────┐  ┌──────┐     │
│  │ 💵   │  │ 💳   │  │ 📱   │     │
│  │Dinhe │  │Cartão│  │ PIX  │     │
│  └──────┘  └──────┘  └──────┘     │
│                                     │
│  📦 Resumo do Pedido                │
│  • Pizza Calabresa ... R$ 45,00     │
│  • Coca-Cola 2L ...... R$ 10,00     │
│  ─────────────────────────────      │
│  Subtotal ............ R$ 55,00     │
│  Taxa de entrega ..... R$  5,00     │
│  ─────────────────────────────      │
│  Total ............... R$ 60,00     │
│                                     │
│  [Finalizar Pedido]                 │
└─────────────────────────────────────┘
```

## ✅ IMPLEMENTAÇÃO

1. Buscar endereço do cliente logado
2. Calcular taxa por CEP
3. Reordenar cards
4. Criar modal de endereço
5. Atualizar lógica de validação
