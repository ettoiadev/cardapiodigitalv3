# Documentação da API - Cardápio Digital v3

## 📚 Visão Geral

Esta documentação descreve todas as funções, hooks e utilitários disponíveis no projeto Cardápio Digital v3. Todos os módulos foram documentados usando JSDoc para facilitar o desenvolvimento e manutenção.

---

## 🔐 Módulo: `auth-helpers`

**Arquivo:** `lib/auth-helpers.ts`

Funções auxiliares para autenticação com Supabase Auth.

### Interfaces

#### `SignUpData`
Dados necessários para cadastro de novo cliente.

```typescript
interface SignUpData {
  nome: string      // Nome completo do cliente
  email: string     // Endereço de e-mail válido
  telefone: string  // Número de telefone
  senha: string     // Senha (mínimo 6 caracteres)
}
```

#### `SignInData`
Dados necessários para autenticação.

```typescript
interface SignInData {
  email: string  // E-mail cadastrado
  senha: string  // Senha de autenticação
}
```

### Funções

#### `signUp(data: SignUpData)`
Cadastra um novo cliente no sistema usando Supabase Auth.

**Parâmetros:**
- `nome` - Nome completo do cliente
- `email` - E-mail único para autenticação
- `telefone` - Telefone de contato
- `senha` - Senha (mínimo 6 caracteres)

**Retorna:** `Promise<{data: any, error: string | null}>`

**Exemplo:**
```typescript
const result = await signUp({
  nome: 'João Silva',
  email: 'joao@example.com',
  telefone: '11999999999',
  senha: 'senha123'
})

if (result.error) {
  console.error('Erro no cadastro:', result.error)
} else {
  console.log('Cliente cadastrado:', result.data.user)
}
```

#### `signIn(data: SignInData)`
Autentica um cliente existente no sistema.

**Parâmetros:**
- `email` - E-mail cadastrado
- `senha` - Senha do usuário

**Retorna:** `Promise<{data: any, error: string | null}>`

**Exemplo:**
```typescript
const result = await signIn({
  email: 'joao@example.com',
  senha: 'senha123'
})
```

#### `signOut()`
Encerra a sessão atual do usuário.

**Retorna:** `Promise<{error: string | null}>`

#### `getSession()`
Obtém a sessão de autenticação atual do usuário.

**Retorna:** `Promise<{session: any, error: string | null}>`

#### `getUser()`
Obtém os dados do usuário autenticado.

**Retorna:** `Promise<{user: any, error: string | null}>`

#### `resetPassword(email: string)`
Inicia o processo de recuperação de senha.

**Parâmetros:**
- `email` - E-mail cadastrado do usuário

**Retorna:** `Promise<{error: string | null}>`

#### `updatePassword(novaSenha: string)`
Atualiza a senha do usuário autenticado.

**Parâmetros:**
- `novaSenha` - Nova senha (mínimo 6 caracteres)

**Retorna:** `Promise<{error: string | null}>`

#### `isAuthenticated()`
Verifica se existe uma sessão ativa de autenticação.

**Retorna:** `Promise<boolean>`

#### `getClienteData(userId: string)`
Busca dados completos do cliente na tabela 'clientes'.

**Parâmetros:**
- `userId` - ID único do usuário (UUID)

**Retorna:** `Promise<{data: any, error: string | null}>`

#### `updateClienteData(userId: string, updates: any)`
Atualiza dados do cliente na tabela 'clientes'.

**Parâmetros:**
- `userId` - ID único do usuário (UUID)
- `updates` - Objeto com campos a serem atualizados

**Retorna:** `Promise<{data: any, error: string | null}>`

#### `onAuthStateChange(callback: Function)`
Registra um listener para mudanças no estado de autenticação.

**Parâmetros:**
- `callback` - Função executada quando estado muda
  - `event` - Tipo do evento ('SIGNED_IN', 'SIGNED_OUT', etc.)
  - `session` - Sessão atual ou null

**Retorna:** Subscription object com método `unsubscribe()`

---

## 💰 Módulo: `currency-utils`

**Arquivo:** `lib/currency-utils.ts`

Utilitários para formatação e manipulação de valores monetários brasileiros (BRL).

### Funções

#### `formatCurrency(value: number | null | undefined)`
Formata um valor numérico para o formato de moeda brasileira.

**Parâmetros:**
- `value` - Valor numérico a ser formatado

**Retorna:** `string` - Valor formatado (ex: "R$ 1.234,56")

**Exemplo:**
```typescript
formatCurrency(1234.56)  // "R$ 1.234,56"
formatCurrency(10)       // "R$ 10,00"
formatCurrency(null)     // "R$ 0,00"
```

#### `formatCurrencyInput(input: string)`
Formata entrada de texto para moeda brasileira em tempo real.

**Parâmetros:**
- `input` - Texto digitado pelo usuário

**Retorna:** `string` - Texto formatado como moeda

**Exemplo:**
```typescript
formatCurrencyInput('1234')    // "R$ 12,34"
formatCurrencyInput('123456')  // "R$ 1.234,56"
```

#### `parseCurrencyInput(formattedValue: string)`
Converte string formatada como moeda brasileira para número.

**Parâmetros:**
- `formattedValue` - Valor formatado como moeda

**Retorna:** `number` - Valor numérico

**Exemplo:**
```typescript
parseCurrencyInput('R$ 1.234,56')  // 1234.56
parseCurrencyInput('R$ 10,00')     // 10
```

#### `formatCurrencyForInput(value: number | null | undefined)`
Formata valor numérico para exibição inicial em campos de input.

**Parâmetros:**
- `value` - Valor numérico a formatar

**Retorna:** `string` - Valor formatado ou string vazia se zero/null

**Exemplo:**
```typescript
formatCurrencyForInput(45)    // "R$ 45,00"
formatCurrencyForInput(0)     // ""
```

#### `applyCurrencyMask(event: React.ChangeEvent<HTMLInputElement>)`
Aplica máscara de moeda em evento de mudança de input.

**Parâmetros:**
- `event` - Evento de mudança do input React

**Retorna:** `number` - Valor numérico parseado

**Exemplo:**
```typescript
<input
  type="text"
  onChange={(e) => {
    const numericValue = applyCurrencyMask(e)
    setValor(numericValue)
  }}
/>
```

---

## 🚚 Módulo: `taxa-helpers`

**Arquivo:** `lib/taxa-helpers.ts`

Helpers para cálculo, validação e busca de taxas de entrega.

### Interfaces

#### `TaxaEntrega`
Interface que representa os dados de uma taxa de entrega.

```typescript
interface TaxaEntrega {
  taxa: number        // Valor da taxa em reais
  bairro: string      // Nome do bairro atendido
  tempo_min: number   // Tempo mínimo de entrega (minutos)
  tempo_max: number   // Tempo máximo de entrega (minutos)
}
```

### Funções

#### `buscarTaxaPorCep(cep: string)`
Busca a taxa de entrega baseada no CEP do cliente.

**Parâmetros:**
- `cep` - CEP do cliente (com ou sem formatação)

**Retorna:** `Promise<TaxaEntrega | null>`

**Exemplo:**
```typescript
const taxa = await buscarTaxaPorCep('01310-100')
if (taxa) {
  console.log(`Taxa: R$ ${taxa.taxa}`)
  console.log(`Bairro: ${taxa.bairro}`)
  console.log(`Tempo: ${taxa.tempo_min}-${taxa.tempo_max} min`)
}
```

#### `buscarTaxaPorBairro(bairro: string)`
Busca a taxa de entrega baseada no nome do bairro.

**Parâmetros:**
- `bairro` - Nome do bairro (busca case-insensitive)

**Retorna:** `Promise<TaxaEntrega | null>`

#### `validarAreaEntrega(cep: string)`
Valida se o CEP está em uma área de entrega atendida.

**Parâmetros:**
- `cep` - CEP a ser validado

**Retorna:** `Promise<boolean>`

**Exemplo:**
```typescript
const atende = await validarAreaEntrega('01310-100')
if (!atende) {
  alert('Desculpe, não entregamos neste CEP')
}
```

#### `formatarCep(cep: string)`
Formata CEP para o padrão brasileiro de exibição.

**Parâmetros:**
- `cep` - CEP sem formatação (apenas dígitos)

**Retorna:** `string` - CEP formatado (00000-000)

**Exemplo:**
```typescript
formatarCep('01310100')  // "01310-100"
```

#### `formatarMoeda(valor: number)`
Formata valor monetário para exibição no padrão brasileiro.

**Parâmetros:**
- `valor` - Valor numérico em reais

**Retorna:** `string` - Valor formatado

**Exemplo:**
```typescript
formatarMoeda(12.5)    // "R$ 12,50"
formatarMoeda(1234.56) // "R$ 1.234,56"
```

#### `calcularTotal(subtotal: number, taxaEntrega: number)`
Calcula o valor total do pedido incluindo taxa de entrega.

**Parâmetros:**
- `subtotal` - Valor total dos produtos
- `taxaEntrega` - Valor da taxa de entrega

**Retorna:** `number` - Valor total do pedido

**Exemplo:**
```typescript
const total = calcularTotal(45.00, 5.00) // 50.00
```

#### `buscarEnderecoPorCep(cep: string)`
Busca informações completas de endereço usando a API ViaCEP.

**Parâmetros:**
- `cep` - CEP a ser consultado

**Retorna:** `Promise<Object | null>` com propriedades:
- `logradouro` - Nome da rua/avenida
- `bairro` - Nome do bairro
- `localidade` - Nome da cidade
- `uf` - Sigla do estado

**Exemplo:**
```typescript
const endereco = await buscarEnderecoPorCep('01310-100')
if (endereco) {
  console.log(`${endereco.logradouro}, ${endereco.bairro}`)
  console.log(`${endereco.localidade}/${endereco.uf}`)
}
```

---

## 🎨 Módulo: `utils`

**Arquivo:** `lib/utils.ts`

Utilitários gerais para o projeto.

### Funções

#### `cn(...inputs: ClassValue[])`
Combina classes CSS de forma inteligente usando clsx e tailwind-merge.

**Parâmetros:**
- `...inputs` - Classes CSS (strings, arrays, objetos condicionais)

**Retorna:** `string` - String de classes CSS otimizada

**Exemplo:**
```typescript
// Classes simples
cn('px-2 py-1', 'bg-blue-500') // "px-2 py-1 bg-blue-500"

// Classes condicionais
cn('base-class', {
  'active-class': isActive,
  'disabled-class': isDisabled
})

// Resolvendo conflitos Tailwind
cn('p-4 text-red-500', 'p-2') // "p-2 text-red-500"

// Uso em componentes
<button className={cn(
  'px-4 py-2 rounded',
  variant === 'primary' && 'bg-blue-500',
  className
)}>
  Click me
</button>
```

---

## 🔄 Hook: `useRealtimePedidos`

**Arquivo:** `hooks/use-realtime-pedidos.ts`

Hook React para sincronização em tempo real de pedidos via Supabase Realtime.

### Interface

#### `Pedido`
Interface que representa um pedido no sistema.

```typescript
interface Pedido {
  id: string            // ID único do pedido (UUID)
  numero_pedido: string // Número sequencial do pedido
  status: string        // Status atual do pedido
  total: number         // Valor total do pedido
  created_at: string    // Data/hora de criação (ISO 8601)
}
```

### Hook

#### `useRealtimePedidos(initialPedidos?: Pedido[])`
Hook customizado para sincronização em tempo real de pedidos.

**Parâmetros:**
- `initialPedidos` - Lista inicial de pedidos (opcional, padrão: [])

**Retorna:** `Pedido[]` - Lista atualizada de pedidos em tempo real

**Funcionalidades:**
- **INSERT**: Novos pedidos são adicionados ao início da lista
- **UPDATE**: Pedidos existentes são atualizados
- **DELETE**: Pedidos são removidos da lista

**Exemplo:**
```typescript
function PedidosPage() {
  const [initialData, setInitialData] = useState([])
  
  useEffect(() => {
    async function fetchPedidos() {
      const { data } = await supabase
        .from('pedidos')
        .select('*')
        .order('created_at', { ascending: false })
      setInitialData(data || [])
    }
    fetchPedidos()
  }, [])
  
  // Hook mantém lista sincronizada em tempo real
  const pedidos = useRealtimePedidos(initialData)
  
  return (
    <div>
      {pedidos.map(pedido => (
        <PedidoCard key={pedido.id} pedido={pedido} />
      ))}
    </div>
  )
}
```

---

## 🛡️ Middleware de Autenticação

**Arquivo:** `middleware.ts`

Middleware Next.js para proteção de rotas e gerenciamento de autenticação.

### Função Principal

#### `middleware(req: NextRequest)`
Middleware de autenticação e proteção de rotas.

**Funcionalidades:**
1. Verifica autenticação via Supabase
2. Protege rotas privadas
3. Previne acesso a páginas de auth por usuários logados
4. Preserva URL de retorno para redirecionamento pós-login

**Rotas Protegidas (requerem autenticação):**
- `/checkout` - Finalização de pedido
- `/meus-pedidos` - Histórico de pedidos
- `/perfil` - Dados do usuário
- `/pedido/*` - Detalhes de pedidos

**Rotas de Autenticação (apenas não autenticados):**
- `/login` - Página de login
- `/cadastro` - Página de cadastro

**Exemplos de Comportamento:**
```typescript
// Usuário não autenticado tenta acessar /checkout
// → Redirecionado para /login?returnUrl=/checkout

// Usuário autenticado tenta acessar /login
// → Redirecionado para /

// Usuário autenticado acessa /meus-pedidos
// → Acesso permitido, continua normalmente
```

---

## 📝 Notas Importantes

### Tratamento de Erros

Todas as funções assíncronas retornam objetos no formato:
```typescript
{
  data: any | null,
  error: string | null
}
```

Sempre verifique o campo `error` antes de usar `data`:
```typescript
const { data, error } = await signIn(credentials)
if (error) {
  // Tratar erro
  console.error(error)
  return
}
// Usar data com segurança
console.log(data.user)
```

### Tipos TypeScript

Todos os módulos são totalmente tipados com TypeScript. Use as interfaces exportadas para garantir type safety:

```typescript
import { SignUpData, SignInData } from '@/lib/auth-helpers'
import { TaxaEntrega } from '@/lib/taxa-helpers'
```

### Supabase Realtime

Para usar funcionalidades de realtime, certifique-se de que:
1. Realtime está habilitado no projeto Supabase
2. As tabelas têm replicação habilitada
3. As políticas RLS permitem acesso aos dados

---

## 🔗 Links Úteis

- [Documentação Supabase](https://supabase.com/docs)
- [Documentação Next.js](https://nextjs.org/docs)
- [Documentação Tailwind CSS](https://tailwindcss.com/docs)
- [Documentação React](https://react.dev)

---

**Última atualização:** 2025-01-18
**Versão:** 3.0.0
