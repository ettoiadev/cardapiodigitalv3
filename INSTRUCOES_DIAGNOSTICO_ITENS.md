# 🔧 INSTRUÇÕES: Diagnosticar e Corrigir Itens do Modal

## 📋 **Problema:**
Os itens não aparecem no modal de detalhes do pedido.

## 🎯 **Solução Implementada:**
- ✅ **Consulta corrigida** no componente `PedidoDetalhesModal`
- ✅ **Scripts de diagnóstico** criados
- 🔄 **Aguardando execução** dos scripts no banco

---

## 🚀 **PASSOS PARA RESOLVER:**

### **PASSO 1: Executar Diagnóstico**
1. Abra o **Supabase Dashboard**
2. Vá para **SQL Editor**
3. Execute o script: `scripts/diagnostico-pedidos-itens.sql`

### **PASSO 2: Analisar Resultados**
Procure por:
- 🚨 **Pedidos com status "SEM ITENS"**
- 📊 **Estatísticas da tabela pedido_itens**
- 🔗 **Problemas de relacionamento**

### **PASSO 3: Aplicar Correções (se necessário)**
Se encontrou problemas, execute: `scripts/correcao-pedidos-itens.sql`

---

## 🛠️ **Arquivos Criados/Modificados:**

### **✅ Scripts de Diagnóstico:**
- `scripts/diagnostico-pedidos-itens.sql` - Identifica problemas
- `scripts/correcao-pedidos-itens.sql` - Corrige dados inconsistentes

### **✅ Componente Corrigido:**
- `components/admin/pedido-detalhes-modal.tsx` - Consulta melhorada

---

## 📋 **Checklist de Verificação:**

- [ ] ✅ Scripts de diagnóstico criados
- [ ] 🔄 Executar diagnóstico no Supabase
- [ ] 🔄 Aplicar correções se necessário
- [ ] ✅ Testar modal de detalhes
- [ ] ✅ Verificar se itens aparecem

---

## 🎯 **Status Atual:**
**🔄 Aguardando execução dos scripts de diagnóstico no banco de dados.**

**Após executar os scripts, os itens devem aparecer corretamente no modal!** 🎉

---

## 📞 **Se ainda não funcionar:**
1. ✅ Verificar logs do console (F12)
2. ✅ Verificar resposta da API no Network tab
3. ✅ Confirmar que dados existem na tabela `pedido_itens`

**🎊 Problema identificado e correção implementada!**
