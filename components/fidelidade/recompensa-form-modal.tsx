"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface Recompensa {
  id: string
  nome: string
  descricao?: string
  pontos_necessarios: number
  ativo: boolean
  estoque?: number
}

interface RecompensaFormModalProps {
  isOpen: boolean
  onClose: () => void
  recompensa: Recompensa | null
  onSuccess: () => void
}

export function RecompensaFormModal({ isOpen, onClose, recompensa, onSuccess }: RecompensaFormModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    pontos_necessarios: "",
    ativo: true,
    estoque: "",
  })

  useEffect(() => {
    if (recompensa) {
      setFormData({
        nome: recompensa.nome || "",
        descricao: recompensa.descricao || "",
        pontos_necessarios: recompensa.pontos_necessarios?.toString() || "",
        ativo: recompensa.ativo,
        estoque: recompensa.estoque?.toString() || "",
      })
    } else {
      setFormData({
        nome: "",
        descricao: "",
        pontos_necessarios: "",
        ativo: true,
        estoque: "",
      })
    }
  }, [recompensa, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nome.trim()) {
      toast.error("Nome é obrigatório")
      return
    }

    if (!formData.pontos_necessarios || parseInt(formData.pontos_necessarios) <= 0) {
      toast.error("Pontos necessários deve ser maior que zero")
      return
    }

    setLoading(true)

    try {
      const dataToSave = {
        nome: formData.nome,
        descricao: formData.descricao || null,
        pontos_necessarios: parseInt(formData.pontos_necessarios),
        ativo: formData.ativo,
        estoque: formData.estoque ? parseInt(formData.estoque) : null,
      }

      if (recompensa) {
        // Atualizar
        const { error } = await supabase
          .from("recompensas")
          .update(dataToSave)
          .eq("id", recompensa.id)

        if (error) throw error
        toast.success("Recompensa atualizada com sucesso!")
      } else {
        // Criar
        const { error } = await supabase
          .from("recompensas")
          .insert([dataToSave])

        if (error) throw error
        toast.success("Recompensa criada com sucesso!")
      }

      onSuccess()
    } catch (error) {
      console.error("Erro ao salvar recompensa:", error)
      toast.error("Erro ao salvar recompensa")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {recompensa ? "Editar Recompensa" : "Nova Recompensa"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome da Recompensa *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Ex: Pizza Grande Grátis"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Descreva a recompensa..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pontos_necessarios">Pontos Necessários *</Label>
            <Input
              id="pontos_necessarios"
              type="number"
              min="1"
              value={formData.pontos_necessarios}
              onChange={(e) => setFormData({ ...formData, pontos_necessarios: e.target.value })}
              placeholder="100"
              required
            />
            <p className="text-xs text-gray-500">
              Quantidade de pontos que o cliente precisa para resgatar
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="estoque">Estoque (opcional)</Label>
            <Input
              id="estoque"
              type="number"
              min="0"
              value={formData.estoque}
              onChange={(e) => setFormData({ ...formData, estoque: e.target.value })}
              placeholder="Deixe vazio para ilimitado"
            />
            <p className="text-xs text-gray-500">
              Quantidade disponível desta recompensa
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="ativo"
              checked={formData.ativo}
              onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
              className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
            />
            <Label htmlFor="ativo" className="cursor-pointer">
              Recompensa ativa
            </Label>
          </div>

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
                "Salvar"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
