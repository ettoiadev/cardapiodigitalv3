-- ============================================================================
-- FIX: TRIGGER PARA CRIAR CLIENTE AUTOMATICAMENTE APÓS SIGNUP
-- ============================================================================
-- Data: 18/10/2025
-- Descrição: Cria trigger que sincroniza auth.users com public.clientes
--            Resolve problema de login bem-sucedido mas sem dados de cliente
-- 
-- PROBLEMA: Quando cliente faz cadastro, o Supabase Auth cria o usuário
--           mas não cria automaticamente o registro na tabela clientes
-- 
-- SOLUÇÃO: Trigger que monitora INSERT em auth.users e cria registro
--          correspondente em public.clientes
-- ============================================================================

-- ============================================================================
-- PARTE 1: CRIAR FUNÇÃO TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    nome_usuario TEXT;
    telefone_usuario TEXT;
BEGIN
    -- Extrair dados dos metadados do usuário
    nome_usuario := NEW.raw_user_meta_data->>'nome';
    telefone_usuario := NEW.raw_user_meta_data->>'telefone';
    
    -- Criar registro na tabela clientes
    INSERT INTO public.clientes (
        id,
        nome,
        email,
        telefone,
        ativo,
        email_verificado,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        COALESCE(nome_usuario, 'Cliente'),
        NEW.email,
        COALESCE(telefone_usuario, ''),
        true,
        NEW.email_confirmed_at IS NOT NULL,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        email_verificado = EXCLUDED.email_verificado,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user IS 'Trigger que cria registro em public.clientes quando usuário é criado no Supabase Auth';

-- ============================================================================
-- PARTE 2: CRIAR TRIGGER
-- ============================================================================

-- Remover trigger antigo se existir
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Criar novo trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

COMMENT ON TRIGGER on_auth_user_created ON auth.users IS 'Sincroniza auth.users com public.clientes';

-- ============================================================================
-- PARTE 3: MIGRAR USUÁRIOS EXISTENTES (se houver)
-- ============================================================================

-- Criar registros em clientes para usuários que já existem mas não têm registro
INSERT INTO public.clientes (
    id,
    nome,
    email,
    telefone,
    ativo,
    email_verificado,
    created_at,
    updated_at
)
SELECT 
    u.id,
    COALESCE(u.raw_user_meta_data->>'nome', 'Cliente'),
    u.email,
    COALESCE(u.raw_user_meta_data->>'telefone', ''),
    true,
    u.email_confirmed_at IS NOT NULL,
    u.created_at,
    NOW()
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM public.clientes c WHERE c.id = u.id
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- PARTE 4: VERIFICAÇÃO
-- ============================================================================

DO $$
DECLARE
    trigger_exists BOOLEAN;
    function_exists BOOLEAN;
    users_count INTEGER;
    clientes_count INTEGER;
BEGIN
    RAISE NOTICE '=== VERIFICAÇÃO DE CORREÇÃO DE AUTENTICAÇÃO ===';
    
    -- Verificar se função existe
    SELECT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'handle_new_user'
    ) INTO function_exists;
    
    IF function_exists THEN
        RAISE NOTICE '✅ Função handle_new_user criada com sucesso';
    ELSE
        RAISE WARNING '❌ Função handle_new_user não encontrada';
    END IF;
    
    -- Verificar se trigger existe
    SELECT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'on_auth_user_created'
    ) INTO trigger_exists;
    
    IF trigger_exists THEN
        RAISE NOTICE '✅ Trigger on_auth_user_created criado com sucesso';
    ELSE
        RAISE WARNING '❌ Trigger on_auth_user_created não encontrado';
    END IF;
    
    -- Verificar sincronização
    SELECT COUNT(*) INTO users_count FROM auth.users;
    SELECT COUNT(*) INTO clientes_count FROM public.clientes;
    
    RAISE NOTICE '📊 Usuários no auth.users: %', users_count;
    RAISE NOTICE '📊 Registros em clientes: %', clientes_count;
    
    IF users_count = clientes_count THEN
        RAISE NOTICE '✅ Todos os usuários têm registro em clientes';
    ELSE
        RAISE NOTICE '⚠️  Diferença detectada - verifique a migração';
    END IF;
    
    RAISE NOTICE '=== FIM DA VERIFICAÇÃO ===';
END $$;

-- ============================================================================
-- CORREÇÃO CONCLUÍDA!
-- ============================================================================
-- 
-- O QUE FOI FEITO:
-- ✅ Criada função handle_new_user() que extrai dados de auth.users
-- ✅ Criado trigger on_auth_user_created que executa após INSERT em auth.users
-- ✅ Migrados usuários existentes para tabela clientes
-- ✅ Verificação de integridade dos dados
--
-- COMO FUNCIONA:
-- 1. Cliente se cadastra via signUp() no frontend
-- 2. Supabase Auth cria registro em auth.users com metadata (nome, telefone)
-- 3. Trigger detecta INSERT e executa handle_new_user()
-- 4. Função cria registro correspondente em public.clientes
-- 5. Cliente pode acessar /perfil e /checkout normalmente
--
-- TESTANDO:
-- 1. Faça um novo cadastro na aplicação
-- 2. Verifique: SELECT * FROM public.clientes WHERE email = 'seu@email.com';
-- 3. Deve retornar 1 registro com id = auth.uid
--
-- ROLLBACK (se necessário):
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- DROP FUNCTION IF EXISTS public.handle_new_user();
--
-- ============================================================================
