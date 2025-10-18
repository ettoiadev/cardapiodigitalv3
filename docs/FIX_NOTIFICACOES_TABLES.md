# ✅ Correção: Tabelas de Notificações WhatsApp

**Data:** 18 de Janeiro de 2025  
**Problema:** Erro 404 ao acessar `/admin/notificacoes`  
**Status:** ✅ **RESOLVIDO**

---

## 🐛 Problema Identificado

A página `/admin/notificacoes` estava apresentando erros no console:

```
GET https://umbjzrlajwzlclyemslv.supabase.co/rest/v1/notificacoes_historico?select=*&order=criado_em.desc&limit=50 404 (Not Found)
GET https://umbjzrlajwzlclyemslv.supabase.co/rest/v1/notificacoes_config?select=*&limit=1 404 (Not Found)
```

**Causa:** As tabelas `notificacoes_config` e `notificacoes_historico` não existiam no banco de dados.

**Hint do Supabase:** `Perhaps you meant the table 'public.pizzaria_config'`

---

## 🔧 Solução Implementada

### 1. Tabela `notificacoes_config`

Criada para armazenar configurações da API WhatsApp:

```sql
CREATE TABLE notificacoes_config (
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
```

**Campos:**
- `api_key` - Chave de autenticação da API
- `api_url` - URL da API do WhatsApp Business
- `ativo` - Flag para ativar/desativar notificações automáticas
- `notificar_*` - Flags para cada tipo de evento

### 2. Tabela `notificacoes_historico`

Criada para registrar histórico de notificações enviadas:

```sql
CREATE TABLE notificacoes_historico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    telefone VARCHAR(20) NOT NULL,
    mensagem TEXT NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'pendente',
    pedido_id UUID REFERENCES pedidos(id) ON DELETE SET NULL,
    erro TEXT,
    criado_em TIMESTAMPTZ DEFAULT NOW()
);
```

**Campos:**
- `telefone` - Número do destinatário
- `mensagem` - Conteúdo da mensagem
- `tipo` - Tipo de notificação (novo_pedido, pedido_pronto, saiu_entrega, entregue, teste)
- `status` - Status do envio (pendente, enviada, falha)
- `pedido_id` - Referência ao pedido (opcional)
- `erro` - Mensagem de erro se falhou

### 3. Índices Criados

Para otimizar consultas:

```sql
CREATE INDEX idx_notificacoes_historico_criado_em ON notificacoes_historico(criado_em DESC);
CREATE INDEX idx_notificacoes_historico_status ON notificacoes_historico(status);
CREATE INDEX idx_notificacoes_historico_tipo ON notificacoes_historico(tipo);
CREATE INDEX idx_notificacoes_historico_pedido_id ON notificacoes_historico(pedido_id);
```

### 4. Row Level Security (RLS)

Habilitado em ambas as tabelas com policies permissivas:

```sql
ALTER TABLE notificacoes_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificacoes_historico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir todas operações em notificacoes_config"
ON notificacoes_config FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Permitir todas operações em notificacoes_historico"
ON notificacoes_historico FOR ALL USING (true) WITH CHECK (true);
```

### 5. Registro Padrão

Inserido automaticamente na `notificacoes_config`:

```sql
INSERT INTO notificacoes_config (
    ativo,
    notificar_novo_pedido,
    notificar_pedido_pronto,
    notificar_saiu_entrega,
    notificar_entregue
) VALUES (
    false,  -- Desativado por padrão
    true,   -- Notificar novo pedido
    true,   -- Notificar pedido pronto
    true,   -- Notificar saiu para entrega
    true    -- Notificar entregue
);
```

---

## 📊 Verificação

### Status Atual das Tabelas:

| Tabela | Registros | Status |
|--------|-----------|--------|
| `notificacoes_config` | 1 | ✅ Criada |
| `notificacoes_historico` | 0 | ✅ Criada |

### Queries de Verificação:

```sql
-- Verificar estrutura
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('notificacoes_config', 'notificacoes_historico')
ORDER BY table_name, ordinal_position;

-- Verificar RLS
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('notificacoes_config', 'notificacoes_historico');

-- Verificar índices
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'notificacoes_historico';
```

---

## 🎯 Funcionalidades Disponíveis

Com as tabelas criadas, a página `/admin/notificacoes` agora oferece:

### 1. Configuração da API
- ✅ URL da API WhatsApp
- ✅ Chave de autenticação
- ✅ Ativar/desativar notificações automáticas
- ✅ Selecionar eventos para notificar

### 2. Envio de Teste
- ✅ Enviar mensagem de teste para qualquer número
- ✅ Validar configuração da API

### 3. Histórico de Envios
- ✅ Visualizar últimas 50 notificações
- ✅ Status de cada envio (enviada/falha)
- ✅ Tipo de notificação
- ✅ Data e hora de envio

### 4. Estatísticas
- ✅ Total de notificações enviadas
- ✅ Taxa de sucesso
- ✅ Taxa de falha

---

## 🔄 Integração com Pedidos

As notificações podem ser disparadas automaticamente quando:

1. **Novo Pedido** - Pedido criado (status: pendente)
2. **Pedido Pronto** - Status muda para em_preparo
3. **Saiu para Entrega** - Status muda para saiu_entrega
4. **Entregue** - Status muda para finalizado

Para implementar, adicionar trigger ou lógica no frontend ao atualizar status do pedido.

---

## 📝 Script SQL

O script completo está disponível em:
```
scripts/25-create-notificacoes-tables.sql
```

Para executar manualmente:
```bash
psql -h db.umbjzrlajwzlclyemslv.supabase.co -U postgres -d postgres -f scripts/25-create-notificacoes-tables.sql
```

Ou via Supabase SQL Editor:
1. Acessar: https://supabase.com/dashboard/project/umbjzrlajwzlclyemslv/editor
2. Colar conteúdo do script
3. Executar

---

## 🚀 Próximos Passos

### 1. Configurar API WhatsApp
- Escolher serviço (Twilio, MessageBird, Evolution API, etc.)
- Obter credenciais (API Key + URL)
- Configurar em `/admin/notificacoes`

### 2. Testar Envio
- Usar função "Enviar Mensagem de Teste"
- Verificar se mensagem é recebida
- Validar histórico

### 3. Ativar Notificações Automáticas
- Marcar checkbox "Ativar notificações automáticas"
- Selecionar eventos desejados
- Salvar configuração

### 4. Implementar Triggers (Opcional)
Criar função para enviar notificação automaticamente:

```sql
CREATE OR REPLACE FUNCTION enviar_notificacao_pedido()
RETURNS TRIGGER AS $$
BEGIN
    -- Verificar se notificações estão ativas
    IF EXISTS (
        SELECT 1 FROM notificacoes_config 
        WHERE ativo = true
    ) THEN
        -- Inserir no histórico (API externa deve processar)
        INSERT INTO notificacoes_historico (
            telefone,
            mensagem,
            tipo,
            pedido_id
        ) VALUES (
            NEW.telefone_cliente,
            'Seu pedido ' || NEW.numero_pedido || ' foi atualizado!',
            'status_atualizado',
            NEW.id
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notificar_pedido
AFTER UPDATE ON pedidos
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION enviar_notificacao_pedido();
```

---

## ⚠️ Observações Importantes

1. **Segurança da API Key**
   - Nunca expor a API Key no frontend
   - Usar variáveis de ambiente quando possível
   - Considerar criptografia no banco

2. **Custos**
   - Serviços de WhatsApp geralmente cobram por mensagem
   - Monitorar uso para evitar custos inesperados
   - Configurar limites se disponível

3. **Compliance**
   - Seguir regras do WhatsApp Business
   - Obter consentimento dos clientes
   - Permitir opt-out

4. **Rate Limiting**
   - APIs têm limites de requisições
   - Implementar fila se necessário
   - Adicionar retry logic para falhas

---

## 📞 Serviços Recomendados

### 1. **Twilio** (Oficial)
- Mais confiável
- Documentação completa
- Suporte oficial WhatsApp
- Custo: ~$0.005 por mensagem

### 2. **Evolution API** (Open Source)
- Gratuito (self-hosted)
- Baseado em Baileys
- Requer servidor próprio
- Risco de bloqueio

### 3. **MessageBird**
- Alternativa ao Twilio
- Preços competitivos
- Boa documentação

### 4. **Z-API**
- Solução brasileira
- Suporte em português
- Fácil integração

---

## ✅ Conclusão

As tabelas de notificações foram criadas com sucesso e a página `/admin/notificacoes` está totalmente funcional.

**Status:** ✅ **PRONTO PARA CONFIGURAÇÃO**

Próximo passo: Configurar credenciais da API WhatsApp escolhida.

---

**Última atualização:** 18/01/2025 às 21:00 (UTC-03:00)
