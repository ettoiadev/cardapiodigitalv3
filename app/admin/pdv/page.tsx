"use client"

import { AdminLayout } from '@/components/admin-layout'
import { usePDV } from '@/hooks/use-pdv'
import { ProdutoGridPDV } from '@/components/pdv/produto-grid-pdv'
import { CarrinhoPDV } from '@/components/pdv/carrinho-pdv'
import { SelecionarClientePDV } from '@/components/pdv/selecionar-cliente-pdv'
import { FinalizarVendaPDV } from '@/components/pdv/finalizar-venda-pdv'
import type { ProdutoPDV } from '@/types/pdv'
import { Calculator } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function PDVPage() {
  const router = useRouter()
  const {
    itens,
    cliente,
    tipoEntrega,
    formaPagamento,
    observacoes,
    trocoPara,
    mesaNumero,
    resumo,
    adicionarItem,
    removerItem,
    atualizarQuantidade,
    limparCarrinho,
    selecionarCliente,
    setTipoEntrega,
    setFormaPagamento,
    setObservacoes,
    setTrocoPara,
    setMesaNumero,
    finalizarVenda,
    totalItens,
    podeFinalizarVenda
  } = usePDV()

  const handleAdicionarProduto = (produto: ProdutoPDV) => {
    adicionarItem({
      produto_id: produto.id,
      nome_produto: produto.nome,
      quantidade: 1,
      preco_unitario: produto.preco
    })
  }

  const handleFinalizarVenda = async () => {
    const resultado = await finalizarVenda()
    
    if (resultado.success && resultado.pedidoId) {
      toast.success('Venda finalizada! Redirecionando para pedidos...')
      setTimeout(() => {
        router.push('/admin/pedidos')
      }, 1500)
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Calculator className="h-8 w-8 text-red-600" />
            PDV - Ponto de Venda
          </h1>
          <p className="text-gray-600 mt-1">
            Sistema de vendas rápido para balcão, delivery e mesas
          </p>
        </div>

        {/* Layout Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna Esquerda - Produtos (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            <ProdutoGridPDV onAdicionarProduto={handleAdicionarProduto} />
          </div>

          {/* Coluna Direita - Carrinho e Finalização (1/3) */}
          <div className="space-y-6">
            {/* Carrinho */}
            <div className="lg:sticky lg:top-6">
              <CarrinhoPDV
                itens={itens}
                resumo={resumo}
                onRemoverItem={removerItem}
                onAtualizarQuantidade={atualizarQuantidade}
                onLimparCarrinho={limparCarrinho}
              />
            </div>

            {/* Finalização */}
            {itens.length > 0 && (
              <div className="space-y-4">
                {/* Seleção de Cliente */}
                {tipoEntrega === 'delivery' && (
                  <SelecionarClientePDV
                    clienteSelecionado={cliente}
                    onSelecionarCliente={selecionarCliente}
                  />
                )}

                {/* Finalizar Venda */}
                <FinalizarVendaPDV
                  tipoEntrega={tipoEntrega}
                  formaPagamento={formaPagamento}
                  observacoes={observacoes}
                  trocoPara={trocoPara}
                  mesaNumero={mesaNumero}
                  onSetTipoEntrega={setTipoEntrega}
                  onSetFormaPagamento={setFormaPagamento}
                  onSetObservacoes={setObservacoes}
                  onSetTrocoPara={setTrocoPara}
                  onSetMesaNumero={setMesaNumero}
                  onFinalizar={handleFinalizarVenda}
                  podeFinalizarVenda={podeFinalizarVenda}
                  total={resumo.total}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
