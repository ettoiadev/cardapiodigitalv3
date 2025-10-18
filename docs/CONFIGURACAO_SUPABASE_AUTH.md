# 🔐 CONFIGURAÇÃO DO SUPABASE AUTH

**Data:** 18/10/2025  
**Projeto:** cardapiodigitalv3  
**Status:** Guia de configuração

---

## 📋 VISÃO GERAL

O Supabase Auth será usado para autenticação de clientes no frontend, permitindo:
- ✅ Cadastro de novos clientes
- ✅ Login com email/senha
- ✅ Recuperação de senha
- ✅ Verificação de email (opcional)
- ✅ Sessões seguras com JWT
- ✅ Integração automática com RLS

---

## 🎯 PASSO A PASSO - CONFIGURAÇÃO NO DASHBOARD

### **1. Acessar Configurações de Autenticação**

1. Acesse: https://supabase.com/dashboard
2. Selecione o projeto: **cardapiodigitalv3**
3. No menu lateral, clique em **Authentication**
4. Clique em **Settings** (ou Configurações)

---

### **2. Configurar Providers**

#### **2.1. Email/Password (Principal)**

1. Em **Auth Providers**, localize **Email**
2. Certifique-se que está **HABILITADO** (toggle verde)
3. Configure as opções:

```
✅ Enable email provider: ON
✅ Confirm email: OFF (para facilitar testes iniciais)
✅ Secure email change: ON
✅ Enable email OTP: OFF
```

**Recomendação:** Deixe "Confirm email" desabilitado inicialmente para facilitar testes. Habilite depois em produção.

---

### **3. Configurar URLs de Redirecionamento**

1. Ainda em **Settings**, vá para **URL Configuration**
2. Configure as URLs:

```
Site URL: http://localhost:3000
Redirect URLs: 
  - http://localhost:3000
  - http://localhost:3000/login
  - http://localhost:3000/cadastro
  - http://localhost:3000/auth/callback
```

**Para produção, adicione também:**
```
  - https://seudominio.com
  - https://seudominio.com/login
  - https://seudominio.com/cadastro
  - https://seudominio.com/auth/callback
```

---

### **4. Configurar Templates de Email**

1. Vá para **Email Templates**
2. Personalize os templates (opcional):

#### **4.1. Confirm Signup (Confirmação de Cadastro)**
```html
<h2>Confirme seu email</h2>
<p>Olá!</p>
<p>Clique no link abaixo para confirmar seu cadastro:</p>
<p><a href="{{ .ConfirmationURL }}">Confirmar Email</a></p>
```

#### **4.2. Reset Password (Recuperação de Senha)**
```html
<h2>Recuperação de Senha</h2>
<p>Olá!</p>
<p>Você solicitou a recuperação de senha.</p>
<p>Clique no link abaixo para criar uma nova senha:</p>
<p><a href="{{ .ConfirmationURL }}">Redefinir Senha</a></p>
<p>Se você não solicitou isso, ignore este email.</p>
```

---

### **5. Configurar Políticas de Senha**

1. Em **Settings** → **Password Policy**
2. Configure:

```
Minimum password length: 6
Require uppercase: OFF (opcional)
Require lowercase: OFF (opcional)
Require numbers: OFF (opcional)
Require special characters: OFF (opcional)
```

**Recomendação:** Mantenha simples inicialmente (mínimo 6 caracteres). Aumente a segurança depois.

---

## 🔧 CONFIGURAÇÃO NO CÓDIGO

### **1. Verificar Variáveis de Ambiente**

Arquivo: `.env.local` (na raiz do projeto)

```env
NEXT_PUBLIC_SUPABASE_URL=https://umbjzrlajwzlclyemslv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key_aqui
```

**Como obter as chaves:**
1. No Dashboard do Supabase
2. Vá em **Settings** → **API**
3. Copie:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

### **2. Cliente Supabase já está configurado**

Arquivo: `/lib/supabase.ts` (já existe)

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

✅ **Já está pronto!** Não precisa alterar.

---

## 🔄 SINCRONIZAÇÃO: auth.users → clientes

Quando um cliente se cadastra via Supabase Auth, precisamos criar um registro correspondente na tabela `clientes`.

### **Opção 1: Trigger no Banco (Recomendado)**

Criar trigger que sincroniza automaticamente:

```sql
-- Função para sincronizar auth.users com clientes
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.clientes (
    id,
    nome,
    email,
    telefone,
    ativo,
    email_verificado
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', 'Cliente'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'telefone', ''),
    true,
    NEW.email_confirmed_at IS NOT NULL
  );
  RETURN NEW;
END;
$$;

-- Trigger para executar após signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

### **Opção 2: No Frontend (Alternativa)**

Criar registro manualmente após signup:

```typescript
// Após signup bem-sucedido
const { data: authData, error: authError } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      nome,
      telefone
    }
  }
})

if (authData.user) {
  // Criar registro em clientes
  await supabase.from('clientes').insert({
    id: authData.user.id,
    nome,
    email,
    telefone,
    ativo: true
  })
}
```

---

## 🎯 FLUXOS DE AUTENTICAÇÃO

### **1. Cadastro (Sign Up)**

```typescript
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

if (error) {
  console.error('Erro no cadastro:', error.message)
} else {
  console.log('Cadastro realizado!', data.user)
  // Redirecionar para login ou dashboard
}
```

### **2. Login (Sign In)**

```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'cliente@email.com',
  password: 'senha123'
})

if (error) {
  console.error('Erro no login:', error.message)
} else {
  console.log('Login realizado!', data.user)
  // Redirecionar para checkout ou dashboard
}
```

### **3. Logout (Sign Out)**

```typescript
const { error } = await supabase.auth.signOut()

if (error) {
  console.error('Erro no logout:', error.message)
} else {
  console.log('Logout realizado!')
  // Redirecionar para home
}
```

### **4. Verificar Sessão Atual**

```typescript
const { data: { session } } = await supabase.auth.getSession()

if (session) {
  console.log('Usuário logado:', session.user)
} else {
  console.log('Usuário não logado')
}
```

### **5. Recuperar Senha**

```typescript
const { error } = await supabase.auth.resetPasswordForEmail(
  'cliente@email.com',
  {
    redirectTo: 'http://localhost:3000/recuperar-senha'
  }
)

if (error) {
  console.error('Erro ao enviar email:', error.message)
} else {
  console.log('Email de recuperação enviado!')
}
```

### **6. Atualizar Senha**

```typescript
const { error } = await supabase.auth.updateUser({
  password: 'nova_senha123'
})

if (error) {
  console.error('Erro ao atualizar senha:', error.message)
} else {
  console.log('Senha atualizada!')
}
```

---

## 🔒 PROTEÇÃO DE ROTAS

### **Middleware para Next.js**

Criar: `/middleware.ts`

```typescript
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Rotas protegidas
  const protectedRoutes = ['/checkout', '/meus-pedidos', '/perfil']
  const isProtectedRoute = protectedRoutes.some(route => 
    req.nextUrl.pathname.startsWith(route)
  )

  // Se rota protegida e não logado, redirecionar para login
  if (isProtectedRoute && !session) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set('returnUrl', req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return res
}

export const config = {
  matcher: ['/checkout/:path*', '/meus-pedidos/:path*', '/perfil/:path*']
}
```

---

## 📊 MONITORAMENTO DE USUÁRIOS

### **Ver usuários cadastrados:**

1. Dashboard do Supabase
2. **Authentication** → **Users**
3. Lista de todos os usuários

### **Informações disponíveis:**
- Email
- Data de criação
- Último login
- Email confirmado
- Metadata (nome, telefone, etc.)

---

## 🧪 TESTES

### **1. Testar Cadastro**

```bash
# Via código ou Postman
POST https://umbjzrlajwzlclyemslv.supabase.co/auth/v1/signup
Content-Type: application/json
apikey: sua_anon_key

{
  "email": "teste@email.com",
  "password": "senha123",
  "data": {
    "nome": "Teste",
    "telefone": "12999999999"
  }
}
```

### **2. Testar Login**

```bash
POST https://umbjzrlajwzlclyemslv.supabase.co/auth/v1/token?grant_type=password
Content-Type: application/json
apikey: sua_anon_key

{
  "email": "teste@email.com",
  "password": "senha123"
}
```

---

## ✅ CHECKLIST DE CONFIGURAÇÃO

- [ ] Email provider habilitado
- [ ] URLs de redirecionamento configuradas
- [ ] Templates de email personalizados (opcional)
- [ ] Política de senha configurada
- [ ] Variáveis de ambiente no `.env.local`
- [ ] Trigger de sincronização criado
- [ ] Middleware de proteção de rotas criado
- [ ] Testes de cadastro realizados
- [ ] Testes de login realizados

---

## 🚀 PRÓXIMOS PASSOS

Após configurar o Supabase Auth:

1. **Passo 4:** Criar páginas de cadastro e login
2. **Passo 5:** Modificar checkout para usar autenticação
3. **Passo 6:** Criar páginas de histórico e perfil

---

**Configuração criada em:** 18/10/2025  
**Última atualização:** 18/10/2025
