-- ============================================================================
-- DIAGNÓSTICO: Verificar pedidos sem itens na tabela pedido_itens
-- ============================================================================
-- Data: 2025-01-22
-- Descrição: Script para diagnosticar pedidos que podem não ter itens
-- ============================================================================

-- Verificar pedidos que existem mas não têm itens
SELECT
    '🔍 DIAGNÓSTICO DE PEDIDOS SEM ITENS' as titulo;

SELECT
    p.id as pedido_id,
    p.numero_pedido,
    p.nome_cliente,
    p.status,
    p.created_at,
    COALESCE(pi.total_itens, 0) as itens_count,
    CASE
        WHEN pi.total_itens IS NULL OR pi.total_itens = 0 THEN '🚨 SEM ITENS'
        WHEN pi.total_itens > 0 THEN '✅ COM ITENS'
        ELSE '❓ DESCONHECIDO'
    END as status_itens
FROM pedidos p
LEFT JOIN (
    SELECT
        pedido_id,
        COUNT(*) as total_itens
    FROM pedido_itens
    GROUP BY pedido_id
) pi ON pi.pedido_id = p.id
WHERE p.created_at >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY p.created_at DESC;

-- Verificar se há dados na tabela pedido_itens
SELECT
    '📊 ESTATÍSTICAS DA TABELA PEDIDO_ITENS' as titulo;

SELECT
    COUNT(*) as total_itens,
    COUNT(DISTINCT pedido_id) as pedidos_com_itens,
    AVG(total_por_pedido) as media_itens_por_pedido
FROM (
    SELECT
        pedido_id,
        COUNT(*) as total_por_pedido
    FROM pedido_itens
    GROUP BY pedido_id
) subquery;

-- Verificar pedidos recentes (últimas 24h) que podem ter problema
SELECT
    '🕐 PEDIDOS DAS ÚLTIMAS 24 HORAS' as titulo;

SELECT
    p.id,
    p.numero_pedido,
    p.nome_cliente,
    p.status,
    p.created_at,
    EXISTS(
        SELECT 1 FROM pedido_itens pi WHERE pi.pedido_id = p.id
    ) as tem_itens
FROM pedidos p
WHERE p.created_at >= CURRENT_DATE - INTERVAL '1 day'
ORDER BY p.created_at DESC;

-- Mostrar exemplo de itens existentes
SELECT
    '📋 EXEMPLOS DE ITENS EXISTENTES' as titulo;

SELECT
    pi.id,
    pi.pedido_id,
    pi.nome_produto,
    pi.quantidade,
    pi.preco_total,
    p.numero_pedido
FROM pedido_itens pi
LEFT JOIN pedidos p ON p.id = pi.pedido_id
WHERE p.created_at >= CURRENT_DATE - INTERVAL '1 day'
ORDER BY pi.created_at DESC
LIMIT 10;

-- Verificar se há problemas de relacionamento
SELECT
    '🔗 VERIFICAÇÃO DE RELACIONAMENTOS' as titulo;

-- Pedidos sem cliente_id (se houver)
SELECT COUNT(*) as pedidos_sem_cliente
FROM pedidos
WHERE cliente_id IS NULL;

-- Itens sem produto_id (se houver)
SELECT COUNT(*) as itens_sem_produto
FROM pedido_itens
WHERE produto_id IS NULL;

-- Pedidos com itens mas produto_id NULL
SELECT
    p.id,
    p.numero_pedido,
    COUNT(pi.id) as itens_count
FROM pedidos p
INNER JOIN pedido_itens pi ON pi.pedido_id = p.id
WHERE pi.produto_id IS NULL
GROUP BY p.id, p.numero_pedido;

-- ============================================================================
-- FIM DO DIAGNÓSTICO
-- ============================================================================

SELECT '✅ Diagnóstico concluído!' as status;
