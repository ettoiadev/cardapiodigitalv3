# Implementação da Funcionalidade de Promoção

## Visão Geral
Implementação completa da funcionalidade de promoção para pizzas, incluindo:
- Campo de promoção na interface administrativa
- Label visual "PROMOÇÃO" na homepage
- Restrição de delivery para pizzas em promoção
- Toast informativo no checkout

## Alterações no Banco de Dados

### 1. Nova Coluna na Tabela `produtos`
```sql
-- Adicionar campo promocao na tabela produtos
ALTER TABLE produtos ADD COLUMN promocao BOOLEAN DEFAULT false;

-- Criar índice para performance
CREATE INDEX idx_produtos_promocao ON produtos (promocao);

-- Comentário explicativo
COMMENT ON COLUMN produtos.promocao IS 'Indica se o produto está em promoção (válido apenas para retirada)';
```

**Características:**
- Campo `promocao` do tipo `BOOLEAN`
- Valor padrão `false` (produtos não ficam em promoção automaticamente)
- Índice criado para otimizar consultas

## Alterações na Interface Administrativa

### 1. Arquivo: `app/admin/produtos/page.tsx`

**Interface Produto atualizada:**
```typescript
interface Produto {
  id: string
  categoria_id: string | null
  nome: string
  descricao: string | null
  preco_tradicional: number | null
  preco_broto: number | null
  tipo: string
  ativo: boolean
  promocao: boolean // ← NOVO CAMPO
  ordem: number
  adicionais?: Adicional[]
}
```

**Formulário de Produto:**
- Estado inicial: `promocao: produto?.promocao ?? false`
- Toggle de promoção adicionado após o toggle "Produto disponível"
- Visual diferenciado com cor verde (`peer-checked:bg-green-600`)
- Texto explicativo quando ativo: "(válido apenas para retirada)"

**Localização:** Entre as linhas 1425-1445 do arquivo

## Alterações na Homepage

### 1. Arquivo: `app/page.tsx`

**Interface Produto atualizada:**
```typescript
interface Produto {
  id: string
  nome: string
  descricao: string | null
  preco_tradicional: number | null
  preco_broto: number | null
  tipo: string
  ativo: boolean
  promocao: boolean // ← NOVO CAMPO
  ordem: number
  adicionais?: Adicional[]
}
```

**Label "PROMOÇÃO":**
- Exibido em verde com fundo verde claro
- Posicionado à direita do nome da pizza
- Aplicado tanto na seção de pizzas quanto na função `renderCategoryProducts`
- Estilo: `text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded`

**Localizações:**
- Seção de pizzas: linhas 825-835
- Função renderCategoryProducts: linhas 545-555

## Alterações no Checkout

### 1. Arquivo: `app/checkout/page.tsx`

**Interface Produto atualizada:**
```typescript
interface Produto {
  id: string
  nome: string
  descricao: string | null
  preco_tradicional: number | null
  preco_broto: number | null
  tipo: string
  ativo: boolean
  promocao: boolean // ← NOVO CAMPO
  adicionais?: Adicional[]
}
```

**Novas Funcionalidades:**

1. **Estado do Toast:**
   ```typescript
   const [showPromocaoToast, setShowPromocaoToast] = useState(false)
   ```

2. **Função de Verificação:**
   ```typescript
   const hasPromocaoPizzas = () => {
     return state.items?.some(item => {
       const produto = produtos.find(p => p.id === item.id)
       return produto?.promocao === true
     }) || false
   }
   ```

3. **Função de Controle de Delivery:**
   ```typescript
   const handleDeliveryTypeChange = (type: "balcao" | "delivery") => {
     if (type === "delivery" && hasPromocaoPizzas()) {
       setShowPromocaoToast(true)
       return
     }
     setDeliveryType(type)
   }
   ```

4. **Toast Modal:**
   - Modal centralizado com overlay escuro
   - Ícone de pizza amarelo
   - Mensagem: "As Pizzas em PROMOÇÃO são válidas apenas para retirada no balcão."
   - Botão "Entendi" para fechar

## Comportamento da Funcionalidade

### 1. Painel Administrativo
- **Produtos novos:** Campo promoção desabilitado por padrão
- **Produtos existentes:** Mantém estado atual (false para todos os existentes)
- **Toggle:** Administrador pode habilitar/desabilitar promoção manualmente
- **Visual:** Indicação clara quando produto está em promoção

### 2. Homepage
- **Label verde:** Aparece à direita do nome da pizza quando `promocao = true`
- **Posicionamento:** Alinhado à direita, mesmo nível do título
- **Visibilidade:** Aparece em todas as seções onde o produto é exibido

### 3. Checkout
- **Verificação automática:** Sistema verifica se há pizzas em promoção no carrinho
- **Bloqueio de delivery:** Impede seleção de delivery quando há promoções
- **Toast informativo:** Mostra mensagem explicativa quando usuário tenta selecionar delivery
- **Retirada no balcão:** Única opção disponível para pedidos com promoção

## Regras de Negócio

### 1. Criação de Produtos
- Todos os produtos novos têm `promocao = false` por padrão
- Administrador deve habilitar promoção manualmente

### 2. Exibição Visual
- Label "PROMOÇÃO" aparece apenas quando `promocao = true`
- Cor verde para destacar a promoção
- Posicionamento consistente em todas as interfaces

### 3. Restrições de Entrega
- Pizzas em promoção são válidas APENAS para retirada no balcão
- Delivery é automaticamente bloqueado quando há promoções no carrinho
- Toast explicativo informa o motivo da restrição

### 4. Compatibilidade
- Funcionalidade preserva todo o comportamento existente
- Não afeta produtos sem promoção
- Não altera fluxo de pedidos normais

## Arquivos Modificados

1. **`app/admin/produtos/page.tsx`**
   - Interface Produto atualizada
   - Toggle de promoção no formulário
   - Estado inicial do formulário

2. **`app/page.tsx`**
   - Interface Produto atualizada
   - Label de promoção na seção de pizzas
   - Label de promoção na função renderCategoryProducts

3. **`app/checkout/page.tsx`**
   - Interface Produto atualizada
   - Lógica de verificação de promoções
   - Controle de seleção de delivery
   - Toast modal informativo

## Migração do Banco de Dados

A migração foi aplicada com sucesso:
- Campo `promocao` adicionado à tabela `produtos`
- Valor padrão `false` para todos os produtos existentes
- Índice criado para otimização de consultas

## Testes e Validação

### Build
✅ Build executado com sucesso
✅ Sem erros de TypeScript
✅ Todas as interfaces atualizadas corretamente

### Funcionalidades Testadas
- ✅ Campo de promoção no admin
- ✅ Label visual na homepage
- ✅ Lógica de restrição no checkout
- ✅ Toast informativo funcionando

## Status da Implementação

🟢 **COMPLETA** - Funcionalidade de promoção totalmente implementada e funcional

A implementação está pronta para uso em produção, mantendo total compatibilidade com o sistema existente e preservando todas as funcionalidades originais. 