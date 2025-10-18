-- Script para corrigir configuração de Pizza Broto na tabela pizzaria_config existente
-- A tabela pizzaria_config já existe no Supabase com ID do tipo UUID

-- Adicionar coluna habilitar_broto se não existir
ALTER TABLE pizzaria_config 
ADD COLUMN IF NOT EXISTS habilitar_broto BOOLEAN DEFAULT TRUE;

-- Atualizar registros existentes para garantir que tenham o valor padrão
UPDATE pizzaria_config 
SET habilitar_broto = TRUE 
WHERE habilitar_broto IS NULL;

-- Garantir que existe pelo menos um registro de configuração
INSERT INTO pizzaria_config (habilitar_broto)
SELECT TRUE
WHERE NOT EXISTS (SELECT 1 FROM pizzaria_config LIMIT 1);

-- Comentário para documentação
COMMENT ON COLUMN pizzaria_config.habilitar_broto IS 'Define se a opção de Pizza Broto está habilitada para toda a pizzaria'; 