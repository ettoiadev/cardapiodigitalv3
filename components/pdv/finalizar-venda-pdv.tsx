"use client"

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CreditCard, DollarSign, Smartphone, Banknote, ShoppingBag, Truck, UtensilsCrossed } from 'lucide-react'
import type { FormaPagamentoPDV, TipoEntregaPDV } from '@/types/pdv'

interface FinalizarVendaPDVProps {
  tipoEntrega: TipoEntregaPDV
  formaPagamento: FormaPagamentoPDV
  observacoes: string
  trocoPara: number | null
  mesaNumero: string
  onSetTipoEntrega: (tipo: TipoEntregaPDV) => void
  onSetFormaPagamento: (forma: FormaPagamentoPDV) => void
  onSetObservacoes: (obs: string) => void
  onSetTrocoPara: (valor: number | null) => void
  onSetMesaNumero: (numero: string) => void
  onFinalizar: () => void
  podeFinalizarVenda: boolean
  total: number
}

export function FinalizarVendaPDV({
  tipoEntrega,
  formaPagamento,
  observacoes,
  trocoPara,
  mesaNumero,
  onSetTipoEntrega,
  onSetFormaPagamento,
  onSetObservacoes,
  onSetTrocoPara,
  onSetMesaNumero,
  onFinalizar,
  podeFinalizarVenda,
  total
}: FinalizarVendaPDVProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Finalizar Venda</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tipo de Entrega */}
        <div>
          <Label>Tipo de Entrega</Label>
          <div className="grid grid-cols-3 gap-2 mt-2">
            <Button
              variant={tipoEntrega === 'balcao' ? 'default' : 'outline'}
              onClick={() => onSetTipoEntrega('balcao')}
              className="flex flex-col h-auto py-3"
            >
              <ShoppingBag className="h-5 w-5 mb-1" />
              <span className="text-xs">Balcão</span>
            </Button>
            <Button
              variant={tipoEntrega === 'delivery' ? 'default' : 'outline'}
              onClick={() => onSetTipoEntrega('delivery')}
              className="flex flex-col h-auto py-3"
            >
              <Truck className="h-5 w-5 mb-1" />
              <span className="text-xs">Delivery</span>
            </Button>
            <Button
              variant={tipoEntrega === 'mesa' ? 'default' : 'outline'}
              onClick={() => onSetTipoEntrega('mesa')}
              className="flex flex-col h-auto py-3"
            >
              <UtensilsCrossed className="h-5 w-5 mb-1" />
              <span className="text-xs">Mesa</span>
            </Button>
          </div>
        </div>

        {/* Número da Mesa */}
        {tipoEntrega === 'mesa' && (
          <div>
            <Label>Número da Mesa *</Label>
            <Input
              value={mesaNumero}
              onChange={(e) => onSetMesaNumero(e.target.value)}
              placeholder="Ex: 5"
            />
          </div>
        )}

        {/* Forma de Pagamento */}
        <div>
          <Label>Forma de Pagamento</Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <Button
              variant={formaPagamento === 'dinheiro' ? 'default' : 'outline'}
              onClick={() => onSetFormaPagamento('dinheiro')}
              className="flex flex-col h-auto py-3"
            >
              <Banknote className="h-5 w-5 mb-1" />
              <span className="text-xs">Dinheiro</span>
            </Button>
            <Button
              variant={formaPagamento === 'pix' ? 'default' : 'outline'}
              onClick={() => onSetFormaPagamento('pix')}
              className="flex flex-col h-auto py-3"
            >
              <Smartphone className="h-5 w-5 mb-1" />
              <span className="text-xs">PIX</span>
            </Button>
            <Button
              variant={formaPagamento === 'credito' ? 'default' : 'outline'}
              onClick={() => onSetFormaPagamento('credito')}
              className="flex flex-col h-auto py-3"
            >
              <CreditCard className="h-5 w-5 mb-1" />
              <span className="text-xs">Crédito</span>
            </Button>
            <Button
              variant={formaPagamento === 'debito' ? 'default' : 'outline'}
              onClick={() => onSetFormaPagamento('debito')}
              className="flex flex-col h-auto py-3"
            >
              <CreditCard className="h-5 w-5 mb-1" />
              <span className="text-xs">Débito</span>
            </Button>
          </div>
        </div>

        {/* Troco */}
        {formaPagamento === 'dinheiro' && (
          <div>
            <Label>Troco para</Label>
            <Input
              type="number"
              value={trocoPara || ''}
              onChange={(e) => onSetTrocoPara(e.target.value ? parseFloat(e.target.value) : null)}
              placeholder={formatCurrency(total)}
            />
            {trocoPara && trocoPara > total && (
              <p className="text-sm text-green-600 mt-1">
                Troco: {formatCurrency(trocoPara - total)}
              </p>
            )}
          </div>
        )}

        {/* Observações */}
        <div>
          <Label>Observações</Label>
          <Textarea
            value={observacoes}
            onChange={(e) => onSetObservacoes(e.target.value)}
            placeholder="Observações do pedido..."
            rows={3}
          />
        </div>

        {/* Botão Finalizar */}
        <Button
          onClick={onFinalizar}
          disabled={!podeFinalizarVenda}
          className="w-full h-12 text-lg"
          size="lg"
        >
          <DollarSign className="h-5 w-5 mr-2" />
          Finalizar Venda - {formatCurrency(total)}
        </Button>
      </CardContent>
    </Card>
  )
}
