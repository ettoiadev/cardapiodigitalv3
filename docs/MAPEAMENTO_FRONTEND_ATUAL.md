# 📋 MAPEAMENTO DO FRONTEND ATUAL - SISTEMA DE PEDIDOS

**Data:** 18/10/2025  
**Status:** Sistema WhatsApp (A ser migrado para banco de dados)

---

## 🏗️ ESTRUTURA DE ARQUIVOS

### **Páginas Principais:**

```
/app
├── page.tsx                    # 🏠 Homepage - Cardápio de produtos (1.054 linhas)
├── checkout/
│   └── page.tsx               # ✅ Checkout - Finalização com WhatsApp (1.370 linhas)
├── layout.tsx                 # Layout principal
└── globals.css               # Estilos globais
```

### **Componentes:**

```
/components
├── cart-footer.tsx            # 🛒 Rodapé do carrinho (206 linhas)
├── homepage-carousel.tsx      # 🎠 Carrossel da homepage
├── store-info-modal.tsx       # ℹ️ Modal de informações da loja
├── social-footer.tsx          # 📱 Rodapé com redes sociais
└── ui/                        # Componentes UI (shadcn/ui)
```

### **Contextos e Utilitários:**

```
/lib
├── cart-context.tsx           # 🛒 Gerenciamento do carrinho (242 linhas)
├── config-context.tsx         # ⚙️ Configurações da loja
├── currency-utils.ts          # 💰 Formatação de moeda
└── supabase.ts               # 🗄️ Cliente Supabase
```

---

## 🔄 FLUXO ATUAL DO PEDIDO

### **1. Homepage (`/app/page.tsx`)**

**Funcionalidades:**
- ✅ Exibição de produtos por categorias
- ✅ Sistema de pizzas multi-sabores (1, 2 ou 3 sabores)
- ✅ Seleção de tamanho (Broto ou Tradicional)
- ✅ Adição de adicionais por sabor
- ✅ Bordas recheadas
- ✅ Promoções
- ✅ Carrossel de imagens
- ✅ Informações da loja

**Estados principais:**
```typescript
- produtos: Produto[]              // Lista de produtos
- categorias: Categoria[]          // Categorias de produtos
- config: PizzariaConfig           // Configurações da pizzaria
- flavorMode: 1 | 2 | 3           // Modo de seleção de sabores
- selectedFlavorsForMulti: Produto[] // Sabores selecionados
```

**Componentes de produto:**
- Cards de produtos com foto, nome, descrição, preço
- Botões de seleção de tamanho
- Seleção de sabores (multi-sabor)
- Adicionais (checkboxes)
- Botão "Adicionar ao Carrinho"

---

### **2. Carrinho (`/lib/cart-context.tsx`)**

**Estrutura do Item:**
```typescript
interface CartItem {
  id: string                    // ID único do item no carrinho
  nome: string                  // Nome do produto
  tamanho: "broto" | "tradicional"
  sabores: string[]             // Array de sabores (multi-sabor)
  preco: number                 // Preço final calculado
  quantidade: number            // Quantidade
  tipo: string                  // "pizza", "bebida", etc.
  adicionais?: {                // Adicionais organizados por sabor
    sabor: string
    itens: { nome: string; preco: number }[]
  }[]
  bordaRecheada?: {             // Borda recheada opcional
    id: string
    nome: string
    preco: number
  }
}
```

**Ações do carrinho:**
```typescript
- ADD_ITEM              // Adicionar item ao carrinho
- REMOVE_ITEM           // Remover item
- UPDATE_QUANTITY       // Atualizar quantidade
- UPDATE_ADICIONAIS     // Atualizar adicionais
- UPDATE_BORDA          // Atualizar borda recheada
- UPDATE_TAMANHO        // Alterar tamanho
- CLEAR_CART            // Limpar carrinho
```

**Cálculos automáticos:**
- ✅ Preço base do produto
- ✅ Soma de adicionais por sabor
- ✅ Preço da borda recheada
- ✅ Multiplicação por quantidade
- ✅ Total do carrinho

**Persistência:**
- ✅ Salvamento automático no `localStorage`
- ✅ Recuperação ao recarregar página

---

### **3. Rodapé do Carrinho (`/components/cart-footer.tsx`)**

**Funcionalidades:**
- ✅ Exibição de quantidade de itens
- ✅ Exibição do total
- ✅ Botão "Finalizar Pedido" (redireciona para /checkout)
- ✅ Botão "Limpar Carrinho"
- ✅ Animações de feedback
- ✅ Badge com contador de itens
- ✅ Tooltip ao passar o mouse

**Navegação:**
```typescript
router.push("/checkout")  // Redireciona para página de checkout
```

---

### **4. Checkout (`/app/checkout/page.tsx`)** ⚠️ PONTO CRÍTICO

**Estados do formulário:**
```typescript
// Tipo de entrega
deliveryType: "balcao" | "delivery"

// Dados do cliente
customerName: string            // Nome completo
customerPhone: string           // Telefone
customerCep: string             // CEP
addressData: AddressData        // Dados do ViaCEP
addressNumber: string           // Número
addressComplement: string       // Complemento
deliveryNotes: string           // Observações da entrega

// Pagamento
paymentMethod: "pix" | "dinheiro" | "debito" | "credito" | "ticket_alimentacao"
orderNotes: string              // Observações do pedido

// Controle
submitting: boolean             // Estado de envio
```

**Funcionalidades:**
- ✅ Busca automática de endereço por CEP (ViaCEP API)
- ✅ Validação de campos obrigatórios
- ✅ Cálculo de taxa de entrega
- ✅ Verificação de valor mínimo
- ✅ Edição de itens do carrinho (quantidade, adicionais, borda)
- ✅ Seleção de forma de pagamento
- ✅ Geração de mensagem formatada

**Validações:**
```typescript
// Campos obrigatórios
- Nome do cliente
- Telefone
- Forma de pagamento

// Se delivery:
- CEP válido
- Endereço completo
- Número

// Valor mínimo
- Total >= config.valor_minimo
```

---

### **5. Finalização com WhatsApp** ⚠️ SERÁ SUBSTITUÍDO

**Função:** `handleFinishOrder()` (linha 619)

**Processo atual:**
1. ✅ Valida formulário
2. ✅ Gera mensagem formatada (`generateWhatsAppMessage()`)
3. ✅ Sanitiza número do WhatsApp
4. ✅ Constrói URL do WhatsApp Web
5. ✅ Abre janela do WhatsApp (`window.open()`)
6. ⚠️ **NÃO salva no banco de dados**
7. ⚠️ **NÃO cria registro de pedido**
8. ⚠️ **NÃO cria registro de cliente**

**URL gerada:**
```
https://wa.me/5512991605573?text=[mensagem_codificada]
```

---

### **6. Mensagem do WhatsApp** (`generateWhatsAppMessage()`)

**Formato da mensagem:**
```
*NOVO PEDIDO - [Nome da Pizzaria]*

📋 *ITENS DO PEDIDO:*

🍕 2x Pizza Marguerita - Tradicional
  • Sabor: Marguerita
  • Adicionais (Marguerita): Orégano (+R$ 2,00)
  • Borda Recheada: Catupiry (+R$ 5,00)
  • Total: R$ 75,00

🥤 1x Coca-Cola 2L
  • Total: R$ 10,00

🚚 *ENTREGA:* Delivery

👤 *DADOS DO CLIENTE:*
Nome: João Silva
Telefone: (12) 99160-5573

📍 *ENDEREÇO DE ENTREGA:*
Rua das Flores, 123
Apto 45
Centro - São José dos Campos/SP
CEP: 12345-678
Observações: Casa amarela

📝 *OBSERVAÇÕES DO PEDIDO:*
Sem cebola por favor

💳 *FORMA DE PAGAMENTO:*
PIX

💰 *VALORES:*
Subtotal: R$ 85,00
Taxa de entrega: R$ 5,00
*TOTAL: R$ 90,00*

⏳ Aguardando confirmação!
```

---

## 📊 DADOS COLETADOS (Mas não salvos)

### **Informações disponíveis no checkout:**

#### **Cliente:**
- ✅ Nome completo
- ✅ Telefone
- ✅ CEP
- ✅ Endereço completo (rua, número, bairro, cidade, estado)
- ✅ Complemento
- ✅ Observações de entrega

#### **Pedido:**
- ✅ Lista de produtos (nome, tamanho, sabores, adicionais, borda)
- ✅ Quantidade de cada item
- ✅ Preço unitário e total de cada item
- ✅ Tipo de entrega (delivery/balcão)
- ✅ Forma de pagamento
- ✅ Observações do pedido
- ✅ Subtotal
- ✅ Taxa de entrega
- ✅ Total

#### **Metadados:**
- ✅ Data/hora (implícito, pode ser capturado)
- ✅ Configuração da loja usada
- ✅ Status inicial: "Aguardando confirmação"

---

## 🔧 COMPONENTES UI USADOS

### **shadcn/ui:**
- `Button` - Botões de ação
- `Card` - Cards de produtos e checkout
- `Input` - Campos de texto
- `Label` - Labels de formulário
- `Textarea` - Campos de texto multi-linha
- `RadioGroup` - Seleção de pagamento
- `Checkbox` - Adicionais
- `Badge` - Tags e badges

### **lucide-react (ícones):**
- `ShoppingCart` - Ícone do carrinho
- `Plus / Minus` - Controle de quantidade
- `MapPin` - Endereço
- `Phone` - Telefone
- `User` - Cliente
- `CreditCard / DollarSign / Smartphone` - Pagamento
- `Bike / Pizza` - Delivery

---

## 🗄️ INTEGRAÇÃO COM BANCO (Atual)

### **Leitura do banco:**
- ✅ Produtos (`produtos`)
- ✅ Categorias (`categorias`)
- ✅ Configurações (`configuracoes_pizzaria`)
- ✅ Bordas recheadas (`bordas_recheadas`)

### **Escrita no banco:**
- ❌ **NENHUMA** - Tudo vai para WhatsApp

---

## ⚠️ PONTOS CRÍTICOS PARA MIGRAÇÃO

### **1. Função a ser substituída:**
```typescript
// ANTES (linha 619-699)
const handleFinishOrder = () => {
  // Gera mensagem
  // Abre WhatsApp
  // NÃO salva no banco
}

// DEPOIS (a implementar)
const handleFinishOrder = async () => {
  // Valida dados
  // Salva cliente (se novo)
  // Cria pedido no banco
  // Redireciona para página de confirmação
  // (Opcional) Envia notificação WhatsApp para admin
}
```

### **2. Dados que precisam ser salvos:**

**Tabela `clientes`:**
- nome
- telefone
- email (adicionar campo)
- senha_hash (adicionar autenticação)

**Tabela `pedidos`:**
- cliente_id
- numero_pedido (auto-gerado)
- status (pendente)
- tipo (entrega/retirada)
- endereco_* (se delivery)
- subtotal
- taxa_entrega
- desconto (0 inicialmente)
- total
- forma_pagamento
- observacoes
- criado_em

**Tabela `itens_pedido`:**
- pedido_id
- produto_id
- nome_produto (snapshot)
- tamanho
- sabores (JSON)
- quantidade
- preco_unitario
- adicionais (JSON)
- borda_recheada (JSON)
- subtotal

### **3. Mudanças necessárias:**

#### **Autenticação:**
- [ ] Criar página de cadastro
- [ ] Criar página de login
- [ ] Adicionar campo de email
- [ ] Criar sistema de sessão
- [ ] Proteger rota de checkout (requer login)

#### **API:**
- [ ] Criar `/api/pedidos/criar` (salvar pedido)
- [ ] Criar `/api/clientes/criar` (cadastro)
- [ ] Criar `/api/clientes/login` (autenticação)

#### **Frontend:**
- [ ] Adicionar formulário de login/cadastro
- [ ] Modificar `handleFinishOrder()` para chamar API
- [ ] Criar página de confirmação do pedido
- [ ] Criar página "Meus Pedidos"
- [ ] Adicionar notificação de sucesso

#### **Admin:**
- [ ] Verificar se pedidos aparecem automaticamente
- [ ] Adicionar notificação de novos pedidos
- [ ] Testar sincronização em tempo real

---

## 📱 CONFIGURAÇÕES DA LOJA

**Tabela:** `configuracoes_pizzaria`

**Campos usados no frontend:**
- `nome` - Nome da pizzaria
- `foto_capa` - Imagem de capa
- `foto_perfil` - Logo
- `taxa_entrega` - Taxa fixa de entrega
- `tempo_entrega_min` - Tempo mínimo
- `tempo_entrega_max` - Tempo máximo
- `valor_minimo` - Valor mínimo do pedido
- `aceita_dinheiro` - Habilita pagamento em dinheiro
- `aceita_cartao` - Habilita cartão
- `aceita_pix` - Habilita PIX
- `aceita_ticket_alimentacao` - Habilita ticket
- `whatsapp` - Número do WhatsApp ⚠️ (ainda usado)
- `telefone` - Telefone fixo
- `endereco` - Endereço físico
- `horario_funcionamento` - JSON com horários

---

## 🎯 RESUMO

### **O que funciona bem:**
✅ Interface limpa e intuitiva  
✅ Carrinho com gerenciamento completo  
✅ Seleção de produtos e customização  
✅ Cálculos automáticos corretos  
✅ Validação de formulário  
✅ Persistência do carrinho (localStorage)  
✅ Design responsivo  

### **O que precisa mudar:**
⚠️ Substituir envio para WhatsApp por salvamento no banco  
⚠️ Adicionar autenticação de cliente  
⚠️ Criar API de pedidos  
⚠️ Adicionar página de confirmação  
⚠️ Adicionar histórico de pedidos  
⚠️ Integrar com painel admin  

### **Layout e UX:**
✅ **MANTER** - O layout atual funciona bem e não precisa ser alterado  
✅ **MANTER** - Fluxo de seleção de produtos  
✅ **MANTER** - Componentes de UI (shadcn)  
✅ **MANTER** - Design responsivo  
✅ **MANTER** - Animações e feedback  

---

## 📝 PRÓXIMOS PASSOS

1. ✅ **Passo 1:** Mapear frontend atual ← **CONCLUÍDO**
2. ⏳ **Passo 2:** Verificar estrutura do banco
3. ⏳ **Passo 3:** Criar documentação da arquitetura
4. ⏳ **Passo 4:** Implementar autenticação
5. ⏳ **Passo 5:** Criar API de pedidos
6. ⏳ **Passo 6:** Integrar com admin
7. ⏳ **Passo 7:** Testar fluxo completo

---

**Documentação criada em:** 18/10/2025  
**Última atualização:** 18/10/2025  
**Responsável:** Sistema de Migração
