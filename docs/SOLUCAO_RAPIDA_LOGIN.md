# 🚀 SOLUÇÃO RÁPIDA - Login Admin

## 📋 Problema Atual
- ✅ Supabase conectado
- ❌ **Usuário admin não existe no banco**
- ❌ Login falha com "Nenhum admin encontrado"

---

## ⚡ Solução em 3 Passos

### 🔹 PASSO 1: Acessar Supabase
1. Vá para: **https://app.supabase.com**
2. Clique no seu projeto (William Disk Pizza)
3. No menu lateral, clique em **"SQL Editor"**

### 🔹 PASSO 2: Executar Script
Cole este código no SQL Editor e clique **"RUN"**:

```sql
-- Criar usuário admin para login
DELETE FROM admins WHERE email = 'admin@pizzaria.com';

INSERT INTO admins (email, senha, nome, ativo) 
VALUES (
  'admin@pizzaria.com',
  'admin123',
  'Administrador William Disk Pizza',
  true
);

-- Verificar se funcionou
SELECT email, nome, ativo FROM admins;
```

### 🔹 PASSO 3: Testar Login
1. Vá para: **https://cardapiodigital-mu.vercel.app/admin/login**
2. Digite:
   - **Email**: `admin@pizzaria.com`
   - **Senha**: `admin123`
3. Clique **"Entrar"**

---

## ✅ Resultado Esperado

Após executar o script:
- ✅ Usuário criado no banco
- ✅ Login funciona
- ✅ Redirecionamento para painel admin

---

## 🚨 Se Ainda Não Funcionar

### Verificação Rápida:
1. **No Supabase**: Table Editor > admins
   - Deve ter 1 linha com `admin@pizzaria.com`
2. **Na página de login**: Clique "Testar Conexão"
   - Deve mostrar: ✅ "Conexão com Supabase funcionando"

### Console Debug (F12):
```javascript
// Verificar se admin existe
supabase.from('admins').select('*').eq('email', 'admin@pizzaria.com').then(console.log)
```

---

## 📞 Suporte

Se o problema persistir:
1. **Screenshot** da execução do SQL
2. **Screenshot** do erro de login  
3. **Console logs** (F12 > Console)

**Status**: 🔧 Aguardando execução do script SQL 