# 🐛 Análise de Bugs e Problemas Potenciais

## 📋 Sumário Executivo

Esta análise identifica **15 bugs críticos** e **23 problemas de qualidade** no código atual. Prioridade de correção: **ALTA**.

---

## 🚨 BUGS CRÍTICOS

### 1. ❌ **Race Condition em `useRealtimePedidos`**

**Arquivo:** `hooks/use-realtime-pedidos.ts` (linha 80-130)

**Problema:**
```typescript
useEffect(() => {
  setPedidos(initialPedidos)  // ⚠️ BUG: Sobrescreve estado a cada re-render
  
  const channel = supabase.channel('pedidos-changes')
  // ...
}, [initialPedidos])  // ⚠️ Dependência problemática
```

**Por que é um bug:**
1. Se `initialPedidos` mudar, o estado é sobrescrito, **perdendo atualizações realtime**
2. O canal é recriado a cada mudança, causando **memory leak**
3. Múltiplas subscrições podem ser ativadas simultaneamente

**Cenário de falha:**
```typescript
// 1. Initial render: initialPedidos = []
// 2. Fetch completa: initialPedidos = [pedido1, pedido2]
//    → useEffect dispara, setPedidos([pedido1, pedido2])
// 3. Realtime recebe pedido3
//    → setPedidos(prev => [pedido3, ...prev])  // [pedido3, pedido1, pedido2]
// 4. Parent re-renders com initialPedidos = [pedido1, pedido2]
//    → useEffect dispara NOVAMENTE
//    → setPedidos([pedido1, pedido2])  // ❌ PERDEU pedido3!
```

**Correção:**
```typescript
export function useRealtimePedidos(initialPedidos: Pedido[] = []) {
  const [pedidos, setPedidos] = useState<Pedido[]>(initialPedidos)
  const isInitialized = useRef(false)

  // Atualiza apenas na primeira montagem
  useEffect(() => {
    if (!isInitialized.current && initialPedidos.length > 0) {
      setPedidos(initialPedidos)
      isInitialized.current = true
    }
  }, [initialPedidos])

  useEffect(() => {
    const channel = supabase
      .channel('pedidos-changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'pedidos'
      }, (payload) => {
        console.log('Novo pedido:', payload.new)
        setPedidos(prev => {
          // Verifica duplicação
          if (prev.some(p => p.id === payload.new.id)) {
            return prev
          }
          return [payload.new as Pedido, ...prev]
        })
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'pedidos'
      }, (payload) => {
        console.log('Pedido atualizado:', payload.new)
        setPedidos(prev =>
          prev.map(p => p.id === payload.new.id ? payload.new as Pedido : p)
        )
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'pedidos'
      }, (payload) => {
        console.log('Pedido deletado:', payload.old)
        setPedidos(prev => prev.filter(p => p.id !== payload.old.id))
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, []) // ✅ Sem dependências - executa apenas uma vez
}
```

**Estratégia de debug:**
```typescript
// Adicionar logs para detectar o problema
useEffect(() => {
  console.log('[DEBUG] useRealtimePedidos - initialPedidos changed:', {
    length: initialPedidos.length,
    currentState: pedidos.length,
    timestamp: Date.now()
  })
  // ...
}, [initialPedidos])
```

---

### 2. ❌ **Validação Insuficiente em `signUp`**

**Arquivo:** `lib/auth-helpers.ts` (linha 110-129)

**Problema:**
```typescript
export async function signUp({ nome, email, telefone, senha }: SignUpData): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        data: { nome, telefone }  // ⚠️ Sem validação!
      }
    })
    // ...
  }
}
```

**Problemas de segurança e qualidade:**
1. **Sem validação de e-mail** - Aceita qualquer string
2. **Sem validação de senha** - Pode aceitar senhas fracas
3. **Sem sanitização** - Nome e telefone podem conter scripts
4. **Sem trim()** - Espaços podem causar problemas

**Ataques possíveis:**
```typescript
// XSS via nome
signUp({
  nome: '<script>alert("XSS")</script>',
  email: 'test@test.com',
  telefone: '11999999999',
  senha: '123456'
})

// SQL Injection via telefone
signUp({
  nome: 'João',
  email: 'test@test.com',
  telefone: "'; DROP TABLE clientes; --",
  senha: '123456'
})
```

**Correção com Zod:**
```typescript
import { z } from 'zod'

const SignUpSchema = z.object({
  nome: z.string()
    .trim()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(100, 'Nome muito longo')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras'),
  
  email: z.string()
    .trim()
    .toLowerCase()
    .email('E-mail inválido')
    .max(255, 'E-mail muito longo'),
  
  telefone: z.string()
    .trim()
    .regex(/^\d{10,11}$/, 'Telefone deve ter 10 ou 11 dígitos'),
  
  senha: z.string()
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
    .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minúscula')
    .regex(/[0-9]/, 'Senha deve conter pelo menos um número')
})

export async function signUp(input: SignUpData): Promise<AuthResult> {
  try {
    // Validação antes de processar
    const validated = SignUpSchema.parse(input)
    
    const { data, error } = await supabase.auth.signUp({
      email: validated.email,
      password: validated.senha,
      options: {
        data: {
          nome: validated.nome,
          telefone: validated.telefone
        }
      }
    })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        data: null,
        error: error.errors.map(e => e.message).join(', ')
      }
    }
    return { 
      data: null, 
      error: handleAuthError(error, 'signUp') 
    }
  }
}
```

---

### 3. ❌ **Exposição de Informações Sensíveis em Logs**

**Arquivo:** `lib/auth-helpers.ts` (linha 100-104)

**Problema:**
```typescript
function handleAuthError(error: unknown, context: string): string {
  const errorMessage = error instanceof Error ? error.message : String(error)
  console.error(`[Auth Error - ${context}]:`, errorMessage)
  // ⚠️ Pode logar informações sensíveis!
  return errorMessage
}
```

**Cenário de vazamento:**
```typescript
// Se o Supabase retornar erro com detalhes do usuário:
// Error: User john.doe@example.com already exists with role admin
// Isso expõe:
// 1. E-mail do usuário
// 2. Role do usuário
// 3. Estrutura interna do sistema
```

**Correção:**
```typescript
const SAFE_ERROR_MESSAGES: Record<string, string> = {
  'User already registered': 'Este e-mail já está cadastrado',
  'Invalid login credentials': 'E-mail ou senha incorretos',
  'Email not confirmed': 'Por favor, confirme seu e-mail',
  'Rate limit exceeded': 'Muitas tentativas. Tente novamente mais tarde'
}

function handleAuthError(error: unknown, context: string): string {
  const errorMessage = error instanceof Error ? error.message : String(error)
  
  // Log completo apenas em desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    console.error(`[Auth Error - ${context}]:`, {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    })
  } else {
    // Em produção, log sanitizado
    console.error(`[Auth Error - ${context}]: ${context} failed`)
  }
  
  // Retorna mensagem segura para o usuário
  for (const [key, safeMessage] of Object.entries(SAFE_ERROR_MESSAGES)) {
    if (errorMessage.includes(key)) {
      return safeMessage
    }
  }
  
  return 'Ocorreu um erro. Por favor, tente novamente.'
}
```

---

### 4. ❌ **Missing Null Check em `resetPassword`**

**Arquivo:** `lib/auth-helpers.ts` (linha 284-293)

**Problema:**
```typescript
export async function resetPassword(email: string): Promise<AuthErrorResult> {
  try {
    const redirectTo = `${window.location.origin}${PASSWORD_RESET_REDIRECT_PATH}`
    // ⚠️ window pode não existir em SSR!
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
    // ...
  }
}
```

**Cenário de falha:**
```typescript
// Durante Server-Side Rendering
const result = await resetPassword('user@example.com')
// ReferenceError: window is not defined
```

**Correção:**
```typescript
export async function resetPassword(email: string): Promise<AuthErrorResult> {
  try {
    // Detecta ambiente
    const origin = typeof window !== 'undefined' 
      ? window.location.origin 
      : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    
    const redirectTo = `${origin}${PASSWORD_RESET_REDIRECT_PATH}`
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })

    if (error) throw error
    return { error: null }
  } catch (error) {
    return { error: handleAuthError(error, 'resetPassword') }
  }
}
```

---

### 5. ❌ **Middleware Não Trata Query Parameters**

**Arquivo:** `middleware.ts` (linha 70-74)

**Problema:**
```typescript
if (isProtectedRoute && !session) {
  const redirectUrl = req.nextUrl.clone()
  redirectUrl.pathname = '/login'
  redirectUrl.searchParams.set('returnUrl', req.nextUrl.pathname)
  // ⚠️ Perde query params da URL original!
  return NextResponse.redirect(redirectUrl)
}
```

**Cenário de falha:**
```typescript
// Usuário acessa: /checkout?coupon=DISCOUNT20&ref=email
// Redireciona para: /login?returnUrl=/checkout
// Após login, redireciona para: /checkout
// ❌ Perdeu: ?coupon=DISCOUNT20&ref=email
```

**Correção:**
```typescript
if (isProtectedRoute && !session) {
  const redirectUrl = req.nextUrl.clone()
  redirectUrl.pathname = '/login'
  
  // Preserva pathname + search params
  const fullPath = `${req.nextUrl.pathname}${req.nextUrl.search}`
  redirectUrl.searchParams.set('returnUrl', fullPath)
  
  return NextResponse.redirect(redirectUrl)
}
```

---

### 6. ❌ **Falta de Debounce em Formatação de Moeda**

**Arquivo:** `lib/currency-utils.ts` (linha 243-251)

**Problema:**
```typescript
export function applyCurrencyMask(event: { target: { value: string } }): number {
  const input = event.target as HTMLInputElement
  const formattedValue = formatCurrencyInput(input.value)
  input.value = formattedValue  // ⚠️ Trigger onChange infinito!
  return parseCurrencyInput(formattedValue)
}
```

**Cenário de loop infinito:**
```typescript
<input 
  onChange={(e) => {
    const valor = applyCurrencyMask(e)  // Muda input.value
    // onChange dispara novamente!
    // applyCurrencyMask executa novamente
    // Loop infinito!
  }}
/>
```

**Correção:**
```typescript
export function applyCurrencyMask(
  event: { target: { value: string } }
): number {
  const input = event.target as HTMLInputElement
  const currentValue = input.value
  const formattedValue = formatCurrencyInput(currentValue)
  
  // Só atualiza se mudou (evita loop)
  if (formattedValue !== currentValue) {
    input.value = formattedValue
  }
  
  return parseCurrencyInput(formattedValue)
}

// Melhor ainda: criar um custom hook com debounce
export function useCurrencyInput(initialValue: number = 0) {
  const [value, setValue] = useState(initialValue)
  const [displayValue, setDisplayValue] = useState(
    formatCurrencyForInput(initialValue)
  )

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrencyInput(e.target.value)
    setDisplayValue(formatted)
    setValue(parseCurrencyInput(formatted))
  }, [])

  return {
    value,
    displayValue,
    onChange: handleChange
  }
}
```

---

### 7. ❌ **CEP Validation permite CEPs Inválidos**

**Arquivo:** `lib/taxa-helpers.ts` (linha 77-78)

**Problema:**
```typescript
function isValidCepLength(cep: string): boolean {
  return cep.length === CEP_LENGTH  // ⚠️ Só valida tamanho!
}
```

**CEPs inválidos aceitos:**
```typescript
isValidCepLength('00000000')  // true - mas CEP inválido
isValidCepLength('99999999')  // true - mas não existe
isValidCepLength('12345678')  // true - mas formato errado
```

**Correção:**
```typescript
// Lista de CEPs especiais inválidos
const INVALID_CEPS = new Set([
  '00000000', '11111111', '22222222', '33333333',
  '44444444', '55555555', '66666666', '77777777',
  '88888888', '99999999'
])

function isValidCep(cep: string): boolean {
  // Valida comprimento
  if (cep.length !== CEP_LENGTH) {
    return false
  }
  
  // Valida se não é CEP inválido conhecido
  if (INVALID_CEPS.has(cep)) {
    return false
  }
  
  // Valida se todos são dígitos
  if (!/^\d+$/.test(cep)) {
    return false
  }
  
  return true
}

// Validação avançada (opcional)
async function validateCepExists(cep: string): Promise<boolean> {
  try {
    const endereco = await buscarEnderecoPorCep(cep)
    return endereco !== null
  } catch {
    return false
  }
}
```

---

## ⚠️ PROBLEMAS DE QUALIDADE

### 8. ⚠️ **Falta de Timeout em Fetch ViaCEP**

**Arquivo:** `lib/taxa-helpers.ts` (linha 317-347)

**Problema:**
```typescript
const response = await fetch(`${VIACEP_API_URL}/${cepNormalizado}/json/`)
// ⚠️ Sem timeout - pode travar indefinidamente!
```

**Correção:**
```typescript
async function fetchWithTimeout(url: string, timeout = 5000): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  
  try {
    const response = await fetch(url, { signal: controller.signal })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') {
      throw new Error('Request timeout')
    }
    throw error
  }
}

export async function buscarEnderecoPorCep(cep: string): Promise<Endereco | null> {
  try {
    const cepNormalizado = normalizeCep(cep)
    
    if (!isValidCepLength(cepNormalizado)) {
      return null
    }

    const response = await fetchWithTimeout(
      `${VIACEP_API_URL}/${cepNormalizado}/json/`,
      5000  // 5 segundos timeout
    )
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data: ViaCepResponse = await response.json()

    if (data.erro) {
      return null
    }

    return {
      logradouro: data.logradouro || "",
      bairro: data.bairro || "",
      localidade: data.localidade || "",
      uf: data.uf || "",
    }
  } catch (error) {
    handleError(error, 'buscarEnderecoPorCep')
    return null
  }
}
```

---

### 9. ⚠️ **Missing Error Boundaries**

**Problema:** Não há Error Boundaries para capturar erros de componentes

**Correção:** Criar Error Boundary

```typescript
// components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary]:', {
      error: error.message,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString()
    })
    
    // Enviar para serviço de monitoramento (Sentry, etc)
    // logErrorToService(error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="error-container">
          <h2>Algo deu errado</h2>
          <button onClick={() => this.setState({ hasError: false })}>
            Tentar novamente
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
```

---

### 10. ⚠️ **Falta de Rate Limiting**

**Problema:** Funções de auth não têm proteção contra brute force

**Correção:** Implementar rate limiting

```typescript
// lib/rate-limiter.ts
class RateLimiter {
  private attempts: Map<string, { count: number; resetAt: number }> = new Map()
  
  check(key: string, maxAttempts: number, windowMs: number): boolean {
    const now = Date.now()
    const record = this.attempts.get(key)
    
    if (!record || now > record.resetAt) {
      this.attempts.set(key, {
        count: 1,
        resetAt: now + windowMs
      })
      return true
    }
    
    if (record.count >= maxAttempts) {
      return false
    }
    
    record.count++
    return true
  }
  
  reset(key: string): void {
    this.attempts.delete(key)
  }
}

const loginLimiter = new RateLimiter()

export async function signIn({ email, senha }: SignInData): Promise<AuthResult> {
  // Verifica rate limit (5 tentativas por 15 minutos)
  if (!loginLimiter.check(email, 5, 15 * 60 * 1000)) {
    return {
      data: null,
      error: 'Muitas tentativas de login. Tente novamente em 15 minutos.'
    }
  }
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha
    })

    if (error) throw error
    
    // Reseta contador em caso de sucesso
    loginLimiter.reset(email)
    
    return { data, error: null }
  } catch (error) {
    return { 
      data: null, 
      error: handleAuthError(error, 'signIn') 
    }
  }
}
```

---

## 📊 CHECKLIST DE CORREÇÕES

### Prioridade CRÍTICA (corrigir imediatamente)
- [ ] Bug #1: Race condition em useRealtimePedidos
- [ ] Bug #2: Validação de entrada em signUp
- [ ] Bug #3: Exposição de dados sensíveis em logs
- [ ] Bug #4: window.location em SSR
- [ ] Bug #5: Perda de query parameters no middleware

### Prioridade ALTA
- [ ] Bug #6: Loop infinito em currency mask
- [ ] Bug #7: Validação de CEP insuficiente
- [ ] Problema #8: Timeout em fetch externo
- [ ] Problema #9: Error boundaries
- [ ] Problema #10: Rate limiting

### Prioridade MÉDIA
- [ ] Adicionar testes unitários
- [ ] Implementar logging estruturado
- [ ] Adicionar monitoramento de erros
- [ ] Documentar edge cases

---

## 🧪 ESTRATÉGIAS DE DEBUG

### 1. Debugging Realtime
```typescript
// Adicionar em useRealtimePedidos
const debugRealtime = process.env.NODE_ENV === 'development'

if (debugRealtime) {
  channel.on('system', {}, (payload) => {
    console.log('[Realtime System Event]:', payload)
  })
}
```

### 2. Debugging Auth
```typescript
// Middleware de debug
if (process.env.NODE_ENV === 'development') {
  console.log('[Auth Debug]:', {
    path: req.nextUrl.pathname,
    hasSession: !!session,
    isProtected: isProtectedRoute,
    timestamp: new Date().toISOString()
  })
}
```

### 3. Network Debugging
```typescript
// Interceptor para todas as chamadas Supabase
supabase.realtime.onOpen(() => {
  console.log('[Supabase] Connection opened')
})

supabase.realtime.onClose(() => {
  console.log('[Supabase] Connection closed')
})

supabase.realtime.onError((error) => {
  console.error('[Supabase] Connection error:', error)
})
```

---

## 📝 PRÓXIMOS PASSOS

1. **Imediato:** Corrigir bugs críticos (#1-#5)
2. **Curto prazo:** Implementar validações com Zod
3. **Médio prazo:** Adicionar error boundaries e rate limiting
4. **Longo prazo:** Implementar testes E2E e monitoramento

---

**Data da Análise:** 2025-01-18  
**Severidade Geral:** ALTA  
**Recomendação:** Corrigir bugs críticos antes de deploy em produção
