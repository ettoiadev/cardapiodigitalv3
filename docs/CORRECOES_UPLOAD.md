# Correções no Sistema de Upload de Imagens

## Problema Identificado

O erro `TypeError: Cannot read properties of undefined (reading 'replace')` ocorria porque:

1. **Tipo de arquivo incorreto**: Após o redimensionamento, a função `resizeImage()` retorna um `Blob`, não um `File`
2. **Ausência da propriedade `name`**: O `Blob` não possui a propriedade `name`, causando erro ao tentar acessar `file.name.replace()`
3. **Falta de validações**: Não havia verificações adequadas antes de manipular propriedades do arquivo

## Correções Implementadas

### 1. **Correção da Função `uploadImage`**

**Antes:**
```typescript
const uploadImage = async (file: File, folder: string): Promise<string> => {
  const fileName = `${folder}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`
  // ... resto do código
}
```

**Depois:**
```typescript
const uploadImage = async (file: File | Blob, folder: string, originalFileName?: string): Promise<string> => {
  // Verificar se temos um nome de arquivo válido
  let baseName = 'image'
  if (file instanceof File && file.name) {
    baseName = file.name.replace(/[^a-zA-Z0-9.-]/g, '')
  } else if (originalFileName) {
    baseName = originalFileName.replace(/[^a-zA-Z0-9.-]/g, '')
  }
  
  // Garantir que temos uma extensão
  if (!baseName.includes('.')) {
    baseName += '.jpg'
  }
  
  const fileName = `${folder}/${Date.now()}-${baseName}`
  // ... resto do código
}
```

### 2. **Validações de Arquivo Adicionadas**

```typescript
// Validar arquivo
if (!file.name) {
  setMessage("Falha ao carregar imagem. Arquivo inválido.")
  return
}

// Validar tipo de arquivo
if (!file.type.startsWith('image/')) {
  setMessage("Falha ao carregar imagem. Verifique o formato e tente novamente.")
  return
}

// Validar tamanho (5MB)
if (file.size > 5242880) {
  setMessage("Falha ao carregar imagem. Arquivo muito grande (máximo 5MB).")
  return
}
```

### 3. **Mensagens de Erro Melhoradas**

**Antes:**
```typescript
setMessage("Erro ao carregar foto de capa")
```

**Depois:**
```typescript
setMessage("Falha ao carregar imagem. Verifique o formato e tente novamente.")
```

### 4. **Passagem do Nome Original**

```typescript
// Nas funções de upload
const url = await uploadImage(resizedFile, 'capas', file.name)
const url = await uploadImage(resizedFile, 'perfis', file.name)
```

## Melhorias de Segurança

### **Validação de Tipo de Arquivo**
- Verifica se o arquivo é realmente uma imagem usando `file.type.startsWith('image/')`
- Previne upload de arquivos maliciosos

### **Validação de Tamanho**
- Limite de 5MB por arquivo
- Previne uploads excessivamente grandes

### **Sanitização de Nome de Arquivo**
- Remove caracteres especiais com regex `/[^a-zA-Z0-9.-]/g`
- Garante compatibilidade com sistemas de arquivos

### **Fallback para Extensão**
- Adiciona `.jpg` automaticamente se não houver extensão
- Garante que o arquivo tenha um tipo válido

## Tratamento de Erros Robusto

### **Verificações Preventivas**
```typescript
if (!file || !file.name) {
  throw new Error('Arquivo inválido.');
}
```

### **Mensagens Específicas**
- "Falha ao carregar imagem. Arquivo inválido."
- "Falha ao carregar imagem. Verifique o formato e tente novamente."
- "Falha ao carregar imagem. Arquivo muito grande (máximo 5MB)."

### **Tratamento de Exceções**
```typescript
if (error instanceof Error) {
  throw new Error(`Falha no upload: ${error.message}`)
}
throw new Error('Falha ao carregar imagem. Verifique o formato e tente novamente.')
```

## Fluxo Corrigido

1. **Validação Inicial**: Verifica se o arquivo existe e é válido
2. **Validação de Tipo**: Confirma que é uma imagem
3. **Validação de Tamanho**: Verifica limite de 5MB
4. **Redimensionamento**: Processa a imagem mantendo o nome original
5. **Upload Seguro**: Envia para Supabase com nome sanitizado
6. **Feedback Claro**: Mostra mensagens específicas de sucesso/erro

## Benefícios das Correções

✅ **Estabilidade**: Elimina o erro `TypeError` que quebrava a aplicação
✅ **Segurança**: Validações robustas de tipo e tamanho de arquivo
✅ **UX Melhorada**: Mensagens de erro claras e específicas
✅ **Compatibilidade**: Funciona com qualquer tipo de imagem válida
✅ **Prevenção**: Evita uploads de arquivos maliciosos ou inválidos
✅ **Manutenibilidade**: Código mais limpo e bem estruturado

## Testes Recomendados

- [ ] Upload de imagem PNG válida
- [ ] Upload de imagem JPG válida
- [ ] Upload de arquivo não-imagem (deve falhar)
- [ ] Upload de arquivo muito grande (deve falhar)
- [ ] Upload de imagem com caracteres especiais no nome
- [ ] Upload de imagem sem extensão 