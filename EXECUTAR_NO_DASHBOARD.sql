-- ============================================================================
-- EXECUTAR MANUALMENTE NO SUPABASE DASHBOARD
-- ============================================================================
-- Este script contém comandos que requerem permissões de superusuário
-- e devem ser executados diretamente no SQL Editor do Supabase Dashboard
-- ============================================================================

-- SOLUÇÃO ALTERNATIVA: Usar Database Webhooks do Supabase
-- Como não temos permissão para criar trigger em auth.users,
-- vamos usar uma abordagem diferente:

-- OPÇÃO 1: Trigger via Database Webhook (Recomendado para Supabase)
-- Vá em: Database > Database Webhooks > Create a new hook
-- Table: auth.users
-- Events: INSERT, UPDATE
-- HTTP Request: POST to Edge Function

-- OPÇÃO 2: Usar o hook nativo do Supabase Auth
-- O Supabase já tem um sistema de hooks para auth
-- Podemos usar isso via código

-- OPÇÃO 3: Criar trigger com permissões de superadmin
-- Se você tem acesso ao superadmin do Supabase, execute:

-- Primeiro, conceder permissões (apenas superadmin pode fazer)
-- GRANT USAGE ON SCHEMA auth TO postgres;
-- GRANT ALL ON auth.users TO postgres;

-- Depois criar o trigger
DROP TRIGGER IF EXISTS trg_sync_auth_user ON auth.users;

CREATE TRIGGER trg_sync_auth_user
    AFTER INSERT OR UPDATE OF email, email_confirmed_at, raw_user_meta_data
    ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_auth_user_to_cliente();

-- Verificar se foi criado
SELECT 
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    tgenabled as enabled
FROM pg_trigger 
WHERE tgname = 'trg_sync_auth_user';

-- Resultado esperado:
-- trigger_name: trg_sync_auth_user
-- table_name: auth.users
-- enabled: O (Origin = habilitado)

-- ============================================================================
-- SE O ERRO PERSISTIR, USE ESTA SOLUÇÃO ALTERNATIVA:
-- ============================================================================
-- Sincronizar manualmente via código (já implementado no app/perfil/page.tsx)
-- O fallback no código garante que funcione mesmo sem o trigger
