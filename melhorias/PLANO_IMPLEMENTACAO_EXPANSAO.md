# 📋 PLANO DE IMPLEMENTAÇÃO - Expansão Cardápio Digital v3

## 🎯 Objetivo
Transformar o sistema de cardápio digital em uma **plataforma completa de gestão de pizzarias** com PDV, controle de entregas, caixa e estoque.

---

## 📊 ARQUITETURA DA EXPANSÃO

### Stack Tecnológica (Mantida)
- ✅ **Frontend:** Next.js 14 (App Router)
- ✅ **UI:** shadcn/ui + TailwindCSS
- ✅ **Backend:** Supabase (PostgreSQL + Realtime)
- ✅ **Autenticação:** Sistema atual de admins (bcrypt)
- ✅ **Deploy:** Vercel

### Novos Recursos
- 🆕 Supabase Realtime (entregas e pedidos em tempo real)
- 🆕 Geolocalização e cálculo de taxa por CEP
- 🆕 Impressão térmica (PDV e cozinha)
- 🆕 Relatórios em PDF/CSV

---

## 🗂️ ESTRUTURA DE IMPLEMENTAÇÃO

### **FASE 1: Infraestrutura e Banco de Dados** ✅ PRONTA PARA EXECUTAR
**Tempo estimado:** 30 minutos

#### Tarefas:
1. Criar tabelas no Supabase (via MCP):
   - `clientes`
   - `motoboys`
   - `entregas`
   - `taxas_entrega`
   - `caixa`
   - `lancamentos_caixa`
   - `estoque`

2. Configurar RLS (Row Level Security)
3. Criar funções e triggers necessários
4. Adicionar índices de performance
5. Atualizar tabela `pedidos` (adicionar `cliente_id`)

**Commit:** `feat: adicionar schema banco para modulos de gestao`

---

### **FASE 2: Módulo de Clientes** 
**Tempo estimado:** 2-3 horas

#### Tarefas:
1. Criar `/app/admin/clientes/page.tsx`
2. Criar componentes:
   - `ClientesTable` (listagem com busca)
   - `ClienteForm` (cadastro/edição)
   - `ClienteHistorico` (pedidos do cliente)
3. Implementar CRUD completo
4. Adicionar ao menu lateral do admin
5. Testar integração

**Commit:** `feat: implementar modulo de cadastro de clientes`

---

### **FASE 3: Módulo de Taxas de Entrega**
**Tempo estimado:** 2 horas

#### Tarefas:
1. Criar `/app/admin/taxas/page.tsx`
2. CRUD de taxas por bairro/CEP
3. Função de validação de CEP
4. Integração com checkout (calcular taxa automaticamente)
5. Validar se CEP está na área de entrega

**Commit:** `feat: implementar sistema de taxas de entrega por CEP`

---

### **FASE 4: Módulo de Motoboys**
**Tempo estimado:** 2 horas

#### Tarefas:
1. Criar `/app/admin/motoboys/page.tsx`
2. CRUD de motoboys (nome, telefone, status)
3. Indicador visual de status (disponível, em entrega, inativo)
4. Contador de entregas realizadas

**Commit:** `feat: implementar cadastro e gestao de motoboys`

---

### **FASE 5: Sistema de Entregas (Kanban)**
**Tempo estimado:** 3-4 horas

#### Tarefas:
1. Criar `/app/admin/entregas/page.tsx`
2. Implementar Kanban de pedidos:
   - Colunas: Pendente → Em Rota → Entregue
3. Drag & drop para mudança de status
4. Atribuir motoboy ao pedido
5. **Supabase Realtime** para atualização automática
6. Horários de saída e entrega

**Commit:** `feat: implementar sistema kanban de entregas com realtime`

---

### **FASE 6: Sistema de Caixa**
**Tempo estimado:** 3 horas

#### Tarefas:
1. Criar `/app/admin/caixa/page.tsx`
2. Abertura/Fechamento de caixa
3. Registro de lançamentos (entradas/saídas)
4. Resumo financeiro do dia
5. Validações (não permitir fechar sem conferir valores)

**Commit:** `feat: implementar sistema de abertura e fechamento de caixa`

---

### **FASE 7: PDV (Ponto de Venda)**
**Tempo estimado:** 4-5 horas

#### Tarefas:
1. Criar `/app/admin/pdv/page.tsx`
2. Interface simplificada de vendas:
   - Grid de produtos
   - Carrinho de compras
   - Seleção rápida de cliente
   - Formas de pagamento
3. Finalizar pedido e gerar comanda
4. Impressão para cozinha (PDF ou thermal printer)
5. Integração com caixa e estoque

**Commit:** `feat: implementar PDV completo com impressao`

---

### **FASE 8: Controle de Estoque**
**Tempo estimado:** 3 horas

#### Tarefas:
1. Criar `/app/admin/estoque/page.tsx`
2. Listagem de produtos com quantidades
3. Ajustes manuais de estoque
4. Histórico de movimentações
5. Alertas de estoque baixo
6. Integração automática com PDV (baixa de estoque)

**Commit:** `feat: implementar controle de estoque com alertas`

---

### **FASE 9: Dashboard de Pedidos (Melhorias)**
**Tempo estimado:** 2 horas

#### Tarefas:
1. Atualizar `/app/admin/pedidos/page.tsx`
2. Adicionar visualização Kanban
3. Filtros avançados (data, status, cliente)
4. Vincular pedidos a clientes
5. Botão de impressão de comanda

**Commit:** `feat: melhorar dashboard de pedidos com kanban e filtros`

---

### **FASE 10: Sistema de Relatórios**
**Tempo estimado:** 3-4 horas

#### Tarefas:
1. Criar `/app/admin/relatorios/page.tsx`
2. Relatórios implementados:
   - Vendas por período
   - Vendas por forma de pagamento
   - Entregas realizadas
   - Movimentação de caixa
   - Produtos mais vendidos
3. Exportação em PDF e CSV
4. Gráficos com Chart.js ou Recharts

**Commit:** `feat: implementar sistema completo de relatorios`

---

### **FASE 11: Melhorias de Checkout (Cliente Final)**
**Tempo estimado:** 2 horas

#### Tarefas:
1. Integrar cálculo automático de taxa por CEP
2. Salvar dados do cliente no pedido
3. Validar área de entrega antes de finalizar
4. Melhorar UX do checkout

**Commit:** `feat: integrar taxas de entrega no checkout do cliente`

---

### **FASE 12: Testes e Ajustes Finais**
**Tempo estimado:** 2-3 horas

#### Tarefas:
1. Testes de integração completos
2. Validar todos os fluxos
3. Corrigir bugs encontrados
4. Otimizar performance
5. Documentação final

**Commit:** `chore: testes finais e otimizacoes`

---

## 📊 RESUMO DA EXPANSÃO

### Tempo Total Estimado
**25-30 horas** (distribuídas em 12 fases)

### Novas Funcionalidades
- ✅ 7 novos módulos administrativos
- ✅ 7 novas tabelas no banco
- ✅ Sistema completo de PDV
- ✅ Gestão de entregas em tempo real
- ✅ Controle financeiro e caixa
- ✅ Relatórios gerenciais
- ✅ Controle de estoque

### Funcionalidades Preservadas
- ✅ Cardápio digital (cliente final)
- ✅ Checkout atual
- ✅ Sistema de categorias e produtos
- ✅ Carrossel de imagens
- ✅ Configurações da pizzaria

---

## 🚦 STATUS ATUAL

**FASE 1 - PRONTA PARA EXECUTAR**

Aguardando sua aprovação para iniciar a criação das tabelas no Supabase.

---

## 📝 COMO PROCEDER

1. Você me dá o **comando para iniciar a Fase 1**
2. Eu executo todas as tarefas da fase via MCP Supabase
3. Ao finalizar, eu gero um **commit completo**
4. Você faz o **push** do commit
5. Você me autoriza a **continuar para a próxima fase**
6. Repetimos o processo até concluir todas as 12 fases

---

## ✅ VANTAGENS DESSA ABORDAGEM

- ✅ **Controle total:** Você aprova cada etapa
- ✅ **Commits organizados:** Histórico limpo e rastreável
- ✅ **Rollback fácil:** Se algo der errado, basta reverter o commit
- ✅ **Testes incrementais:** Testar cada módulo antes de avançar
- ✅ **Menos bugs:** Implementação gradual e testada
- ✅ **Deploy seguro:** Pode fazer deploy a cada fase concluída

---

🎯 **Estou pronto para começar! Aguardo sua ordem para iniciar a FASE 1.**
