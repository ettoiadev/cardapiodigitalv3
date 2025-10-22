-- ============================================================================
-- CORREÇÃO CRÍTICA: Criar trigger handle_new_user
-- ============================================================================
-- Descrição: Sincroniza automaticamente novos usuários de auth.users para public.clientes
-- Data: 2025-01-22
-- Bug: Sistema de cadastro não estava criando registros em public.clientes
-- 
-- INSTRUÇÕES:
-- 1. Acesse o Supabase Dashboard: https://supabase.com/dashboard
-- 2. Selecione o projeto: cardapiodigitalv3
-- 3. Vá em: SQL Editor
-- 4. Cole este script completo
-- 5. Clique em "Run" ou pressione Ctrl+Enter
-- ============================================================================

-- 1. Criar a função que será executada pelo trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Inserir novo cliente na tabela public.clientes
  INSERT INTO public.clientes (
    id,
    email,
    nome,
    telefone,
    email_verificado,
    telefone_verificado,
    ativo,
    criado_em,
    atualizado_em,
    ultimo_acesso
  ) VALUES (
    NEW.id,
    NEW.email,
    -- Extrair nome do metadata ou usar parte do email como fallback
    COALESCE(
      NEW.raw_user_meta_data->>'nome',
      SPLIT_PART(NEW.email, '@', 1)
    ),
    -- Extrair telefone do metadata ou usar placeholder
    COALESCE(
      NEW.raw_user_meta_data->>'telefone',
      '00000000000'
    ),
    -- Email verificado se existe email_confirmed_at
    (NEW.email_confirmed_at IS NOT NULL),
    false, -- telefone_verificado (padrão false)
    true,  -- ativo (padrão true)
    NEW.created_at,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING; -- Evitar erro se já existir
  
  RETURN NEW;
END;
$$;

-- 2. Adicionar comentário na função
COMMENT ON FUNCTION public.handle_new_user() IS 
'Trigger function que sincroniza novos usuários de auth.users para public.clientes automaticamente';

-- 3. Criar o trigger em auth.users (requer permissões de superuser)
-- NOTA: Este comando só funciona no SQL Editor do Supabase Dashboard
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4. Adicionar comentário no trigger
COMMENT ON TRIGGER on_auth_user_created ON auth.users IS 
'Trigger que executa handle_new_user() após inserção de novo usuário';

-- 5. Verificar se existem usuários em auth.users sem registro em clientes
-- e sincronizá-los (correção retroativa)
INSERT INTO public.clientes (
  id,
  email,
  nome,
  telefone,
  email_verificado,
  telefone_verificado,
  ativo,
  criado_em,
  atualizado_em,
  ultimo_acesso
)
SELECT 
  au.id,
  au.email,
  COALESCE(
    au.raw_user_meta_data->>'nome',
    SPLIT_PART(au.email, '@', 1)
  ) as nome,
  COALESCE(
    au.raw_user_meta_data->>'telefone',
    '00000000000'
  ) as telefone,
  (au.email_confirmed_at IS NOT NULL) as email_verificado,
  false as telefone_verificado,
  true as ativo,
  au.created_at as criado_em,
  NOW() as atualizado_em,
  NOW() as ultimo_acesso
FROM auth.users au
LEFT JOIN public.clientes c ON c.id = au.id
WHERE c.id IS NULL; -- Apenas usuários que não existem em clientes

-- 6. Verificação final
DO $$
DECLARE
  usuarios_sincronizados INTEGER;
  usuarios_auth INTEGER;
BEGIN
  SELECT COUNT(*) INTO usuarios_auth FROM auth.users;
  SELECT COUNT(*) INTO usuarios_sincronizados FROM public.clientes;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Script executado com sucesso!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Usuários em auth.users: %', usuarios_auth;
  RAISE NOTICE 'Usuários em public.clientes: %', usuarios_sincronizados;
  RAISE NOTICE '========================================';
  
  IF usuarios_auth = usuarios_sincronizados THEN
    RAISE NOTICE '✅ Todos os usuários estão sincronizados!';
  ELSE
    RAISE WARNING '⚠️  Diferença encontrada. Verifique manualmente.';
  END IF;
END $$;

-- ============================================================================
-- FIM DO SCRIPT
-- ============================================================================
