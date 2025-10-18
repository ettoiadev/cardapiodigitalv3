-- Script para criar tabela de configurações da pizzaria
-- Permite controlar opções globais como habilitar/desabilitar Pizza Broto

-- Criar tabela de configurações
CREATE TABLE IF NOT EXISTS pizzaria_config (
  id SERIAL PRIMARY KEY,
  habilitar_broto BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir configuração padrão (se não existir)
INSERT INTO pizzaria_config (id, habilitar_broto)
VALUES (1, TRUE)
ON CONFLICT (id) DO NOTHING;

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at na tabela pizzaria_config
DROP TRIGGER IF EXISTS update_pizzaria_config_updated_at ON pizzaria_config;
CREATE TRIGGER update_pizzaria_config_updated_at
  BEFORE UPDATE ON pizzaria_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comentários para documentação
COMMENT ON TABLE pizzaria_config IS 'Configurações globais da pizzaria';
COMMENT ON COLUMN pizzaria_config.habilitar_broto IS 'Define se a opção de Pizza Broto está habilitada para toda a pizzaria'; 