-- ============================================================================
-- SCRIPT: 21-fix-view-nullable-fields.sql
-- Descrição: Corrige campos nullable na view vw_pedidos_kanban
-- Data: 2025-01-18
-- Versão: 1.0
-- ============================================================================
-- 
-- Este script adiciona COALESCE para garantir que campos críticos
-- nunca retornem NULL, prevenindo crashes no frontend
--
-- ============================================================================

BEGIN;

-- Recriar view com COALESCE para campos críticos
CREATE OR REPLACE VIEW vw_pedidos_kanban AS
SELECT 
    p.id,
    COALESCE(p.numero_pedido, 'SEM-NUMERO') as numero_pedido,
    COALESCE(p.nome_cliente, '') as nome_cliente,
    COALESCE(p.telefone_cliente, '') as telefone_cliente,
    COALESCE(p.tipo_entrega, 'delivery') as tipo_entrega,
    p.endereco_entrega,
    COALESCE(p.status, 'pendente') as status,
    p.status_anterior,
    COALESCE(p.subtotal, 0) as subtotal,
    COALESCE(p.taxa_entrega, 0) as taxa_entrega,
    COALESCE(p.total, 0) as total,
    COALESCE(p.forma_pagamento, 'pix') as forma_pagamento,
    p.observacoes,
    p.created_at,
    p.updated_at,
    COALESCE(p.ordem_kanban, 0) as ordem_kanban,
    p.alterado_por,
    p.motivo_cancelamento,
    -- Contagem de itens (sempre retorna número, nunca NULL)
    COALESCE(COUNT(pi.id), 0) as total_itens,
    -- Resumo dos itens (sempre retorna array, nunca NULL)
    COALESCE(
        ARRAY_AGG(
            JSONB_BUILD_OBJECT(
                'nome', pi.nome_produto,
                'quantidade', pi.quantidade,
                'tamanho', pi.tamanho
            ) ORDER BY pi.created_at
        ) FILTER (WHERE pi.id IS NOT NULL),
        ARRAY[]::jsonb[]
    ) as itens_resumo
FROM pedidos p
LEFT JOIN pedido_itens pi ON pi.pedido_id = p.id
GROUP BY p.id
ORDER BY 
    p.ordem_kanban ASC, 
    p.created_at DESC;

COMMENT ON VIEW vw_pedidos_kanban IS 'View otimizada para Kanban com campos não-nullable';

COMMIT;

-- Verificação
SELECT '✅ View vw_pedidos_kanban atualizada com COALESCE' as status;

-- Testar view
SELECT 
    COUNT(*) as total_pedidos,
    COUNT(*) FILTER (WHERE numero_pedido = 'SEM-NUMERO') as sem_numero,
    COUNT(*) FILTER (WHERE nome_cliente = '') as sem_nome,
    COUNT(*) FILTER (WHERE total = 0) as total_zero
FROM vw_pedidos_kanban;
