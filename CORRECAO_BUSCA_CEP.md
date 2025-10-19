# ✅ CORREÇÃO: Busca de CEP via ViaCEP no Perfil

**Data:** 19/10/2025  
**Status:** ✅ CORRIGIDO

---

## 🐛 PROBLEMA IDENTIFICADO

### **Sintoma:**
- Cliente digita CEP no perfil (ex: 12321-150)
- Nada acontece ❌
- Campos de endereço e bairro não são preenchidos automaticamente ❌
- Sem feedback visual ❌

### **Causa:**
A função `handleCepChange` na página `/perfil` estava **apenas formatando o CEP**, mas **não buscava o endereço** via API ViaCEP.

**Código Problemático (ANTES):**
```typescript
const handleCepChange = (value: string) => {
  setCep(formatCep(value))
  // ❌ Só formatava, não buscava endereço!
}
```

---

## ✅ SOLUÇÃO IMPLEMENTADA

### **1. Importar função buscarCEP**

**app/perfil/page.tsx:**
```typescript
import { getCliente, updateCliente, updatePassword, buscarCEP, type Cliente } from "@/lib/auth"
```

### **2. Adicionar estados de loading**

```typescript
const [buscandoCep, setBuscandoCep] = useState(false)
const cepDebounceRef = useRef<NodeJS.Timeout | undefined>(undefined)
```

### **3. Reescrever handleCepChange**

**ANTES:**
```typescript
const handleCepChange = (value: string) => {
  setCep(formatCep(value))
}
```

**DEPOIS:**
```typescript
const handleCepChange = async (value: string) => {
  // Limpar debounce anterior
  if (cepDebounceRef.current) {
    clearTimeout(cepDebounceRef.current)
  }
  
  // Formatar e atualizar CEP
  const cepFormatado = formatCep(value)
  setCep(cepFormatado)
  
  // Verificar se CEP está completo (8 dígitos)
  const cepLimpo = cepFormatado.replace(/\D/g, "")
  
  if (cepLimpo.length === 8) {
    // Debounce de 500ms antes de buscar
    cepDebounceRef.current = setTimeout(async () => {
      setBuscandoCep(true)
      
      console.log('🔍 Buscando CEP:', cepLimpo)
      
      const { data, error } = await buscarCEP(cepLimpo)
      
      if (error) {
        toast.error(error)
        setBuscandoCep(false)
        return
      }
      
      if (data) {
        console.log('✅ CEP encontrado:', data)
        // Preencher campos automaticamente
        setEndereco(data.logradouro || "")
        setBairro(data.bairro || "")
        
        // Mostrar toast de sucesso
        toast.success("Endereço encontrado!")
      }
      
      setBuscandoCep(false)
    }, 500)
  } else {
    // Limpar campos se CEP incompleto
    if (cepLimpo.length === 0) {
      setEndereco("")
      setBairro("")
    }
  }
}
```

### **4. Adicionar indicador visual de loading**

**ANTES:**
```tsx
<Input
  id="cep"
  value={cep}
  onChange={(e) => handleCepChange(e.target.value)}
  placeholder="12345-678"
  maxLength={9}
/>
```

**DEPOIS:**
```tsx
<div className="relative">
  <Input
    id="cep"
    value={cep}
    onChange={(e) => handleCepChange(e.target.value)}
    placeholder="12345-678"
    maxLength={9}
    disabled={buscandoCep}
  />
  {buscandoCep && (
    <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-gray-400" />
  )}
</div>
{buscandoCep && (
  <p className="text-xs text-gray-500">Buscando endereço...</p>
)}
```

---

## 🎯 COMO FUNCIONA AGORA

### **Fluxo Completo:**

```
1. Cliente digita CEP: 12321-150
   ↓
2. Campo formata automaticamente: 12321-150 ✅
   ↓
3. Detecta 8 dígitos completos
   ↓
4. Aguarda 500ms (debounce)
   ↓
5. Mostra loading: "Buscando endereço..." ⏳
   ↓
6. Chama buscarCEP(12321150)
   ↓
7. API ViaCEP retorna:
   {
     logradouro: "Rua das Flores",
     bairro: "Centro",
     localidade: "São Paulo",
     uf: "SP"
   }
   ↓
8. Preenche campos automaticamente ✅
   ↓
9. Toast: "Endereço encontrado!" ✅
   ↓
10. Cliente só precisa digitar número e complemento
```

---

## 🧪 COMO TESTAR

### **Teste 1: CEP Válido**

```
1. Acesse: http://localhost:3000/perfil
2. Clique na aba "Endereço"
3. Digite no campo CEP: 01310100
4. Aguarde 500ms
5. Deve mostrar: "Buscando endereço..."
6. Campos preenchidos automaticamente:
   - Endereço: Avenida Paulista
   - Bairro: Bela Vista
7. Toast: "Endereço encontrado!" ✅
```

### **Teste 2: CEP Inválido**

```
1. Digite no campo CEP: 99999999
2. Aguarde 500ms
3. Deve mostrar: "Buscando endereço..."
4. Toast de erro: "CEP não encontrado" ❌
5. Campos permanecem vazios
```

### **Teste 3: CEP Incompleto**

```
1. Digite no campo CEP: 12321
2. Nada acontece (menos de 8 dígitos)
3. Sem busca, sem loading ✅
```

### **Teste 4: Debounce**

```
1. Digite rapidamente: 123211
2. Não busca ainda (debounce)
3. Complete: 12321150
4. Aguarda 500ms
5. Busca apenas 1 vez ✅
```

---

## 📊 COMPARAÇÃO

| Aspecto | Antes | Depois |
|---------|-------|--------|
| **Busca CEP** | ❌ Não funcionava | ✅ Funciona |
| **Preenchimento** | ❌ Manual | ✅ Automático |
| **Feedback visual** | ❌ Nenhum | ✅ Loading + Toast |
| **Debounce** | ❌ Não tinha | ✅ 500ms |
| **UX** | ❌ Ruim | ✅ Excelente |

---

## 🔍 LOGS DO CONSOLE

### **Logs Esperados:**

```
🔍 Buscando CEP: 12321150
✅ CEP encontrado: {
  cep: "12321-150",
  logradouro: "Rua das Flores",
  bairro: "Centro",
  localidade: "São Paulo",
  uf: "SP"
}
```

### **Se CEP não encontrado:**

```
🔍 Buscando CEP: 99999999
❌ Toast: CEP não encontrado
```

---

## 📁 ARQUIVOS MODIFICADOS

| Arquivo | Mudanças | Status |
|---------|----------|--------|
| `app/perfil/page.tsx` | Busca CEP implementada | ✅ |
| `app/perfil/page.tsx` | Loading indicator | ✅ |
| `app/perfil/page.tsx` | Debounce 500ms | ✅ |
| `CORRECAO_BUSCA_CEP.md` | Documentação | ✅ |

---

## 🎓 DETALHES TÉCNICOS

### **Função buscarCEP (lib/auth.ts):**

```typescript
export async function buscarCEP(cep: string): Promise<AuthResponse<ViaCEPResponse>> {
  try {
    const cepLimpo = cep.replace(/\D/g, '')
    
    if (!validateCEP(cepLimpo)) {
      return {
        data: null,
        error: 'CEP inválido. Deve conter 8 dígitos.'
      }
    }
    
    const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
    
    if (!response.ok) {
      return {
        data: null,
        error: 'Erro ao consultar CEP. Tente novamente.'
      }
    }
    
    const data: ViaCEPResponse = await response.json()
    
    if (data.erro) {
      return {
        data: null,
        error: 'CEP não encontrado.'
      }
    }
    
    return {
      data,
      error: null
    }
  } catch (error) {
    return {
      data: null,
      error: 'Erro ao consultar CEP. Verifique sua conexão.'
    }
  }
}
```

### **Interface ViaCEPResponse:**

```typescript
export interface ViaCEPResponse {
  cep: string
  logradouro: string
  complemento: string
  bairro: string
  localidade: string // cidade
  uf: string // estado
  erro?: boolean
}
```

---

## ⚠️ TROUBLESHOOTING

### **Problema: Não busca o CEP**

1. **Verifique console:**
   - Deve aparecer: `🔍 Buscando CEP: ...`
   - Se não aparecer, função não está sendo chamada

2. **Verifique CEP:**
   - Deve ter exatamente 8 dígitos
   - Formato: 12345-678 ou 12345678

3. **Verifique conexão:**
   - API ViaCEP precisa de internet
   - Teste: https://viacep.com.br/ws/01310100/json/

### **Problema: Campos não preenchem**

1. **Verifique resposta da API:**
   - Console deve mostrar: `✅ CEP encontrado: {...}`
   - Se não tiver logradouro/bairro, CEP pode ser válido mas sem dados

2. **Verifique estados:**
   - `setEndereco(data.logradouro || "")`
   - `setBairro(data.bairro || "")`

---

## 🎉 RESULTADO

**BUSCA DE CEP 100% FUNCIONAL!** ✨

Agora o cliente pode:
- ✅ Digitar CEP
- ✅ Ver loading visual
- ✅ Endereço preenchido automaticamente
- ✅ Apenas digitar número e complemento
- ✅ Salvar endereço completo

**UX melhorada drasticamente!** 🚀

---

## 📚 REFERÊNCIAS

- **API ViaCEP:** https://viacep.com.br/
- **Função buscarCEP:** `lib/auth.ts` linha 701
- **Página de Perfil:** `app/perfil/page.tsx`
- **Checkout (já funcionava):** `app/checkout/page.tsx` linha 342

---

**Data de Implementação:** 19/10/2025  
**Testado em:** Localhost  
**Status:** ✅ PRONTO PARA USO
