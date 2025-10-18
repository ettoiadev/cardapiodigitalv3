-- ============================================================================
-- SCRIPT: 25-create-notificacoes-tables.sql
-- Descrição: Cria tabelas para sistema de notificações WhatsApp
-- Data: 2025-01-18
-- Versão: 1.0
-- ============================================================================
-- 
-- Este script cria as tabelas necessárias para o módulo de notificações:
-- 1. notificacoes_config - Configurações da API WhatsApp
-- 2. notificacoes_historico - Histórico de notificações enviadas
--
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. TABELA DE CONFIGURAÇÃO DE NOTIFICAÇÕES
-- ============================================================================

CREATE TABLE IF NOT EXISTS notificacoes_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key TEXT,
    api_url TEXT,
    ativo BOOLEAN DEFAULT false,
    notificar_novo_pedido BOOLEAN DEFAULT true,
    notificar_pedido_pronto BOOLEAN DEFAULT true,
    notificar_saiu_entrega BOOLEAN DEFAULT true,
    notificar_entregue BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE notificacoes_config IS 'Configurações de notificações WhatsApp';
COMMENT ON COLUMN notificacoes_config.api_key IS 'Chave de API do serviço de WhatsApp';
COMMENT ON COLUMN notificacoes_config.api_url IS 'URL da API do serviço de WhatsApp';
COMMENT ON COLUMN notificacoes_config.ativo IS 'Se as notificações automáticas estão ativas';
COMMENT ON COLUMN notificacoes_config.notificar_novo_pedido IS 'Notificar quando novo pedido é recebido';
COMMENT ON COLUMN notificacoes_config.notificar_pedido_pronto IS 'Notificar quando pedido está pronto';
COMMENT ON COLUMN notificacoes_config.notificar_saiu_entrega IS 'Notificar quando pedido sai para entrega';
COMMENT ON COLUMN notificacoes_config.notificar_entregue IS 'Notificar quando pedido é entregue';

-- ============================================================================
-- 2. TABELA DE HISTÓRICO DE NOTIFICAÇÕES
-- ============================================================================

CREATE TABLE IF NOT EXISTS notificacoes_historico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    telefone VARCHAR(20) NOT NULL,
    mensagem TEXT NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'pendente',
    pedido_id UUID REFERENCES pedidos(id) ON DELETE SET NULL,
    erro TEXT,
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE notificacoes_historico IS 'Histórico de notificações WhatsApp enviadas';
COMMENT ON COLUMN notificacoes_historico.telefone IS 'Número de telefone do destinatário';
COMMENT ON COLUMN notificacoes_historico.mensagem IS 'Conteúdo da mensagem enviada';
COMMENT ON COLUMN notificacoes_historico.tipo IS 'Tipo: novo_pedido, pedido_pronto, saiu_entrega, entregue, teste';
COMMENT ON COLUMN notificacoes_historico.status IS 'Status: pendente, enviada, falha';
COMMENT ON COLUMN notificacoes_historico.pedido_id IS 'Referência ao pedido (se aplicável)';
COMMENT ON COLUMN notificacoes_historico.erro IS 'Mensagem de erro (se status = falha)';

-- ============================================================================
-- 3. CRIAR ÍNDICES PARA PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_notificacoes_historico_criado_em 
ON notificacoes_historico(criado_em DESC);

CREATE INDEX IF NOT EXISTS idx_notificacoes_historico_status 
ON notificacoes_historico(status);

CREATE INDEX IF NOT EXISTS idx_notificacoes_historico_tipo 
ON notificacoes_historico(tipo);

CREATE INDEX IF NOT EXISTS idx_notificacoes_historico_pedido_id 
ON notificacoes_historico(pedido_id);

-- ============================================================================
-- 4. HABILITAR ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE notificacoes_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificacoes_historico ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 5. CRIAR POLICIES DE ACESSO
-- ============================================================================

-- Policy para notificacoes_config
DROP POLICY IF EXISTS "Permitir todas operações em notificacoes_config" ON notificacoes_config;
CREATE POLICY "Permitir todas operações em notificacoes_config"
ON notificacoes_config
FOR ALL
USING (true)
WITH CHECK (true);

-- Policy para notificacoes_historico
DROP POLICY IF EXISTS "Permitir todas operações em notificacoes_historico" ON notificacoes_historico;
CREATE POLICY "Permitir todas operações em notificacoes_historico"
ON notificacoes_historico
FOR ALL
USING (true)
WITH CHECK (true);

-- ============================================================================
-- 6. INSERIR CONFIGURAÇÃO PADRÃO
-- ============================================================================

INSERT INTO notificacoes_config (
    ativo,
    notificar_novo_pedido,
    notificar_pedido_pronto,
    notificar_saiu_entrega,
    notificar_entregue
) VALUES (
    false,
    true,
    true,
    true,
    true
)
ON CONFLICT DO NOTHING;

COMMIT;

-- ============================================================================
-- VERIFICAÇÃO PÓS-CRIAÇÃO
-- ============================================================================

-- Verificar se as tabelas foram criadas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'notificacoes_config'
    ) THEN
        RAISE EXCEPTION 'Tabela notificacoes_config não foi criada!';
    ELSE
        RAISE NOTICE '✅ Tabela notificacoes_config criada com sucesso!';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'notificacoes_historico'
    ) THEN
        RAISE EXCEPTION 'Tabela notificacoes_historico não foi criada!';
    ELSE
        RAISE NOTICE '✅ Tabela notificacoes_historico criada com sucesso!';
    END IF;
END $$;

-- Verificar registros
SELECT '📊 VERIFICAÇÃO DE DADOS' as info;
SELECT 
    'notificacoes_config' as tabela,
    COUNT(*) as registros,
    'Deve ter 1 registro padrão' as esperado
FROM notificacoes_config
UNION ALL
SELECT 
    'notificacoes_historico' as tabela,
    COUNT(*) as registros,
    'Deve estar vazio inicialmente' as esperado
FROM notificacoes_historico;

-- ============================================================================
-- FIM DO SCRIPT
-- ============================================================================

SELECT '✅ TABELAS DE NOTIFICAÇÕES CRIADAS COM SUCESSO!' as status;
SELECT 'Sistema de notificações WhatsApp está pronto para uso.' as mensagem;
