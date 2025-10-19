# 🚀 Instruções Finais - Migração de Taxas

**Status Atual:** 60% Concluído  
**Restante:** 3 arquivos frontend + testes + commits

---

## ✅ JÁ CONCLUÍDO

1. ✅ Taxa padrão criada (R$ 10,00 para todas as áreas)
2. ✅ Banco de dados migrado (campos removidos)
3. ✅ Backup criado (`pizzaria_config_backup_taxa`)
4. ✅ `lib/supabase.ts` - Interface TypeScript atualizada
5. ✅ `app/admin/config/tabs/geral.tsx` - Interface e state atualizados (parcial)

---

## ⚠️ PENDENTE - COMPLETAR MANUALMENTE

### 1. Finalizar `app/admin/config/tabs/geral.tsx`

**Buscar e remover** todas as referências a:
- `taxa_entrega`
- `valor_minimo`  
- `taxaEntregaFormatada`
- `valorMinimoFormatado`

**Procurar por:**
```bash
# No arquivo geral.tsx, buscar:
- setTaxaEntregaFormatada
- setValorMinimoFormatado
- formatCurrencyInput(config.taxa_entrega
- formatCurrencyInput(config.valor_minimo
- parseCurrencyInput(taxaEntregaFormatada
- parseCurrencyInput(valorMinimoFormatado
```

**Remover seção UI** (procurar por "Configurações de Entrega" ou "Taxa de Entrega"):
```tsx
// REMOVER CARD COMPLETO:
<Card>
  <CardHeader>
    <CardTitle>Configurações de Entrega</CardTitle>
  </CardHeader>
  <CardContent>
    {/* ... campos de taxa_entrega e valor_minimo ... */}
  </CardContent>
</Card>
```

**Adicionar card informativo** (após seção de Formas de Pagamento):
```tsx
{/* Card Informativo - Taxas de Entrega */}
<Card className="bg-blue-50 border-blue-200">
  <CardContent className="pt-6">
    <div className="flex items-start space-x-3">
      <Bike className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
      <div>
        <h3 className="text-sm font-semibold text-blue-900 mb-1">
          📍 Taxas de Entrega por Bairro
        </h3>
        <p className="text-sm text-blue-700 mb-2">
          Configure taxas de entrega específicas por bairro ou faixa de CEP na aba dedicada.
        </p>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => window.location.href = '/admin/taxas'}
          className="mt-2"
        >
          Gerenciar Taxas de Entrega →
        </Button>
      </div>
    </div>
  </CardContent>
</Card>
```

---

### 2. Atualizar `app/checkout/page.tsx`

**Buscar e remover (9 ocorrências):**

```typescript
// Linha ~23: Remover da interface
valor_minimo: number

// Linha ~206: Remover do SELECT
.select("nome, whatsapp, taxa_entrega, valor_minimo, aceita_dinheiro...")
// MUDAR PARA:
.select("nome, whatsapp, aceita_dinheiro, aceita_cartao, aceita_pix...")

// Linhas ~193, 217, 250: Remover dos fallbacks
valor_minimo: 25.00,

// Linhas ~454-457: Remover validação
if (storeConfig && subtotal < storeConfig.valor_minimo) {
  console.warn("❌ Valor mínimo não atingido")
  return false
}

// Linha ~511: Remover validação
valorMinimo: subtotal >= (storeConfig?.valor_minimo || 0),

// Linha ~535: Remover validação
valorMinimo: subtotal >= (storeConfig?.valor_minimo || 0),

// Linhas ~875-876: Remover cálculo
const minimumValue = storeConfig?.valor_minimo || 0
const isMinimumMet = subtotal >= minimumValue

// Remover também qualquer UI que exiba "Valor mínimo"
```

---

### 3. Atualizar `app/page.tsx`

**Buscar:**
```typescript
valor_minimo: number
```

**Remover** da interface `PizzariaConfig` (linha ~36)

---

### 4. Atualizar `components/store-info-modal.tsx`

**Buscar:**
```tsx
Valor mínimo
formatCurrency(config.valor_minimo)
```

**Remover** ou **substituir** por:
```tsx
<p className="text-sm text-gray-600">
  Consulte taxas de entrega por CEP no checkout
</p>
```

---

## 🧪 TESTES OBRIGATÓRIOS

Após completar as alterações:

### Teste 1: Config Admin
```
1. Acessar /admin/config
2. Verificar que NÃO há campos "Taxa de Entrega" e "Valor Mínimo"
3. Verificar card azul com link para taxas
4. Clicar no botão e ir para /admin/taxas
5. Salvar configurações (não deve dar erro)
```

### Teste 2: Checkout
```
1. Adicionar produtos ao carrinho
2. Ir para /checkout
3. Inserir CEP válido
4. Verificar que taxa é R$ 10,00 (taxa padrão)
5. Finalizar pedido (não deve validar valor mínimo)
6. Pedido deve ser criado com sucesso
```

### Teste 3: Homepage
```
1. Acessar /
2. Verificar que NÃO exibe "Valor mínimo"
3. Verificar informações da loja
```

---

## 📝 COMMITS

Após testes bem-sucedidos:

```bash
# Commit 1: Backend
git add scripts/26-remove-taxa-unica-fields.sql
git commit -m "feat(database): remove taxa_entrega and valor_minimo from pizzaria_config

- Create backup table pizzaria_config_backup_taxa
- Remove obsolete fields taxa_entrega and valor_minimo
- Add default delivery tax (R$ 10.00 for all areas)
- Migration script includes rollback procedure"

# Commit 2: Frontend
git add lib/supabase.ts app/admin/config/tabs/geral.tsx app/checkout/page.tsx app/page.tsx components/store-info-modal.tsx
git commit -m "feat(frontend): migrate to delivery tax by neighborhood system

- Update TypeScript interfaces (remove taxa_entrega, valor_minimo)
- Remove single tax configuration from admin config
- Add informative card linking to /admin/taxas
- Remove minimum order value validation from checkout
- Update all components to use taxas_entrega table"

# Commit 3: Documentação
git add docs/PLANO_MIGRACAO_TAXAS_ENTREGA.md docs/RESUMO_EXECUTIVO_MIGRACAO_TAXAS.md docs/MIGRACAO_TAXAS_CONCLUIDA.md docs/INSTRUCOES_FINAIS_MIGRACAO.md
git commit -m "docs: add migration plan and completion report for delivery tax system

- Complete migration plan with 5 phases
- Executive summary for quick reference
- Completion report with status tracking
- Final instructions for manual steps"
```

---

## ✅ CHECKLIST FINAL

- [ ] `geral.tsx` - Remover campos e adicionar card
- [ ] `checkout/page.tsx` - Remover 9 referências
- [ ] `page.tsx` - Remover interface
- [ ] `store-info-modal.tsx` - Remover exibição
- [ ] Teste 1: Config Admin ✓
- [ ] Teste 2: Checkout ✓
- [ ] Teste 3: Homepage ✓
- [ ] Commit 1: Backend
- [ ] Commit 2: Frontend
- [ ] Commit 3: Documentação

---

## 🎯 RESULTADO ESPERADO

Após completar:
- ✅ Sistema usa APENAS `taxas_entrega` table
- ✅ Checkout calcula taxa por CEP automaticamente
- ✅ Admin gerencia taxas em `/admin/taxas`
- ✅ Sem validação de valor mínimo
- ✅ Backup disponível para rollback

---

**Tempo estimado para completar:** 30-45 minutos  
**Dificuldade:** Baixa (buscar e remover)

**Dúvidas?** Consulte `docs/PLANO_MIGRACAO_TAXAS_ENTREGA.md` completo
