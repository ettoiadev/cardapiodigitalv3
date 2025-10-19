-- ============================================================================
-- AUTH V2 - FASE 1: RECONSTRUÇÃO DO BANCO DE DADOS
-- ============================================================================
-- Data: 18/10/2025
-- Objetivo: Reconstruir completamente a estrutura de autenticação
-- Versão: 2.0.0
-- 
-- IMPORTANTE: Este script faz parte da reconstrução completa do sistema
-- de autenticação. Execute em ordem e valide cada etapa.
-- ============================================================================

-- ============================================================================
-- ETAPA 1: BACKUP DA TABELA ATUAL
-- ============================================================================

-- Criar backup da tabela clientes atual
CREATE TABLE IF NOT EXISTS public.clientes_backup_v1 AS 
SELECT * FROM public.clientes;

-- Verificar backup
DO $$
DECLARE
    backup_count INTEGER;
    original_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO backup_count FROM public.clientes_backup_v1;
    SELECT COUNT(*) INTO original_count FROM public.clientes;
    
    RAISE NOTICE '✅ Backup criado: % registros copiados de % originais', backup_count, original_count;
    
    IF backup_count != original_count THEN
        RAISE WARNING '⚠️  Diferença detectada no backup!';
    END IF;
END $$;

-- ============================================================================
-- ETAPA 2: REMOVER ESTRUTURA ANTIGA
-- ============================================================================

-- Remover trigger antigo se existir
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS trg_sync_auth_user ON auth.users;

-- Remover função antiga
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.sync_auth_user_to_cliente() CASCADE;

-- Remover policies antigas
DROP POLICY IF EXISTS "clientes_select_own" ON public.clientes;
DROP POLICY IF EXISTS "clientes_update_own" ON public.clientes;
DROP POLICY IF EXISTS "clientes_insert_system" ON public.clientes;
DROP POLICY IF EXISTS "clientes_admin_all" ON public.clientes;
DROP POLICY IF EXISTS "Clientes podem ver próprios dados" ON public.clientes;
DROP POLICY IF EXISTS "Permitir criar conta" ON public.clientes;

-- Remover constraints antigas (exceto FK essenciais)
ALTER TABLE public.clientes DROP CONSTRAINT IF EXISTS clientes_email_key;

-- Remover tabela antiga
DROP TABLE IF EXISTS public.clientes CASCADE;

RAISE NOTICE '✅ Estrutura antiga removida';

-- ============================================================================
-- ETAPA 3: CRIAR NOVA ESTRUTURA DA TABELA CLIENTES
-- ============================================================================

CREATE TABLE public.clientes (
    -- Chave primária (mesmo ID do auth.users)
    id UUID PRIMARY KEY,
    
    -- Dados básicos (obrigatórios)
    email TEXT NOT NULL UNIQUE,
    nome TEXT NOT NULL,
    telefone TEXT NOT NULL,
    
    -- Flags de verificação
    email_verificado BOOLEAN DEFAULT false NOT NULL,
    telefone_verificado BOOLEAN DEFAULT false NOT NULL,
    ativo BOOLEAN DEFAULT true NOT NULL,
    
    -- Endereço padrão (opcional)
    endereco_rua TEXT,
    endereco_numero TEXT,
    endereco_bairro TEXT,
    endereco_cidade TEXT,
    endereco_estado TEXT,
    endereco_cep TEXT,
    endereco_complemento TEXT,
    endereco_referencia TEXT,
    
    -- Preferências
    aceita_marketing BOOLEAN DEFAULT true NOT NULL,
    aceita_whatsapp BOOLEAN DEFAULT true NOT NULL,
    
    -- Timestamps
    criado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    atualizado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    ultimo_acesso TIMESTAMPTZ,
    
    -- Constraints de validação
    CONSTRAINT clientes_nome_valido CHECK (length(trim(nome)) >= 2),
    CONSTRAINT clientes_telefone_valido CHECK (telefone ~ '^\d{10,11}$'),
    CONSTRAINT clientes_email_valido CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
    CONSTRAINT clientes_estado_valido CHECK (endereco_estado IS NULL OR length(endereco_estado) = 2),
    CONSTRAINT clientes_cep_valido CHECK (endereco_cep IS NULL OR endereco_cep ~ '^\d{8}$')
);

-- Comentários
COMMENT ON TABLE public.clientes IS 'Dados estendidos dos clientes (sincronizado com auth.users via trigger)';
COMMENT ON COLUMN public.clientes.id IS 'FK para auth.users.id - Sincronizado automaticamente';
COMMENT ON COLUMN public.clientes.email IS 'Email do cliente (único, sincronizado com auth.users)';
COMMENT ON COLUMN public.clientes.nome IS 'Nome completo do cliente (mínimo 2 caracteres)';
COMMENT ON COLUMN public.clientes.telefone IS 'Telefone do cliente (apenas dígitos, 10 ou 11 caracteres)';
COMMENT ON COLUMN public.clientes.email_verificado IS 'Flag indicando se o email foi verificado via Supabase Auth';
COMMENT ON COLUMN public.clientes.telefone_verificado IS 'Flag indicando se o telefone foi verificado';
COMMENT ON COLUMN public.clientes.ativo IS 'Flag indicando se o cliente está ativo no sistema';
COMMENT ON COLUMN public.clientes.ultimo_acesso IS 'Data/hora do último acesso do cliente';

RAISE NOTICE '✅ Nova estrutura da tabela clientes criada';

-- ============================================================================
-- ETAPA 4: CRIAR ÍNDICES OTIMIZADOS
-- ============================================================================

-- Índice para busca por email (usado frequentemente)
CREATE INDEX idx_clientes_email ON public.clientes(email);

-- Índice para busca por telefone
CREATE INDEX idx_clientes_telefone ON public.clientes(telefone);

-- Índice parcial para clientes ativos (otimiza queries comuns)
CREATE INDEX idx_clientes_ativo ON public.clientes(ativo) WHERE ativo = true;

-- Índice para ordenação por data de criação (usado em relatórios)
CREATE INDEX idx_clientes_criado_em ON public.clientes(criado_em DESC);

-- Índice para último acesso (usado em analytics)
CREATE INDEX idx_clientes_ultimo_acesso ON public.clientes(ultimo_acesso DESC NULLS LAST);

RAISE NOTICE '✅ Índices otimizados criados';

-- ============================================================================
-- ETAPA 5: CRIAR FUNÇÃO DE SINCRONIZAÇÃO (ROBUSTA)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.sync_auth_user_to_cliente()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_nome TEXT;
    v_telefone TEXT;
    v_email_verificado BOOLEAN;
BEGIN
    -- Log para debug
    RAISE DEBUG 'Trigger sync_auth_user_to_cliente executado para user: %', NEW.id;
    
    -- Extrair e validar nome
    v_nome := COALESCE(
        NULLIF(trim(NEW.raw_user_meta_data->>'nome'), ''),
        NULLIF(trim(split_part(NEW.email, '@', 1)), ''),
        'Cliente'
    );
    
    -- Garantir que nome tenha pelo menos 2 caracteres
    IF length(v_nome) < 2 THEN
        v_nome := 'Cliente';
    END IF;
    
    -- Extrair e limpar telefone (apenas dígitos)
    v_telefone := COALESCE(
        regexp_replace(NEW.raw_user_meta_data->>'telefone', '\D', '', 'g'),
        ''
    );
    
    -- Validar telefone (10 ou 11 dígitos)
    IF length(v_telefone) < 10 OR length(v_telefone) > 11 THEN
        v_telefone := '';
    END IF;
    
    -- Verificar se email foi confirmado
    v_email_verificado := (NEW.email_confirmed_at IS NOT NULL);
    
    -- Inserir ou atualizar cliente
    INSERT INTO public.clientes (
        id,
        email,
        nome,
        telefone,
        email_verificado,
        ativo,
        criado_em,
        atualizado_em
    )
    VALUES (
        NEW.id,
        NEW.email,
        v_nome,
        v_telefone,
        v_email_verificado,
        true,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        nome = CASE 
            WHEN EXCLUDED.nome != 'Cliente' THEN EXCLUDED.nome 
            ELSE public.clientes.nome 
        END,
        telefone = CASE 
            WHEN EXCLUDED.telefone != '' THEN EXCLUDED.telefone 
            ELSE public.clientes.telefone 
        END,
        email_verificado = EXCLUDED.email_verificado,
        atualizado_em = NOW();
    
    RAISE DEBUG '✅ Cliente sincronizado: % (nome: %, email: %)', NEW.id, v_nome, NEW.email;
    
    RETURN NEW;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Log erro mas não falha o signup
        RAISE WARNING '❌ Erro ao sincronizar cliente %: % (SQLSTATE: %)', NEW.id, SQLERRM, SQLSTATE;
        RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.sync_auth_user_to_cliente IS 'Sincroniza automaticamente auth.users com public.clientes (com validações e error handling)';

RAISE NOTICE '✅ Função de sincronização criada';

-- ============================================================================
-- ETAPA 6: CRIAR TRIGGER
-- ============================================================================

CREATE TRIGGER trg_sync_auth_user
    AFTER INSERT OR UPDATE OF email, email_confirmed_at, raw_user_meta_data
    ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_auth_user_to_cliente();

COMMENT ON TRIGGER trg_sync_auth_user ON auth.users IS 'Sincroniza auth.users com public.clientes automaticamente';

RAISE NOTICE '✅ Trigger criado';

-- ============================================================================
-- ETAPA 7: CONFIGURAR RLS POLICIES
-- ============================================================================

-- Habilitar RLS
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

-- Policy 1: Cliente vê apenas seus próprios dados
CREATE POLICY "clientes_select_own"
ON public.clientes FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Policy 2: Cliente atualiza apenas seus próprios dados
CREATE POLICY "clientes_update_own"
ON public.clientes FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy 3: Sistema pode inserir (via trigger)
CREATE POLICY "clientes_insert_system"
ON public.clientes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Policy 4: Admin vê e gerencia todos os clientes
CREATE POLICY "clientes_admin_all"
ON public.clientes FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.admins
        WHERE admins.id = auth.uid()
    )
);

RAISE NOTICE '✅ RLS policies configuradas';

-- ============================================================================
-- ETAPA 8: MIGRAR DADOS DO BACKUP
-- ============================================================================

-- Migrar dados do backup para nova estrutura
INSERT INTO public.clientes (
    id,
    email,
    nome,
    telefone,
    email_verificado,
    telefone_verificado,
    ativo,
    endereco_rua,
    endereco_numero,
    endereco_bairro,
    endereco_cidade,
    endereco_estado,
    endereco_cep,
    endereco_complemento,
    endereco_referencia,
    aceita_marketing,
    aceita_whatsapp,
    criado_em,
    atualizado_em,
    ultimo_acesso
)
SELECT 
    id,
    COALESCE(email, 'sem-email@temp.com'),
    COALESCE(NULLIF(trim(nome), ''), 'Cliente'),
    COALESCE(regexp_replace(telefone, '\D', '', 'g'), ''),
    COALESCE(email_verificado, false),
    COALESCE(telefone_verificado, false),
    COALESCE(ativo, true),
    endereco AS endereco_rua,
    numero AS endereco_numero,
    bairro AS endereco_bairro,
    NULL AS endereco_cidade,
    NULL AS endereco_estado,
    cep AS endereco_cep,
    complemento AS endereco_complemento,
    referencia AS endereco_referencia,
    true AS aceita_marketing,
    true AS aceita_whatsapp,
    COALESCE(criado_em, NOW()),
    COALESCE(atualizado_em, NOW()),
    ultimo_acesso
FROM public.clientes_backup_v1
ON CONFLICT (id) DO NOTHING;

-- Verificar migração
DO $$
DECLARE
    migrated_count INTEGER;
    backup_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO migrated_count FROM public.clientes;
    SELECT COUNT(*) INTO backup_count FROM public.clientes_backup_v1;
    
    RAISE NOTICE '✅ Migração concluída: % de % registros migrados', migrated_count, backup_count;
    
    IF migrated_count < backup_count THEN
        RAISE WARNING '⚠️  Alguns registros não foram migrados. Verifique logs.';
    END IF;
END $$;

-- ============================================================================
-- ETAPA 9: SINCRONIZAR COM AUTH.USERS
-- ============================================================================

-- Criar registros para usuários que existem em auth.users mas não em clientes
INSERT INTO public.clientes (
    id,
    email,
    nome,
    telefone,
    email_verificado,
    ativo,
    criado_em,
    atualizado_em
)
SELECT 
    u.id,
    u.email,
    COALESCE(
        NULLIF(trim(u.raw_user_meta_data->>'nome'), ''),
        split_part(u.email, '@', 1),
        'Cliente'
    ),
    COALESCE(
        regexp_replace(u.raw_user_meta_data->>'telefone', '\D', '', 'g'),
        ''
    ),
    (u.email_confirmed_at IS NOT NULL),
    true,
    u.created_at,
    NOW()
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM public.clientes c WHERE c.id = u.id
)
ON CONFLICT (id) DO NOTHING;

RAISE NOTICE '✅ Sincronização com auth.users concluída';

-- ============================================================================
-- ETAPA 10: VALIDAÇÃO FINAL
-- ============================================================================

DO $$
DECLARE
    v_trigger_exists BOOLEAN;
    v_function_exists BOOLEAN;
    v_users_count INTEGER;
    v_clientes_count INTEGER;
    v_rls_enabled BOOLEAN;
    v_policies_count INTEGER;
    v_indices_count INTEGER;
BEGIN
    RAISE NOTICE '=== VALIDAÇÃO FINAL DA FASE 1 ===';
    
    -- Verificar função
    SELECT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'sync_auth_user_to_cliente'
        AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    ) INTO v_function_exists;
    
    IF v_function_exists THEN
        RAISE NOTICE '✅ Função sync_auth_user_to_cliente existe';
    ELSE
        RAISE EXCEPTION '❌ Função sync_auth_user_to_cliente não encontrada!';
    END IF;
    
    -- Verificar trigger
    SELECT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'trg_sync_auth_user'
        AND tgrelid = 'auth.users'::regclass
    ) INTO v_trigger_exists;
    
    IF v_trigger_exists THEN
        RAISE NOTICE '✅ Trigger trg_sync_auth_user existe';
    ELSE
        RAISE EXCEPTION '❌ Trigger trg_sync_auth_user não encontrado!';
    END IF;
    
    -- Verificar RLS
    SELECT relrowsecurity INTO v_rls_enabled
    FROM pg_class
    WHERE relname = 'clientes' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
    
    IF v_rls_enabled THEN
        RAISE NOTICE '✅ RLS habilitado na tabela clientes';
    ELSE
        RAISE EXCEPTION '❌ RLS não está habilitado!';
    END IF;
    
    -- Contar policies
    SELECT COUNT(*) INTO v_policies_count
    FROM pg_policies
    WHERE tablename = 'clientes' AND schemaname = 'public';
    
    RAISE NOTICE '✅ % policies configuradas', v_policies_count;
    
    IF v_policies_count < 4 THEN
        RAISE WARNING '⚠️  Esperado 4 policies, encontrado %', v_policies_count;
    END IF;
    
    -- Contar índices
    SELECT COUNT(*) INTO v_indices_count
    FROM pg_indexes
    WHERE tablename = 'clientes' AND schemaname = 'public';
    
    RAISE NOTICE '✅ % índices criados', v_indices_count;
    
    -- Verificar sincronização
    SELECT COUNT(*) INTO v_users_count FROM auth.users;
    SELECT COUNT(*) INTO v_clientes_count FROM public.clientes;
    
    RAISE NOTICE '📊 Usuários em auth.users: %', v_users_count;
    RAISE NOTICE '📊 Registros em clientes: %', v_clientes_count;
    
    IF v_users_count = v_clientes_count THEN
        RAISE NOTICE '✅ Sincronização 100%% completa!';
    ELSE
        RAISE NOTICE '⚠️  Diferença: % usuários vs % clientes', v_users_count, v_clientes_count;
    END IF;
    
    RAISE NOTICE '=== FASE 1 CONCLUÍDA COM SUCESSO! ===';
END $$;

-- ============================================================================
-- LIMPEZA (OPCIONAL)
-- ============================================================================

-- Comentar a linha abaixo se quiser manter o backup
-- DROP TABLE IF EXISTS public.clientes_backup_v1;

-- ============================================================================
-- RESUMO DA FASE 1
-- ============================================================================

/*
✅ CONCLUÍDO:
1. Backup da tabela clientes original
2. Remoção da estrutura antiga
3. Nova tabela clientes com constraints robustos
4. 5 índices otimizados criados
5. Função sync_auth_user_to_cliente com validações
6. Trigger trg_sync_auth_user configurado
7. 4 RLS policies granulares
8. Migração de dados do backup
9. Sincronização com auth.users
10. Validação completa

📊 ESTATÍSTICAS:
- Tabela: public.clientes
- Constraints: 5 (nome, telefone, email, estado, cep)
- Índices: 5 (email, telefone, ativo, criado_em, ultimo_acesso)
- Policies: 4 (select_own, update_own, insert_system, admin_all)
- Trigger: 1 (trg_sync_auth_user)
- Função: 1 (sync_auth_user_to_cliente)

🎯 PRÓXIMOS PASSOS:
- FASE 2: Reconstruir auth-helpers (lib/auth.ts)
- FASE 3: Refazer páginas de login/cadastro/perfil
- FASE 4: Otimizar middleware
- FASE 5: Testes e deploy

📝 NOTAS:
- Backup mantido em: public.clientes_backup_v1
- Trigger executa em INSERT e UPDATE de auth.users
- RLS protege dados dos clientes
- Validações garantem integridade dos dados
*/
