# 📖 Referência Rápida - Cardápio Digital v3

## 🎯 Guia Rápido de Uso

### Autenticação

```typescript
import { signUp, signIn, signOut, getUser } from '@/lib/auth-helpers'

// Cadastrar novo usuário
const { data, error } = await signUp({
  nome: 'João Silva',
  email: 'joao@example.com',
  telefone: '11999999999',
  senha: 'senha123'
})

// Fazer login
await signIn({ email: 'joao@example.com', senha: 'senha123' })

// Fazer logout
await signOut()

// Obter usuário atual
const { user } = await getUser()
```

---

### Formatação de Moeda

```typescript
import { formatCurrency, parseCurrencyInput, applyCurrencyMask } from '@/lib/currency-utils'

// Formatar número para moeda
formatCurrency(1234.56)  // "R$ 1.234,56"

// Converter moeda para número
parseCurrencyInput('R$ 1.234,56')  // 1234.56

// Usar em input React
<input
  type="text"
  onChange={(e) => {
    const valor = applyCurrencyMask(e)
    setPreco(valor)
  }}
/>
```

---

### Taxas de Entrega

```typescript
import { buscarTaxaPorCep, validarAreaEntrega, buscarEnderecoPorCep } from '@/lib/taxa-helpers'

// Buscar taxa por CEP
const taxa = await buscarTaxaPorCep('01310-100')
if (taxa) {
  console.log(`Taxa: R$ ${taxa.taxa}`)
  console.log(`Tempo: ${taxa.tempo_min}-${taxa.tempo_max} min`)
}

// Validar se entrega no CEP
const atende = await validarAreaEntrega('01310-100')

// Buscar endereço completo
const endereco = await buscarEnderecoPorCep('01310-100')
console.log(endereco.logradouro, endereco.bairro)
```

---

### Realtime de Pedidos

```typescript
import { useRealtimePedidos } from '@/hooks/use-realtime-pedidos'

function MeusPedidos() {
  // Buscar pedidos iniciais
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
  
  // Hook mantém sincronizado em tempo real
  const pedidos = useRealtimePedidos(initialData)
  
  return (
    <div>
      {pedidos.map(pedido => (
        <div key={pedido.id}>
          Pedido #{pedido.numero_pedido} - {pedido.status}
        </div>
      ))}
    </div>
  )
}
```

---

### Utilitário de Classes CSS

```typescript
import { cn } from '@/lib/utils'

// Combinar classes
<button className={cn(
  'px-4 py-2 rounded',
  isActive && 'bg-blue-500',
  isDisabled && 'opacity-50',
  className
)}>
  Botão
</button>

// Resolver conflitos Tailwind
cn('p-4', 'p-2')  // "p-2" (última classe prevalece)
```

---

## 🔐 Rotas Protegidas (Middleware)

### Rotas que Requerem Autenticação

- `/checkout` - Finalização de pedido
- `/meus-pedidos` - Histórico de pedidos
- `/perfil` - Perfil do usuário
- `/pedido/:id` - Detalhes do pedido

### Comportamento

```typescript
// Usuário não autenticado → Redireciona para /login?returnUrl=/checkout
// Usuário autenticado em /login → Redireciona para /
```

---

## 📊 Estrutura de Dados

### Pedido

```typescript
interface Pedido {
  id: string            // UUID
  numero_pedido: string // Ex: "001"
  status: string        // "pendente" | "em_preparo" | "entregue"
  total: number         // Valor em reais
  created_at: string    // ISO 8601
}
```

### Taxa de Entrega

```typescript
interface TaxaEntrega {
  taxa: number        // Valor em reais
  bairro: string      // Nome do bairro
  tempo_min: number   // Minutos
  tempo_max: number   // Minutos
}
```

---

## 🎨 Padrões de Código

### Tratamento de Erros

```typescript
const { data, error } = await minhaFuncao()

if (error) {
  console.error('Erro:', error)
  toast.error(error)
  return
}

// Usar data com segurança
console.log(data)
```

### Componentes com Variantes

```typescript
import { cn } from '@/lib/utils'

interface ButtonProps {
  variant?: 'primary' | 'secondary'
  className?: string
}

function Button({ variant = 'primary', className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'px-4 py-2 rounded font-medium',
        variant === 'primary' && 'bg-blue-500 text-white',
        variant === 'secondary' && 'bg-gray-200 text-gray-900',
        className
      )}
      {...props}
    />
  )
}
```

### Formulários com Validação

```typescript
import { useState } from 'react'
import { applyCurrencyMask } from '@/lib/currency-utils'

function FormularioProduto() {
  const [preco, setPreco] = useState(0)
  
  return (
    <form>
      <input
        type="text"
        placeholder="R$ 0,00"
        onChange={(e) => {
          const valor = applyCurrencyMask(e)
          setPreco(valor)
        }}
      />
      <p>Valor numérico: {preco}</p>
    </form>
  )
}
```

---

## 🚀 Comandos Úteis

```bash
# Desenvolvimento
npm run dev

# Build de produção
npm run build

# Iniciar produção
npm start

# Lint
npm run lint

# Instalar dependências
npm install
```

---

## 📚 Documentação Completa

Para documentação detalhada, consulte:
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - Documentação completa de todas as funções
- [LINT_ERRORS_EXPLANATION.md](./LINT_ERRORS_EXPLANATION.md) - Explicação sobre erros de lint

---

## 🔗 Links Importantes

- **Supabase Dashboard**: [app.supabase.com](https://app.supabase.com)
- **Documentação Supabase**: [supabase.com/docs](https://supabase.com/docs)
- **Documentação Next.js**: [nextjs.org/docs](https://nextjs.org/docs)
- **Documentação Tailwind**: [tailwindcss.com/docs](https://tailwindcss.com/docs)

---

## 💡 Dicas

### Performance

- Use `useRealtimePedidos` apenas em páginas que precisam de atualização em tempo real
- Sempre forneça dados iniciais para evitar flickering
- Use `React.memo` em componentes que renderizam listas grandes

### Segurança

- Nunca exponha chaves de API no frontend
- Use Row Level Security (RLS) no Supabase
- Valide dados no backend antes de salvar

### UX

- Sempre mostre feedback visual durante operações assíncronas
- Use `toast` para notificações de sucesso/erro
- Implemente loading states em botões e formulários

---

**Última atualização:** 2025-01-18
**Versão:** 3.0.0
