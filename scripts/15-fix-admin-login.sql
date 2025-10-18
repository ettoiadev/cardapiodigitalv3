-- Script para corrigir o login do administrador
-- Este script cria o usuário admin com senha em texto simples para o sistema atual
-- ⚠️ IMPORTANTE: Em produção, implementar hash de senha seguro

-- Primeiro, verificar se a tabela admins existe
CREATE TABLE IF NOT EXISTS admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  senha VARCHAR(255) NOT NULL,
  nome VARCHAR(255) NOT NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Remover usuário existente se houver (para recriar com senha correta)
DELETE FROM admins WHERE email = 'admin@pizzaria.com';

-- Inserir admin com senha em texto simples (temporário para desenvolvimento)
-- Email: admin@pizzaria.com
-- Senha: admin123
INSERT INTO admins (email, senha, nome, ativo) 
VALUES (
  'admin@pizzaria.com',
  'admin123',  -- Senha em texto simples para o sistema atual
  'Administrador William Disk Pizza',
  true
);

-- Verificar se o usuário foi criado corretamente
SELECT 
  id,
  email,
  nome,
  ativo,
  created_at,
  LENGTH(senha) as senha_length
FROM admins 
WHERE email = 'admin@pizzaria.com';

-- Comentário para documentação
COMMENT ON TABLE admins IS 'Tabela de usuários administradores do sistema';
COMMENT ON COLUMN admins.senha IS '⚠️ TEMPORÁRIO: Senha em texto simples. Implementar hash em produção.';

-- Resultado esperado:
-- ✅ 1 linha inserida na tabela admins
-- ✅ Email: admin@pizzaria.com
-- ✅ Senha: admin123 (8 caracteres)
-- ✅ Ativo: true 