# 🚀 GUIA DE EXECUÇÃO: Migração Kanban de Pedidos

## ✅ PRÉ-REQUISITOS

Antes de executar a migração, verifique:

- [ ] Acesso ao Supabase Dashboard
- [ ] Backup do banco de dados realizado
- [ ] Ambiente de desenvolvimento testado
- [ ] Nenhuma operação crítica em andamento

---

## 📋 PASSO A PASSO

### 1. Fazer Backup do Banco de Dados

**No Supabase Dashboard:**
1. Acesse seu projeto
2. Vá em `Database` > `Backups`
3. Clique em `Create backup`
4. Aguarde conclusão

### 2. Executar o Script SQL

**Opção A: Via Supabase Dashboard (Recomendado)**

1. Acesse o Supabase Dashboard
2. Vá em `SQL Editor`
3. Clique em `New query`
4. Copie todo o conteúdo de `scripts/20-kanban-pedidos-migration.sql`
5. Cole no editor
6. Clique em `Run` (ou pressione Ctrl+Enter)
7. Aguarde a execução (pode levar 10-30 segundos)

**Opção B: Via CLI do Supabase**

```bash
# Se você tem o Supabase CLI instalado
supabase db push --file scripts/20-kanban-pedidos-migration.sql
```

### 3. Verificar Execução

Após executar, você deve ver mensagens como:

```
✅ Todos os campos foram criados com sucesso!
✅ Tabela pedido_historico criada com sucesso!
✅ View vw_pedidos_kanban criada com sucesso!
📊 ESTATÍSTICAS PÓS-MIGRAÇÃO
📈 PEDIDOS POR STATUS
✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO!
```

### 4. Validar Dados

Execute estas queries para validar:

```sql
-- 1. Verificar novos campos
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'pedidos' 
AND column_name IN (
    'numero_pedido', 'nome_cliente', 'telefone_cliente',
    'updated_at', 'ordem_kanban'
);

-- 2. Verificar se pedidos têm números
SELECT 
    COUNT(*) as total,
    COUNT(numero_pedido) as com_numero,
    COUNT(*) - COUNT(numero_pedido) as sem_numero
FROM pedidos;

-- 3. Testar a view
SELECT * FROM vw_pedidos_kanban LIMIT 5;

-- 4. Verificar histórico (deve estar vazio inicialmente)
SELECT COUNT(*) FROM pedido_historico;
```

### 5. Testar Funcionalidades

**Teste 1: Criar novo pedido**
```sql
INSERT INTO pedidos (
    nome_cliente, telefone_cliente, tipo_entrega,
    subtotal, taxa_entrega, total, status, forma_pagamento
) VALUES (
    'Teste Kanban', '(11) 99999-9999', 'delivery',
    50.00, 5.00, 55.00, 'pendente', 'pix'
);

-- Verificar se número foi gerado
SELECT numero_pedido, nome_cliente FROM pedidos 
WHERE nome_cliente = 'Teste Kanban';
```

**Teste 2: Atualizar status**
```sql
UPDATE pedidos 
SET status = 'em_preparo', alterado_por = 'Admin Teste'
WHERE nome_cliente = 'Teste Kanban';

-- Verificar histórico
SELECT * FROM pedido_historico 
WHERE pedido_id = (
    SELECT id FROM pedidos WHERE nome_cliente = 'Teste Kanban'
);
```

**Teste 3: Cancelar pedido**
```sql
UPDATE pedidos 
SET 
    status = 'cancelado', 
    alterado_por = 'Admin Teste',
    motivo_cancelamento = 'Cliente desistiu'
WHERE nome_cliente = 'Teste Kanban';

-- Verificar histórico com motivo
SELECT * FROM pedido_historico 
WHERE pedido_id = (
    SELECT id FROM pedidos WHERE nome_cliente = 'Teste Kanban'
);
```

**Teste 4: Limpar dados de teste**
```sql
DELETE FROM pedidos WHERE nome_cliente = 'Teste Kanban';
```

---

## 🔍 VERIFICAÇÕES DE SEGURANÇA

### Verificar Triggers

```sql
SELECT 
    trigger_name, 
    event_manipulation, 
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'pedidos';
```

Deve retornar:
- `trigger_gerar_numero_pedido` - INSERT - BEFORE
- `trigger_historico_status` - UPDATE - BEFORE

### Verificar Índices

```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'pedidos'
AND indexname LIKE 'idx_pedidos%';
```

Deve retornar pelo menos 7 índices.

### Verificar Constraints

```sql
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'pedidos';
```

Deve incluir:
- `check_status_valido`
- `check_ordem_kanban`

---

## ⚠️ TROUBLESHOOTING

### Erro: "column already exists"

**Causa:** Script já foi executado parcialmente

**Solução:** 
```sql
-- Verificar quais campos existem
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'pedidos';

-- O script usa IF NOT EXISTS, então pode re-executar com segurança
```

### Erro: "relation already exists"

**Causa:** Tabela pedido_historico já existe

**Solução:**
```sql
-- Verificar se tabela existe
SELECT * FROM pedido_historico LIMIT 1;

-- Se existir e estiver vazia, pode continuar
-- Se tiver dados, avaliar se pode dropar
```

### Erro: "function already exists"

**Causa:** Funções já foram criadas

**Solução:**
```sql
-- O script usa CREATE OR REPLACE, então pode re-executar
```

### Performance Lenta

**Causa:** Muitos pedidos existentes

**Solução:**
```sql
-- Executar VACUUM ANALYZE após migração
VACUUM ANALYZE pedidos;
VACUUM ANALYZE pedido_historico;
```

---

## 📊 ESTATÍSTICAS ESPERADAS

Após a migração, você deve ter:

| Item | Quantidade |
|------|------------|
| Novos campos em `pedidos` | 8 |
| Nova tabela | 1 (`pedido_historico`) |
| Triggers | 2 |
| Functions | 3 |
| Índices novos | 10 |
| Views | 1 |
| Constraints | 2 |

---

## ✅ CHECKLIST PÓS-MIGRAÇÃO

- [ ] Todos os pedidos têm `numero_pedido`
- [ ] Todos os pedidos têm `updated_at`
- [ ] Todos os pedidos têm `ordem_kanban = 0`
- [ ] Tabela `pedido_historico` existe
- [ ] View `vw_pedidos_kanban` retorna dados
- [ ] Triggers estão ativos
- [ ] Índices foram criados
- [ ] Teste de criação de pedido funciona
- [ ] Teste de mudança de status funciona
- [ ] Histórico é registrado corretamente

---

## 🎯 PRÓXIMOS PASSOS

Após confirmar que a migração foi bem-sucedida:

1. ✅ **Commit do script:**
```bash
git add scripts/20-kanban-pedidos-migration.sql
git commit -m "feat(db): add Kanban migration for orders management"
git push
```

2. ✅ **Atualizar documentação:**
- Marcar Fase 1 como concluída
- Documentar quaisquer ajustes feitos

3. ✅ **Iniciar Fase 2:**
- Instalar dependências frontend
- Criar estrutura de componentes

---

## 📞 SUPORTE

Se encontrar problemas:

1. **Verificar logs do Supabase:**
   - Dashboard > Logs > Database

2. **Consultar documentação:**
   - `docs/PLANO_PEDIDOS_KANBAN_PARTE1.md`

3. **Rollback (se necessário):**
```sql
-- ATENÇÃO: Isso remove TODAS as mudanças!
BEGIN;

-- Remover triggers
DROP TRIGGER IF EXISTS trigger_gerar_numero_pedido ON pedidos;
DROP TRIGGER IF EXISTS trigger_historico_status ON pedidos;

-- Remover functions
DROP FUNCTION IF EXISTS gerar_numero_pedido();
DROP FUNCTION IF EXISTS registrar_mudanca_status();
DROP FUNCTION IF EXISTS buscar_historico_pedido(UUID);
DROP FUNCTION IF EXISTS estatisticas_kanban();

-- Remover view
DROP VIEW IF EXISTS vw_pedidos_kanban;

-- Remover tabela de histórico
DROP TABLE IF EXISTS pedido_historico;

-- Remover campos (CUIDADO: perda de dados!)
ALTER TABLE pedidos DROP COLUMN IF EXISTS numero_pedido;
ALTER TABLE pedidos DROP COLUMN IF EXISTS nome_cliente;
ALTER TABLE pedidos DROP COLUMN IF EXISTS telefone_cliente;
ALTER TABLE pedidos DROP COLUMN IF EXISTS updated_at;
ALTER TABLE pedidos DROP COLUMN IF EXISTS status_anterior;
ALTER TABLE pedidos DROP COLUMN IF EXISTS alterado_por;
ALTER TABLE pedidos DROP COLUMN IF EXISTS motivo_cancelamento;
ALTER TABLE pedidos DROP COLUMN IF EXISTS ordem_kanban;

COMMIT;
```

---

**Data:** 2025-01-18  
**Versão:** 1.0  
**Status:** ✅ Pronto para Execução
