-- ============================================================================
-- SCRIPT: 26-remove-taxa-unica-fields.sql
-- Descrição: Remove campos de taxa única da tabela pizzaria_config
-- Data: 2025-01-18
-- Versão: 1.0
-- ============================================================================
-- 
-- Este script remove os campos obsoletos taxa_entrega e valor_minimo
-- da tabela pizzaria_config, consolidando o uso do sistema de taxas
-- por bairro/CEP implementado na tabela taxas_entrega.
--
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. BACKUP DOS VALORES ATUAIS
-- ============================================================================

-- Criar tabela de backup (para rollback se necessário)
CREATE TABLE IF NOT EXISTS pizzaria_config_backup_taxa AS
SELECT 
    id, 
    taxa_entrega, 
    valor_minimo, 
    updated_at,
    NOW() as backup_created_at
FROM pizzaria_config;

-- Verificar backup
DO $$
DECLARE
    backup_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO backup_count FROM pizzaria_config_backup_taxa;
    
    IF backup_count = 0 THEN
        RAISE EXCEPTION 'Falha ao criar backup!';
    ELSE
        RAISE NOTICE '✅ Backup criado: % registros', backup_count;
    END IF;
END $$;

-- ============================================================================
-- 2. REMOVER COLUNAS OBSOLETAS
-- ============================================================================

-- Remover coluna taxa_entrega
ALTER TABLE pizzaria_config 
DROP COLUMN IF EXISTS taxa_entrega;

RAISE NOTICE '✅ Coluna taxa_entrega removida';

-- Remover coluna valor_minimo
ALTER TABLE pizzaria_config 
DROP COLUMN IF EXISTS valor_minimo;

RAISE NOTICE '✅ Coluna valor_minimo removida';

-- ============================================================================
-- 3. VERIFICAR REMOÇÃO
-- ============================================================================

DO $$
DECLARE
    taxa_exists BOOLEAN;
    valor_exists BOOLEAN;
BEGIN
    -- Verificar se taxa_entrega foi removida
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pizzaria_config' 
        AND column_name = 'taxa_entrega'
    ) INTO taxa_exists;
    
    -- Verificar se valor_minimo foi removida
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pizzaria_config' 
        AND column_name = 'valor_minimo'
    ) INTO valor_exists;
    
    IF taxa_exists OR valor_exists THEN
        RAISE EXCEPTION 'Falha ao remover colunas! taxa_entrega: %, valor_minimo: %', 
            taxa_exists, valor_exists;
    ELSE
        RAISE NOTICE '✅ Verificação: Colunas removidas com sucesso!';
    END IF;
END $$;

COMMIT;

-- ============================================================================
-- 4. VERIFICAÇÃO PÓS-MIGRAÇÃO
-- ============================================================================

-- Listar colunas restantes
SELECT 
    '📊 ESTRUTURA ATUAL DA TABELA pizzaria_config' as info;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'pizzaria_config'
ORDER BY ordinal_position;

-- Verificar backup
SELECT 
    '💾 BACKUP CRIADO' as info;

SELECT 
    id,
    taxa_entrega as taxa_antiga,
    valor_minimo as valor_minimo_antigo,
    backup_created_at
FROM pizzaria_config_backup_taxa;

-- Verificar taxas cadastradas
SELECT 
    '✅ TAXAS DE ENTREGA ATIVAS' as info;

SELECT 
    bairro,
    taxa,
    tempo_estimado_min,
    tempo_estimado_max,
    ativo
FROM taxas_entrega
WHERE ativo = true
ORDER BY bairro;

-- ============================================================================
-- ROLLBACK (APENAS SE NECESSÁRIO)
-- ============================================================================
-- 
-- ATENÇÃO: Execute apenas se precisar reverter a migração!
-- 
-- BEGIN;
-- 
-- -- Recriar colunas
-- ALTER TABLE pizzaria_config ADD COLUMN taxa_entrega NUMERIC;
-- ALTER TABLE pizzaria_config ADD COLUMN valor_minimo NUMERIC;
-- 
-- -- Restaurar valores do backup
-- UPDATE pizzaria_config pc
-- SET 
--     taxa_entrega = b.taxa_entrega,
--     valor_minimo = b.valor_minimo
-- FROM pizzaria_config_backup_taxa b
-- WHERE pc.id = b.id;
-- 
-- COMMIT;
-- 
-- ============================================================================

SELECT '✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO!' as status;
SELECT 'Sistema agora usa exclusivamente a tabela taxas_entrega' as mensagem;
