-- ============================================================================
-- SCRIPT: verificar-pedidos-kanban.sql
-- Descrição: Script para verificar se o sistema Kanban está funcionando
-- Data: 2025-01-18
-- ============================================================================

-- 1. Verificar se todos os campos existem na tabela pedidos
SELECT 
    '✅ Verificando campos da tabela pedidos...' as status;

SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'pedidos'
AND column_name IN (
    'numero_pedido', 
    'nome_cliente', 
    'telefone_cliente',
    'updated_at', 
    'status_anterior', 
    'alterado_por',
    'motivo_cancelamento', 
    'ordem_kanban'
)
ORDER BY column_name;

-- 2. Verificar se a tabela pedido_historico existe
SELECT 
    '✅ Verificando tabela pedido_historico...' as status;

SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_name = 'pedido_historico';

-- 3. Verificar se a view vw_pedidos_kanban existe
SELECT 
    '✅ Verificando view vw_pedidos_kanban...' as status;

SELECT 
    table_name,
    table_type
FROM information_schema.views
WHERE table_name = 'vw_pedidos_kanban';

-- 4. Verificar se os índices foram criados
SELECT 
    '✅ Verificando índices...' as status;

SELECT 
    indexname,
    tablename
FROM pg_indexes
WHERE tablename IN ('pedidos', 'pedido_historico')
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- 5. Verificar se os triggers existem
SELECT 
    '✅ Verificando triggers...' as status;

SELECT 
    trigger_name,
    event_manipulation,
    event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'pedidos'
ORDER BY trigger_name;

-- 6. Verificar se as funções existem
SELECT 
    '✅ Verificando funções...' as status;

SELECT 
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_name IN (
    'gerar_numero_pedido',
    'registrar_mudanca_status',
    'buscar_historico_pedido',
    'estatisticas_kanban'
)
ORDER BY routine_name;

-- 7. Testar a view vw_pedidos_kanban
SELECT 
    '✅ Testando view vw_pedidos_kanban...' as status;

SELECT 
    COUNT(*) as total_pedidos,
    status,
    COUNT(*) as qtd_por_status
FROM vw_pedidos_kanban
GROUP BY status
ORDER BY 
    CASE status
        WHEN 'pendente' THEN 1
        WHEN 'em_preparo' THEN 2
        WHEN 'saiu_entrega' THEN 3
        WHEN 'finalizado' THEN 4
        WHEN 'cancelado' THEN 5
    END;

-- 8. Verificar pedidos com número gerado
SELECT 
    '✅ Verificando números de pedidos...' as status;

SELECT 
    COUNT(*) as total_pedidos,
    COUNT(numero_pedido) as com_numero,
    COUNT(*) - COUNT(numero_pedido) as sem_numero
FROM pedidos;

-- 9. Testar função de estatísticas
SELECT 
    '✅ Testando função estatisticas_kanban()...' as status;

SELECT * FROM estatisticas_kanban();

-- 10. Verificar constraints
SELECT 
    '✅ Verificando constraints...' as status;

SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'pedidos'::regclass
AND conname IN ('check_status_valido', 'check_ordem_kanban')
ORDER BY conname;

-- 11. Resumo Final
SELECT 
    '📊 RESUMO FINAL' as info;

SELECT 
    'Total de Pedidos' as metrica,
    COUNT(*)::text as valor
FROM pedidos
UNION ALL
SELECT 
    'Pedidos com Número' as metrica,
    COUNT(numero_pedido)::text as valor
FROM pedidos
UNION ALL
SELECT 
    'Registros no Histórico' as metrica,
    COUNT(*)::text as valor
FROM pedido_historico
UNION ALL
SELECT 
    'Pedidos Pendentes' as metrica,
    COUNT(*)::text as valor
FROM pedidos
WHERE status = 'pendente'
UNION ALL
SELECT 
    'Pedidos em Preparo' as metrica,
    COUNT(*)::text as valor
FROM pedidos
WHERE status = 'em_preparo'
UNION ALL
SELECT 
    'Pedidos Finalizados' as metrica,
    COUNT(*)::text as valor
FROM pedidos
WHERE status = 'finalizado';

-- ============================================================================
-- RESULTADO ESPERADO
-- ============================================================================
-- ✅ Todos os campos devem existir
-- ✅ Tabela pedido_historico deve existir
-- ✅ View vw_pedidos_kanban deve existir
-- ✅ Índices devem estar criados
-- ✅ Triggers devem estar ativos
-- ✅ Funções devem existir
-- ✅ View deve retornar dados
-- ✅ Todos os pedidos devem ter número
-- ✅ Estatísticas devem funcionar
-- ============================================================================

SELECT '✅ VERIFICAÇÃO CONCLUÍDA!' as status;
