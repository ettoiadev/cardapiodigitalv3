"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { ShoppingCart, Trash2, Plus, Minus } from 'lucide-react'
import type { ItemCarrinhoPDV, ResumoVendaPDV } from '@/types/pdv'

interface CarrinhoPDVProps {
  itens: ItemCarrinhoPDV[]
  resumo: ResumoVendaPDV
  onRemoverItem: (itemId: string) => void
  onAtualizarQuantidade: (itemId: string, quantidade: number) => void
  onLimparCarrinho: () => void
}

export function CarrinhoPDV({
  itens,
  resumo,
  onRemoverItem,
  onAtualizarQuantidade,
  onLimparCarrinho
}: CarrinhoPDVProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const totalItens = itens.reduce((sum, item) => sum + item.quantidade, 0)

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Carrinho
            {totalItens > 0 && (
              <Badge variant="secondary">{totalItens}</Badge>
            )}
          </CardTitle>
          {itens.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onLimparCarrinho}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Limpar
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Lista de Itens */}
        <ScrollArea className="flex-1 px-4">
          {itens.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Carrinho vazio</p>
              <p className="text-gray-400 text-xs mt-1">
                Adicione produtos para começar
              </p>
            </div>
          ) : (
            <div className="space-y-3 pb-4">
              {itens.map(item => (
                <div
                  key={item.id}
                  className="bg-gray-50 rounded-lg p-3 space-y-2"
                >
                  {/* Nome e Preço */}
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{item.nome_produto}</h4>
                      {item.tamanho && (
                        <p className="text-xs text-gray-600">
                          Tamanho: {item.tamanho}
                        </p>
                      )}
                      {item.observacoes && (
                        <p className="text-xs text-gray-600 italic">
                          Obs: {item.observacoes}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoverItem(item.id)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Quantidade e Total */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onAtualizarQuantidade(item.id, item.quantidade - 1)}
                        className="h-7 w-7 p-0"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="font-medium text-sm w-8 text-center">
                        {item.quantidade}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onAtualizarQuantidade(item.id, item.quantidade + 1)}
                        className="h-7 w-7 p-0"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-600">
                        {formatCurrency(item.preco_unitario)} un.
                      </p>
                      <p className="font-bold text-sm text-green-600">
                        {formatCurrency(item.preco_total)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Resumo Financeiro */}
        {itens.length > 0 && (
          <div className="border-t bg-white p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">{formatCurrency(resumo.subtotal)}</span>
            </div>

            {resumo.taxa_entrega > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Taxa de Entrega:</span>
                <span className="font-medium">{formatCurrency(resumo.taxa_entrega)}</span>
              </div>
            )}

            {resumo.desconto > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Desconto:</span>
                <span className="font-medium">-{formatCurrency(resumo.desconto)}</span>
              </div>
            )}

            <Separator />

            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span className="text-green-600">{formatCurrency(resumo.total)}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
