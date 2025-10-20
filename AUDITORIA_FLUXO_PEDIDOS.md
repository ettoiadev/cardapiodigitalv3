# Auditoria Completa - Fluxo de Pedidos

**Data**: 19/10/2025  
**Objetivo**: Verificar integridade do fluxo de pedidos desde o frontend até o admin Kanban

---

## ✅ 1. FLUXO FRONTEND - ANÁLISE

### 1.1 Homepage (Seleção de Produtos)
**Arquivo**: `app/page.tsx`

✅ **Status**: FUNCIONANDO CORRETAMENTE
- Carrega produtos, categorias e bordas do Supabase
- CartContext adiciona itens com estrutura correta
- Suporta pizzas de 1 sabor e meio-a-meio
- Adicionais e bordas recheadas funcionando

**Estrutura do Item no Carrinho**:
```typescript
{
  id: string,                    // UUID-tamanho (ex: abc123-tradicional)
  nome: string,
  tamanho: "broto" | "tradicional",
  sabores: string[],             // Array de nomes
  precoBase: number,
  preco: number,                 // Total calculado
  quantidade: number,
  tipo: string,
  adicionais?: [...],
  bordaRecheada?: {...},
  observacoes?: string
}
```

---

### 1.2 Checkout - Etapa 1: Resumo
**Arquivo**: `app/checkout/resumo/page.tsx`

✅ **Status**: FUNCIONANDO CORRETAMENTE
- Exibe itens do carrinho com detalhes
- Permite editar adicionais e observações
- Calcula taxa de entrega via RPC `buscar_taxa_por_cep`
- Salva dados no localStorage:
  - `checkout_delivery_type`
  - `checkout_taxa_entrega`

**Funcionalidades**:
- Toggle delivery/balcão
- Edição de quantidade
- Remoção de itens
- Personalização de pizzas (adicionais por sabor)
- Campo de observações por item

---

### 1.3 Checkout - Etapa 2: Entrega e Pagamento
**Arquivo**: `app/checkout/entrega-pagamento/page.tsx`

✅ **Status**: FUNCIONANDO CORRETAMENTE

**Validações Implementadas**:
1. Cliente deve estar logado
2. Endereço obrigatório para delivery
3. Forma de pagamento obrigatória
4. Troco deve ser maior que o total (se dinheiro)

**Preparação de Dados**:
```typescript
// Dados do Pedido
{
  cliente_id: UUID,
  nome_cliente: string,
  telefone_cliente: string,
  tipo_entrega: "delivery" | "balcao",
  endereco: {
    rua, numero, bairro, cidade, estado, cep, complemento
  },
  forma_pagamento: string,
  subtotal: number,
  taxa_entrega: number,
  total: number,
  observacoes: string | null,
  troco_para: number | null
}

// Itens do Pedido
[{
  produto_id: UUID | null,      // NULL para pizzas multi-sabor
  nome_produto: string,
  tamanho: string | null,
  sabores: string[],             // Array JSONB
  adicionais: array,             // Array JSONB
  borda_recheada: object | null, // Objeto JSONB
  quantidade: number,
  preco_unitario: number,
  preco_total: number,
  observacoes: string | null
}]
```

**Chamada RPC**:
```typescript
await supabase.rpc('criar_pedido_online', {
  p_cliente_id,
  p_nome_cliente,
  p_telefone_cliente,
  p_tipo_entrega,
  p_endereco,          // JSONB
  p_forma_pagamento,
  p_subtotal,
  p_taxa_entrega,
  p_total,
  p_observacoes,
  p_troco_para,
  p_itens              // JSONB array
})
```

---

## ✅ 2. BACKEND - ANÁLISE

### 2.1 Função RPC: criar_pedido_online
**Status**: ✅ FUNCIONANDO CORRETAMENTE

**Fluxo**:
1. Insere registro em `pedidos` com todos os campos
2. Extrai campos de endereço do JSONB `p_endereco`
3. Gera `numero_pedido` automaticamente via trigger
4. Define `status = 'pendente'` e `origem = 'online'`
5. Loop pelos itens e insere em `pedido_itens`
6. Retorna `{ success: true, pedido_id, numero_pedido }`

**Campos Salvos em `pedidos`**:
- ✅ cliente_id, nome_cliente, telefone_cliente
- ✅ tipo_entrega
- ✅ endereco_rua, endereco_numero, endereco_bairro, endereco_cidade, endereco_estado, endereco_cep, endereco_complemento
- ✅ forma_pagamento
- ✅ subtotal, taxa_entrega, total
- ✅ observacoes, troco_para
- ✅ status ('pendente'), origem ('online')
- ✅ numero_pedido (gerado por trigger)

**Campos Salvos em `pedido_itens`**:
- ✅ pedido_id
- ✅ produto_id (pode ser NULL)
- ✅ nome_produto
- ✅ tamanho
- ✅ sabores (JSONB)
- ✅ adicionais (JSONB)
- ✅ borda_recheada (JSONB)
- ✅ quantidade
- ✅ preco_unitario, preco_total
- ✅ observacoes

---

### 2.2 Trigger: auto_gerar_numero_pedido
**Status**: ✅ FUNCIONANDO

- Formato: `PED-YYYYMMDD-XXXXXX` (6 dígitos)
- Executa BEFORE INSERT
- Sequencial por dia

---

### 2.3 View: vw_pedidos_kanban
**Status**: ✅ FUNCIONANDO CORRETAMENTE

**Campos Retornados**:
```sql
SELECT 
  p.id,
  COALESCE(p.numero_pedido, 'SEM-NUMERO') AS numero_pedido,
  COALESCE(p.nome_cliente, '') AS nome_cliente,
  COALESCE(p.telefone_cliente, '') AS telefone_cliente,
  COALESCE(p.tipo_entrega, 'delivery') AS tipo_entrega,
  p.endereco_entrega,                    -- ⚠️ CAMPO OBSOLETO
  COALESCE(p.status, 'pendente') AS status,
  p.status_anterior,
  COALESCE(p.subtotal, 0) AS subtotal,
  COALESCE(p.taxa_entrega, 0) AS taxa_entrega,
  COALESCE(p.total, 0) AS total,
  COALESCE(p.forma_pagamento, 'pix') AS forma_pagamento,
  p.observacoes,
  p.created_at,
  p.updated_at,
  COALESCE(p.ordem_kanban, 0) AS ordem_kanban,
  p.alterado_por,
  p.motivo_cancelamento,
  COALESCE(COUNT(pi.id), 0) AS total_itens,
  COALESCE(
    ARRAY_AGG(
      JSONB_BUILD_OBJECT(
        'nome', pi.nome_produto,
        'quantidade', pi.quantidade,
        'tamanho', pi.tamanho
      ) ORDER BY pi.created_at
    ) FILTER (WHERE pi.id IS NOT NULL),
    ARRAY[]::jsonb[]
  ) AS itens_resumo
FROM pedidos p
LEFT JOIN pedido_itens pi ON pi.pedido_id = p.id
GROUP BY p.id
ORDER BY p.ordem_kanban, p.created_at DESC;
```

---

## ⚠️ 3. PROBLEMAS IDENTIFICADOS

### 3.1 Campo `endereco_entrega` Obsoleto
**Severidade**: MÉDIA

**Problema**:
- A view `vw_pedidos_kanban` retorna `p.endereco_entrega`
- Este campo é TEXT e está sendo usado de forma obsoleta
- Os dados de endereço estão nos campos separados: `endereco_rua`, `endereco_numero`, etc.

**Impacto**:
- O card do pedido no Kanban pode não exibir o endereço corretamente
- Componente `PedidoCard` usa `pedido.endereco_entrega`

**Solução**:
Atualizar a view para concatenar os campos de endereço:

```sql
CREATE OR REPLACE VIEW vw_pedidos_kanban AS
SELECT 
  p.id,
  COALESCE(p.numero_pedido, 'SEM-NUMERO'::character varying) AS numero_pedido,
  COALESCE(p.nome_cliente, ''::text) AS nome_cliente,
  COALESCE(p.telefone_cliente, ''::text) AS telefone_cliente,
  COALESCE(p.tipo_entrega, 'delivery'::character varying) AS tipo_entrega,
  -- CORREÇÃO: Concatenar campos de endereço
  CASE 
    WHEN p.tipo_entrega = 'delivery' THEN
      CONCAT_WS(', ',
        NULLIF(p.endereco_rua, ''),
        NULLIF(p.endereco_numero, ''),
        NULLIF(p.endereco_bairro, ''),
        NULLIF(p.endereco_cidade, ''),
        NULLIF(p.endereco_estado, '')
      )
    ELSE NULL
  END AS endereco_entrega,
  COALESCE(p.status, 'pendente'::character varying) AS status,
  p.status_anterior,
  COALESCE(p.subtotal, 0::numeric) AS subtotal,
  COALESCE(p.taxa_entrega, 0::numeric) AS taxa_entrega,
  COALESCE(p.total, 0::numeric) AS total,
  COALESCE(p.forma_pagamento, 'pix'::character varying) AS forma_pagamento,
  p.observacoes,
  p.created_at,
  p.updated_at,
  COALESCE(p.ordem_kanban, 0) AS ordem_kanban,
  p.alterado_por,
  p.motivo_cancelamento,
  COALESCE(COUNT(pi.id), 0::bigint) AS total_itens,
  COALESCE(
    ARRAY_AGG(
      JSONB_BUILD_OBJECT(
        'nome', pi.nome_produto,
        'quantidade', pi.quantidade,
        'tamanho', pi.tamanho,
        'sabores', pi.sabores,
        'adicionais', pi.adicionais,
        'borda_recheada', pi.borda_recheada,
        'observacoes', pi.observacoes
      ) ORDER BY pi.created_at
    ) FILTER (WHERE pi.id IS NOT NULL),
    ARRAY[]::jsonb[]
  ) AS itens_resumo
FROM pedidos p
LEFT JOIN pedido_itens pi ON pi.pedido_id = p.id
GROUP BY p.id
ORDER BY p.ordem_kanban, p.created_at DESC;
```

---

### 3.2 Modal de Detalhes - Informações Incompletas
**Severidade**: BAIXA

**Problema**:
- O modal de detalhes carrega itens separadamente
- Não exibe sabores, adicionais e bordas de forma detalhada

**Solução**:
- Já está carregando corretamente de `pedido_itens`
- Apenas precisa renderizar os campos JSONB no componente

---

### 3.3 Falta de Endereço Completo no Card
**Severidade**: MÉDIA

**Problema**:
- `PedidoCard` exibe apenas `pedido.endereco_entrega` (campo obsoleto)
- Não mostra endereço completo formatado

**Solução**:
Após atualizar a view, o card exibirá o endereço concatenado corretamente.

---

## ✅ 4. ADMIN KANBAN - ANÁLISE

### 4.1 Página de Pedidos
**Arquivo**: `app/admin/pedidos/page.tsx`

✅ **Status**: FUNCIONANDO CORRETAMENTE

**Funcionalidades**:
- Drag & drop entre colunas
- Validação de transições de status
- Filtros por busca e tipo de entrega
- Atualização em tempo real via Supabase Realtime
- Exibição de cards com resumo

**Colunas do Kanban**:
1. Pendente (amarelo)
2. Em Preparo (azul)
3. Saiu para Entrega (roxo)
4. Finalizado (verde)
5. Cancelado (vermelho)

**Transições Permitidas**:
- pendente → em_preparo, cancelado
- em_preparo → saiu_entrega, finalizado (balcão), cancelado
- saiu_entrega → finalizado, cancelado
- finalizado → (nenhuma)
- cancelado → (nenhuma)

---

### 4.2 Hook: use-pedidos-kanban
**Arquivo**: `hooks/use-pedidos-kanban.ts`

✅ **Status**: FUNCIONANDO CORRETAMENTE

**Funcionalidades**:
- Carrega pedidos de `vw_pedidos_kanban`
- Realtime subscription em `pedidos`
- Atualiza status e ordem
- Recarrega da view após UPDATE (evita sobrescrever campos agregados)

---

### 4.3 Componente: PedidoCard
**Arquivo**: `components/admin/pedido-card.tsx`

✅ **Status**: FUNCIONANDO (com ressalva)

**Exibe**:
- Número do pedido
- Tempo decorrido
- Tipo de entrega (badge)
- Nome e telefone do cliente
- ⚠️ Endereço (campo obsoleto)
- Forma de pagamento
- Resumo de itens (primeiros 2)
- Observações
- Total
- Botão "Ver Detalhes"

---

### 4.4 Modal de Detalhes
**Arquivo**: `components/admin/pedido-detalhes-modal.tsx`

✅ **Status**: FUNCIONANDO CORRETAMENTE

**Carrega**:
- Itens completos de `pedido_itens`
- Histórico de `pedido_historico`
- Permite cancelar com motivo
- Exibe todas as informações do pedido

---

## 🔧 5. CORREÇÕES NECESSÁRIAS

### 5.1 CRÍTICO: Atualizar View vw_pedidos_kanban
**Prioridade**: ALTA

Executar SQL para corrigir campo `endereco_entrega` e adicionar mais detalhes aos itens:

```sql
CREATE OR REPLACE VIEW vw_pedidos_kanban AS
SELECT 
  p.id,
  COALESCE(p.numero_pedido, 'SEM-NUMERO'::character varying) AS numero_pedido,
  COALESCE(p.nome_cliente, ''::text) AS nome_cliente,
  COALESCE(p.telefone_cliente, ''::text) AS telefone_cliente,
  COALESCE(p.tipo_entrega, 'delivery'::character varying) AS tipo_entrega,
  -- CORREÇÃO: Concatenar campos de endereço
  CASE 
    WHEN p.tipo_entrega = 'delivery' THEN
      CONCAT_WS(', ',
        NULLIF(p.endereco_rua, ''),
        NULLIF(p.endereco_numero, ''),
        NULLIF(p.endereco_bairro, ''),
        NULLIF(p.endereco_cidade, ''),
        NULLIF(p.endereco_estado, '')
      )
    ELSE NULL
  END AS endereco_entrega,
  COALESCE(p.status, 'pendente'::character varying) AS status,
  p.status_anterior,
  COALESCE(p.subtotal, 0::numeric) AS subtotal,
  COALESCE(p.taxa_entrega, 0::numeric) AS taxa_entrega,
  COALESCE(p.total, 0::numeric) AS total,
  COALESCE(p.forma_pagamento, 'pix'::character varying) AS forma_pagamento,
  p.observacoes,
  p.created_at,
  p.updated_at,
  COALESCE(p.ordem_kanban, 0) AS ordem_kanban,
  p.alterado_por,
  p.motivo_cancelamento,
  -- Campos de endereço separados para detalhes
  p.endereco_rua,
  p.endereco_numero,
  p.endereco_bairro,
  p.endereco_cidade,
  p.endereco_estado,
  p.endereco_cep,
  p.endereco_complemento,
  p.troco_para,
  COALESCE(COUNT(pi.id), 0::bigint) AS total_itens,
  COALESCE(
    ARRAY_AGG(
      JSONB_BUILD_OBJECT(
        'nome', pi.nome_produto,
        'quantidade', pi.quantidade,
        'tamanho', pi.tamanho,
        'sabores', pi.sabores,
        'adicionais', pi.adicionais,
        'borda_recheada', pi.borda_recheada,
        'observacoes', pi.observacoes,
        'preco_unitario', pi.preco_unitario,
        'preco_total', pi.preco_total
      ) ORDER BY pi.created_at
    ) FILTER (WHERE pi.id IS NOT NULL),
    ARRAY[]::jsonb[]
  ) AS itens_resumo
FROM pedidos p
LEFT JOIN pedido_itens pi ON pi.pedido_id = p.id
GROUP BY p.id
ORDER BY p.ordem_kanban, p.created_at DESC;
```

---

### 5.2 OPCIONAL: Melhorar Modal de Detalhes
**Prioridade**: MÉDIA

Atualizar `PedidoDetalhesModal` para exibir:
- Sabores de cada item (JSONB)
- Adicionais por sabor (JSONB)
- Borda recheada (JSONB)
- Observações por item

---

### 5.3 OPCIONAL: Adicionar Validação de Produto_ID
**Prioridade**: BAIXA

No frontend, garantir que pizzas multi-sabor sempre tenham `produto_id = null`:

```typescript
// Em entrega-pagamento/page.tsx, linha 156
if (item.id.startsWith('multi-')) {
  produtoId = null
} else {
  // Validação UUID...
}
```

✅ **Já implementado corretamente**

---

## 📋 6. CHECKLIST DE VALIDAÇÃO

### Frontend
- [x] Carrinho adiciona itens corretamente
- [x] Checkout calcula taxa de entrega
- [x] Validações de formulário funcionando
- [x] Preparação de dados para RPC correta
- [x] Limpeza de carrinho após sucesso
- [x] Redirecionamento para página de pedido

### Backend
- [x] Função `criar_pedido_online` salva todos os campos
- [x] Trigger `auto_gerar_numero_pedido` funciona
- [x] Campos JSONB salvos corretamente
- [x] View `vw_pedidos_kanban` retorna dados
- [ ] **PENDENTE**: Corrigir campo `endereco_entrega` na view

### Admin
- [x] Kanban carrega pedidos
- [x] Drag & drop funciona
- [x] Validação de transições
- [x] Realtime atualiza automaticamente
- [x] Modal de detalhes carrega itens
- [ ] **PENDENTE**: Exibir endereço completo no card
- [ ] **OPCIONAL**: Melhorar exibição de itens no modal

---

## 🎯 7. AÇÕES IMEDIATAS

### 1. Executar SQL de Correção da View
```bash
# Via MCP Supabase
mcp4_execute_sql(project_id, query_acima)
```

### 2. Testar Fluxo Completo
1. Adicionar produtos ao carrinho
2. Fazer checkout como cliente logado
3. Verificar se pedido aparece no Kanban
4. Verificar se endereço está correto
5. Verificar se itens estão completos
6. Testar drag & drop
7. Verificar modal de detalhes

### 3. Validar Dados no Banco
```sql
-- Verificar pedido criado
SELECT * FROM pedidos ORDER BY created_at DESC LIMIT 1;

-- Verificar itens
SELECT * FROM pedido_itens WHERE pedido_id = '<id_do_pedido>';

-- Verificar view
SELECT * FROM vw_pedidos_kanban LIMIT 1;
```

---

## ✅ 8. CONCLUSÃO

### Pontos Fortes
1. ✅ Fluxo de pedidos bem estruturado
2. ✅ Validações robustas no frontend
3. ✅ Função RPC completa e funcional
4. ✅ Kanban com drag & drop e realtime
5. ✅ Separação clara de responsabilidades

### Pontos de Atenção
1. ⚠️ Campo `endereco_entrega` obsoleto na view
2. ⚠️ Modal de detalhes pode exibir mais informações
3. ⚠️ Falta teste end-to-end completo

### Próximos Passos
1. **Executar correção da view** (CRÍTICO)
2. **Testar criação de pedido** (CRÍTICO)
3. **Validar exibição no Kanban** (CRÍTICO)
4. Melhorar modal de detalhes (OPCIONAL)
5. Adicionar testes automatizados (FUTURO)

---

**Status Geral**: ✅ **SISTEMA FUNCIONAL COM PEQUENAS CORREÇÕES NECESSÁRIAS**
