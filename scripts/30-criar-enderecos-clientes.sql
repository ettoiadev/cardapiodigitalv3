-- ============================================================================
-- SISTEMA DE MÚLTIPLOS ENDEREÇOS PARA CLIENTES
-- ============================================================================
-- Data: 19/10/2025
-- Objetivo: Permitir que clientes cadastrem múltiplos endereços (Casa, Trabalho, etc)
-- Similar ao sistema do iFood
-- ============================================================================

-- ============================================================================
-- 1. CRIAR TABELA DE ENDEREÇOS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.enderecos_clientes (
    -- Chave primária
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relacionamento com cliente
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    
    -- Identificação do endereço
    apelido TEXT NOT NULL, -- Ex: "Casa", "Trabalho", "Casa da Mãe"
    principal BOOLEAN DEFAULT false NOT NULL, -- Endereço principal/padrão
    
    -- Dados do endereço (via ViaCEP)
    cep TEXT NOT NULL,
    logradouro TEXT NOT NULL, -- Rua/Avenida
    numero TEXT NOT NULL,
    complemento TEXT,
    bairro TEXT NOT NULL,
    cidade TEXT NOT NULL,
    estado TEXT NOT NULL, -- UF (2 letras)
    
    -- Referência para entrega
    referencia TEXT, -- Ex: "Portão azul", "Próximo ao mercado"
    
    -- Timestamps
    criado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    atualizado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Constraints de validação
    CONSTRAINT enderecos_cep_valido CHECK (cep ~ '^\d{8}$'),
    CONSTRAINT enderecos_estado_valido CHECK (length(estado) = 2),
    CONSTRAINT enderecos_apelido_valido CHECK (length(trim(apelido)) >= 2),
    CONSTRAINT enderecos_numero_valido CHECK (length(trim(numero)) >= 1)
);

-- ============================================================================
-- 2. CRIAR ÍNDICES PARA PERFORMANCE
-- ============================================================================

-- Índice para buscar endereços de um cliente
CREATE INDEX idx_enderecos_cliente_id ON public.enderecos_clientes(cliente_id);

-- Índice para buscar endereço principal
CREATE INDEX idx_enderecos_principal ON public.enderecos_clientes(cliente_id, principal) 
WHERE principal = true;

-- Índice para buscar por CEP (útil para taxas de entrega)
CREATE INDEX idx_enderecos_cep ON public.enderecos_clientes(cep);

-- Índice para timestamps
CREATE INDEX idx_enderecos_criado_em ON public.enderecos_clientes(criado_em DESC);

-- ============================================================================
-- 3. CRIAR TRIGGER PARA ATUALIZAR TIMESTAMP
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_enderecos_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.atualizado_em = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_enderecos_updated_at
    BEFORE UPDATE ON public.enderecos_clientes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_enderecos_updated_at();

-- ============================================================================
-- 4. CRIAR FUNÇÃO PARA GARANTIR APENAS 1 ENDEREÇO PRINCIPAL
-- ============================================================================

CREATE OR REPLACE FUNCTION public.garantir_endereco_principal_unico()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Se está marcando como principal
    IF NEW.principal = true THEN
        -- Desmarcar todos os outros endereços deste cliente
        UPDATE public.enderecos_clientes
        SET principal = false
        WHERE cliente_id = NEW.cliente_id
          AND id != NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_endereco_principal_unico
    BEFORE INSERT OR UPDATE ON public.enderecos_clientes
    FOR EACH ROW
    EXECUTE FUNCTION public.garantir_endereco_principal_unico();

-- ============================================================================
-- 5. CRIAR FUNÇÃO PARA GARANTIR PELO MENOS 1 ENDEREÇO PRINCIPAL
-- ============================================================================

CREATE OR REPLACE FUNCTION public.garantir_primeiro_endereco_principal()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    -- Contar quantos endereços o cliente já tem
    SELECT COUNT(*) INTO v_count
    FROM public.enderecos_clientes
    WHERE cliente_id = NEW.cliente_id;
    
    -- Se for o primeiro endereço, forçar como principal
    IF v_count = 0 THEN
        NEW.principal = true;
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_primeiro_endereco_principal
    BEFORE INSERT ON public.enderecos_clientes
    FOR EACH ROW
    EXECUTE FUNCTION public.garantir_primeiro_endereco_principal();

-- ============================================================================
-- 6. HABILITAR ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.enderecos_clientes ENABLE ROW LEVEL SECURITY;

-- Policy: Cliente pode ver apenas seus próprios endereços
CREATE POLICY enderecos_select_own ON public.enderecos_clientes
    FOR SELECT
    USING (
        cliente_id = auth.uid()
    );

-- Policy: Cliente pode inserir apenas seus próprios endereços
CREATE POLICY enderecos_insert_own ON public.enderecos_clientes
    FOR INSERT
    WITH CHECK (
        cliente_id = auth.uid()
    );

-- Policy: Cliente pode atualizar apenas seus próprios endereços
CREATE POLICY enderecos_update_own ON public.enderecos_clientes
    FOR UPDATE
    USING (
        cliente_id = auth.uid()
    )
    WITH CHECK (
        cliente_id = auth.uid()
    );

-- Policy: Cliente pode deletar apenas seus próprios endereços
CREATE POLICY enderecos_delete_own ON public.enderecos_clientes
    FOR DELETE
    USING (
        cliente_id = auth.uid()
    );

-- Policy: Admin pode fazer tudo
CREATE POLICY enderecos_admin_all ON public.enderecos_clientes
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.admins
            WHERE id = auth.uid()
        )
    );

-- ============================================================================
-- 7. REMOVER CAMPOS DE ENDEREÇO DA TABELA CLIENTES (OPCIONAL)
-- ============================================================================
-- ATENÇÃO: Comente esta seção se quiser manter os campos antigos por compatibilidade

-- Fazer backup dos dados existentes antes de remover
DO $$
DECLARE
    v_cliente RECORD;
BEGIN
    -- Para cada cliente que tem endereço cadastrado
    FOR v_cliente IN 
        SELECT id, endereco_rua, endereco_numero, endereco_bairro, 
               endereco_cidade, endereco_estado, endereco_cep, 
               endereco_complemento, endereco_referencia
        FROM public.clientes
        WHERE endereco_rua IS NOT NULL
    LOOP
        -- Migrar para a nova tabela como endereço "Casa" (principal)
        INSERT INTO public.enderecos_clientes (
            cliente_id,
            apelido,
            principal,
            cep,
            logradouro,
            numero,
            complemento,
            bairro,
            cidade,
            estado,
            referencia
        )
        VALUES (
            v_cliente.id,
            'Casa',
            true,
            COALESCE(v_cliente.endereco_cep, '00000000'),
            COALESCE(v_cliente.endereco_rua, 'Não informado'),
            COALESCE(v_cliente.endereco_numero, 'S/N'),
            v_cliente.endereco_complemento,
            COALESCE(v_cliente.endereco_bairro, 'Não informado'),
            COALESCE(v_cliente.endereco_cidade, 'Não informado'),
            COALESCE(v_cliente.endereco_estado, 'SP'),
            v_cliente.endereco_referencia
        )
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    RAISE NOTICE '✅ Endereços migrados com sucesso!';
END;
$$;

-- Agora pode remover as colunas antigas (CUIDADO: irreversível!)
-- Descomente apenas se tiver certeza:
/*
ALTER TABLE public.clientes 
    DROP COLUMN IF EXISTS endereco_rua,
    DROP COLUMN IF EXISTS endereco_numero,
    DROP COLUMN IF EXISTS endereco_bairro,
    DROP COLUMN IF EXISTS endereco_cidade,
    DROP COLUMN IF EXISTS endereco_estado,
    DROP COLUMN IF EXISTS endereco_cep,
    DROP COLUMN IF EXISTS endereco_complemento,
    DROP COLUMN IF EXISTS endereco_referencia;
*/

-- ============================================================================
-- 8. VALIDAÇÃO E ESTATÍSTICAS
-- ============================================================================

-- Verificar estrutura criada
DO $$
DECLARE
    v_table_exists BOOLEAN;
    v_indexes_count INTEGER;
    v_policies_count INTEGER;
    v_triggers_count INTEGER;
BEGIN
    -- Verificar se tabela existe
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'enderecos_clientes'
    ) INTO v_table_exists;
    
    -- Contar índices
    SELECT COUNT(*) INTO v_indexes_count
    FROM pg_indexes
    WHERE tablename = 'enderecos_clientes';
    
    -- Contar policies
    SELECT COUNT(*) INTO v_policies_count
    FROM pg_policies
    WHERE tablename = 'enderecos_clientes';
    
    -- Contar triggers
    SELECT COUNT(*) INTO v_triggers_count
    FROM pg_trigger
    WHERE tgrelid = 'public.enderecos_clientes'::regclass
    AND tgisinternal = false;
    
    -- Exibir resultados
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ VALIDAÇÃO DA ESTRUTURA';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Tabela existe: %', v_table_exists;
    RAISE NOTICE 'Índices criados: %', v_indexes_count;
    RAISE NOTICE 'RLS Policies: %', v_policies_count;
    RAISE NOTICE 'Triggers: %', v_triggers_count;
    RAISE NOTICE '========================================';
    
    IF v_table_exists AND v_indexes_count >= 4 AND v_policies_count >= 5 THEN
        RAISE NOTICE '🎉 ESTRUTURA CRIADA COM SUCESSO!';
    ELSE
        RAISE WARNING '⚠️  Verifique se todos os componentes foram criados';
    END IF;
END;
$$;

-- Mostrar estatísticas
SELECT 
    'Endereços cadastrados' as metrica,
    COUNT(*) as total
FROM public.enderecos_clientes
UNION ALL
SELECT 
    'Clientes com endereço',
    COUNT(DISTINCT cliente_id)
FROM public.enderecos_clientes
UNION ALL
SELECT 
    'Endereços principais',
    COUNT(*)
FROM public.enderecos_clientes
WHERE principal = true;

-- ============================================================================
-- FIM DO SCRIPT
-- ============================================================================
-- Execute este script no SQL Editor do Supabase Dashboard
-- ============================================================================
