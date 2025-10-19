# 🚀 PLANO COMPLETO: NOVO SISTEMA DE CHECKOUT (ESTILO IFOOD)

**Data:** 19/10/2025  
**Objetivo:** Transformar checkout de WhatsApp para sistema integrado ao banco de dados

---

## 📋 SITUAÇÃO ATUAL vs NOVA

### **Sistema Antigo (WhatsApp):**
```
❌ Redireciona para WhatsApp
❌ Pedido NÃO salvo no banco
❌ NÃO aparece em "Meus Pedidos"
❌ NÃO aparece no admin
❌ Sem controle de status
```

### **Novo Sistema (iFood):**
```
✅ Pedido salvo no banco de dados
✅ Número de pedido gerado automaticamente
✅ Redireciona para /pedido/[id]
✅ Aparece em "Meus Pedidos"
✅ Aparece no Kanban do admin
✅ Status em tempo real
✅ Cliente acompanha pedido
```

---

## 🗄️ BANCO DE DADOS (JÁ PRONTO!)

### **Tabelas Existentes:**
- ✅ `pedidos` - Pedido principal
- ✅ `pedido_itens` - Itens do pedido
- ✅ `pedido_historico` - Histórico de status
- ✅ `clientes` - Dados do cliente

### **Funções Existentes:**
- ✅ `gerar_numero_pedido()` - Gera PED-YYYYMMDD-XXX
- ✅ `registrar_mudanca_status()` - Registra histórico
- ✅ Triggers automáticos configurados

---

## 📝 FASES DE IMPLEMENTAÇÃO

### **FASE 1: Criar Função SQL** ⏱️ 10 min

Criar função `criar_pedido_online()` no Supabase.

### **FASE 2: Atualizar Checkout** ⏱️ 30 min

**Remover:**
- ❌ Código de WhatsApp
- ❌ `generateWhatsAppMessage()`
- ❌ Redirecionamento

**Adicionar:**
- ✅ `criarPedidoOnline()` - Salva no banco
- ✅ Redirecionamento para `/pedido/[id]`
- ✅ Loading states
- ✅ Toast de sucesso

### **FASE 3: Criar Página de Acompanhamento** ⏱️ 45 min

**Arquivo:** `app/pedido/[id]/page.tsx`

**Funcionalidades:**
- ✅ Exibir número do pedido
- ✅ Status atual com timeline
- ✅ Detalhes do pedido
- ✅ Atualização em tempo real
- ✅ UI estilo iFood

### **FASE 4: Verificar Integrações** ⏱️ 15 min

- ✅ Meus Pedidos
- ✅ Kanban Admin
- ✅ Realtime

### **FASE 5: Testes** ⏱️ 30 min

- [ ] Checkout não autenticado
- [ ] Checkout autenticado
- [ ] Acompanhamento de pedido
- [ ] Meus Pedidos
- [ ] Admin Kanban
- [ ] Realtime

---

## ✅ CHECKLIST EXECUTIVO

### **Preparação:**
- [ ] Backup do banco
- [ ] Criar branch `feature/novo-checkout`

### **Implementação:**
- [ ] Criar função SQL
- [ ] Atualizar checkout
- [ ] Criar página de acompanhamento
- [ ] Testar tudo

### **Deploy:**
- [ ] Merge para main
- [ ] Deploy Vercel
- [ ] Monitorar

---

## 🎯 RESULTADO ESPERADO

**Cliente:**
1. Adiciona produtos ao carrinho
2. Vai para checkout
3. Preenche dados
4. Clica "Finalizar Pedido"
5. ✅ Pedido salvo no banco
6. ✅ Redireciona para /pedido/[id]
7. ✅ Acompanha status em tempo real
8. ✅ Vê em "Meus Pedidos"

**Admin:**
1. ✅ Pedido aparece no Kanban
2. ✅ Badge "Online"
3. ✅ Pode mudar status
4. ✅ Cliente vê atualização em tempo real

---

**TEMPO TOTAL ESTIMADO:** 2h 10min
