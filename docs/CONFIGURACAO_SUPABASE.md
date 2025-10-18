# 🔧 Configuração do Supabase - Guia Completo

## 🚨 Problema Identificado

O painel administrativo estava apresentando erro porque:
1. ✅ **RESOLVIDO**: Variáveis de ambiente configuradas no Vercel
2. ❌ **PENDENTE**: Usuário administrador não existe no banco de dados

### Sintomas do Problema:
- ✅ Conexão com Supabase funcionando
- ❌ "Nenhum admin encontrado com este email"
- ❌ Login admin ainda não funciona

---

## ⚡ Solução URGENTE - Criar Usuário Admin

### 1. **Executar Script SQL no Supabase**

1. Acesse: https://app.supabase.com
2. Selecione seu projeto da William Disk Pizza
3. Vá em: **SQL Editor**
4. Cole e execute o script abaixo:

```sql
-- Script para corrigir o login do administrador
-- Email: admin@pizzaria.com | Senha: admin123

-- Criar tabela se não existir
CREATE TABLE IF NOT EXISTS admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  senha VARCHAR(255) NOT NULL,
  nome VARCHAR(255) NOT NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Remover usuário existente (se houver)
DELETE FROM admins WHERE email = 'admin@pizzaria.com';

-- Inserir admin com credenciais corretas
INSERT INTO admins (email, senha, nome, ativo) 
VALUES (
  'admin@pizzaria.com',
  'admin123',
  'Administrador William Disk Pizza',
  true
);

-- Verificar se foi criado
SELECT email, nome, ativo FROM admins WHERE email = 'admin@pizzaria.com';
```

### 2. **Credenciais de Acesso**

Após executar o script, use estas credenciais:

```
Email: admin@pizzaria.com
Senha: admin123
```

### 3. **Teste Imediato**

1. Vá para: https://cardapiodigital-mu.vercel.app/admin/login
2. Clique em **"Testar Conexão"** → Deve mostrar ✅
3. Digite as credenciais acima
4. Clique **"Entrar"** → Deve redirecionar para `/admin`

---

## 🔍 Verificação da Configuração

### No Console do Browser (F12):
```javascript
// Deve mostrar suas URLs reais, não placeholder
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
```

### Logs Esperados:
- ✅ `"✅ Conexão com Supabase verificada"`
- ✅ `"✅ Login realizado com sucesso"`
- ❌ `"❌ Nenhum admin encontrado com este email"` (problema resolvido)

---

## 🗄️ Estrutura do Banco de Dados

Certifique-se que seu Supabase possui estas tabelas:

### Tabelas Obrigatórias:
- ✅ `pizzaria_config` - Configurações da pizzaria
- ✅ `admins` - Usuários administradores (**CORRIGIDO**)
- ✅ `produtos` - Cardápio de produtos
- ✅ `categorias` - Categorias dos produtos
- ✅ `opcoes_sabores` - Opções de sabores (1, 2, 3 sabores)

### Scripts SQL Disponíveis:
```bash
scripts/
├── 01-create-tables.sql        # Criar tabelas principais
├── 02-admin-setup.sql          # Configurar usuário admin (versão antiga)
├── 15-fix-admin-login.sql      # ✅ NOVO: Corrigir login admin
├── 03-cardapio-management.sql  # Estrutura do cardápio
├── 04-populate-sabores.sql     # Opções de sabores
└── ... (outros scripts)
```

---

## 👤 Configuração do Admin ✅ ATUALIZADO

### ✅ USAR ESTE SCRIPT (Atualizado):

```sql
-- Execute no SQL Editor do Supabase
DELETE FROM admins WHERE email = 'admin@pizzaria.com';

INSERT INTO admins (email, senha, nome, ativo) 
VALUES (
  'admin@pizzaria.com',
  'admin123',  -- Senha correta para o sistema atual
  'Administrador William Disk Pizza',
  true
);
```

### ❌ NÃO USAR (Script antigo com hash):
```sql
-- ❌ Este script estava causando o problema
INSERT INTO admins (email, senha, nome) 
VALUES ('admin@pizzaria.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrador')
```

---

## 🧪 Teste da Configuração

### 1. **Teste de Conexão** ✅
```javascript
// Cole no console do browser (F12)
fetch(process.env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/')
  .then(r => r.ok ? console.log('✅ Supabase OK') : console.log('❌ Erro'))
  .catch(e => console.log('❌ Falha:', e))
```

### 2. **Teste de Login Admin** ⏳
1. Vá para: `https://cardapiodigital-mu.vercel.app/admin/login`
2. Use: `admin@pizzaria.com` / `admin123`
3. Deve redirecionar para `/admin` sem erros

### 3. **Teste do Cardápio** ✅
1. Acesse a página inicial
2. Deve carregar produtos reais do banco
3. Console deve mostrar: `"✅ X produtos carregados"`

---

## 🔧 Desenvolvimento Local

### Arquivo `.env.local`:
```bash
# Crie o arquivo .env.local na raiz do projeto
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-publica-aqui
```

### Comandos para Desenvolvimento:
```bash
# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev

# Build para produção
npm run build
```

---

## 🚀 Deploy em Produção

### Checklist Pré-Deploy:
- [x] ✅ Variáveis configuradas no Vercel
- [ ] ⏳ Usuário admin criado no banco
- [ ] ⏳ Teste de login funcionando
- [x] ✅ Build sem erros: `npm run build`

### Configuração do Vercel:
1. **Environment Variables** → ✅ Configuradas
2. **Deploy Settings** → Auto-deploy habilitado
3. **Build Command** → `npm run build`
4. **Output Directory** → `.next`

---

## ❗ Segurança e Boas Práticas

### ⚠️ Importante:
- **Senhas**: ⚠️ Sistema atual usa texto simples - implementar hash em produção
- **Keys**: As chaves do Supabase são públicas, mas não as exponha desnecessariamente
- **RLS**: Configure Row Level Security no Supabase
- **CORS**: Configure domínios permitidos no Supabase

### 🔒 Para Produção (Futuro):
1. **Hash de senhas** com bcrypt ou similar
2. **Backup regular** do banco de dados
3. **Monitoramento** de logs e erros
4. **SSL/HTTPS** sempre habilitado

---

## 📞 Suporte

### Se os problemas persistirem:

1. **Verifique se o script SQL foi executado**: 
   - Vá em Supabase > Table Editor > admins
   - Deve haver 1 linha com email `admin@pizzaria.com`

2. **Console logs**: F12 > Console, verifique se há erros
3. **Network tab**: Verifique se as requisições estão OK
4. **Teste de conexão**: Use o botão na página de login

### Logs Úteis para Debug:
```javascript
// Verificar se admin existe
supabase.from('admins').select('*').eq('email', 'admin@pizzaria.com').then(console.log)

// Verificar configuração
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
```

---

## ✅ Status da Correção ATUALIZADO

- [x] ✅ **Diagnóstico**: Problema identificado (usuário admin ausente)
- [x] ✅ **Melhorias**: Tratamento de erro aprimorado
- [x] ✅ **Variáveis**: Configuradas no Vercel
- [x] ✅ **Script SQL**: Criado para corrigir login
- [ ] ⏳ **Execução**: Aguardando execução do script no Supabase
- [ ] ⏳ **Teste**: Validação do login em produção

**🎯 Próximo passo:** Execute o script SQL no Supabase e teste o login admin. 