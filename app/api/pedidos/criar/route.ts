import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Verificar autenticação
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Obter dados do pedido
    const body = await request.json()
    const {
      tipo_entrega,
      endereco,
      forma_pagamento,
      troco_para,
      observacoes,
      subtotal,
      taxa_entrega,
      desconto = 0,
      total,
      itens
    } = body

    // Validações básicas
    if (!tipo_entrega || !forma_pagamento || !itens || itens.length === 0) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      )
    }

    if (tipo_entrega === 'delivery' && !endereco) {
      return NextResponse.json(
        { error: 'Endereço é obrigatório para delivery' },
        { status: 400 }
      )
    }

    // Buscar dados do cliente
    const { data: cliente, error: clienteError } = await supabase
      .from('clientes')
      .select('nome, telefone')
      .eq('id', session.user.id)
      .single()

    if (clienteError) {
      console.error('Erro ao buscar cliente:', clienteError)
      return NextResponse.json(
        { error: 'Erro ao buscar dados do cliente' },
        { status: 500 }
      )
    }

    // Criar pedido
    const pedidoData: any = {
      cliente_id: session.user.id,
      nome_cliente: cliente.nome,
      telefone_cliente: cliente.telefone,
      tipo_entrega,
      forma_pagamento,
      subtotal,
      taxa_entrega: taxa_entrega || 0,
      desconto,
      total,
      status: 'pendente',
      observacoes,
      origem: 'online'
    }

    // Adicionar dados de pagamento
    if (forma_pagamento === 'dinheiro' && troco_para) {
      pedidoData.troco_para = troco_para
    }

    // Adicionar endereço se delivery
    if (tipo_entrega === 'delivery' && endereco) {
      pedidoData.endereco_rua = endereco.rua
      pedidoData.endereco_numero = endereco.numero
      pedidoData.endereco_bairro = endereco.bairro
      pedidoData.endereco_cidade = endereco.cidade
      pedidoData.endereco_estado = endereco.estado
      pedidoData.endereco_cep = endereco.cep
      pedidoData.endereco_complemento = endereco.complemento || null
    }

    const { data: pedido, error: pedidoError } = await supabase
      .from('pedidos')
      .insert(pedidoData)
      .select()
      .single()

    if (pedidoError) {
      console.error('Erro ao criar pedido:', pedidoError)
      return NextResponse.json(
        { error: 'Erro ao criar pedido' },
        { status: 500 }
      )
    }

    // Criar itens do pedido
    const itensData = itens.map((item: any) => ({
      pedido_id: pedido.id,
      produto_id: item.produto_id,
      nome_produto: item.nome,
      tamanho: item.tamanho,
      sabores: item.sabores,
      quantidade: item.quantidade,
      preco_unitario: item.preco_unitario,
      preco_total: item.preco_total,
      adicionais: item.adicionais || null,
      borda_recheada: item.borda_recheada || null,
      observacoes: item.observacoes || null
    }))

    const { error: itensError } = await supabase
      .from('pedido_itens')
      .insert(itensData)

    if (itensError) {
      console.error('Erro ao criar itens:', itensError)
      
      // Rollback: deletar pedido criado
      await supabase
        .from('pedidos')
        .delete()
        .eq('id', pedido.id)

      return NextResponse.json(
        { error: 'Erro ao criar itens do pedido' },
        { status: 500 }
      )
    }

    // Retornar sucesso
    return NextResponse.json({
      success: true,
      pedido: {
        id: pedido.id,
        numero_pedido: pedido.numero_pedido,
        status: pedido.status,
        total: pedido.total,
        created_at: pedido.created_at
      }
    })

  } catch (error: any) {
    console.error('Erro na API de pedidos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
