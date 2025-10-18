# Sistema de Formatação de Moeda Brasileira

Esta implementação aplica formatação de moeda brasileira (R$ 9,90) em todos os campos de preço da aplicação, incluindo máscara de entrada automática.

## 📋 Implementação Realizada

### 🔧 **Utilitário de Formatação** (`lib/currency-utils.ts`)

#### **Funções Criadas:**

1. **`formatCurrency(value)`** - Exibição padrão
   - Entrada: `35.5` → Saída: `"R$ 35,50"`
   - Usa `Intl.NumberFormat` com localização brasileira
   - Trata valores `null/undefined` retornando `"R$ 0,00"`

2. **`formatCurrencyInput(input)`** - Máscara de entrada
   - Entrada: `"3590"` → Saída: `"R$ 35,90"`
   - Remove caracteres não numéricos
   - Converte centavos para reais automaticamente
   - Adiciona separador de milhar quando necessário

3. **`parseCurrencyInput(formattedValue)`** - Conversão para número
   - Entrada: `"R$ 35,90"` → Saída: `35.9`
   - Remove formatação para salvamento no banco
   - Substitui vírgula por ponto decimal

4. **`applyCurrencyMask(event)`** - Aplicação automática
   - Aplica formatação durante a digitação
   - Retorna valor numérico para uso interno

### 🎛️ **Campos de Entrada Atualizados**

#### **Admin - Produtos** (`app/admin/produtos/page.tsx`)
- ✅ **Tipo alterado**: `number` → `text`
- ✅ **Máscara automática**: Formata conforme digitação
- ✅ **Placeholder**: `"R$ 0,00"`
- ✅ **Estado duplo**: Formatado (display) + numérico (salvamento)

**Comportamento do campo:**
```typescript
// Estados separados para controle
const [precoTradicionalFormatado, setPrecoTradicionalFormatado] = useState("")
const [formData, setFormData] = useState({ preco_tradicional: 0 })

// Handler de mudança
onChange={(e) => {
  const valorFormatado = formatCurrencyInput(e.target.value)
  setPrecoTradicionalFormatado(valorFormatado)  // Para display
  const valorNumerico = parseCurrencyInput(valorFormatado)
  setFormData({ ...formData, preco_tradicional: valorNumerico })  // Para salvamento
}}
```

### 📱 **Exibições Atualizadas**

#### **Página Principal** (`app/page.tsx`)
- ✅ Preços de pizzas: `R$ 35,90` com vírgula
- ✅ Preços de bebidas: Formatação automática
- ✅ Valor mínimo: `R$ 20,00` no cabeçalho

#### **Modal de Seleção** (`components/pizza-selection-modal.tsx`)
- ✅ Preços dinâmicos para múltiplos sabores
- ✅ Preços de broto e tradicional formatados

#### **Checkout** (`app/checkout/page.tsx`)
- ✅ Subtotal, taxa de entrega e total
- ✅ Mensagem de valor mínimo com formatação
- ✅ Preços individuais dos itens



## 🎯 **Exemplos de Uso**

### **Campo de Entrada**
```
Usuário digita: "3590"
Campo exibe: "R$ 35,90"
Valor salvo: 35.9
```

### **Entrada Complexa**
```
Usuário digita: "123456"
Campo exibe: "R$ 1.234,56"
Valor salvo: 1234.56
```

### **Máscara Automática**
- **Remove letras**: `"abc123"` → `"R$ 1,23"`
- **Ignora símbolos**: `"R$35.90"` → `"R$ 35,90"`
- **Reordena formato**: `"35.90"` → `"R$ 35,90"`

## 🔄 **Fluxo de Funcionamento**

### **1. Entrada do Usuário**
```
Digitação: "4250" (apenas números)
↓
Máscara aplicada: "R$ 42,50"
↓
Exibido no campo: "R$ 42,50"
↓
Valor interno: 42.5
```

### **2. Salvamento**
```
Estado do componente: { preco_tradicional: 42.5 }
↓
Enviado para API/Banco: 42.5 (number)
↓
Armazenado: 42.5
```

### **3. Exibição**
```
Valor do banco: 42.5
↓
formatCurrency(42.5)
↓
Exibido: "R$ 42,50"
```

## 🛡️ **Validações e Proteções**

### **Tratamento de Erros**
- ✅ **Valores nulos**: `null` → `"R$ 0,00"`
- ✅ **Valores inválidos**: `NaN` → `"R$ 0,00"`
- ✅ **Strings vazias**: `""` → `""`
- ✅ **Caracteres inválidos**: Removidos automaticamente

### **Consistência de Dados**
- ✅ **Entrada sempre formatada**: Usuário vê padrão brasileiro
- ✅ **Salvamento sempre numérico**: Banco recebe números
- ✅ **Exibição sempre consistente**: Todas as telas usam mesmo formato

## 🎨 **Interface do Usuário**

### **Campos de Entrada**
```
┌─────────────────────────────────┐
│ Preço Tradicional              │
├─────────────────────────────────┤
│ R$ 35,90                    │▼│ 
└─────────────────────────────────┘
```

### **Exibições de Preço**
```
Pizza Margherita
Molho de tomate, mussarela, manjericão
Broto: R$ 25,00  Tradicional: R$ 35,00
```

### **Resumos de Pedido**
```
Subtotal                R$ 70,00
Taxa de entrega         R$ 5,00
─────────────────────────────────
Total                   R$ 75,00
```

## 📊 **Compatibilidade**

### **Navegadores Suportados**
- ✅ **Chrome/Edge**: `Intl.NumberFormat` nativo
- ✅ **Firefox**: Formatação completa
- ✅ **Safari**: Compatível
- ✅ **Mobile**: Funciona em dispositivos móveis

### **Acessibilidade**
- ✅ **Screen readers**: Leem "R$ 35,90" corretamente
- ✅ **Teclado**: Navegação por Tab funcional
- ✅ **Alto contraste**: Mantém legibilidade

## 🚀 **Benefícios Implementados**

1. **👤 Experiência do Usuário**
   - Formatação automática durante digitação
   - Sem necessidade de inserir vírgulas manualmente
   - Visual familiar ao padrão brasileiro

2. **💾 Integridade dos Dados**
   - Valores numéricos consistentes no banco
   - Conversões automáticas e confiáveis
   - Sem problemas de parsing

3. **🔧 Manutenibilidade**
   - Utilitário centralizado reutilizável
   - Fácil alteração de formato se necessário
   - Código limpo e documentado

4. **🎯 Conformidade**
   - Padrão monetário brasileiro (ABNT)
   - Vírgula como separador decimal
   - Ponto como separador de milhar

---

**Resultado**: Sistema completo de formatação monetária brasileira aplicado em toda a aplicação, com máscara de entrada automática e exibição consistente em R$ 9,90 format. 