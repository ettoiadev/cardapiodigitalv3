-- Script para remover completamente a funcionalidade de clientes
-- Execute este script no Supabase para limpar tabelas e referências não utilizadas

-- 1. Remover foreign key constraint entre pedidos e clientes (se existir)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'pedidos_cliente_id_fkey' 
        AND table_name = 'pedidos'
    ) THEN
        ALTER TABLE pedidos DROP CONSTRAINT pedidos_cliente_id_fkey;
        RAISE NOTICE 'Foreign key constraint pedidos_cliente_id_fkey removida.';
    ELSE
        RAISE NOTICE 'Foreign key constraint pedidos_cliente_id_fkey não encontrada.';
    END IF;
END $$;

-- 2. Remover coluna cliente_id da tabela pedidos
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pedidos' 
        AND column_name = 'cliente_id'
    ) THEN
        ALTER TABLE pedidos DROP COLUMN cliente_id;
        RAISE NOTICE 'Coluna cliente_id removida da tabela pedidos.';
    ELSE
        RAISE NOTICE 'Coluna cliente_id não encontrada na tabela pedidos.';
    END IF;
END $$;

-- 3. Remover políticas RLS relacionadas à tabela clientes
DO $$
BEGIN
    -- Remover políticas de clientes
    DROP POLICY IF EXISTS "Public insert clientes" ON clientes;
    DROP POLICY IF EXISTS "Admin read clientes" ON clientes;
    RAISE NOTICE 'Políticas RLS da tabela clientes removidas.';
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'Tabela clientes não encontrada - políticas já removidas.';
END $$;

-- 4. Remover a tabela clientes
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'clientes' 
        AND table_schema = 'public'
    ) THEN
        DROP TABLE clientes CASCADE;
        RAISE NOTICE 'Tabela clientes removida com sucesso.';
    ELSE
        RAISE NOTICE 'Tabela clientes não encontrada.';
    END IF;
END $$;

-- 5. Verificar limpeza
SELECT 
    'Verificação de limpeza:' as status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clientes') 
        THEN 'ERRO: Tabela clientes ainda existe'
        ELSE 'OK: Tabela clientes removida'
    END as tabela_clientes,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pedidos' AND column_name = 'cliente_id')
        THEN 'ERRO: Coluna cliente_id ainda existe em pedidos'
        ELSE 'OK: Coluna cliente_id removida de pedidos'
    END as coluna_cliente_id; 