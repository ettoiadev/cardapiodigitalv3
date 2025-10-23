# 🔍 VERIFICAÇÃO COMPLETA - Itens Não Aparecem no Modal

## ✅ **CORREÇÕES IMPLEMENTADAS:**

### **1. Logs Detalhados Adicionados**
- ✅ Log de início do carregamento
- ✅ Log da query executada
- ✅ Log da resposta (sucesso/erro)
- ✅ Log de contagem de itens
- ✅ **Alerta especial** quando nenhum item é encontrado

### **2. Script de Verificação Criado**
- ✅ `scripts/verificar-pedido-000002.sql`
- Verifica especificamente o pedido 000002
- Mostra se itens existem no banco

---

## 🚀 **PRÓXIMOS PASSOS:**

### **PASSO 1: Testar com Logs**
1. Abra o navegador (F12 → Console)
2. Abra o modal do pedido 000002
3. **Verifique os logs** que aparecem:
   ```
   🔍 Iniciando carregamento de itens
   📡 Executando query na tabela pedido_itens
   📊 Resposta da query
   ✅ Query executada com sucesso: X itens encontrados
   ```

### **PASSO 2: Executar Script no Supabase**
1. Abra **Supabase Dashboard**
2. Vá para **SQL Editor**
3. Execute: `scripts/verificar-pedido-000002.sql`
4. **Verifique o resultado:**
   - ✅ Se mostrar itens → Problema é no frontend
   - ❌ Se não mostrar itens → Problema é no banco

---

## 🎯 **DIAGNÓSTICO BASEADO NOS LOGS:**

### **Cenário A: Logs mostram "0 itens encontrados"**
**Causa:** Pedido não tem itens no banco
**Solução:** Criar itens manualmente ou recriar pedido

### **Cenário B: Logs mostram erro na query**
**Causa:** Problema de permissão ou estrutura da tabela
**Solução:** Verificar RLS policies e estrutura

### **Cenário C: Logs não aparecem**
**Causa:** Modal não está carregando a função
**Solução:** Verificar se `useEffect` está sendo executado

---

## 🛠️ **SE O PEDIDO NÃO TEM ITENS NO BANCO:**

Execute este script para criar itens de teste:

```sql
-- Criar itens de teste para o pedido 000002
INSERT INTO pedido_itens (
    pedido_id,
    produto_id,
    nome_produto,
    tamanho,
    sabores,
    quantidade,
    preco_unitario,
    preco_total
)
SELECT 
    p.id as pedido_id,
    gen_random_uuid() as produto_id,
    '1/2 COMPLETA ESPECIAL + 1/2 MUSSARELA' as nome_produto,
    'tradicional' as tamanho,
    '["COMPLETA ESPECIAL", "MUSSARELA"]'::jsonb as sabores,
    1 as quantidade,
    69.00 as preco_unitario,
    69.00 as preco_total
FROM pedidos p
WHERE p.numero_pedido = '000002'
  AND NOT EXISTS (
      SELECT 1 FROM pedido_itens pi WHERE pi.pedido_id = p.id
  );

-- Criar item de Coca-Cola
INSERT INTO pedido_itens (
    pedido_id,
    produto_id,
    nome_produto,
    tamanho,
    quantidade,
    preco_unitario,
    preco_total
)
SELECT 
    p.id as pedido_id,
    gen_random_uuid() as produto_id,
    'Coca-Cola 1L' as nome_produto,
    null as tamanho,
    1 as quantidade,
    10.00 as preco_unitario,
    10.00 as preco_total
FROM pedidos p
WHERE p.numero_pedido = '000002';
```

---

## ✅ **CHECKLIST DE VERIFICAÇÃO:**

- [x] ✅ Logs detalhados adicionados ao código
- [x] ✅ Script de verificação criado
- [ ] 🔄 Abrir console e verificar logs
- [ ] 🔄 Executar script no Supabase
- [ ] 🔄 Criar itens se necessário
- [ ] 🔄 Testar modal novamente

---

## 📊 **RESULTADO ESPERADO:**

Após executar as verificações:
1. **Console mostrará** quantos itens foram encontrados
2. **Script SQL mostrará** se itens existem no banco
3. **Modal exibirá** os itens corretamente

---

**🎯 Próxima ação: Abra o console (F12) e veja os logs quando abrir o modal!**
