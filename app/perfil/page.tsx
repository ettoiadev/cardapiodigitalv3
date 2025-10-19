"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Lock, 
  Loader2,
  Save,
  ArrowLeft,
  Home
} from "lucide-react"
import { getCliente, updateCliente, updatePassword, buscarCEP, type Cliente } from "@/lib/auth"
import { toast } from "sonner"

export default function PerfilPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [cliente, setCliente] = useState<Cliente | null>(null)

  // Dados pessoais
  const [nome, setNome] = useState("")
  const [email, setEmail] = useState("")
  const [telefone, setTelefone] = useState("")

  // Endereço
  const [endereco, setEndereco] = useState("")
  const [numero, setNumero] = useState("")
  const [bairro, setBairro] = useState("")
  const [cep, setCep] = useState("")
  const [complemento, setComplemento] = useState("")
  const [referencia, setReferencia] = useState("")
  const [buscandoCep, setBuscandoCep] = useState(false)
  
  // Ref para debounce do CEP
  const cepDebounceRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // Senha
  const [novaSenha, setNovaSenha] = useState("")
  const [confirmarSenha, setConfirmarSenha] = useState("")

  useEffect(() => {
    loadCliente()
  }, [])

  const loadCliente = async () => {
    setLoading(true)

    // Buscar dados do cliente usando novo sistema
    const { data, error } = await getCliente()

    if (error) {
      toast.error(error)
      router.push("/login?returnUrl=/perfil")
      return
    }

    if (data) {
      setCliente(data)
      setNome(data.nome)
      setEmail(data.email)
      setTelefone(data.telefone)
      setEndereco(data.endereco_rua || "")
      setNumero(data.endereco_numero || "")
      setBairro(data.endereco_bairro || "")
      setCep(data.endereco_cep || "")
      setComplemento(data.endereco_complemento || "")
      setReferencia(data.endereco_referencia || "")
    }

    setLoading(false)
  }

  const formatTelefone = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3")
    }
    return numbers.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3")
  }

  const handleTelefoneChange = (value: string) => {
    setTelefone(formatTelefone(value))
  }

  const formatCep = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    return numbers.replace(/(\d{5})(\d{0,3})/, "$1-$2")
  }

  const handleCepChange = async (value: string) => {
    // Limpar debounce anterior
    if (cepDebounceRef.current) {
      clearTimeout(cepDebounceRef.current)
    }
    
    // Formatar e atualizar CEP
    const cepFormatado = formatCep(value)
    setCep(cepFormatado)
    
    // Verificar se CEP está completo (8 dígitos)
    const cepLimpo = cepFormatado.replace(/\D/g, "")
    
    if (cepLimpo.length === 8) {
      // Debounce de 500ms antes de buscar
      cepDebounceRef.current = setTimeout(async () => {
        setBuscandoCep(true)
        
        console.log('🔍 Buscando CEP:', cepLimpo)
        
        const { data, error } = await buscarCEP(cepLimpo)
        
        if (error) {
          toast.error(error)
          setBuscandoCep(false)
          return
        }
        
        if (data) {
          console.log('✅ CEP encontrado:', data)
          // Preencher campos automaticamente
          setEndereco(data.logradouro || "")
          setBairro(data.bairro || "")
          
          // Mostrar toast de sucesso
          toast.success("Endereço encontrado!")
        }
        
        setBuscandoCep(false)
      }, 500)
    } else {
      // Limpar campos se CEP incompleto
      if (cepLimpo.length === 0) {
        setEndereco("")
        setBairro("")
      }
    }
  }

  const handleSaveDadosPessoais = async () => {
    if (!cliente) return

    setSaving(true)

    // Atualizar usando novo sistema (validações automáticas)
    const { data, error } = await updateCliente(cliente.id, {
      nome,
      telefone
    })

    if (error) {
      toast.error(error)
      setSaving(false)
      return
    }

    toast.success("Dados atualizados com sucesso!")
    await loadCliente()
    setSaving(false)
  }

  const handleSaveEndereco = async () => {
    if (!cliente) return

    setSaving(true)

    // Atualizar usando novo sistema (validações automáticas)
    const { data, error } = await updateCliente(cliente.id, {
      endereco_rua: endereco || undefined,
      endereco_numero: numero || undefined,
      endereco_bairro: bairro || undefined,
      endereco_cep: cep || undefined,
      endereco_complemento: complemento || undefined,
      endereco_referencia: referencia || undefined
    })

    if (error) {
      toast.error(error)
      setSaving(false)
      return
    }

    toast.success("Endereço atualizado com sucesso!")
    await loadCliente()
    setSaving(false)
  }

  const handleChangeSenha = async () => {
    // Validação de senhas
    if (novaSenha !== confirmarSenha) {
      toast.error("As senhas não coincidem")
      return
    }

    setSaving(true)

    // Atualizar senha (validações automáticas)
    const { data, error } = await updatePassword(novaSenha)

    if (error) {
      toast.error(error)
      setSaving(false)
      return
    }

    toast.success("Senha alterada com sucesso!")
    setNovaSenha("")
    setConfirmarSenha("")
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-red-600 mx-auto" />
          <p className="mt-4 text-gray-600">Carregando perfil...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>
            <p className="text-sm text-gray-600">Gerencie suas informações pessoais</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="dados" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dados">
              <User className="h-4 w-4 mr-2" />
              Dados Pessoais
            </TabsTrigger>
            <TabsTrigger value="endereco">
              <MapPin className="h-4 w-4 mr-2" />
              Endereço
            </TabsTrigger>
            <TabsTrigger value="senha">
              <Lock className="h-4 w-4 mr-2" />
              Senha
            </TabsTrigger>
          </TabsList>

          {/* Dados Pessoais */}
          <TabsContent value="dados">
            <Card>
              <CardHeader>
                <CardTitle>Informações Pessoais</CardTitle>
                <CardDescription>
                  Atualize seus dados de cadastro
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Código do Cliente */}
                {cliente?.codigo_cliente && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Código do Cliente</p>
                        <p className="text-2xl font-bold text-red-600">{cliente.codigo_cliente}</p>
                      </div>
                      <User className="h-8 w-8 text-red-600" />
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      Use este código para identificação em pedidos por telefone
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="nome">Nome Completo</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="nome"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      className="pl-10"
                      placeholder="Seu nome completo"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      value={email}
                      disabled
                      className="pl-10 bg-gray-50"
                      placeholder="Email"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    O email não pode ser alterado
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="telefone"
                      value={telefone}
                      onChange={(e) => handleTelefoneChange(e.target.value)}
                      className="pl-10"
                      placeholder="(12) 99999-9999"
                      maxLength={15}
                    />
                  </div>
                </div>

                <Button
                  onClick={handleSaveDadosPessoais}
                  disabled={saving}
                  className="w-full bg-red-600 hover:bg-red-700"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Salvar Alterações
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Endereço */}
          <TabsContent value="endereco">
            <Card>
              <CardHeader>
                <CardTitle>Endereço Padrão</CardTitle>
                <CardDescription>
                  Configure um endereço padrão para agilizar seus pedidos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="cep">CEP</Label>
                    <div className="relative">
                      <Input
                        id="cep"
                        value={cep}
                        onChange={(e) => handleCepChange(e.target.value)}
                        placeholder="12345-678"
                        maxLength={9}
                        disabled={buscandoCep}
                      />
                      {buscandoCep && (
                        <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-gray-400" />
                      )}
                    </div>
                    {buscandoCep && (
                      <p className="text-xs text-gray-500">Buscando endereço...</p>
                    )}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="endereco">Endereço (Rua)</Label>
                    <Input
                      id="endereco"
                      value={endereco}
                      onChange={(e) => setEndereco(e.target.value)}
                      placeholder="Rua das Flores"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="numero">Número</Label>
                    <Input
                      id="numero"
                      value={numero}
                      onChange={(e) => setNumero(e.target.value)}
                      placeholder="123"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bairro">Bairro</Label>
                    <Input
                      id="bairro"
                      value={bairro}
                      onChange={(e) => setBairro(e.target.value)}
                      placeholder="Centro"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="complemento">Complemento</Label>
                    <Input
                      id="complemento"
                      value={complemento}
                      onChange={(e) => setComplemento(e.target.value)}
                      placeholder="Apto 45, Bloco B"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="referencia">Ponto de Referência</Label>
                    <Input
                      id="referencia"
                      value={referencia}
                      onChange={(e) => setReferencia(e.target.value)}
                      placeholder="Próximo ao mercado"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleSaveEndereco}
                  disabled={saving}
                  className="w-full bg-red-600 hover:bg-red-700"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Salvar Endereço
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Senha */}
          <TabsContent value="senha">
            <Card>
              <CardHeader>
                <CardTitle>Alterar Senha</CardTitle>
                <CardDescription>
                  Crie uma nova senha para sua conta
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nova-senha">Nova Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="nova-senha"
                      type="password"
                      value={novaSenha}
                      onChange={(e) => setNovaSenha(e.target.value)}
                      className="pl-10"
                      placeholder="Mínimo 6 caracteres"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmar-senha">Confirmar Nova Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="confirmar-senha"
                      type="password"
                      value={confirmarSenha}
                      onChange={(e) => setConfirmarSenha(e.target.value)}
                      className="pl-10"
                      placeholder="Digite a senha novamente"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleChangeSenha}
                  disabled={saving}
                  className="w-full bg-red-600 hover:bg-red-700"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Alterando...
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      Alterar Senha
                    </>
                  )}
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  Após alterar a senha, você continuará logado
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Links Rápidos */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link href="/meus-pedidos">
                <Button variant="outline" className="w-full">
                  Ver Meus Pedidos
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="w-full">
                  <Home className="h-4 w-4 mr-2" />
                  Voltar ao Cardápio
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
