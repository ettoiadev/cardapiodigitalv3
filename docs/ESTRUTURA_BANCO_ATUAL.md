# 🗄️ ESTRUTURA DO BANCO DE DADOS - ANÁLISE COMPLETA

**Data:** 18/10/2025  
**Status:** Sistema sem autenticação (WhatsApp)

---

## ⚠️ SITUAÇÃO CRÍTICA IDENTIFICADA

### **Tabela `clientes` foi REMOVIDA!**

O script `11-remove-clientes-functionality.sql` removeu:
- ❌ Tabela `clientes` completa
- ❌ Foreign key `pedidos.cliente_id`
- ❌ Coluna `cliente_id` da tabela `pedidos`
- ❌ Políticas RLS relacionadas

**Motivo:** Sistema estava usando apenas WhatsApp, não precisava de clientes cadastrados.

---

## 📊 ESTRUTURA ATUAL DAS TABELAS

### **1. Tabela: `pedidos`** ✅ (Existe, mas incompleta)

```sql
CREATE TABLE public.pedidos (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo_entrega        VARCHAR NOT NULL,           -- 'delivery' ou 'balcao'
    endereco_entrega    TEXT,                       -- Endereço completo
    forma_pagamento     VARCHAR,                    -- Forma de pagamento
    subtotal            NUMERIC NOT NULL,           -- Subtotal dos produtos
    taxa_entrega        NUMERIC,                    -- Taxa de entrega
    total               NUMERIC NOT NULL,           -- Total final
    status              VARCHAR DEFAULT 'pendente', -- Status do pedido
    observacoes         TEXT,                       -- Observações
    enviado_whatsapp    BOOLEAN DEFAULT false,      -- Flag de envio WhatsApp
    created_at          TIMESTAMP DEFAULT NOW()
);
```

**Status possíveis:**
- `pendente` (padrão)
- `confirmado`
- `em_preparo`
- `saiu_entrega`
- `finalizado`
- `cancelado`

**❌ Campos FALTANDO:**
- `cliente_id` (UUID) - Relacionamento com cliente
- `numero_pedido` (VARCHAR) - Número sequencial do pedido
- `nome_cliente` (VARCHAR) - Nome do cliente (temporário)
- `telefone_cliente` (VARCHAR) - Telefone do cliente (temporário)
- `endereco_rua` (VARCHAR) - Rua separada
- `endereco_numero` (VARCHAR) - Número separado
- `endereco_bairro` (VARCHAR) - Bairro separado
- `endereco_cidade` (VARCHAR) - Cidade separada
- `endereco_estado` (VARCHAR) - Estado separado
- `endereco_cep` (VARCHAR) - CEP separado
- `endereco_complemento` (TEXT) - Complemento/Referência
- `troco_para` (NUMERIC) - Valor do troco (se dinheiro)
- `desconto` (NUMERIC) - Desconto aplicado
- `updated_at` (TIMESTAMP) - Data de atualização
- `confirmado_em` (TIMESTAMP) - Data de confirmação
- `finalizado_em` (TIMESTAMP) - Data de finalização

---

### **2. Tabela: `pedido_itens`** ✅ (Existe, mas incompleta)

```sql
CREATE TABLE public.pedido_itens (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id         UUID REFERENCES pedidos(id) ON DELETE CASCADE,
    produto_id        UUID REFERENCES produtos(id) ON DELETE SET NULL,
    nome_produto      VARCHAR NOT NULL,            -- Snapshot do nome
    tamanho           VARCHAR,                     -- 'broto' ou 'tradicional'
    sabores           JSONB,                       -- Array de sabores
    quantidade        INTEGER NOT NULL DEFAULT 1,
    preco_unitario    NUMERIC NOT NULL,
    preco_total       NUMERIC NOT NULL,
    created_at        TIMESTAMP DEFAULT NOW()
);
```

**❌ Campos FALTANDO:**
- `adicionais` (JSONB) - Adicionais selecionados
- `borda_recheada` (JSONB) - Borda recheada selecionada
- `observacoes` (TEXT) - Observações do item

**Estrutura JSONB necessária:**

```json
// adicionais
[
  {
    "sabor": "Calabresa",
    "itens": [
      { "nome": "Cebola", "preco": 2.00 },
      { "nome": "Azeitona", "preco": 3.00 }
    ]
  }
]

// borda_recheada
{
  "id": "uuid",
  "nome": "Catupiry",
  "preco": 5.00
}
```

---

### **3. Tabela: `clientes`** ❌ (NÃO EXISTE - Precisa ser criada)

```sql
-- PRECISA SER CRIADA
CREATE TABLE public.clientes (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome              VARCHAR(255) NOT NULL,
    email             VARCHAR(255) UNIQUE,
    telefone          VARCHAR(20) NOT NULL,
    senha_hash        TEXT,                        -- Hash bcrypt da senha
    
    -- Endereço padrão (opcional)
    endereco_rua      VARCHAR(255),
    endereco_numero   VARCHAR(20),
    endereco_bairro   VARCHAR(100),
    endereco_cidade   VARCHAR(100),
    endereco_estado   VARCHAR(2),
    endereco_cep      VARCHAR(10),
    endereco_complemento TEXT,
    
    -- Metadados
    ativo             BOOLEAN DEFAULT true,
    email_verificado  BOOLEAN DEFAULT false,
    telefone_verificado BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at        TIMESTAMP DEFAULT NOW(),
    updated_at        TIMESTAMP DEFAULT NOW(),
    ultimo_acesso     TIMESTAMP
);
```

**Índices necessários:**
```sql
CREATE UNIQUE INDEX idx_clientes_email ON clientes(email);
CREATE INDEX idx_clientes_telefone ON clientes(telefone);
CREATE INDEX idx_clientes_ativo ON clientes(ativo);
```

---

### **4. Outras Tabelas Importantes** ✅

#### **4.1. `pizzaria_config`** - Configurações da loja
```sql
CREATE TABLE public.pizzaria_config (
    id                      UUID PRIMARY KEY,
    nome                    VARCHAR NOT NULL,
    foto_capa               TEXT,
    foto_perfil             TEXT,
    taxa_entrega            NUMERIC DEFAULT 0,       -- Taxa fixa
    tempo_entrega_min       INTEGER DEFAULT 60,
    tempo_entrega_max       INTEGER DEFAULT 90,
    valor_minimo            NUMERIC DEFAULT 20.00,
    aceita_dinheiro         BOOLEAN DEFAULT true,
    aceita_cartao           BOOLEAN DEFAULT true,
    aceita_pix              BOOLEAN DEFAULT true,
    aceita_ticket_alimentacao BOOLEAN DEFAULT false,
    endereco                TEXT,
    telefone                VARCHAR(20),
    whatsapp                VARCHAR(20),
    horario_funcionamento   JSONB,
    created_at              TIMESTAMP DEFAULT NOW(),
    updated_at              TIMESTAMP DEFAULT NOW()
);
```

#### **4.2. `produtos`** - Produtos do cardápio
```sql
CREATE TABLE public.produtos (
    id                          UUID PRIMARY KEY,
    categoria_id                UUID REFERENCES categorias(id),
    nome                        VARCHAR NOT NULL,
    descricao                   TEXT,
    preco_tradicional           NUMERIC,
    preco_broto                 NUMERIC,
    preco_promocional_tradicional NUMERIC,
    preco_promocional_broto     NUMERIC,
    tipo                        VARCHAR DEFAULT 'salgada',
    ativo                       BOOLEAN DEFAULT true,
    promocao                    BOOLEAN DEFAULT false,
    ordem                       INTEGER DEFAULT 0,
    adicionais                  JSONB,           -- Array de adicionais
    created_at                  TIMESTAMP DEFAULT NOW()
);
```

#### **4.3. `categorias`** - Categorias de produtos
```sql
CREATE TABLE public.categorias (
    id                      UUID PRIMARY KEY,
    nome                    VARCHAR NOT NULL,
    descricao               TEXT,
    ordem                   INTEGER DEFAULT 0,
    ativo                   BOOLEAN DEFAULT true,
    multi_sabores_habilitado BOOLEAN DEFAULT false,
    created_at              TIMESTAMP DEFAULT NOW()
);
```

#### **4.4. `bordas_recheadas`** - Opções de bordas
```sql
CREATE TABLE public.bordas_recheadas (
    id          UUID PRIMARY KEY,
    nome        VARCHAR NOT NULL,
    preco       NUMERIC NOT NULL,
    ativo       BOOLEAN DEFAULT true,
    ordem       INTEGER DEFAULT 0,
    created_at  TIMESTAMP DEFAULT NOW()
);
```

#### **4.5. `admins`** - Usuários administradores
```sql
CREATE TABLE public.admins (
    id              UUID PRIMARY KEY,
    nome            VARCHAR NOT NULL,
    email           VARCHAR NOT NULL UNIQUE,
    senha_hash      TEXT NOT NULL,
    ativo           BOOLEAN DEFAULT true,
    ultimo_acesso   TIMESTAMP,
    created_at      TIMESTAMP DEFAULT NOW()
);
```

---

## 🚨 CAMPOS FALTANTES - RESUMO

### **Tabela `clientes` (PRECISA SER CRIADA):**
- ✅ Estrutura completa definida acima
- ✅ Suporta autenticação (senha_hash)
- ✅ Endereço padrão opcional
- ✅ Campos de verificação (email, telefone)

### **Tabela `pedidos` (PRECISA SER ALTERADA):**
```sql
-- Adicionar campos de cliente
ALTER TABLE pedidos ADD COLUMN cliente_id UUID REFERENCES clientes(id);
ALTER TABLE pedidos ADD COLUMN numero_pedido VARCHAR(50) UNIQUE;
ALTER TABLE pedidos ADD COLUMN nome_cliente VARCHAR(255);
ALTER TABLE pedidos ADD COLUMN telefone_cliente VARCHAR(20);

-- Separar endereço em campos
ALTER TABLE pedidos ADD COLUMN endereco_rua VARCHAR(255);
ALTER TABLE pedidos ADD COLUMN endereco_numero VARCHAR(20);
ALTER TABLE pedidos ADD COLUMN endereco_bairro VARCHAR(100);
ALTER TABLE pedidos ADD COLUMN endereco_cidade VARCHAR(100);
ALTER TABLE pedidos ADD COLUMN endereco_estado VARCHAR(2);
ALTER TABLE pedidos ADD COLUMN endereco_cep VARCHAR(10);
ALTER TABLE pedidos ADD COLUMN endereco_complemento TEXT;

-- Campos de pagamento
ALTER TABLE pedidos ADD COLUMN troco_para NUMERIC;
ALTER TABLE pedidos ADD COLUMN desconto NUMERIC DEFAULT 0;

-- Timestamps
ALTER TABLE pedidos ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
ALTER TABLE pedidos ADD COLUMN confirmado_em TIMESTAMP;
ALTER TABLE pedidos ADD COLUMN finalizado_em TIMESTAMP;
```

### **Tabela `pedido_itens` (PRECISA SER ALTERADA):**
```sql
ALTER TABLE pedido_itens ADD COLUMN adicionais JSONB;
ALTER TABLE pedido_itens ADD COLUMN borda_recheada JSONB;
ALTER TABLE pedido_itens ADD COLUMN observacoes TEXT;
```

---

## 📋 NOVA TABELA NECESSÁRIA: `taxas_entrega`

**Função:** Taxas de entrega por bairro/CEP (já está no admin)

```sql
CREATE TABLE public.taxas_entrega (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bairro      VARCHAR(100) NOT NULL,
    cidade      VARCHAR(100),
    cep         VARCHAR(10),
    taxa        NUMERIC NOT NULL,
    tempo_min   INTEGER,          -- Tempo mínimo em minutos
    tempo_max   INTEGER,          -- Tempo máximo em minutos
    ativo       BOOLEAN DEFAULT true,
    ordem       INTEGER DEFAULT 0,
    created_at  TIMESTAMP DEFAULT NOW(),
    updated_at  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_taxas_bairro ON taxas_entrega(bairro);
CREATE INDEX idx_taxas_cep ON taxas_entrega(cep);
CREATE INDEX idx_taxas_ativo ON taxas_entrega(ativo);
```

---

## 🔐 TABELAS PARA AUTENTICAÇÃO

### **Opção 1: Usar Supabase Auth (Recomendado)**
- ✅ Autenticação nativa do Supabase
- ✅ Gerenciamento de sessões
- ✅ Recuperação de senha
- ✅ Verificação de email
- ✅ OAuth (Google, Facebook, etc.)

**Integração:**
```typescript
// Criar cliente com email/senha
const { data, error } = await supabase.auth.signUp({
  email: 'cliente@email.com',
  password: 'senha123',
  options: {
    data: {
      nome: 'João Silva',
      telefone: '(12) 99999-9999'
    }
  }
})

// Criar registro na tabela clientes
await supabase.from('clientes').insert({
  id: data.user.id,  // Usar mesmo ID do auth.users
  nome: 'João Silva',
  email: 'cliente@email.com',
  telefone: '(12) 99999-9999'
})
```

### **Opção 2: Autenticação customizada**
- ⚠️ Mais trabalhoso
- ⚠️ Precisa implementar segurança
- ⚠️ Gerenciar tokens JWT manualmente

---

## 📊 RELACIONAMENTOS

```
clientes (1) ──────────────► (N) pedidos
                                    │
                                    │ (1)
                                    │
                                    ▼
                                 (N) pedido_itens
                                    │
                                    │ (N)
                                    │
                                    ▼
                                 (1) produtos

pedidos (N) ◄────────────────── (1) taxas_entrega
            (cálculo dinâmico por bairro/CEP)

produtos (N) ◄────────────────── (1) categorias

produtos (N) ◄────────────────── (N) bordas_recheadas
            (relacionamento indireto via JSONB)
```

---

## 🔒 POLÍTICAS RLS (Row Level Security)

### **Para tabela `clientes`:**
```sql
-- Habilitar RLS
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

-- Cliente pode ler apenas seus próprios dados
CREATE POLICY "Clientes podem ver próprios dados"
ON clientes FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Cliente pode atualizar apenas seus próprios dados
CREATE POLICY "Clientes podem atualizar próprios dados"
ON clientes FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- Admin pode ver todos
CREATE POLICY "Admin pode ver todos clientes"
ON clientes FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE id = auth.uid() AND ativo = true
  )
);
```

### **Para tabela `pedidos`:**
```sql
-- Habilitar RLS
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;

-- Cliente pode ver apenas seus próprios pedidos
CREATE POLICY "Clientes podem ver próprios pedidos"
ON pedidos FOR SELECT
TO authenticated
USING (cliente_id = auth.uid());

-- Cliente pode criar pedidos
CREATE POLICY "Clientes podem criar pedidos"
ON pedidos FOR INSERT
TO authenticated
WITH CHECK (cliente_id = auth.uid());

-- Admin pode ver todos
CREATE POLICY "Admin pode ver todos pedidos"
ON pedidos FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE id = auth.uid() AND ativo = true
  )
);
```

---

## 🎯 RESUMO - O QUE PRECISA SER FEITO

### **1. Criar tabelas:**
- [ ] `clientes` (completa)
- [ ] `taxas_entrega` (completa)

### **2. Alterar tabelas existentes:**
- [ ] `pedidos` (14 novos campos)
- [ ] `pedido_itens` (3 novos campos)

### **3. Criar índices:**
- [ ] Índices em `clientes` (email, telefone)
- [ ] Índices em `taxas_entrega` (bairro, CEP)
- [ ] Índices em `pedidos` (numero_pedido, cliente_id, status)

### **4. Configurar segurança:**
- [ ] Habilitar RLS em `clientes`
- [ ] Habilitar RLS em `pedidos`
- [ ] Criar políticas de acesso
- [ ] Configurar Supabase Auth

### **5. Criar funções auxiliares:**
- [ ] Gerar número de pedido sequencial
- [ ] Calcular taxa de entrega por CEP/bairro
- [ ] Atualizar timestamps automaticamente
- [ ] Validar dados de pedido

---

## 📝 SCRIPT SQL COMPLETO

Será criado no **Passo 3** um script SQL completo para:
1. Criar tabela `clientes`
2. Criar tabela `taxas_entrega`
3. Adicionar campos em `pedidos`
4. Adicionar campos em `pedido_itens`
5. Criar índices
6. Configurar RLS
7. Criar funções auxiliares

---

## ✅ COMPATIBILIDADE COM DADOS ATUAIS

**Todos os campos novos são NULLABLE ou tem DEFAULT:**
- ✅ Pedidos antigos continuarão funcionando
- ✅ Não quebra dados existentes
- ✅ Migração segura
- ✅ Retrocompatível

**Campos temporários (sem autenticação):**
- `nome_cliente` - Usado quando cliente não está logado
- `telefone_cliente` - Usado quando cliente não está logado
- Se `cliente_id` for NULL, usa campos temporários

---

## 🎯 PRÓXIMO PASSO

**Passo 3:** Criar script SQL de migração completo

**Documentação criada em:** 18/10/2025  
**Última atualização:** 18/10/2025  
**Responsável:** Sistema de Migração
