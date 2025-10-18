-- Criar tabelas para o sistema de pizzaria

-- Tabela de configurações da pizzaria
CREATE TABLE IF NOT EXISTS pizzaria_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  foto_capa TEXT,
  foto_perfil TEXT,
  taxa_entrega DECIMAL(10,2) DEFAULT 0,
  tempo_entrega_min INTEGER DEFAULT 60,
  tempo_entrega_max INTEGER DEFAULT 90,
  valor_minimo DECIMAL(10,2) DEFAULT 20.00,
  aceita_dinheiro BOOLEAN DEFAULT true,
  aceita_cartao BOOLEAN DEFAULT true,
  endereco TEXT,
  telefone VARCHAR(20),
  whatsapp VARCHAR(20),
  horario_funcionamento JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de categorias
CREATE TABLE IF NOT EXISTS categorias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  ordem INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de produtos
CREATE TABLE IF NOT EXISTS produtos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  categoria_id UUID REFERENCES categorias(id),
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  preco_tradicional DECIMAL(10,2),
  preco_broto DECIMAL(10,2),
  tipo VARCHAR(50) DEFAULT 'salgada', -- salgada, doce, bebida
  ativo BOOLEAN DEFAULT true,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de usuários/clientes
CREATE TABLE IF NOT EXISTS clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  telefone VARCHAR(20),
  endereco TEXT,
  cep VARCHAR(10),
  cidade VARCHAR(100),
  estado VARCHAR(2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de pedidos
CREATE TABLE IF NOT EXISTS pedidos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID REFERENCES clientes(id),
  tipo_entrega VARCHAR(20) NOT NULL, -- delivery, balcao
  endereco_entrega TEXT,
  forma_pagamento VARCHAR(50),
  subtotal DECIMAL(10,2) NOT NULL,
  taxa_entrega DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'enviado', -- enviado, concluido
  observacoes TEXT,
  enviado_whatsapp BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de itens do pedido
CREATE TABLE IF NOT EXISTS pedido_itens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_id UUID REFERENCES pedidos(id) ON DELETE CASCADE,
  produto_id UUID REFERENCES produtos(id),
  nome_produto VARCHAR(255) NOT NULL,
  tamanho VARCHAR(20), -- tradicional, broto
  sabores JSONB, -- array de sabores para pizzas
  quantidade INTEGER NOT NULL DEFAULT 1,
  preco_unitario DECIMAL(10,2) NOT NULL,
  preco_total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir dados iniciais
INSERT INTO pizzaria_config (nome, taxa_entrega, tempo_entrega_min, tempo_entrega_max, valor_minimo, endereco, telefone, whatsapp) 
VALUES ('Pizzaria Bella Vista', 5.00, 60, 90, 20.00, 'Rua das Flores, 123 - Centro', '(11) 3333-4444', '5511999887766')
ON CONFLICT DO NOTHING;

INSERT INTO categorias (nome, descricao, ordem) VALUES 
('Pizzas', 'Pizzas doces e salgadas (Tradicional 8 fatias / Broto 4 fatias)', 1),
('Bebidas', 'Refrigerantes, sucos e águas', 2)
ON CONFLICT DO NOTHING;

-- Inserir algumas pizzas de exemplo
INSERT INTO produtos (categoria_id, nome, descricao, preco_tradicional, preco_broto, tipo, ordem) 
SELECT c.id, 'Margherita', 'Molho de tomate, mussarela e manjericão', 35.00, 25.00, 'salgada', 1
FROM categorias c WHERE c.nome = 'Pizzas'
ON CONFLICT DO NOTHING;

INSERT INTO produtos (categoria_id, nome, descricao, preco_tradicional, preco_broto, tipo, ordem) 
SELECT c.id, 'Pepperoni', 'Molho de tomate, mussarela e pepperoni', 42.00, 32.00, 'salgada', 2
FROM categorias c WHERE c.nome = 'Pizzas'
ON CONFLICT DO NOTHING;

INSERT INTO produtos (categoria_id, nome, descricao, preco_tradicional, preco_broto, tipo, ordem) 
SELECT c.id, 'Portuguesa', 'Molho de tomate, mussarela, presunto, ovos, cebola e azeitona', 45.00, 35.00, 'salgada', 3
FROM categorias c WHERE c.nome = 'Pizzas'
ON CONFLICT DO NOTHING;

INSERT INTO produtos (categoria_id, nome, descricao, preco_tradicional, preco_broto, tipo, ordem) 
SELECT c.id, 'Chocolate', 'Chocolate ao leite derretido', 38.00, 28.00, 'doce', 4
FROM categorias c WHERE c.nome = 'Pizzas'
ON CONFLICT DO NOTHING;

INSERT INTO produtos (categoria_id, nome, descricao, preco_tradicional, preco_broto, tipo, ordem) 
SELECT c.id, 'Brigadeiro', 'Chocolate, granulado e leite condensado', 40.00, 30.00, 'doce', 5
FROM categorias c WHERE c.nome = 'Pizzas'
ON CONFLICT DO NOTHING;

-- Inserir algumas bebidas
INSERT INTO produtos (categoria_id, nome, descricao, preco_tradicional, preco_broto, tipo, ordem) 
SELECT c.id, 'Coca-Cola 2L', 'Refrigerante Coca-Cola 2 litros', 8.00, NULL, 'bebida', 1
FROM categorias c WHERE c.nome = 'Bebidas'
ON CONFLICT DO NOTHING;

INSERT INTO produtos (categoria_id, nome, descricao, preco_tradicional, preco_broto, tipo, ordem) 
SELECT c.id, 'Guaraná Antarctica 2L', 'Refrigerante Guaraná Antarctica 2 litros', 7.50, NULL, 'bebida', 2
FROM categorias c WHERE c.nome = 'Bebidas'
ON CONFLICT DO NOTHING;

INSERT INTO produtos (categoria_id, nome, descricao, preco_tradicional, preco_broto, tipo, ordem) 
SELECT c.id, 'Água Mineral 500ml', 'Água mineral sem gás', 3.00, NULL, 'bebida', 3
FROM categorias c WHERE c.nome = 'Bebidas'
ON CONFLICT DO NOTHING;
