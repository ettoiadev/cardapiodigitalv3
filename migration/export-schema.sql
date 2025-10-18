-- ============================================================================
-- SCRIPT DE EXPORTAÇÃO DE SCHEMA - Cardápio Digital v3
-- ============================================================================
-- Descrição: Schema completo do banco de dados para migração
-- Origem: Supabase PostgreSQL 17.4.1.45
-- Data: Gerado automaticamente
-- Uso: psql -h <host> -U <user> -d <database> -f export-schema.sql
-- ============================================================================

-- Configurações iniciais
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- ============================================================================
-- EXTENSÕES
-- ============================================================================

-- Extensão para geração de UUIDs (PostgreSQL 13+ já tem gen_random_uuid nativo)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Extensão para funções de criptografia (usada em funções de senha)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- SCHEMA
-- ============================================================================

-- Garantir que o schema public existe
CREATE SCHEMA IF NOT EXISTS public;

-- Comentário do schema
COMMENT ON SCHEMA public IS 'Schema público da aplicação Cardápio Digital';

-- ============================================================================
-- TABELAS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Tabela: pizzaria_config
-- Descrição: Configurações gerais da pizzaria (singleton)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pizzaria_config (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome character varying NOT NULL,
    foto_capa text,
    foto_perfil text,
    endereco text,
    telefone character varying,
    whatsapp character varying,
    taxa_entrega numeric,
    valor_minimo numeric,
    tempo_entrega_min integer,
    tempo_entrega_max integer,
    aceita_dinheiro boolean DEFAULT true,
    aceita_cartao boolean DEFAULT true,
    aceita_pix boolean DEFAULT true,
    aceita_ticket_alimentacao boolean DEFAULT false,
    horario_funcionamento jsonb,
    habilitar_broto boolean DEFAULT true,
    habilitar_bordas_recheadas boolean DEFAULT true,
    descricao_pizzas text,
    whatsapp_link character varying,
    whatsapp_ativo boolean DEFAULT true,
    instagram_link character varying,
    instagram_ativo boolean DEFAULT false,
    facebook_link character varying,
    facebook_ativo boolean DEFAULT false,
    maps_link character varying,
    maps_ativo boolean DEFAULT false,
    compartilhar_ativo boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT pizzaria_config_pkey PRIMARY KEY (id)
);

COMMENT ON TABLE public.pizzaria_config IS 'Configurações gerais da pizzaria';
COMMENT ON COLUMN public.pizzaria_config.horario_funcionamento IS 'JSON com horários de funcionamento por dia da semana';

-- ----------------------------------------------------------------------------
-- Tabela: categorias
-- Descrição: Categorias do cardápio
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categorias (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome character varying NOT NULL,
    descricao text,
    ordem integer DEFAULT 0,
    ativo boolean DEFAULT true,
    multi_sabores_habilitado boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT categorias_pkey PRIMARY KEY (id)
);

COMMENT ON TABLE public.categorias IS 'Categorias do cardápio';
COMMENT ON COLUMN public.categorias.multi_sabores_habilitado IS 'Se produtos desta categoria permitem múltiplos sabores';

-- ----------------------------------------------------------------------------
-- Tabela: produtos
-- Descrição: Produtos do cardápio
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.produtos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    categoria_id uuid,
    nome character varying NOT NULL,
    descricao text,
    preco_tradicional numeric,
    preco_broto numeric,
    preco_promocional_tradicional numeric,
    preco_promocional_broto numeric,
    tipo character varying DEFAULT 'pizza'::character varying,
    ativo boolean DEFAULT true,
    ordem integer DEFAULT 0,
    adicionais jsonb,
    permite_multiplos_sabores boolean DEFAULT false,
    promocao boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT produtos_pkey PRIMARY KEY (id),
    CONSTRAINT produtos_categoria_id_fkey FOREIGN KEY (categoria_id) 
        REFERENCES public.categorias(id) ON DELETE SET NULL
);

COMMENT ON TABLE public.produtos IS 'Produtos do cardápio (pizzas, bebidas, adicionais)';
COMMENT ON COLUMN public.produtos.tipo IS 'Tipo do produto: pizza, bebida, adicional, etc.';
COMMENT ON COLUMN public.produtos.adicionais IS 'JSON com adicionais disponíveis para o produto';

-- ----------------------------------------------------------------------------
-- Tabela: bordas_recheadas
-- Descrição: Opções de bordas recheadas
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bordas_recheadas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome character varying NOT NULL,
    preco numeric NOT NULL,
    ativo boolean DEFAULT true,
    ordem integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT bordas_recheadas_pkey PRIMARY KEY (id)
);

COMMENT ON TABLE public.bordas_recheadas IS 'Opções de bordas recheadas disponíveis';
COMMENT ON COLUMN public.bordas_recheadas.preco IS 'Preço adicional da borda recheada';

-- ----------------------------------------------------------------------------
-- Tabela: opcoes_sabores
-- Descrição: Opções de quantidade de sabores
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.opcoes_sabores (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome character varying NOT NULL,
    maximo_sabores integer NOT NULL,
    descricao text,
    ordem integer DEFAULT 0,
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT opcoes_sabores_pkey PRIMARY KEY (id)
);

COMMENT ON TABLE public.opcoes_sabores IS 'Opções de quantidade de sabores (1 sabor, 2 sabores, etc.)';

-- ----------------------------------------------------------------------------
-- Tabela: tamanhos_pizza
-- Descrição: Tamanhos de pizza disponíveis
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tamanhos_pizza (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome character varying NOT NULL,
    descricao text,
    fatias integer NOT NULL,
    ordem integer DEFAULT 0,
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT tamanhos_pizza_pkey PRIMARY KEY (id)
);

COMMENT ON TABLE public.tamanhos_pizza IS 'Tamanhos de pizza disponíveis (usado no painel admin)';

-- ----------------------------------------------------------------------------
-- Tabela: carousel_config
-- Descrição: Configuração do carrossel da homepage
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.carousel_config (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ativo boolean DEFAULT true,
    intervalo_segundos integer DEFAULT 5,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT carousel_config_pkey PRIMARY KEY (id),
    CONSTRAINT carousel_config_intervalo_segundos_check 
        CHECK ((intervalo_segundos >= 1 AND intervalo_segundos <= 30))
);

COMMENT ON TABLE public.carousel_config IS 'Configuração do carrossel de imagens da homepage';

-- ----------------------------------------------------------------------------
-- Tabela: carousel_images
-- Descrição: Imagens do carrossel
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.carousel_images (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    url text NOT NULL,
    ordem integer DEFAULT 1,
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT carousel_images_pkey PRIMARY KEY (id)
);

COMMENT ON TABLE public.carousel_images IS 'Imagens do carrossel da homepage';

-- ----------------------------------------------------------------------------
-- Tabela: admins
-- Descrição: Usuários administradores
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admins (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome character varying NOT NULL,
    email character varying NOT NULL,
    senha character varying NOT NULL,
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT admins_pkey PRIMARY KEY (id),
    CONSTRAINT admins_email_key UNIQUE (email)
);

COMMENT ON TABLE public.admins IS 'Usuários administradores do sistema';
COMMENT ON COLUMN public.admins.senha IS 'Hash da senha (bcrypt recomendado)';

-- ----------------------------------------------------------------------------
-- Tabela: pedidos
-- Descrição: Pedidos realizados
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pedidos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tipo_entrega character varying NOT NULL,
    endereco_entrega text,
    forma_pagamento character varying,
    subtotal numeric NOT NULL,
    taxa_entrega numeric,
    total numeric NOT NULL,
    status character varying DEFAULT 'pendente'::character varying,
    observacoes text,
    enviado_whatsapp boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT pedidos_pkey PRIMARY KEY (id)
);

COMMENT ON TABLE public.pedidos IS 'Pedidos realizados pelos clientes';
COMMENT ON COLUMN public.pedidos.tipo_entrega IS 'Tipo: delivery ou retirada';
COMMENT ON COLUMN public.pedidos.status IS 'Status: pendente, confirmado, em_preparo, saiu_entrega, finalizado, cancelado';

-- ----------------------------------------------------------------------------
-- Tabela: pedido_itens
-- Descrição: Itens dos pedidos
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pedido_itens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    pedido_id uuid,
    produto_id uuid,
    nome_produto character varying NOT NULL,
    tamanho character varying,
    sabores jsonb,
    quantidade integer DEFAULT 1 NOT NULL,
    preco_unitario numeric NOT NULL,
    preco_total numeric NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT pedido_itens_pkey PRIMARY KEY (id),
    CONSTRAINT pedido_itens_pedido_id_fkey FOREIGN KEY (pedido_id) 
        REFERENCES public.pedidos(id) ON DELETE CASCADE,
    CONSTRAINT pedido_itens_produto_id_fkey FOREIGN KEY (produto_id) 
        REFERENCES public.produtos(id) ON DELETE SET NULL
);

COMMENT ON TABLE public.pedido_itens IS 'Itens individuais de cada pedido';
COMMENT ON COLUMN public.pedido_itens.sabores IS 'JSON com array de sabores selecionados';
COMMENT ON COLUMN public.pedido_itens.nome_produto IS 'Snapshot do nome do produto no momento do pedido';

-- ----------------------------------------------------------------------------
-- Tabela: mensagens_whatsapp
-- Descrição: Log de mensagens enviadas via WhatsApp
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.mensagens_whatsapp (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    conteudo_mensagem text NOT NULL,
    numero_whatsapp character varying,
    tipo_entrega character varying,
    valor_total numeric,
    data_envio timestamp with time zone DEFAULT now(),
    status character varying DEFAULT 'enviado'::character varying,
    CONSTRAINT mensagens_whatsapp_pkey PRIMARY KEY (id)
);

COMMENT ON TABLE public.mensagens_whatsapp IS 'Log de mensagens enviadas via WhatsApp para rastreabilidade';

-- ============================================================================
-- FUNÇÕES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Função: update_updated_at_column
-- Descrição: Atualiza automaticamente o campo updated_at
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.update_updated_at_column IS 
    'Trigger function para atualizar automaticamente o campo updated_at';

-- ----------------------------------------------------------------------------
-- Função: verify_admin_password
-- Descrição: Verifica senha do administrador
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.verify_admin_password(
    admin_email text,
    password_input text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    stored_password text;
BEGIN
    -- Buscar senha armazenada
    SELECT senha INTO stored_password
    FROM public.admins
    WHERE email = admin_email AND ativo = true;
    
    -- Se não encontrou admin, retornar false
    IF stored_password IS NULL THEN
        RETURN false;
    END IF;
    
    -- Comparar senha (assumindo bcrypt ou outro hash)
    -- NOTA: Adaptar conforme algoritmo de hash usado
    RETURN stored_password = crypt(password_input, stored_password);
END;
$$;

COMMENT ON FUNCTION public.verify_admin_password IS 
    'Verifica se a senha fornecida corresponde ao hash armazenado';

-- ----------------------------------------------------------------------------
-- Função: update_admin_credentials
-- Descrição: Atualiza credenciais do administrador
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_admin_credentials(
    admin_id uuid,
    new_email text,
    new_password text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Atualizar credenciais
    UPDATE public.admins
    SET 
        email = new_email,
        senha = crypt(new_password, gen_salt('bf')),
        updated_at = now()
    WHERE id = admin_id;
    
    -- Retornar true se atualizou alguma linha
    RETURN FOUND;
END;
$$;

COMMENT ON FUNCTION public.update_admin_credentials IS 
    'Atualiza email e senha de um administrador';

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger para pizzaria_config
DROP TRIGGER IF EXISTS update_pizzaria_config_updated_at ON public.pizzaria_config;
CREATE TRIGGER update_pizzaria_config_updated_at
    BEFORE UPDATE ON public.pizzaria_config
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para bordas_recheadas
DROP TRIGGER IF EXISTS update_bordas_recheadas_updated_at ON public.bordas_recheadas;
CREATE TRIGGER update_bordas_recheadas_updated_at
    BEFORE UPDATE ON public.bordas_recheadas
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para carousel_config
DROP TRIGGER IF EXISTS update_carousel_config_updated_at ON public.carousel_config;
CREATE TRIGGER update_carousel_config_updated_at
    BEFORE UPDATE ON public.carousel_config
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para carousel_images
DROP TRIGGER IF EXISTS update_carousel_images_updated_at ON public.carousel_images;
CREATE TRIGGER update_carousel_images_updated_at
    BEFORE UPDATE ON public.carousel_images
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para admins
DROP TRIGGER IF EXISTS update_admins_updated_at ON public.admins;
CREATE TRIGGER update_admins_updated_at
    BEFORE UPDATE ON public.admins
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- ÍNDICES
-- ============================================================================

-- Índices para categorias
CREATE INDEX IF NOT EXISTS idx_categorias_ativo ON public.categorias(ativo);
CREATE INDEX IF NOT EXISTS idx_categorias_ordem ON public.categorias(ordem);

-- Índices para produtos
CREATE INDEX IF NOT EXISTS idx_produtos_categoria_id ON public.produtos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_produtos_ativo ON public.produtos(ativo);
CREATE INDEX IF NOT EXISTS idx_produtos_tipo ON public.produtos(tipo);
CREATE INDEX IF NOT EXISTS idx_produtos_ordem ON public.produtos(ordem);
CREATE INDEX IF NOT EXISTS idx_produtos_promocao ON public.produtos(promocao);

-- Índices para pedidos
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON public.pedidos(status);
CREATE INDEX IF NOT EXISTS idx_pedidos_created_at ON public.pedidos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pedidos_tipo_entrega ON public.pedidos(tipo_entrega);

-- Índices para pedido_itens
CREATE INDEX IF NOT EXISTS idx_pedido_itens_pedido_id ON public.pedido_itens(pedido_id);
CREATE INDEX IF NOT EXISTS idx_pedido_itens_produto_id ON public.pedido_itens(produto_id);

-- Índices para bordas_recheadas
CREATE INDEX IF NOT EXISTS idx_bordas_recheadas_ativo ON public.bordas_recheadas(ativo);
CREATE INDEX IF NOT EXISTS idx_bordas_recheadas_ordem ON public.bordas_recheadas(ordem);

-- Índices para opcoes_sabores
CREATE INDEX IF NOT EXISTS idx_opcoes_sabores_ativo ON public.opcoes_sabores(ativo);
CREATE INDEX IF NOT EXISTS idx_opcoes_sabores_ordem ON public.opcoes_sabores(ordem);

-- Índices para carousel_images
CREATE INDEX IF NOT EXISTS idx_carousel_images_ativo ON public.carousel_images(ativo);
CREATE INDEX IF NOT EXISTS idx_carousel_images_ordem ON public.carousel_images(ordem);

-- Índices para admins
CREATE INDEX IF NOT EXISTS idx_admins_email ON public.admins(email);
CREATE INDEX IF NOT EXISTS idx_admins_ativo ON public.admins(ativo);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.pizzaria_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bordas_recheadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opcoes_sabores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tamanhos_pizza ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carousel_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carousel_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedido_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensagens_whatsapp ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLICIES RLS
-- ============================================================================

-- NOTA: As policies abaixo são genéricas. Adapte conforme seu sistema de autenticação.
-- Se migrar para ambiente sem Supabase Auth, você precisará ajustar as policies.

-- ----------
-- pizzaria_config
-- ----------
DROP POLICY IF EXISTS "Permitir leitura pública de configurações" ON public.pizzaria_config;
CREATE POLICY "Permitir leitura pública de configurações"
    ON public.pizzaria_config FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Apenas admins podem modificar configurações" ON public.pizzaria_config;
CREATE POLICY "Apenas admins podem modificar configurações"
    ON public.pizzaria_config FOR ALL
    USING (true)  -- Adaptar: verificar se usuário é admin
    WITH CHECK (true);

-- ----------
-- categorias
-- ----------
DROP POLICY IF EXISTS "Permitir leitura pública de categorias" ON public.categorias;
CREATE POLICY "Permitir leitura pública de categorias"
    ON public.categorias FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Apenas admins podem gerenciar categorias" ON public.categorias;
CREATE POLICY "Apenas admins podem gerenciar categorias"
    ON public.categorias FOR ALL
    USING (true)  -- Adaptar
    WITH CHECK (true);

-- ----------
-- produtos
-- ----------
DROP POLICY IF EXISTS "Permitir leitura pública de produtos" ON public.produtos;
CREATE POLICY "Permitir leitura pública de produtos"
    ON public.produtos FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Apenas admins podem gerenciar produtos" ON public.produtos;
CREATE POLICY "Apenas admins podem gerenciar produtos"
    ON public.produtos FOR ALL
    USING (true)  -- Adaptar
    WITH CHECK (true);

-- ----------
-- bordas_recheadas
-- ----------
DROP POLICY IF EXISTS "Permitir leitura pública de bordas" ON public.bordas_recheadas;
CREATE POLICY "Permitir leitura pública de bordas"
    ON public.bordas_recheadas FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Apenas admins podem gerenciar bordas" ON public.bordas_recheadas;
CREATE POLICY "Apenas admins podem gerenciar bordas"
    ON public.bordas_recheadas FOR ALL
    USING (true)  -- Adaptar
    WITH CHECK (true);

-- ----------
-- opcoes_sabores
-- ----------
DROP POLICY IF EXISTS "Permitir leitura pública de opções de sabores" ON public.opcoes_sabores;
CREATE POLICY "Permitir leitura pública de opções de sabores"
    ON public.opcoes_sabores FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Apenas admins podem gerenciar opções de sabores" ON public.opcoes_sabores;
CREATE POLICY "Apenas admins podem gerenciar opções de sabores"
    ON public.opcoes_sabores FOR ALL
    USING (true)  -- Adaptar
    WITH CHECK (true);

-- ----------
-- carousel_config
-- ----------
DROP POLICY IF EXISTS "Permitir leitura pública de configuração do carrossel" ON public.carousel_config;
CREATE POLICY "Permitir leitura pública de configuração do carrossel"
    ON public.carousel_config FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Apenas admins podem gerenciar configuração do carrossel" ON public.carousel_config;
CREATE POLICY "Apenas admins podem gerenciar configuração do carrossel"
    ON public.carousel_config FOR ALL
    USING (true)  -- Adaptar
    WITH CHECK (true);

-- ----------
-- carousel_images
-- ----------
DROP POLICY IF EXISTS "Permitir leitura pública de imagens do carrossel" ON public.carousel_images;
CREATE POLICY "Permitir leitura pública de imagens do carrossel"
    ON public.carousel_images FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Apenas admins podem gerenciar imagens do carrossel" ON public.carousel_images;
CREATE POLICY "Apenas admins podem gerenciar imagens do carrossel"
    ON public.carousel_images FOR ALL
    USING (true)  -- Adaptar
    WITH CHECK (true);

-- ----------
-- admins
-- ----------
DROP POLICY IF EXISTS "Apenas admins podem ver outros admins" ON public.admins;
CREATE POLICY "Apenas admins podem ver outros admins"
    ON public.admins FOR ALL
    USING (true)  -- Adaptar
    WITH CHECK (true);

-- ----------
-- pedidos
-- ----------
DROP POLICY IF EXISTS "Permitir criação de pedidos públicos" ON public.pedidos;
CREATE POLICY "Permitir criação de pedidos públicos"
    ON public.pedidos FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Apenas admins podem ver todos pedidos" ON public.pedidos;
CREATE POLICY "Apenas admins podem ver todos pedidos"
    ON public.pedidos FOR SELECT
    USING (true);  -- Adaptar

DROP POLICY IF EXISTS "Apenas admins podem atualizar pedidos" ON public.pedidos;
CREATE POLICY "Apenas admins podem atualizar pedidos"
    ON public.pedidos FOR UPDATE
    USING (true)  -- Adaptar
    WITH CHECK (true);

-- ----------
-- pedido_itens
-- ----------
DROP POLICY IF EXISTS "Permitir criação de itens de pedido" ON public.pedido_itens;
CREATE POLICY "Permitir criação de itens de pedido"
    ON public.pedido_itens FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir leitura de itens relacionados ao pedido" ON public.pedido_itens;
CREATE POLICY "Permitir leitura de itens relacionados ao pedido"
    ON public.pedido_itens FOR SELECT
    USING (true);

-- ============================================================================
-- PERMISSÕES
-- ============================================================================

-- Garantir permissões ao usuário público (anônimo)
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT INSERT ON public.pedidos TO anon;
GRANT INSERT ON public.pedido_itens TO anon;

-- Garantir permissões a usuários autenticados
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;

-- ============================================================================
-- FIM DO SCRIPT
-- ============================================================================

-- Mensagem de conclusão
DO $$
BEGIN
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'Schema criado com sucesso!';
    RAISE NOTICE 'Total de tabelas: 12';
    RAISE NOTICE 'Total de funções: 3';
    RAISE NOTICE 'Total de triggers: 5';
    RAISE NOTICE '============================================================';
END $$;
