# Sistema de Upload de Imagens - Cardápio Digital

## Funcionalidade Implementada

O sistema de upload de imagens foi implementado na seção "Imagens da Pizzaria" em `/admin/config`, substituindo os campos de URL por uma interface moderna de upload com processamento automático.

## Características

### 📸 **Upload com Recorte Automático**
- **Foto de Capa**: Redimensionada automaticamente para 1200x675px (proporção 16:9)
- **Foto de Perfil**: Redimensionada automaticamente para 300x300px (proporção 1:1)
- Aceita qualquer tamanho ou proporção de imagem original
- Processamento client-side usando Canvas API

### 🎨 **Interface de Usuário**
- Área de drop zone com design moderno
- Preview das imagens atuais
- Indicadores de carregamento durante o upload
- Feedback visual claro sobre o progresso
- Textos informativos com recomendações de tamanho

### 🔧 **Aspectos Técnicos**
- Upload direto para Supabase Storage
- Bucket `images` com políticas de acesso configuradas
- Compressão JPEG com qualidade 90%
- Limite de 5MB por arquivo
- Suporte a formatos: PNG, JPG, WebP, GIF

## Arquivos Modificados

### `app/admin/config/page.tsx`
- Adicionados imports para componentes de upload
- Implementadas funções de redimensionamento e upload
- Substituída seção de URLs por interface de upload
- Estados de controle para loading de cada imagem

### `scripts/09-setup-storage.sql`
- Script para configuração do bucket de imagens
- Políticas de acesso para upload, visualização e gerenciamento

## Como Usar

1. **Acesse Admin → Configurações**
2. **Role até "Imagens da Pizzaria"**
3. **Clique na área de upload desejada**
4. **Selecione uma imagem do seu dispositivo**
5. **Aguarde o processamento automático**
6. **Salve as configurações**

## Recomendações de Imagem

### Foto de Capa
- **Finalidade**: Imagem principal exibida no topo do cardápio
- **Tamanho ideal**: 1200x675px
- **Proporção**: 16:9 (paisagem)
- **Conteúdo sugerido**: Ambiente da pizzaria, pizzas em destaque

### Foto de Perfil
- **Finalidade**: Logo ou imagem de perfil da pizzaria
- **Tamanho ideal**: 300x300px
- **Proporção**: 1:1 (quadrada)
- **Conteúdo sugerido**: Logo da marca, símbolo da pizzaria

## Tecnologias Utilizadas

- **Canvas API**: Para redimensionamento client-side
- **Supabase Storage**: Para armazenamento das imagens
- **TypeScript**: Para tipagem segura
- **React Hooks**: Para gerenciamento de estado
- **Tailwind CSS**: Para estilização moderna

## Benefícios

✅ **Facilidade de uso**: Interface intuitiva sem necessidade de URLs externas
✅ **Otimização automática**: Redimensionamento para tamanhos ideais
✅ **Performance**: Compressão automática das imagens
✅ **Confiabilidade**: Armazenamento seguro no Supabase
✅ **Responsividade**: Interface adaptável a diferentes telas
✅ **Feedback visual**: Indicadores claros de progresso e status

## Tratamento de Erros

- Validação de tipos de arquivo
- Limite de tamanho de arquivo
- Fallback para criação automática do bucket
- Mensagens de erro claras para o usuário
- Limpeza automática de inputs após upload 