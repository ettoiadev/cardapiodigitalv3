-- ============================================================================
-- SCRIPT: 20-kanban-pedidos-migration.sql
-- Descrição: Migração completa para Sistema Kanban de Pedidos
-- Data: 2025-01-18
-- Versão: 1.0
-- ============================================================================
-- 
-- Este script implementa:
-- 1. Novos campos na tabela pedidos para suportar Kanban
-- 2. Tabela de histórico de mudanças de status
-- 3. Função para gerar número de pedido automaticamente
-- 4. Trigger para registrar histórico de mudanças
-- 5. View otimizada para o Kanban
-- 6. Índices para performance
--
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. ADICIONAR NOVOS CAMPOS NA TABELA PEDIDOS
-- ============================================================================

-- Número do pedido (gerado automaticamente)
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS numero_pedido VARCHAR(50) UNIQUE;

-- Dados do cliente (para pedidos sem autenticação)
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS nome_cliente VARCHAR(255);
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS telefone_cliente VARCHAR(20);

-- Timestamps e auditoria
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS status_anterior VARCHAR(50);
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS alterado_por VARCHAR(255);

-- Cancelamento
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS motivo_cancelamento TEXT;

-- Ordem no Kanban (para drag & drop)
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS ordem_kanban INTEGER DEFAULT 0;

-- Comentários nas colunas
COMMENT ON COLUMN pedidos.numero_pedido IS 'Número único do pedido gerado automaticamente (PED-YYYYMMDD-XXX)';
COMMENT ON COLUMN pedidos.nome_cliente IS 'Nome do cliente (usado quando não há autenticação)';
COMMENT ON COLUMN pedidos.telefone_cliente IS 'Telefone do cliente (usado quando não há autenticação)';
COMMENT ON COLUMN pedidos.updated_at IS 'Data/hora da última atualização';
COMMENT ON COLUMN pedidos.status_anterior IS 'Status anterior do pedido (para auditoria)';
COMMENT ON COLUMN pedidos.alterado_por IS 'Usuário que alterou o status';
COMMENT ON COLUMN pedidos.motivo_cancelamento IS 'Motivo do cancelamento (se status = cancelado)';
COMMENT ON COLUMN pedidos.ordem_kanban IS 'Ordem do pedido na coluna Kanban (para drag & drop)';

-- ============================================================================
-- 2. CRIAR TABELA DE HISTÓRICO DE STATUS
-- ============================================================================

CREATE TABLE IF NOT EXISTS pedido_historico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    status_anterior VARCHAR(50),
    status_novo VARCHAR(50) NOT NULL,
    alterado_por VARCHAR(255),
    observacao TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE pedido_historico IS 'Histórico completo de mudanças de status dos pedidos';
COMMENT ON COLUMN pedido_historico.pedido_id IS 'Referência ao pedido';
COMMENT ON COLUMN pedido_historico.status_anterior IS 'Status antes da mudança';
COMMENT ON COLUMN pedido_historico.status_novo IS 'Status após a mudança';
COMMENT ON COLUMN pedido_historico.alterado_por IS 'Usuário que fez a mudança';
COMMENT ON COLUMN pedido_historico.observacao IS 'Observações sobre a mudança (ex: motivo de cancelamento)';

-- ============================================================================
-- 3. CRIAR ÍNDICES PARA PERFORMANCE
-- ============================================================================

-- Índices na tabela pedidos
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON pedidos(status);
CREATE INDEX IF NOT EXISTS idx_pedidos_created_at ON pedidos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pedidos_numero_pedido ON pedidos(numero_pedido);
CREATE INDEX IF NOT EXISTS idx_pedidos_telefone ON pedidos(telefone_cliente);
CREATE INDEX IF NOT EXISTS idx_pedidos_ordem_kanban ON pedidos(ordem_kanban);
CREATE INDEX IF NOT EXISTS idx_pedidos_status_ordem ON pedidos(status, ordem_kanban);
CREATE INDEX IF NOT EXISTS idx_pedidos_updated_at ON pedidos(updated_at DESC);

-- Índices na tabela pedido_historico
CREATE INDEX IF NOT EXISTS idx_pedido_historico_pedido_id ON pedido_historico(pedido_id);
CREATE INDEX IF NOT EXISTS idx_pedido_historico_created_at ON pedido_historico(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pedido_historico_status_novo ON pedido_historico(status_novo);

-- ============================================================================
-- 4. FUNÇÃO PARA GERAR NÚMERO DE PEDIDO AUTOMATICAMENTE
-- ============================================================================

CREATE OR REPLACE FUNCTION gerar_numero_pedido()
RETURNS TRIGGER AS $$
DECLARE
    novo_numero VARCHAR(50);
    contador INTEGER;
BEGIN
    -- Buscar quantos pedidos foram criados hoje
    SELECT COUNT(*) + 1 INTO contador
    FROM pedidos
    WHERE DATE(created_at) = CURRENT_DATE;
    
    -- Formato: PED-YYYYMMDD-XXX
    -- Exemplo: PED-20250118-001
    novo_numero := 'PED-' || 
                   TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || 
                   '-' || 
                   LPAD(contador::TEXT, 3, '0');
    
    NEW.numero_pedido := novo_numero;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION gerar_numero_pedido() IS 'Gera número único do pedido no formato PED-YYYYMMDD-XXX';

-- ============================================================================
-- 5. TRIGGER PARA GERAR NÚMERO DE PEDIDO
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_gerar_numero_pedido ON pedidos;

CREATE TRIGGER trigger_gerar_numero_pedido
BEFORE INSERT ON pedidos
FOR EACH ROW
WHEN (NEW.numero_pedido IS NULL)
EXECUTE FUNCTION gerar_numero_pedido();

-- ============================================================================
-- 6. FUNÇÃO PARA REGISTRAR MUDANÇA DE STATUS
-- ============================================================================

CREATE OR REPLACE FUNCTION registrar_mudanca_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Se o status mudou, registrar no histórico
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
        
        -- Atualizar status_anterior
        NEW.status_anterior := OLD.status;
    END IF;
    
    -- Sempre atualizar updated_at
    NEW.updated_at := NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION registrar_mudanca_status() IS 'Registra automaticamente mudanças de status no histórico';

-- ============================================================================
-- 7. TRIGGER PARA HISTÓRICO DE STATUS
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_historico_status ON pedidos;

CREATE TRIGGER trigger_historico_status
BEFORE UPDATE ON pedidos
FOR EACH ROW
EXECUTE FUNCTION registrar_mudanca_status();

-- ============================================================================
-- 8. VIEW OTIMIZADA PARA KANBAN
-- ============================================================================

CREATE OR REPLACE VIEW vw_pedidos_kanban AS
SELECT 
    p.id,
    p.numero_pedido,
    p.nome_cliente,
    p.telefone_cliente,
    p.tipo_entrega,
    p.endereco_entrega,
    p.status,
    p.status_anterior,
    p.subtotal,
    p.taxa_entrega,
    p.total,
    p.forma_pagamento,
    p.observacoes,
    p.created_at,
    p.updated_at,
    p.ordem_kanban,
    p.alterado_por,
    p.motivo_cancelamento,
    -- Contagem de itens
    COUNT(pi.id) as total_itens,
    -- Resumo dos itens (para preview no card)
    COALESCE(
        ARRAY_AGG(
            JSON_BUILD_OBJECT(
                'nome', pi.nome_produto,
                'quantidade', pi.quantidade,
                'tamanho', pi.tamanho
            ) ORDER BY pi.created_at
        ) FILTER (WHERE pi.id IS NOT NULL),
        ARRAY[]::json[]
    ) as itens_resumo
FROM pedidos p
LEFT JOIN pedido_itens pi ON pi.pedido_id = p.id
GROUP BY p.id
ORDER BY 
    p.ordem_kanban ASC, 
    p.created_at DESC;

COMMENT ON VIEW vw_pedidos_kanban IS 'View otimizada para exibição no Kanban com resumo de itens';

-- ============================================================================
-- 9. MIGRAR DADOS EXISTENTES
-- ============================================================================

-- Atualizar updated_at para pedidos existentes
UPDATE pedidos 
SET updated_at = created_at 
WHERE updated_at IS NULL;

-- Atualizar ordem_kanban para pedidos existentes
UPDATE pedidos 
SET ordem_kanban = 0 
WHERE ordem_kanban IS NULL;

-- Gerar números de pedido para pedidos existentes (se houver)
DO $$
DECLARE
    pedido_record RECORD;
    contador INTEGER := 0;
    data_atual DATE;
    ultimo_numero VARCHAR(50);
BEGIN
    -- Para cada pedido sem número
    FOR pedido_record IN 
        SELECT id, created_at 
        FROM pedidos 
        WHERE numero_pedido IS NULL
        ORDER BY created_at ASC
    LOOP
        -- Se mudou o dia, resetar contador
        IF data_atual IS NULL OR DATE(pedido_record.created_at) != data_atual THEN
            data_atual := DATE(pedido_record.created_at);
            contador := 1;
        ELSE
            contador := contador + 1;
        END IF;
        
        -- Gerar número
        ultimo_numero := 'PED-' || 
                        TO_CHAR(pedido_record.created_at, 'YYYYMMDD') || 
                        '-' || 
                        LPAD(contador::TEXT, 3, '0');
        
        -- Atualizar pedido
        UPDATE pedidos 
        SET numero_pedido = ultimo_numero 
        WHERE id = pedido_record.id;
    END LOOP;
END $$;

-- ============================================================================
-- 10. VALIDAÇÕES E CONSTRAINTS
-- ============================================================================

-- Garantir que status seja válido
ALTER TABLE pedidos DROP CONSTRAINT IF EXISTS check_status_valido;
ALTER TABLE pedidos ADD CONSTRAINT check_status_valido 
CHECK (status IN ('pendente', 'em_preparo', 'saiu_entrega', 'finalizado', 'cancelado'));

-- Garantir que ordem_kanban seja não-negativa
ALTER TABLE pedidos DROP CONSTRAINT IF EXISTS check_ordem_kanban;
ALTER TABLE pedidos ADD CONSTRAINT check_ordem_kanban 
CHECK (ordem_kanban >= 0);

-- ============================================================================
-- 11. FUNÇÃO AUXILIAR PARA BUSCAR HISTÓRICO
-- ============================================================================

CREATE OR REPLACE FUNCTION buscar_historico_pedido(p_pedido_id UUID)
RETURNS TABLE (
    id UUID,
    status_anterior VARCHAR,
    status_novo VARCHAR,
    alterado_por VARCHAR,
    observacao TEXT,
    created_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ph.id,
        ph.status_anterior,
        ph.status_novo,
        ph.alterado_por,
        ph.observacao,
        ph.created_at
    FROM pedido_historico ph
    WHERE ph.pedido_id = p_pedido_id
    ORDER BY ph.created_at DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION buscar_historico_pedido(UUID) IS 'Retorna histórico completo de mudanças de status de um pedido';

-- ============================================================================
-- 12. ESTATÍSTICAS E VERIFICAÇÃO
-- ============================================================================

-- Criar função para estatísticas do Kanban
CREATE OR REPLACE FUNCTION estatisticas_kanban()
RETURNS TABLE (
    status VARCHAR,
    total_pedidos BIGINT,
    valor_total NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.status::VARCHAR,
        COUNT(*)::BIGINT as total_pedidos,
        SUM(p.total)::NUMERIC as valor_total
    FROM pedidos p
    WHERE p.created_at >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY p.status
    ORDER BY 
        CASE p.status
            WHEN 'pendente' THEN 1
            WHEN 'em_preparo' THEN 2
            WHEN 'saiu_entrega' THEN 3
            WHEN 'finalizado' THEN 4
            WHEN 'cancelado' THEN 5
        END;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION estatisticas_kanban() IS 'Retorna estatísticas dos pedidos por status (últimos 30 dias)';

COMMIT;

-- ============================================================================
-- VERIFICAÇÃO PÓS-MIGRAÇÃO
-- ============================================================================

-- Verificar se todos os campos foram criados
DO $$
DECLARE
    campos_faltando TEXT[];
BEGIN
    SELECT ARRAY_AGG(column_name)
    INTO campos_faltando
    FROM (
        SELECT unnest(ARRAY[
            'numero_pedido', 'nome_cliente', 'telefone_cliente',
            'updated_at', 'status_anterior', 'alterado_por',
            'motivo_cancelamento', 'ordem_kanban'
        ]) AS column_name
    ) expected
    WHERE NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'pedidos' 
        AND column_name = expected.column_name
    );
    
    IF array_length(campos_faltando, 1) > 0 THEN
        RAISE EXCEPTION 'Campos faltando na tabela pedidos: %', array_to_string(campos_faltando, ', ');
    ELSE
        RAISE NOTICE '✅ Todos os campos foram criados com sucesso!';
    END IF;
END $$;

-- Verificar se a tabela de histórico foi criada
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'pedido_historico'
    ) THEN
        RAISE EXCEPTION 'Tabela pedido_historico não foi criada!';
    ELSE
        RAISE NOTICE '✅ Tabela pedido_historico criada com sucesso!';
    END IF;
END $$;

-- Verificar se a view foi criada
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.views 
        WHERE table_name = 'vw_pedidos_kanban'
    ) THEN
        RAISE EXCEPTION 'View vw_pedidos_kanban não foi criada!';
    ELSE
        RAISE NOTICE '✅ View vw_pedidos_kanban criada com sucesso!';
    END IF;
END $$;

-- Mostrar estatísticas
SELECT '📊 ESTATÍSTICAS PÓS-MIGRAÇÃO' as info;
SELECT 
    COUNT(*) as total_pedidos,
    COUNT(DISTINCT numero_pedido) as pedidos_com_numero,
    COUNT(*) FILTER (WHERE updated_at IS NOT NULL) as pedidos_com_updated_at
FROM pedidos;

SELECT '📈 PEDIDOS POR STATUS' as info;
SELECT * FROM estatisticas_kanban();

-- ============================================================================
-- FIM DA MIGRAÇÃO
-- ============================================================================

SELECT '✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO!' as status;
SELECT 'Sistema Kanban de Pedidos está pronto para uso.' as mensagem;
