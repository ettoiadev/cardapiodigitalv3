-- ============================================================================
-- SOLUÇÃO ALTERNATIVA: Sincronização Manual de Usuários
-- ============================================================================
-- Descrição: Como não podemos criar triggers em auth.users, vamos:
--            1. Criar função para sincronizar manualmente
--            2. Sincronizar usuários existentes
--            3. Modificar o código frontend para chamar a função após cadastro
-- Data: 2025-01-22
-- ============================================================================

-- ============================================================================
-- PARTE 1: Criar função de sincronização manual
-- ============================================================================

CREATE OR REPLACE FUNCTION public.sync_user_to_cliente(
  user_id UUID,
  user_email TEXT,
  user_name TEXT DEFAULT NULL,
  user_phone TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
  cliente_existente BOOLEAN;
BEGIN
  -- Verificar se cliente já existe
  SELECT EXISTS(
    SELECT 1 FROM public.clientes WHERE id = user_id
  ) INTO cliente_existente;
  
  IF cliente_existente THEN
    -- Atualizar cliente existente
    UPDATE public.clientes
    SET 
      email = user_email,
      nome = COALESCE(user_name, nome),
      telefone = COALESCE(user_phone, telefone),
      atualizado_em = NOW(),
      ultimo_acesso = NOW()
    WHERE id = user_id;
    
    result := jsonb_build_object(
      'success', true,
      'action', 'updated',
      'message', 'Cliente atualizado com sucesso'
    );
  ELSE
    -- Criar novo cliente
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
      user_id,
      user_email,
      COALESCE(user_name, SPLIT_PART(user_email, '@', 1)),
      COALESCE(user_phone, '00000000000'),
      false,
      false,
      true,
      NOW(),
      NOW(),
      NOW()
    );
    
    result := jsonb_build_object(
      'success', true,
      'action', 'created',
      'message', 'Cliente criado com sucesso'
    );
  END IF;
  
  RETURN result;
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'message', 'Erro ao sincronizar cliente'
  );
END;
$$;

COMMENT ON FUNCTION public.sync_user_to_cliente IS 
'Sincroniza usuário do Supabase Auth para a tabela clientes (chamada manual)';

-- ============================================================================
-- PARTE 2: Sincronizar todos os usuários existentes
-- ============================================================================

DO $$
DECLARE
  user_record RECORD;
  sync_result JSONB;
  total_users INTEGER := 0;
  total_synced INTEGER := 0;
  total_errors INTEGER := 0;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'SINCRONIZANDO USUÁRIOS EXISTENTES';
  RAISE NOTICE '========================================';
  
  -- Contar total de usuários
  SELECT COUNT(*) INTO total_users FROM auth.users;
  RAISE NOTICE 'Total de usuários em auth.users: %', total_users;
  
  -- Sincronizar cada usuário
  FOR user_record IN 
    SELECT 
      id,
      email,
      raw_user_meta_data->>'nome' as nome,
      raw_user_meta_data->>'telefone' as telefone
    FROM auth.users
  LOOP
    BEGIN
      sync_result := public.sync_user_to_cliente(
        user_record.id,
        user_record.email,
        user_record.nome,
        user_record.telefone
      );
      
      IF (sync_result->>'success')::boolean THEN
        total_synced := total_synced + 1;
        RAISE NOTICE '✅ Sincronizado: % (%) - %', 
          user_record.email, 
          sync_result->>'action',
          sync_result->>'message';
      ELSE
        total_errors := total_errors + 1;
        RAISE WARNING '❌ Erro: % - %', 
          user_record.email, 
          sync_result->>'error';
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      total_errors := total_errors + 1;
      RAISE WARNING '❌ Erro ao processar %: %', user_record.email, SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ SINCRONIZAÇÃO CONCLUÍDA!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total processado: %', total_users;
  RAISE NOTICE 'Sincronizados com sucesso: %', total_synced;
  RAISE NOTICE 'Erros: %', total_errors;
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- PARTE 3: Verificação final
-- ============================================================================

SELECT 
  'auth.users' as tabela,
  COUNT(*) as total
FROM auth.users
UNION ALL
SELECT 
  'public.clientes' as tabela,
  COUNT(*) as total
FROM public.clientes
ORDER BY tabela;

-- ============================================================================
-- PARTE 4: Criar política RLS para permitir chamada da função
-- ============================================================================

-- Permitir que usuários autenticados chamem a função de sincronização
GRANT EXECUTE ON FUNCTION public.sync_user_to_cliente TO authenticated;

-- ============================================================================
-- FIM DO SCRIPT
-- ============================================================================

-- ============================================================================
-- PRÓXIMOS PASSOS (IMPORTANTE!)
-- ============================================================================
-- 
-- Agora você precisa modificar o código frontend para chamar esta função
-- após o cadastro de um novo usuário. Vou fazer isso automaticamente.
-- 
-- A função será chamada em: lib/auth.ts na função signUp()
-- ============================================================================
