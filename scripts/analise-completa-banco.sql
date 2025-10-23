-- ============================================================================
-- ANÁLISE COMPLETA E CORREÇÃO DO BANCO DE DADOS
-- ============================================================================
-- Data: 2025-01-22
-- Descrição: Análise profunda e correção de todos os problemas
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. VERIFICAR ESTRUTURA DAS TABELAS
-- ============================================================================

SELECT '🔍 VERIFICANDO ESTRUTURA DAS TABELAS' as titulo;

-- Verificar se todas as colunas necessárias existem em pedidos
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'pedidos'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar se todas as colunas necessárias existem em pedido_itens
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'pedido_itens'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- ============================================================================
-- 2. VERIFICAR RELACIONAMENTOS E FOREIGN KEYS
-- ============================================================================

SELECT '🔗 VERIFICANDO RELACIONAMENTOS' as titulo;

-- Verificar foreign keys
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('pedidos', 'pedido_itens')
  AND tc.table_schema = 'public';

-- ============================================================================
-- 3. VERIFICAR DADOS ÓRFÃOS
-- ============================================================================

SELECT '🚨 VERIFICANDO DADOS ÓRFÃOS' as titulo;

-- Itens sem pedido válido
SELECT 
    '❌ Itens órfãos (sem pedido)' as problema,
    COUNT(*) as total
FROM pedido_itens pi
LEFT JOIN pedidos p ON p.id = pi.pedido_id
WHERE p.id IS NULL;

-- Pedidos sem itens
SELECT 
    '⚠️ Pedidos sem itens' as problema,
    COUNT(*) as total
FROM pedidos p
LEFT JOIN pedido_itens pi ON pi.pedido_id = p.id
WHERE pi.id IS NULL
  AND p.created_at >= CURRENT_DATE - INTERVAL '30 days';

-- Pedidos com cliente_id inválido
SELECT 
    '❌ Pedidos com cliente_id inválido' as problema,
    COUNT(*) as total
FROM pedidos p
LEFT JOIN clientes c ON c.id = p.cliente_id
WHERE p.cliente_id IS NOT NULL
  AND c.id IS NULL;

-- ============================================================================
-- 4. VERIFICAR INTEGRIDADE DOS DADOS JSONB
-- ============================================================================

SELECT '📋 VERIFICANDO DADOS JSONB' as titulo;

-- Verificar sabores inválidos
SELECT 
    pi.id,
    pi.pedido_id,
    pi.nome_produto,
    pi.sabores,
    CASE
        WHEN pi.sabores IS NULL THEN 'NULL'
        WHEN jsonb_typeof(pi.sabores) != 'array' THEN 'Não é array'
        WHEN jsonb_array_length(pi.sabores) = 0 THEN 'Array vazio'
        ELSE 'OK'
    END as status_sabores
FROM pedido_itens pi
WHERE pi.sabores IS NOT NULL
  AND (
      jsonb_typeof(pi.sabores) != 'array'
      OR jsonb_array_length(pi.sabores) = 0
  )
LIMIT 10;

-- Verificar adicionais inválidos
SELECT 
    pi.id,
    pi.pedido_id,
    pi.nome_produto,
    pi.adicionais,
    CASE
        WHEN pi.adicionais IS NULL THEN 'NULL'
        WHEN jsonb_typeof(pi.adicionais) != 'array' THEN 'Não é array'
        ELSE 'OK'
    END as status_adicionais
FROM pedido_itens pi
WHERE pi.adicionais IS NOT NULL
  AND jsonb_typeof(pi.adicionais) != 'array'
LIMIT 10;

-- ============================================================================
-- 5. VERIFICAR PEDIDOS RECENTES
-- ============================================================================

SELECT '📊 ESTATÍSTICAS DE PEDIDOS RECENTES' as titulo;

SELECT 
    p.numero_pedido,
    p.nome_cliente,
    p.status,
    p.created_at,
    COUNT(pi.id) as total_itens,
    SUM(pi.preco_total) as valor_itens,
    p.total as total_pedido,
    CASE
        WHEN COUNT(pi.id) = 0 THEN '🚨 SEM ITENS'
        WHEN SUM(pi.preco_total) != p.subtotal THEN '⚠️ VALORES INCONSISTENTES'
        ELSE '✅ OK'
    END as status_validacao
FROM pedidos p
LEFT JOIN pedido_itens pi ON pi.pedido_id = p.id
WHERE p.created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY p.id, p.numero_pedido, p.nome_cliente, p.status, p.created_at, p.total, p.subtotal
ORDER BY p.created_at DESC;

-- ============================================================================
-- 6. CORREÇÕES AUTOMÁTICAS
-- ============================================================================

SELECT '🔧 APLICANDO CORREÇÕES' as titulo;

-- Corrigir sabores NULL para array vazio
UPDATE pedido_itens
SET sabores = '[]'::jsonb
WHERE sabores IS NULL
  AND created_at >= CURRENT_DATE - INTERVAL '30 days';

-- Corrigir adicionais NULL para array vazio
UPDATE pedido_itens
SET adicionais = '[]'::jsonb
WHERE adicionais IS NULL
  AND created_at >= CURRENT_DATE - INTERVAL '30 days';

-- Corrigir borda_recheada NULL para null explícito
UPDATE pedido_itens
SET borda_recheada = NULL
WHERE borda_recheada IS NOT NULL
  AND jsonb_typeof(borda_recheada) = 'null'
  AND created_at >= CURRENT_DATE - INTERVAL '30 days';

-- ============================================================================
-- 7. VERIFICAR POLÍTICAS RLS
-- ============================================================================

SELECT '🔒 VERIFICANDO POLÍTICAS RLS' as titulo;

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename IN ('pedidos', 'pedido_itens', 'clientes')
  AND schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- 8. VERIFICAR ÍNDICES
-- ============================================================================

SELECT '📇 VERIFICANDO ÍNDICES' as titulo;

SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('pedidos', 'pedido_itens')
  AND schemaname = 'public'
ORDER BY tablename, indexname;

-- ============================================================================
-- 9. ESTATÍSTICAS FINAIS
-- ============================================================================

SELECT '📊 ESTATÍSTICAS FINAIS' as titulo;

-- Total de pedidos por status
SELECT 
    status,
    COUNT(*) as total,
    SUM(total) as valor_total
FROM pedidos
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY status
ORDER BY 
    CASE status
        WHEN 'pendente' THEN 1
        WHEN 'em_preparo' THEN 2
        WHEN 'saiu_entrega' THEN 3
        WHEN 'finalizado' THEN 4
        WHEN 'cancelado' THEN 5
    END;

-- Total de itens
SELECT 
    COUNT(*) as total_itens,
    COUNT(DISTINCT pedido_id) as pedidos_com_itens,
    AVG(preco_total) as preco_medio
FROM pedido_itens
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days';

COMMIT;

SELECT '✅ ANÁLISE E CORREÇÕES CONCLUÍDAS!' as status;
