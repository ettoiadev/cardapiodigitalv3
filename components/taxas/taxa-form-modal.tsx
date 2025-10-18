"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { Loader2, Info } from "lucide-react"

interface Taxa {
  id: string
  bairro: string
  cep_inicial?: string
  cep_final?: string
  taxa: number
  tempo_estimado_min: number
  tempo_estimado_max: number
  ativo: boolean
}

interface TaxaFormModalProps {
  isOpen: boolean
  onClose: () => void
  taxa: Taxa | null
  onSuccess: () => void
}

export function TaxaFormModal({ isOpen, onClose, taxa, onSuccess }: TaxaFormModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    bairro: "",
    cep_inicial: "",
    cep_final: "",
    taxa: "",
    tempo_estimado_min: "30",
    tempo_estimado_max: "45",
    ativo: true,
  })

  useEffect(() => {
    if (taxa) {
      setFormData({
        bairro: taxa.bairro || "",
        cep_inicial: taxa.cep_inicial || "",
        cep_final: taxa.cep_final || "",
        taxa: taxa.taxa.toString() || "",
        tempo_estimado_min: taxa.tempo_estimado_min.toString() || "30",
        tempo_estimado_max: taxa.tempo_estimado_max.toString() || "45",
        ativo: taxa.ativo,
      })
    } else {
      setFormData({
        bairro: "",
        cep_inicial: "",
        cep_final: "",
        taxa: "",
        tempo_estimado_min: "30",
        tempo_estimado_max: "45",
        ativo: true,
      })
    }
  }, [taxa, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.bairro.trim()) {
      toast.error("Bairro é obrigatório")
      return
    }

    if (!formData.taxa || Number(formData.taxa) < 0) {
      toast.error("Taxa deve ser um valor válido")
      return
    }

    // Validar CEPs se fornecidos
    if (formData.cep_inicial && formData.cep_final) {
      const cepInicialNum = formData.cep_inicial.replace(/\D/g, "")
      const cepFinalNum = formData.cep_final.replace(/\D/g, "")

      if (cepInicialNum.length !== 8 || cepFinalNum.length !== 8) {
        toast.error("CEPs devem ter 8 dígitos")
        return
      }

      if (cepInicialNum > cepFinalNum) {
        toast.error("CEP inicial deve ser menor que CEP final")
        return
      }
    }

    setLoading(true)

    try {
      const dataToSave = {
        bairro: formData.bairro.trim(),
        cep_inicial: formData.cep_inicial ? formData.cep_inicial.replace(/\D/g, "") : null,
        cep_final: formData.cep_final ? formData.cep_final.replace(/\D/g, "") : null,
        taxa: Number(formData.taxa),
        tempo_estimado_min: Number(formData.tempo_estimado_min),
        tempo_estimado_max: Number(formData.tempo_estimado_max),
        ativo: formData.ativo,
      }

      if (taxa) {
        // Atualizar
        const { error } = await supabase
          .from("taxas_entrega")
          .update(dataToSave)
          .eq("id", taxa.id)

        if (error) throw error
        toast.success("Taxa atualizada com sucesso")
      } else {
        // Criar
        const { error } = await supabase
          .from("taxas_entrega")
          .insert([dataToSave])

        if (error) throw error
        toast.success("Taxa cadastrada com sucesso")
      }

      onSuccess()
      onClose()
    } catch (error) {
      console.error("Erro ao salvar taxa:", error)
      toast.error("Erro ao salvar taxa")
    } finally {
      setLoading(false)
    }
  }

  const formatCep = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    if (numbers.length <= 5) return numbers
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`
  }

  const formatCurrency = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    const amount = Number(numbers) / 100
    return amount.toFixed(2)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {taxa ? "Editar Taxa de Entrega" : "Nova Taxa de Entrega"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Bairro */}
          <div className="space-y-2">
            <Label htmlFor="bairro">Bairro *</Label>
            <Input
              id="bairro"
              value={formData.bairro}
              onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
              placeholder="Nome do bairro"
              required
            />
          </div>

          {/* Faixa de CEP */}
          <div className="space-y-4">
            <div className="flex items-start space-x-2 p-3 bg-blue-50 rounded-lg">
              <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">Faixa de CEP (opcional)</p>
                <p>
                  Defina uma faixa de CEPs para aplicar a taxa automaticamente. 
                  Se não informado, a taxa será aplicada apenas pelo nome do bairro.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cep_inicial">CEP Inicial</Label>
                <Input
                  id="cep_inicial"
                  value={formData.cep_inicial}
                  onChange={(e) => setFormData({ ...formData, cep_inicial: formatCep(e.target.value) })}
                  placeholder="00000-000"
                  maxLength={9}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cep_final">CEP Final</Label>
                <Input
                  id="cep_final"
                  value={formData.cep_final}
                  onChange={(e) => setFormData({ ...formData, cep_final: formatCep(e.target.value) })}
                  placeholder="00000-000"
                  maxLength={9}
                />
              </div>
            </div>
          </div>

          {/* Taxa */}
          <div className="space-y-2">
            <Label htmlFor="taxa">Taxa de Entrega (R$) *</Label>
            <Input
              id="taxa"
              type="number"
              step="0.01"
              min="0"
              value={formData.taxa}
              onChange={(e) => setFormData({ ...formData, taxa: e.target.value })}
              placeholder="0.00"
              required
            />
          </div>

          {/* Tempo Estimado */}
          <div className="space-y-4">
            <Label>Tempo Estimado de Entrega (minutos)</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tempo_min" className="text-sm text-gray-600">
                  Mínimo
                </Label>
                <Input
                  id="tempo_min"
                  type="number"
                  min="0"
                  value={formData.tempo_estimado_min}
                  onChange={(e) => setFormData({ ...formData, tempo_estimado_min: e.target.value })}
                  placeholder="30"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tempo_max" className="text-sm text-gray-600">
                  Máximo
                </Label>
                <Input
                  id="tempo_max"
                  type="number"
                  min="0"
                  value={formData.tempo_estimado_max}
                  onChange={(e) => setFormData({ ...formData, tempo_estimado_max: e.target.value })}
                  placeholder="45"
                />
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="ativo"
              checked={formData.ativo}
              onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
              className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
            />
            <Label htmlFor="ativo" className="cursor-pointer">
              Taxa ativa
            </Label>
          </div>

          {/* Exemplo */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Exemplo de uso:</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p>• <strong>Bairro:</strong> {formData.bairro || "Centro"}</p>
              {formData.cep_inicial && formData.cep_final && (
                <p>• <strong>CEPs:</strong> {formData.cep_inicial} até {formData.cep_final}</p>
              )}
              <p>• <strong>Taxa:</strong> R$ {formData.taxa || "0,00"}</p>
              <p>• <strong>Tempo:</strong> {formData.tempo_estimado_min} - {formData.tempo_estimado_max} minutos</p>
            </div>
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
                "Salvar"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
