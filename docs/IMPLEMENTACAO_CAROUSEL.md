# Implementação do Carousel na Homepage

## Resumo da Implementação

Foi implementado um sistema completo de carousel responsivo na homepage do cardápio digital, posicionado acima da seção de pizzas, com painel de gerenciamento completo no admin.

## Estrutura do Banco de Dados

### Tabelas Criadas

1. **`carousel_config`** - Configurações gerais do carousel
   - `id`: UUID (chave primária)
   - `ativo`: BOOLEAN (ativa/desativa o carousel)
   - `intervalo_segundos`: INTEGER (tempo entre transições, 1-30 segundos)
   - `created_at` e `updated_at`: timestamps

2. **`carousel_images`** - Imagens do carousel
   - `id`: UUID (chave primária)
   - `url`: TEXT (URL da imagem no Supabase Storage)
   - `ordem`: INTEGER (ordem de exibição)
   - `ativo`: BOOLEAN (ativa/desativa imagem específica)
   - `created_at` e `updated_at`: timestamps

### Políticas RLS (Row Level Security)

- **Leitura pública**: Qualquer usuário pode visualizar as configurações e imagens ativas
- **Administração**: Apenas admins autenticados podem gerenciar o carousel

## Componentes Criados

### 1. `HomepageCarousel` (`components/homepage-carousel.tsx`)

**Funcionalidades:**
- Exibição com tamanho fixo de 1200x320 pixels
- Transição automática baseada no intervalo configurado
- Controles de navegação manual (setas laterais)
- Indicadores de posição (pontos na parte inferior)
- Suporte a múltiplas imagens com fade transition
- Não renderiza se estiver desativado ou sem imagens

**Características técnicas:**
- Componente client-side com hooks React
- Carregamento otimizado com `priority` para primeira imagem
- Tamanho fixo responsivo com dimensões específicas
- Bordas arredondadas e sombra sutil
- Dimensões: 1200x320px (proporção 15:4)

## Painel Administrativo

### Localização
- **Arquivo**: `app/admin/config/page.tsx`
- **Seção**: "Carousel da Homepage" (após seção de Imagens)

### Funcionalidades Implementadas

#### 1. **Configurações Gerais**
- Toggle para ativar/desativar carousel
- Campo numérico para intervalo de transição (1-30 segundos)
- Botão para salvar configurações

#### 2. **Gerenciamento de Imagens**
- Upload múltiplo de imagens (máximo 10)
- Redimensionamento automático para 1200x320px
- Preview das imagens com status visual
- Controles de ordem (subir/descer)
- Toggle individual para ativar/desativar imagens
- Exclusão de imagens (remove do storage e banco)

#### 3. **Interface do Admin**
- Contador de imagens (X/10)
- Área de drag-and-drop para upload
- Lista organizada com previews
- Indicadores visuais de status (ativo/inativo)
- Mensagens de feedback para todas as operações

## Posicionamento na Homepage

### Localização Exata
- **Posição**: Acima da seção "Pizzas"
- **Container**: Dentro do `<div className="px-4 py-4 space-y-4">`
- **Espaçamento**: Mantém o `space-y-4` existente para consistência

### Integração Visual
- Largura: 100% do container (igual à seção de pizzas)
- Bordas arredondadas (`rounded-lg`)
- Sombra sutil (`shadow-sm`)
- Fundo cinza claro durante carregamento

## Funcionalidades Técnicas

### 1. **Otimização de Imagens**
- Redimensionamento automático no upload
- Compressão JPEG com qualidade 0.9
- Armazenamento no Supabase Storage (pasta 'carousel')

### 2. **Controles de Navegação**
- Setas laterais (apenas se houver mais de 1 imagem)
- Indicadores de posição clicáveis
- Transição suave entre imagens (500ms)

### 3. **Responsividade**
- Tamanho fixo 1200x320px
- Adaptação proporcional para dispositivos móveis
- Controles proporcionais ao tamanho da tela

### 4. **Performance**
- Carregamento lazy para imagens não prioritárias
- Cleanup automático de intervalos
- Otimização de re-renders

## Fluxo de Uso

### Para Administradores:
1. Acesse Admin → Configurações
2. Role até "Carousel da Homepage"
3. Configure intervalo e ative o carousel
4. Faça upload de até 10 imagens
5. Organize a ordem e ative/desative conforme necessário
6. Salve as configurações

### Para Usuários:
1. Acesse a homepage
2. O carousel aparece automaticamente acima das pizzas
3. Navegação automática ou manual disponível
4. Experiência responsiva em todos os dispositivos

## Considerações de Segurança

- RLS habilitado em todas as tabelas
- Validação de tipos de arquivo no upload
- Sanitização de nomes de arquivo
- Controle de acesso baseado em autenticação admin
- Limite de 10 imagens por questões de performance

## Notas Técnicas

- **Não invasivo**: Preserva toda funcionalidade existente
- **Condicional**: Só renderiza se ativo e com imagens
- **Otimizado**: Redimensionamento automático e compressão
- **Flexível**: Configurações ajustáveis via painel admin
- **Responsivo**: Adapta-se a diferentes tamanhos de tela

## Status da Implementação

✅ **Concluído**: Sistema completo e funcional
✅ **Testado**: Build bem-sucedido sem erros
✅ **Documentado**: Implementação documentada
✅ **Integrado**: Não altera funcionalidades existentes 