"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Search, User, UserPlus, X } from 'lucide-react'
import type { ClientePDV } from '@/types/pdv'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface SelecionarClientePDVProps {
  clienteSelecionado: ClientePDV | null
  onSelecionarCliente: (cliente: ClientePDV | null) => void
}

export function SelecionarClientePDV({
  clienteSelecionado,
  onSelecionarCliente
}: SelecionarClientePDVProps) {
  const [open, setOpen] = useState(false)
  const [busca, setBusca] = useState('')
  const [clientes, setClientes] = useState<ClientePDV[]>([])
  const [loading, setLoading] = useState(false)
  const [modoNovo, setModoNovo] = useState(false)
  const [novoCliente, setNovoCliente] = useState<ClientePDV>({
    nome: '',
    telefone: '',
    email: '',
    endereco: '',
    bairro: '',
    cep: '',
    numero: '',
    complemento: ''
  })

  useEffect(() => {
    if (open) {
      carregarClientes()
    }
  }, [open])

  const carregarClientes = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('ativo', true)
        .order('nome')
        .limit(50)

      if (error) throw error

      const clientesFormatados: ClientePDV[] = (data || []).map(c => ({
        id: c.id,
        nome: c.nome,
        telefone: c.telefone,
        email: c.email,
        endereco: c.endereco,
        bairro: c.bairro,
        cep: c.cep,
        numero: c.numero,
        complemento: c.complemento
      }))

      setClientes(clientesFormatados)
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
      toast.error('Erro ao carregar clientes')
    } finally {
      setLoading(false)
    }
  }

  const clientesFiltrados = clientes.filter(cliente =>
    cliente.nome.toLowerCase().includes(busca.toLowerCase()) ||
    cliente.telefone.includes(busca)
  )

  const handleSelecionarCliente = (cliente: ClientePDV) => {
    onSelecionarCliente(cliente)
    setOpen(false)
    setBusca('')
    setModoNovo(false)
  }

  const handleCriarCliente = async () => {
    if (!novoCliente.nome || !novoCliente.telefone) {
      toast.error('Nome e telefone são obrigatórios')
      return
    }

    try {
      const { data, error } = await supabase
        .from('clientes')
        .insert({
          nome: novoCliente.nome,
          telefone: novoCliente.telefone,
          email: novoCliente.email || null,
          endereco: novoCliente.endereco || null,
          bairro: novoCliente.bairro || null,
          cep: novoCliente.cep || null,
          numero: novoCliente.numero || null,
          complemento: novoCliente.complemento || null,
          ativo: true
        })
        .select()
        .single()

      if (error) throw error

      const clienteCriado: ClientePDV = {
        id: data.id,
        nome: data.nome,
        telefone: data.telefone,
        email: data.email,
        endereco: data.endereco,
        bairro: data.bairro,
        cep: data.cep,
        numero: data.numero,
        complemento: data.complemento
      }

      toast.success('Cliente cadastrado com sucesso')
      handleSelecionarCliente(clienteCriado)
      setNovoCliente({
        nome: '',
        telefone: '',
        email: '',
        endereco: '',
        bairro: '',
        cep: '',
        numero: '',
        complemento: ''
      })
    } catch (error) {
      console.error('Erro ao criar cliente:', error)
      toast.error('Erro ao cadastrar cliente')
    }
  }

  return (
    <div className="space-y-2">
      <Label>Cliente</Label>
      <div className="flex gap-2">
        {clienteSelecionado ? (
          <div className="flex-1 flex items-center justify-between bg-green-50 border border-green-200 rounded-md px-3 py-2">
            <div>
              <p className="font-medium text-sm">{clienteSelecionado.nome}</p>
              <p className="text-xs text-gray-600">{clienteSelecionado.telefone}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSelecionarCliente(null)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex-1">
                <User className="h-4 w-4 mr-2" />
                Selecionar Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh]">
              <DialogHeader>
                <DialogTitle>Selecionar Cliente</DialogTitle>
                <DialogDescription>
                  Busque um cliente existente ou cadastre um novo
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Tabs */}
                <div className="flex gap-2">
                  <Button
                    variant={!modoNovo ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setModoNovo(false)}
                    className="flex-1"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Buscar
                  </Button>
                  <Button
                    variant={modoNovo ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setModoNovo(true)}
                    className="flex-1"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Novo Cliente
                  </Button>
                </div>

                {/* Buscar Cliente */}
                {!modoNovo && (
                  <>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Buscar por nome ou telefone..."
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    <ScrollArea className="h-[400px]">
                      {loading ? (
                        <p className="text-center text-gray-500 py-8">Carregando...</p>
                      ) : clientesFiltrados.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">
                          Nenhum cliente encontrado
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {clientesFiltrados.map(cliente => (
                            <div
                              key={cliente.id}
                              onClick={() => handleSelecionarCliente(cliente)}
                              className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                            >
                              <p className="font-medium">{cliente.nome}</p>
                              <p className="text-sm text-gray-600">{cliente.telefone}</p>
                              {cliente.endereco && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {cliente.endereco}, {cliente.numero}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </>
                )}

                {/* Novo Cliente */}
                {modoNovo && (
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3 pr-4">
                      <div>
                        <Label>Nome *</Label>
                        <Input
                          value={novoCliente.nome}
                          onChange={(e) => setNovoCliente({ ...novoCliente, nome: e.target.value })}
                          placeholder="Nome completo"
                        />
                      </div>

                      <div>
                        <Label>Telefone *</Label>
                        <Input
                          value={novoCliente.telefone}
                          onChange={(e) => setNovoCliente({ ...novoCliente, telefone: e.target.value })}
                          placeholder="(00) 00000-0000"
                        />
                      </div>

                      <div>
                        <Label>Email</Label>
                        <Input
                          type="email"
                          value={novoCliente.email}
                          onChange={(e) => setNovoCliente({ ...novoCliente, email: e.target.value })}
                          placeholder="email@exemplo.com"
                        />
                      </div>

                      <div>
                        <Label>CEP</Label>
                        <Input
                          value={novoCliente.cep}
                          onChange={(e) => setNovoCliente({ ...novoCliente, cep: e.target.value })}
                          placeholder="00000-000"
                        />
                      </div>

                      <div>
                        <Label>Endereço</Label>
                        <Input
                          value={novoCliente.endereco}
                          onChange={(e) => setNovoCliente({ ...novoCliente, endereco: e.target.value })}
                          placeholder="Rua, Avenida..."
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Número</Label>
                          <Input
                            value={novoCliente.numero}
                            onChange={(e) => setNovoCliente({ ...novoCliente, numero: e.target.value })}
                            placeholder="123"
                          />
                        </div>
                        <div>
                          <Label>Bairro</Label>
                          <Input
                            value={novoCliente.bairro}
                            onChange={(e) => setNovoCliente({ ...novoCliente, bairro: e.target.value })}
                            placeholder="Centro"
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Complemento</Label>
                        <Input
                          value={novoCliente.complemento}
                          onChange={(e) => setNovoCliente({ ...novoCliente, complemento: e.target.value })}
                          placeholder="Apto, Bloco..."
                        />
                      </div>

                      <Button
                        onClick={handleCriarCliente}
                        className="w-full"
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Cadastrar Cliente
                      </Button>
                    </div>
                  </ScrollArea>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  )
}
