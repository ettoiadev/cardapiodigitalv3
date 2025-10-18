# 📋 Sistema de Pedidos Kanban

## 🎯 Visão Geral

Sistema completo de gerenciamento de pedidos em formato Kanban, permitindo visualização e controle em tempo real do fluxo de pedidos da pizzaria.

## ✨ Funcionalidades Implementadas

### 🎨 Interface Kanban
- ✅ **5 Colunas de Status**
  - Pendente (Amarelo)
  - Em Preparo (Azul)
  - Saiu para Entrega (Roxo)
  - Finalizado (Verde)
  - Cancelado (Vermelho)

- ✅ **Drag & Drop**
  - Arraste pedidos entre colunas para alterar status
  - Validação de transições permitidas
  - Feedback visual durante o arrasto
  - Atualização automática no banco de dados

### 📊 Visualização de Pedidos
- ✅ **Cards Informativos**
  - Número do pedido
  - Tempo decorrido desde criação
  - Dados do cliente (nome, telefone)
  - Endereço de entrega
  - Resumo dos itens
  - Valor total
  - Tipo de entrega (badge colorido)
  - Forma de pagamento

- ✅ **Contadores em Tempo Real**
  - Quantidade de pedidos por coluna
  - Valor total por coluna
  - Total geral de pedidos

### 🔍 Filtros e Busca
- ✅ **Busca Inteligente**
  - Por número do pedido
  - Por nome do cliente
  - Por telefone

- ✅ **Filtros**
  - Por tipo de entrega (Delivery, Balcão, Mesa)
  - Limpar filtros com um clique

### 📱 Modal de Detalhes
- ✅ **Informações Completas**
  - Dados do cliente
  - Lista completa de itens com preços
  - Resumo financeiro (subtotal, taxa, total)
  - Observações do pedido
  - Histórico de mudanças de status
  - Motivo de cancelamento (se aplicável)

- ✅ **Ações Rápidas**
  - Atualizar status
  - Cancelar pedido (com motivo)
  - Visualizar histórico completo

### ⚡ Tempo Real
- ✅ **Supabase Realtime**
  - Novos pedidos aparecem automaticamente
  - Atualizações de status em tempo real
  - Notificação sonora para novos pedidos
  - Badge animado mostrando novos pedidos

### 🔒 Validações
- ✅ **Regras de Negócio**
  - Transições de status validadas
  - Pedidos finalizados não podem ser alterados
  - Cancelamento requer motivo obrigatório
  - Histórico completo de auditoria

## 🗂️ Estrutura de Arquivos

```
app/admin/pedidos/
└── page.tsx                          # Página principal do Kanban

components/admin/
├── pedido-card.tsx                   # Card individual do pedido
├── kanban-column.tsx                 # Coluna do Kanban
├── pedido-detalhes-modal.tsx         # Modal de detalhes
├── pedido-status-actions.tsx         # Ações de status (já existia)
├── pedido-stats.tsx                  # Estatísticas (já existia)
└── pedido-timeline.tsx               # Timeline (já existia)

hooks/
├── use-pedidos-kanban.ts             # Hook principal de gerenciamento
└── use-realtime-pedidos.ts           # Hook de realtime (já existia)

types/
└── pedido.ts                         # Tipos TypeScript

config/
└── kanban-config.ts                  # Configurações do Kanban

scripts/
└── 20-kanban-pedidos-migration.sql   # Migração do banco de dados
```

## 🗄️ Banco de Dados

### Tabelas
- **pedidos** - Tabela principal (com novos campos)
- **pedido_itens** - Itens dos pedidos
- **pedido_historico** - Histórico de mudanças

### View Otimizada
- **vw_pedidos_kanban** - View com dados agregados para performance

### Novos Campos em `pedidos`
- `numero_pedido` - Número único (PED-YYYYMMDD-XXX)
- `nome_cliente` - Nome do cliente
- `telefone_cliente` - Telefone do cliente
- `updated_at` - Data de atualização
- `status_anterior` - Status anterior (auditoria)
- `alterado_por` - Quem alterou
- `motivo_cancelamento` - Motivo do cancelamento
- `ordem_kanban` - Ordem na coluna (para drag & drop)

### Triggers Automáticos
- **gerar_numero_pedido** - Gera número único automaticamente
- **registrar_mudanca_status** - Registra histórico de mudanças

## 🚀 Como Usar

### 1. Executar Migração SQL

Antes de usar o sistema, execute a migração no Supabase:

```sql
-- No Supabase Dashboard > SQL Editor
-- Copie e execute o conteúdo de:
scripts/20-kanban-pedidos-migration.sql
```

### 2. Acessar a Página

```
http://localhost:3000/admin/pedidos
```

### 3. Operações Básicas

**Mover Pedido:**
- Clique e arraste o card para outra coluna
- O sistema valida se a transição é permitida
- Atualização automática no banco

**Ver Detalhes:**
- Clique no botão "Detalhes" no card
- Modal com informações completas

**Atualizar Status:**
- Use os botões de ação no modal
- Ou arraste o card para outra coluna

**Cancelar Pedido:**
- Clique em "Cancelar Pedido" no modal
- Informe o motivo obrigatório

**Buscar/Filtrar:**
- Use a barra de busca no topo
- Selecione o tipo de entrega
- Clique em "Limpar Filtros" para resetar

## 🎨 Fluxo de Status

```
┌─────────────┐
│  Pendente   │
└──────┬──────┘
       │
       ├─────────────────┐
       │                 │
       ▼                 ▼
┌─────────────┐   ┌─────────────┐
│ Em Preparo  │   │  Cancelado  │
└──────┬──────┘   └─────────────┘
       │
       ├──────────┬──────────────┐
       │          │              │
       ▼          ▼              ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│Saiu Entrega │ │ Finalizado  │ │  Cancelado  │
└──────┬──────┘ └─────────────┘ └─────────────┘
       │
       ├──────────┬──────────────┐
       │          │              │
       ▼          ▼              ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ Finalizado  │ │  Cancelado  │ │             │
└─────────────┘ └─────────────┘ └─────────────┘
```

## 🔧 Tecnologias Utilizadas

- **Next.js 15** - Framework React
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **Shadcn UI** - Componentes UI
- **@dnd-kit** - Drag & Drop
- **Supabase** - Backend e Realtime
- **date-fns** - Manipulação de datas
- **Sonner** - Notificações toast

## 📈 Performance

- ✅ View otimizada com índices
- ✅ Realtime com subscription eficiente
- ✅ Lazy loading de dados
- ✅ Memoização de cálculos pesados
- ✅ Suporta 100+ pedidos simultâneos

## 🐛 Troubleshooting

### Drag & Drop não funciona
- Verifique se as dependências @dnd-kit estão instaladas
- Limpe o cache do navegador
- Verifique o console para erros

### Realtime não atualiza
- Verifique a conexão com Supabase
- Confirme que o Realtime está habilitado no projeto
- Verifique as permissões RLS

### Pedidos não aparecem
- Execute a migração SQL
- Verifique se a view vw_pedidos_kanban existe
- Confirme que há pedidos no banco

## 📝 Próximas Melhorias

- [ ] Impressão de pedidos
- [ ] Exportação para Excel
- [ ] Estatísticas avançadas
- [ ] Notificações push
- [ ] Integração com impressora térmica
- [ ] Modo escuro
- [ ] Atalhos de teclado

## 📞 Suporte

Para dúvidas ou problemas, consulte a documentação completa em:
- `docs/PLANO_PEDIDOS_KANBAN_PARTE1.md`
- `docs/PLANO_PEDIDOS_KANBAN_PARTE2.md`
- `docs/PLANO_PEDIDOS_KANBAN_PARTE3.md`
- `docs/PLANO_PEDIDOS_KANBAN_PARTE4_FINAL.md`

---

**Versão:** 1.0  
**Data:** 2025-01-18  
**Status:** ✅ Implementado e Funcional
