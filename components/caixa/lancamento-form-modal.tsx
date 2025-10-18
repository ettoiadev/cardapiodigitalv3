"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface LancamentoFormModalProps {
  isOpen: boolean
  onClose: () => void
  caixaId: string
  onSuccess: () => void
}

export function LancamentoFormModal({ isOpen, onClose, caixaId, onSuccess }: LancamentoFormModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    tipo: "entrada",
    categoria: "venda",
    valor: "",
    descricao: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.valor || parseFloat(formData.valor) <= 0) {
      toast.error("Informe um valor válido")
      return
    }

    if (!formData.categoria) {
      toast.error("Selecione uma categoria")
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase
        .from("lancamentos")
        .insert([{
          caixa_id: caixaId,
          tipo: formData.tipo,
          categoria: formData.categoria,
          valor: parseFloat(formData.valor),
          descricao: formData.descricao || null,
        }])

      if (error) throw error

      toast.success("Lançamento registrado com sucesso!")
      onSuccess()
      
      // Reset form
      setFormData({
        tipo: "entrada",
        categoria: "venda",
        valor: "",
        descricao: "",
      })
    } catch (error) {
      console.error("Erro ao registrar lançamento:", error)
      toast.error("Erro ao registrar lançamento")
    } finally {
      setLoading(false)
    }
  }

  const categoriasEntrada = [
    { value: "venda", label: "Venda" },
    { value: "taxa_entrega", label: "Taxa de Entrega" },
    { value: "suprimento", label: "Suprimento" },
    { value: "outros", label: "Outros" },
  ]

  const categoriasSaida = [
    { value: "sangria", label: "Sangria" },
    { value: "despesa", label: "Despesa" },
    { value: "outros", label: "Outros" },
  ]

  const categorias = formData.tipo === "entrada" ? categoriasEntrada : categoriasSaida

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Lançamento</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tipo */}
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo *</Label>
            <Select
              value={formData.tipo}
              onValueChange={(value) => {
                setFormData({ 
                  ...formData, 
                  tipo: value,
                  categoria: value === "entrada" ? "venda" : "sangria"
                })
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entrada">Entrada</SelectItem>
                <SelectItem value="saida">Saída</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Categoria */}
          <div className="space-y-2">
            <Label htmlFor="categoria">Categoria *</Label>
            <Select
              value={formData.categoria}
              onValueChange={(value) => setFormData({ ...formData, categoria: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                {categorias.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Valor */}
          <div className="space-y-2">
            <Label htmlFor="valor">Valor *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                R$
              </span>
              <Input
                id="valor"
                type="number"
                step="0.01"
                min="0.01"
                value={formData.valor}
                onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                className="pl-10"
                placeholder="0,00"
                required
              />
            </div>
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Observações sobre o lançamento (opcional)"
              rows={3}
            />
          </div>

          {/* Info Box */}
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-700">
              <strong>Dica:</strong> {formData.tipo === "entrada" 
                ? "Entradas aumentam o saldo do caixa" 
                : "Saídas diminuem o saldo do caixa"}
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Registrar"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
