# 📋 PLANO DETALHADO: Implementação de Pedidos Kanban

**Data:** 2025-01-18  
**Objetivo:** Criar página de gerenciamento de pedidos em estilo Kanban  
**Prioridade:** ALTA  
**Tempo Estimado:** 60-80 horas

---

## 🎯 VISÃO GERAL

### Estrutura Kanban
```
┌─────────────┬──────────────┬─────────────────┬─────────────┬─────────────┐
│  PENDENTE   │  EM PREPARO  │ SAIU P/ ENTREGA │ FINALIZADO  │  CANCELADO  │
├─────────────┼──────────────┼─────────────────┼─────────────┼─────────────┤
│ Pedido #001 │ Pedido #003  │   Pedido #005   │ Pedido #007 │ Pedido #009 │
│ Pedido #002 │ Pedido #004  │   Pedido #006   │ Pedido #008 │             │
└─────────────┴──────────────┴─────────────────┴─────────────┴─────────────┘
```

### Fluxo de Status
```
PENDENTE → EM PREPARO → SAIU P/ ENTREGA → FINALIZADO
    ↓           ↓              ↓
  CANCELADO  CANCELADO     CANCELADO
```

---

## 📊 PARTE 1: BANCO DE DADOS

### 1.1 Análise da Estrutura Atual

**Tabela `pedidos` atual:**
```sql
- id (UUID)
- tipo_entrega (VARCHAR)
- endereco_entrega (TEXT)
- forma_pagamento (VARCHAR)
- subtotal (NUMERIC)
- taxa_entrega (NUMERIC)
- total (NUMERIC)
- status (VARCHAR) DEFAULT 'pendente'
- observacoes (TEXT)
- enviado_whatsapp (BOOLEAN)
- created_at (TIMESTAMP)
```

**Status possíveis atuais:**
- `pendente`
- `confirmado`
- `em_preparo`
- `saiu_entrega`
- `finalizado`
- `cancelado`

### 1.2 Campos Necessários para Kanban

**Novos campos obrigatórios:**
```sql
ALTER TABLE pedidos ADD COLUMN numero_pedido VARCHAR(50) UNIQUE;
ALTER TABLE pedidos ADD COLUMN nome_cliente VARCHAR(255);
ALTER TABLE pedidos ADD COLUMN telefone_cliente VARCHAR(20);
ALTER TABLE pedidos ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
ALTER TABLE pedidos ADD COLUMN status_anterior VARCHAR(50);
ALTER TABLE pedidos ADD COLUMN alterado_por VARCHAR(255);
ALTER TABLE pedidos ADD COLUMN motivo_cancelamento TEXT;
ALTER TABLE pedidos ADD COLUMN ordem_kanban INTEGER DEFAULT 0;
```

### 1.3 Tabela de Histórico de Status

**Nova tabela `pedido_historico`:**
```sql
CREATE TABLE public.pedido_historico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    status_anterior VARCHAR(50),
    status_novo VARCHAR(50) NOT NULL,
    alterado_por VARCHAR(255),
    observacao TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_pedido_historico_pedido_id ON pedido_historico(pedido_id);
CREATE INDEX idx_pedido_historico_created_at ON pedido_historico(created_at DESC);
```

### 1.4 Função para Gerar Número de Pedido

```sql
CREATE OR REPLACE FUNCTION gerar_numero_pedido()
RETURNS TRIGGER AS $$
DECLARE
    novo_numero VARCHAR(50);
    contador INTEGER;
BEGIN
    -- Buscar último número do dia
    SELECT COUNT(*) + 1 INTO contador
    FROM pedidos
    WHERE DATE(created_at) = CURRENT_DATE;
    
    -- Formato: PED-YYYYMMDD-XXX
    novo_numero := 'PED-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(contador::TEXT, 3, '0');
    
    NEW.numero_pedido := novo_numero;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_gerar_numero_pedido
BEFORE INSERT ON pedidos
FOR EACH ROW
WHEN (NEW.numero_pedido IS NULL)
EXECUTE FUNCTION gerar_numero_pedido();
```

### 1.5 Trigger para Histórico de Status

```sql
CREATE OR REPLACE FUNCTION registrar_mudanca_status()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO pedido_historico (
            pedido_id,
            status_anterior,
            status_novo,
            alterado_por,
            observacao
        ) VALUES (
            NEW.id,
            OLD.status,
            NEW.status,
            NEW.alterado_por,
            CASE 
                WHEN NEW.status = 'cancelado' THEN NEW.motivo_cancelamento
                ELSE NULL
            END
        );
        
        NEW.status_anterior := OLD.status;
    END IF;
    
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_historico_status
BEFORE UPDATE ON pedidos
FOR EACH ROW
EXECUTE FUNCTION registrar_mudanca_status();
```

### 1.6 View para Pedidos com Contagem de Itens

```sql
CREATE OR REPLACE VIEW vw_pedidos_kanban AS
SELECT 
    p.id,
    p.numero_pedido,
    p.nome_cliente,
    p.telefone_cliente,
    p.tipo_entrega,
    p.status,
    p.total,
    p.forma_pagamento,
    p.created_at,
    p.updated_at,
    p.ordem_kanban,
    COUNT(pi.id) as total_itens,
    ARRAY_AGG(
        JSON_BUILD_OBJECT(
            'nome', pi.nome_produto,
            'quantidade', pi.quantidade,
            'tamanho', pi.tamanho
        )
    ) as itens_resumo
FROM pedidos p
LEFT JOIN pedido_itens pi ON pi.pedido_id = p.id
GROUP BY p.id
ORDER BY p.ordem_kanban ASC, p.created_at DESC;
```

### 1.7 Índices para Performance

```sql
CREATE INDEX idx_pedidos_status ON pedidos(status);
CREATE INDEX idx_pedidos_created_at ON pedidos(created_at DESC);
CREATE INDEX idx_pedidos_numero_pedido ON pedidos(numero_pedido);
CREATE INDEX idx_pedidos_telefone ON pedidos(telefone_cliente);
CREATE INDEX idx_pedidos_ordem_kanban ON pedidos(ordem_kanban);
CREATE INDEX idx_pedidos_status_ordem ON pedidos(status, ordem_kanban);
```

---

## 🗄️ SCRIPT SQL COMPLETO - PARTE 1

```sql
-- ============================================================================
-- SCRIPT: 20-kanban-pedidos-migration.sql
-- Descrição: Migração para suportar Kanban de Pedidos
-- Data: 2025-01-18
-- ============================================================================

BEGIN;

-- 1. ADICIONAR NOVOS CAMPOS NA TABELA PEDIDOS
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS numero_pedido VARCHAR(50) UNIQUE;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS nome_cliente VARCHAR(255);
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS telefone_cliente VARCHAR(20);
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS status_anterior VARCHAR(50);
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS alterado_por VARCHAR(255);
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS motivo_cancelamento TEXT;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS ordem_kanban INTEGER DEFAULT 0;

-- 2. CRIAR TABELA DE HISTÓRICO
CREATE TABLE IF NOT EXISTS pedido_historico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    status_anterior VARCHAR(50),
    status_novo VARCHAR(50) NOT NULL,
    alterado_por VARCHAR(255),
    observacao TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. CRIAR ÍNDICES
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON pedidos(status);
CREATE INDEX IF NOT EXISTS idx_pedidos_created_at ON pedidos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pedidos_numero_pedido ON pedidos(numero_pedido);
CREATE INDEX IF NOT EXISTS idx_pedidos_telefone ON pedidos(telefone_cliente);
CREATE INDEX IF NOT EXISTS idx_pedidos_ordem_kanban ON pedidos(ordem_kanban);
CREATE INDEX IF NOT EXISTS idx_pedidos_status_ordem ON pedidos(status, ordem_kanban);
CREATE INDEX IF NOT EXISTS idx_pedido_historico_pedido_id ON pedido_historico(pedido_id);
CREATE INDEX IF NOT EXISTS idx_pedido_historico_created_at ON pedido_historico(created_at DESC);

-- 4. FUNÇÃO PARA GERAR NÚMERO DE PEDIDO
CREATE OR REPLACE FUNCTION gerar_numero_pedido()
RETURNS TRIGGER AS $$
DECLARE
    novo_numero VARCHAR(50);
    contador INTEGER;
BEGIN
    SELECT COUNT(*) + 1 INTO contador
    FROM pedidos
    WHERE DATE(created_at) = CURRENT_DATE;
    
    novo_numero := 'PED-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(contador::TEXT, 3, '0');
    NEW.numero_pedido := novo_numero;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. TRIGGER PARA NÚMERO DE PEDIDO
DROP TRIGGER IF EXISTS trigger_gerar_numero_pedido ON pedidos;
CREATE TRIGGER trigger_gerar_numero_pedido
BEFORE INSERT ON pedidos
FOR EACH ROW
WHEN (NEW.numero_pedido IS NULL)
EXECUTE FUNCTION gerar_numero_pedido();

-- 6. FUNÇÃO PARA REGISTRAR MUDANÇA DE STATUS
CREATE OR REPLACE FUNCTION registrar_mudanca_status()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO pedido_historico (
            pedido_id, status_anterior, status_novo, alterado_por, observacao
        ) VALUES (
            NEW.id, OLD.status, NEW.status, NEW.alterado_por,
            CASE WHEN NEW.status = 'cancelado' THEN NEW.motivo_cancelamento ELSE NULL END
        );
        NEW.status_anterior := OLD.status;
    END IF
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. TRIGGER PARA HISTÓRICO
DROP TRIGGER IF EXISTS trigger_historico_status ON pedidos;
CREATE TRIGGER trigger_historico_status
BEFORE UPDATE ON pedidos
FOR EACH ROW
EXECUTE FUNCTION registrar_mudanca_status();

-- 8. VIEW PARA KANBAN
CREATE OR REPLACE VIEW vw_pedidos_kanban AS
SELECT 
    p.id, p.numero_pedido, p.nome_cliente, p.telefone_cliente,
    p.tipo_entrega, p.status, p.total, p.forma_pagamento,
    p.created_at, p.updated_at, p.ordem_kanban,
    COUNT(pi.id) as total_itens,
    ARRAY_AGG(JSON_BUILD_OBJECT(
        'nome', pi.nome_produto,
        'quantidade', pi.quantidade,
        'tamanho', pi.tamanho
    )) as itens_resumo
FROM pedidos p
LEFT JOIN pedido_itens pi ON pi.pedido_id = p.id
GROUP BY p.id
ORDER BY p.ordem_kanban ASC, p.created_at DESC;

-- 9. MIGRAR DADOS EXISTENTES
UPDATE pedidos SET updated_at = created_at WHERE updated_at IS NULL;
UPDATE pedidos SET ordem_kanban = 0 WHERE ordem_kanban IS NULL;

COMMIT;
```

---

**Continua na PARTE 2...**
