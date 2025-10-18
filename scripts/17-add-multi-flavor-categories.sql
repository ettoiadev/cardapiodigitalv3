-- Adicionar campo multi_sabores_habilitado à tabela categorias
-- Esta migração permite que categorias tenham comportamento de seleção múltipla de sabores como as pizzas

-- Adicionar coluna multi_sabores_habilitado à tabela categorias
ALTER TABLE categorias 
ADD COLUMN IF NOT EXISTS multi_sabores_habilitado BOOLEAN DEFAULT false;

-- Atualizar a categoria "Pizzas" existente para ter multi_sabores_habilitado = true
UPDATE categorias 
SET multi_sabores_habilitado = true 
WHERE nome = 'Pizzas';

-- Criar comentário para documentar o campo
COMMENT ON COLUMN categorias.multi_sabores_habilitado IS 'Define se a categoria permite seleção múltipla de sabores como as pizzas (accordion com opções 1, 2, 3 sabores)'; 