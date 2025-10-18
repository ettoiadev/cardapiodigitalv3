# Reconhecimento Completo da Aplicação - Cardápio Digital v3

**Data do Reconhecimento:** Outubro 2025  
**Versão da Aplicação:** 0.1.0  
**Projeto Supabase ID:** cduyketpnybwwynsjyuq

---

## 1. Visão Geral da Aplicação

### 1.1 Descrição
Sistema completo de cardápio digital para pizzarias com funcionalidades de:
- Cardápio interativo para clientes
- Carrinho de compras e checkout
- Integração com WhatsApp para pedidos
- Painel administrativo completo
- Gerenciamento de produtos, categorias e configurações

### 1.2 Stack Tecnológico

#### Frontend
- **Framework:** Next.js 15.2.4 (App Router)
- **Runtime:** React 19
- **Linguagem:** TypeScript 5
- **Estilização:** Tailwind CSS 3.4.17
- **UI Components:** Radix UI (completo)
- **Ícones:** Lucide React 0.454.0
- **Gerenciamento de Estado:** Context API + React Hooks
- **Formulários:** React Hook Form + Zod 3.24.1

#### Backend
- **BaaS:** Supabase
- **Banco de Dados:** PostgreSQL 17.4.1.45
- **Autenticação:** Supabase Auth
- **Storage:** Supabase Storage (imagens)
- **Real-time:** Supabase Realtime (potencial)

#### Dependências Principais
```json
{
  "@supabase/supabase-js": "latest",
  "next": "15.2.4",
  "react": "^19",
  "tailwind-merge": "^2.5.5",
  "class-variance-authority": "^0.7.1",
  "date-fns": "4.1.0",
  "sonner": "latest"
}
```

---

## 2. Estrutura do Projeto

### 2.1 Organização de Pastas
```
cardapiodigitalv3/
├── app/                           # Next.js App Router
│   ├── admin/                     # Painel administrativo
│   │   ├── categorias/           # Gestão de categorias
│   │   ├── produtos/             # Gestão de produtos
│   │   ├── configuracoes/        # Configurações da pizzaria
│   │   ├── pedidos/              # Gestão de pedidos
│   │   └── page.tsx              # Dashboard admin
│   ├── checkout/                 # Finalização de pedidos
│   ├── layout.tsx                # Layout raiz
│   ├── page.tsx                  # Página inicial (cardápio)
│   └── globals.css               # Estilos globais
│
├── components/                    # Componentes React
│   ├── ui/                       # Componentes UI (56 arquivos)
│   ├── admin-layout.tsx          # Layout do admin
│   ├── cart-footer.tsx           # Rodapé com carrinho
│   ├── homepage-carousel.tsx     # Carrossel de imagens
│   ├── social-footer.tsx         # Footer com redes sociais
│   ├── store-info-modal.tsx      # Modal de informações
│   └── theme-provider.tsx        # Provider de temas
│
├── hooks/                        # Custom Hooks
│   └── use-toast.ts              # Hook para toasts
│
├── lib/                          # Utilitários e configurações
│   ├── supabase.ts               # Cliente Supabase + Types
│   ├── auth-context.tsx          # Context de autenticação
│   ├── cart-context.tsx          # Context do carrinho
│   ├── config-context.tsx        # Context de configuração
│   ├── currency-utils.ts         # Formatação de moeda
│   └── utils.ts                  # Utilitários gerais
│
├── public/                       # Arquivos estáticos
│
├── scripts/                      # Scripts utilitários (17 arquivos)
│
├── docs/                         # Documentação (37 arquivos)
│
└── styles/                       # Estilos adicionais
```

### 2.2 Principais Componentes UI
- **Radix UI:** Accordion, Alert Dialog, Avatar, Badge, Button, Card, Carousel, Checkbox, Dialog, Dropdown Menu, Form, Input, Label, Popover, Radio Group, Select, Separator, Sheet, Slider, Switch, Tabs, Toast, Tooltip
- **Custom:** Admin Layout, Cart Footer, Homepage Carousel, Social Footer, Store Info Modal

---

## 3. Banco de Dados - Estrutura Completa

### 3.1 Informações do Projeto Supabase
- **Project ID:** cduyketpnybwwynsjyuq
- **Region:** sa-east-1 (São Paulo)
- **Status:** ACTIVE_HEALTHY
- **PostgreSQL Version:** 17.4.1.45
- **Organization ID:** olxqmobmocnbxeccmncy

### 3.2 Schemas
- **public:** Tabelas da aplicação (14 tabelas)
- **auth:** Sistema de autenticação Supabase

### 3.3 Tabelas do Schema Public

#### 3.3.1 pizzaria_config
**Descrição:** Configurações gerais da pizzaria (singleton)  
**Rows:** 1

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| id | uuid | NO | gen_random_uuid() | PK |
| nome | varchar | NO | - | Nome da pizzaria |
| foto_capa | text | YES | NULL | URL da foto de capa |
| foto_perfil | text | YES | NULL | URL do logo |
| endereco | text | YES | NULL | Endereço completo |
| telefone | varchar | YES | NULL | Telefone fixo |
| whatsapp | varchar | YES | NULL | Número WhatsApp |
| taxa_entrega | numeric | YES | NULL | Taxa de entrega |
| valor_minimo | numeric | YES | NULL | Valor mínimo do pedido |
| tempo_entrega_min | int4 | YES | NULL | Tempo mínimo (min) |
| tempo_entrega_max | int4 | YES | NULL | Tempo máximo (min) |
| aceita_dinheiro | bool | YES | true | Aceita dinheiro |
| aceita_cartao | bool | YES | true | Aceita cartão |
| aceita_pix | bool | YES | true | Aceita PIX |
| aceita_ticket_alimentacao | bool | YES | false | Aceita ticket |
| horario_funcionamento | jsonb | YES | NULL | Horários (JSON) |
| habilitar_broto | bool | YES | true | Habilita tamanho broto |
| habilitar_bordas_recheadas | bool | YES | true | Habilita bordas |
| descricao_pizzas | text | YES | NULL | Descrição geral |
| whatsapp_link | varchar | YES | NULL | Link WhatsApp |
| whatsapp_ativo | bool | YES | true | Exibir WhatsApp |
| instagram_link | varchar | YES | NULL | Link Instagram |
| instagram_ativo | bool | YES | false | Exibir Instagram |
| facebook_link | varchar | YES | NULL | Link Facebook |
| facebook_ativo | bool | YES | false | Exibir Facebook |
| maps_link | varchar | YES | NULL | Link Google Maps |
| maps_ativo | bool | YES | false | Exibir Maps |
| compartilhar_ativo | bool | YES | false | Habilitar compartilhar |
| created_at | timestamptz | YES | now() | Data criação |
| updated_at | timestamptz | YES | now() | Data atualização |

**RLS:** Habilitado  
**Policies:** Configuradas (leitura pública, escrita admin)

---

#### 3.3.2 categorias
**Descrição:** Categorias do cardápio  
**Rows:** 5

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| id | uuid | NO | gen_random_uuid() | PK |
| nome | varchar | NO | - | Nome da categoria |
| descricao | text | YES | NULL | Descrição |
| ordem | int4 | YES | 0 | Ordem de exibição |
| ativo | bool | YES | true | Status ativo/inativo |
| multi_sabores_habilitado | bool | YES | false | Permite múltiplos sabores |
| created_at | timestamptz | YES | now() | Data criação |

**RLS:** Habilitado  
**Policies:** Leitura pública, escrita admin  
**Indexes:** Por ordem e status ativo

---

#### 3.3.3 produtos
**Descrição:** Produtos do cardápio (pizzas, bebidas, adicionais)  
**Rows:** 61

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| id | uuid | NO | gen_random_uuid() | PK |
| categoria_id | uuid | YES | NULL | FK -> categorias |
| nome | varchar | NO | - | Nome do produto |
| descricao | text | YES | NULL | Descrição |
| preco_tradicional | numeric | YES | NULL | Preço tamanho tradicional |
| preco_broto | numeric | YES | NULL | Preço tamanho broto |
| preco_promocional_tradicional | numeric | YES | NULL | Preço promocional |
| preco_promocional_broto | numeric | YES | NULL | Preço promocional broto |
| tipo | varchar | YES | 'pizza' | Tipo (pizza/bebida/adicional) |
| ativo | bool | YES | true | Status |
| ordem | int4 | YES | 0 | Ordem de exibição |
| adicionais | jsonb | YES | NULL | Adicionais disponíveis |
| permite_multiplos_sabores | bool | YES | false | Permite divisão |
| promocao | bool | YES | false | Em promoção |
| created_at | timestamptz | YES | now() | Data criação |

**RLS:** Habilitado  
**Policies:** Leitura pública, escrita admin  
**Foreign Keys:** categoria_id -> categorias(id)

---

#### 3.3.4 pedidos
**Descrição:** Pedidos realizados  
**Rows:** 0

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| id | uuid | NO | gen_random_uuid() | PK |
| tipo_entrega | varchar | NO | - | delivery/retirada |
| endereco_entrega | text | YES | NULL | Endereço (se delivery) |
| forma_pagamento | varchar | YES | NULL | Forma de pagamento |
| subtotal | numeric | NO | - | Subtotal sem taxa |
| taxa_entrega | numeric | YES | NULL | Taxa aplicada |
| total | numeric | NO | - | Valor total |
| status | varchar | YES | 'pendente' | Status do pedido |
| observacoes | text | YES | NULL | Observações do cliente |
| enviado_whatsapp | bool | YES | false | Se foi enviado |
| created_at | timestamptz | YES | now() | Data criação |

**RLS:** Habilitado  
**Policies:** Usuário vê próprios pedidos, admin vê todos

---

#### 3.3.5 pedido_itens
**Descrição:** Itens dos pedidos  
**Rows:** 0

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| id | uuid | NO | gen_random_uuid() | PK |
| pedido_id | uuid | YES | NULL | FK -> pedidos |
| produto_id | uuid | YES | NULL | FK -> produtos |
| nome_produto | varchar | NO | - | Nome (snapshot) |
| tamanho | varchar | YES | NULL | tradicional/broto |
| sabores | jsonb | YES | NULL | Array de sabores |
| quantidade | int4 | NO | 1 | Quantidade |
| preco_unitario | numeric | NO | - | Preço unitário |
| preco_total | numeric | NO | - | Preço total |
| created_at | timestamptz | YES | now() | Data criação |

**RLS:** Habilitado  
**Foreign Keys:** 
- pedido_id -> pedidos(id)
- produto_id -> produtos(id)

---

#### 3.3.6 bordas_recheadas
**Descrição:** Opções de bordas recheadas  
**Rows:** 4

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| id | uuid | NO | gen_random_uuid() | PK |
| nome | varchar | NO | - | Nome da borda |
| preco | numeric | NO | - | Preço adicional |
| ativo | bool | YES | true | Status |
| ordem | int4 | YES | 0 | Ordem de exibição |
| created_at | timestamptz | YES | now() | Data criação |
| updated_at | timestamptz | YES | now() | Data atualização |

**RLS:** Habilitado  
**Policies:** Leitura pública, escrita admin

---

#### 3.3.7 opcoes_sabores
**Descrição:** Opções de quantidade de sabores  
**Rows:** 3

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| id | uuid | NO | gen_random_uuid() | PK |
| nome | varchar | NO | - | Nome da opção |
| maximo_sabores | int4 | NO | - | Máximo permitido |
| descricao | text | YES | NULL | Descrição |
| ordem | int4 | YES | 0 | Ordem de exibição |
| ativo | bool | YES | true | Status |
| created_at | timestamptz | YES | now() | Data criação |

**RLS:** Habilitado  
**Policies:** Leitura pública, escrita admin

---

#### 3.3.8 tamanhos_pizza
**Descrição:** Tamanhos de pizza disponíveis (usado no admin)  
**Rows:** 2

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| id | uuid | NO | gen_random_uuid() | PK |
| nome | varchar | NO | - | Nome do tamanho |
| descricao | text | YES | NULL | Descrição |
| fatias | int4 | NO | - | Número de fatias |
| ordem | int4 | YES | 0 | Ordem de exibição |
| ativo | bool | YES | true | Status |
| created_at | timestamptz | YES | now() | Data criação |

**RLS:** Habilitado  
**Observação:** Sem policies definidas (advisory de segurança)

---

#### 3.3.9 carousel_config
**Descrição:** Configuração do carrossel da homepage  
**Rows:** 1

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| id | uuid | NO | gen_random_uuid() | PK |
| ativo | bool | YES | true | Se carrossel está ativo |
| intervalo_segundos | int4 | YES | 5 | Intervalo entre slides |
| created_at | timestamptz | NO | now() | Data criação |
| updated_at | timestamptz | NO | now() | Data atualização |

**RLS:** Habilitado  
**Check Constraint:** intervalo_segundos BETWEEN 1 AND 30

---

#### 3.3.10 carousel_images
**Descrição:** Imagens do carrossel  
**Rows:** 3

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| id | uuid | NO | gen_random_uuid() | PK |
| url | text | NO | - | URL da imagem |
| ordem | int4 | YES | 1 | Ordem de exibição |
| ativo | bool | YES | true | Status |
| created_at | timestamptz | NO | now() | Data criação |
| updated_at | timestamptz | NO | now() | Data atualização |

**RLS:** Habilitado

---

#### 3.3.11 admins
**Descrição:** Usuários administradores  
**Rows:** 1

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| id | uuid | NO | gen_random_uuid() | PK |
| nome | varchar | NO | - | Nome do admin |
| email | varchar | NO | - | Email (único) |
| senha | varchar | NO | - | Hash da senha |
| ativo | bool | YES | true | Status |
| created_at | timestamptz | YES | now() | Data criação |
| updated_at | timestamptz | YES | now() | Data atualização |

**RLS:** Habilitado  
**Unique Constraint:** email  
**Policies:** Acesso restrito a admins autenticados

---

#### 3.3.12 mensagens_whatsapp
**Descrição:** Log de mensagens enviadas via WhatsApp  
**Rows:** 0

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| id | uuid | NO | gen_random_uuid() | PK |
| conteudo_mensagem | text | NO | - | Conteúdo da mensagem |
| numero_whatsapp | varchar | YES | NULL | Número destino |
| tipo_entrega | varchar | YES | NULL | Tipo de entrega |
| valor_total | numeric | YES | NULL | Valor do pedido |
| data_envio | timestamptz | YES | now() | Data/hora envio |
| status | varchar | YES | 'enviado' | Status |

**RLS:** Habilitado  
**Observação:** Sem policies definidas (advisory de segurança)

---

### 3.4 Funções do Banco de Dados

#### 3.4.1 verify_admin_password
**Descrição:** Verifica senha do administrador  
**Parâmetros:** 
- admin_email (text)
- password_input (text)
**Retorno:** boolean  
**Observação:** Advisory de segurança (search_path mutável)

#### 3.4.2 update_admin_credentials
**Descrição:** Atualiza credenciais do admin  
**Parâmetros:**
- admin_id (uuid)
- new_email (text)
- new_password (text)
**Retorno:** boolean  
**Observação:** Advisory de segurança (search_path mutável)

#### 3.4.3 update_updated_at_column
**Descrição:** Trigger para atualizar campo updated_at  
**Observação:** Advisory de segurança (search_path mutável)

---

### 3.5 Migrações Aplicadas

Total de migrações: **11**

1. **20250702084356** - fix_opcoes_sabores_rls_policies
2. **20250702084642** - fix_bordas_recheadas_rls_policies
3. **20250702115609** - add_global_bordas_config
4. **20250704012006** - fix_admin_rls_policies
5. **20250705103755** - create_carousel_table
6. **20250705112435** - fix_carousel_rls_policies
7. **20250706020129** - add_promotional_pricing_fields
8. **20250706020139** - add_promotional_pricing_constraints
9. **20250706111943** - add_descricao_pizzas_field
10. **20250706121212** - add_promocao_field_to_produtos
11. **20250710011557** - add_multi_flavor_categories

---

## 4. Advisories de Segurança

### 4.1 Avisos INFO
1. **Tabela mensagens_whatsapp:** RLS habilitado sem policies
2. **Tabela tamanhos_pizza:** RLS habilitado sem policies

### 4.2 Avisos WARN
1. **Funções com search_path mutável:**
   - update_updated_at_column
   - verify_admin_password
   - update_admin_credentials

2. **Proteção de senha vazada desabilitada:** Supabase Auth não está verificando senhas comprometidas via HaveIBeenPwned

3. **Versão PostgreSQL:** Existem patches de segurança disponíveis para 17.4.1.45

---

## 5. Fluxos da Aplicação

### 5.1 Fluxo do Cliente
1. Acessa página inicial (/)
2. Visualiza carrossel de imagens promocionais
3. Navega pelas categorias do cardápio
4. Adiciona produtos ao carrinho
5. Configura pizzas (tamanho, sabores, bordas)
6. Acessa checkout (/checkout)
7. Preenche dados de entrega/retirada
8. Escolhe forma de pagamento
9. Confirma pedido
10. Mensagem é enviada via WhatsApp

### 5.2 Fluxo do Administrador
1. Acessa /admin (requer autenticação)
2. Dashboard com visão geral
3. Gerencia categorias (CRUD)
4. Gerencia produtos (CRUD)
5. Configura pizzaria (dados, horários, taxas)
6. Visualiza e gerencia pedidos
7. Configura carrossel de imagens
8. Gerencia bordas e opções de sabores

---

## 6. Integrações Externas

### 6.1 WhatsApp Business
- **Tipo:** Link direto (wa.me)
- **Uso:** Envio de pedidos formatados
- **Formato:** Texto com detalhes do pedido

### 6.2 Redes Sociais (Opcionais)
- Instagram
- Facebook
- Google Maps
- Botão de compartilhamento

### 6.3 Supabase Services
- **Authentication:** Sistema de login admin
- **Database:** PostgreSQL
- **Storage:** Upload de imagens (produtos, carrossel)
- **Realtime:** Potencial para uso futuro

---

## 7. Variáveis de Ambiente

### 7.1 Obrigatórias
```env
NEXT_PUBLIC_SUPABASE_URL=https://cduyketpnybwwynsjyuq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<chave_anonima>
```

### 7.2 Configuração Atual
- Ambiente de produção esperado
- Verificação de variáveis implementada em lib/supabase.ts
- Fallback para modo mock se não configurado

---

## 8. Relacionamentos do Banco

```
pizzaria_config (1) [configuração global]

categorias (1) ----< (N) produtos
                         |
                         v
                    pedido_itens (N) >---- (1) pedidos

bordas_recheadas (N) [selecionáveis em pedido_itens.sabores]
opcoes_sabores (N) [selecionáveis em produtos multi-sabor]
tamanhos_pizza (N) [referência para admin]

carousel_config (1) [singleton]
carousel_images (N) [imagens do carrossel]

admins (N) [autenticação]
mensagens_whatsapp (N) [log de mensagens]
```

---

## 9. Observações de Segurança

### 9.1 Row Level Security (RLS)
- **Implementado:** Todas as tabelas têm RLS habilitado
- **Pendências:** 
  - mensagens_whatsapp sem policies
  - tamanhos_pizza sem policies

### 9.2 Autenticação
- Sistema customizado usando tabela admins
- Senhas devem ser hashadas (bcrypt recomendado)
- Proteção contra senhas vazadas desabilitada

### 9.3 Validações
- Constraints em campos críticos
- Check constraints em rangos numéricos
- Foreign keys garantindo integridade referencial

---

## 10. Pontos de Atenção para Migração

### 10.1 Dados Críticos
- **pizzaria_config:** Configuração única (1 registro)
- **categorias:** 5 categorias ativas
- **produtos:** 61 produtos cadastrados
- **admins:** 1 usuário administrador
- **bordas_recheadas:** 4 opções
- **opcoes_sabores:** 3 opções
- **carousel_images:** 3 imagens
- **carousel_config:** 1 configuração

### 10.2 Dependências
- Imagens armazenadas (URLs em produtos, carousel_images, pizzaria_config)
- Ordem de migração deve respeitar foreign keys
- JSON fields precisam preservar estrutura

### 10.3 Functions e Triggers
- 3 functions personalizadas precisam ser recriadas
- Triggers de updated_at devem ser replicados
- RLS policies devem ser recriadas

---

## 11. Roadmap de Melhorias Identificadas

### 11.1 Segurança
- [ ] Adicionar policies RLS faltantes
- [ ] Corrigir search_path das functions
- [ ] Habilitar proteção de senha vazada
- [ ] Atualizar PostgreSQL para versão com patches

### 11.2 Performance
- [ ] Adicionar índices em campos frequentemente consultados
- [ ] Otimizar queries N+1 (produtos + categorias)
- [ ] Implementar cache de configurações

### 11.3 Features
- [ ] Implementar Realtime para pedidos
- [ ] Sistema de notificações
- [ ] Relatórios e analytics
- [ ] Sistema de cupons de desconto

---

## 12. Contatos e Recursos

- **Projeto:** cardapiodigitalv3
- **Region:** sa-east-1 (São Paulo, Brasil)
- **Database Host:** db.cduyketpnybwwynsjyuq.supabase.co
- **Documentação:** /docs (37 arquivos)
- **Scripts Utilitários:** /scripts (17 arquivos)

---

**Documento gerado automaticamente via reconhecimento completo da aplicação.**
