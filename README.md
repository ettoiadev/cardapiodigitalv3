# Cardápio Digital - Sistema de Delivery para Pizzarias

Uma aplicação completa para pizzarias gerenciarem seus cardápios digitais, pedidos online e entregas. Desenvolvida com tecnologias modernas para oferecer uma experiência fluida tanto para clientes quanto para administradores.

## 🚀 Características Principais

### Para Clientes
- **Cardápio Interativo**: Navegação intuitiva por categorias de produtos
- **Tamanhos e Preços**: Suporte a diferentes tamanhos (tradicional, broto) e preços promocionais
- **Carrinho de Compras**: Interface moderna para gerenciar pedidos
- **Múltiplas Formas de Pagamento**: Dinheiro e cartão
- **Pedidos por WhatsApp**: Integração automática para envio de pedidos
- **Cálculo Automático**: Taxa de entrega e valor mínimo configuráveis

### Para Administradores
- **Painel Administrativo**: Gestão completa do cardápio e configurações
- **Gerenciamento de Produtos**: CRUD completo para pizzas, bebidas e adicionais
- **Controle de Categorias**: Organização personalizada do menu
- **Configurações da Pizzaria**: Horários, taxas, formas de pagamento
- **Acompanhamento de Pedidos**: Status e histórico de pedidos

## 🛠️ Tecnologias Utilizadas

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Radix UI
- **Backend**: Supabase (PostgreSQL)
- **Autenticação**: Sistema integrado com Supabase Auth
- **Estado**: Context API com React Hooks
- **Formulários**: React Hook Form com Zod
- **Deploy**: Vercel (otimizado para Next.js)

## 🗄️ Estrutura do Banco de Dados

O sistema utiliza as seguintes tabelas principais:

### `pizzaria_config`
Configurações gerais da pizzaria:
- Nome, fotos, endereço e contato
- Taxa de entrega e valor mínimo
- Horários de funcionamento
- Formas de pagamento aceitas

### `categorias`
Categorias do cardápio:
- Nome e descrição
- Ordem de exibição
- Status ativo/inativo

### `produtos`
Produtos do cardápio:
- Nome, descrição e categoria
- Preços (tradicional, broto, promocional)
- Tipo e status do produto
- Ordem de exibição

### `pedidos`
Controle de pedidos:
- Dados do cliente e entrega
- Forma de pagamento
- Valores (subtotal, taxa, total)
- Status do pedido
- Integração com WhatsApp

### `pedido_itens`
Itens individuais do pedido:
- Produto e quantidade
- Tamanhos e sabores
- Valores unitários e totais

## ⚙️ Configuração e Instalação

### Pré-requisitos

- Node.js 18+
- npm, yarn ou pnpm
- Conta no [Supabase](https://supabase.com)

### Passo a Passo

1. **Clone o repositório**
   ```bash
   git clone <repository-url>
   cd cardapiodigitalv3
   ```

2. **Instale as dependências**
   ```bash
   npm install
   # ou
   yarn install
   # ou
   pnpm install
   ```

3. **Configure o Supabase**

   Para configuração detalhada do banco de dados, consulte a documentação em `/docs/CONFIGURACAO_SUPABASE.md`. Você encontrará:

   - Scripts SQL para criação das tabelas
   - Configuração inicial do usuário administrador
   - Migrações necessárias

   Como alternativa, configure as tabelas manualmente conforme o schema detalhado na seção "Estrutura do Banco de Dados" acima.

   **Nota**: A pasta `/docs/` contém documentação completa de todas as funcionalidades implementadas, incluindo correções, melhorias e guias de configuração.

4. **Configure as variáveis de ambiente**

   Crie um arquivo `.env.local` na raiz do projeto:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=sua-url-do-supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima-do-supabase
   ```

5. **Execute o projeto em desenvolvimento**
   ```bash
   npm run dev
   # ou
   yarn dev
   # ou
   pnpm dev
   ```

6. **Acesse a aplicação**

   - Aplicação principal: `http://localhost:3000`
   - Painel administrativo: `http://localhost:3000/admin`

## 🔐 Variáveis de Ambiente

| Variável | Descrição | Obrigatório |
|----------|-----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anônima do Supabase | ✅ |

## 📁 Estrutura do Projeto

```
cardapiodigitalv3/
├── app/                    # Páginas da aplicação Next.js
│   ├── admin/             # Painel administrativo
│   ├── checkout/          # Processo de finalização
│   ├── globals.css        # Estilos globais
│   ├── layout.tsx         # Layout principal
│   └── page.tsx           # Página inicial
├── components/            # Componentes reutilizáveis
├── lib/                   # Utilitários e configurações
│   ├── supabase.ts       # Cliente Supabase
│   ├── cart-context.tsx  # Contexto do carrinho
│   └── config-context.tsx # Contexto de configuração
├── hooks/                 # Hooks personalizados
├── public/               # Arquivos estáticos
└── styles/               # Estilos adicionais
```

## 🚀 Deploy

A aplicação está configurada para deploy automático no Vercel:

1. Conecte seu repositório ao [Vercel](https://vercel.com)
2. Configure as variáveis de ambiente no painel do Vercel
3. O deploy será automático a cada push na branch principal

## 🔧 Desenvolvimento

### Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Gera a build de produção
- `npm run start` - Inicia o servidor de produção
- `npm run lint` - Executa o linter

### Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto é desenvolvido para uso comercial em pizzarias e estabelecimentos similares.

## 🆘 Suporte

Para suporte técnico ou dúvidas sobre implementação, entre em contato através dos canais oficiais da pizzaria.

---

*Projeto desenvolvido com ❤️ para transformar a experiência de delivery de pizzarias.*
