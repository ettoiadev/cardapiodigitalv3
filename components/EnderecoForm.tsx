"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Search, MapPin, Home, Briefcase, Heart } from "lucide-react"
import { buscarCEP, type EnderecoInput, type ViaCEPResponse } from "@/lib/auth"
import { toast } from "sonner"

interface EnderecoFormProps {
  onSave: (endereco: EnderecoInput) => Promise<void>
  onCancel?: () => void
  enderecoInicial?: Partial<EnderecoInput>
  titulo?: string
  descricao?: string
}

export default function EnderecoForm({
  onSave,
  onCancel,
  enderecoInicial,
  titulo = "Novo Endereço",
  descricao = "Preencha os dados do endereço"
}: EnderecoFormProps) {
  const [loading, setLoading] = useState(false)
  const [buscandoCEP, setBuscandoCEP] = useState(false)
  
  // Estados do formulário
  const [apelido, setApelido] = useState(enderecoInicial?.apelido || "")
  const [cep, setCep] = useState(enderecoInicial?.cep || "")
  const [logradouro, setLogradouro] = useState(enderecoInicial?.logradouro || "")
  const [numero, setNumero] = useState(enderecoInicial?.numero || "")
  const [complemento, setComplemento] = useState(enderecoInicial?.complemento || "")
  const [bairro, setBairro] = useState(enderecoInicial?.bairro || "")
  const [cidade, setCidade] = useState(enderecoInicial?.cidade || "")
  const [estado, setEstado] = useState(enderecoInicial?.estado || "")
  const [referencia, setReferencia] = useState(enderecoInicial?.referencia || "")

  // Sugestões de apelidos
  const sugestoesApelido = [
    { nome: "Casa", icon: Home },
    { nome: "Trabalho", icon: Briefcase },
    { nome: "Outro", icon: Heart }
  ]

  // Formatar CEP
  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    return numbers.replace(/(\d{5})(\d{0,3})/, "$1-$2")
  }

  const handleCEPChange = (value: string) => {
    const formatted = formatCEP(value)
    setCep(formatted)
    
    // Auto-buscar quando CEP estiver completo
    const cepLimpo = value.replace(/\D/g, "")
    if (cepLimpo.length === 8) {
      handleBuscarCEP(cepLimpo)
    }
  }

  const handleBuscarCEP = async (cepValue?: string) => {
    const cepParaBuscar = cepValue || cep.replace(/\D/g, "")
    
    if (cepParaBuscar.length !== 8) {
      toast.error("CEP deve ter 8 dígitos")
      return
    }

    setBuscandoCEP(true)

    const { data, error } = await buscarCEP(cepParaBuscar)

    if (error) {
      toast.error(error)
      setBuscandoCEP(false)
      return
    }

    if (data) {
      // Preencher campos automaticamente
      setLogradouro(data.logradouro)
      setBairro(data.bairro)
      setCidade(data.localidade)
      setEstado(data.uf)
      
      toast.success("CEP encontrado!")
      
      // Focar no campo número
      setTimeout(() => {
        document.getElementById("numero")?.focus()
      }, 100)
    }

    setBuscandoCEP(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validações
    if (!apelido.trim()) {
      toast.error("Informe um apelido para o endereço (ex: Casa, Trabalho)")
      return
    }

    if (!cep.trim()) {
      toast.error("Informe o CEP")
      return
    }

    if (!logradouro.trim()) {
      toast.error("Informe o logradouro (rua/avenida)")
      return
    }

    if (!numero.trim()) {
      toast.error("Informe o número")
      return
    }

    if (!bairro.trim()) {
      toast.error("Informe o bairro")
      return
    }

    if (!cidade.trim()) {
      toast.error("Informe a cidade")
      return
    }

    if (!estado.trim()) {
      toast.error("Informe o estado")
      return
    }

    setLoading(true)

    try {
      await onSave({
        apelido: apelido.trim(),
        cep: cep.replace(/\D/g, ""),
        logradouro: logradouro.trim(),
        numero: numero.trim(),
        complemento: complemento.trim() || undefined,
        bairro: bairro.trim(),
        cidade: cidade.trim(),
        estado: estado.trim().toUpperCase(),
        referencia: referencia.trim() || undefined
      })
    } catch (error) {
      console.error("Erro ao salvar endereço:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{titulo}</CardTitle>
        <CardDescription>{descricao}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Apelido do Endereço */}
          <div className="space-y-2">
            <Label htmlFor="apelido">Apelido do Endereço *</Label>
            <div className="flex gap-2 mb-2">
              {sugestoesApelido.map((sugestao) => {
                const Icon = sugestao.icon
                return (
                  <Button
                    key={sugestao.nome}
                    type="button"
                    variant={apelido === sugestao.nome ? "default" : "outline"}
                    size="sm"
                    onClick={() => setApelido(sugestao.nome)}
                    className="flex-1"
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {sugestao.nome}
                  </Button>
                )
              })}
            </div>
            <Input
              id="apelido"
              value={apelido}
              onChange={(e) => setApelido(e.target.value)}
              placeholder="Ex: Casa, Trabalho, Casa da Mãe..."
              disabled={loading}
            />
          </div>

          {/* CEP */}
          <div className="space-y-2">
            <Label htmlFor="cep">CEP *</Label>
            <div className="flex gap-2">
              <Input
                id="cep"
                value={cep}
                onChange={(e) => handleCEPChange(e.target.value)}
                placeholder="00000-000"
                maxLength={9}
                disabled={loading || buscandoCEP}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => handleBuscarCEP()}
                disabled={loading || buscandoCEP || cep.replace(/\D/g, "").length !== 8}
              >
                {buscandoCEP ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Digite o CEP e os dados serão preenchidos automaticamente
            </p>
          </div>

          {/* Logradouro */}
          <div className="space-y-2">
            <Label htmlFor="logradouro">Rua/Avenida *</Label>
            <Input
              id="logradouro"
              value={logradouro}
              onChange={(e) => setLogradouro(e.target.value)}
              placeholder="Nome da rua"
              disabled={loading || buscandoCEP}
            />
          </div>

          {/* Número e Complemento */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numero">Número *</Label>
              <Input
                id="numero"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                placeholder="123"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="complemento">Complemento</Label>
              <Input
                id="complemento"
                value={complemento}
                onChange={(e) => setComplemento(e.target.value)}
                placeholder="Apto 45"
                disabled={loading}
              />
            </div>
          </div>

          {/* Bairro */}
          <div className="space-y-2">
            <Label htmlFor="bairro">Bairro *</Label>
            <Input
              id="bairro"
              value={bairro}
              onChange={(e) => setBairro(e.target.value)}
              placeholder="Nome do bairro"
              disabled={loading || buscandoCEP}
            />
          </div>

          {/* Cidade e Estado */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="cidade">Cidade *</Label>
              <Input
                id="cidade"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                placeholder="Nome da cidade"
                disabled={loading || buscandoCEP}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estado">UF *</Label>
              <Input
                id="estado"
                value={estado}
                onChange={(e) => setEstado(e.target.value.toUpperCase())}
                placeholder="SP"
                maxLength={2}
                disabled={loading || buscandoCEP}
              />
            </div>
          </div>

          {/* Referência */}
          <div className="space-y-2">
            <Label htmlFor="referencia">Ponto de Referência</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="referencia"
                value={referencia}
                onChange={(e) => setReferencia(e.target.value)}
                placeholder="Ex: Próximo ao mercado, portão azul..."
                className="pl-10"
                disabled={loading}
              />
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-2 pt-4">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
                className="flex-1"
              >
                Cancelar
              </Button>
            )}
            <Button
              type="submit"
              disabled={loading || buscandoCEP}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar Endereço"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
