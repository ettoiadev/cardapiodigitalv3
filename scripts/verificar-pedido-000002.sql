-- ============================================================================
-- VERIFICAÇÃO RÁPIDA: Pedido 000002
-- ============================================================================

-- 1. Verificar se o pedido existe
SELECT 
    '🔍 VERIFICANDO PEDIDO 000002' as titulo;

SELECT 
    id,
    numero_pedido,
    nome_cliente,
    status,
    created_at
FROM pedidos
WHERE numero_pedido = '000002';

-- 2. Verificar se há itens para este pedido
SELECT 
    '📦 ITENS DO PEDIDO 000002' as titulo;

SELECT 
    pi.id,
    pi.pedido_id,
    pi.nome_produto,
    pi.quantidade,
    pi.preco_total,
    pi.created_at
FROM pedido_itens pi
INNER JOIN pedidos p ON p.id = pi.pedido_id
WHERE p.numero_pedido = '000002';

-- 3. Contar itens
SELECT 
    '📊 CONTAGEM DE ITENS' as titulo;

SELECT 
    COUNT(*) as total_itens
FROM pedido_itens pi
INNER JOIN pedidos p ON p.id = pi.pedido_id
WHERE p.numero_pedido = '000002';

-- 4. Verificar todos os pedidos com itens (últimos 10)
SELECT 
    '📋 ÚLTIMOS 10 PEDIDOS COM ITENS' as titulo;

SELECT 
    p.numero_pedido,
    p.nome_cliente,
    COUNT(pi.id) as total_itens,
    p.created_at
FROM pedidos p
LEFT JOIN pedido_itens pi ON pi.pedido_id = p.id
GROUP BY p.id, p.numero_pedido, p.nome_cliente, p.created_at
ORDER BY p.created_at DESC
LIMIT 10;
