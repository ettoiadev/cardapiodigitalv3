-- ============================================================================
-- SCRIPT: 23-add-max-quantity-config.sql
-- Descrição: Adiciona configuração de quantidade máxima por item
-- Data: 2025-01-18
-- Versão: 1.0
-- ============================================================================

BEGIN;

-- Adicionar campo na tabela pizzaria_config
ALTER TABLE pizzaria_config 
ADD COLUMN IF NOT EXISTS max_quantidade_por_item INTEGER DEFAULT 50;

COMMENT ON COLUMN pizzaria_config.max_quantidade_por_item IS 
'Quantidade máxima permitida por item no carrinho (padrão: 50)';

-- Adicionar constraint para validar valor
ALTER TABLE pizzaria_config 
DROP CONSTRAINT IF EXISTS check_max_quantidade_valida;

ALTER TABLE pizzaria_config 
ADD CONSTRAINT check_max_quantidade_valida 
CHECK (max_quantidade_por_item > 0 AND max_quantidade_por_item <= 1000);

-- Atualizar registro existente
UPDATE pizzaria_config 
SET max_quantidade_por_item = 50 
WHERE max_quantidade_por_item IS NULL;

COMMIT;

SELECT '✅ Configuração de quantidade máxima adicionada' as status;
SELECT 
    max_quantidade_por_item,
    'Atualize o frontend para usar este valor via ConfigContext' as proximos_passos
FROM pizzaria_config 
LIMIT 1;
