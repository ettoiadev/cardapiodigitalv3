-- ============================================================================
-- SCRIPT: 24-add-promocao-validation.sql
-- Descrição: Adiciona validação backend de promoções
-- Data: 2025-01-18
-- Versão: 1.0
-- ============================================================================

BEGIN;

-- Função para validar se pedido tem produtos em promoção
CREATE OR REPLACE FUNCTION pedido_tem_promocao(p_pedido_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    tem_promocao BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM pedido_itens pi
        INNER JOIN produtos p ON p.id = pi.produto_id
        WHERE pi.pedido_id = p_pedido_id
        AND p.promocao = true
        AND p.ativo = true
    ) INTO tem_promocao;
    
    RETURN tem_promocao;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION pedido_tem_promocao(UUID) IS 
'Verifica se um pedido contém produtos em promoção';

-- Função para validar regras de promoção
CREATE OR REPLACE FUNCTION validar_promocao_pedido(
    p_pedido_id UUID,
    p_tipo_entrega VARCHAR
)
RETURNS TABLE (
    valido BOOLEAN,
    mensagem TEXT
) AS $$
DECLARE
    tem_promocao BOOLEAN;
BEGIN
    -- Verificar se pedido tem produtos em promoção
    tem_promocao := pedido_tem_promocao(p_pedido_id);
    
    -- Regra: Promoções apenas para retirada no balcão
    IF tem_promocao AND p_tipo_entrega = 'delivery' THEN
        RETURN QUERY SELECT 
            false as valido,
            'Produtos em promoção disponíveis apenas para retirada no balcão' as mensagem;
        RETURN;
    END IF;
    
    -- Validação passou
    RETURN QUERY SELECT 
        true as valido,
        'Pedido válido' as mensagem;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validar_promocao_pedido(UUID, VARCHAR) IS 
'Valida regras de promoção para um pedido (ex: apenas balcão)';

-- Trigger para validar promoções antes de inserir/atualizar pedido
CREATE OR REPLACE FUNCTION trigger_validar_promocao()
RETURNS TRIGGER AS $$
DECLARE
    validacao RECORD;
BEGIN
    -- Validar apenas se pedido está sendo criado ou tipo_entrega mudou
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.tipo_entrega IS DISTINCT FROM NEW.tipo_entrega) THEN
        -- Executar validação
        SELECT * INTO validacao
        FROM validar_promocao_pedido(NEW.id, NEW.tipo_entrega)
        LIMIT 1;
        
        -- Se não for válido, bloquear operação
        IF NOT validacao.valido THEN
            RAISE EXCEPTION '%', validacao.mensagem;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger (comentado por padrão para não quebrar fluxo existente)
-- Descomente após testar em ambiente de desenvolvimento
/*
DROP TRIGGER IF EXISTS trigger_validar_promocao_pedido ON pedidos;

CREATE TRIGGER trigger_validar_promocao_pedido
BEFORE INSERT OR UPDATE ON pedidos
FOR EACH ROW
EXECUTE FUNCTION trigger_validar_promocao();
*/

COMMIT;

SELECT '✅ Funções de validação de promoção criadas' as status;
SELECT 'Trigger comentado - descomente após testes' as aviso;

-- Exemplo de uso
SELECT '📝 EXEMPLO DE USO:' as info;
SELECT 
    pedido_tem_promocao(id) as tem_promocao,
    tipo_entrega,
    numero_pedido
FROM pedidos
LIMIT 5;
