# 📋 Plano de Migração: Sistema de Taxas de Entrega

**Data:** 18 de Janeiro de 2025  
**Objetivo:** Migrar do sistema de taxa única para taxas por bairro/CEP  
**Status:** 📝 **PLANEJAMENTO**

---

## 🎯 Objetivo da Migração

Remover o sistema antigo de taxa única (`taxa_entrega` e `valor_minimo`) e consolidar o uso exclusivo do sistema de **taxas por bairro/CEP** já implementado na aba `/admin/taxas`.

---

## 🔍 Análise do Estado Atual

### ✅ Sistema Novo (JÁ IMPLEMENTADO)
- **Tabela:** `taxas_entrega`
- **Funcionalidade:** Taxas por bairro/faixa de CEP
- **Interface Admin:** `/admin/taxas` (aba dedicada)
- **Helper:** `lib/taxa-helpers.ts` (completo e funcional)
- **Funções DB:** `buscar_taxa_por_cep()` e `buscar_taxa_entrega()`

### ❌ Sistema Antigo (A SER REMOVIDO)
- **Campos DB:** `taxa_entrega` e `valor_minimo` em `pizzaria_config`
- **Interface Admin:** Seção "Configurações de Entrega" em `/admin/config` (aba Geral)
- **Uso:** Checkout e outras páginas ainda podem referenciar

---

## 📊 Mapeamento de Impacto

### 1. **Banco de Dados**
| Tabela | Campos a Remover | Impacto |
|--------|------------------|---------|
| `pizzaria_config` | `taxa_entrega` | MÉDIO - Usado em config |
| `pizzaria_config` | `valor_minimo` | MÉDIO - Usado em validações |

### 2. **Frontend - Arquivos Afetados**

#### **🔴 CRÍTICO - Requer Alteração**
1. `app/admin/config/tabs/geral.tsx`
   - **Linhas:** 51, 54, 83, 86
   - **Ação:** Remover campos `taxa_entrega` e `valor_minimo` da interface e state
   - **UI:** Remover seção "Configurações de Entrega"

2. `app/checkout/page.tsx`
   - **Buscar:** Referências a `valor_minimo` (9 ocorrências)
   - **Ação:** Remover validação de valor mínimo ou migrar para taxas

3. `lib/supabase.ts`
   - **Buscar:** Tipo `PizzariaConfig` (3 ocorrências)
   - **Ação:** Atualizar interface TypeScript

#### **🟡 MÉDIO - Verificar Uso**
4. `app/page.tsx`
   - **Buscar:** 1 ocorrência de `valor_minimo`
   - **Ação:** Verificar se é exibição ou validação

5. `components/store-info-modal.tsx`
   - **Buscar:** 1 ocorrência de `valor_minimo`
   - **Ação:** Remover da exibição de informações

#### **🟢 BAIXO - Backup/Legado**
6. `app/admin/config/page-original-backup.tsx`
   - **Ação:** Pode ser removido (é backup)

7. `migration/export-schema.sql`
   - **Ação:** Documentação histórica, manter

---

## 🛠️ Plano de Execução

### **FASE 1: Preparação e Backup** ✅

#### 1.1. Backup dos Dados Atuais
```sql
-- Salvar valores atuais antes de remover
SELECT 
    id,
    nome,
    taxa_entrega,
    valor_minimo,
    tempo_entrega_min,
    tempo_entrega_max
FROM pizzaria_config;
```

#### 1.2. Verificar Taxas Cadastradas
```sql
-- Garantir que há taxas cadastradas
SELECT COUNT(*) as total_taxas, 
       COUNT(*) FILTER (WHERE ativo = true) as taxas_ativas
FROM taxas_entrega;
```

**⚠️ VALIDAÇÃO:** Se não houver taxas cadastradas, **PARAR** e cadastrar antes de prosseguir.

---

### **FASE 2: Atualização do Banco de Dados** 🔧

#### 2.1. Script SQL de Migração
**Arquivo:** `scripts/26-remove-taxa-unica-fields.sql`

```sql
-- ============================================================================
-- SCRIPT: 26-remove-taxa-unica-fields.sql
-- Descrição: Remove campos de taxa única da tabela pizzaria_config
-- Data: 2025-01-18
-- ============================================================================

BEGIN;

-- 1. Backup dos valores atuais (para rollback se necessário)
CREATE TABLE IF NOT EXISTS pizzaria_config_backup_taxa AS
SELECT id, taxa_entrega, valor_minimo, updated_at
FROM pizzaria_config;

-- 2. Remover colunas obsoletas
ALTER TABLE pizzaria_config 
DROP COLUMN IF EXISTS taxa_entrega;

ALTER TABLE pizzaria_config 
DROP COLUMN IF EXISTS valor_minimo;

-- 3. Verificar se remoção foi bem-sucedida
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pizzaria_config' 
        AND column_name IN ('taxa_entrega', 'valor_minimo')
    ) THEN
        RAISE EXCEPTION 'Falha ao remover colunas!';
    ELSE
        RAISE NOTICE '✅ Colunas removidas com sucesso!';
    END IF;
END $$;

COMMIT;

-- 4. Verificação pós-migração
SELECT 
    'pizzaria_config' as tabela,
    COUNT(*) as total_colunas,
    ARRAY_AGG(column_name ORDER BY ordinal_position) as colunas
FROM information_schema.columns
WHERE table_name = 'pizzaria_config'
GROUP BY table_name;
```

#### 2.2. Rollback (Se Necessário)
```sql
-- APENAS SE ALGO DER ERRADO
BEGIN;

ALTER TABLE pizzaria_config 
ADD COLUMN taxa_entrega NUMERIC;

ALTER TABLE pizzaria_config 
ADD COLUMN valor_minimo NUMERIC;

-- Restaurar valores do backup
UPDATE pizzaria_config pc
SET 
    taxa_entrega = b.taxa_entrega,
    valor_minimo = b.valor_minimo
FROM pizzaria_config_backup_taxa b
WHERE pc.id = b.id;

COMMIT;
```

---

### **FASE 3: Atualização do Frontend** 💻

#### 3.1. Atualizar Interface TypeScript
**Arquivo:** `lib/supabase.ts`

```typescript
// ANTES:
export interface PizzariaConfig {
  id: string
  nome: string
  taxa_entrega: number        // ❌ REMOVER
  valor_minimo: number         // ❌ REMOVER
  tempo_entrega_min: number
  tempo_entrega_max: number
  // ... outros campos
}

// DEPOIS:
export interface PizzariaConfig {
  id: string
  nome: string
  // taxa_entrega: REMOVIDO - usar taxas_entrega table
  // valor_minimo: REMOVIDO - sem validação de valor mínimo
  tempo_entrega_min: number
  tempo_entrega_max: number
  // ... outros campos
}
```

#### 3.2. Atualizar Aba Geral (Config)
**Arquivo:** `app/admin/config/tabs/geral.tsx`

**Mudanças:**
1. Remover campos do state (linhas 51, 54, 83, 86)
2. Remover seção UI "Configurações de Entrega"
3. Adicionar link para aba Taxas

```tsx
// REMOVER ESTA SEÇÃO:
<Card>
  <CardHeader>
    <CardTitle>Configurações de Entrega</CardTitle>
  </CardHeader>
  <CardContent>
    <Label>Taxa de Entrega</Label>
    <Input value={taxa_entrega} ... />
    <Label>Valor Mínimo</Label>
    <Input value={valor_minimo} ... />
  </CardContent>
</Card>

// ADICIONAR LINK:
<Card className="bg-blue-50 border-blue-200">
  <CardContent className="pt-6">
    <div className="flex items-start space-x-3">
      <Bike className="h-5 w-5 text-blue-600 mt-0.5" />
      <div>
        <h3 className="text-sm font-semibold text-blue-900 mb-1">
          📍 Taxas de Entrega por Bairro
        </h3>
        <p className="text-sm text-blue-700 mb-2">
          Configure taxas de entrega específicas por bairro ou faixa de CEP.
        </p>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => window.location.href = '/admin/taxas'}
        >
          Gerenciar Taxas de Entrega
        </Button>
      </div>
    </div>
  </CardContent>
</Card>
```

#### 3.3. Atualizar Checkout
**Arquivo:** `app/checkout/page.tsx`

**Ações:**
1. Remover validação de `valor_minimo` (9 ocorrências)
2. Manter busca de taxa por CEP (já usa `buscarTaxaPorCep`)

```typescript
// REMOVER VALIDAÇÕES COMO:
if (state.total < config.valor_minimo) {
  toast.error(`Valor mínimo: ${formatCurrency(config.valor_minimo)}`)
  return
}

// MANTER (já está correto):
const taxaData = await buscarTaxaPorCep(customerCep)
if (!taxaData) {
  toast.error("CEP não atendido")
  return
}
```

#### 3.4. Atualizar Componentes
**Arquivo:** `components/store-info-modal.tsx`

```tsx
// REMOVER:
<p>Valor mínimo: {formatCurrency(config.valor_minimo)}</p>

// SUBSTITUIR POR:
<p>Consulte taxas de entrega por CEP no checkout</p>
```

**Arquivo:** `app/page.tsx`

```tsx
// Verificar uso e remover se for exibição de valor_minimo
```

---

### **FASE 4: Testes e Validação** ✅

#### 4.1. Testes de Banco de Dados
```sql
-- Verificar que colunas foram removidas
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'pizzaria_config' 
AND column_name IN ('taxa_entrega', 'valor_minimo');
-- Deve retornar 0 linhas

-- Verificar que taxas_entrega está funcional
SELECT COUNT(*) FROM taxas_entrega WHERE ativo = true;
-- Deve retornar > 0
```

#### 4.2. Testes de Frontend

**Teste 1: Aba Geral (Config)**
- [ ] Abrir `/admin/config`
- [ ] Verificar que seção "Configurações de Entrega" foi removida
- [ ] Verificar que link para "Taxas" está presente
- [ ] Salvar configurações (não deve dar erro)

**Teste 2: Checkout**
- [ ] Adicionar produtos ao carrinho
- [ ] Ir para checkout
- [ ] Inserir CEP válido
- [ ] Verificar que taxa é calculada corretamente
- [ ] Inserir CEP inválido
- [ ] Verificar mensagem de erro apropriada
- [ ] Finalizar pedido (não deve validar valor mínimo)

**Teste 3: Aba Taxas**
- [ ] Abrir `/admin/taxas`
- [ ] Verificar que CRUD de taxas funciona
- [ ] Adicionar nova taxa
- [ ] Editar taxa existente
- [ ] Desativar taxa

**Teste 4: Homepage**
- [ ] Verificar que informações da loja são exibidas corretamente
- [ ] Verificar que não há referência a "valor mínimo"

#### 4.3. Testes de Integração

**Fluxo Completo:**
1. Cliente acessa homepage
2. Adiciona produtos ao carrinho
3. Vai para checkout
4. Insere CEP
5. Taxa é calculada automaticamente
6. Pedido é finalizado
7. Admin visualiza pedido com taxa correta

---

### **FASE 5: Documentação e Commit** 📝

#### 5.1. Atualizar Documentação
**Arquivo:** `docs/MIGRACAO_TAXAS_CONCLUIDA.md`

```markdown
# ✅ Migração de Taxas de Entrega Concluída

**Data:** [DATA]  
**Versão:** 1.0

## Mudanças Realizadas

### Banco de Dados
- ✅ Removidos campos `taxa_entrega` e `valor_minimo` de `pizzaria_config`
- ✅ Backup criado em `pizzaria_config_backup_taxa`

### Frontend
- ✅ Interface TypeScript atualizada
- ✅ Aba Geral (Config) atualizada
- ✅ Checkout atualizado
- ✅ Componentes atualizados

### Sistema de Taxas
- ✅ Tabela `taxas_entrega` como fonte única de verdade
- ✅ Funções `buscar_taxa_por_cep()` e `buscar_taxa_entrega()` funcionais
- ✅ Interface admin em `/admin/taxas` operacional

## Testes Realizados
- ✅ Banco de dados
- ✅ Frontend (4 testes)
- ✅ Integração (fluxo completo)

## Rollback
Caso necessário, executar script de rollback em `scripts/26-remove-taxa-unica-fields.sql`
```

#### 5.2. Commits Git

```bash
# Commit 1: Script SQL
git add scripts/26-remove-taxa-unica-fields.sql
git commit -m "feat(database): remove taxa_entrega and valor_minimo fields from pizzaria_config"

# Commit 2: Frontend
git add lib/supabase.ts app/admin/config/tabs/geral.tsx app/checkout/page.tsx components/store-info-modal.tsx app/page.tsx
git commit -m "feat(frontend): migrate to taxas_entrega table, remove single tax system"

# Commit 3: Documentação
git add docs/MIGRACAO_TAXAS_CONCLUIDA.md docs/PLANO_MIGRACAO_TAXAS_ENTREGA.md
git commit -m "docs: add migration plan and completion report for delivery tax system"
```

---

## ⚠️ Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Pedidos em andamento com taxa antiga | BAIXO | MÉDIO | Executar migração fora de horário de pico |
| Checkout quebrar sem taxa | MÉDIO | ALTO | Garantir que há taxas cadastradas antes |
| Perda de dados históricos | BAIXO | BAIXO | Backup automático criado |
| TypeScript errors | MÉDIO | MÉDIO | Atualizar interfaces antes de remover DB |

---

## 📋 Checklist de Execução

### Pré-Migração
- [ ] Backup do banco de dados completo
- [ ] Verificar que há taxas cadastradas em `taxas_entrega`
- [ ] Notificar equipe sobre manutenção (se aplicável)
- [ ] Criar branch Git: `feat/migrate-delivery-tax-system`

### Execução
- [ ] **FASE 1:** Backup e validação
- [ ] **FASE 2:** Executar script SQL
- [ ] **FASE 3:** Atualizar frontend (6 arquivos)
- [ ] **FASE 4:** Executar testes (12 testes)
- [ ] **FASE 5:** Documentar e commitar

### Pós-Migração
- [ ] Monitorar logs por 24h
- [ ] Verificar pedidos criados após migração
- [ ] Coletar feedback da equipe
- [ ] Remover backup após 7 dias (se tudo OK)

---

## 🎯 Critérios de Sucesso

✅ **Banco de Dados:**
- Campos `taxa_entrega` e `valor_minimo` removidos
- Backup criado com sucesso
- Nenhum erro em queries

✅ **Frontend:**
- Nenhum erro TypeScript
- Checkout funcional com taxas por CEP
- Interface admin atualizada

✅ **Funcionalidade:**
- Clientes conseguem finalizar pedidos
- Taxas são calculadas corretamente
- Admin consegue gerenciar taxas

✅ **Performance:**
- Tempo de resposta mantido ou melhorado
- Nenhum erro 500 em produção

---

## 📞 Contatos de Suporte

**Em caso de problemas:**
1. Executar rollback imediatamente
2. Verificar logs do Supabase
3. Revisar este documento
4. Contatar desenvolvedor responsável

---

## 📚 Referências

- Tabela `taxas_entrega`: Ver estrutura em `scripts/01-create-tables.sql`
- Helper de taxas: `lib/taxa-helpers.ts`
- Interface admin: `/admin/taxas`
- Funções DB: `buscar_taxa_por_cep()`, `buscar_taxa_entrega()`

---

**Última atualização:** 18/01/2025 às 21:15 (UTC-03:00)  
**Status:** 📝 PLANEJAMENTO COMPLETO - Pronto para execução
