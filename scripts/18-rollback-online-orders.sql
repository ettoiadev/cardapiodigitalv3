-- ============================================================================
-- ROLLBACK DA MIGRAÇÃO PARA SISTEMA DE PEDIDOS ONLINE
-- ============================================================================
-- Data: 18/10/2025
-- Descrição: Reverte as mudanças feitas pelo script 18-migrate-to-online-orders.sql
-- 
-- ⚠️ ATENÇÃO: Use este script apenas se precisar reverter a migração
-- ⚠️ Este script irá REMOVER dados e estruturas criadas
-- ============================================================================

-- ============================================================================
-- PARTE 1: REMOVER POLÍTICAS RLS
-- ============================================================================

DROP POLICY IF EXISTS "Clientes podem ver próprios dados" ON public.clientes;
DROP POLICY IF EXISTS "Clientes podem atualizar próprios dados" ON public.clientes;
DROP POLICY IF EXISTS "Permitir criar conta" ON public.clientes;
DROP POLICY IF EXISTS "Admin pode ver todos clientes" ON public.clientes;

DROP POLICY IF EXISTS "Clientes podem ver próprios pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "Clientes podem criar pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "Admin pode gerenciar todos pedidos" ON public.pedidos;

DROP POLICY IF EXISTS "Clientes podem ver itens próprios" ON public.pedido_itens;
DROP POLICY IF EXISTS "Clientes podem criar itens" ON public.pedido_itens;
DROP POLICY IF EXISTS "Admin pode gerenciar todos itens" ON public.pedido_itens;

-- ============================================================================
-- PARTE 2: REMOVER TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_clientes_updated_at ON public.clientes;
DROP TRIGGER IF EXISTS trigger_pedidos_updated_at ON public.pedidos;
DROP TRIGGER IF EXISTS trigger_taxas_updated_at ON public.taxas_entrega;
DROP TRIGGER IF EXISTS trigger_gerar_numero_pedido ON public.pedidos;
DROP TRIGGER IF EXISTS trigger_timestamps_pedido ON public.pedidos;

-- ============================================================================
-- PARTE 3: REMOVER FUNÇÕES
-- ============================================================================

DROP FUNCTION IF EXISTS public.gerar_numero_pedido();
DROP FUNCTION IF EXISTS public.buscar_taxa_entrega(VARCHAR, VARCHAR);
DROP FUNCTION IF EXISTS public.auto_gerar_numero_pedido();
DROP FUNCTION IF EXISTS public.atualizar_timestamps_pedido();

-- ============================================================================
-- PARTE 4: REMOVER CAMPOS DE PEDIDO_ITENS
-- ============================================================================

ALTER TABLE public.pedido_itens DROP COLUMN IF EXISTS adicionais;
ALTER TABLE public.pedido_itens DROP COLUMN IF EXISTS borda_recheada;
ALTER TABLE public.pedido_itens DROP COLUMN IF EXISTS observacoes;

-- ============================================================================
-- PARTE 5: REMOVER CAMPOS DE PEDIDOS
-- ============================================================================

-- Remover índices primeiro
DROP INDEX IF EXISTS public.idx_pedidos_cliente_id;
DROP INDEX IF EXISTS public.idx_pedidos_numero_pedido;
DROP INDEX IF EXISTS public.idx_pedidos_telefone_cliente;

-- Remover campos
ALTER TABLE public.pedidos DROP COLUMN IF EXISTS cliente_id;
ALTER TABLE public.pedidos DROP COLUMN IF EXISTS numero_pedido;
ALTER TABLE public.pedidos DROP COLUMN IF EXISTS nome_cliente;
ALTER TABLE public.pedidos DROP COLUMN IF EXISTS telefone_cliente;
ALTER TABLE public.pedidos DROP COLUMN IF EXISTS endereco_rua;
ALTER TABLE public.pedidos DROP COLUMN IF EXISTS endereco_numero;
ALTER TABLE public.pedidos DROP COLUMN IF EXISTS endereco_bairro;
ALTER TABLE public.pedidos DROP COLUMN IF EXISTS endereco_cidade;
ALTER TABLE public.pedidos DROP COLUMN IF EXISTS endereco_estado;
ALTER TABLE public.pedidos DROP COLUMN IF EXISTS endereco_cep;
ALTER TABLE public.pedidos DROP COLUMN IF EXISTS endereco_complemento;
ALTER TABLE public.pedidos DROP COLUMN IF EXISTS troco_para;
ALTER TABLE public.pedidos DROP COLUMN IF EXISTS desconto;
ALTER TABLE public.pedidos DROP COLUMN IF EXISTS updated_at;
ALTER TABLE public.pedidos DROP COLUMN IF EXISTS confirmado_em;
ALTER TABLE public.pedidos DROP COLUMN IF EXISTS finalizado_em;

-- ============================================================================
-- PARTE 6: REMOVER TABELA DE TAXAS DE ENTREGA
-- ============================================================================

DROP TABLE IF EXISTS public.taxas_entrega CASCADE;

-- ============================================================================
-- PARTE 7: REMOVER TABELA DE CLIENTES
-- ============================================================================

DROP TABLE IF EXISTS public.clientes CASCADE;

-- ============================================================================
-- PARTE 8: DESABILITAR RLS
-- ============================================================================

ALTER TABLE public.pedidos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedido_itens DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '=== VERIFICAÇÃO DE ROLLBACK ===';
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clientes') THEN
        RAISE NOTICE '✅ Tabela clientes removida';
    ELSE
        RAISE WARNING '❌ Tabela clientes ainda existe';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'taxas_entrega') THEN
        RAISE NOTICE '✅ Tabela taxas_entrega removida';
    ELSE
        RAISE WARNING '❌ Tabela taxas_entrega ainda existe';
    END IF;
    
    RAISE NOTICE '=== FIM DA VERIFICAÇÃO ===';
END $$;

-- ============================================================================
-- ROLLBACK CONCLUÍDO!
-- ============================================================================
