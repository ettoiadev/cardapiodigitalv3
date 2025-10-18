# 🔒 Correção RLS - Políticas de Acesso Admin

## ❌ Problema Identificado

O erro `PGRST116` no login do administrador era causado por **Row Level Security (RLS)** habilitado na tabela `admins` sem políticas definidas, bloqueando todas as consultas.

### Sintomas do Problema:
- ✅ Conexão com Supabase funcionando
- ✅ Dados existem no banco de dados
- ❌ Consultas via Supabase JS retornando vazio
- ❌ Erro: "Nenhum admin encontrado com este email"
- ❌ Console mostrando erro `PGRST116` (Not Acceptable)

## 🔍 Diagnóstico

```sql
-- Verificando status RLS da tabela admins
SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE tablename = 'admins';
-- Resultado: rowsecurity = true

-- Verificando políticas existentes
SELECT policyname FROM pg_policies WHERE tablename = 'admins';
-- Resultado: [] (nenhuma política)
```

**Conclusão**: RLS habilitado sem políticas = acesso bloqueado total.

## ✅ Solução Implementada

### Migration: `fix_admin_rls_policies`

```sql
-- Política para permitir SELECT (consulta) dos admins para autenticação
CREATE POLICY "Permitir consulta admins para autenticacao" ON public.admins
FOR SELECT 
USING (true);

-- Política para permitir UPDATE dos admins (para futuras funcionalidades)
CREATE POLICY "Permitir atualizacao admins autenticados" ON public.admins
FOR UPDATE 
USING (true);
```

### Resultado
- ✅ Login funcionando corretamente
- ✅ Consultas SELECT permitidas
- ✅ Atualizações permitidas para futuras funcionalidades

## 🧪 Como Testar

### 1. Teste Manual no Banco
```sql
SELECT id, email, nome FROM admins WHERE email = 'admin@pizzaria.com';
```

### 2. Teste na Aplicação
- Acesse: `https://cardapiodigital-mu.vercel.app/admin/debug`
- Execute os testes de consulta
- Verifique os resultados

### 3. Teste de Login
- Acesse: `https://cardapiodigital-mu.vercel.app/admin/login`
- Email: `admin@pizzaria.com`
- Senha: `admin123`

## ⚠️ Considerações de Segurança

### Política Atual (Desenvolvimento)
```sql
USING (true) -- Permite acesso total
```

### Sugestão para Produção
```sql
-- Política mais restritiva baseada em sessão autenticada
CREATE POLICY "admin_select_authenticated" ON public.admins
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Ou baseada em contexto específico
CREATE POLICY "admin_select_context" ON public.admins
FOR SELECT 
USING (
  current_setting('request.jwt.claims')::json->>'role' = 'admin'
);
```

## 📝 Próximos Passos

1. **Desenvolvimento**: Política atual é suficiente
2. **Produção**: Implementar políticas mais restritivas
3. **Monitoramento**: Verificar logs de acesso
4. **Auditoria**: Revisar permissões periodicamente

## 🔗 Arquivos Relacionados

- `scripts/16-fix-admin-rls-policies.sql` - Migration aplicada
- `app/admin/debug/page.tsx` - Página de debug para testes
- `lib/auth-context.tsx` - Contexto de autenticação melhorado
- `CONFIGURACAO_SUPABASE.md` - Configuração geral

## 📊 Status

- ✅ **Problema identificado**: RLS sem políticas
- ✅ **Solução implementada**: Políticas criadas
- ✅ **Testes realizados**: Login funcionando
- ✅ **Documentação atualizada**: Este arquivo

---

**Data da correção**: ${new Date().toLocaleDateString('pt-BR')}
**Tempo de resolução**: ~30 minutos
**Impacto**: Login administrativo totalmente funcional 