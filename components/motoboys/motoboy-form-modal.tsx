"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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

interface Motoboy {
  id: string
  nome: string
  telefone: string
  cpf?: string
  placa_moto?: string
  status: string
  ativo: boolean
}

interface MotoboyFormModalProps {
  isOpen: boolean
  onClose: () => void
  motoboy: Motoboy | null
  onSuccess: () => void
}

export function MotoboyFormModal({ isOpen, onClose, motoboy, onSuccess }: MotoboyFormModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nome: "",
    telefone: "",
    cpf: "",
    placa_moto: "",
    status: "disponivel",
    ativo: true,
  })

  useEffect(() => {
    if (motoboy) {
      setFormData({
        nome: motoboy.nome || "",
        telefone: motoboy.telefone || "",
        cpf: motoboy.cpf || "",
        placa_moto: motoboy.placa_moto || "",
        status: motoboy.status || "disponivel",
        ativo: motoboy.ativo,
      })
    } else {
      setFormData({
        nome: "",
        telefone: "",
        cpf: "",
        placa_moto: "",
        status: "disponivel",
        ativo: true,
      })
    }
  }, [motoboy, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nome.trim()) {
      toast.error("Nome é obrigatório")
      return
    }

    if (!formData.telefone.trim()) {
      toast.error("Telefone é obrigatório")
      return
    }

    setLoading(true)

    try {
      if (motoboy) {
        // Atualizar
        const { error } = await supabase
          .from("motoboys")
          .update(formData)
          .eq("id", motoboy.id)

        if (error) throw error
        toast.success("Motoboy atualizado com sucesso")
      } else {
        // Criar
        const { error } = await supabase
          .from("motoboys")
          .insert([formData])

        if (error) throw error
        toast.success("Motoboy cadastrado com sucesso")
      }

      onSuccess()
      onClose()
    } catch (error) {
      console.error("Erro ao salvar motoboy:", error)
      toast.error("Erro ao salvar motoboy")
    } finally {
      setLoading(false)
    }
  }

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    if (numbers.length <= 2) return numbers
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`
  }

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    if (numbers.length <= 3) return numbers
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`
    if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`
  }

  const formatPlaca = (value: string) => {
    // Formato: ABC-1234 ou ABC1D23 (Mercosul)
    const cleaned = value.replace(/[^A-Za-z0-9]/g, "").toUpperCase()
    if (cleaned.length <= 3) return cleaned
    if (cleaned.length <= 7) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}`
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {motoboy ? "Editar Motoboy" : "Novo Motoboy"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Dados Pessoais */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Dados Pessoais</h3>
            
            <div className="space-y-2">
              <Label htmlFor="nome">Nome Completo *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Nome completo do motoboy"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone *</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: formatPhone(e.target.value) })}
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  value={formData.cpf}
                  onChange={(e) => setFormData({ ...formData, cpf: formatCPF(e.target.value) })}
                  placeholder="000.000.000-00"
                  maxLength={14}
                />
              </div>
            </div>
          </div>

          {/* Dados da Moto */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Dados da Moto</h3>
            
            <div className="space-y-2">
              <Label htmlFor="placa_moto">Placa da Moto</Label>
              <Input
                id="placa_moto"
                value={formData.placa_moto}
                onChange={(e) => setFormData({ ...formData, placa_moto: formatPlaca(e.target.value) })}
                placeholder="ABC-1234"
                maxLength={8}
              />
              <p className="text-xs text-gray-500">
                Formato: ABC-1234 ou ABC1D23 (Mercosul)
              </p>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Status</h3>
            
            <div className="space-y-2">
              <Label htmlFor="status">Status Atual</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="disponivel">Disponível</SelectItem>
                  <SelectItem value="em_entrega">Em Entrega</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                O status será atualizado automaticamente quando uma entrega for atribuída
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
                Motoboy ativo
              </Label>
            </div>
          </div>

          {/* Info Box */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">
              ℹ️ Informações sobre Status
            </h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• <strong>Disponível:</strong> Motoboy pronto para receber entregas</li>
              <li>• <strong>Em Entrega:</strong> Motoboy realizando uma entrega</li>
              <li>• <strong>Inativo:</strong> Motoboy temporariamente indisponível</li>
            </ul>
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
