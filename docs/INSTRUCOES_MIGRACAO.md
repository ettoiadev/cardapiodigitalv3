# Instruções de Migração - Cardápio Digital v3

**Guia Passo a Passo para Migração de Banco de Dados**

---

## 📋 Pré-Requisitos

Antes de iniciar, certifique-se de ter:

- [ ] **Node.js 18+** instalado
- [ ] **PostgreSQL Client (psql)** instalado
- [ ] **Acesso ao banco Supabase** atual (variáveis de ambiente configuradas)
- [ ] **Novo banco de dados** provisionado e acessível
- [ ] **Backup manual** do banco atual (via Supabase Dashboard)
- [ ] **Janela de manutenção** agendada (se produção)
- [ ] **Permissões de superusuário** no banco destino (para criar extensões)

---

## 🚀 Parte 1: Preparação

### 1.1 Instalar Dependências

```bash
cd migration
npm install
```

Isso instalará:
- `@supabase/supabase-js` - Cliente Supabase
- `pg` - Cliente PostgreSQL
- `dotenv` - Gerenciamento de variáveis de ambiente

### 1.2 Verificar Variáveis de Ambiente

Certifique-se de que o arquivo `.env.local` na raiz do projeto contém:

```env
NEXT_PUBLIC_SUPABASE_URL=https://cduyketpnybwwynsjyuq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-aqui
```

### 1.3 Criar Backup Manual (Recomendado)

Acesse o Supabase Dashboard:
1. Vá em **Database** → **Backups**
2. Clique em **Create Backup**
3. Aguarde conclusão
4. Anote o timestamp do backup

---

## 📤 Parte 2: Exportação

### 2.1 Exportar Dados do Supabase

Execute o script de exportação:

```bash
npm run export
```

ou diretamente:

```bash
node export-data.js
```

**O que acontece:**
- ✅ Conecta ao Supabase
- ✅ Exporta 12 tabelas em ordem correta
- ✅ Salva arquivos JSON em `migration/data/`
- ✅ Gera relatório em `migration/data/export-report.json`
- ✅ Gera metadados em `migration/data/metadata.json`

**Saída esperada:**
```
============================================================================
🚀 EXPORTAÇÃO DE DADOS - Cardápio Digital v3
============================================================================
Origem: https://cduyketpnybwwynsjyuq.supabase.co
Destino: C:\...\migration\data
Tabelas a exportar: 12

📊 Exportando: pizzaria_config...
   ✓ 1 registro(s) encontrado(s)
   ✓ Salvo em: ...\pizzaria_config.json

...

✅ Exportação concluída com sucesso!
```

**Verificar:**
```bash
# Listar arquivos exportados
ls migration/data/

# Deve conter:
# - pizzaria_config.json
# - categorias.json
# - produtos.json
# - ... (e outros)
# - export-report.json
# - metadata.json
```

---

## 🗄️ Parte 3: Preparação do Novo Banco

### 3.1 Criar Novo Banco de Dados

**Opção A: PostgreSQL Local**
```bash
createdb cardapio_digital
```

**Opção B: Serviço Cloud (exemplo: Railway)**
1. Acesse o painel do provedor
2. Crie novo banco PostgreSQL
3. Copie a connection string

**Opção C: Supabase (outro projeto)**
1. Crie novo projeto no Supabase
2. Aguarde provisionamento
3. Obtenha connection string em Settings → Database

### 3.2 Testar Conexão

```bash
psql "postgresql://user:password@host:port/database"

# Se conectar com sucesso:
\dt
\q
```

### 3.3 Aplicar Schema

Execute o script SQL de criação de schema:

```bash
psql "postgresql://user:password@host:port/database" -f migration/export-schema.sql
```

**Saída esperada:**
```
CREATE EXTENSION
CREATE EXTENSION
CREATE TABLE
CREATE TABLE
...
CREATE INDEX
CREATE POLICY
...
NOTICE:  ============================================================
NOTICE:  Schema criado com sucesso!
NOTICE:  Total de tabelas: 12
NOTICE:  Total de funções: 3
NOTICE:  Total de triggers: 5
NOTICE:  ============================================================
```

**Verificar schema criado:**
```bash
psql "postgresql://user:password@host:port/database"

\dt public.*
# Deve listar 12 tabelas

\df public.*
# Deve listar 3 funções

\q
```

---

## 📥 Parte 4: Importação de Dados

### 4.1 Teste Dry-Run (Recomendado)

Antes de importar, faça um teste:

```bash
npm run import:dry-run
```

Isso simula a importação sem modificar o banco.

**Saída esperada:**
```
🔍 Modo DRY-RUN: Não conectará ao banco

📥 Importando: pizzaria_config...
   🔍 DRY-RUN: Simularia importação de 1 registro(s)

...

🔍 Modo DRY-RUN concluído - nenhum dado foi importado
```

### 4.2 Importação Real

Execute a importação com a connection string:

```bash
node import-data.js --connection="postgresql://user:password@host:port/database"
```

**⚠️ IMPORTANTE:** Substitua a connection string pela do seu banco!

**Saída esperada:**
```
============================================================================
🚀 IMPORTAÇÃO DE DADOS - Cardápio Digital v3
============================================================================
Origem: C:\...\migration\data
Destino: postgresql://user:****@host:port/database

✓ Conectado ao banco de dados
✓ PostgreSQL: 17.x

📥 Importando: pizzaria_config...
   ✓ Carregado: 1 registro(s)
   ✓ Inseridos: 1

📥 Importando: categorias...
   ✓ Carregado: 5 registro(s)
   ✓ Inseridos: 5

...

🔍 Validando integridade referencial...
   ✓ Produtos sem categoria: OK
   ✓ Itens de pedido sem pedido: OK
   ✓ Itens de pedido sem produto: OK

✅ Importação concluída com sucesso!
```

**Verificar dados importados:**
```sql
psql "postgresql://user:password@host:port/database"

-- Verificar contagens
SELECT 'pizzaria_config' as tabela, COUNT(*) FROM pizzaria_config
UNION ALL
SELECT 'categorias', COUNT(*) FROM categorias
UNION ALL
SELECT 'produtos', COUNT(*) FROM produtos
UNION ALL
SELECT 'bordas_recheadas', COUNT(*) FROM bordas_recheadas
UNION ALL
SELECT 'opcoes_sabores', COUNT(*) FROM opcoes_sabores
UNION ALL
SELECT 'admins', COUNT(*) FROM admins;

-- Resultado esperado:
--      tabela       | count 
-- ------------------+-------
--  pizzaria_config  |     1
--  categorias       |     5
--  produtos         |    61
--  bordas_recheadas |     4
--  opcoes_sabores   |     3
--  admins           |     1
```

---

## ✅ Parte 5: Validação

### 5.1 Executar Script de Validação

```bash
node validate-migration.js --target="postgresql://user:password@host:port/database"
```

**O que é validado:**
- ✅ Estrutura de todas as tabelas
- ✅ Contagem de registros (origem vs destino)
- ✅ Checksum de dados (garantir integridade)
- ✅ Foreign keys configuradas
- ✅ RLS habilitado

**Saída esperada:**
```
============================================================================
🔍 VALIDAÇÃO PÓS-MIGRAÇÃO - Cardápio Digital v3
============================================================================

🔌 Conectando aos bancos de dados...
  ✓ Conectado ao Supabase (origem)
  ✓ Conectado ao banco destino

🏗️  Validando estrutura: pizzaria_config...
  ✓ Tabela existe
  ✓ Primary Key definida
  ✓ RLS habilitado

📊 Validando contagem: pizzaria_config...
  Origem: 1 | Destino: 1 | ✓

🔐 Validando checksum: pizzaria_config...
  Origem: a1b2c3d4e5f6...
  Destino: a1b2c3d4e5f6...
  ✓ Checksums idênticos

...

🔗 Validando foreign keys...
  ✓ 5 foreign keys encontradas
    - produtos.categoria_id → categorias.id
    - pedido_itens.pedido_id → pedidos.id
    - pedido_itens.produto_id → produtos.id

============================================================================
📊 RESUMO DA VALIDAÇÃO
============================================================================
Total de testes: 37
Testes aprovados: 37 ✓
Testes reprovados: 0 ✗
============================================================================
✅ Validação concluída - Migração BEM-SUCEDIDA!
```

### 5.2 Testes Manuais

Execute queries de teste:

```sql
-- 1. Buscar configuração da pizzaria
SELECT nome, taxa_entrega, valor_minimo FROM pizzaria_config;

-- 2. Listar categorias ativas
SELECT nome, ordem FROM categorias WHERE ativo = true ORDER BY ordem;

-- 3. Contar produtos por categoria
SELECT c.nome, COUNT(p.id) as total_produtos
FROM categorias c
LEFT JOIN produtos p ON p.categoria_id = c.id
GROUP BY c.nome
ORDER BY c.nome;

-- 4. Verificar admin cadastrado
SELECT email, ativo FROM admins;

-- 5. Testar função de senha
SELECT verify_admin_password('admin@example.com', 'senha_teste');
```

---

## 🔄 Parte 6: Atualizar Aplicação

### 6.1 Configurar Variáveis de Ambiente

**Se novo banco é PostgreSQL direto (sem Supabase):**

Você precisará adaptar a aplicação para usar `pg` ao invés de `@supabase/supabase-js`.

**Se novo banco é outro projeto Supabase:**

Atualize `.env.local`:

```env
# ANTIGO (comentar)
# NEXT_PUBLIC_SUPABASE_URL=https://cduyketpnybwwynsjyuq.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=antiga-chave

# NOVO
NEXT_PUBLIC_SUPABASE_URL=https://novo-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=nova-chave
```

### 6.2 Testar Localmente

```bash
npm run dev
```

**Verificar:**
- [ ] Página inicial carrega
- [ ] Produtos são listados
- [ ] Categorias aparecem
- [ ] Carrossel de imagens funciona
- [ ] Admin consegue fazer login
- [ ] Admin consegue criar/editar produtos

### 6.3 Deploy em Produção

**Vercel (ou outro provedor):**

1. Atualizar variáveis de ambiente no dashboard
2. Fazer deploy da aplicação
3. Testar em produção

**⚠️ ATENÇÃO:** URLs de imagens ainda apontam para Supabase Storage antigo!

---

## 📦 Parte 7: Migração de Arquivos (Storage)

### 7.1 Identificar Imagens

As imagens estão referenciadas em:
- `pizzaria_config.foto_capa`
- `pizzaria_config.foto_perfil`
- `carousel_images.url`
- URLs em produtos (se houver)

### 7.2 Opções de Migração

**Opção A: Manter no Supabase Storage antigo**
- ✅ Mais simples
- ⚠️ Dependência do projeto antigo

**Opção B: Migrar para novo Supabase Storage**
1. Baixar imagens do bucket antigo
2. Criar bucket no novo projeto
3. Upload das imagens
4. Atualizar URLs no banco

**Opção C: Migrar para S3/Cloudinary/CDN**
1. Escolher provedor (AWS S3, Cloudinary, etc.)
2. Upload das imagens
3. Atualizar URLs no banco

### 7.3 Script de Atualização de URLs (Exemplo)

```sql
-- Atualizar URLs de imagens
-- CUIDADO: Testar antes em staging!

UPDATE pizzaria_config
SET 
  foto_capa = REPLACE(foto_capa, 'cduyketpnybwwynsjyuq', 'novo-projeto'),
  foto_perfil = REPLACE(foto_perfil, 'cduyketpnybwwynsjyuq', 'novo-projeto')
WHERE foto_capa IS NOT NULL OR foto_perfil IS NOT NULL;

UPDATE carousel_images
SET url = REPLACE(url, 'cduyketpnybwwynsjyuq', 'novo-projeto')
WHERE url LIKE '%supabase.co%';
```

---

## 🛡️ Parte 8: Segurança Pós-Migração

### 8.1 Criar Usuário de Aplicação

No banco novo, crie um usuário específico (não use superuser):

```sql
-- Criar usuário
CREATE USER cardapio_app WITH PASSWORD 'senha_forte_aqui';

-- Dar permissões necessárias
GRANT USAGE ON SCHEMA public TO cardapio_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO cardapio_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO cardapio_app;

-- Permissões futuras
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO cardapio_app;
```

Use este usuário na connection string da aplicação.

### 8.2 Configurar RLS Policies

Verifique se as policies RLS estão ativas:

```sql
-- Verificar policies
SELECT tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename;
```

Se migrou para PostgreSQL sem Supabase Auth, adapte as policies conforme seu sistema de autenticação.

### 8.3 Revisar Advisories

Execute no banco novo:

```sql
-- Verificar funções sem search_path seguro
SELECT proname, prosrc 
FROM pg_proc 
WHERE pronamespace = 'public'::regnamespace
AND prosecdef = true;
```

Adicione `SET search_path TO 'public'` nas funções conforme já feito no `export-schema.sql`.

---

## 📊 Parte 9: Monitoramento

### 9.1 Primeiras 24 Horas

- [ ] Monitorar logs de erro da aplicação
- [ ] Verificar performance de queries
- [ ] Acompanhar uso de CPU/RAM do banco
- [ ] Testar todos os fluxos críticos

### 9.2 Queries Úteis de Monitoramento

```sql
-- Queries mais lentas
SELECT 
  query,
  mean_exec_time,
  calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Tamanho das tabelas
SELECT
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Conexões ativas
SELECT count(*) FROM pg_stat_activity;
```

---

## 🔙 Parte 10: Rollback (Se Necessário)

### 10.1 Reverter Aplicação

Se detectar problemas críticos:

```bash
# Reverter variáveis de ambiente para banco antigo
# No Vercel: Settings → Environment Variables

# Ou localmente:
# Restaurar .env.local com valores antigos
```

### 10.2 Restaurar Backup

Se dados foram corrompidos no banco antigo:

1. Supabase Dashboard → Database → Backups
2. Selecionar backup pré-migração
3. Clicar em "Restore"

---

## ✅ Checklist Final

### Pré-Migração
- [ ] Backup completo criado
- [ ] Scripts testados em ambiente local
- [ ] Novo banco provisionado
- [ ] Equipe notificada
- [ ] Janela de manutenção agendada

### Durante Migração
- [ ] Dados exportados com sucesso
- [ ] Schema criado no novo banco
- [ ] Dados importados com sucesso
- [ ] Validação passou sem erros
- [ ] Testes manuais executados

### Pós-Migração
- [ ] Aplicação atualizada e funcionando
- [ ] Arquivos/imagens migrados (se aplicável)
- [ ] RLS e permissões configuradas
- [ ] Monitoramento ativo
- [ ] Backup do novo banco criado
- [ ] Banco antigo em standby por 30 dias

### Após 30 Dias
- [ ] Nenhum incidente reportado
- [ ] Performance estável
- [ ] Desativar banco antigo
- [ ] Celebrar migração bem-sucedida! 🎉

---

## 📞 Suporte

### Problemas Comuns

**1. Erro ao conectar no banco destino**
```
Error: Connection refused
```
- Verificar se banco está ligado
- Verificar firewall/security groups
- Testar com `psql` antes dos scripts

**2. Erro de permissão ao criar extensões**
```
ERROR: permission denied to create extension
```
- Usuário precisa ser superuser ou ter permissão CREATE
- Executar como superuser ou pedir ao DBA

**3. Checksums diferentes após importação**
```
✗ Checksums diferentes
```
- Pode ser ordem diferente de linhas
- Se contagens batem, dados estão OK
- Investigar apenas se contagens diferentes

**4. Foreign key violations**
```
ERROR: insert or update on table violates foreign key constraint
```
- Ordem de importação incorreta
- Verificar se tabelas pai foram importadas primeiro
- Revisar `IMPORT_ORDER` no script

---

## 📚 Arquivos de Referência

- `docs/RECONHECIMENTO_APLICACAO.md` - Documentação completa do sistema
- `docs/PLANO_MIGRACAO_BANCO.md` - Plano estratégico de migração
- `migration/export-schema.sql` - Script SQL de criação de schema
- `migration/export-data.js` - Script de exportação de dados
- `migration/import-data.js` - Script de importação de dados
- `migration/validate-migration.js` - Script de validação
- `migration/data/export-report.json` - Relatório de exportação
- `migration/data/import-report.json` - Relatório de importação
- `migration/data/validation-report.json` - Relatório de validação

---

**Boa sorte com a migração! 🚀**
