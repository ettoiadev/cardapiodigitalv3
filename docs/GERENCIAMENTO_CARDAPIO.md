# Sistema de Gerenciamento de Cardápio

Este documento explica como usar o novo sistema de gerenciamento de itens de cardápio.

## 📋 Funcionalidades Implementadas

### 1. Página de Gerenciamento
- **Local**: `/admin/produtos/cardapio`
- **Acesso**: Menu admin → Produtos → Gerenciar Itens de Cardápio
- **Três abas principais**:
  - Categorias
  - Tamanhos de Pizza  
  - Opções de Sabores

### 2. Seção Categorias
- Gerenciar categorias de produtos (Pizzas, Bebidas, Sobremesas, etc.)
- Campos: Nome, Descrição, Ordem, Status (Ativo/Inativo)
- CRUD completo (Criar, Ler, Atualizar, Deletar)
- Impacto imediato no cardápio público

### 3. Seção Tamanhos de Pizza  
- Gerenciar tamanhos disponíveis (Tradicional, Broto, etc.)
- Campos: Nome, Quantidade de Fatias, Descrição, Ordem, Status
- Integração com sistema de preços
- Configuração flexível de novos tamanhos

### 4. Seção Opções de Sabores
- Configurar opções de frações (1, 2, 3+ sabores)
- Campos: Nome, Máximo de Sabores, Descrição, Ordem, Status
- Controle dinâmico da interface de seleção
- Limitação automática de seleções no front-end

## 🚀 Como Usar

### Configuração Inicial do Banco de Dados

1. Execute o script SQL no seu banco Supabase:
```sql
-- Copie e execute o conteúdo do arquivo: scripts/03-cardapio-management.sql
```

2. Verifique se as tabelas foram criadas:
- `tamanhos_pizza`
- `opcoes_sabores`

### Acessando o Painel

1. Faça login no admin: `/admin/login`
2. Navegue para: `/admin/produtos/cardapio`
3. Use as três abas para gerenciar cada seção

### Gerenciando Categorias

- **Adicionar**: Clique em "Nova Categoria"
- **Editar**: Clique no ícone de lápis no card da categoria
- **Excluir**: Clique no ícone de lixeira
- **Ordem**: Define a sequência de exibição no cardápio

### Gerenciando Tamanhos

- Configure tamanhos personalizados (ex: "Gigante" com 12 fatias)
- Defina descrições específicas para cada tamanho
- Control ordem de exibição
- Desative tamanhos temporariamente

### Gerenciando Opções de Sabores

- **1 Sabor**: Pizza inteira de um sabor
- **2 Sabores**: Pizza dividida meio a meio
- **3 Sabores**: Pizza dividida em três partes
- **4+ Sabores**: Suporte para mais divisões
- Controle dinâmico dos ícones na interface

## 🔧 Integração com o Sistema

### Front-End Público
- Interface atualizada automaticamente com as configurações
- Botões de seleção gerados dinamicamente
- Ícones visuais adaptados ao número de sabores
- Limitação de seleção baseada nas configurações

### Sistema de Pedidos
- Integração total com carrinho existente
- Cálculo automático de preços (maior valor entre sabores)
- Nomenclatura automática (ex: "Pizza Margherita + Pepperoni")
- Preservação do fluxo de checkout

### Banco de Dados
- Novos campos mantêm compatibilidade
- Sistema de fallback para dados mock
- Tratamento de erros robusto
- Migração incremental

## 📊 Estrutura das Tabelas

### tamanhos_pizza
```sql
- id (UUID)
- nome (VARCHAR(50))
- fatias (INTEGER)
- descricao (TEXT)
- ordem (INTEGER)
- ativo (BOOLEAN)
- created_at (TIMESTAMP)
```

### opcoes_sabores
```sql
- id (UUID)
- nome (VARCHAR(50))
- maximo_sabores (INTEGER)
- descricao (TEXT)
- ordem (INTEGER)
- ativo (BOOLEAN)
- created_at (TIMESTAMP)
```

## 🎯 Benefícios

1. **Flexibilidade Total**: Customize qualquer aspecto do cardápio
2. **Interface Dinâmica**: Front-end se adapta automaticamente
3. **Controle Granular**: Ative/desative recursos individualmente
4. **Experiência Consistente**: Integração perfeita com fluxo existente
5. **Escalabilidade**: Suporte para crescimento e novas funcionalidades

## 🚨 Notas Importantes

- Sempre teste mudanças em ambiente de desenvolvimento primeiro
- Backup do banco antes de modificações estruturais
- Opções desativadas não aparecem no front-end
- Ordem das opções afeta a sequência de exibição
- Sistema mantém compatibilidade com dados existentes

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique os logs do console no navegador
2. Confirme se as tabelas foram criadas corretamente
3. Teste as funcionalidades em ambiente controlado
4. Documente qualquer comportamento inesperado 