"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { Loader2, User, Bike } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface Motoboy {
  id: string
  nome: string
  telefone: string
  status: string
}

interface Entrega {
  id: string
  pedido_id: string
}

interface AtribuirMotoboyModalProps {
  isOpen: boolean
  onClose: () => void
  entrega: Entrega | null
  onSuccess: () => void
}

export function AtribuirMotoboyModal({ isOpen, onClose, entrega, onSuccess }: AtribuirMotoboyModalProps) {
  const [motoboys, setMotoboys] = useState<Motoboy[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMotoboys, setLoadingMotoboys] = useState(true)

  useEffect(() => {
    if (isOpen) {
      loadMotoboys()
    }
  }, [isOpen])

  const loadMotoboys = async () => {
    try {
      setLoadingMotoboys(true)
      const { data, error } = await supabase
        .from("motoboys")
        .select("*")
        .eq("ativo", true)
        .eq("status", "disponivel")
        .order("nome", { ascending: true })

      if (error) throw error

      setMotoboys(data || [])
    } catch (error) {
      console.error("Erro ao carregar motoboys:", error)
      toast.error("Erro ao carregar motoboys")
    } finally {
      setLoadingMotoboys(false)
    }
  }

  const handleAtribuir = async (motoboyId: string) => {
    if (!entrega) return

    setLoading(true)

    try {
      const { error } = await supabase
        .from("entregas")
        .update({ motoboy_id: motoboyId })
        .eq("id", entrega.id)

      if (error) throw error

      toast.success("Motoboy atribuído com sucesso!")
      onSuccess()
      onClose()
    } catch (error) {
      console.error("Erro ao atribuir motoboy:", error)
      toast.error("Erro ao atribuir motoboy")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Atribuir Motoboy</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {loadingMotoboys ? (
            <div className="text-center py-8 text-gray-500">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              Carregando motoboys...
            </div>
          ) : motoboys.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bike className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>Nenhum motoboy disponível no momento</p>
            </div>
          ) : (
            <div className="space-y-2">
              {motoboys.map((motoboy) => (
                <Card
                  key={motoboy.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => !loading && handleAtribuir(motoboy.id)}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{motoboy.nome}</p>
                          <p className="text-sm text-gray-500">{motoboy.telefone}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {loading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Atribuir"
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
