# ✅ Credenciais do Novo Banco - Após Migração

## 🎯 Banco de Dados Migrado

A migração foi **concluída com sucesso**! Todos os dados foram transferidos do banco antigo para o novo.

---

## 🔑 Novas Credenciais

**Banco Novo (PRODUÇÃO):**

```
NEXT_PUBLIC_SUPABASE_URL=https://umbjzrlajwzlclyemslv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtYmp6cmxhand6bGNseWVtc2x2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3NTM2OTAsImV4cCI6MjA3NjMyOTY5MH0.-7ydsHkpdmUDFOULPQYumdjluig-wwmwXJtrMSUy8WM
```

---

## 📝 AÇÕES NECESSÁRIAS

### 1. Atualizar `.env.local` (LOCAL)

Edite manualmente o arquivo `.env.local` na raiz do projeto:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://umbjzrlajwzlclyemslv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtYmp6cmxhand6bGNseWVtc2x2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3NTM2OTAsImV4cCI6MjA3NjMyOTY5MH0.-7ydsHkpdmUDFOULPQYumdjluig-wwmwXJtrMSUy8WM
```

### 2. Atualizar Vercel/Deploy (PRODUÇÃO)

Se a aplicação está deployada:

**Vercel:**
1. Acesse: https://vercel.com/seu-usuario/seu-projeto/settings/environment-variables
2. Atualize as variáveis:
   - `NEXT_PUBLIC_SUPABASE_URL` → `https://umbjzrlajwzlclyemslv.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
3. Faça um novo deploy

**Netlify:**
1. Site settings → Environment variables
2. Atualizar variáveis
3. Trigger deploy

### 3. Testar Localmente

```bash
npm run dev
```

Verificar:
- ✅ Página inicial carrega
- ✅ Produtos aparecem
- ✅ Categorias funcionam
- ✅ Admin consegue fazer login
- ✅ Carrossel exibe imagens

---

## 📊 Dados Migrados (Validados)

| Item | Valor |
|------|-------|
| **Nome da Pizzaria** | William Disk Pizza |
| **Total de Produtos** | 63 |
| **Categorias** | 5 |
| **Bordas Recheadas** | 4 |
| **Opções de Sabores** | 3 |
| **Imagens Carrossel** | 3 |
| **Administradores** | 1 |
| **Taxa de Entrega** | R$ 10,00 |
| **Valor Mínimo** | R$ 20,00 |
| **WhatsApp** | (12) 99636-7326 |

---

## 🗄️ Informações do Banco

**Projeto:** cardapiodigitalv3  
**ID:** umbjzrlajwzlclyemslv  
**Região:** us-east-1  
**PostgreSQL:** 17.6.1.021  
**Status:** ACTIVE_HEALTHY

**Dashboard:** https://supabase.com/dashboard/project/umbjzrlajwzlclyemslv

---

## 🔐 Banco Antigo (MANTER POR 30 DIAS)

**⚠️ NÃO DELETAR ainda o banco antigo:**

```
URL: https://cduyketpnybwwynsjyuq.supabase.co
ID: cduyketpnybwwynsjyuq
```

**Razão:** Manter como backup de segurança por 30 dias após migração.

**Data da migração:** 18 de outubro de 2025  
**Pode deletar após:** 18 de novembro de 2025

---

## ✅ Checklist Pós-Migração

- [x] Schema criado (12 tabelas)
- [x] Dados migrados (81 registros)
- [x] Funções criadas (3)
- [x] Triggers configurados (5)
- [x] RLS habilitado (12 tabelas)
- [x] Validação de dados (OK)
- [ ] `.env.local` atualizado localmente
- [ ] Aplicação testada localmente
- [ ] Variáveis atualizadas no Vercel
- [ ] Deploy em produção
- [ ] Testes em produção
- [ ] Monitoramento ativo (24-72h)
- [ ] Backup do novo banco criado
- [ ] Deletar banco antigo (após 30 dias)

---

## 🚨 IMPORTANTE: Políticas de Segurança

**⚠️ As policies de INSERT foram liberadas temporariamente para a migração.**

**Após validar que tudo funciona**, considere ajustar as policies para produção:

```sql
-- Exemplo: Restringir INSERT apenas para usuários autenticados
DROP POLICY IF EXISTS "Permitir inserção para migração" ON public.pizzaria_config;
CREATE POLICY "Apenas admins podem modificar config"
    ON public.pizzaria_config FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');
```

---

## 📞 Suporte

Se encontrar problemas:

1. Verificar logs do Supabase
2. Revisar `migration/data/validation-report.json`
3. Consultar `docs/INSTRUCOES_MIGRACAO.md`
4. Rollback: Reverter para banco antigo se necessário

---

**✅ Migração concluída com sucesso!** 🎉
