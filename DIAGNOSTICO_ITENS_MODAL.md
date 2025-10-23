# 🔍 DIAGNÓSTICO: Verificar Pedidos sem Itens

## 📋 **Problema Identificado**
O modal de detalhes não está mostrando os itens porque há uma desconexão entre os dados exibidos no Kanban e os dados reais na tabela `pedido_itens`.

## 🎯 **Causa do Problema**
1. **View `vw_pedidos_kanban`** retorna apenas um **resumo** dos itens (nome, quantidade, tamanho, sabores)
2. **Modal de detalhes** precisa dos **dados completos** dos itens (adicionais, borda_recheada, etc.)
3. **Consulta incorreta** estava tentando buscar de uma tabela que não existe ou não tem relacionamento

## ✅ **Solução Implementada**
- **Modificado** o componente `PedidoDetalhesModal` para buscar diretamente da tabela `pedido_itens`
- **Consulta específica** com todos os campos necessários
- **Tratamento de erro** melhorado

## 📊 **Para Diagnosticar o Estado Atual**

### **Passo 1:** Executar diagnóstico no Supabase Dashboard
Execute o script `scripts/diagnostico-pedidos-itens.sql` no Supabase SQL Editor.

### **Passo 2:** Verificar resultado esperado
```sql
-- Deve mostrar:
✅ PEDIDOS COM ITENS (total_itens > 0)
❌ PEDIDOS SEM ITENS (total_itens = 0) ← Problema!
```

## 🚨 **Possíveis Problemas Encontrados**

### **Problema 1: Pedidos sem itens criados**
- **Causa:** API de criação de pedidos pode não estar inserindo itens
- **Solução:** Verificar função `app/api/pedidos/criar/route.ts`

### **Problema 2: Relacionamento pedido_id incorreto**
- **Causa:** Chave estrangeira pode estar quebrada
- **Solução:** Verificar estrutura da tabela `pedido_itens`

### **Problema 3: Dados órfãos**
- **Causa:** Itens criados sem pedidos válidos
- **Solução:** Limpeza de dados órfãos

## 🛠️ **Correções Necessárias**

### **1. Se houver pedidos sem itens:**
```sql
-- Identificar pedidos órfãos
SELECT p.id, p.numero_pedido
FROM pedidos p
LEFT JOIN pedido_itens pi ON pi.pedido_id = p.id
WHERE pi.id IS NULL
  AND p.created_at >= CURRENT_DATE - INTERVAL '7 days';
```

### **2. Se houver itens sem produto_id:**
```sql
-- Itens com produto_id NULL podem indicar problema
SELECT * FROM pedido_itens
WHERE produto_id IS NULL
LIMIT 5;
```

## ✅ **Verificação Final**

Após executar as correções, teste:
1. ✅ Criar um novo pedido via checkout
2. ✅ Verificar se itens aparecem no modal de detalhes
3. ✅ Confirmar que todos os campos estão preenchidos

## 🎯 **Status**
- ✅ **Consulta corrigida** no componente do modal
- ✅ **Script de diagnóstico** criado
- 🔄 **Aguardando execução** do diagnóstico para identificar problemas específicos

---

**🎊 A correção técnica foi implementada! Execute o diagnóstico para identificar e corrigir dados inconsistentes.**
