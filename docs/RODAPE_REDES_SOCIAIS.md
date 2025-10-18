# Implementação do Rodapé com Redes Sociais

## Resumo da Implementação

Foi implementado um rodapé fixo na página inicial do cardápio que exibe ícones de redes sociais de forma dinâmica e gerenciável via painel administrativo.

## Funcionalidades Implementadas

### 1. Componente SocialFooter (`components/social-footer.tsx`)

- **Posicionamento**: Rodapé sticky que fica sempre na parte inferior da tela
- **Responsivo**: Ajusta-se automaticamente quando há itens no carrinho
- **Ícones incluídos**:
  - WhatsApp (MessageCircle)
  - Instagram (Instagram)
  - Facebook (Facebook)
  - Google Maps (MapPin)
  - Compartilhar (Share2)

#### Características Visuais
- Cores harmônicas com o layout existente
- Hover effects suaves com scale e mudança de cor
- Espaçamento confortável entre ícones
- Transições suaves de 200ms
- z-index 40 para não conflitar com outros componentes

### 2. Gestão Administrativa (`app/admin/config/page.tsx`)

#### Nova Seção: "Redes Sociais do Rodapé"
Localizada dentro da seção "Informações Básicas", permite:

- **Ativar/Desativar** cada ícone individualmente
- **Configurar links** para cada rede social
- **Interface intuitiva** com checkboxes e campos de texto condicionais
- **Validação visual** - campos de link só aparecem quando o ícone está ativado

#### Campos Adicionados:
- `whatsapp_ativo` (boolean) - Padrão: true
- `whatsapp_link` (text) - Link do WhatsApp
- `instagram_ativo` (boolean) - Padrão: false
- `instagram_link` (text) - Link do Instagram
- `facebook_ativo` (boolean) - Padrão: false
- `facebook_link` (text) - Link do Facebook
- `maps_ativo` (boolean) - Padrão: false
- `maps_link` (text) - Link do Google Maps
- `compartilhar_ativo` (boolean) - Padrão: true

### 3. Integração na Página Principal (`app/page.tsx`)

- Rodapé adicionado antes do CartFooter
- Passa informação sobre presença de itens no carrinho
- Não interfere com funcionalidades existentes

### 4. Funcionalidade de Compartilhamento

- **Web Share API**: Usa API nativa quando disponível
- **Fallback**: Copia link para área de transferência
- **Configurável**: Pode ser desativado via admin

## Estrutura do Banco de Dados

### Script SQL: `scripts/13-add-social-footer-fields.sql`

```sql
-- Adicionar colunas para links das redes sociais
ALTER TABLE pizzaria_config 
ADD COLUMN IF NOT EXISTS whatsapp_ativo boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS whatsapp_link text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS instagram_ativo boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS instagram_link text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS facebook_ativo boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS facebook_link text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS maps_ativo boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS maps_link text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS compartilhar_ativo boolean DEFAULT true;
```

## Comportamento e Lógica

### Exibição Condicional
- Apenas ícones **ativados** e com **links preenchidos** são exibidos
- Se nenhum ícone estiver ativo, o rodapé não é renderizado
- Compartilhar não precisa de link (funcionalidade interna)

### Posicionamento Inteligente
- **Sem itens no carrinho**: Rodapé fica no final da página
- **Com itens no carrinho**: Rodapé fica acima do CartFooter
- Usa `margin-bottom` dinâmico para não sobrepor componentes

### Responsividade
- Mantém espaçamento adequado em todas as telas
- Ícones com tamanho proporcional (24x24px)
- Padding responsivo para touch devices

## Exemplos de Links

### WhatsApp
```
https://wa.me/5511999887766
```

### Instagram
```
https://instagram.com/suapizzaria
```

### Facebook
```
https://facebook.com/suapizzaria
```

### Google Maps
```
https://maps.google.com/maps?q=Pizzaria+Nome,+Endereço
```

## Segurança

- Links abrem em nova aba (`_blank`)
- Atributos de segurança: `noopener,noreferrer`
- Validação de entrada no frontend
- Campos opcionais no banco de dados

## Estados de Carregamento

- Loading state durante busca das configurações
- Graceful fallback se Supabase não estiver disponível
- Não renderiza se não há configurações carregadas

## Compatibilidade

- **Web Share API**: Suportada em navegadores modernos
- **Fallback**: Clipboard API para navegadores sem Web Share
- **Acessibilidade**: Labels e titles para screen readers
- **Touch devices**: Áreas de toque adequadas

## Manutenção

### Para adicionar nova rede social:
1. Adicionar campos no banco (`rede_ativo`, `rede_link`)
2. Atualizar interface `PizzariaConfig`
3. Adicionar campos na função `loadConfig`
4. Incluir na seção admin
5. Adicionar ao array `socialItems` no componente

### Para modificar cores:
- Editar classes `color` no array `socialItems`
- Manter padrão: `text-[cor]-600 hover:text-[cor]-700`

## Observações Técnicas

- **Performance**: Componente otimizado com lazy loading
- **Bundle size**: Ícones tree-shaken do Lucide React
- **CSS**: Classes Tailwind para consistência visual
- **TypeScript**: Tipagem completa para todas as interfaces

## Status da Implementação

✅ **Concluído**:
- Componente SocialFooter funcional
- Interface administrativa completa
- Integração na página principal
- Script SQL preparado
- Documentação completa

⏳ **Pendente**:
- Execução do script SQL no banco de dados
- Teste em ambiente de produção 