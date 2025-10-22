-- ============================================================================
-- OTIMIZAÇÃO: Adicionar Índices para Melhorar Performance
-- ============================================================================
-- Descrição: Cria índices estratégicos para otimizar queries frequentes
-- Data: 2025-01-22
-- Impacto: Melhora significativa de performance em queries de pedidos e Kanban
-- 
-- INSTRUÇÕES:
-- 1. Acesse o Supabase Dashboard: https://supabase.com/dashboard
-- 2. Selecione o projeto: cardapiodigitalv3
-- 3. Vá em: SQL Editor
-- 4. Cole este script completo
-- 5. Clique em "Run" ou pressione Ctrl+Enter
-- ============================================================================

-- ============================================================================
-- ANÁLISE PRÉVIA: Verificar índices existentes
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'ANÁLISE DE ÍNDICES EXISTENTES';
  RAISE NOTICE '========================================';
END $$;

-- Listar índices atuais na tabela pedidos
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename = 'pedidos'
ORDER BY indexname;

-- ============================================================================
-- ÍNDICE 1: Busca de Pedidos por Cliente (Ordenado por Data)
-- ============================================================================
-- Uso: Página "Meus Pedidos" - lista pedidos do cliente ordenados por data
-- Query otimizada: SELECT * FROM pedidos WHERE cliente_id = ? ORDER BY created_at DESC

CREATE INDEX IF NOT EXISTS idx_pedidos_cliente_created 
ON public.pedidos(cliente_id, created_at DESC)
WHERE cliente_id IS NOT NULL;

COMMENT ON INDEX idx_pedidos_cliente_created IS 
'Otimiza busca de pedidos por cliente ordenados por data (página Meus Pedidos)';

-- ============================================================================
-- ÍNDICE 2: Kanban - Pedidos por Status e Ordem
-- ============================================================================
-- Uso: Sistema Kanban - busca pedidos ativos por status e ordem
-- Query otimizada: SELECT * FROM vw_pedidos_kanban WHERE status = ? ORDER BY ordem_kanban

CREATE INDEX IF NOT EXISTS idx_pedidos_status_ordem 
ON public.pedidos(status, ordem_kanban)
WHERE status != 'cancelado';

COMMENT ON INDEX idx_pedidos_status_ordem IS 
'Otimiza queries do Kanban - busca por status excluindo cancelados';

-- ============================================================================
-- ÍNDICE 3: Busca de Taxa de Entrega por Faixa de CEP
-- ============================================================================
-- Uso: Checkout - cálculo de taxa de entrega por CEP
-- Query otimizada: SELECT * FROM taxas_entrega WHERE cep_inicial <= ? AND cep_final >= ?

CREATE INDEX IF NOT EXISTS idx_taxas_cep_range 
ON public.taxas_entrega(cep_inicial, cep_final)
WHERE ativo = true;

COMMENT ON INDEX idx_taxas_cep_range IS 
'Otimiza busca de taxa de entrega por faixa de CEP (checkout)';

-- ============================================================================
-- ÍNDICE 4: Busca de Itens por Pedido
-- ============================================================================
-- Uso: Detalhes do pedido - busca todos os itens de um pedido
-- Query otimizada: SELECT * FROM pedido_itens WHERE pedido_id = ?

CREATE INDEX IF NOT EXISTS idx_pedido_itens_pedido 
ON public.pedido_itens(pedido_id);

COMMENT ON INDEX idx_pedido_itens_pedido IS 
'Otimiza busca de itens por pedido (detalhes do pedido)';

-- ============================================================================
-- ÍNDICE 5: Busca de Endereços por Cliente
-- ============================================================================
-- Uso: Perfil - lista endereços do cliente
-- Query otimizada: SELECT * FROM enderecos_clientes WHERE cliente_id = ? ORDER BY principal DESC

CREATE INDEX IF NOT EXISTS idx_enderecos_cliente_principal 
ON public.enderecos_clientes(cliente_id, principal DESC);

COMMENT ON INDEX idx_enderecos_cliente_principal IS 
'Otimiza busca de endereços por cliente com principal primeiro (perfil)';

-- ============================================================================
-- ÍNDICE 6: Busca de Pedidos por Número
-- ============================================================================
-- Uso: Busca de pedido específico por número (ex: PED-20250122-000001)
-- Query otimizada: SELECT * FROM pedidos WHERE numero_pedido = ?

-- Verificar se já existe (deveria existir como UNIQUE)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'pedidos_numero_pedido_key'
  ) THEN
    CREATE UNIQUE INDEX idx_pedidos_numero_pedido 
    ON public.pedidos(numero_pedido);
    
    RAISE NOTICE '✅ Índice idx_pedidos_numero_pedido criado';
  ELSE
    RAISE NOTICE 'ℹ️  Índice de numero_pedido já existe (UNIQUE constraint)';
  END IF;
END $$;

-- ============================================================================
-- ÍNDICE 7: Busca de Produtos por Categoria
-- ============================================================================
-- Uso: Homepage - lista produtos por categoria
-- Query otimizada: SELECT * FROM produtos WHERE categoria_id = ? AND ativo = true ORDER BY ordem

CREATE INDEX IF NOT EXISTS idx_produtos_categoria_ativo 
ON public.produtos(categoria_id, ativo, ordem)
WHERE ativo = true;

COMMENT ON INDEX idx_produtos_categoria_ativo IS 
'Otimiza busca de produtos ativos por categoria ordenados (homepage)';

-- ============================================================================
-- ÍNDICE 8: Histórico de Status do Pedido
-- ============================================================================
-- Uso: Auditoria - busca histórico de mudanças de status
-- Query otimizada: SELECT * FROM pedido_historico WHERE pedido_id = ? ORDER BY criado_em DESC

CREATE INDEX IF NOT EXISTS idx_pedido_historico_pedido 
ON public.pedido_historico(pedido_id, criado_em DESC);

COMMENT ON INDEX idx_pedido_historico_pedido IS 
'Otimiza busca de histórico de status por pedido (auditoria)';

-- ============================================================================
-- ANÁLISE PÓS-CRIAÇÃO: Verificar índices criados
-- ============================================================================

DO $$
DECLARE
  total_indices INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_indices
  FROM pg_indexes
  WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%';
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ ÍNDICES CRIADOS COM SUCESSO!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total de índices otimizados: %', total_indices;
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 BENEFÍCIOS ESPERADOS:';
  RAISE NOTICE '- Busca de pedidos por cliente: 10-50x mais rápido';
  RAISE NOTICE '- Kanban: 5-20x mais rápido';
  RAISE NOTICE '- Cálculo de taxa de entrega: 3-10x mais rápido';
  RAISE NOTICE '- Detalhes do pedido: 5-15x mais rápido';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  IMPORTANTE:';
  RAISE NOTICE '- Índices ocupam espaço em disco';
  RAISE NOTICE '- INSERTs e UPDATEs ficam ~5-10% mais lentos';
  RAISE NOTICE '- Benefício compensa largamente em SELECTs';
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- VACUUM E ANALYZE: Atualizar estatísticas do banco
-- ============================================================================
-- Isso ajuda o PostgreSQL a escolher os melhores índices

VACUUM ANALYZE public.pedidos;
VACUUM ANALYZE public.pedido_itens;
VACUUM ANALYZE public.taxas_entrega;
VACUUM ANALYZE public.enderecos_clientes;
VACUUM ANALYZE public.produtos;
VACUUM ANALYZE public.pedido_historico;

-- ============================================================================
-- QUERY DE VERIFICAÇÃO: Testar uso dos índices
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'TESTE DE ÍNDICES';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Execute as queries abaixo para verificar se os índices estão sendo usados:';
  RAISE NOTICE '';
  RAISE NOTICE '1. Busca de pedidos por cliente:';
  RAISE NOTICE 'EXPLAIN ANALYZE SELECT * FROM pedidos WHERE cliente_id = ''<uuid>'' ORDER BY created_at DESC LIMIT 10;';
  RAISE NOTICE '';
  RAISE NOTICE '2. Kanban por status:';
  RAISE NOTICE 'EXPLAIN ANALYZE SELECT * FROM pedidos WHERE status = ''pendente'' ORDER BY ordem_kanban;';
  RAISE NOTICE '';
  RAISE NOTICE '3. Taxa de entrega por CEP:';
  RAISE NOTICE 'EXPLAIN ANALYZE SELECT * FROM taxas_entrega WHERE cep_inicial <= ''12345678'' AND cep_final >= ''12345678'' AND ativo = true;';
  RAISE NOTICE '';
  RAISE NOTICE 'Procure por "Index Scan" ou "Index Only Scan" no resultado.';
  RAISE NOTICE 'Se aparecer "Seq Scan", o índice não está sendo usado.';
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- FIM DO SCRIPT
-- ============================================================================
