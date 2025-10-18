# Plano de Migração de Banco de Dados - Cardápio Digital v3

**Versão do Plano:** 1.0  
**Data:** Outubro 2025  
**Banco Origem:** Supabase PostgreSQL 17.4.1.45  
**Objetivo:** Migração completa para outro provedor de banco de dados

---

## 1. Visão Geral da Migração

### 1.1 Objetivos
- Exportar schema completo do banco de dados atual
- Exportar todos os dados preservando integridade referencial
- Criar scripts de importação compatíveis com diferentes provedores
- Garantir zero perda de dados
- Validar migração completa

### 1.2 Escopo
- **14 tabelas** do schema public
- **3 funções** customizadas PostgreSQL
- **Triggers** de atualização automática
- **Policies RLS** (Row Level Security)
- **Constraints** e validações
- **Índices** e otimizações
- **Dados** de todas as tabelas

### 1.3 Bancos de Destino Suportados
Este plano oferece compatibilidade com:
- ✅ PostgreSQL 12+ (auto-hospedado)
- ✅ Supabase (outro projeto)
- ✅ Railway
- ✅ Render
- ✅ Neon
- ✅ AWS RDS PostgreSQL
- ⚠️ MySQL/MariaDB (requer adaptações)
- ⚠️ MongoDB (requer reestruturação completa)

---

## 2. Inventário de Dados Atual

### 2.1 Tabelas e Volume de Dados

| Tabela | Registros | Crítico | Dependências |
|--------|-----------|---------|--------------|
| pizzaria_config | 1 | ⭐⭐⭐ | Nenhuma |
| categorias | 5 | ⭐⭐⭐ | Nenhuma |
| produtos | 61 | ⭐⭐⭐ | categorias |
| bordas_recheadas | 4 | ⭐⭐ | Nenhuma |
| opcoes_sabores | 3 | ⭐⭐ | Nenhuma |
| tamanhos_pizza | 2 | ⭐ | Nenhuma |
| carousel_config | 1 | ⭐⭐ | Nenhuma |
| carousel_images | 3 | ⭐⭐ | Nenhuma |
| admins | 1 | ⭐⭐⭐ | Nenhuma |
| pedidos | 0 | ⭐⭐⭐ | Nenhuma |
| pedido_itens | 0 | ⭐⭐⭐ | pedidos, produtos |
| mensagens_whatsapp | 0 | ⭐ | Nenhuma |
| auth.users | 1 | ⭐⭐ | Sistema Supabase |
| auth.* (outras) | Vários | ⭐ | Sistema Supabase |

**Total de Registros de Dados:** ~80 registros

### 2.2 Objetos do Banco

- **Tabelas:** 14 (schema public)
- **Funções:** 3
- **Triggers:** ~7 (updated_at em várias tabelas)
- **Constraints:**
  - Primary Keys: 14
  - Foreign Keys: 5
  - Unique: 2
  - Check: 3
- **Índices:** ~20 (incluindo PK)
- **Policies RLS:** ~30

---

## 3. Estratégia de Migração

### 3.1 Abordagem Escolhida: **"Blue-Green Migration"**

#### Vantagens
- ✅ Zero downtime potencial
- ✅ Rollback facilitado
- ✅ Testes completos antes do switch
- ✅ Comparação lado a lado

#### Fases
1. **Blue (Atual):** Supabase existente permanece ativo
2. **Green (Novo):** Novo banco é preparado e testado
3. **Sincronização:** Dados são migrados incrementalmente
4. **Validação:** Testes completos no ambiente Green
5. **Switch:** Aplicação aponta para novo banco
6. **Monitoramento:** Período de observação
7. **Decommission:** Banco antigo é desativado

### 3.2 Ordem de Migração (Respeitando Dependências)

```
FASE 1 - Schema e Estrutura
├── 1. Criar database
├── 2. Criar schema public
├── 3. Criar extensões necessárias (se houver)
└── 4. Criar tipos customizados (enums)

FASE 2 - Tabelas Base (sem FK)
├── 1. pizzaria_config
├── 2. categorias
├── 3. bordas_recheadas
├── 4. opcoes_sabores
├── 5. tamanhos_pizza
├── 6. carousel_config
├── 7. admins
└── 8. pedidos

FASE 3 - Tabelas Dependentes
├── 1. produtos (FK: categorias)
├── 2. carousel_images
├── 3. pedido_itens (FK: pedidos, produtos)
└── 4. mensagens_whatsapp

FASE 4 - Funções e Triggers
├── 1. verify_admin_password()
├── 2. update_admin_credentials()
├── 3. update_updated_at_column()
└── 4. Triggers em todas tabelas com updated_at

FASE 5 - Constraints e Validações
├── 1. Check constraints
├── 2. Unique constraints
└── 3. Validações customizadas

FASE 6 - Índices e Performance
├── 1. Índices de FK
├── 2. Índices de campos ordenáveis
└── 3. Índices compostos

FASE 7 - Segurança (Opcional se destino suportar RLS)
├── 1. Habilitar RLS em tabelas
└── 2. Criar policies
```

---

## 4. Plano de Execução Detalhado

### 4.1 Pré-Migração (Checkpoint 1)

#### 4.1.1 Backup Completo
```bash
# Exportar dump completo do Supabase
# Via CLI do Supabase ou script personalizado
```

**Checklist:**
- [ ] Dump do schema gerado
- [ ] Dump dos dados gerado
- [ ] Backup armazenado em local seguro (3 cópias)
- [ ] Verificação de integridade do backup
- [ ] Teste de restauração em ambiente local

#### 4.1.2 Análise de Compatibilidade
- [ ] Verificar versão PostgreSQL do destino
- [ ] Identificar features específicas do Supabase em uso
- [ ] Documentar adaptações necessárias
- [ ] Testar conexão com banco destino

#### 4.1.3 Preparação de Scripts
- [ ] Script de exportação de schema (SQL)
- [ ] Script de exportação de dados (Node.js + JSON)
- [ ] Script de importação para destino
- [ ] Script de validação pós-migração
- [ ] Script de rollback (se necessário)

---

### 4.2 Migração - Ambiente de Teste (Checkpoint 2)

#### 4.2.1 Criar Banco de Teste
```sql
-- Criar database no servidor destino
CREATE DATABASE cardapio_digital_test;
```

#### 4.2.2 Executar Migração de Schema
```bash
# Executar script de criação de schema
psql -h <host> -U <user> -d cardapio_digital_test -f schema_export.sql
```

**Checklist:**
- [ ] Todas tabelas criadas
- [ ] Primary keys configuradas
- [ ] Foreign keys configuradas
- [ ] Funções criadas
- [ ] Triggers ativos
- [ ] Constraints aplicadas

#### 4.2.3 Migração de Dados
```bash
# Executar script de importação
node migration/import-data.js --env=test
```

**Ordem de importação:**
1. pizzaria_config
2. categorias
3. bordas_recheadas, opcoes_sabores, tamanhos_pizza, carousel_config, admins
4. produtos
5. carousel_images
6. pedidos (se houver)
7. pedido_itens (se houver)
8. mensagens_whatsapp (se houver)

**Checklist:**
- [ ] Dados importados na ordem correta
- [ ] Contagem de registros validada
- [ ] Foreign keys preservadas
- [ ] Tipos de dados corretos
- [ ] Campos JSON válidos

#### 4.2.4 Validação Automática
```bash
# Executar script de validação
node migration/validate-migration.js --source=supabase --target=test
```

**Verificações:**
- [ ] Contagem de tabelas igual
- [ ] Contagem de registros igual por tabela
- [ ] Checksums de dados críticos
- [ ] Estrutura de índices
- [ ] Funções operacionais

---

### 4.3 Testes de Aplicação (Checkpoint 3)

#### 4.3.1 Configurar Aplicação para Banco de Teste
```env
# .env.test
DATABASE_URL=postgresql://user:pass@new-host:5432/cardapio_digital_test
```

#### 4.3.2 Testes Funcionais
- [ ] Login administrativo funciona
- [ ] Leitura de configurações da pizzaria
- [ ] Listagem de categorias e produtos
- [ ] Adicionar produto ao carrinho
- [ ] Processo de checkout completo
- [ ] Criação de pedido
- [ ] Envio de mensagem WhatsApp (teste)
- [ ] CRUD de categorias (admin)
- [ ] CRUD de produtos (admin)
- [ ] Upload de imagens (se aplicável)

#### 4.3.3 Testes de Performance
```bash
# Executar benchmarks
npm run test:performance -- --db=test
```

**Métricas:**
- [ ] Tempo de listagem de produtos < 500ms
- [ ] Tempo de criação de pedido < 1s
- [ ] Tempo de autenticação < 300ms
- [ ] Query de dashboard < 2s

#### 4.3.4 Testes de Integridade
- [ ] Foreign keys bloqueiam exclusões inválidas
- [ ] Constraints validam dados
- [ ] Triggers atualizam updated_at
- [ ] Valores padrão aplicados
- [ ] Campos obrigatórios validados

---

### 4.4 Migração - Produção (Checkpoint 4)

#### 4.4.1 Janela de Manutenção
**Recomendado:** 2-4 horas em horário de baixo tráfego

**Timeline:**
- T-60min: Comunicar usuários sobre manutenção
- T-30min: Backup final do banco atual
- T-15min: Colocar aplicação em modo manutenção
- T-0: Iniciar migração
- T+30min: Validação inicial
- T+60min: Testes críticos
- T+90min: Switch DNS/conexão
- T+120min: Monitoramento ativo

#### 4.4.2 Execução
```bash
# 1. Backup final
npm run migration:backup -- --final

# 2. Criar banco produção
npm run migration:create-db -- --env=production

# 3. Migrar schema
npm run migration:schema -- --env=production

# 4. Migrar dados
npm run migration:data -- --env=production

# 5. Validar
npm run migration:validate -- --env=production

# 6. Criar usuário de aplicação
npm run migration:create-app-user -- --env=production
```

#### 4.4.3 Validação Pós-Migração
- [ ] Todas tabelas existem
- [ ] Contagem de registros correta
- [ ] Teste de leitura funciona
- [ ] Teste de escrita funciona
- [ ] Teste de autenticação funciona
- [ ] Backup do novo banco criado

#### 4.4.4 Switch da Aplicação
```bash
# Atualizar variáveis de ambiente
# Reiniciar aplicação com novo banco
npm run deploy:switch-database
```

---

### 4.5 Pós-Migração (Checkpoint 5)

#### 4.5.1 Monitoramento (Primeiras 24h)
- [ ] Logs de erro da aplicação
- [ ] Performance de queries
- [ ] Taxa de erro de transações
- [ ] Uso de CPU/Memória do banco
- [ ] Latência de conexões

#### 4.5.2 Otimizações
```sql
-- Analisar tabelas para otimizar planos de query
ANALYZE;

-- Reindexar se necessário
REINDEX DATABASE cardapio_digital;

-- Limpar estatísticas antigas
VACUUM ANALYZE;
```

#### 4.5.3 Manter Banco Antigo (7-30 dias)
- Manter banco Supabase ativo mas sem escrita
- Apenas para rollback de emergência
- Custo baixo como seguro

#### 4.5.4 Decommission
Após 30 dias de estabilidade:
- [ ] Exportar logs de acesso
- [ ] Backup final arquival
- [ ] Pausar/Deletar projeto Supabase
- [ ] Documentar lições aprendidas

---

## 5. Pontos de Atenção Específicos

### 5.1 Features Específicas do Supabase

#### 5.1.1 Row Level Security (RLS)
**Status:** Implementado em todas tabelas  
**Ação:**
- ✅ PostgreSQL nativo suporta RLS
- ✅ Policies devem ser recriadas manualmente
- ⚠️ Testar autenticação/autorização após migração

#### 5.1.2 Autenticação (Supabase Auth)
**Status:** Usa tabela auth.users  
**Ação:**
- ⚠️ Sistema customizado usa tabela `admins`
- ✅ Migração não depende de Supabase Auth
- ℹ️ Se precisar auth.users, exportar separadamente

#### 5.1.3 Storage
**Status:** Imagens referenciadas via URL  
**Ação:**
- ⚠️ URLs apontam para Supabase Storage
- 🔄 Planejar migração de arquivos separadamente
- 💡 Considerar: AWS S3, Cloudinary, DigitalOcean Spaces
- 📝 Atualizar URLs no banco após migração de arquivos

#### 5.1.4 Realtime
**Status:** Não utilizado atualmente  
**Ação:** Nenhuma necessária

---

### 5.2 Dados Sensíveis

#### 5.2.1 Senhas de Administradores
**Tabela:** admins  
**Campo:** senha (hash)  
**Ação:**
- ✅ Migrar hashes como estão
- ⚠️ Verificar algoritmo de hash compatível
- 💡 Considerar re-hash com algoritmo mais forte

#### 5.2.2 Configurações da Pizzaria
**Tabela:** pizzaria_config  
**Campos:** whatsapp, telefone, endereco  
**Ação:**
- ✅ Dados não são sensíveis (públicos)
- ℹ️ Manter como estão

---

### 5.3 Campos JSON/JSONB

#### 5.3.1 horario_funcionamento (pizzaria_config)
**Estrutura esperada:**
```json
{
  "segunda": {"inicio": "18:00", "fim": "23:00", "aberto": true},
  "terca": {"inicio": "18:00", "fim": "23:00", "aberto": true},
  ...
}
```
**Ação:** Validar estrutura JSON na importação

#### 5.3.2 sabores (pedido_itens)
**Estrutura esperada:**
```json
[
  {
    "id": "uuid",
    "nome": "Calabresa",
    "fracao": 0.5
  },
  {
    "id": "uuid",
    "nome": "Mussarela",
    "fracao": 0.5
  }
]
```
**Ação:** Validar arrays JSON na importação

#### 5.3.3 adicionais (produtos)
**Estrutura esperada:**
```json
[
  {"nome": "Orégano", "preco": 0},
  {"nome": "Catupiry Extra", "preco": 5.00}
]
```
**Ação:** Validar estrutura na importação

---

### 5.4 UUIDs como Primary Keys

**Status:** Todas PKs são UUID v4  
**Ação:**
- ✅ PostgreSQL suporta nativamente
- ✅ Extensão uuid-ossp deve estar habilitada
- ✅ Função gen_random_uuid() disponível no PG 13+

```sql
-- Garantir extensão
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- OU para PG 13+
-- UUIDs nativos já disponíveis via gen_random_uuid()
```

---

## 6. Estratégias de Rollback

### 6.1 Rollback Antes do Switch
**Situação:** Problemas detectados durante validação  
**Ação:**
1. Cancelar migração
2. Manter aplicação no banco atual
3. Investigar problemas
4. Corrigir scripts
5. Tentar novamente

**Impacto:** Zero - usuários não afetados

### 6.2 Rollback Após Switch (< 1 hora)
**Situação:** Problemas críticos após switch  
**Ação:**
1. Reverter variáveis de ambiente
2. Reiniciar aplicação
3. Aplicação volta para banco antigo
4. Investigar logs do novo banco

**Impacto:** Baixo - alguns minutos de instabilidade

### 6.3 Rollback Após Produção Estável (> 1 hora)
**Situação:** Problema detectado após horas de uso  
**Ação:**
1. ⚠️ Dados novos criados no novo banco
2. Avaliar: sincronizar dados de volta?
3. Ou aceitar perda de dados recentes?
4. Decisão crítica de negócio

**Impacto:** Alto - possível perda de dados

**Prevenção:**
- Monitoramento ativo primeiras 24h
- Testes extensivos pré-produção
- Período de baixo tráfego para switch

---

## 7. Checklist Final de Migração

### 7.1 Pré-Requisitos
- [ ] Backup completo do banco atual
- [ ] Scripts de migração testados
- [ ] Banco de destino provisionado
- [ ] Credenciais de acesso configuradas
- [ ] Equipe técnica em standby
- [ ] Janela de manutenção agendada
- [ ] Comunicação com stakeholders

### 7.2 Durante Migração
- [ ] Modo manutenção ativado
- [ ] Schema migrado com sucesso
- [ ] Dados migrados com sucesso
- [ ] Validação automática passou
- [ ] Testes manuais executados
- [ ] Performance aceitável
- [ ] Logs sem erros críticos

### 7.3 Pós-Migração
- [ ] Aplicação conectada ao novo banco
- [ ] Testes end-to-end passando
- [ ] Monitoramento ativo
- [ ] Backup do novo banco criado
- [ ] Banco antigo em standby
- [ ] Documentação atualizada
- [ ] Equipe treinada no novo ambiente

### 7.4 Decommission (30 dias depois)
- [ ] Nenhum incidente reportado
- [ ] Performance estável
- [ ] Backup arquival criado
- [ ] Custos otimizados
- [ ] Banco antigo desativado

---

## 8. Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Perda de dados durante migração | Baixa | Alto | Backups múltiplos, validação rigorosa |
| Incompatibilidade de versão PG | Média | Médio | Testar em ambiente staging |
| Performance degradada | Média | Médio | Benchmark pré/pós, otimizar índices |
| Downtime prolongado | Baixa | Alto | Blue-green deployment, rollback rápido |
| Falha de validação | Média | Alto | Scripts de validação automática |
| URLs de imagens quebradas | Alta | Médio | Planejar migração de storage separada |
| Problemas com RLS/Policies | Média | Alto | Testar autorização extensivamente |

---

## 9. Estimativas de Tempo

### 9.1 Preparação (Antes do D-Day)
- Desenvolvimento de scripts: **8-16 horas**
- Testes em staging: **4-8 horas**
- Documentação: **2-4 horas**
- **Total preparação: 14-28 horas**

### 9.2 Execução (D-Day)
- Backup final: **10 minutos**
- Criação de schema: **5 minutos**
- Migração de dados: **5-10 minutos** (volume baixo)
- Validação: **15-20 minutos**
- Testes aplicação: **20-30 minutos**
- Switch: **5 minutos**
- **Total execução: 60-90 minutos**

### 9.3 Monitoramento Pós-Migração
- Primeiras 2 horas: **Atenção total**
- Primeiras 24 horas: **Monitoramento ativo**
- Primeira semana: **Revisões diárias**
- Até 30 dias: **Revisões semanais**

---

## 10. Custos Estimados

### 10.1 Infraestrutura
| Item | Custo Mensal | Observação |
|------|--------------|------------|
| Banco destino (produção) | $10-50 | Depende do provedor |
| Banco staging (teste) | $5-25 | Temporário durante migração |
| Armazenamento backups | $5-10 | 3 cópias por 30 dias |
| Manter Supabase standby | $0-25 | Free tier ou paused |
| **Total:** | **$20-110/mês** | Durante período de transição |

### 10.2 Tempo da Equipe
| Atividade | Horas | Custo Estimado* |
|-----------|-------|-----------------|
| Desenvolvimento | 16h | Variável |
| Testes | 8h | Variável |
| Execução | 4h | Variável |
| Monitoramento | 8h | Variável |
| **Total:** | **36h** | **Depende do time** |

*Custos de equipe variam por empresa

---

## 11. Próximos Passos

### 11.1 Imediato (Esta Semana)
1. ✅ Revisar este plano com equipe técnica
2. ✅ Escolher provedor de banco de destino
3. ✅ Definir data da migração
4. ⏳ Executar scripts de exportação (próximo passo)
5. ⏳ Criar ambiente de teste

### 11.2 Curto Prazo (Próximas 2 Semanas)
1. Desenvolver scripts de importação
2. Testar migração em staging
3. Validar performance
4. Preparar runbook detalhado

### 11.3 Médio Prazo (Próximo Mês)
1. Executar migração em produção
2. Monitorar estabilidade
3. Otimizar conforme necessário
4. Decommissionar banco antigo

---

## 12. Contatos e Responsáveis

### 12.1 Equipe de Migração
- **Líder Técnico:** [Nome]
- **DBA:** [Nome]
- **DevOps:** [Nome]
- **QA:** [Nome]
- **Product Owner:** [Nome]

### 12.2 Suporte
- **Supabase Support:** support@supabase.io
- **Provedor Destino:** [Link/Email]
- **Oncall:** [Número/Email]

---

## 13. Apêndices

### 13.1 Referências
- [Documentação oficial PostgreSQL - pg_dump](https://www.postgresql.org/docs/current/app-pgdump.html)
- [Supabase Database Migrations](https://supabase.com/docs/guides/database/migrations)
- [Best Practices for Database Migration](https://martinfowler.com/articles/evodb.html)

### 13.2 Scripts Relacionados
- `scripts/migration/export-schema.sql` - Exportar schema
- `scripts/migration/export-data.js` - Exportar dados
- `scripts/migration/import-data.js` - Importar dados
- `scripts/migration/validate-migration.js` - Validar migração
- `docs/INSTRUCOES_MIGRACAO.md` - Instruções passo a passo

---

**Plano criado:** Sistema de Reconhecimento Automático  
**Última atualização:** Outubro 2025  
**Versão:** 1.0
