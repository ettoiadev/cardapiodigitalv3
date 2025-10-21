# 🚀 Guia Rápido - Kanban de Pedidos

## Como Testar o Sistema

### 1. Iniciar o Servidor de Desenvolvimento

```bash
npm run dev
```

Acesse: `http://localhost:3000/admin/pedidos`

---

### 2. Testar Drag & Drop

1. **Criar um pedido de teste** (se não houver nenhum):
   - Vá para a homepage: `http://localhost:3000`
   - Adicione produtos ao carrinho
   - Finalize o pedido

2. **Arrastar pedido**:
   - Clique e segure no ícone ⋮⋮ (grip) do card
   - Arraste para outra coluna
   - Solte e observe o toast de confirmação

3. **Validar transições**:
   - Tente arrastar um pedido "Finalizado" → Deve mostrar erro
   - Tente arrastar "Pendente" → "Em Preparo" → Deve funcionar
   - Tente arrastar "Pendente" → "Finalizado" → Deve mostrar erro

---

### 3. Testar Botões

#### Botão "Aceitar" (verde)
- Aparece apenas em pedidos "Pendente"
- Clique e observe:
  - Toast de loading
  - Pedido move para "Em Preparo"
  - Toast de sucesso

#### Botão "Cancelar" (vermelho)
- Clique no botão
- Modal abre pedindo motivo
- Digite o motivo e confirme
- Pedido move para "Cancelado"

#### Botão "Imprimir"
- Clique no botão
- Nova janela abre com layout de impressão
- Impressão automática inicia
- Janela fecha automaticamente

#### Botão "Detalhes" (azul)
- Clique no botão
- Modal completo abre
- Veja todos os dados do pedido
- Histórico de status (se houver)

---

### 4. Testar Tempo Real

1. **Abra duas abas do navegador**:
   - Aba 1: `/admin/pedidos`
   - Aba 2: `/admin/pedidos`

2. **Na Aba 1**:
   - Arraste um pedido para outra coluna

3. **Na Aba 2**:
   - Observe a atualização automática
   - Pedido deve mover sozinho

4. **Criar novo pedido**:
   - Aba 3: Faça um pedido na homepage
   - Aba 1 e 2: Badge de notificação aparece
   - Som de notificação toca
   - Pedido aparece automaticamente

---

### 5. Testar Filtros

1. **Busca por texto**:
   - Digite número do pedido (ex: "PED-20250120-001")
   - Digite nome do cliente
   - Digite telefone

2. **Filtro de tipo**:
   - Selecione "Delivery"
   - Selecione "Balcão"
   - Selecione "Mesa"

3. **Limpar filtros**:
   - Clique em "Limpar Filtros"
   - Todos os pedidos voltam

---

## 🐛 Solução de Problemas

### Pedidos não aparecem?

1. **Verificar se há pedidos no banco**:
```sql
SELECT COUNT(*) FROM pedidos;
```

2. **Verificar view**:
```sql
SELECT * FROM vw_pedidos_kanban LIMIT 5;
```

3. **Verificar console do navegador** (F12):
   - Erros em vermelho?
   - Logs de "Carregar pedidos"?

### Drag & drop não funciona?

1. **Verificar se biblioteca está instalada**:
```bash
npm list @dnd-kit/core
```

2. **Verificar console**:
   - Erros de "DndContext"?
   - Warnings de "Droppable"?

### Realtime não atualiza?

1. **Verificar Supabase Realtime**:
   - Acesse: https://supabase.com/dashboard/project/umbjzrlajwzlclyemslv
   - Vá em: Database → Replication
   - Certifique-se que tabela `pedidos` está habilitada

2. **Verificar console**:
   - Logs de "Mudança em pedidos"?
   - Subscription ativa?

### Toasts não aparecem?

1. **Verificar se Toaster está no layout**:
   - Arquivo: `app/admin/layout.tsx`
   - Deve ter: `<Toaster position="top-right" richColors />`

2. **Verificar importação**:
```typescript
import { toast } from 'sonner'
```

---

## 📊 Verificar Dados no Banco

### Ver todos os pedidos
```sql
SELECT 
    numero_pedido,
    nome_cliente,
    status,
    total,
    created_at
FROM vw_pedidos_kanban
ORDER BY created_at DESC;
```

### Ver histórico de um pedido
```sql
SELECT * FROM pedido_historico
WHERE pedido_id = 'SEU-UUID-AQUI'
ORDER BY created_at DESC;
```

### Ver estatísticas
```sql
SELECT 
    status,
    COUNT(*) as total,
    SUM(total) as valor_total
FROM pedidos
GROUP BY status;
```

---

## 🎯 Checklist de Teste

- [ ] Servidor iniciado sem erros
- [ ] Página `/admin/pedidos` carrega
- [ ] Pedidos aparecem nas colunas corretas
- [ ] Drag & drop funciona
- [ ] Transições inválidas mostram erro
- [ ] Botão "Aceitar" funciona
- [ ] Botão "Cancelar" funciona
- [ ] Botão "Imprimir" funciona
- [ ] Botão "Detalhes" funciona
- [ ] Busca funciona
- [ ] Filtros funcionam
- [ ] Realtime atualiza automaticamente
- [ ] Toasts aparecem
- [ ] Som de notificação toca

---

## 🔥 Dicas de Performance

1. **Limite de pedidos exibidos**:
   - Sistema carrega todos os pedidos
   - Para muitos pedidos (>100), considere paginação

2. **Realtime**:
   - Subscription única por página
   - Cleanup automático ao sair

3. **View otimizada**:
   - Agregações feitas no banco
   - Índices criados para performance

---

## 📞 Contato

Se encontrar algum problema não listado aqui:

1. Verifique o arquivo `KANBAN_MELHORIAS_IMPLEMENTADAS.md`
2. Verifique logs do console (F12)
3. Verifique logs do Supabase
4. Teste a query SQL da view manualmente

---

**Sistema testado e funcionando em:** 20/01/2025 ✅
