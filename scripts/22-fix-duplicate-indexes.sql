-- ============================================================================
-- SCRIPT: 22-fix-duplicate-indexes.sql
-- Descrição: Remove índices duplicados e otimiza performance
-- Data: 2025-01-18
-- Versão: 1.0
-- ============================================================================

BEGIN;

-- Verificar índices existentes
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'pedidos'
ORDER BY indexname;

-- Remover índice duplicado (se existir)
-- idx_pedidos_telefone deve ser idx_pedidos_telefone_cliente
DROP INDEX IF EXISTS idx_pedidos_telefone;

-- Garantir que o índice correto existe
CREATE INDEX IF NOT EXISTS idx_pedidos_telefone_cliente ON pedidos(telefone_cliente);

-- Verificar se há outros índices redundantes
-- Índice composto pode substituir índices simples
-- Ex: idx_pedidos_status_ordem cobre idx_pedidos_status

-- Análise de uso de índices (executar em produção para decidir)
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE tablename = 'pedidos'
ORDER BY idx_scan ASC;

COMMIT;

SELECT '✅ Índices otimizados' as status;
SELECT 'Execute a query de análise acima em produção para identificar índices não utilizados' as recomendacao;
