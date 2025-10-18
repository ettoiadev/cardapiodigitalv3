# Scripts de Migração - Cardápio Digital v3

Este diretório contém todos os scripts necessários para migrar o banco de dados do Supabase atual para outro provedor.

## 📁 Estrutura de Arquivos

```
migration/
├── README.md                    # Este arquivo
├── package.json                 # Dependências Node.js
├── export-schema.sql           # Script SQL de criação de schema
├── export-data.js              # Script de exportação de dados
├── import-data.js              # Script de importação de dados
├── validate-migration.js       # Script de validação
└── data/                       # Diretório de dados exportados (gerado)
    ├── pizzaria_config.json
    ├── categorias.json
    ├── produtos.json
    ├── ... (outros JSONs)
    ├── export-report.json
    ├── import-report.json
    ├── validation-report.json
    └── metadata.json
```

## 🚀 Início Rápido

### 1. Instalar Dependências

```bash
npm install
```

### 2. Exportar Dados do Supabase

```bash
npm run export
```

Gera arquivos JSON em `data/` com todos os dados do banco atual.

### 3. Criar Schema no Novo Banco

```bash
psql "postgresql://user:pass@host:port/db" -f export-schema.sql
```

### 4. Importar Dados

**Teste primeiro (dry-run):**
```bash
npm run import:dry-run
```

**Importação real:**
```bash
node import-data.js --connection="postgresql://user:pass@host:port/db"
```

### 5. Validar Migração

```bash
node validate-migration.js --target="postgresql://user:pass@host:port/db"
```

## 📜 Scripts Disponíveis

### `npm run export`
Exporta todos os dados do Supabase para arquivos JSON.

**Requer:**
- Arquivo `.env.local` configurado na raiz do projeto
- Variáveis `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Saída:**
- `data/*.json` - Arquivos JSON com dados de cada tabela
- `data/export-report.json` - Relatório de exportação
- `data/metadata.json` - Metadados da exportação

### `npm run import`
Importa dados para o novo banco.

**Uso:**
```bash
node import-data.js --connection="postgresql://user:pass@host:port/db"
```

**Opções:**
- `--connection=<string>` - Connection string do banco destino (obrigatório)
- `--dry-run` - Simula importação sem modificar banco

**Saída:**
- `data/import-report.json` - Relatório de importação

### `npm run import:dry-run`
Simula importação sem modificar o banco.

### `npm run validate`
Valida que a migração foi bem-sucedida.

**Uso:**
```bash
node validate-migration.js --target="postgresql://user:pass@host:port/db"
```

**Verifica:**
- Estrutura de tabelas
- Contagem de registros
- Integridade de dados (checksum)
- Foreign keys

**Saída:**
- `data/validation-report.json` - Relatório de validação

## 🔒 Segurança

**⚠️ IMPORTANTE:**

- **Nunca commitar** arquivos `.json` com dados reais no Git
- **Nunca commitar** connection strings com senhas
- Arquivos em `data/` já estão no `.gitignore`
- Use variáveis de ambiente para credenciais

## 📊 Ordem de Execução

A ordem correta dos scripts respeita as dependências entre tabelas:

1. **Exportação:** Todas as tabelas de uma vez
2. **Schema:** Criar estrutura no novo banco
3. **Importação:** Na ordem:
   - pizzaria_config
   - categorias
   - bordas_recheadas, opcoes_sabores, tamanhos_pizza
   - carousel_config, admins
   - produtos (depende de categorias)
   - carousel_images
   - pedidos
   - pedido_itens (depende de pedidos e produtos)
   - mensagens_whatsapp
4. **Validação:** Verificar tudo

## 🐛 Troubleshooting

### Erro: `Cannot find module '@supabase/supabase-js'`

**Solução:**
```bash
npm install
```

### Erro: `NEXT_PUBLIC_SUPABASE_URL is not defined`

**Solução:**
Criar arquivo `.env.local` na raiz do projeto:
```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-aqui
```

### Erro: `connection refused` ao importar

**Possíveis causas:**
1. Banco destino não está ligado
2. Firewall bloqueando conexão
3. Connection string incorreta
4. Whitelist de IP necessário

**Solução:**
Testar conexão manualmente:
```bash
psql "postgresql://user:pass@host:port/db"
```

### Erro: `permission denied to create extension`

**Causa:**
Usuário não tem permissão de superuser.

**Solução:**
1. Executar `export-schema.sql` como superuser, OU
2. Remover linhas `CREATE EXTENSION` do SQL (se extensões já existem), OU
3. Pedir ao administrador do banco para criar as extensões

### Checksums diferentes mas contagens iguais

**Causa:**
Ordem de linhas pode ser diferente entre Supabase e novo banco.

**Solução:**
Se contagens batem e testes manuais funcionam, está OK. Checksums são apenas validação adicional.

## 📚 Documentação Completa

Para guia detalhado passo a passo, consulte:

**`/docs/INSTRUCOES_MIGRACAO.md`**

Para entender o plano estratégico de migração:

**`/docs/PLANO_MIGRACAO_BANCO.md`**

Para reconhecimento completo da aplicação:

**`/docs/RECONHECIMENTO_APLICACAO.md`**

## 💡 Dicas

### Backup Antes de Tudo

Sempre crie backup antes de iniciar:
- Supabase Dashboard → Database → Backups → Create Backup

### Teste em Staging Primeiro

Nunca execute migração diretamente em produção:
1. Crie banco de teste
2. Execute migração completa
3. Valide tudo
4. Só depois migre produção

### Mantenha Banco Antigo por 30 Dias

Após migração bem-sucedida, mantenha banco Supabase antigo por pelo menos 30 dias como backup de segurança.

### Monitore Após Migração

Primeiras 24h são críticas:
- Logs de erro
- Performance de queries
- Uso de recursos
- Testes de funcionalidades

## 📞 Suporte

Para problemas ou dúvidas:

1. Consulte `docs/INSTRUCOES_MIGRACAO.md` - Seção "Problemas Comuns"
2. Revise logs nos arquivos `*-report.json`
3. Teste scripts com `--dry-run` antes de executar

## 🎯 Checklist Rápido

- [ ] `npm install` executado
- [ ] `.env.local` configurado
- [ ] Backup do banco atual criado
- [ ] `npm run export` executado com sucesso
- [ ] Novo banco provisionado
- [ ] `export-schema.sql` aplicado no novo banco
- [ ] `npm run import:dry-run` testado
- [ ] Importação real executada
- [ ] Validação passou (100% ou próximo disso)
- [ ] Testes manuais na aplicação
- [ ] Aplicação apontando para novo banco
- [ ] Monitoramento ativo

---

**Versão:** 1.0  
**Última atualização:** Outubro 2025  
**Status:** Pronto para uso
