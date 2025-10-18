# 🔔 NOTIFICAÇÕES EM TEMPO REAL

**Data:** 18/10/2025  
**Tecnologia:** Supabase Realtime  
**Status:** Implementado

---

## 📋 VISÃO GERAL

Sistema de notificações em tempo real usando Supabase Realtime para:
- ✅ Notificar admin de novos pedidos
- ✅ Notificar cliente de mudanças de status
- ✅ Som de alerta
- ✅ Badge visual
- ✅ Toast notifications

---

## 🎯 COMPONENTES CRIADOS

### **1. RealtimeNotifications** (Genérico)
**Arquivo:** `/components/realtime-notifications.tsx`

**Funcionalidades:**
- ✅ Escuta eventos de INSERT em `pedidos` (admin)
- ✅ Escuta eventos de UPDATE em `pedidos` (cliente)
- ✅ Filtra por `cliente_id` para clientes
- ✅ Toca som de notificação
- ✅ Mostra toast com detalhes
- ✅ Mensagens personalizadas por status

**Uso:**
```tsx
// Para admin
<RealtimeNotifications userId={adminId} isAdmin={true} />

// Para cliente
<RealtimeNotifications userId={clienteId} isAdmin={false} />
```

---

### **2. AdminRealtimePedidos** (Específico Admin)
**Arquivo:** `/components/admin-realtime-pedidos.tsx`

**Funcionalidades:**
- ✅ Badge flutuante com contador
- ✅ Animação bounce
- ✅ Som duplo (2 tons)
- ✅ Auto-desaparece após 5s
- ✅ Callback para recarregar lista

**Uso:**
```tsx
<AdminRealtimePedidos onNewPedido={() => loadPedidos()} />
```

**Preview:**
```
┌─────────────────────────┐
│  🔔 1 Novo Pedido       │  ← Badge flutuante
└─────────────────────────┘
```

---

### **3. useRealtimePedidos** (Hook)
**Arquivo:** `/hooks/use-realtime-pedidos.ts`

**Funcionalidades:**
- ✅ Hook customizado para lista de pedidos
- ✅ Escuta INSERT, UPDATE, DELETE
- ✅ Atualiza estado automaticamente
- ✅ Sincronização em tempo real

**Uso:**
```tsx
const [pedidos, setPedidos] = useState([])
const pedidosRealtime = useRealtimePedidos(pedidos)
```

---

## 🔊 SONS DE NOTIFICAÇÃO

### **Som Padrão (Cliente):**
```typescript
- Frequência: 800 Hz
- Tipo: sine wave
- Duração: 0.5s
- Volume: 0.3
- Fade out exponencial
```

### **Som Admin (Duplo):**
```typescript
Tom 1:
- Frequência: 800 Hz
- Duração: 0.2s

Tom 2:
- Frequência: 1000 Hz (mais agudo)
- Duração: 0.2s
- Delay: 0.2s
```

---

## 📱 MENSAGENS POR STATUS

### **Cliente recebe notificação quando:**

**Status: confirmado**
```
Título: "Pedido Confirmado! 🎉"
Descrição: "Seu pedido PED-001 foi confirmado e está sendo preparado."
```

**Status: em_preparo**
```
Título: "Pedido em Preparo 👨‍🍳"
Descrição: "Seu pedido PED-001 está sendo preparado com carinho."
```

**Status: saiu_entrega**
```
Título: "Pedido Saiu para Entrega! 🚚"
Descrição: "Seu pedido PED-001 está a caminho."
```

**Status: entregue**
```
Título: "Pedido Entregue! ✅"
Descrição: "Seu pedido PED-001 foi entregue. Bom apetite!"
```

**Status: cancelado**
```
Título: "Pedido Cancelado ❌"
Descrição: "Seu pedido PED-001 foi cancelado."
```

---

### **Admin recebe notificação quando:**

**Novo pedido criado:**
```
Título: "Novo pedido recebido!"
Descrição: "Pedido PED-001 - R$ 105,00"
Ícone: 🔔
Duração: 5s
Som: Duplo (2 tons)
Badge: Contador flutuante
```

---

## 🔧 COMO USAR

### **1. No Admin Dashboard:**

```tsx
// app/admin/page.tsx
import { AdminRealtimePedidos } from "@/components/admin-realtime-pedidos"

export default function AdminDashboard() {
  const loadPedidos = async () => {
    // Recarregar lista de pedidos
  }

  return (
    <AdminLayout>
      <AdminRealtimePedidos onNewPedido={loadPedidos} />
      {/* Resto do dashboard */}
    </AdminLayout>
  )
}
```

---

### **2. Na Página de Pedidos do Cliente:**

```tsx
// app/meus-pedidos/page.tsx
import { RealtimeNotifications } from "@/components/realtime-notifications"
import { getUser } from "@/lib/auth-helpers"

export default function MeusPedidosPage() {
  const [userId, setUserId] = useState<string>()

  useEffect(() => {
    const loadUser = async () => {
      const { user } = await getUser()
      setUserId(user?.id)
    }
    loadUser()
  }, [])

  return (
    <div>
      {userId && <RealtimeNotifications userId={userId} isAdmin={false} />}
      {/* Lista de pedidos */}
    </div>
  )
}
```

---

### **3. Com Hook Customizado:**

```tsx
// Usar hook para atualizar lista automaticamente
import { useRealtimePedidos } from "@/hooks/use-realtime-pedidos"

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState([])
  
  // Hook atualiza automaticamente
  const pedidosRealtime = useRealtimePedidos(pedidos)

  return (
    <div>
      {pedidosRealtime.map(pedido => (
        <PedidoCard key={pedido.id} pedido={pedido} />
      ))}
    </div>
  )
}
```

---

## 🔐 CONFIGURAÇÃO DO SUPABASE

### **Habilitar Realtime:**

1. **Dashboard do Supabase**
2. **Database** → **Replication**
3. **Habilitar Realtime para tabela `pedidos`:**

```sql
-- Habilitar Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE pedidos;
```

---

## 🎨 ESTILOS DO BADGE

```tsx
className="fixed top-4 right-4 z-50 animate-bounce"
className="bg-red-600 text-white px-4 py-2 flex items-center gap-2 shadow-lg"
```

**Posição:**
- Fixed no topo direito
- Z-index 50 (acima de tudo)
- Animação bounce

**Cores:**
- Background: red-600
- Text: white
- Shadow: lg

---

## 📊 EVENTOS ESCUTADOS

### **Para Admin:**
```typescript
Event: INSERT
Table: pedidos
Filter: none (todos os pedidos)
Action: Mostrar notificação + som + badge
```

### **Para Cliente:**
```typescript
Event: UPDATE
Table: pedidos
Filter: cliente_id = userId
Action: Mostrar notificação + som (se status mudou)
```

---

## 🧪 COMO TESTAR

### **Teste 1: Notificação de Novo Pedido (Admin)**

```
1. Abra o admin em uma aba
2. Abra o frontend em outra aba
3. Faça login como cliente
4. Crie um pedido
5. Verifique no admin:
   ✅ Badge aparece no topo direito
   ✅ Som duplo toca
   ✅ Toast aparece
   ✅ Lista atualiza automaticamente
```

### **Teste 2: Notificação de Status (Cliente)**

```
1. Abra /meus-pedidos como cliente
2. Em outra aba, abra o admin
3. Mude o status de um pedido no admin
4. Verifique em /meus-pedidos:
   ✅ Toast aparece com mensagem
   ✅ Som toca
   ✅ Status atualiza na lista
```

### **Teste 3: Hook Realtime**

```
1. Abra página com useRealtimePedidos
2. Crie/edite/delete pedido no banco
3. Verifique:
   ✅ Lista atualiza automaticamente
   ✅ Sem reload necessário
```

---

## ⚡ PERFORMANCE

### **Otimizações:**
- ✅ Um canal por componente
- ✅ Cleanup automático (useEffect return)
- ✅ Filtros no servidor (RLS)
- ✅ Debounce de 5s no badge

### **Limitações:**
- Supabase Realtime: ~100 conexões simultâneas (plano free)
- Latência: ~100-500ms
- Não funciona offline

---

## 🔒 SEGURANÇA

### **RLS (Row Level Security):**
```sql
-- Cliente só recebe updates dos seus pedidos
CREATE POLICY "Cliente vê próprios pedidos"
ON pedidos FOR SELECT
USING (cliente_id = auth.uid())

-- Admin vê todos
CREATE POLICY "Admin vê todos"
ON pedidos FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE id = auth.uid()
  )
)
```

---

## 📊 RESUMO

**Arquivos criados:** 4
- ✅ `/components/realtime-notifications.tsx` (150 linhas)
- ✅ `/components/admin-realtime-pedidos.tsx` (100 linhas)
- ✅ `/hooks/use-realtime-pedidos.ts` (60 linhas)
- ✅ `/docs/NOTIFICACOES_REALTIME.md` (400 linhas)

**Total de código:** ~710 linhas

**Funcionalidades:**
- ✅ Notificações em tempo real
- ✅ Sons de alerta
- ✅ Badge visual
- ✅ Toast notifications
- ✅ Mensagens personalizadas
- ✅ Hook customizado
- ✅ Sincronização automática
- ✅ Performance otimizada

---

**Documentação criada em:** 18/10/2025  
**Última atualização:** 18/10/2025
