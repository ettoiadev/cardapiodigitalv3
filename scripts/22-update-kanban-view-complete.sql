-- ============================================================================
-- SCRIPT: 22-update-kanban-view-complete.sql
-- Descrição: Atualiza view vw_pedidos_kanban com todos os campos necessários
-- Data: 2025-01-20
-- Versão: 2.0
-- ============================================================================

BEGIN;

-- Recriar view com TODOS os campos necessários para o Kanban
CREATE OR REPLACE VIEW vw_pedidos_kanban AS
SELECT 
    p.id,
    COALESCE(p.numero_pedido, 'SEM-NUMERO') as numero_pedido,
    COALESCE(p.nome_cliente, '') as nome_cliente,
    COALESCE(p.telefone_cliente, '') as telefone_cliente,
    COALESCE(p.tipo_entrega, 'delivery') as tipo_entrega,
    p.endereco_entrega,
    p.endereco_bairro,
    p.endereco_cidade,
    p.endereco_estado,
    p.endereco_cep,
    COALESCE(p.status, 'pendente') as status,
    p.status_anterior,
    COALESCE(p.subtotal, 0) as subtotal,
    COALESCE(p.taxa_entrega, 0) as taxa_entrega,
    COALESCE(p.total, 0) as total,
    COALESCE(p.forma_pagamento, 'pix') as forma_pagamento,
    p.troco_para,
    p.observacoes,
    p.created_at,
    p.updated_at,
    COALESCE(p.ordem_kanban, 0) as ordem_kanban,
    p.alterado_por,
    p.motivo_cancelamento,
    p.cliente_id,
    -- Contagem de itens (sempre retorna número, nunca NULL)
    COALESCE(COUNT(pi.id), 0) as total_itens,
    -- Resumo dos itens com sabores (sempre retorna array, nunca NULL)
    COALESCE(
        ARRAY_AGG(
            JSONB_BUILD_OBJECT(
                'nome', pi.nome_produto,
                'quantidade', pi.quantidade,
                'tamanho', pi.tamanho,
                'sabores', pi.sabores
            ) ORDER BY pi.created_at
        ) FILTER (WHERE pi.id IS NOT NULL),
        ARRAY[]::jsonb[]
    ) as itens_resumo
FROM pedidos p
LEFT JOIN pedido_itens pi ON pi.pedido_id = p.id
GROUP BY 
    p.id,
    p.numero_pedido,
    p.nome_cliente,
    p.telefone_cliente,
    p.tipo_entrega,
    p.endereco_entrega,
    p.endereco_bairro,
    p.endereco_cidade,
    p.endereco_estado,
    p.endereco_cep,
    p.status,
    p.status_anterior,
    p.subtotal,
    p.taxa_entrega,
    p.total,
    p.forma_pagamento,
    p.troco_para,
    p.observacoes,
    p.created_at,
    p.updated_at,
    p.ordem_kanban,
    p.alterado_por,
    p.motivo_cancelamento,
    p.cliente_id
ORDER BY 
    p.ordem_kanban ASC, 
    p.created_at DESC;

COMMENT ON VIEW vw_pedidos_kanban IS 'View otimizada para Kanban com todos os campos necessários incluindo endereço completo e sabores';

COMMIT;

-- Verificação
SELECT '✅ View vw_pedidos_kanban atualizada com sucesso!' as status;

-- Testar view
SELECT 
    COUNT(*) as total_pedidos,
    COUNT(*) FILTER (WHERE numero_pedido = 'SEM-NUMERO') as sem_numero,
    COUNT(*) FILTER (WHERE total_itens > 0) as com_itens
FROM vw_pedidos_kanban;

SELECT '📊 Primeiros 3 pedidos da view:' as info;
SELECT 
    numero_pedido,
    nome_cliente,
    status,
    total_itens,
    total
FROM vw_pedidos_kanban
LIMIT 3;
