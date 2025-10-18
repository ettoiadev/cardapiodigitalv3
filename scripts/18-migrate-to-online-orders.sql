-- ============================================================================
-- MIGRAÇÃO PARA SISTEMA DE PEDIDOS ONLINE
-- ============================================================================
-- Data: 18/10/2025
-- Descrição: Prepara o banco de dados para receber pedidos online com
--            autenticação de clientes, substituindo o sistema de WhatsApp
-- 
-- EXECUÇÃO: Execute este script no Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- PARTE 1: CRIAR TABELA DE CLIENTES
-- ============================================================================

-- Tabela de clientes com suporte a autenticação
CREATE TABLE IF NOT EXISTS public.clientes (
    -- Identificação
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome                    VARCHAR(255) NOT NULL,
    email                   VARCHAR(255) UNIQUE,
    telefone                VARCHAR(20) NOT NULL,
    senha_hash              TEXT,  -- Hash bcrypt da senha (se não usar Supabase Auth)
    
    -- Endereço padrão (opcional - cliente pode ter endereço cadastrado)
    endereco_rua            VARCHAR(255),
    endereco_numero         VARCHAR(20),
    endereco_bairro         VARCHAR(100),
    endereco_cidade         VARCHAR(100),
    endereco_estado         VARCHAR(2),
    endereco_cep            VARCHAR(10),
    endereco_complemento    TEXT,
    
    -- Status e verificação
    ativo                   BOOLEAN DEFAULT true,
    email_verificado        BOOLEAN DEFAULT false,
    telefone_verificado     BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ultimo_acesso           TIMESTAMP WITH TIME ZONE
);

-- Comentários
COMMENT ON TABLE public.clientes IS 'Clientes cadastrados no sistema com autenticação';
COMMENT ON COLUMN public.clientes.senha_hash IS 'Hash bcrypt da senha (usar apenas se não usar Supabase Auth)';
COMMENT ON COLUMN public.clientes.endereco_rua IS 'Endereço padrão opcional - usado para agilizar checkout';

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_clientes_email ON public.clientes(email);
CREATE INDEX IF NOT EXISTS idx_clientes_telefone ON public.clientes(telefone);
CREATE INDEX IF NOT EXISTS idx_clientes_ativo ON public.clientes(ativo);
CREATE INDEX IF NOT EXISTS idx_clientes_created_at ON public.clientes(created_at);

-- ============================================================================
-- PARTE 2: CRIAR TABELA DE TAXAS DE ENTREGA
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.taxas_entrega (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bairro                  VARCHAR(100) NOT NULL,
    cidade                  VARCHAR(100),
    cep                     VARCHAR(10),
    taxa                    NUMERIC(10,2) NOT NULL,
    tempo_min               INTEGER,  -- Tempo mínimo em minutos
    tempo_max               INTEGER,  -- Tempo máximo em minutos
    ativo                   BOOLEAN DEFAULT true,
    ordem                   INTEGER DEFAULT 0,
    created_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.taxas_entrega IS 'Taxas de entrega por bairro/região com tempos estimados';
COMMENT ON COLUMN public.taxas_entrega.bairro IS 'Nome do bairro (campo principal para busca)';
COMMENT ON COLUMN public.taxas_entrega.cep IS 'CEP ou faixa de CEP (opcional)';
COMMENT ON COLUMN public.taxas_entrega.tempo_min IS 'Tempo mínimo de entrega em minutos';
COMMENT ON COLUMN public.taxas_entrega.tempo_max IS 'Tempo máximo de entrega em minutos';

-- Índices
CREATE INDEX IF NOT EXISTS idx_taxas_bairro ON public.taxas_entrega(bairro);
CREATE INDEX IF NOT EXISTS idx_taxas_cep ON public.taxas_entrega(cep);
CREATE INDEX IF NOT EXISTS idx_taxas_ativo ON public.taxas_entrega(ativo);

-- ============================================================================
-- PARTE 3: ADICIONAR CAMPOS NA TABELA PEDIDOS
-- ============================================================================

-- Relacionamento com cliente
ALTER TABLE public.pedidos 
ADD COLUMN IF NOT EXISTS cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL;

-- Número do pedido (formato: PED-001, PED-002, etc.)
ALTER TABLE public.pedidos 
ADD COLUMN IF NOT EXISTS numero_pedido VARCHAR(50) UNIQUE;

-- Dados do cliente (quando não está logado - pedido como convidado)
ALTER TABLE public.pedidos 
ADD COLUMN IF NOT EXISTS nome_cliente VARCHAR(255);

ALTER TABLE public.pedidos 
ADD COLUMN IF NOT EXISTS telefone_cliente VARCHAR(20);

-- Endereço estruturado (substituindo o campo texto livre)
ALTER TABLE public.pedidos 
ADD COLUMN IF NOT EXISTS endereco_rua VARCHAR(255);

ALTER TABLE public.pedidos 
ADD COLUMN IF NOT EXISTS endereco_numero VARCHAR(20);

ALTER TABLE public.pedidos 
ADD COLUMN IF NOT EXISTS endereco_bairro VARCHAR(100);

ALTER TABLE public.pedidos 
ADD COLUMN IF NOT EXISTS endereco_cidade VARCHAR(100);

ALTER TABLE public.pedidos 
ADD COLUMN IF NOT EXISTS endereco_estado VARCHAR(2);

ALTER TABLE public.pedidos 
ADD COLUMN IF NOT EXISTS endereco_cep VARCHAR(10);

ALTER TABLE public.pedidos 
ADD COLUMN IF NOT EXISTS endereco_complemento TEXT;

-- Campos de pagamento
ALTER TABLE public.pedidos 
ADD COLUMN IF NOT EXISTS troco_para NUMERIC(10,2);

ALTER TABLE public.pedidos 
ADD COLUMN IF NOT EXISTS desconto NUMERIC(10,2) DEFAULT 0;

-- Timestamps adicionais
ALTER TABLE public.pedidos 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE public.pedidos 
ADD COLUMN IF NOT EXISTS confirmado_em TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.pedidos 
ADD COLUMN IF NOT EXISTS finalizado_em TIMESTAMP WITH TIME ZONE;

-- Comentários
COMMENT ON COLUMN public.pedidos.cliente_id IS 'ID do cliente (NULL se pedido como convidado)';
COMMENT ON COLUMN public.pedidos.numero_pedido IS 'Número sequencial do pedido (ex: PED-001)';
COMMENT ON COLUMN public.pedidos.nome_cliente IS 'Nome temporário (usado quando cliente não está logado)';
COMMENT ON COLUMN public.pedidos.telefone_cliente IS 'Telefone temporário (usado quando cliente não está logado)';
COMMENT ON COLUMN public.pedidos.endereco_rua IS 'Rua do endereço de entrega';
COMMENT ON COLUMN public.pedidos.troco_para IS 'Valor para troco (se forma_pagamento = dinheiro)';

-- Índices adicionais
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente_id ON public.pedidos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_numero_pedido ON public.pedidos(numero_pedido);
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON public.pedidos(status);
CREATE INDEX IF NOT EXISTS idx_pedidos_created_at ON public.pedidos(created_at);
CREATE INDEX IF NOT EXISTS idx_pedidos_telefone_cliente ON public.pedidos(telefone_cliente);

-- ============================================================================
-- PARTE 4: ADICIONAR CAMPOS NA TABELA PEDIDO_ITENS
-- ============================================================================

-- Adicionais selecionados (estrutura: array de objetos por sabor)
ALTER TABLE public.pedido_itens 
ADD COLUMN IF NOT EXISTS adicionais JSONB;

-- Borda recheada selecionada
ALTER TABLE public.pedido_itens 
ADD COLUMN IF NOT EXISTS borda_recheada JSONB;

-- Observações específicas do item
ALTER TABLE public.pedido_itens 
ADD COLUMN IF NOT EXISTS observacoes TEXT;

-- Comentários
COMMENT ON COLUMN public.pedido_itens.adicionais IS 'Array JSON com adicionais por sabor: [{"sabor": "X", "itens": [{"nome": "Y", "preco": Z}]}]';
COMMENT ON COLUMN public.pedido_itens.borda_recheada IS 'JSON com borda: {"id": "uuid", "nome": "Catupiry", "preco": 5.00}';
COMMENT ON COLUMN public.pedido_itens.observacoes IS 'Observações específicas deste item';

-- ============================================================================
-- PARTE 5: FUNÇÕES AUXILIARES
-- ============================================================================

-- Função para gerar número de pedido sequencial
CREATE OR REPLACE FUNCTION public.gerar_numero_pedido()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    ultimo_numero INTEGER;
    novo_numero TEXT;
BEGIN
    -- Buscar o último número de pedido
    SELECT COALESCE(
        MAX(CAST(SUBSTRING(numero_pedido FROM 5) AS INTEGER)), 
        0
    ) INTO ultimo_numero
    FROM public.pedidos
    WHERE numero_pedido ~ '^PED-[0-9]+$';
    
    -- Gerar novo número
    novo_numero := 'PED-' || LPAD((ultimo_numero + 1)::TEXT, 3, '0');
    
    RETURN novo_numero;
END;
$$;

COMMENT ON FUNCTION public.gerar_numero_pedido IS 'Gera número sequencial para pedidos (PED-001, PED-002, etc.)';

-- Função para buscar taxa de entrega por bairro
CREATE OR REPLACE FUNCTION public.buscar_taxa_entrega(p_bairro VARCHAR, p_cep VARCHAR DEFAULT NULL)
RETURNS TABLE(
    taxa NUMERIC,
    tempo_min INTEGER,
    tempo_max INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT t.taxa, t.tempo_min, t.tempo_max
    FROM public.taxas_entrega t
    WHERE t.ativo = true
      AND (
        LOWER(TRIM(t.bairro)) = LOWER(TRIM(p_bairro))
        OR (p_cep IS NOT NULL AND t.cep = p_cep)
      )
    ORDER BY 
      CASE 
        WHEN t.cep = p_cep THEN 1  -- Priorizar match por CEP
        ELSE 2
      END,
      t.ordem
    LIMIT 1;
END;
$$;

COMMENT ON FUNCTION public.buscar_taxa_entrega IS 'Busca taxa de entrega por bairro ou CEP';

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- ============================================================================
-- PARTE 6: TRIGGERS
-- ============================================================================

-- Trigger para atualizar updated_at em clientes
DROP TRIGGER IF EXISTS trigger_clientes_updated_at ON public.clientes;
CREATE TRIGGER trigger_clientes_updated_at
    BEFORE UPDATE ON public.clientes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para atualizar updated_at em pedidos
DROP TRIGGER IF EXISTS trigger_pedidos_updated_at ON public.pedidos;
CREATE TRIGGER trigger_pedidos_updated_at
    BEFORE UPDATE ON public.pedidos
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para atualizar updated_at em taxas_entrega
DROP TRIGGER IF EXISTS trigger_taxas_updated_at ON public.taxas_entrega;
CREATE TRIGGER trigger_taxas_updated_at
    BEFORE UPDATE ON public.taxas_entrega
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para gerar número de pedido automaticamente
CREATE OR REPLACE FUNCTION public.auto_gerar_numero_pedido()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.numero_pedido IS NULL THEN
        NEW.numero_pedido = public.gerar_numero_pedido();
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_gerar_numero_pedido ON public.pedidos;
CREATE TRIGGER trigger_gerar_numero_pedido
    BEFORE INSERT ON public.pedidos
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_gerar_numero_pedido();

-- Trigger para atualizar timestamp de finalização
CREATE OR REPLACE FUNCTION public.atualizar_timestamps_pedido()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Se status mudou para confirmado
    IF NEW.status = 'confirmado' AND (OLD.status IS NULL OR OLD.status != 'confirmado') THEN
        NEW.confirmado_em = NOW();
    END IF;
    
    -- Se status mudou para finalizado
    IF NEW.status = 'finalizado' AND (OLD.status IS NULL OR OLD.status != 'finalizado') THEN
        NEW.finalizado_em = NOW();
    END IF;
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_timestamps_pedido ON public.pedidos;
CREATE TRIGGER trigger_timestamps_pedido
    BEFORE UPDATE ON public.pedidos
    FOR EACH ROW
    EXECUTE FUNCTION public.atualizar_timestamps_pedido();

-- ============================================================================
-- PARTE 7: CONFIGURAR RLS (ROW LEVEL SECURITY)
-- ============================================================================

-- Habilitar RLS nas tabelas
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedido_itens ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLÍTICAS RLS PARA CLIENTES
-- ============================================================================

-- Clientes podem ver apenas seus próprios dados
DROP POLICY IF EXISTS "Clientes podem ver próprios dados" ON public.clientes;
CREATE POLICY "Clientes podem ver próprios dados"
ON public.clientes FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Clientes podem atualizar apenas seus próprios dados
DROP POLICY IF EXISTS "Clientes podem atualizar próprios dados" ON public.clientes;
CREATE POLICY "Clientes podem atualizar próprios dados"
ON public.clientes FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- Permitir inserção na criação de conta
DROP POLICY IF EXISTS "Permitir criar conta" ON public.clientes;
CREATE POLICY "Permitir criar conta"
ON public.clientes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Admin pode ver todos os clientes
DROP POLICY IF EXISTS "Admin pode ver todos clientes" ON public.clientes;
CREATE POLICY "Admin pode ver todos clientes"
ON public.clientes FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admins 
    WHERE id = auth.uid() AND ativo = true
  )
);

-- ============================================================================
-- POLÍTICAS RLS PARA PEDIDOS
-- ============================================================================

-- Clientes podem ver apenas seus próprios pedidos
DROP POLICY IF EXISTS "Clientes podem ver próprios pedidos" ON public.pedidos;
CREATE POLICY "Clientes podem ver próprios pedidos"
ON public.pedidos FOR SELECT
TO authenticated
USING (
  cliente_id = auth.uid()
  OR cliente_id IS NULL  -- Permitir ver pedidos como convidado (se necessário)
);

-- Clientes podem criar pedidos
DROP POLICY IF EXISTS "Clientes podem criar pedidos" ON public.pedidos;
CREATE POLICY "Clientes podem criar pedidos"
ON public.pedidos FOR INSERT
TO authenticated
WITH CHECK (
  cliente_id = auth.uid() 
  OR cliente_id IS NULL  -- Permitir pedido como convidado
);

-- Admin pode ver e gerenciar todos os pedidos
DROP POLICY IF EXISTS "Admin pode gerenciar todos pedidos" ON public.pedidos;
CREATE POLICY "Admin pode gerenciar todos pedidos"
ON public.pedidos FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admins 
    WHERE id = auth.uid() AND ativo = true
  )
);

-- ============================================================================
-- POLÍTICAS RLS PARA PEDIDO_ITENS
-- ============================================================================

-- Clientes podem ver itens dos seus pedidos
DROP POLICY IF EXISTS "Clientes podem ver itens próprios" ON public.pedido_itens;
CREATE POLICY "Clientes podem ver itens próprios"
ON public.pedido_itens FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.pedidos p
    WHERE p.id = pedido_id 
    AND (p.cliente_id = auth.uid() OR p.cliente_id IS NULL)
  )
);

-- Clientes podem inserir itens nos seus pedidos
DROP POLICY IF EXISTS "Clientes podem criar itens" ON public.pedido_itens;
CREATE POLICY "Clientes podem criar itens"
ON public.pedido_itens FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.pedidos p
    WHERE p.id = pedido_id 
    AND (p.cliente_id = auth.uid() OR p.cliente_id IS NULL)
  )
);

-- Admin pode gerenciar todos os itens
DROP POLICY IF EXISTS "Admin pode gerenciar todos itens" ON public.pedido_itens;
CREATE POLICY "Admin pode gerenciar todos itens"
ON public.pedido_itens FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admins 
    WHERE id = auth.uid() AND ativo = true
  )
);

-- ============================================================================
-- PARTE 8: DADOS INICIAIS (OPCIONAL)
-- ============================================================================

-- Inserir algumas taxas de entrega de exemplo
INSERT INTO public.taxas_entrega (bairro, cidade, taxa, tempo_min, tempo_max, ordem)
VALUES 
  ('Centro', 'São José dos Campos', 5.00, 30, 45, 1),
  ('Vila Industrial', 'São José dos Campos', 8.00, 40, 60, 2),
  ('Jardim São Dimas', 'São José dos Campos', 10.00, 45, 70, 3)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PARTE 9: VERIFICAÇÕES FINAIS
-- ============================================================================

-- Verificar se as tabelas foram criadas
DO $$
BEGIN
    RAISE NOTICE '=== VERIFICAÇÃO DE MIGRAÇÃO ===';
    
    -- Verificar clientes
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clientes') THEN
        RAISE NOTICE '✅ Tabela clientes criada';
    ELSE
        RAISE WARNING '❌ Tabela clientes não encontrada';
    END IF;
    
    -- Verificar taxas_entrega
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'taxas_entrega') THEN
        RAISE NOTICE '✅ Tabela taxas_entrega criada';
    ELSE
        RAISE WARNING '❌ Tabela taxas_entrega não encontrada';
    END IF;
    
    -- Verificar campos em pedidos
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pedidos' AND column_name = 'cliente_id') THEN
        RAISE NOTICE '✅ Campo cliente_id adicionado em pedidos';
    ELSE
        RAISE WARNING '❌ Campo cliente_id não encontrado em pedidos';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pedidos' AND column_name = 'numero_pedido') THEN
        RAISE NOTICE '✅ Campo numero_pedido adicionado em pedidos';
    ELSE
        RAISE WARNING '❌ Campo numero_pedido não encontrado em pedidos';
    END IF;
    
    -- Verificar campos em pedido_itens
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pedido_itens' AND column_name = 'adicionais') THEN
        RAISE NOTICE '✅ Campo adicionais adicionado em pedido_itens';
    ELSE
        RAISE WARNING '❌ Campo adicionais não encontrado em pedido_itens';
    END IF;
    
    RAISE NOTICE '=== FIM DA VERIFICAÇÃO ===';
END $$;

-- ============================================================================
-- MIGRAÇÃO CONCLUÍDA!
-- ============================================================================
-- 
-- PRÓXIMOS PASSOS:
-- 1. Verificar se a migração foi executada sem erros
-- 2. Testar funções auxiliares (gerar_numero_pedido, buscar_taxa_entrega)
-- 3. Configurar Supabase Auth no frontend
-- 4. Implementar páginas de cadastro/login
-- 5. Criar API de criação de pedidos
-- 6. Testar fluxo completo
--
-- ROLLBACK (se necessário):
-- Para reverter esta migração, execute o script de rollback separado
-- ============================================================================
