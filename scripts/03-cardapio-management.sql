-- Script para criação das tabelas de gerenciamento de cardápio

-- Tabela de tamanhos de pizza
CREATE TABLE IF NOT EXISTS tamanhos_pizza (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(50) NOT NULL,
  fatias INTEGER NOT NULL,
  descricao TEXT,
  ordem INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de opções de sabores
CREATE TABLE IF NOT EXISTS opcoes_sabores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(50) NOT NULL,
  maximo_sabores INTEGER NOT NULL,
  descricao TEXT,
  ordem INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir dados iniciais de tamanhos
INSERT INTO tamanhos_pizza (nome, fatias, descricao, ordem) VALUES 
('Tradicional', 8, 'Pizza tradicional com 8 fatias', 1),
('Broto', 4, 'Pizza broto com 4 fatias', 2)
ON CONFLICT DO NOTHING;

-- Inserir dados iniciais de opções de sabores
INSERT INTO opcoes_sabores (nome, maximo_sabores, descricao, ordem) VALUES 
('1 Sabor', 1, 'Pizza com apenas um sabor', 1),
('2 Sabores', 2, 'Pizza dividida com dois sabores', 2),
('3 Sabores', 3, 'Pizza dividida com três sabores', 3)
ON CONFLICT DO NOTHING; 