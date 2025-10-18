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

interface Cliente {
  id: string
  nome: string
  telefone: string
  email?: string
  endereco?: string
  numero?: string
  complemento?: string
  bairro?: string
  cep?: string
  referencia?: string
  observacoes?: string
  ativo: boolean
}

interface ClienteFormModalProps {
  isOpen: boolean
  onClose: () => void
  cliente: Cliente | null
  onSuccess: () => void
}

export function ClienteFormModal({ isOpen, onClose, cliente, onSuccess }: ClienteFormModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nome: "",
    telefone: "",
    email: "",
    endereco: "",
    numero: "",
    complemento: "",
    bairro: "",
    cep: "",
    referencia: "",
    observacoes: "",
    ativo: true,
  })

  useEffect(() => {
    if (cliente) {
      setFormData({
        nome: cliente.nome || "",
        telefone: cliente.telefone || "",
        email: cliente.email || "",
        endereco: cliente.endereco || "",
        numero: cliente.numero || "",
        complemento: cliente.complemento || "",
        bairro: cliente.bairro || "",
        cep: cliente.cep || "",
        referencia: cliente.referencia || "",
        observacoes: cliente.observacoes || "",
        ativo: cliente.ativo,
      })
    } else {
      setFormData({
        nome: "",
        telefone: "",
        email: "",
        endereco: "",
        numero: "",
        complemento: "",
        bairro: "",
        cep: "",
        referencia: "",
        observacoes: "",
        ativo: true,
      })
    }
  }, [cliente, isOpen])

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
      if (cliente) {
        // Atualizar
        const { error } = await supabase
          .from("clientes")
          .update(formData)
          .eq("id", cliente.id)

        if (error) throw error
        toast.success("Cliente atualizado com sucesso")
      } else {
        // Criar
        const { error } = await supabase
          .from("clientes")
          .insert([formData])

        if (error) throw error
        toast.success("Cliente cadastrado com sucesso")
      }

      onSuccess()
      onClose()
    } catch (error) {
      console.error("Erro ao salvar cliente:", error)
      toast.error("Erro ao salvar cliente")
    } finally {
      setLoading(false)
    }
  }

  const handleCepBlur = async () => {
    const cep = formData.cep.replace(/\D/g, "")
    if (cep.length !== 8) return

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const data = await response.json()

      if (data.erro) {
        toast.error("CEP não encontrado")
        return
      }

      setFormData(prev => ({
        ...prev,
        endereco: data.logradouro || prev.endereco,
        bairro: data.bairro || prev.bairro,
      }))

      toast.success("Endereço preenchido automaticamente")
    } catch (error) {
      console.error("Erro ao buscar CEP:", error)
    }
  }

  const formatCep = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    if (numbers.length <= 5) return numbers
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`
  }

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    if (numbers.length <= 2) return numbers
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {cliente ? "Editar Cliente" : "Novo Cliente"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Dados Pessoais */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Dados Pessoais</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Nome completo"
                  required
                />
              </div>

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
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@exemplo.com"
              />
            </div>
          </div>

          {/* Endereço */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Endereço</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cep">CEP</Label>
                <Input
                  id="cep"
                  value={formData.cep}
                  onChange={(e) => setFormData({ ...formData, cep: formatCep(e.target.value) })}
                  onBlur={handleCepBlur}
                  placeholder="00000-000"
                  maxLength={9}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="endereco">Endereço</Label>
                <Input
                  id="endereco"
                  value={formData.endereco}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  placeholder="Rua, Avenida, etc."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="numero">Número</Label>
                <Input
                  id="numero"
                  value={formData.numero}
                  onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                  placeholder="123"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="complemento">Complemento</Label>
                <Input
                  id="complemento"
                  value={formData.complemento}
                  onChange={(e) => setFormData({ ...formData, complemento: e.target.value })}
                  placeholder="Apto, Bloco, etc."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bairro">Bairro</Label>
              <Input
                id="bairro"
                value={formData.bairro}
                onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                placeholder="Nome do bairro"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="referencia">Ponto de Referência</Label>
              <Input
                id="referencia"
                value={formData.referencia}
                onChange={(e) => setFormData({ ...formData, referencia: e.target.value })}
                placeholder="Ex: Próximo ao mercado"
              />
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              placeholder="Informações adicionais sobre o cliente"
              rows={3}
            />
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
              Cliente ativo
            </Label>
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
