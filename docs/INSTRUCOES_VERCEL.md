# 🚀 Configuração do Vercel - Guia Prático

## 🎯 Objetivo

Configurar as variáveis de ambiente do Supabase no Vercel para resolver os erros de conexão no painel administrativo.

---

## 📋 Passo a Passo

### 1. **Acessar o Painel do Vercel**

1. Vá para: https://vercel.com/dashboard
2. Encontre o projeto: `cardapiodigital-mu`
3. Clique no projeto para acessar

### 2. **Configurar Variáveis de Ambiente**

1. Clique em **Settings** no menu superior
2. No menu lateral, clique em **Environment Variables**
3. Adicione as seguintes variáveis:

#### Variável 1: URL do Supabase
```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://seu-projeto-id.supabase.co
Environment: ✅ Production ✅ Preview ✅ Development
```

#### Variável 2: Chave Pública do Supabase
```
Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: sua-chave-publica-longa-aqui
Environment: ✅ Production ✅ Preview ✅ Development
```

### 3. **Encontrar as Credenciais do Supabase**

1. Acesse: https://app.supabase.com/projects
2. Selecione seu projeto da William Disk Pizza
3. Vá em: **Settings** > **API**
4. Copie:
   - **Project URL** → usar em `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → usar em `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 4. **Aplicar as Configurações**

1. Após adicionar as variáveis, clique **Save** em cada uma
2. Vá para a aba **Deployments**
3. No deployment mais recente, clique nos 3 pontos **⋯**
4. Selecione **Redeploy**
5. Aguarde o deploy finalizar (2-3 minutos)

---

## ✅ Verificação

### Teste Imediato:
1. Acesse: https://cardapiodigital-mu.vercel.app/admin/login
2. Clique em **"Testar Conexão"**
3. Deve mostrar: `✅ Conexão com Supabase funcionando`

### Console do Browser (F12):
```javascript
// Deve mostrar suas URLs reais
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)
// Resultado esperado: "https://seu-projeto.supabase.co"

console.log(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length)
// Resultado esperado: número > 100 (chave longa)
```

### Logs da Aplicação:
- ✅ `"✅ Conexão com Supabase verificada"`
- ✅ `"✅ Login realizado com sucesso"`
- ❌ `"⚠️ Supabase environment variables not found"` (problema)

---

## 🔧 Exemplo Prático

### URLs de Exemplo (substitua pelos seus valores):
```bash
# Exemplo de URL válida:
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co

# Exemplo de chave válida (truncada):
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...muito-longa
```

### Como Verificar se Está Correto:
- A URL termina com `.supabase.co`
- A chave começa com `eyJhbGciOiJIUzI1NiI`
- A chave tem mais de 100 caracteres

---

## 🚨 Troubleshooting

### Problema: "Variáveis não aparecem"
**Solução**: Aguarde 2-3 minutos após salvar, então faça redeploy

### Problema: "Ainda mostra placeholder"
**Solução**: 
1. Verifique se marcou **Production** na variável
2. Faça redeploy forçado
3. Limpe cache do browser (Ctrl+F5)

### Problema: "Erro de CORS"
**Solução**: No Supabase:
1. Settings > API > Configuration
2. Site URL: adicione `https://cardapiodigital-mu.vercel.app`

### Problema: "Tabelas não encontradas"
**Solução**: Execute os scripts SQL no Supabase:
```sql
-- Execute no SQL Editor do Supabase
-- Use os scripts da pasta /scripts/ em ordem
```

---

## 📱 Contato para Suporte

Se os problemas persistirem:

1. **Screenshots**: Capture a tela das Environment Variables no Vercel
2. **Console logs**: F12 > Console, copie os erros
3. **Supabase logs**: No painel do Supabase > Logs
4. **Network tab**: Verifique se as requisições estão sendo feitas para a URL correta

---

## ✅ Checklist Final

- [ ] ✅ Variáveis adicionadas no Vercel
- [ ] ✅ Ambiente Production marcado
- [ ] ✅ Redeploy realizado
- [ ] ✅ Teste de conexão passa
- [ ] ✅ Login admin funciona
- [ ] ✅ Cardápio carrega produtos reais

**🎯 Status**: Aguardando configuração das variáveis de ambiente no Vercel 