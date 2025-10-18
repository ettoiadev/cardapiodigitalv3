-- Script para adicionar funcionalidade de adicionais aos produtos
-- Adiciona coluna JSONB para armazenar lista de adicionais

-- Adicionar coluna adicionais se não existir
ALTER TABLE produtos 
ADD COLUMN IF NOT EXISTS adicionais JSONB DEFAULT '[]'::jsonb;

-- Comentário para documentação
COMMENT ON COLUMN produtos.adicionais IS 'Lista de adicionais disponíveis para o produto em formato JSON [{"nome": "string", "preco": number}]';

-- Exemplo de estrutura de dados para adicionais:
-- [
--   {"nome": "Queijo Extra", "preco": 3.50},
--   {"nome": "Azeitona", "preco": 2.00},
--   {"nome": "Bacon", "preco": 5.00}
-- ] 