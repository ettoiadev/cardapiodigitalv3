-- Script para criar tabela de bordas recheadas

-- Tabela de bordas recheadas
CREATE TABLE IF NOT EXISTS bordas_recheadas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  preco DECIMAL(10,2) NOT NULL,
  ativo BOOLEAN DEFAULT true,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir alguns exemplos de bordas recheadas
INSERT INTO bordas_recheadas (nome, preco, ordem, ativo) VALUES 
('Catupiry', 8.00, 1, true),
('Cheddar', 7.00, 2, true),
('Cream Cheese', 9.00, 3, true),
('Chocolate', 10.00, 4, true)
ON CONFLICT DO NOTHING;

-- Comentário para documentação
COMMENT ON TABLE bordas_recheadas IS 'Tabela para armazenar opções de bordas recheadas disponíveis';
COMMENT ON COLUMN bordas_recheadas.nome IS 'Nome da borda recheada';
COMMENT ON COLUMN bordas_recheadas.preco IS 'Preço adicional da borda recheada';
COMMENT ON COLUMN bordas_recheadas.ativo IS 'Se a borda está disponível para seleção';
COMMENT ON COLUMN bordas_recheadas.ordem IS 'Ordem de exibição da borda no frontend'; 