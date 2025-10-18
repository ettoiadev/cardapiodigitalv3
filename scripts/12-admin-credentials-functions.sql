-- Funções SQL para gerenciamento de credenciais de admin
-- Execute este script no Supabase para criar as funções necessárias

-- 1. Função para verificar senha do admin
CREATE OR REPLACE FUNCTION verify_admin_password(admin_email text, password_input text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    stored_hash text;
BEGIN
    -- Buscar hash da senha armazenada
    SELECT senha INTO stored_hash
    FROM admins
    WHERE email = admin_email AND ativo = true;
    
    -- Se não encontrou admin, retornar false
    IF stored_hash IS NULL THEN
        RETURN false;
    END IF;
    
    -- Verificar senha usando crypt (bcrypt)
    RETURN crypt(password_input, stored_hash) = stored_hash;
END;
$$;

-- 2. Função para atualizar credenciais do admin
CREATE OR REPLACE FUNCTION update_admin_credentials(admin_id uuid, new_email text, new_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    password_hash text;
BEGIN
    -- Gerar hash da nova senha usando bcrypt
    password_hash := crypt(new_password, gen_salt('bf'));
    
    -- Atualizar email e senha
    UPDATE admins
    SET 
        email = new_email,
        senha = password_hash,
        updated_at = now()
    WHERE id = admin_id AND ativo = true;
    
    -- Verificar se a atualização foi bem-sucedida
    IF FOUND THEN
        RETURN true;
    ELSE
        RETURN false;
    END IF;
END;
$$;

-- 3. Adicionar coluna updated_at se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'admins' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE admins ADD COLUMN updated_at timestamp with time zone DEFAULT now();
        RAISE NOTICE 'Coluna updated_at adicionada à tabela admins.';
    ELSE
        RAISE NOTICE 'Coluna updated_at já existe na tabela admins.';
    END IF;
END $$;

-- 4. Comentários para documentação
COMMENT ON FUNCTION verify_admin_password(text, text) IS 'Verifica se a senha fornecida corresponde ao hash armazenado para o admin';
COMMENT ON FUNCTION update_admin_credentials(uuid, text, text) IS 'Atualiza email e senha do admin com hash seguro da nova senha';

-- 5. Verificar se as funções foram criadas
SELECT 
    'Funções criadas com sucesso:' as status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'verify_admin_password')
        THEN 'OK: verify_admin_password'
        ELSE 'ERRO: verify_admin_password não encontrada'
    END as verify_function,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_admin_credentials')
        THEN 'OK: update_admin_credentials'
        ELSE 'ERRO: update_admin_credentials não encontrada'
    END as update_function; 