### 🎯 OBJETIVO GERAL

Expandir o sistema existente para uma plataforma completa de gestão de pizzarias, no estilo **iFood + PDV**, adicionando os seguintes módulos e funcionalidades:

1. **Cadastro e gerenciamento de clientes**
2. **Gestão de motoboys e entregas**
3. **Cálculo de taxa de entrega por CEP e geolocalização (Jacareí - SP)**
4. **Controle de pedidos (com Kanban de status) e impressão para cozinha**
5. **Área de PDV (ponto de venda presencial) com impressão para cozinha**
6. **Sistema de abertura/fechamento de caixa com relatórios**
7. **Controle de estoque e gerenciamento de produtos**

---

### 🗄️ BANCO DE DADOS — NOVAS TABELAS (executar via MCP do Supabase)

```sql
-- CLIENTES
create table if not exists clientes (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  telefone text not null,
  endereco text,
  referencia text,
  cep text,
  criado_em timestamp default now()
);

-- MOTOBOYS
create table if not exists motoboys (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  telefone text,
  status text default 'disponivel' check (status in ('disponivel', 'em_entrega', 'inativo')),
  criado_em timestamp default now()
);

-- ENTREGAS
create table if not exists entregas (
  id uuid primary key default uuid_generate_v4(),
  pedido_id uuid references pedidos(id),
  motoboy_id uuid references motoboys(id),
  status text default 'pendente' check (status in ('pendente', 'em_rota', 'entregue', 'cancelada')),
  horario_saida timestamp,
  horario_entrega timestamp
);

-- ÁREAS DE ENTREGA / TAXAS
create table if not exists taxas_entrega (
  id uuid primary key default uuid_generate_v4(),
  bairro text not null,
  cep_inicial text,
  cep_final text,
  taxa numeric(10,2),
  ativo boolean default true
);

-- CAIXA / PDV
create table if not exists caixa (
  id uuid primary key default uuid_generate_v4(),
  data_abertura timestamp default now(),
  data_fechamento timestamp,
  valor_abertura numeric(10,2),
  valor_fechamento numeric(10,2),
  status text default 'aberto' check (status in ('aberto','fechado'))
);

-- LANÇAMENTOS DE CAIXA
create table if not exists lancamentos_caixa (
  id uuid primary key default uuid_generate_v4(),
  caixa_id uuid references caixa(id),
  tipo text check (tipo in ('entrada','saida')),
  descricao text,
  valor numeric(10,2),
  criado_em timestamp default now()
);

-- ESTOQUE
create table if not exists estoque (
  id uuid primary key default uuid_generate_v4(),
  produto_id uuid references produtos(id),
  quantidade integer default 0,
  atualizado_em timestamp default now()
);
```

---

### 🧱 NOVOS MÓDULOS (FRONTEND)

#### 🧍 Módulo: **Clientes**

* Caminho: `/admin/clientes`
* Funcionalidades:

  * Listagem de clientes (nome, telefone, endereço, data de cadastro)
  * Busca e filtro por nome/telefone
  * Formulário de cadastro/edição
  * Histórico de pedidos vinculados

#### 🛵 Módulo: **Motoboys / Entregas**

* Caminho: `/admin/entregas`
* Exibe pedidos com status (`pendente`, `em_rota`, `entregue`)
* Botão para “atribuir motoboy”
* Campo de filtro por status
* Atualização de status em tempo real (via Supabase Realtime)

#### 💰 Módulo: **Caixa / Financeiro**

* Caminho: `/admin/caixa`
* Funcionalidades:

  * Abertura e fechamento de caixa
  * Registro de entradas e saídas
  * Relatórios de movimentação diária
  * Resumo financeiro com total de vendas e taxa de entrega

#### 🧾 Módulo: **PDV (Ponto de Venda)**

* Caminho: `/admin/pdv`
* Tela simplificada para o atendente:

  * Exibe cardápio completo
  * Adiciona produtos ao pedido
  * Seleciona forma de pagamento
  * Finaliza pedido com opção “imprimir para cozinha”
  * Integração direta com tabela `pedidos` e `pedido_itens`

#### 📦 Módulo: **Estoque**

* Caminho: `/admin/estoque`
* Exibe lista de produtos e quantidades disponíveis
* Atualização automática ao registrar pedidos no PDV
* Permitir ajustes manuais e histórico de movimentações

#### 🚚 Módulo: **Taxas de Entrega**

* Caminho: `/admin/taxas`
* CRUD de bairros e CEPs com valor de taxa
* Quando o cliente insere o CEP no checkout:

  * Se o CEP estiver dentro de uma faixa → aplica taxa
  * Se não houver entrega → mostra alerta "não atendemos essa região"

---

### ⚙️ FLUXOS AUTOMATIZADOS

#### 🧩 Pedidos

* Cada pedido pode ser vinculado a um `cliente_id`.
* Se for entrega → gera registro em `entregas`.
* Status do pedido atualizado automaticamente (Kanban: *recebido → preparo → saída → entregue*).

#### 🛵 Entregas

* Mudança de status atualiza painel em tempo real via Supabase Realtime.
* Quando “entregue”, fecha o pedido e registra a data de entrega.

#### 💵 Caixa

* Ao abrir o caixa → cria registro com status `aberto`.
* Ao fechar → status `fechado` e calcula o total de vendas.
* Relatórios somam `pedidos` + `taxas_entrega` + `lancamentos_caixa`.

#### 📦 Estoque

* Ao criar pedido → diminui quantidade de produtos.
* Ao cancelar pedido → devolve quantidade ao estoque.

---

### 📈 RELATÓRIOS

* Relatórios diários e mensais no painel `/admin/relatorios`.
* Mostrar:

  * Total de pedidos
  * Vendas por forma de pagamento
  * Custos e saídas do caixa
  * Entregas realizadas e taxas aplicadas
* Exportação em PDF ou CSV.

---

### 💬 Observações Finais

* Todos os módulos devem seguir o design atual (vermelho + fundo branco, padrão do painel admin).
* Utilize componentes já existentes (botões, tabelas, inputs).
* A navegação deve ser integrada ao menu lateral do painel admin.
* Todos os dados devem ser persistidos no Supabase.
* O sistema deve continuar funcional para o cliente final em **[https://cardapiodigital.williamdiskpizza.com.br](https://cardapiodigital.williamdiskpizza.com.br)**.

---

### 🚫 IMPORTANTE

> **NÃO ALTERE QUALQUER FUNCIONALIDADE/INTERFACE/FLUXO EXISTENTE**
> que não esteja diretamente relacionado às novas funcionalidades descritas acima.

---

Quer que eu te gere agora **os prompts individuais por módulo** (Clientes, Motoboys, PDV, Caixa, Estoque, Entregas e Relatórios) para usar separadamente dentro do WindSurf — prontos para colar e executar?
Assim você vai aplicando em blocos sem sobrecarregar o agente.