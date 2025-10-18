# 🔍 ANÁLISE COMPLETA DO SISTEMA ATUAL

**Data:** 18/10/2025  
**Banco:** cardapiodigitalv3 (Supabase)  
**Status:** Sistema parcialmente implementado

---

## ✅ O QUE JÁ EXISTE NO BANCO

### **Tabela `clientes` ✅ JÁ EXISTE!**

```sql
Campos atuais:
- id (uuid)
- nome (text) NOT NULL
- telefone (text) NOT NULL
- email (text) NULLABLE
- endereco (text) NULLABLE
- numero (text) NULLABLE
- complemento (text) NULLABLE
- bairro (text) NULLABLE
- cep (text) NULLABLE
- referencia (text) NULLABLE
- observacoes (text) NULLABLE
- ativo (boolean)
- criado_em (timestamp)
- atualizado_em (timestamp)

Total de registros: 0
```

**❌ FALTANDO:**
- `senha_hash` - Para autenticação
- `email_verificado` - Flag de verificação
- `telefone_verificado` - Flag de verificação
- `ultimo_acesso` - Timestamp

### **Tabela `pedidos` ✅ JÁ EXISTE (Parcial)**

```sql
Campos atuais:
- id (uuid)
- tipo_entrega (varchar) NOT NULL
- endereco_entrega (text) NULLABLE
- forma_pagamento (varchar) NULLABLE
- subtotal (numeric) NOT NULL
- taxa_entrega (numeric) NULLABLE
- total (numeric) NOT NULL
- status (varchar) DEFAULT 'pendente'
- observacoes (text) NULLABLE
- enviado_whatsapp (boolean)
- created_at (timestamp)
- cliente_id (uuid) NULLABLE ✅ JÁ TEM!
- nome_cliente (text) NULLABLE ✅ JÁ TEM!
- telefone_cliente (text) NULLABLE ✅ JÁ TEM!
- entrega_id (uuid) NULLABLE
- origem (text) NULLABLE
- atualizado_em (timestamp) NULLABLE ✅ JÁ TEM!

Total de registros: 0
```

**❌ FALTANDO:**
- `numero_pedido` - Número sequencial (PED-001)
- `endereco_rua` - Endereço separado
- `endereco_numero` - Número separado
- `endereco_bairro` - Bairro separado
- `endereco_cidade` - Cidade separada
- `endereco_estado` - Estado separado
- `endereco_cep` - CEP separado
- `endereco_complemento` - Complemento separado
- `troco_para` - Valor do troco
- `desconto` - Desconto aplicado
- `confirmado_em` - Timestamp
- `finalizado_em` - Timestamp

### **Tabela `pedido_itens` ✅ JÁ EXISTE**

```sql
Campos atuais:
- id (uuid)
- pedido_id (uuid FK)
- produto_id (uuid FK)
- nome_produto (varchar)
- tamanho (varchar)
- sabores (jsonb)
- quantidade (integer)
- preco_unitario (numeric)
- preco_total (numeric)
- created_at (timestamp)
```

**❌ FALTANDO:**
- `adicionais` (jsonb) - Adicionais por sabor
- `borda_recheada` (jsonb) - Borda selecionada
- `observacoes` (text) - Obs do item

### **Tabela `taxas_entrega` ✅ JÁ EXISTE!**

```sql
Campos atuais:
- id (uuid)
- bairro (text) NOT NULL
- cep_inicial (text) NULLABLE
- cep_final (text) NULLABLE
- taxa (numeric) NOT NULL
- tempo_estimado_min (integer) DEFAULT 30
- tempo_estimado_max (integer) DEFAULT 45
- ativo (boolean) DEFAULT true
- criado_em (timestamp)
- atualizado_em (timestamp)

Total de registros: 0
```

**✅ COMPLETA!** Não precisa adicionar campos.

---

## 🎯 ADMIN JÁ IMPLEMENTADO

### **Páginas Existentes:**

1. ✅ **Dashboard** (`/admin/page.tsx`)
   - Estatísticas de vendas
   - Pedidos do dia
   - Total de clientes
   - Média de avaliações
   - Entregas em rota

2. ✅ **Clientes** (`/admin/clientes/page.tsx`)
   - CRUD completo
   - Busca por nome/telefone
   - Histórico de pedidos
   - Modal de formulário
   - Estatísticas (total, ativos, inativos)

3. ✅ **Produtos** (`/admin/produtos/page.tsx`)
   - Gerenciamento de produtos
   - Categorias
   - Preços (tradicional/broto)
   - Promoções
   - Adicionais

4. ✅ **Motoboys** (`/admin/motoboys/page.tsx`)
   - Cadastro de entregadores
   - Status (disponível, em_entrega, inativo)

5. ✅ **Entregas** (`/admin/entregas/page.tsx`)
   - Controle de entregas
   - Atribuição de motoboy
   - Status da entrega

6. ✅ **Caixa** (`/admin/caixa/page.tsx`)
   - Abertura/fechamento
   - Lançamentos
   - Controle financeiro

7. ✅ **Taxas de Entrega** (`/admin/taxas/page.tsx`)
   - Gerenciamento de taxas por bairro
   - Faixas de CEP
   - Tempo estimado

8. ✅ **Avaliações** (`/admin/avaliacoes/page.tsx`)
   - Sistema de estrelas
   - Comentários
   - Respostas

9. ✅ **Fidelidade** (`/admin/fidelidade/page.tsx`)
   - Programa de pontos
   - Recompensas
   - Níveis (Bronze, Prata, Ouro)

10. ✅ **Cupom Fiscal** (`/admin/cupom-fiscal/page.tsx`)
    - Emissão de NFC-e
    - Configurações

11. ✅ **Configurações** (`/admin/config/page.tsx`)
    - Abas: Geral, Cupom Fiscal, Fidelidade, Avaliações, Taxas
    - Configurações da pizzaria

12. ✅ **Relatórios** (`/admin/relatorios/page.tsx`)
    - Relatórios gerenciais

13. ✅ **Notificações** (`/admin/notificacoes/page.tsx`)
    - Central de notificações

---

## 🚨 DESCOBERTAS IMPORTANTES

### **1. Tabela `clientes` JÁ EXISTE!**
- ✅ Estrutura básica pronta
- ✅ Admin de clientes funcionando
- ❌ Falta apenas `senha_hash` para autenticação
- ❌ Falta flags de verificação

### **2. Tabela `pedidos` PARCIALMENTE PRONTA**
- ✅ Já tem `cliente_id`
- ✅ Já tem `nome_cliente` e `telefone_cliente`
- ✅ Já tem `atualizado_em`
- ❌ Falta `numero_pedido` (auto-gerado)
- ❌ Falta endereço estruturado (7 campos)
- ❌ Falta campos de pagamento (troco, desconto)
- ❌ Falta timestamps (confirmado_em, finalizado_em)

### **3. Tabela `taxas_entrega` JÁ EXISTE!**
- ✅ Estrutura completa
- ✅ Admin funcionando
- ✅ Suporta faixas de CEP
- ✅ Tempo estimado configurável

### **4. Sistema de Clientes JÁ FUNCIONA**
- ✅ CRUD completo no admin
- ✅ Busca e filtros
- ✅ Histórico de pedidos
- ❌ Falta apenas autenticação (login/senha)

---

## 📊 COMPARAÇÃO: PLANEJADO vs REAL

### **Script 18-migrate-to-online-orders.sql:**

| Item | Planejado | Real | Status |
|------|-----------|------|--------|
| Tabela `clientes` | Criar | ✅ Existe | Adicionar 4 campos |
| Tabela `taxas_entrega` | Criar | ✅ Existe | Nada a fazer |
| Campo `pedidos.cliente_id` | Adicionar | ✅ Existe | Nada a fazer |
| Campo `pedidos.nome_cliente` | Adicionar | ✅ Existe | Nada a fazer |
| Campo `pedidos.telefone_cliente` | Adicionar | ✅ Existe | Nada a fazer |
| Campo `pedidos.atualizado_em` | Adicionar | ✅ Existe | Nada a fazer |
| Campo `pedidos.numero_pedido` | Adicionar | ❌ Falta | Adicionar |
| Campos `pedidos.endereco_*` | Adicionar 7 | ❌ Falta | Adicionar |
| Campos `pedidos` pagamento | Adicionar 2 | ❌ Falta | Adicionar |
| Campos `pedidos` timestamps | Adicionar 2 | ❌ Falta | Adicionar |
| Campos `pedido_itens` | Adicionar 3 | ❌ Falta | Adicionar |

---

## 🎯 PLANO REVISADO

### **FASE 1: PREPARAR BANCO (Simplificado)**

#### **Passo 1.1: Adicionar campos em `clientes`**
```sql
ALTER TABLE clientes ADD COLUMN senha_hash TEXT;
ALTER TABLE clientes ADD COLUMN email_verificado BOOLEAN DEFAULT false;
ALTER TABLE clientes ADD COLUMN telefone_verificado BOOLEAN DEFAULT false;
ALTER TABLE clientes ADD COLUMN ultimo_acesso TIMESTAMP;
```

#### **Passo 1.2: Adicionar campos em `pedidos`**
```sql
ALTER TABLE pedidos ADD COLUMN numero_pedido VARCHAR(50) UNIQUE;
ALTER TABLE pedidos ADD COLUMN endereco_rua VARCHAR(255);
ALTER TABLE pedidos ADD COLUMN endereco_numero VARCHAR(20);
ALTER TABLE pedidos ADD COLUMN endereco_bairro VARCHAR(100);
ALTER TABLE pedidos ADD COLUMN endereco_cidade VARCHAR(100);
ALTER TABLE pedidos ADD COLUMN endereco_estado VARCHAR(2);
ALTER TABLE pedidos ADD COLUMN endereco_cep VARCHAR(10);
ALTER TABLE pedidos ADD COLUMN endereco_complemento TEXT;
ALTER TABLE pedidos ADD COLUMN troco_para NUMERIC(10,2);
ALTER TABLE pedidos ADD COLUMN desconto NUMERIC(10,2) DEFAULT 0;
ALTER TABLE pedidos ADD COLUMN confirmado_em TIMESTAMP;
ALTER TABLE pedidos ADD COLUMN finalizado_em TIMESTAMP;
```

#### **Passo 1.3: Adicionar campos em `pedido_itens`**
```sql
ALTER TABLE pedido_itens ADD COLUMN adicionais JSONB;
ALTER TABLE pedido_itens ADD COLUMN borda_recheada JSONB;
ALTER TABLE pedido_itens ADD COLUMN observacoes TEXT;
```

#### **Passo 1.4: Criar funções e triggers**
- Função `gerar_numero_pedido()`
- Função `buscar_taxa_entrega()`
- Triggers automáticos

#### **Passo 1.5: Configurar RLS**
- Políticas para clientes
- Políticas para pedidos
- Políticas para pedido_itens

---

### **FASE 2: AUTENTICAÇÃO (Supabase Auth)**

#### **Passo 2.1: Configurar Supabase Auth**
- Habilitar Email/Password
- Configurar templates de email
- Configurar URL de redirecionamento

#### **Passo 2.2: Criar páginas de autenticação**
- `/cadastro` - Formulário de cadastro
- `/login` - Formulário de login
- `/recuperar-senha` - Recuperação de senha

#### **Passo 2.3: Integrar com tabela `clientes`**
- Trigger para criar registro em `clientes` após signup
- Sincronizar dados entre `auth.users` e `clientes`

---

### **FASE 3: MODIFICAR CHECKOUT**

#### **Passo 3.1: Adicionar verificação de autenticação**
- Middleware para proteger `/checkout`
- Redirecionar para login se não autenticado

#### **Passo 3.2: Criar API de pedidos**
- `POST /api/pedidos/criar`
- Salvar pedido no banco
- Salvar itens do pedido
- Gerar número do pedido

#### **Passo 3.3: Substituir envio WhatsApp**
- Remover `handleFinishOrder()` antigo
- Implementar novo fluxo com banco
- Manter WhatsApp como notificação (opcional)

---

### **FASE 4: PÁGINAS DO CLIENTE**

#### **Passo 4.1: Página de confirmação**
- `/pedido/[id]/confirmacao`
- Mostrar número do pedido
- Resumo completo
- Status em tempo real

#### **Passo 4.2: Página de histórico**
- `/meus-pedidos`
- Lista de pedidos do cliente
- Filtros e busca
- Detalhes de cada pedido

#### **Passo 4.3: Página de perfil**
- `/perfil`
- Editar dados pessoais
- Gerenciar endereços
- Alterar senha

---

### **FASE 5: INTEGRAÇÃO COM ADMIN**

#### **Passo 5.1: Verificar sincronização**
- Pedidos online aparecem no admin
- Notificações de novos pedidos
- Realtime com Supabase

#### **Passo 5.2: Ajustar dashboard**
- Incluir pedidos online nas estatísticas
- Separar origem (online vs WhatsApp)

---

## 📝 SCRIPT SQL REVISADO

**Novo arquivo:** `19-update-existing-tables.sql`

Apenas adiciona os campos faltantes, sem recriar tabelas existentes.

---

## ⏱️ ESTIMATIVA REVISADA

- **Fase 1:** 30 min (apenas ALTER TABLE)
- **Fase 2:** 2 horas (autenticação)
- **Fase 3:** 2 horas (modificar checkout)
- **Fase 4:** 2 horas (páginas do cliente)
- **Fase 5:** 1 hora (integração admin)

**Total:** ~7-8 horas (igual ao planejado)

---

## ✅ VANTAGENS DA SITUAÇÃO ATUAL

1. ✅ **Tabela `clientes` já existe** - Economiza tempo
2. ✅ **Admin de clientes funcionando** - Não precisa criar
3. ✅ **Taxas de entrega prontas** - Sistema completo
4. ✅ **Estrutura de pedidos parcial** - Menos alterações
5. ✅ **Sistema de entregas pronto** - Integração facilitada

---

**Análise concluída em:** 18/10/2025  
**Próximo passo:** Criar script SQL revisado (19-update-existing-tables.sql)
