# 🚀 Início Rápido - Sistema de Pedidos Kanban

## ⚡ Passos para Começar

### 1️⃣ Executar Migração do Banco de Dados

Acesse o **Supabase Dashboard** → **SQL Editor** e execute:

```sql
-- Cole o conteúdo do arquivo:
-- scripts/20-kanban-pedidos-migration.sql
```

Ou execute diretamente:

```bash
# Se tiver o Supabase CLI instalado
supabase db push
```

### 2️⃣ Verificar Instalação

Execute o script de verificação no **SQL Editor**:

```sql
-- Cole o conteúdo do arquivo:
-- scripts/verificar-pedidos-kanban.sql
```

Você deve ver:
- ✅ Todos os campos criados
- ✅ Tabelas e views existindo
- ✅ Triggers ativos
- ✅ Funções funcionando

### 3️⃣ Iniciar o Servidor de Desenvolvimento

```bash
pnpm dev
```

### 4️⃣ Acessar a Página de Pedidos

Abra no navegador:
```
http://localhost:3000/admin/pedidos
```

## 🎯 Primeiro Uso

### Criar Pedidos de Teste

Execute no **SQL Editor** do Supabase:

```sql
-- Inserir pedidos de teste
INSERT INTO pedidos (
  nome_cliente, 
  telefone_cliente, 
  tipo_entrega,
  endereco_entrega,
  subtotal, 
  taxa_entrega, 
  total, 
  status, 
  forma_pagamento,
  observacoes
) VALUES
  (
    'João Silva', 
    '(11) 98765-4321', 
    'delivery',
    'Rua das Flores, 123 - Centro',
    45.00, 
    5.00, 
    50.00, 
    'pendente', 
    'pix',
    'Sem cebola na pizza'
  ),
  (
    'Maria Santos', 
    '(11) 98765-4322', 
    'delivery',
    'Av. Principal, 456 - Jardim',
    60.00, 
    5.00, 
    65.00, 
    'em_preparo', 
    'dinheiro',
    'Troco para R$ 100,00'
  ),
  (
    'Pedro Costa', 
    '(11) 98765-4323', 
    'balcao',
    NULL,
    35.00, 
    0, 
    35.00, 
    'saiu_entrega', 
    'credito',
    NULL
  ),
  (
    'Ana Paula', 
    '(11) 98765-4324', 
    'delivery',
    'Rua do Comércio, 789',
    80.00, 
    5.00, 
    85.00, 
    'finalizado', 
    'pix',
    'Entregar no portão'
  );

-- Inserir itens para os pedidos
INSERT INTO pedido_itens (
  pedido_id,
  produto_id,
  nome_produto,
  quantidade,
  tamanho,
  preco_unitario,
  subtotal
)
SELECT 
  p.id,
  gen_random_uuid(),
  'Pizza Margherita',
  2,
  'Grande',
  22.50,
  45.00
FROM pedidos p
WHERE p.nome_cliente = 'João Silva'
LIMIT 1;

INSERT INTO pedido_itens (
  pedido_id,
  produto_id,
  nome_produto,
  quantidade,
  tamanho,
  preco_unitario,
  subtotal
)
SELECT 
  p.id,
  gen_random_uuid(),
  'Pizza Calabresa',
  1,
  'Grande',
  30.00,
  30.00
FROM pedidos p
WHERE p.nome_cliente = 'Maria Santos'
LIMIT 1;

INSERT INTO pedido_itens (
  pedido_id,
  produto_id,
  nome_produto,
  quantidade,
  tamanho,
  preco_unitario,
  subtotal
)
SELECT 
  p.id,
  gen_random_uuid(),
  'Refrigerante 2L',
  1,
  NULL,
  10.00,
  10.00
FROM pedidos p
WHERE p.nome_cliente = 'Maria Santos'
LIMIT 1;
```

## 🎨 Funcionalidades Principais

### 📱 Visualizar Pedidos
- Os pedidos aparecem automaticamente nas colunas
- Cada coluna representa um status diferente
- Cards coloridos por tipo de entrega

### 🔄 Mover Pedidos (Drag & Drop)
1. Clique e segure em um card
2. Arraste para outra coluna
3. Solte para atualizar o status
4. ✅ Validação automática de transições

### 🔍 Buscar e Filtrar
- **Busca:** Digite número, nome ou telefone
- **Filtro:** Selecione tipo de entrega
- **Limpar:** Clique em "Limpar Filtros"

### 👁️ Ver Detalhes
1. Clique em "Detalhes" no card
2. Veja informações completas
3. Histórico de mudanças
4. Ações rápidas de status

### ❌ Cancelar Pedido
1. Abra o modal de detalhes
2. Clique em "Cancelar Pedido"
3. Informe o motivo
4. Confirme o cancelamento

### 🔔 Notificações em Tempo Real
- Novos pedidos aparecem automaticamente
- Som de notificação
- Badge animado no topo

## 🎯 Atalhos Úteis

| Ação | Como Fazer |
|------|------------|
| Atualizar lista | Clique no botão "Atualizar" |
| Ver detalhes | Clique em "Detalhes" no card |
| Mover status | Arraste o card para outra coluna |
| Buscar | Digite na barra de busca |
| Filtrar | Use o seletor de tipo |
| Limpar filtros | Clique em "Limpar Filtros" |

## 🐛 Problemas Comuns

### Pedidos não aparecem
**Solução:**
1. Verifique se executou a migração SQL
2. Confirme que a view existe: `SELECT * FROM vw_pedidos_kanban`
3. Verifique se há pedidos: `SELECT COUNT(*) FROM pedidos`

### Drag & Drop não funciona
**Solução:**
1. Limpe o cache do navegador (Ctrl + Shift + Delete)
2. Recarregue a página (Ctrl + F5)
3. Verifique o console para erros (F12)

### Realtime não atualiza
**Solução:**
1. Verifique se o Realtime está habilitado no Supabase
2. Confirme a conexão: Dashboard → Settings → API
3. Verifique as permissões RLS

### Erro ao mover pedido
**Solução:**
- Algumas transições não são permitidas
- Exemplo: Não pode mover de "Finalizado" para "Pendente"
- Veja o fluxo permitido na documentação

## 📊 Monitoramento

### Ver Estatísticas
```sql
SELECT * FROM estatisticas_kanban();
```

### Ver Histórico de um Pedido
```sql
SELECT * FROM buscar_historico_pedido('ID_DO_PEDIDO');
```

### Contar Pedidos por Status
```sql
SELECT 
  status,
  COUNT(*) as total
FROM pedidos
GROUP BY status
ORDER BY 
  CASE status
    WHEN 'pendente' THEN 1
    WHEN 'em_preparo' THEN 2
    WHEN 'saiu_entrega' THEN 3
    WHEN 'finalizado' THEN 4
    WHEN 'cancelado' THEN 5
  END;
```

## 🎓 Próximos Passos

1. ✅ Familiarize-se com a interface
2. ✅ Teste o drag & drop
3. ✅ Explore o modal de detalhes
4. ✅ Configure notificações
5. ✅ Personalize as colunas (se necessário)

## 📚 Documentação Completa

- `docs/PEDIDOS_KANBAN_README.md` - Documentação completa
- `docs/PLANO_PEDIDOS_KANBAN_PARTE4_FINAL.md` - Plano de implementação
- `scripts/20-kanban-pedidos-migration.sql` - Script de migração
- `scripts/verificar-pedidos-kanban.sql` - Script de verificação

## 💡 Dicas

- 🎯 Mantenha os pedidos organizados por prioridade
- 🔄 Use o drag & drop para agilizar o fluxo
- 📱 Monitore as notificações em tempo real
- 📊 Consulte as estatísticas regularmente
- 🔍 Use os filtros para focar em tipos específicos

---

**Pronto para usar!** 🚀

Se tiver dúvidas, consulte a documentação completa ou entre em contato com o suporte.
