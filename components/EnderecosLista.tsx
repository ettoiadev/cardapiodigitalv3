"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { 
  Home, 
  Briefcase, 
  MapPin, 
  Star, 
  Edit, 
  Trash2,
  Check
} from "lucide-react"
import { type EnderecoCliente } from "@/lib/auth"

interface EnderecosListaProps {
  enderecos: EnderecoCliente[]
  onEdit: (endereco: EnderecoCliente) => void
  onDelete: (id: string) => Promise<void>
  onSetPrincipal: (id: string) => Promise<void>
  onSelect?: (endereco: EnderecoCliente) => void
  enderecoSelecionado?: string | null
}

export default function EnderecosLista({
  enderecos,
  onEdit,
  onDelete,
  onSetPrincipal,
  onSelect,
  enderecoSelecionado
}: EnderecosListaProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const getIcon = (apelido: string) => {
    const lower = apelido.toLowerCase()
    if (lower.includes("casa")) return Home
    if (lower.includes("trabalho")) return Briefcase
    return MapPin
  }

  const handleDeleteClick = (id: string) => {
    setDeletingId(id)
    setShowDeleteDialog(true)
  }

  const handleConfirmDelete = async () => {
    if (deletingId) {
      await onDelete(deletingId)
      setShowDeleteDialog(false)
      setDeletingId(null)
    }
  }

  if (enderecos.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">Nenhum endereço cadastrado</p>
          <p className="text-sm text-gray-500">
            Adicione um endereço para facilitar suas compras
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="space-y-3">
        {enderecos.map((endereco) => {
          const Icon = getIcon(endereco.apelido)
          const isSelected = enderecoSelecionado === endereco.id
          
          return (
            <Card 
              key={endereco.id}
              className={`transition-all ${
                isSelected 
                  ? "ring-2 ring-red-600 border-red-600" 
                  : "hover:border-gray-400"
              } ${onSelect ? "cursor-pointer" : ""}`}
              onClick={() => onSelect?.(endereco)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  {/* Ícone e Informações */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                      ${endereco.principal ? "bg-red-100" : "bg-gray-100"}
                    `}>
                      <Icon className={`h-5 w-5 ${
                        endereco.principal ? "text-red-600" : "text-gray-600"
                      }`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      {/* Apelido e Badge Principal */}
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">
                          {endereco.apelido}
                        </h3>
                        {endereco.principal && (
                          <Badge variant="default" className="bg-red-600">
                            <Star className="h-3 w-3 mr-1" />
                            Principal
                          </Badge>
                        )}
                        {isSelected && (
                          <Badge variant="outline" className="border-red-600 text-red-600">
                            <Check className="h-3 w-3 mr-1" />
                            Selecionado
                          </Badge>
                        )}
                      </div>
                      
                      {/* Endereço Completo */}
                      <p className="text-sm text-gray-600 mb-1">
                        {endereco.logradouro}, {endereco.numero}
                        {endereco.complemento && ` - ${endereco.complemento}`}
                      </p>
                      <p className="text-sm text-gray-600 mb-1">
                        {endereco.bairro} - {endereco.cidade}/{endereco.estado}
                      </p>
                      <p className="text-sm text-gray-500">
                        CEP: {endereco.cep.replace(/(\d{5})(\d{3})/, "$1-$2")}
                      </p>
                      
                      {/* Referência */}
                      {endereco.referencia && (
                        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {endereco.referencia}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Ações */}
                  {!onSelect && (
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      {!endereco.principal && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onSetPrincipal(endereco.id)}
                          className="text-xs"
                        >
                          <Star className="h-3 w-3 mr-1" />
                          Tornar Principal
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(endereco)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClick(endereco.id)}
                        disabled={endereco.principal}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Endereço</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este endereço? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
