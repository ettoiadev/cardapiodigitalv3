# 📋 Resumo Executivo: Migração Sistema de Taxas

**Data:** 18 de Janeiro de 2025  
**Tempo Estimado:** 2-3 horas  
**Complexidade:** MÉDIA  
**Risco:** BAIXO (com backup)

---

## 🎯 Objetivo

Remover sistema legado de taxa única (`taxa_entrega` e `valor_minimo`) e consolidar uso exclusivo do sistema de **taxas por bairro/CEP** já implementado.

---

## 📊 Impacto Mapeado

### **Banco de Dados**
- ✅ 2 campos a remover: `taxa_entrega`, `valor_minimo`
- ✅ 1 tabela afetada: `pizzaria_config`
- ✅ Backup automático criado

### **Frontend**
- ✅ 6 arquivos a modificar
- ✅ ~30 linhas a remover/alterar
- ✅ 0 funcionalidades quebradas (sistema novo já existe)

---

## 🗂️ Arquivos Afetados

| Arquivo | Tipo | Linhas | Ação |
|---------|------|--------|------|
| `scripts/26-remove-taxa-unica-fields.sql` | SQL | CRIAR | Script de migração |
| `lib/supabase.ts` | TS | 3 | Remover campos da interface |
| `app/admin/config/tabs/geral.tsx` | TSX | ~50 | Remover seção UI + campos |
| `app/checkout/page.tsx` | TSX | 9 | Remover validações valor_minimo |
| `app/page.tsx` | TSX | 1 | Remover referência |
| `components/store-info-modal.tsx` | TSX | 1 | Remover exibição |

---

## ⚡ Execução Rápida

### **FASE 1: Banco de Dados** (15 min)
```bash
# 1. Verificar taxas cadastradas
SELECT COUNT(*) FROM taxas_entrega WHERE ativo = true;
# ⚠️ Se 0, PARAR e cadastrar taxas primeiro

# 2. Executar script de migração
# Ver: scripts/26-remove-taxa-unica-fields.sql
```

### **FASE 2: Frontend** (45 min)
```bash
# 1. Atualizar interface TypeScript
# lib/supabase.ts - Remover 2 campos

# 2. Atualizar aba Geral
# app/admin/config/tabs/geral.tsx - Remover seção

# 3. Atualizar checkout
# app/checkout/page.tsx - Remover validações

# 4. Atualizar componentes
# app/page.tsx + components/store-info-modal.tsx
```

### **FASE 3: Testes** (30 min)
```bash
# 1. Testar aba Config
# 2. Testar checkout com CEP
# 3. Testar fluxo completo de pedido
```

### **FASE 4: Commit** (15 min)
```bash
git add .
git commit -m "feat: migrate to delivery tax by neighborhood system"
```

---

## ✅ Checklist Rápido

### Pré-Execução
- [ ] Backup do banco completo
- [ ] Verificar taxas cadastradas (> 0)
- [ ] Criar branch: `feat/migrate-delivery-tax`

### Execução
- [ ] Executar script SQL (FASE 1)
- [ ] Atualizar 6 arquivos frontend (FASE 2)
- [ ] Executar 12 testes (FASE 3)
- [ ] Fazer 3 commits (FASE 4)

### Pós-Execução
- [ ] Monitorar por 24h
- [ ] Verificar pedidos criados
- [ ] Remover backup após 7 dias

---

## 🚨 Pontos de Atenção

### ⚠️ CRÍTICO
1. **Garantir que há taxas cadastradas** antes de remover campos
2. **Não executar durante horário de pico** (evitar pedidos em andamento)
3. **Testar checkout** antes de liberar para produção

### ⚡ IMPORTANTE
1. Checkout usa `buscarTaxaPorCep()` - já está correto
2. Validação de valor mínimo será removida (decisão de negócio)
3. Interface admin `/admin/taxas` já está funcional

---

## 🔄 Rollback (Se Necessário)

```sql
-- Restaurar campos (apenas se algo der errado)
ALTER TABLE pizzaria_config ADD COLUMN taxa_entrega NUMERIC;
ALTER TABLE pizzaria_config ADD COLUMN valor_minimo NUMERIC;

UPDATE pizzaria_config pc
SET taxa_entrega = b.taxa_entrega, valor_minimo = b.valor_minimo
FROM pizzaria_config_backup_taxa b
WHERE pc.id = b.id;
```

---

## 📈 Benefícios da Migração

✅ **Flexibilidade:** Taxas diferentes por bairro/CEP  
✅ **Precisão:** Cálculo automático baseado em localização  
✅ **Manutenção:** Interface admin dedicada (`/admin/taxas`)  
✅ **Escalabilidade:** Fácil adicionar novas áreas de entrega  
✅ **Simplicidade:** Remove duplicação de lógica  

---

## 📞 Suporte

**Documentação Completa:**  
`docs/PLANO_MIGRACAO_TAXAS_ENTREGA.md`

**Em caso de dúvidas:**
1. Revisar plano completo
2. Verificar logs do Supabase
3. Executar rollback se necessário

---

**Status:** 📝 PRONTO PARA EXECUÇÃO  
**Aprovação:** Aguardando confirmação do usuário
