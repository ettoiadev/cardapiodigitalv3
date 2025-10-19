# 🔄 PLANO DE RECONSTRUÇÃO COMPLETA - SISTEMA DE AUTENTICAÇÃO

**Data:** 18/10/2025  
**Objetivo:** Reconstruir todo o fluxo de autenticação de cliente do zero, eliminando bugs e criando arquitetura robusta

---

## 📊 ANÁLISE DO SISTEMA ATUAL

### **Fluxo Completo Identificado:**

```
1. Homepage (/) 
   → Seleção de produtos
   → Adicionar ao carrinho (localStorage)
   
2. Carrinho (CartFooter)
   → Visualizar itens
   → Ir para checkout
   
3. Checkout (/checkout) [PROTEGIDO]
   → Verificar autenticação
   → Se não logado → /login?returnUrl=/checkout
   → Preencher dados de entrega
   → Escolher pagamento
   → Finalizar pedido
   
4. Login (/login)
   → Supabase Auth signIn
   → Aguardar sessão (800ms)
   → window.location.replace(returnUrl)
   
5. Cadastro (/cadastro)
   → Supabase Auth signUp
   → Metadados: nome, telefone
   → Redirecionar para /login
   
6. Perfil (/perfil) [PROTEGIDO]
   → Buscar dados em public.clientes
   → Fallback: criar se não existir
   → Editar dados pessoais/endereço
```

---

## 🐛 PROBLEMAS IDENTIFICADOS

### **1. Arquitetura**
- ❌ **Dois sistemas de auth misturados**: Supabase Auth + localStorage
- ❌ **Fallback manual** na página de perfil (deveria ser automático)
- ❌ **Trigger não criado** (requer Dashboard manual)
- ❌ **Sessão não persiste** corretamente entre páginas
- ❌ **window.location.replace** força reload completo

### **2. Banco de Dados**
- ❌ **Dessincronia** entre `auth.users` e `public.clientes`
- ❌ **Falta constraint** para garantir 1:1
- ❌ **Sem índices** otimizados para queries de auth
- ❌ **RLS policies** genéricas demais

### **3. Frontend**
- ❌ **Delays artificiais** (800ms, 500ms) para "garantir" sessão
- ❌ **Múltiplos useEffect** sem cleanup
- ❌ **Estados duplicados** (loading, submitting, etc)
- ❌ **Validações inconsistentes** entre páginas
- ❌ **Sem tratamento** de edge cases (rede lenta, timeout)

### **4. Middleware**
- ❌ **Não valida** expiração de token
- ❌ **Não refresh** token automaticamente
- ❌ **Não trata** erros de rede
- ❌ **Matcher muito amplo** (processa rotas desnecessárias)

### **5. Carrinho**
- ❌ **Não vincula** carrinho ao usuário logado
- ❌ **Perde dados** se localStorage limpar
- ❌ **Sem sincronização** com backend
- ❌ **Não migra** carrinho anônimo → logado

---

## ✨ NOVA ARQUITETURA PROPOSTA

### **Princípios:**
1. **Single Source of Truth**: Supabase Auth como única fonte
2. **Zero Delays**: Sem setTimeout artificiais
3. **Type-Safe**: TypeScript strict em tudo
4. **Resiliente**: Retry automático, fallbacks inteligentes
5. **Testável**: Funções puras, mocks fáceis

---

## 🗄️ FASE 1: RECONSTRUÇÃO DO BANCO DE DADOS

### **1.1 Nova Estrutura da Tabela `clientes`**

```sql
-- Remover tabela antiga
DROP TABLE IF EXISTS public.clientes CASCADE;

-- Criar nova estrutura otimizada
CREATE TABLE public.clientes (
    -- Chave primária (mesmo ID do auth.users)
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Dados básicos (obrigatórios)
    email TEXT NOT NULL UNIQUE,
    nome TEXT NOT NULL CHECK (length(nome) >= 2),
    telefone TEXT NOT NULL CHECK (telefone ~ '^\d{10,11}$'),
    
    -- Flags de verificação
    email_verificado BOOLEAN DEFAULT false NOT NULL,
    telefone_verificado BOOLEAN DEFAULT false NOT NULL,
    ativo BOOLEAN DEFAULT true NOT NULL,
    
    -- Endereço padrão (opcional)
    endereco_rua TEXT,
    endereco_numero TEXT,
    endereco_bairro TEXT,
    endereco_cidade TEXT,
    endereco_estado TEXT CHECK (length(endereco_estado) = 2),
    endereco_cep TEXT CHECK (endereco_cep ~ '^\d{8}$'),
    endereco_complemento TEXT,
    endereco_referencia TEXT,
    
    -- Preferências
    aceita_marketing BOOLEAN DEFAULT true,
    aceita_whatsapp BOOLEAN DEFAULT true,
    
    -- Timestamps
    criado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    atualizado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    ultimo_acesso TIMESTAMPTZ,
    
    -- Constraints
    CONSTRAINT email_valido CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

-- Índices otimizados
CREATE INDEX idx_clientes_email ON public.clientes(email);
CREATE INDEX idx_clientes_telefone ON public.clientes(telefone);
CREATE INDEX idx_clientes_ativo ON public.clientes(ativo) WHERE ativo = true;
CREATE INDEX idx_clientes_criado_em ON public.clientes(criado_em DESC);

-- Comentários
COMMENT ON TABLE public.clientes IS 'Dados estendidos dos clientes (sincronizado com auth.users)';
COMMENT ON COLUMN public.clientes.id IS 'FK para auth.users.id (CASCADE DELETE)';
```

### **1.2 Trigger Automático (Robusto)**

```sql
-- Função melhorada com validações
CREATE OR REPLACE FUNCTION public.sync_auth_user_to_cliente()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_nome TEXT;
    v_telefone TEXT;
BEGIN
    -- Extrair e validar dados
    v_nome := COALESCE(
        NULLIF(trim(NEW.raw_user_meta_data->>'nome'), ''),
        split_part(NEW.email, '@', 1),
        'Cliente'
    );
    
    v_telefone := COALESCE(
        regexp_replace(NEW.raw_user_meta_data->>'telefone', '\D', '', 'g'),
        ''
    );
    
    -- Inserir ou atualizar
    INSERT INTO public.clientes (
        id,
        email,
        nome,
        telefone,
        email_verificado,
        ativo,
        criado_em,
        atualizado_em
    )
    VALUES (
        NEW.id,
        NEW.email,
        v_nome,
        v_telefone,
        (NEW.email_confirmed_at IS NOT NULL),
        true,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        email_verificado = EXCLUDED.email_verificado,
        atualizado_em = NOW();
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log erro mas não falha o signup
        RAISE WARNING 'Erro ao sincronizar cliente: %', SQLERRM;
        RETURN NEW;
END;
$$;

-- Trigger
DROP TRIGGER IF EXISTS trg_sync_auth_user ON auth.users;
CREATE TRIGGER trg_sync_auth_user
    AFTER INSERT OR UPDATE OF email, email_confirmed_at, raw_user_meta_data
    ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_auth_user_to_cliente();
```

### **1.3 RLS Policies (Seguras)**

```sql
-- Habilitar RLS
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

-- Policy: Cliente vê apenas seus dados
CREATE POLICY "clientes_select_own"
ON public.clientes FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Policy: Cliente atualiza apenas seus dados
CREATE POLICY "clientes_update_own"
ON public.clientes FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy: Sistema pode inserir (via trigger)
CREATE POLICY "clientes_insert_system"
ON public.clientes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Policy: Admin vê tudo
CREATE POLICY "clientes_admin_all"
ON public.clientes FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.admins
        WHERE admins.id = auth.uid()
    )
);
```

---

## 🔧 FASE 2: RECONSTRUÇÃO DO AUTH-HELPERS

### **2.1 Novo Arquivo: `lib/auth.ts`**

```typescript
/**
 * AUTH SYSTEM V2
 * Sistema de autenticação robusto e type-safe
 */

import { supabase } from './supabase'
import type { User, Session, AuthError } from '@supabase/supabase-js'

// ============================================================================
// TYPES
// ============================================================================

export interface Cliente {
  id: string
  email: string
  nome: string
  telefone: string
  email_verificado: boolean
  telefone_verificado: boolean
  ativo: boolean
  endereco_rua: string | null
  endereco_numero: string | null
  endereco_bairro: string | null
  endereco_cidade: string | null
  endereco_estado: string | null
  endereco_cep: string | null
  endereco_complemento: string | null
  endereco_referencia: string | null
  aceita_marketing: boolean
  aceita_whatsapp: boolean
  criado_em: string
  atualizado_em: string
  ultimo_acesso: string | null
}

export interface AuthResponse<T = any> {
  data: T | null
  error: AuthError | null
}

export interface SignUpInput {
  nome: string
  email: string
  telefone: string
  senha: string
}

export interface SignInInput {
  email: string
  senha: string
}

// ============================================================================
// VALIDAÇÕES
// ============================================================================

const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$/
const TELEFONE_REGEX = /^\d{10,11}$/

export function validateEmail(email: string): boolean {
  return EMAIL_REGEX.test(email)
}

export function validateTelefone(telefone: string): boolean {
  const cleaned = telefone.replace(/\D/g, '')
  return TELEFONE_REGEX.test(cleaned)
}

export function validateSenha(senha: string): boolean {
  return senha.length >= 6
}

export function validateNome(nome: string): boolean {
  return nome.trim().length >= 2
}

// ============================================================================
// AUTH OPERATIONS
// ============================================================================

/**
 * Cadastrar novo cliente
 */
export async function signUp(input: SignUpInput): Promise<AuthResponse<User>> {
  try {
    // Validações
    if (!validateNome(input.nome)) {
      throw new Error('Nome deve ter pelo menos 2 caracteres')
    }
    if (!validateEmail(input.email)) {
      throw new Error('Email inválido')
    }
    if (!validateTelefone(input.telefone)) {
      throw new Error('Telefone inválido (deve ter 10 ou 11 dígitos)')
    }
    if (!validateSenha(input.senha)) {
      throw new Error('Senha deve ter pelo menos 6 caracteres')
    }

    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.senha,
      options: {
        data: {
          nome: input.nome.trim(),
          telefone: input.telefone.replace(/\D/g, '')
        }
      }
    })

    if (error) throw error

    return { data: data.user, error: null }
  } catch (error) {
    return {
      data: null,
      error: error as AuthError
    }
  }
}

/**
 * Fazer login
 */
export async function signIn(input: SignInInput): Promise<AuthResponse<Session>> {
  try {
    if (!validateEmail(input.email)) {
      throw new Error('Email inválido')
    }
    if (!input.senha) {
      throw new Error('Senha é obrigatória')
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: input.email,
      password: input.senha
    })

    if (error) throw error

    // Atualizar último acesso
    if (data.user) {
      await supabase
        .from('clientes')
        .update({ ultimo_acesso: new Date().toISOString() })
        .eq('id', data.user.id)
    }

    return { data: data.session, error: null }
  } catch (error) {
    return {
      data: null,
      error: error as AuthError
    }
  }
}

/**
 * Fazer logout
 */
export async function signOut(): Promise<AuthResponse<null>> {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    return { data: null, error: null }
  } catch (error) {
    return {
      data: null,
      error: error as AuthError
    }
  }
}

/**
 * Obter sessão atual
 */
export async function getSession(): Promise<AuthResponse<Session>> {
  try {
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error
    return { data: data.session, error: null }
  } catch (error) {
    return {
      data: null,
      error: error as AuthError
    }
  }
}

/**
 * Obter usuário atual
 */
export async function getUser(): Promise<AuthResponse<User>> {
  try {
    const { data, error } = await supabase.auth.getUser()
    if (error) throw error
    return { data: data.user, error: null }
  } catch (error) {
    return {
      data: null,
      error: error as AuthError
    }
  }
}

/**
 * Obter dados completos do cliente
 */
export async function getCliente(userId: string): Promise<AuthResponse<Cliente>> {
  try {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    return {
      data: null,
      error: error as AuthError
    }
  }
}

/**
 * Atualizar dados do cliente
 */
export async function updateCliente(
  userId: string,
  updates: Partial<Omit<Cliente, 'id' | 'email' | 'criado_em'>>
): Promise<AuthResponse<Cliente>> {
  try {
    const { data, error } = await supabase
      .from('clientes')
      .update({
        ...updates,
        atualizado_em: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    return {
      data: null,
      error: error as AuthError
    }
  }
}

/**
 * Atualizar senha
 */
export async function updatePassword(newPassword: string): Promise<AuthResponse<User>> {
  try {
    if (!validateSenha(newPassword)) {
      throw new Error('Senha deve ter pelo menos 6 caracteres')
    }

    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) throw error

    return { data: data.user, error: null }
  } catch (error) {
    return {
      data: null,
      error: error as AuthError
    }
  }
}

/**
 * Solicitar reset de senha
 */
export async function resetPassword(email: string): Promise<AuthResponse<null>> {
  try {
    if (!validateEmail(email)) {
      throw new Error('Email inválido')
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/recuperar-senha`
    })

    if (error) throw error

    return { data: null, error: null }
  } catch (error) {
    return {
      data: null,
      error: error as AuthError
    }
  }
}

// ============================================================================
// AUTH STATE LISTENER
// ============================================================================

export function onAuthStateChange(
  callback: (event: string, session: Session | null) => void
) {
  return supabase.auth.onAuthStateChange(callback)
}
```

---

## 🎨 FASE 3: RECONSTRUÇÃO DO FRONTEND

### **3.1 Nova Página de Login**

```typescript
// app/login/page.tsx
"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "@/lib/auth"
import { toast } from "sonner"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnUrl = searchParams.get("returnUrl") || "/perfil"
  
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { data, error } = await signIn({ email, senha })

    if (error) {
      toast.error(error.message || "Erro ao fazer login")
      setLoading(false)
      return
    }

    toast.success("Login realizado com sucesso!")
    router.push(returnUrl)
  }

  return (
    // ... JSX
  )
}
```

### **3.2 Nova Página de Cadastro**

```typescript
// app/cadastro/page.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signUp } from "@/lib/auth"
import { toast } from "sonner"

export default function CadastroPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    senha: "",
    confirmarSenha: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.senha !== formData.confirmarSenha) {
      toast.error("As senhas não coincidem")
      return
    }

    setLoading(true)

    const { data, error } = await signUp({
      nome: formData.nome,
      email: formData.email,
      telefone: formData.telefone,
      senha: formData.senha
    })

    if (error) {
      toast.error(error.message || "Erro ao criar conta")
      setLoading(false)
      return
    }

    toast.success("Conta criada com sucesso!")
    router.push("/login?returnUrl=/checkout")
  }

  return (
    // ... JSX
  )
}
```

---

## 🛡️ FASE 4: NOVO MIDDLEWARE

```typescript
// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PROTECTED_ROUTES = ['/checkout', '/meus-pedidos', '/perfil', '/pedido']
const AUTH_ROUTES = ['/login', '/cadastro']

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  try {
    const { data: { session }, error } = await supabase.auth.getSession()

    // Se erro ao obter sessão, redirecionar para login
    if (error) {
      console.error('Erro no middleware:', error)
      if (isProtectedRoute(req.nextUrl.pathname)) {
        return redirectToLogin(req)
      }
      return res
    }

    // Rota protegida sem sessão
    if (isProtectedRoute(req.nextUrl.pathname) && !session) {
      return redirectToLogin(req)
    }

    // Rota de auth com sessão ativa
    if (isAuthRoute(req.nextUrl.pathname) && session) {
      return redirectToReturnUrl(req)
    }

    return res
  } catch (error) {
    console.error('Erro inesperado no middleware:', error)
    return res
  }
}

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(route => pathname.startsWith(route))
}

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some(route => pathname.startsWith(route))
}

function redirectToLogin(req: NextRequest): NextResponse {
  const url = req.nextUrl.clone()
  url.pathname = '/login'
  url.searchParams.set('returnUrl', req.nextUrl.pathname + req.nextUrl.search)
  return NextResponse.redirect(url)
}

function redirectToReturnUrl(req: NextRequest): NextResponse {
  const url = req.nextUrl.clone()
  const returnUrl = req.nextUrl.searchParams.get('returnUrl')
  url.pathname = returnUrl && returnUrl.startsWith('/') ? returnUrl : '/'
  url.search = ''
  return NextResponse.redirect(url)
}

export const config = {
  matcher: [
    '/checkout/:path*',
    '/meus-pedidos/:path*',
    '/perfil/:path*',
    '/pedido/:path*',
    '/login',
    '/cadastro'
  ]
}
```

---

## 📦 FASE 5: INTEGRAÇÃO CARRINHO + AUTH

### **5.1 Vincular Carrinho ao Usuário**

```typescript
// lib/cart-context.tsx (adicionar)

// Salvar carrinho no backend quando usuário logar
export async function syncCartToUser(userId: string, items: CartItem[]) {
  try {
    await supabase
      .from('carrinhos_salvos')
      .upsert({
        user_id: userId,
        items: JSON.stringify(items),
        updated_at: new Date().toISOString()
      })
  } catch (error) {
    console.error('Erro ao sincronizar carrinho:', error)
  }
}

// Recuperar carrinho do backend
export async function loadCartFromUser(userId: string): Promise<CartItem[]> {
  try {
    const { data, error } = await supabase
      .from('carrinhos_salvos')
      .select('items')
      .eq('user_id', userId)
      .single()

    if (error) throw error
    return JSON.parse(data.items)
  } catch (error) {
    console.error('Erro ao carregar carrinho:', error)
    return []
  }
}
```

---

## 🧪 FASE 6: TESTES

### **6.1 Testes Unitários**

```typescript
// __tests__/auth.test.ts
import { validateEmail, validateTelefone, validateSenha } from '@/lib/auth'

describe('Validações de Auth', () => {
  test('validateEmail aceita emails válidos', () => {
    expect(validateEmail('teste@example.com')).toBe(true)
    expect(validateEmail('user+tag@domain.co.uk')).toBe(true)
  })

  test('validateEmail rejeita emails inválidos', () => {
    expect(validateEmail('invalido')).toBe(false)
    expect(validateEmail('@example.com')).toBe(false)
  })

  test('validateTelefone aceita telefones válidos', () => {
    expect(validateTelefone('11999999999')).toBe(true)
    expect(validateTelefone('1199999999')).toBe(true)
  })

  test('validateSenha valida comprimento mínimo', () => {
    expect(validateSenha('123456')).toBe(true)
    expect(validateSenha('12345')).toBe(false)
  })
})
```

---

## 📋 CRONOGRAMA DE IMPLEMENTAÇÃO

### **Semana 1: Banco de Dados**
- [ ] Dia 1-2: Criar nova estrutura de tabelas
- [ ] Dia 3: Implementar triggers robustos
- [ ] Dia 4: Configurar RLS policies
- [ ] Dia 5: Migrar dados existentes

### **Semana 2: Backend**
- [ ] Dia 1-2: Reescrever auth-helpers
- [ ] Dia 3: Criar validações
- [ ] Dia 4: Implementar error handling
- [ ] Dia 5: Testes unitários

### **Semana 3: Frontend**
- [ ] Dia 1-2: Refazer páginas de login/cadastro
- [ ] Dia 3: Refazer página de perfil
- [ ] Dia 4: Refazer checkout
- [ ] Dia 5: Integração carrinho

### **Semana 4: Testes e Deploy**
- [ ] Dia 1-2: Testes E2E
- [ ] Dia 3: Correções de bugs
- [ ] Dia 4: Documentação
- [ ] Dia 5: Deploy gradual

---

## ✅ CHECKLIST DE VALIDAÇÃO

### **Funcional:**
- [ ] Cadastro cria usuário em auth.users
- [ ] Trigger cria cliente em public.clientes
- [ ] Login estabelece sessão
- [ ] Middleware protege rotas
- [ ] Carrinho persiste entre sessões
- [ ] Checkout funciona end-to-end
- [ ] Logout limpa sessão

### **Performance:**
- [ ] Login < 1s
- [ ] Cadastro < 2s
- [ ] Sem delays artificiais
- [ ] Queries otimizadas

### **Segurança:**
- [ ] RLS habilitado
- [ ] Senhas hasheadas
- [ ] Tokens seguros
- [ ] Validações server-side

### **UX:**
- [ ] Feedback visual claro
- [ ] Mensagens de erro úteis
- [ ] Loading states
- [ ] Sem reloads desnecessários

---

**Próximo passo:** Aprovar plano e iniciar Fase 1 (Banco de Dados)
