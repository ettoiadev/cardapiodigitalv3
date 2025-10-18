# Testes Recomendados - Cardápio Digital V3

## 1. Teste de Realtime com Múltiplos Usuários

### Objetivo
Verificar se atualizações em tempo real funcionam corretamente entre múltiplas sessões.

### Passos
1. Abrir 2 abas do navegador em `/admin/pedidos`
2. Fazer login como admin em ambas
3. **Aba 1**: Arrastar pedido de "Pendente" para "Em Preparo"
4. **Aba 2**: Verificar se pedido moveu automaticamente
5. **Aba 2**: Atualizar status do mesmo pedido
6. **Aba 1**: Verificar atualização

### Validações
- ✅ Pedido aparece na coluna correta em ambas as abas
- ✅ Campo `itens_resumo` não fica NULL após UPDATE
- ✅ Campo `total_itens` permanece correto
- ✅ Não há duplicação de cards
- ✅ Console mostra log: "🔄 Realtime UPDATE detectado, recarregando da view..."

### Resultado Esperado
Ambas as abas devem estar sincronizadas em < 500ms.

---

## 2. Teste de Carrinho com Fechamento Rápido

### Objetivo
Verificar se dados do carrinho são salvos mesmo com fechamento rápido da aba.

### Passos
1. Abrir `/` (homepage)
2. Adicionar 1 pizza ao carrinho
3. **IMEDIATAMENTE** fechar a aba (< 300ms)
4. Reabrir `/`
5. Verificar se pizza está no carrinho

### Validações
- ✅ Item aparece no carrinho após reabrir
- ✅ Quantidade está correta
- ✅ Preço está correto
- ✅ localStorage contém dados: `localStorage.getItem('pizzaria-cart')`

### Resultado Esperado
Carrinho deve ser restaurado com todos os itens.

---

## 3. Teste de CEP com Digitação Rápida

### Objetivo
Verificar se debounce de CEP funciona corretamente.

### Passos
1. Ir para `/checkout`
2. Selecionar "Delivery"
3. Digitar CEP completo **rapidamente**: `01310-100`
4. Observar Network tab (F12 → Network)
5. Contar quantas requisições para `viacep.com.br` foram feitas

### Validações
- ✅ Apenas 1 requisição é feita
- ✅ Requisição ocorre ~500ms após parar de digitar
- ✅ Endereço é preenchido corretamente
- ✅ Console mostra: "⌨️ CEP Digitado" com `debounceAtivo: true`

### Resultado Esperado
Apenas 1 requisição à API ViaCEP.

---

## 4. Teste de CEP Inválido

### Objetivo
Verificar tratamento de erros da API ViaCEP.

### Passos
1. Ir para `/checkout`
2. Selecionar "Delivery"
3. Digitar CEP inválido: `99999-999`
4. Aguardar resposta

### Validações
- ✅ Mensagem de erro aparece: "CEP não encontrado"
- ✅ Campos de endereço não são preenchidos
- ✅ Botão de finalizar permanece desabilitado
- ✅ Não há erro no console (apenas warning esperado)

### Resultado Esperado
Erro tratado graciosamente com mensagem clara.

---

## 5. Teste de Timeout de CEP

### Objetivo
Verificar comportamento quando API ViaCEP demora muito.

### Passos
1. Ir para `/checkout`
2. **Throttle de rede**: F12 → Network → Slow 3G
3. Digitar CEP válido: `01310-100`
4. Aguardar 5 segundos

### Validações
- ✅ Após 5 segundos, mensagem aparece: "Tempo esgotado. Tente novamente."
- ✅ Loading spinner para de girar
- ✅ Usuário pode tentar novamente
- ✅ Console mostra: "Erro ao buscar CEP" com detalhes

### Resultado Esperado
Timeout em 5 segundos com mensagem clara.

---

## 6. Teste de Transições de Status Inválidas

### Objetivo
Verificar se validação de transições de status funciona.

### Passos
1. Ir para `/admin/pedidos`
2. Criar pedido de teste com status "Pendente"
3. Tentar arrastar diretamente para "Finalizado"

### Validações
- ✅ Drag é bloqueado ou pedido volta para coluna original
- ✅ Toast de erro aparece: "Transição inválida"
- ✅ Console mostra validação: `validacao: false`

### Casos de Teste

| Status Atual | Status Destino | Deve Permitir? |
|--------------|----------------|----------------|
| Pendente | Em Preparo | ✅ Sim |
| Pendente | Finalizado | ❌ Não |
| Pendente | Cancelado | ✅ Sim |
| Em Preparo | Saiu Entrega | ✅ Sim |
| Em Preparo | Finalizado | ✅ Sim (balcão) |
| Saiu Entrega | Pendente | ❌ Não |
| Finalizado | Qualquer | ❌ Não |
| Cancelado | Qualquer | ❌ Não |

### Resultado Esperado
Apenas transições válidas são permitidas.

---

## 7. Teste de Promoção com Delivery

### Objetivo
Verificar se regra de promoção (apenas balcão) funciona.

### Passos
1. Ir para `/`
2. Adicionar pizza em promoção ao carrinho
3. Ir para `/checkout`
4. Selecionar "Delivery"

### Validações
- ✅ Toast aparece: "Produtos em promoção disponíveis apenas para retirada no balcão"
- ✅ Tipo de entrega volta para "Balcão"
- ✅ Usuário não consegue finalizar com delivery

### Resultado Esperado
Promoção bloqueada para delivery.

---

## 8. Teste de Quantidade Máxima no Carrinho

### Objetivo
Verificar limite de 50 unidades por item.

### Passos
1. Ir para `/`
2. Adicionar 1 pizza ao carrinho
3. No carrinho, aumentar quantidade para 50
4. Tentar aumentar para 51

### Validações
- ✅ Quantidade para em 50
- ✅ Console mostra warning: "Quantidade máxima atingida: 50"
- ✅ Botão "+" fica desabilitado ou não funciona
- ✅ Total é calculado corretamente (preço × 50)

### Resultado Esperado
Limite de 50 unidades é respeitado.

---

## 9. Teste de Arredondamento Monetário

### Objetivo
Verificar se cálculos monetários estão corretos (sem erros de ponto flutuante).

### Passos
1. Ir para `/`
2. Adicionar pizza de R$ 29,90 (quantidade: 3)
3. Adicionar borda recheada de R$ 7,50
4. Verificar total no carrinho

### Validações
- ✅ Subtotal: R$ 89,70 (29,90 × 3)
- ✅ Borda: R$ 7,50
- ✅ Total: R$ 97,20
- ✅ Sem valores como R$ 97,19999999

### Resultado Esperado
Valores sempre com 2 casas decimais exatas.

---

## 10. Teste de Múltiplos Sabores com Adicionais

### Objetivo
Verificar se comparação de itens no carrinho funciona com adicionais em ordem diferente.

### Passos
1. Ir para `/`
2. Montar pizza de 2 sabores: Calabresa + Frango
3. Adicionar adicionais:
   - Calabresa: Bacon
   - Frango: Cheddar
4. Adicionar ao carrinho
5. Montar MESMA pizza mas com sabores em ordem inversa: Frango + Calabresa
6. Adicionar MESMOS adicionais (mas ordem inversa):
   - Frango: Cheddar
   - Calabresa: Bacon
7. Adicionar ao carrinho

### Validações
- ✅ Carrinho deve ter apenas 1 item com quantidade 2
- ✅ Não deve duplicar item
- ✅ Console mostra: "Item existente encontrado, incrementando quantidade"

### Resultado Esperado
Itens idênticos são agrupados independente da ordem.

---

## 11. Teste de Histórico de Status

### Objetivo
Verificar se histórico de mudanças de status é registrado corretamente.

### Passos
1. Criar pedido via frontend
2. Ir para `/admin/pedidos`
3. Mover pedido: Pendente → Em Preparo → Saiu Entrega → Finalizado
4. Verificar no banco de dados:
```sql
SELECT * FROM pedido_historico 
WHERE pedido_id = '[ID_DO_PEDIDO]'
ORDER BY created_at DESC;
```

### Validações
- ✅ 4 registros no histórico (1 para cada mudança)
- ✅ `status_anterior` e `status_novo` corretos
- ✅ `alterado_por` preenchido
- ✅ Timestamps em ordem crescente

### Resultado Esperado
Histórico completo e preciso de todas as mudanças.

---

## 12. Teste de Número de Pedido Único

### Objetivo
Verificar se números de pedido são únicos e sequenciais.

### Passos
1. Criar 3 pedidos no mesmo dia
2. Verificar números gerados

### Validações
- ✅ Formato: `PED-YYYYMMDD-XXX`
- ✅ Exemplo: `PED-20250118-001`, `PED-20250118-002`, `PED-20250118-003`
- ✅ Números são sequenciais
- ✅ Não há duplicação

### Resultado Esperado
Números únicos e sequenciais por dia.

---

## 13. Teste de View vw_pedidos_kanban

### Objetivo
Verificar se view retorna dados corretos e completos.

### Passos
1. Criar pedido com 3 itens
2. Executar query:
```sql
SELECT 
  numero_pedido,
  total_itens,
  itens_resumo,
  total
FROM vw_pedidos_kanban
WHERE numero_pedido = '[NUMERO_DO_PEDIDO]';
```

### Validações
- ✅ `total_itens` = 3
- ✅ `itens_resumo` é array JSON com 3 elementos
- ✅ Cada elemento tem: `nome`, `quantidade`, `tamanho`
- ✅ `total` é numérico (não NULL)
- ✅ Campos críticos não são NULL

### Resultado Esperado
View retorna dados agregados corretamente.

---

## 14. Teste de Performance - Carregamento de Pedidos

### Objetivo
Verificar performance com muitos pedidos.

### Passos
1. Criar 100 pedidos de teste
2. Ir para `/admin/pedidos`
3. Medir tempo de carregamento (F12 → Performance)

### Validações
- ✅ Carregamento inicial < 2 segundos
- ✅ Realtime subscription < 500ms
- ✅ Drag & drop responsivo (< 100ms)
- ✅ Sem travamentos na UI

### Resultado Esperado
Performance aceitável mesmo com muitos pedidos.

---

## 15. Teste de Memory Leak - Realtime

### Objetivo
Verificar se há vazamento de memória com Realtime.

### Passos
1. Abrir `/admin/pedidos`
2. F12 → Memory → Take Heap Snapshot
3. Navegar para outra página e voltar 10 vezes
4. Take Heap Snapshot novamente
5. Comparar snapshots

### Validações
- ✅ Número de listeners não aumenta indefinidamente
- ✅ Canais Realtime são removidos ao desmontar componente
- ✅ Console mostra: "🔌 Realtime Desconectado" ao sair da página
- ✅ Memória não cresce > 10MB após 10 navegações

### Resultado Esperado
Sem vazamento de memória detectável.

---

## 16. Teste de Recuperação de Erro - Supabase Offline

### Objetivo
Verificar comportamento quando Supabase está offline.

### Passos
1. Desconectar internet
2. Tentar acessar `/admin/pedidos`

### Validações
- ✅ Mensagem de erro clara: "Erro ao carregar pedidos"
- ✅ Botão "Recarregar" disponível
- ✅ Não há crash da aplicação
- ✅ Console mostra erro estruturado com detalhes

### Resultado Esperado
Erro tratado graciosamente com opção de retry.

---

## 17. Teste de Validação de Formulário - Checkout

### Objetivo
Verificar todas as validações do formulário de checkout.

### Casos de Teste

| Campo | Valor | Deve Permitir? |
|-------|-------|----------------|
| Nome | "Jo" | ❌ Não (< 3 chars) |
| Nome | "João Silva" | ✅ Sim |
| Telefone | "1199999" | ❌ Não (< 10 dígitos) |
| Telefone | "(11) 99999-9999" | ✅ Sim |
| CEP (delivery) | "" | ❌ Não |
| CEP (delivery) | "01310-100" | ✅ Sim |
| CEP (balcão) | "" | ✅ Sim (não obrigatório) |
| Número (delivery) | "" | ❌ Não |
| Número (delivery) | "123" | ✅ Sim |

### Resultado Esperado
Validações corretas em todos os casos.

---

## 18. Teste de Sanitização - WhatsApp

### Objetivo
Verificar se número de WhatsApp é sanitizado corretamente.

### Passos
1. Configurar WhatsApp: `(11) 99999-9999`
2. Finalizar pedido
3. Verificar link gerado

### Validações
- ✅ Link: `https://wa.me/5511999999999`
- ✅ Sem caracteres especiais: `()`, `-`, espaços
- ✅ Com código do país: `55`

### Resultado Esperado
Link válido do WhatsApp.

---

## Prioridade de Execução

### 🔴 CRÍTICOS (Executar Primeiro)
1. Teste 1: Realtime com múltiplos usuários
2. Teste 2: Carrinho com fechamento rápido
3. Teste 6: Transições de status inválidas
4. Teste 13: View vw_pedidos_kanban

### 🟡 IMPORTANTES (Executar em Seguida)
5. Teste 3: CEP com digitação rápida
6. Teste 7: Promoção com delivery
7. Teste 9: Arredondamento monetário
8. Teste 11: Histórico de status

### 🟢 RECOMENDADOS (Executar Quando Possível)
9. Teste 4: CEP inválido
10. Teste 5: Timeout de CEP
11. Teste 8: Quantidade máxima
12. Teste 10: Múltiplos sabores
13. Teste 12: Número de pedido único
14. Teste 14: Performance
15. Teste 15: Memory leak
16. Teste 16: Supabase offline
17. Teste 17: Validação de formulário
18. Teste 18: Sanitização WhatsApp

---

## Automação Recomendada

Considerar criar testes automatizados com:
- **Playwright** ou **Cypress** para testes E2E
- **Jest** + **React Testing Library** para testes unitários
- **Supabase Local Development** para testes de banco

Exemplo de teste automatizado (Playwright):

```typescript
// tests/e2e/realtime.spec.ts
import { test, expect } from '@playwright/test'

test('Realtime atualiza pedidos entre abas', async ({ browser }) => {
  const context = await browser.newContext()
  const page1 = await context.newPage()
  const page2 = await context.newPage()
  
  await page1.goto('/admin/pedidos')
  await page2.goto('/admin/pedidos')
  
  // Arrastar pedido na página 1
  await page1.dragAndDrop('[data-pedido-id="123"]', '[data-status="em_preparo"]')
  
  // Verificar atualização na página 2
  await expect(page2.locator('[data-status="em_preparo"] [data-pedido-id="123"]'))
    .toBeVisible({ timeout: 1000 })
})
```
