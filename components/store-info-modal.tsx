"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { MapPin, Clock, Bike, Package } from "lucide-react"

interface PizzariaConfig {
  id: string
  nome: string
  foto_capa: string | null
  foto_perfil: string | null
  taxa_entrega: number
  tempo_entrega_min: number
  tempo_entrega_max: number
  aceita_dinheiro: boolean
  aceita_cartao: boolean
  endereco: string | null
  telefone: string | null
  whatsapp: string | null
  horario_funcionamento: any
}

interface StoreInfoModalProps {
  isOpen: boolean
  onClose: () => void
  config: PizzariaConfig
}

export function StoreInfoModal({ isOpen, onClose, config }: StoreInfoModalProps) {
  const daysOrder = ["segunda", "terca", "quarta", "quinta", "sexta", "sabado", "domingo"]
  
  const formatDayName = (day: string) => {
    const days: { [key: string]: string } = {
      segunda: "segunda",
      terca: "terça", 
      quarta: "quarta",
      quinta: "quinta",
      sexta: "sexta",
      sabado: "sábado",
      domingo: "domingo"
    }
    return days[day] || day
  }

  const formatSchedule = (schedule: string) => {
    if (!schedule || schedule.toLowerCase() === 'fechado') {
      return 'Fechado'
    }
    return schedule
  }

  const handleOpenMap = () => {
    if (config.endereco) {
      const encodedAddress = encodeURIComponent(config.endereco)
      const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`
      window.open(mapUrl, '_blank')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90vw] max-w-md mx-auto my-auto rounded-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg text-gray-900 font-medium text-center">informações da loja</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pb-2">
          {/* Cards Delivery e Balcão lado a lado */}
          <div className="grid grid-cols-2 gap-3">
            <div className="border border-gray-300 rounded-lg p-4 text-center">
              <Bike className="w-8 h-8 text-red-600 mx-auto mb-2" />
              <div className="text-sm font-medium text-gray-700">delivery</div>
            </div>
            <div className="border border-gray-300 rounded-lg p-4 text-center">
              <Package className="w-8 h-8 text-red-600 mx-auto mb-2" />
              <div className="text-sm font-medium text-gray-700">balcão</div>
            </div>
          </div>

          {/* Horários de funcionamento */}
          {config.horario_funcionamento && (
            <div>
              <h3 className="text-gray-900 font-medium mb-3 flex items-center">
                <Clock className="w-5 h-5 text-red-600 mr-2" />
                horários de funcionamento
              </h3>
              <div className="space-y-1 text-sm text-gray-600">
                {daysOrder.map((dia) => {
                  const horario = config.horario_funcionamento?.[dia] || "Fechado"
                  return (
                    <div key={dia} className="flex justify-between">
                      <span className="capitalize">{formatDayName(dia)}:</span>
                      <span>{formatSchedule(horario)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Endereço */}
          {config.endereco && (
            <div className="text-center">
              <h3 className="text-gray-900 font-medium mb-3 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-red-600 mr-2" />
                endereço
              </h3>
              <div className="text-sm text-gray-600 space-y-1">
                <div>{config.endereco}</div>
                {config.telefone && <div>{config.telefone}</div>}
              </div>
            </div>
          )}

          {/* Botão Abrir Mapa */}
          <Button 
            className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg"
            onClick={handleOpenMap}
            disabled={!config.endereco}
          >
            abrir mapa
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
