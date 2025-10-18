-- ============================================================================
-- ATUALIZAÇÃO DE TABELAS EXISTENTES PARA SISTEMA DE PEDIDOS ONLINE
-- ============================================================================
-- Data: 18/10/2025
-- Descrição: Adiciona apenas os campos faltantes nas tabelas existentes
--            Baseado na análise do banco atual (cardapiodigitalv3)
-- 
-- IMPORTANTE: Este script foi otimizado para o banco EXISTENTE
-- Não recria tabelas, apenas adiciona campos faltantes
-- ============================================================================

-- ============================================================================
-- PARTE 1: ADICIONAR CAMPOS NA TABELA CLIENTES
-- ============================================================================

-- Adicionar campos para autenticação (se usar sistema próprio)
ALTER TABLE public.clientes 
ADD COLUMN IF NOT EXISTS senha_hash TEXT;

-- Adicionar flags de verificação
ALTER TABLE public.clientes 
ADD COLUMN IF NOT EXISTS email_verificado BOOLEAN DEFAULT false;

ALTER TABLE public.clientes 
ADD COLUMN IF NOT EXISTS telefone_verificado BOOLEAN DEFAULT false;

-- Adicionar timestamp de último acesso
ALTER TABLE public.clientes 
ADD COLUMN IF NOT EXISTS ultimo_acesso TIMESTAMP WITH TIME ZONE;

-- Comentários
COMMENT ON COLUMN public.clientes.senha_hash IS 'Hash bcrypt da senha (usar apenas se não usar Supabase Auth)';
COMMENT ON COLUMN public.clientes.email_verificado IS 'Flag indicando se o email foi verificado';
COMMENT ON COLUMN public.clientes.telefone_verificado IS 'Flag indicando se o telefone foi verificado';
COMMENT ON COLUMN public.clientes.ultimo_acesso IS 'Data/hora do último acesso do cliente';

-- ============================================================================
-- PARTE 2: ADICIONAR CAMPOS NA TABELA PEDIDOS
-- ============================================================================

-- Número do pedido (formato: PED-001, PED-002, etc.)
ALTER TABLE public.pedidos 
ADD COLUMN IF NOT EXISTS numero_pedido VARCHAR(50) UNIQUE;

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
ADD COLUMN IF NOT EXISTS confirmado_em TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.pedidos 
ADD COLUMN IF NOT EXISTS finalizado_em TIMESTAMP WITH TIME ZONE;

-- Comentários
COMMENT ON COLUMN public.pedidos.numero_pedido IS 'Número sequencial do pedido (ex: PED-001)';
COMMENT ON COLUMN public.pedidos.endereco_rua IS 'Rua do endereço de entrega';
COMMENT ON COLUMN public.pedidos.endereco_numero IS 'Número do endereço de entrega';
COMMENT ON COLUMN public.pedidos.endereco_bairro IS 'Bairro do endereço de entrega';
COMMENT ON COLUMN public.pedidos.endereco_cidade IS 'Cidade do endereço de entrega';
COMMENT ON COLUMN public.pedidos.endereco_estado IS 'Estado do endereço de entrega (UF)';
COMMENT ON COLUMN public.pedidos.endereco_cep IS 'CEP do endereço de entrega';
COMMENT ON COLUMN public.pedidos.endereco_complemento IS 'Complemento/Referência do endereço';
COMMENT ON COLUMN public.pedidos.troco_para IS 'Valor para troco (se forma_pagamento = dinheiro)';
COMMENT ON COLUMN public.pedidos.desconto IS 'Valor de desconto aplicado ao pedido';
COMMENT ON COLUMN public.pedidos.confirmado_em IS 'Data/hora em que o pedido foi confirmado';
COMMENT ON COLUMN public.pedidos.finalizado_em IS 'Data/hora em que o pedido foi finalizado';

-- Índices adicionais para performance
CREATE INDEX IF NOT EXISTS idx_pedidos_numero_pedido ON public.pedidos(numero_pedido);
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON public.pedidos(status);
CREATE INDEX IF NOT EXISTS idx_pedidos_created_at ON public.pedidos(created_at);
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente_id ON public.pedidos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_telefone_cliente ON public.pedidos(telefone_cliente);

-- ============================================================================
-- PARTE 3: ADICIONAR CAMPOS NA TABELA PEDIDO_ITENS
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
-- PARTE 4: FUNÇÕES AUXILIARES
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
    SELECT 
        t.taxa, 
        t.tempo_estimado_min as tempo_min, 
        t.tempo_estimado_max as tempo_max
    FROM public.taxas_entrega t
    WHERE t.ativo = true
      AND (
        LOWER(TRIM(t.bairro)) = LOWER(TRIM(p_bairro))
        OR (p_cep IS NOT NULL AND (
          t.cep_inicial IS NULL OR p_cep >= t.cep_inicial
        ) AND (
          t.cep_final IS NULL OR p_cep <= t.cep_final
        ))
      )
    ORDER BY 
      CASE 
        WHEN t.cep_inicial IS NOT NULL AND t.cep_final IS NOT NULL THEN 1  -- Priorizar match por CEP
        ELSE 2
      END
    LIMIT 1;
END;
$$;

COMMENT ON FUNCTION public.buscar_taxa_entrega IS 'Busca taxa de entrega por bairro ou faixa de CEP';

-- Função para atualizar updated_at automaticamente (se não existir)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.atualizado_em = NOW();
    RETURN NEW;
END;
$$;

-- ============================================================================
-- PARTE 5: TRIGGERS
-- ============================================================================

-- Trigger para atualizar atualizado_em em clientes
DROP TRIGGER IF EXISTS trigger_clientes_updated_at ON public.clientes;
CREATE TRIGGER trigger_clientes_updated_at
    BEFORE UPDATE ON public.clientes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para atualizar atualizado_em em pedidos
DROP TRIGGER IF EXISTS trigger_pedidos_updated_at ON public.pedidos;
CREATE TRIGGER trigger_pedidos_updated_at
    BEFORE UPDATE ON public.pedidos
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

-- Trigger para atualizar timestamps de confirmação e finalização
CREATE OR REPLACE FUNCTION public.atualizar_timestamps_pedido()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Se status mudou para confirmado
    IF NEW.status = 'confirmado' AND (OLD.status IS NULL OR OLD.status != 'confirmado') THEN
        NEW.confirmado_em = NOW();
    END IF;
    
    -- Se status mudou para finalizado ou entregue
    IF (NEW.status = 'finalizado' OR NEW.status = 'entregue') 
       AND (OLD.status IS NULL OR (OLD.status != 'finalizado' AND OLD.status != 'entregue')) THEN
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
-- PARTE 6: CONFIGURAR RLS (ROW LEVEL SECURITY)
-- ============================================================================

-- Habilitar RLS nas tabelas (se ainda não estiver)
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
-- PARTE 7: VERIFICAÇÕES FINAIS
-- ============================================================================

-- Verificar se os campos foram adicionados
DO $$
BEGIN
    RAISE NOTICE '=== VERIFICAÇÃO DE ATUALIZAÇÃO ===';
    
    -- Verificar clientes
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clientes' AND column_name = 'senha_hash') THEN
        RAISE NOTICE '✅ Campo senha_hash adicionado em clientes';
    ELSE
        RAISE WARNING '❌ Campo senha_hash não encontrado em clientes';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clientes' AND column_name = 'email_verificado') THEN
        RAISE NOTICE '✅ Campo email_verificado adicionado em clientes';
    ELSE
        RAISE WARNING '❌ Campo email_verificado não encontrado em clientes';
    END IF;
    
    -- Verificar pedidos
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pedidos' AND column_name = 'numero_pedido') THEN
        RAISE NOTICE '✅ Campo numero_pedido adicionado em pedidos';
    ELSE
        RAISE WARNING '❌ Campo numero_pedido não encontrado em pedidos';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pedidos' AND column_name = 'endereco_rua') THEN
        RAISE NOTICE '✅ Campos de endereço estruturado adicionados em pedidos';
    ELSE
        RAISE WARNING '❌ Campos de endereço não encontrados em pedidos';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pedidos' AND column_name = 'troco_para') THEN
        RAISE NOTICE '✅ Campos de pagamento adicionados em pedidos';
    ELSE
        RAISE WARNING '❌ Campos de pagamento não encontrados em pedidos';
    END IF;
    
    -- Verificar pedido_itens
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pedido_itens' AND column_name = 'adicionais') THEN
        RAISE NOTICE '✅ Campo adicionais adicionado em pedido_itens';
    ELSE
        RAISE WARNING '❌ Campo adicionais não encontrado em pedido_itens';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pedido_itens' AND column_name = 'borda_recheada') THEN
        RAISE NOTICE '✅ Campo borda_recheada adicionado em pedido_itens';
    ELSE
        RAISE WARNING '❌ Campo borda_recheada não encontrado em pedido_itens';
    END IF;
    
    -- Verificar funções
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'gerar_numero_pedido') THEN
        RAISE NOTICE '✅ Função gerar_numero_pedido criada';
    ELSE
        RAISE WARNING '❌ Função gerar_numero_pedido não encontrada';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'buscar_taxa_entrega') THEN
        RAISE NOTICE '✅ Função buscar_taxa_entrega criada';
    ELSE
        RAISE WARNING '❌ Função buscar_taxa_entrega não encontrada';
    END IF;
    
    RAISE NOTICE '=== FIM DA VERIFICAÇÃO ===';
END $$;

-- ============================================================================
-- ATUALIZAÇÃO CONCLUÍDA!
-- ============================================================================
-- 
-- RESUMO DO QUE FOI FEITO:
-- ✅ Adicionados 4 campos em clientes
-- ✅ Adicionados 12 campos em pedidos
-- ✅ Adicionados 3 campos em pedido_itens
-- ✅ Criadas 4 funções auxiliares
-- ✅ Criados 4 triggers automáticos
-- ✅ Configuradas políticas RLS
-- ✅ Criados índices para performance
--
-- PRÓXIMOS PASSOS:
-- 1. Configurar Supabase Auth
-- 2. Criar páginas de cadastro/login
-- 3. Modificar checkout para salvar no banco
-- 4. Criar páginas de histórico de pedidos
-- 5. Integrar com admin (notificações em tempo real)
--
-- ============================================================================
