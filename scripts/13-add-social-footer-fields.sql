-- Script para adicionar campos de redes sociais no rodapé
-- Execute este script no Supabase para adicionar as novas colunas à tabela pizzaria_config

-- Adicionar colunas para links das redes sociais
ALTER TABLE pizzaria_config 
ADD COLUMN IF NOT EXISTS whatsapp_ativo boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS whatsapp_link text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS instagram_ativo boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS instagram_link text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS facebook_ativo boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS facebook_link text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS maps_ativo boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS maps_link text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS compartilhar_ativo boolean DEFAULT true;

-- Comentários para documentação
COMMENT ON COLUMN pizzaria_config.whatsapp_ativo IS 'Define se o ícone do WhatsApp aparece no rodapé';
COMMENT ON COLUMN pizzaria_config.whatsapp_link IS 'Link do WhatsApp para o rodapé (pode ser diferente do WhatsApp de pedidos)';
COMMENT ON COLUMN pizzaria_config.instagram_ativo IS 'Define se o ícone do Instagram aparece no rodapé';
COMMENT ON COLUMN pizzaria_config.instagram_link IS 'Link do Instagram da pizzaria';
COMMENT ON COLUMN pizzaria_config.facebook_ativo IS 'Define se o ícone do Facebook aparece no rodapé';
COMMENT ON COLUMN pizzaria_config.facebook_link IS 'Link do Facebook da pizzaria';
COMMENT ON COLUMN pizzaria_config.maps_ativo IS 'Define se o ícone do Google Maps aparece no rodapé';
COMMENT ON COLUMN pizzaria_config.maps_link IS 'Link do Google Maps para localização da pizzaria';
COMMENT ON COLUMN pizzaria_config.compartilhar_ativo IS 'Define se o ícone de compartilhar aparece no rodapé';

-- Verificar se as colunas foram criadas corretamente
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'pizzaria_config' 
AND column_name IN ('whatsapp_ativo', 'whatsapp_link', 'instagram_ativo', 'instagram_link', 'facebook_ativo', 'facebook_link', 'maps_ativo', 'maps_link', 'compartilhar_ativo')
ORDER BY column_name; 