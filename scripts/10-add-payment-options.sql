-- Script para adicionar novas opções de pagamento: Pix e Ticket Alimentação
-- Execute este script no Supabase para adicionar as novas colunas à tabela pizzaria_config

-- Adicionar colunas para novas formas de pagamento
ALTER TABLE pizzaria_config 
ADD COLUMN IF NOT EXISTS aceita_pix boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS aceita_ticket_alimentacao boolean DEFAULT false;

-- Comentários para documentação
COMMENT ON COLUMN pizzaria_config.aceita_pix IS 'Define se a pizzaria aceita pagamento via PIX';
COMMENT ON COLUMN pizzaria_config.aceita_ticket_alimentacao IS 'Define se a pizzaria aceita pagamento via Ticket Alimentação/Vale Refeição';

-- Verificar se as colunas foram criadas corretamente
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'pizzaria_config' 
AND column_name IN ('aceita_pix', 'aceita_ticket_alimentacao')
ORDER BY column_name; 