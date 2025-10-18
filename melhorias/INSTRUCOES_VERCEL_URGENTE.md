# 🚨 AÇÃO URGENTE: Atualizar Vercel

## ⚠️ O Vercel ainda está usando o BANCO ANTIGO!

Para o login funcionar em produção, você **DEVE** atualizar as variáveis de ambiente no Vercel **AGORA**.

---

## 📝 Passo a Passo

### 1. Acessar Configurações do Vercel

Acesse: https://vercel.com/ettoiadev/cardapiodigitalv3/settings/environment-variables

(Ou vá em: Dashboard → Seu Projeto → Settings → Environment Variables)

---

### 2. Atualizar Variáveis

**Encontre e EDITE estas 2 variáveis:**

#### `NEXT_PUBLIC_SUPABASE_URL`
**Valor ANTIGO (remover):**
```
https://cduyketpnybwwynsjyuq.supabase.co
```

**Valor NOVO (usar):**
```
https://umbjzrlajwzlclyemslv.supabase.co
```

---

#### `NEXT_PUBLIC_SUPABASE_ANON_KEY`
**Valor ANTIGO (remover):**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkdXlrZXRwbnlid3d5bnNqeXVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMTg0NjgsImV4cCI6MjA2NjY5NDQ2OH0.4LfqohIGuit8w1lWK3DFRREoeSTITnhtNWzSvek2Puc
```

**Valor NOVO (usar):**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtYmp6cmxhand6bGNseWVtc2x2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3NTM2OTAsImV4cCI6MjA3NjMyOTY5MH0.-7ydsHkpdmUDFOULPQYumdjluig-wwmwXJtrMSUy8WM
```

---

### 3. Aplicar em Todos os Ambientes

Certifique-se de atualizar em:
- ✅ **Production**
- ✅ **Preview** (se tiver)
- ✅ **Development** (se tiver)

---

### 4. Fazer Redeploy

Após atualizar as variáveis:

**Opção A - Automático:**
O Vercel pode fazer redeploy automaticamente

**Opção B - Manual:**
1. Vá em: Deployments
2. Clique nos 3 pontinhos do último deploy
3. Clique em **"Redeploy"**

---

### 5. Aguardar Deploy (2-3 minutos)

Aguarde o deploy finalizar e o status ficar **"Ready"**.

---

### 6. Testar Login

Acesse: https://cardapiodigitalv3.vercel.app/admin/login

**Credenciais:**
- **Email:** `admin@pizzaria.com`
- **Senha:** `admin123`

---

## ✅ Checklist

- [ ] Acessei as configurações do Vercel
- [ ] Atualizei `NEXT_PUBLIC_SUPABASE_URL`
- [ ] Atualizei `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Apliquei em Production
- [ ] Fiz redeploy
- [ ] Aguardei deploy finalizar
- [ ] Testei login em produção
- [ ] Login funcionou! 🎉

---

## 🔍 Se Ainda Não Funcionar

1. **Limpar cache do navegador** (Ctrl + Shift + Delete)
2. **Abrir em aba anônima** para testar
3. **Verificar console do navegador** (F12) para erros
4. **Verificar logs do Vercel** em: Deployments → Ver logs

---

## 📊 Resumo das Mudanças

| Item | Antes | Depois |
|------|-------|--------|
| **Banco** | cduyketpnybwwynsjyuq | umbjzrlajwzlclyemslv |
| **Região** | ? | US East (Ohio) |
| **Autenticação** | Senha texto plano | Senha bcrypt (segura) |
| **Dados** | 81 registros | 81 registros (migrados) |

---

## 🎯 Por Que Não Funciona Agora?

O Vercel está usando as **variáveis antigas** que apontam para o **banco antigo** (`cduyketpnybwwynsjyuq`).

Mesmo com o código atualizado no GitHub, o Vercel só vai usar o **novo banco** depois que você atualizar as variáveis de ambiente.

---

**⏰ Tempo estimado:** 5 minutos

**🚀 Faça isso AGORA para o login funcionar!**
