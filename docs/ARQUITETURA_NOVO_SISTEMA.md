# 🏗️ ARQUITETURA DO NOVO SISTEMA DE PEDIDOS ONLINE

**Data:** 18/10/2025  
**Status:** Documentação técnica da nova arquitetura

---

## 📊 VISÃO GERAL

### **Sistema Anterior:**
```
Cliente → Seleciona produtos → Carrinho → Checkout → WhatsApp
                                                         ↓
                                                    (Nada salvo)
```

### **Sistema Novo:**
```
Cliente → Cadastro/Login → Seleciona produtos → Carrinho → Checkout → Banco de Dados
                                                                            ↓
                                                                       Admin Panel
                                                                            ↓
                                                                    Gerenciamento
```

---

## 🔐 AUTENTICAÇÃO

### **Estratégia: Supabase Auth**

**Vantagens:**
- ✅ Gerenciamento de sessões nativo
- ✅ Hash de senhas seguro (bcrypt)
- ✅ Recuperação de senha automática
- ✅ Verificação de email
- ✅ OAuth (Google, Facebook) - opcional
- ✅ RLS integrado

**Fluxo de Cadastro:**
```typescript
1. Cliente preenche formulário (nome, email, telefone, senha)
2. Supabase Auth cria usuário em auth.users
3. Sistema cria registro em public.clientes com mesmo ID
4. Email de verificação enviado (opcional)
5. Cliente pode fazer login
```

**Fluxo de Login:**
```typescript
1. Cliente insere email/telefone + senha
2. Supabase Auth valida credenciais
3. Sessão criada (token JWT)
4. Token armazenado no localStorage
5. Cliente autenticado pode fazer pedidos
```

---

## 🗄️ MODELO DE DADOS

### **1. Tabela `clientes`**

```typescript
interface Cliente {
  id: string                    // UUID (mesmo do auth.users)
  nome: string
  email: string                 // UNIQUE
  telefone: string
  senha_hash?: string           // Não usado se Supabase Auth
  
  // Endereço padrão (opcional)
  endereco_rua?: string
  endereco_numero?: string
  endereco_bairro?: string
  endereco_cidade?: string
  endereco_estado?: string
  endereco_cep?: string
  endereco_complemento?: string
  
  // Status
  ativo: boolean
  email_verificado: boolean
  telefone_verificado: boolean
  
  // Timestamps
  created_at: Date
  updated_at: Date
  ultimo_acesso?: Date
}
```

### **2. Tabela `pedidos`**

```typescript
interface Pedido {
  id: string                    // UUID
  cliente_id?: string           // FK → clientes (NULL se convidado)
  numero_pedido: string         // PED-001, PED-002 (auto-gerado)
  
  // Dados temporários (se convidado)
  nome_cliente?: string
  telefone_cliente?: string
  
  // Tipo e endereço
  tipo_entrega: 'delivery' | 'balcao'
  endereco_rua?: string
  endereco_numero?: string
  endereco_bairro?: string
  endereco_cidade?: string
  endereco_estado?: string
  endereco_cep?: string
  endereco_complemento?: string
  
  // Valores
  subtotal: number
  taxa_entrega: number
  desconto: number
  total: number
  
  // Pagamento
  forma_pagamento: 'pix' | 'dinheiro' | 'debito' | 'credito' | 'ticket_alimentacao'
  troco_para?: number
  
  // Status e observações
  status: 'pendente' | 'confirmado' | 'em_preparo' | 'saiu_entrega' | 'finalizado' | 'cancelado'
  observacoes?: string
  
  // Timestamps
  created_at: Date
  updated_at: Date
  confirmado_em?: Date
  finalizado_em?: Date
}
```

### **3. Tabela `pedido_itens`**

```typescript
interface PedidoItem {
  id: string                    // UUID
  pedido_id: string             // FK → pedidos
  produto_id?: string           // FK → produtos (pode ser NULL)
  
  // Snapshot do produto
  nome_produto: string
  tamanho?: 'broto' | 'tradicional'
  sabores?: string[]            // Array JSON
  
  // Customizações
  adicionais?: {                // Array JSON
    sabor: string
    itens: {
      nome: string
      preco: number
    }[]
  }[]
  borda_recheada?: {            // Object JSON
    id: string
    nome: string
    preco: number
  }
  observacoes?: string
  
  // Valores
  quantidade: number
  preco_unitario: number
  preco_total: number
  
  created_at: Date
}
```

### **4. Tabela `taxas_entrega`**

```typescript
interface TaxaEntrega {
  id: string
  bairro: string                // Campo principal
  cidade?: string
  cep?: string
  taxa: number
  tempo_min?: number            // Minutos
  tempo_max?: number            // Minutos
  ativo: boolean
  ordem: number
  created_at: Date
  updated_at: Date
}
```

---

## 🔄 FLUXO COMPLETO DO PEDIDO

### **1. Cliente Acessa o Site**
```
GET / → Homepage com produtos
```

### **2. Seleciona Produtos**
```typescript
// Estado do carrinho (localStorage)
{
  items: [
    {
      id: "uuid-produto",
      nome: "Pizza Calabresa",
      tamanho: "tradicional",
      sabores: ["Calabresa"],
      quantidade: 2,
      preco: 45.00,
      adicionais: [
        {
          sabor: "Calabresa",
          itens: [
            { nome: "Cebola", preco: 2.00 }
          ]
        }
      ],
      bordaRecheada: {
        id: "uuid-borda",
        nome: "Catupiry",
        preco: 5.00
      }
    }
  ],
  total: 104.00  // (45 + 2 + 5) * 2
}
```

### **3. Vai para Checkout**
```
Click "Finalizar Pedido" → Redireciona /checkout
```

**Verifica autenticação:**
```typescript
const { data: { session } } = await supabase.auth.getSession()

if (!session) {
  // Redireciona para login com returnUrl
  router.push('/login?returnUrl=/checkout')
}
```

### **4. Login/Cadastro (se necessário)**
```
POST /api/auth/signup ou /api/auth/login
↓
Supabase Auth cria sessão
↓
Retorna para /checkout
```

### **5. Preenche Dados de Entrega**
```typescript
// Dados do formulário
{
  deliveryType: "delivery",
  cep: "12345-678",
  addressData: { /* ViaCEP */ },
  addressNumber: "123",
  addressComplement: "Apto 45",
  deliveryNotes: "Casa amarela",
  paymentMethod: "pix",
  orderNotes: "Sem cebola"
}
```

### **6. Calcula Taxa de Entrega**
```typescript
const { data } = await supabase
  .rpc('buscar_taxa_entrega', {
    p_bairro: addressData.bairro,
    p_cep: cep
  })

const taxa = data?.[0]?.taxa || 5.00
```

### **7. Finaliza Pedido**
```typescript
// POST /api/pedidos/criar
const pedidoData = {
  cliente_id: session.user.id,
  tipo_entrega: "delivery",
  endereco_rua: addressData.logradouro,
  endereco_numero: "123",
  endereco_bairro: addressData.bairro,
  endereco_cidade: addressData.localidade,
  endereco_estado: addressData.uf,
  endereco_cep: cep,
  endereco_complemento: "Apto 45",
  subtotal: 104.00,
  taxa_entrega: 5.00,
  total: 109.00,
  forma_pagamento: "pix",
  observacoes: "Sem cebola",
  status: "pendente",
  itens: [
    {
      produto_id: "uuid-produto",
      nome_produto: "Pizza Calabresa",
      tamanho: "tradicional",
      sabores: ["Calabresa"],
      quantidade: 2,
      preco_unitario: 52.00,
      preco_total: 104.00,
      adicionais: [...],
      borda_recheada: {...}
    }
  ]
}
```

### **8. Salva no Banco**
```sql
-- Transaction BEGIN

-- 1. Inserir pedido
INSERT INTO pedidos (...) VALUES (...) RETURNING id;
-- Trigger gera numero_pedido automaticamente

-- 2. Inserir itens
INSERT INTO pedido_itens (...) VALUES (...);
INSERT INTO pedido_itens (...) VALUES (...);

-- Transaction COMMIT
```

### **9. Redireciona para Confirmação**
```
router.push(`/pedido/${pedidoId}/confirmacao`)
```

### **10. Admin Recebe Notificação**
```typescript
// Supabase Realtime
supabase
  .channel('pedidos')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'pedidos'
  }, (payload) => {
    // Mostrar notificação
    // Tocar som
    // Atualizar lista de pedidos
  })
  .subscribe()
```

---

## 🔌 APIs NECESSÁRIAS

### **1. Autenticação**

#### **POST /api/auth/signup**
```typescript
// Entrada
{
  nome: string
  email: string
  telefone: string
  senha: string
}

// Saída
{
  user: { id, email },
  session: { access_token }
}
```

#### **POST /api/auth/login**
```typescript
// Entrada
{
  email: string
  senha: string
}

// Saída
{
  user: { id, email },
  session: { access_token }
}
```

### **2. Pedidos**

#### **POST /api/pedidos/criar**
```typescript
// Entrada
{
  cliente_id?: string
  tipo_entrega: string
  endereco: { ... }
  subtotal: number
  taxa_entrega: number
  total: number
  forma_pagamento: string
  observacoes?: string
  itens: [...]
}

// Saída
{
  pedido_id: string
  numero_pedido: string
  status: 'pendente'
}
```

#### **GET /api/pedidos/meus**
```typescript
// Entrada: Authenticated user (session)

// Saída
{
  pedidos: [
    {
      id: string
      numero_pedido: string
      status: string
      total: number
      created_at: Date
      itens: [...]
    }
  ]
}
```

#### **GET /api/pedidos/:id**
```typescript
// Saída
{
  pedido: {
    id: string
    numero_pedido: string
    status: string
    endereco: { ... }
    total: number
    itens: [...]
  }
}
```

### **3. Taxas de Entrega**

#### **GET /api/taxas/buscar?bairro=X&cep=Y**
```typescript
// Saída
{
  taxa: number
  tempo_min: number
  tempo_max: number
}
```

---

## 🎨 PÁGINAS DO FRONTEND

### **Novas Páginas:**

1. **`/cadastro`** - Cadastro de novo cliente
2. **`/login`** - Login de cliente
3. **`/meus-pedidos`** - Histórico de pedidos do cliente
4. **`/pedido/[id]/confirmacao`** - Confirmação do pedido criado
5. **`/perfil`** - Dados do cliente (editar)

### **Páginas Modificadas:**

1. **`/checkout`** - Adicionar verificação de autenticação
2. **`/`** (Homepage) - Manter igual (só muda finalização)

---

## 🔒 SEGURANÇA

### **Row Level Security (RLS)**

**Clientes:**
- ✅ Pode ver apenas seus próprios dados
- ✅ Pode atualizar apenas seus próprios dados
- ✅ Admin pode ver todos

**Pedidos:**
- ✅ Cliente vê apenas seus pedidos
- ✅ Cliente cria apenas pedidos próprios
- ✅ Admin pode gerenciar todos

**Pedido Itens:**
- ✅ Cliente vê itens dos seus pedidos
- ✅ Admin pode gerenciar todos

### **Validações:**

**Backend (API):**
- ✅ Validar autenticação em todas as rotas
- ✅ Validar ownership dos pedidos
- ✅ Validar dados de entrada (Zod)
- ✅ Sanitizar inputs
- ✅ Rate limiting

**Frontend:**
- ✅ Validar formulários
- ✅ Verificar sessão expirada
- ✅ Refresh token automático

---

## 📊 MONITORAMENTO

### **Métricas Importantes:**

1. **Pedidos:**
   - Total de pedidos por período
   - Taxa de conversão (visitas → pedidos)
   - Ticket médio
   - Tempo médio de entrega

2. **Clientes:**
   - Novos cadastros por período
   - Taxa de retenção
   - Clientes ativos vs inativos

3. **Performance:**
   - Tempo de resposta das APIs
   - Tempo de carregamento das páginas
   - Erros e exceções

---

## 🚀 DEPLOYMENT

### **Ordem de Deploy:**

1. ✅ **Executar script SQL** (18-migrate-to-online-orders.sql)
2. ⏳ **Configurar Supabase Auth**
3. ⏳ **Deploy das APIs**
4. ⏳ **Deploy do Frontend**
5. ⏳ **Testar fluxo completo**
6. ⏳ **Monitorar por 24h**

---

## 🔄 COMPATIBILIDADE

### **Pedidos Antigos:**
- ✅ Continuam funcionando
- ✅ `cliente_id` será NULL
- ✅ Usa `nome_cliente` e `telefone_cliente`
- ✅ Admin pode ver normalmente

### **Transição Gradual:**
- Fase 1: Permitir pedido como convidado (sem login)
- Fase 2: Incentivar cadastro (cupons, pontos)
- Fase 3: Tornar login obrigatório (opcional)

---

**Documentação criada em:** 18/10/2025  
**Última atualização:** 18/10/2025
