-- Criar tabela de administradores
CREATE TABLE IF NOT EXISTS admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  senha VARCHAR(255) NOT NULL,
  nome VARCHAR(255) NOT NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir admin padrão (senha: admin123)
INSERT INTO admins (email, senha, nome) 
VALUES ('admin@pizzaria.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrador')
ON CONFLICT (email) DO NOTHING;

-- Habilitar RLS nas tabelas principais
ALTER TABLE pizzaria_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedido_itens ENABLE ROW LEVEL SECURITY;

-- Políticas para leitura pública (cardápio)
CREATE POLICY "Public read pizzaria_config" ON pizzaria_config FOR SELECT USING (true);
CREATE POLICY "Public read categorias" ON categorias FOR SELECT USING (ativo = true);
CREATE POLICY "Public read produtos" ON produtos FOR SELECT USING (ativo = true);

-- Políticas para inserção de clientes e pedidos (público pode criar)
CREATE POLICY "Public insert clientes" ON clientes FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert pedidos" ON pedidos FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert pedido_itens" ON pedido_itens FOR INSERT WITH CHECK (true);

-- Políticas para admin (acesso total)
CREATE POLICY "Admin full access pizzaria_config" ON pizzaria_config FOR ALL USING (true);
CREATE POLICY "Admin full access categorias" ON categorias FOR ALL USING (true);
CREATE POLICY "Admin full access produtos" ON produtos FOR ALL USING (true);
CREATE POLICY "Admin read clientes" ON clientes FOR SELECT USING (true);
CREATE POLICY "Admin full access pedidos" ON pedidos FOR ALL USING (true);
CREATE POLICY "Admin read pedido_itens" ON pedido_itens FOR SELECT USING (true);
