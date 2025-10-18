# 📚 Documentação do Projeto - Cardápio Digital v3

## 🎯 Visão Geral

Bem-vindo à documentação completa do projeto Cardápio Digital v3. Este projeto é uma aplicação web moderna para gerenciamento de pedidos de restaurantes, construída com Next.js, React, TypeScript e Supabase.

---

## 📖 Índice de Documentação

### 1. [API Documentation](./API_DOCUMENTATION.md)
**Documentação completa de todas as funções, hooks e utilitários**

Conteúdo:
- ✅ Módulo de Autenticação (`auth-helpers`)
- ✅ Utilitários de Moeda (`currency-utils`)
- ✅ Helpers de Taxa de Entrega (`taxa-helpers`)
- ✅ Utilitários Gerais (`utils`)
- ✅ Hook de Realtime (`useRealtimePedidos`)
- ✅ Middleware de Autenticação

### 2. [Quick Reference](./QUICK_REFERENCE.md)
**Guia rápido de uso com exemplos práticos**

Conteúdo:
- 🚀 Exemplos de código prontos para usar
- 📊 Estrutura de dados
- 🎨 Padrões de código
- 💡 Dicas e boas práticas

### 3. [Lint Errors Explanation](./LINT_ERRORS_EXPLANATION.md)
**Explicação sobre erros de lint e como resolvê-los**

Conteúdo:
- ❌ Erros comuns e por que ocorrem
- ✅ Como resolver todos os erros
- 🔧 Configuração do TypeScript
- 🐛 Troubleshooting

---

## 🏗️ Estrutura do Projeto

```
cardapiodigitalv3/
├── app/                    # Páginas Next.js (App Router)
├── components/             # Componentes React
│   └── ui/                # Componentes de UI (shadcn)
├── hooks/                 # Custom React Hooks
│   └── use-realtime-pedidos.ts
├── lib/                   # Bibliotecas e utilitários
│   ├── auth-helpers.ts    # Funções de autenticação
│   ├── currency-utils.ts  # Formatação de moeda
│   ├── taxa-helpers.ts    # Taxas de entrega
│   ├── utils.ts           # Utilitários gerais
│   └── supabase.ts        # Cliente Supabase
├── middleware.ts          # Middleware de autenticação
├── docs/                  # Documentação (você está aqui!)
│   ├── README.md
│   ├── API_DOCUMENTATION.md
│   ├── QUICK_REFERENCE.md
│   └── LINT_ERRORS_EXPLANATION.md
└── public/                # Arquivos estáticos
```

---

## 🚀 Quick Start

### Instalação

```bash
# Clonar repositório
git clone [url-do-repositorio]

# Entrar na pasta
cd cardapiodigitalv3

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env.local
# Editar .env.local com suas credenciais Supabase

# Iniciar servidor de desenvolvimento
npm run dev
```

### Primeiro Uso

```typescript
// 1. Importar funções necessárias
import { signIn, getUser } from '@/lib/auth-helpers'
import { formatCurrency } from '@/lib/currency-utils'
import { buscarTaxaPorCep } from '@/lib/taxa-helpers'

// 2. Usar em seus componentes
const { user } = await getUser()
const preco = formatCurrency(45.90)
const taxa = await buscarTaxaPorCep('01310-100')
```

---

## 📦 Tecnologias Principais

### Frontend
- **Next.js 15** - Framework React com SSR e App Router
- **React 19** - Biblioteca UI
- **TypeScript 5** - Tipagem estática
- **Tailwind CSS** - Framework CSS utility-first
- **shadcn/ui** - Componentes UI acessíveis

### Backend & Database
- **Supabase** - Backend as a Service
  - PostgreSQL Database
  - Authentication
  - Realtime Subscriptions
  - Storage

### Ferramentas
- **ESLint** - Linter
- **Prettier** - Formatação de código
- **Zod** - Validação de schemas

---

## 📝 Padrões de Documentação

Todo o código está documentado usando **JSDoc** seguindo o padrão Google Style:

```typescript
/**
 * Descrição breve da função
 * 
 * Descrição detalhada explicando o comportamento,
 * casos de uso e considerações importantes.
 * 
 * @async
 * @param {tipo} nomeParametro - Descrição do parâmetro
 * @returns {tipo} Descrição do retorno
 * @throws {Error} Quando ocorre erro
 * 
 * @example
 * const resultado = await minhaFuncao('valor')
 * console.log(resultado)
 */
```

---

## 🔐 Autenticação e Segurança

### Fluxo de Autenticação

1. **Cadastro**: `signUp()` → Cria usuário no Supabase Auth
2. **Login**: `signIn()` → Autentica e cria sessão
3. **Proteção**: Middleware verifica sessão em rotas protegidas
4. **Logout**: `signOut()` → Invalida sessão

### Rotas Protegidas

O middleware protege automaticamente:
- `/checkout` - Finalização de pedido
- `/meus-pedidos` - Histórico
- `/perfil` - Perfil do usuário
- `/pedido/:id` - Detalhes do pedido

---

## 💰 Formatação de Moeda

### Padrão Brasileiro (BRL)

Todas as funções seguem o padrão:
- Símbolo: `R$`
- Separador decimal: `,` (vírgula)
- Separador de milhar: `.` (ponto)
- Casas decimais: 2

```typescript
formatCurrency(1234.56)  // "R$ 1.234,56"
```

---

## 🚚 Sistema de Entrega

### Cálculo de Taxa

1. **Por CEP**: Busca em faixas de CEP cadastradas
2. **Por Bairro**: Busca por nome do bairro
3. **Validação**: Verifica se área é atendida

### Integração ViaCEP

Preenchimento automático de endereço:
```typescript
const endereco = await buscarEnderecoPorCep('01310-100')
// Retorna: logradouro, bairro, cidade, UF
```

---

## 🔄 Realtime

### Supabase Realtime

O hook `useRealtimePedidos` sincroniza automaticamente:
- **INSERT**: Novos pedidos aparecem instantaneamente
- **UPDATE**: Status atualizado em tempo real
- **DELETE**: Pedidos removidos da lista

```typescript
const pedidos = useRealtimePedidos(initialData)
// Lista sempre sincronizada com o banco
```

---

## 🎨 Estilização

### Tailwind CSS + shadcn/ui

Componentes seguem padrão:
```typescript
import { cn } from '@/lib/utils'

<button className={cn(
  'base-classes',
  variant === 'primary' && 'primary-classes',
  className
)}>
```

### Temas

Suporte a dark mode via `next-themes`:
```typescript
import { useTheme } from 'next-themes'

const { theme, setTheme } = useTheme()
```

---

## 📊 Estrutura de Dados

### Principais Entidades

```typescript
// Cliente
interface Cliente {
  id: string
  nome: string
  email: string
  telefone: string
  created_at: string
}

// Pedido
interface Pedido {
  id: string
  numero_pedido: string
  cliente_id: string
  status: string
  total: number
  taxa_entrega: number
  created_at: string
}

// Taxa de Entrega
interface TaxaEntrega {
  taxa: number
  bairro: string
  tempo_min: number
  tempo_max: number
}
```

---

## 🧪 Testes

### Executar Testes

```bash
# Testes unitários
npm test

# Testes E2E
npm run test:e2e

# Coverage
npm run test:coverage
```

---

## 🚀 Deploy

### Build de Produção

```bash
# Gerar build otimizado
npm run build

# Testar build localmente
npm start
```

### Variáveis de Ambiente

Necessárias para produção:
```env
NEXT_PUBLIC_SUPABASE_URL=sua-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-key
```

---

## 🤝 Contribuindo

### Padrões de Código

1. **TypeScript**: Sempre use tipagem estática
2. **JSDoc**: Documente todas as funções públicas
3. **ESLint**: Siga as regras configuradas
4. **Commits**: Use Conventional Commits

### Workflow

1. Criar branch feature
2. Implementar mudanças
3. Adicionar testes
4. Atualizar documentação
5. Criar Pull Request

---

## 📞 Suporte

### Documentação

- [API Documentation](./API_DOCUMENTATION.md) - Referência completa
- [Quick Reference](./QUICK_REFERENCE.md) - Exemplos práticos
- [Lint Errors](./LINT_ERRORS_EXPLANATION.md) - Troubleshooting

### Links Externos

- [Supabase Docs](https://supabase.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind Docs](https://tailwindcss.com/docs)
- [TypeScript Docs](https://www.typescriptlang.org/docs)

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

---

## 🎉 Agradecimentos

Obrigado por usar o Cardápio Digital v3! 

Para dúvidas ou sugestões, consulte a documentação ou abra uma issue no repositório.

---

**Última atualização:** 2025-01-18  
**Versão:** 3.0.0  
**Autor:** [Seu Nome/Equipe]
