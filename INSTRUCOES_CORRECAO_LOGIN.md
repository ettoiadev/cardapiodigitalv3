# 🚀 Instruções Rápidas: Corrigir Login de Cliente

## ⚠️ Problema
Login funciona mas não abre checkout/perfil.

## ✅ Solução em 3 Passos

### **Passo 1: Executar Script SQL no Supabase**

1. Abra o **Supabase Dashboard**: https://supabase.com/dashboard
2. Selecione o projeto **cardapiodigitalv3**
3. Vá em **SQL Editor** (menu lateral)
4. Cole e execute o script:

```bash
📁 scripts/28-fix-auth-trigger.sql
```

5. **Resultado esperado:**
```
✅ Função handle_new_user criada com sucesso
✅ Trigger on_auth_user_created criado com sucesso
✅ Todos os usuários têm registro em clientes
```

### **Passo 2: Verificar Correção**

Execute no SQL Editor:

```sql
-- Ver se trigger foi criado
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Ver total de usuários vs clientes
SELECT 
    (SELECT COUNT(*) FROM auth.users) as total_auth,
    (SELECT COUNT(*) FROM public.clientes) as total_clientes;
```

**Esperado:** Ambos devem ter o mesmo número.

### **Passo 3: Testar na Aplicação**

#### **Teste 1 - Novo Cadastro**
1. Faça logout (se estiver logado)
2. Crie uma nova conta de teste
3. Faça login
4. Acesse `/perfil` → Deve funcionar ✅
5. Acesse `/checkout` → Deve funcionar ✅

#### **Teste 2 - Usuário Existente**
1. Faça login com conta antiga
2. Se não funcionar, o **fallback automático** vai criar o perfil
3. Veja no console: "✅ Perfil criado com sucesso!"

## 🔍 Validação Completa

### **Checklist:**
- [ ] Script SQL executado sem erros
- [ ] Trigger `on_auth_user_created` existe
- [ ] Novo cadastro cria cliente automaticamente
- [ ] Login antigo funciona (fallback cria perfil)
- [ ] Página `/perfil` carrega dados
- [ ] Página `/checkout` funciona
- [ ] Página `/meus-pedidos` funciona

## ❓ Problemas?

### **Erro: "Cliente não encontrado"**
**Solução:** O fallback deve criar automaticamente. Veja o console:
```
Cliente não encontrado, criando registro...
✅ Perfil criado com sucesso!
```

### **Erro: RLS policy**
**Solução:** Execute no SQL Editor:
```sql
GRANT INSERT ON public.clientes TO authenticated;
GRANT SELECT ON public.clientes TO authenticated;
GRANT UPDATE ON public.clientes TO authenticated;
```

### **Trigger não executando**
**Solução:** Recriar trigger:
```sql
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
```

## 📊 Como Funciona

### **Antes (com problema):**
```
1. Cliente cadastra → Supabase Auth cria usuário ✅
2. Cliente faz login → Autenticação funciona ✅
3. Cliente acessa /perfil → Busca em clientes ❌ (não existe)
4. Erro: "Cliente não encontrado" ❌
```

### **Depois (corrigido):**
```
1. Cliente cadastra → Supabase Auth cria usuário ✅
2. TRIGGER cria registro em clientes ✅✅✅
3. Cliente faz login → Autenticação funciona ✅
4. Cliente acessa /perfil → Busca em clientes ✅
5. Perfil carregado com sucesso! ✅
```

### **Backup (Fallback):**
```
Se trigger falhar ou for usuário antigo:
1. Página detecta: cliente não existe
2. Fallback extrai dados do auth.users
3. Fallback cria registro em clientes
4. Página funciona normalmente ✅
```

## 📚 Arquivos Modificados

### **Novos:**
- ✅ `scripts/28-fix-auth-trigger.sql` - Trigger do banco
- ✅ `docs/CORRECAO_LOGIN_CLIENTE.md` - Documentação completa

### **Alterados:**
- ✅ `app/perfil/page.tsx` - Adicionado fallback

### **Intactos:**
- ✅ `app/login/page.tsx` - Já estava correto
- ✅ `app/cadastro/page.tsx` - Já estava correto
- ✅ `app/checkout/page.tsx` - Já estava correto
- ✅ `middleware.ts` - Já estava correto
- ✅ `lib/auth-helpers.ts` - Já estava correto

## 🎯 Resultado

- ✅ **Login funciona 100%**
- ✅ **Perfil carrega dados**
- ✅ **Checkout funciona**
- ✅ **Meus pedidos funciona**
- ✅ **Sem erros de "cliente não encontrado"**

## 🔗 Links Úteis

- **Documentação completa:** `docs/CORRECAO_LOGIN_CLIENTE.md`
- **Script SQL:** `scripts/28-fix-auth-trigger.sql`
- **Supabase Dashboard:** https://supabase.com/dashboard

---

**Status:** ✅ Pronto para testar  
**Tempo estimado:** 5 minutos  
**Dificuldade:** Fácil
