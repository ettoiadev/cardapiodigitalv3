"use client"

import { useEffect, useState, useRef } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// AdminLayout removido - componente será usado dentro de uma aba
import { supabase } from "@/lib/supabase"
import { formatCurrency, formatCurrencyInput, parseCurrencyInput } from "@/lib/currency-utils"
import { 
  Save, 
  Settings, 
  Store, 
  MapPin, 
  Phone, 
  MessageCircle, 
  Bike, 
  DollarSign, 
  Clock, 
  CreditCard, 
  Image,
  CheckCircle2,
  AlertCircle,
  Upload,
  FileImage,
  Loader2,
  Trash2,
  Key,
  User,
  Lock,
  Instagram,
  Facebook,
  Share2,
  QrCode,
  Banknote,
  UtensilsCrossed,
  ImageIcon,
  RotateCcw,
  Eye,
  EyeOff
} from "lucide-react"

interface PizzariaConfig {
  id?: string
  nome: string
  foto_capa: string
  foto_perfil: string
  taxa_entrega: number
  tempo_entrega_min: number
  tempo_entrega_max: number
  valor_minimo: number
  aceita_dinheiro: boolean
  aceita_cartao: boolean
  aceita_pix: boolean
  aceita_ticket_alimentacao: boolean
  endereco: string
  telefone: string
  whatsapp: string
  horario_funcionamento: any
  whatsapp_ativo: boolean
  whatsapp_link: string
  instagram_ativo: boolean
  instagram_link: string
  facebook_ativo: boolean
  facebook_link: string
  maps_ativo: boolean
  maps_link: string
  compartilhar_ativo: boolean
  descricao_pizzas: string
}

export default function GeralTab() {
  const { admin, updateCredentials } = useAuth()
  const daysOrder = ["segunda", "terca", "quarta", "quinta", "sexta", "sabado", "domingo"]
  
  const [config, setConfig] = useState<PizzariaConfig>({
    nome: "",
    foto_capa: "",
    foto_perfil: "",
    taxa_entrega: 5.0,
    tempo_entrega_min: 60,
    tempo_entrega_max: 90,
    valor_minimo: 20.0,
    aceita_dinheiro: true,
    aceita_cartao: true,
    aceita_pix: true,
    aceita_ticket_alimentacao: false,
    endereco: "",
    telefone: "",
    whatsapp: "",
    horario_funcionamento: {
      segunda: "18:00-23:00",
      terca: "18:00-23:00",
      quarta: "18:00-23:00",
      quinta: "18:00-23:00",
      sexta: "18:00-00:00",
      sabado: "18:00-00:00",
      domingo: "18:00-23:00",
    },
    whatsapp_ativo: true,
    whatsapp_link: "",
    instagram_ativo: false,
    instagram_link: "",
    facebook_ativo: false,
    facebook_link: "",
    maps_ativo: false,
    maps_link: "",
    compartilhar_ativo: true,
    descricao_pizzas: "Pizzas doces e salgadas (Tradicional 8 fatias / Broto 4 fatias)",
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [uploadingCapa, setUploadingCapa] = useState(false)
  const [uploadingPerfil, setUploadingPerfil] = useState(false)
  
  // Estados para alteração de credenciais
  const [novoEmail, setNovoEmail] = useState("")
  const [novaSenha, setNovaSenha] = useState("")
  const [confirmarSenha, setConfirmarSenha] = useState("")
  const [loadingCredentials, setLoadingCredentials] = useState(false)
  const [credentialsMessage, setCredentialsMessage] = useState("")

  // Estados para valores formatados
  const [taxaEntregaFormatada, setTaxaEntregaFormatada] = useState("")
  const [valorMinimoFormatado, setValorMinimoFormatado] = useState("")

  // Refs para inputs de arquivo
  const capaInputRef = useRef<HTMLInputElement>(null)
  const perfilInputRef = useRef<HTMLInputElement>(null)
  const carouselInputRef = useRef<HTMLInputElement>(null)

  // Estados para o carousel
  const [carouselConfig, setCarouselConfig] = useState({
    ativo: true,
    intervalo_segundos: 5
  })
  const [carouselImages, setCarouselImages] = useState<any[]>([])
  const [uploadingCarousel, setUploadingCarousel] = useState(false)
  const [carouselMessage, setCarouselMessage] = useState("")

  useEffect(() => {
    loadConfig()
    loadCarouselData()
  }, [])

  // Função para redimensionar imagem
  const resizeImage = (file: File, maxWidth: number, maxHeight: number): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new window.Image()

      if (!ctx) {
        reject(new Error('Não foi possível obter contexto do canvas'))
        return
      }

      img.onload = () => {
        // Calcular novas dimensões mantendo proporção
        let { width, height } = img
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height
            height = maxHeight
          }
        }

        canvas.width = width
        canvas.height = height

        // Desenhar imagem redimensionada
        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Erro ao processar imagem'))
          }
        }, 'image/jpeg', 0.9)
      }

      img.onerror = () => reject(new Error('Erro ao carregar imagem'))
      img.src = URL.createObjectURL(file)
    })
  }

  // Função para fazer upload da imagem
  const uploadImage = async (file: File | Blob, folder: string, originalFileName?: string): Promise<string> => {
    try {
      // Verificar se temos um nome de arquivo válido
      let baseName = 'image'
      if (file instanceof File && file.name) {
        baseName = file.name.replace(/[^a-zA-Z0-9.-]/g, '')
      } else if (originalFileName) {
        baseName = originalFileName.replace(/[^a-zA-Z0-9.-]/g, '')
      }
      
      // Garantir que temos uma extensão
      if (!baseName.includes('.')) {
        baseName += '.jpg'
      }
      
      const fileName = `${folder}/${Date.now()}-${baseName}`
      
      let uploadResult = await supabase.storage
        .from('images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadResult.error) {
        // Se o bucket não existir, tentar criar
        if (uploadResult.error.message.includes('Bucket not found')) {
          await supabase.storage.createBucket('images', {
            public: true,
            allowedMimeTypes: ['image/*'],
            fileSizeLimit: 5242880 // 5MB
          })
          
          // Tentar upload novamente
          uploadResult = await supabase.storage
            .from('images')
            .upload(fileName, file, {
              cacheControl: '3600',
              upsert: false
            })
          
          if (uploadResult.error) throw uploadResult.error
        } else {
          throw uploadResult.error
        }
      }

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from('images')
        .getPublicUrl(fileName)

      return urlData.publicUrl
    } catch (error) {
      console.error('Erro no upload:', error)
      if (error instanceof Error) {
        throw new Error(`Falha no upload: ${error.message}`)
      }
      throw new Error('Falha ao carregar imagem. Verifique o formato e tente novamente.')
    }
  }

  // Função para processar upload da foto de capa
  const handleCapaUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar arquivo
    if (!file.name) {
      setMessage("Falha ao carregar imagem. Arquivo inválido.")
      return
    }

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      setMessage("Falha ao carregar imagem. Verifique o formato e tente novamente.")
      return
    }

    // Validar tamanho (5MB)
    if (file.size > 5242880) {
      setMessage("Falha ao carregar imagem. Arquivo muito grande (máximo 5MB).")
      return
    }

    setUploadingCapa(true)
    try {
      // Redimensionar para 1200x675px (16:9)
      const resizedFile = await resizeImage(file, 1200, 675)
      const url = await uploadImage(resizedFile, 'capas', file.name)
      
      setConfig({ ...config, foto_capa: url })
      setMessage("Foto de capa carregada com sucesso!")
    } catch (error) {
      console.error('Erro ao processar capa:', error)
      setMessage("Falha ao carregar imagem. Verifique o formato e tente novamente.")
    } finally {
      setUploadingCapa(false)
      if (capaInputRef.current) {
        capaInputRef.current.value = ''
      }
    }
  }

  // Função para processar upload da foto de perfil
  const handlePerfilUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar arquivo
    if (!file.name) {
      setMessage("Falha ao carregar imagem. Arquivo inválido.")
      return
    }

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      setMessage("Falha ao carregar imagem. Verifique o formato e tente novamente.")
      return
    }

    // Validar tamanho (5MB)
    if (file.size > 5242880) {
      setMessage("Falha ao carregar imagem. Arquivo muito grande (máximo 5MB).")
      return
    }

    setUploadingPerfil(true)
    try {
      // Redimensionar para 300x300px (1:1)
      const resizedFile = await resizeImage(file, 300, 300)
      const url = await uploadImage(resizedFile, 'perfis', file.name)
      
      setConfig({ ...config, foto_perfil: url })
      setMessage("Foto de perfil carregada com sucesso!")
    } catch (error) {
      console.error('Erro ao processar perfil:', error)
      setMessage("Falha ao carregar imagem. Verifique o formato e tente novamente.")
    } finally {
      setUploadingPerfil(false)
      if (perfilInputRef.current) {
        perfilInputRef.current.value = ''
      }
    }
  }

  // Função para extrair o nome do arquivo da URL do Supabase
  const extractFilePathFromUrl = (url: string): string | null => {
    try {
      // URL padrão do Supabase: https://projeto.supabase.co/storage/v1/object/public/bucket/path/file.jpg
      const urlParts = url.split('/storage/v1/object/public/images/')
      if (urlParts.length > 1) {
        return urlParts[1]
      }
      return null
    } catch (error) {
      console.error('Erro ao extrair caminho do arquivo:', error)
      return null
    }
  }

  // Função para excluir foto de capa
  const handleDeleteCapa = async () => {
    if (!config.foto_capa) return

    const confirmDelete = confirm("Tem certeza que deseja excluir a foto de capa?")
    if (!confirmDelete) return

    try {
      // Extrair caminho do arquivo da URL
      const filePath = extractFilePathFromUrl(config.foto_capa)
      
      if (filePath) {
        // Tentar remover do Supabase Storage
        const { error: storageError } = await supabase.storage
          .from('images')
          .remove([filePath])
        
        if (storageError) {
          console.warn('Aviso: Não foi possível remover arquivo do storage:', storageError.message)
        }
      }

      // Atualizar estado local
      setConfig({ ...config, foto_capa: "" })
      
      // Atualizar banco de dados
      const { error: dbError } = await supabase
        .from('pizzaria_config')
        .update({ foto_capa: null })
        .eq('id', config.id)

      if (dbError) {
        console.error('Erro ao atualizar banco:', dbError)
        setMessage("Erro ao excluir imagem. Tente novamente.")
      } else {
        setMessage("Imagem excluída com sucesso.")
      }
    } catch (error) {
      console.error('Erro ao excluir capa:', error)
      setMessage("Erro ao excluir imagem. Tente novamente.")
    }
  }

  // Função para excluir foto de perfil
  const handleDeletePerfil = async () => {
    if (!config.foto_perfil) return

    const confirmDelete = confirm("Tem certeza que deseja excluir a foto de perfil?")
    if (!confirmDelete) return

    try {
      // Extrair caminho do arquivo da URL
      const filePath = extractFilePathFromUrl(config.foto_perfil)
      
      if (filePath) {
        // Tentar remover do Supabase Storage
        const { error: storageError } = await supabase.storage
          .from('images')
          .remove([filePath])
        
        if (storageError) {
          console.warn('Aviso: Não foi possível remover arquivo do storage:', storageError.message)
        }
      }

      // Atualizar estado local
      setConfig({ ...config, foto_perfil: "" })
      
      // Atualizar banco de dados
      const { error: dbError } = await supabase
        .from('pizzaria_config')
        .update({ foto_perfil: null })
        .eq('id', config.id)

      if (dbError) {
        console.error('Erro ao atualizar banco:', dbError)
        setMessage("Erro ao excluir imagem. Tente novamente.")
      } else {
        setMessage("Imagem excluída com sucesso.")
      }
    } catch (error) {
      console.error('Erro ao excluir perfil:', error)
      setMessage("Erro ao excluir imagem. Tente novamente.")
    }
  }

  const loadConfig = async () => {
    try {
      const { data, error } = await supabase.from("pizzaria_config").select("*").single()

      if (error && error.code !== "PGRST116") {
        console.error("Erro ao carregar configurações:", error)
        return
      }

      if (data) {
        const configData = {
          ...data,
          nome: data.nome || "",
          foto_capa: data.foto_capa || "",
          foto_perfil: data.foto_perfil || "",
          endereco: data.endereco || "",
          telefone: data.telefone || "",
          whatsapp: data.whatsapp || "",
          aceita_pix: data.aceita_pix !== undefined ? data.aceita_pix : true,
          aceita_ticket_alimentacao: data.aceita_ticket_alimentacao !== undefined ? data.aceita_ticket_alimentacao : false,
          horario_funcionamento: data.horario_funcionamento || {
            segunda: "18:00-23:00",
            terca: "18:00-23:00",
            quarta: "18:00-23:00",
            quinta: "18:00-23:00",
            sexta: "18:00-00:00",
            sabado: "18:00-00:00",
            domingo: "18:00-23:00",
          },
          whatsapp_ativo: data.whatsapp_ativo !== undefined ? data.whatsapp_ativo : true,
          whatsapp_link: data.whatsapp_link || "",
          instagram_ativo: data.instagram_ativo !== undefined ? data.instagram_ativo : false,
          instagram_link: data.instagram_link || "",
          facebook_ativo: data.facebook_ativo !== undefined ? data.facebook_ativo : false,
          facebook_link: data.facebook_link || "",
          maps_ativo: data.maps_ativo !== undefined ? data.maps_ativo : false,
          maps_link: data.maps_link || "",
          compartilhar_ativo: data.compartilhar_ativo !== undefined ? data.compartilhar_ativo : true,
          descricao_pizzas: data.descricao_pizzas || "Pizzas doces e salgadas (Tradicional 8 fatias / Broto 4 fatias)",
        }
        setConfig(configData)
        
        // Formatar valores monetários
        setTaxaEntregaFormatada(formatCurrencyInput((configData.taxa_entrega * 100).toString()))
        setValorMinimoFormatado(formatCurrencyInput((configData.valor_minimo * 100).toString()))
      } else {
        // Valores padrão formatados
        setTaxaEntregaFormatada(formatCurrencyInput("500")) // R$ 5,00
        setValorMinimoFormatado(formatCurrencyInput("2000")) // R$ 20,00
      }
    } catch (error) {
      console.error("Erro ao conectar com Supabase:", error)
    }
  }

  // Funções para gerenciar o carousel
  const loadCarouselData = async () => {
    try {
      // Carregar configuração do carousel
      const { data: configData } = await supabase
        .from('carousel_config')
        .select('ativo, intervalo_segundos')
        .single()

      if (configData) {
        setCarouselConfig(configData)
      }

      // Carregar imagens do carousel
      const { data: imagesData } = await supabase
        .from('carousel_images')
        .select('id, url, ordem, ativo')
        .order('ordem')

      if (imagesData) {
        setCarouselImages(imagesData)
      }
    } catch (error) {
      console.error('Erro ao carregar dados do carousel:', error)
      setCarouselMessage(`Erro ao carregar dados: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }

  const handleCarouselUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    // Verificar se já temos 10 imagens
    if (carouselImages.length >= 10) {
      setCarouselMessage("Máximo de 10 imagens permitidas no carousel")
      return
    }

    setUploadingCarousel(true)
    setCarouselMessage("")

    try {
      for (let i = 0; i < files.length && carouselImages.length + i < 10; i++) {
        const file = files[i]
        
        // Validar tipo de arquivo
        if (!file.type.startsWith('image/')) {
          console.warn(`Arquivo ${file.name} não é uma imagem válida`)
          continue
        }
        
        // Redimensionar imagem para otimizar
        const resizedBlob = await resizeImage(file, 1200, 320)
        
        // Upload da imagem
        const imageUrl = await uploadImage(resizedBlob, 'carousel', file.name)
        
        // Salvar no banco
        const nextOrdem = carouselImages.length > 0 ? Math.max(...carouselImages.map(img => img.ordem)) + 1 : 1
        
        const { data, error } = await supabase
          .from('carousel_images')
          .insert({
            url: imageUrl,
            ordem: nextOrdem,
            ativo: true
          })
          .select()
          .single()

        if (error) {
          console.error('Erro ao salvar imagem do carousel:', error)
          setCarouselMessage(`Erro ao salvar imagem: ${error.message}`)
          continue
        }

        // Adicionar à lista local
        setCarouselImages(prev => [...prev, data])
      }

      setCarouselMessage("Imagens do carousel enviadas com sucesso!")
      
      // Limpar input
      if (carouselInputRef.current) {
        carouselInputRef.current.value = ""
      }
    } catch (error) {
      console.error('Erro no upload do carousel:', error)
      setCarouselMessage("Erro ao enviar imagens do carousel")
    } finally {
      setUploadingCarousel(false)
    }
  }

  const handleDeleteCarouselImage = async (imageId: string, imageUrl: string) => {
    try {
      // Deletar do banco
      const { error } = await supabase
        .from('carousel_images')
        .delete()
        .eq('id', imageId)

      if (error) {
        console.error('Erro ao deletar imagem:', error)
        return
      }

      // Deletar do storage
      const filePath = extractFilePathFromUrl(imageUrl)
      if (filePath) {
        await supabase.storage
          .from('images')
          .remove([filePath])
      }

      // Remover da lista local
      setCarouselImages(prev => prev.filter(img => img.id !== imageId))
      setCarouselMessage("Imagem removida com sucesso!")
    } catch (error) {
      console.error('Erro ao deletar imagem:', error)
      setCarouselMessage("Erro ao deletar imagem")
    }
  }

  const handleToggleCarouselImage = async (imageId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('carousel_images')
        .update({ ativo: !currentStatus })
        .eq('id', imageId)

      if (error) {
        console.error('Erro ao alterar status da imagem:', error)
        return
      }

      // Atualizar lista local
      setCarouselImages(prev => 
        prev.map(img => 
          img.id === imageId ? { ...img, ativo: !currentStatus } : img
        )
      )
      
      setCarouselMessage(`Imagem ${!currentStatus ? 'ativada' : 'desativada'} com sucesso!`)
    } catch (error) {
      console.error('Erro ao alterar status da imagem:', error)
      setCarouselMessage("Erro ao alterar status da imagem")
    }
  }

  const handleUpdateCarouselOrder = async (imageId: string, newOrder: number) => {
    try {
      const { error } = await supabase
        .from('carousel_images')
        .update({ ordem: newOrder })
        .eq('id', imageId)

      if (error) {
        console.error('Erro ao alterar ordem da imagem:', error)
        return
      }

      // Atualizar lista local
      setCarouselImages(prev => 
        prev.map(img => 
          img.id === imageId ? { ...img, ordem: newOrder } : img
        ).sort((a, b) => a.ordem - b.ordem)
      )
    } catch (error) {
      console.error('Erro ao alterar ordem da imagem:', error)
    }
  }

  const handleSaveCarouselConfig = async () => {
    try {
      const { error } = await supabase
        .from('carousel_config')
        .update({
          ativo: carouselConfig.ativo,
          intervalo_segundos: carouselConfig.intervalo_segundos
        })
        .eq('id', (await supabase.from('carousel_config').select('id').single()).data?.id)

      if (error) {
        console.error('Erro ao salvar configuração do carousel:', error)
        setCarouselMessage("Erro ao salvar configuração")
        return
      }

      setCarouselMessage("Configuração do carousel salva com sucesso!")
    } catch (error) {
      console.error('Erro ao salvar configuração do carousel:', error)
      setCarouselMessage("Erro ao salvar configuração")
    }
  }

  const updateHorario = (dia: string, horario: string) => {
    setConfig({
      ...config,
      horario_funcionamento: {
        ...config.horario_funcionamento,
        [dia]: horario,
      },
    })
  }

  // Novas funções para gerenciar horários separados
  const parseHorario = (horario: string) => {
    if (!horario || horario.toLowerCase() === 'fechado') {
      return { inicio: '', fim: '', fechado: true }
    }
    
    const match = horario.match(/(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})/)
    if (match) {
      const [, inicioHora, inicioMin, fimHora, fimMin] = match
      return {
        inicio: `${inicioHora.padStart(2, '0')}:${inicioMin}`,
        fim: `${fimHora.padStart(2, '0')}:${fimMin}`,
        fechado: false
      }
    }
    
    return { inicio: '', fim: '', fechado: true }
  }

  const updateHorarioSeparado = (dia: string, inicio: string, fim: string, fechado: boolean) => {
    let novoHorario: string
    
    if (fechado) {
      novoHorario = 'Fechado'
    } else if (inicio && fim) {
      novoHorario = `${inicio}-${fim}`
    } else {
      novoHorario = 'Fechado'
    }
    
    updateHorario(dia, novoHorario)
  }

  const handleSave = async () => {
    setLoading(true)
    setMessage("")

    try {
      const { data, error } = await supabase.from("pizzaria_config").upsert(config).select().single()

      if (error) {
        console.error("Erro ao salvar:", error)
        setMessage("Erro ao salvar configurações")
      } else {
        setConfig(data)
        setMessage("Configurações salvas com sucesso!")
      }
    } catch (error) {
      console.error("Erro ao salvar:", error)
      setMessage("Erro ao salvar configurações")
    }

    setLoading(false)
  }

  // Funções específicas para salvar cada seção
  const handleSaveBasicInfo = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from("pizzaria_config").upsert(config).select().single()
      if (error) {
        console.error("Erro ao salvar informações básicas:", error)
        setMessage("Erro ao salvar informações básicas")
      } else {
        setConfig(data)
        setMessage("Informações básicas salvas com sucesso!")
      }
    } catch (error) {
      console.error("Erro ao salvar:", error)
      setMessage("Erro ao salvar informações básicas")
    }
    setLoading(false)
  }

  const handleSaveDeliverySettings = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from("pizzaria_config").upsert(config).select().single()
      if (error) {
        console.error("Erro ao salvar configurações de entrega:", error)
        setMessage("Erro ao salvar configurações de entrega")
      } else {
        setConfig(data)
        setMessage("Configurações de entrega salvas com sucesso!")
      }
    } catch (error) {
      console.error("Erro ao salvar:", error)
      setMessage("Erro ao salvar configurações de entrega")
    }
    setLoading(false)
  }

  const handleSaveSchedule = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from("pizzaria_config").upsert(config).select().single()
      if (error) {
        console.error("Erro ao salvar horários:", error)
        setMessage("Erro ao salvar horários de funcionamento")
      } else {
        setConfig(data)
        setMessage("Horários de funcionamento salvos com sucesso!")
      }
    } catch (error) {
      console.error("Erro ao salvar:", error)
      setMessage("Erro ao salvar horários de funcionamento")
    }
    setLoading(false)
  }

  const handleSaveImages = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from("pizzaria_config").upsert(config).select().single()
      if (error) {
        console.error("Erro ao salvar imagens:", error)
        setMessage("Erro ao salvar imagens")
      } else {
        setConfig(data)
        setMessage("Imagens salvas com sucesso!")
      }
    } catch (error) {
      console.error("Erro ao salvar:", error)
      setMessage("Erro ao salvar imagens")
    }
    setLoading(false)
  }

  const handleUpdateCredentials = async () => {
    setLoadingCredentials(true)
    setCredentialsMessage("")

    // Validações
    if (!novoEmail.trim() || !novaSenha.trim()) {
      setCredentialsMessage("Por favor, preencha todos os campos obrigatórios.")
      setLoadingCredentials(false)
      return
    }

    if (novaSenha !== confirmarSenha) {
      setCredentialsMessage("As senhas não coincidem.")
      setLoadingCredentials(false)
      return
    }

    if (novaSenha.length < 6) {
      setCredentialsMessage("A senha deve ter pelo menos 6 caracteres.")
      setLoadingCredentials(false)
      return
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(novoEmail)) {
      setCredentialsMessage("Por favor, insira um email válido.")
      setLoadingCredentials(false)
      return
    }

    try {
      const success = await updateCredentials(novoEmail, novaSenha)
      
      if (success) {
        setCredentialsMessage("Credenciais atualizadas com sucesso!")
        setNovoEmail("")
        setNovaSenha("")
        setConfirmarSenha("")
        
        // Opcional: Logout após 3 segundos para forçar novo login
        setTimeout(() => {
          setCredentialsMessage("Você será redirecionado para fazer login com as novas credenciais.")
        }, 2000)
      } else {
        setCredentialsMessage("Erro ao atualizar credenciais. Tente novamente.")
      }
    } catch (error) {
      console.error("Erro ao atualizar credenciais:", error)
      setCredentialsMessage("Erro ao atualizar credenciais. Tente novamente.")
    }

    setLoadingCredentials(false)
  }

  return (
      <div className="space-y-6">{/* Header removido - título está na aba */}

        {/* Success/Error Message */}
        {message && (
          <Card className={`shadow-lg border-0 rounded-2xl overflow-hidden ${message.includes("sucesso") ? "border-l-4 border-l-green-500" : "border-l-4 border-l-red-500"}`}>
            <CardContent className="p-6">
              <div className={`flex items-center gap-3 ${message.includes("sucesso") ? "text-green-700" : "text-red-700"}`}>
                {message.includes("sucesso") ? (
                  <CheckCircle2 className="h-6 w-6" />
                ) : (
                  <AlertCircle className="h-6 w-6" />
                )}
                <span className="font-medium">{message}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Seção de Alteração de Credenciais */}
        <Card className="shadow-lg border-0 bg-white rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50 border-b border-red-100 p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Key className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Alterar Credenciais de Acesso
                </CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  Atualize seu email e senha de acesso ao painel administrativo
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            {/* Mensagem de credenciais */}
            {credentialsMessage && (
              <div className={`mb-6 p-4 rounded-lg ${credentialsMessage.includes("sucesso") ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                <div className="flex items-center gap-2">
                  {credentialsMessage.includes("sucesso") ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <AlertCircle className="h-5 w-5" />
                  )}
                  <span className="font-medium">{credentialsMessage}</span>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="text-sm text-gray-600 mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-800">Usuário atual: {admin?.email}</span>
                </div>
                <p className="text-blue-700">
                  Após alterar as credenciais, você precisará fazer login novamente com os novos dados.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="novo-email" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Novo Email *
                  </Label>
                  <Input
                    id="novo-email"
                    type="email"
                    value={novoEmail}
                    onChange={(e) => setNovoEmail(e.target.value)}
                    placeholder="novo@email.com"
                    className="mt-1 rounded-lg border-gray-200 focus:border-red-300 focus:ring-red-200"
                    disabled={loadingCredentials}
                  />
                </div>

                <div>
                  <Label htmlFor="nova-senha" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Nova Senha *
                  </Label>
                  <Input
                    id="nova-senha"
                    type="password"
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="mt-1 rounded-lg border-gray-200 focus:border-red-300 focus:ring-red-200"
                    disabled={loadingCredentials}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="confirmar-senha" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Confirmar Nova Senha *
                </Label>
                <Input
                  id="confirmar-senha"
                  type="password"
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  placeholder="Digite a senha novamente"
                  className="mt-1 rounded-lg border-gray-200 focus:border-red-300 focus:ring-red-200"
                  disabled={loadingCredentials}
                />
              </div>

              <div className="pt-4 flex justify-end">
                <Button
                  onClick={handleUpdateCredentials}
                  disabled={loadingCredentials || !novoEmail.trim() || !novaSenha.trim() || !confirmarSenha.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  {loadingCredentials ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Atualizando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Salvar Alterações
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configuration Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card className="shadow-lg border-0 bg-white rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 p-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Store className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Informações Básicas
                  </CardTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    Nome, endereço e contatos da pizzaria
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div>
                <Label htmlFor="nome" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Store className="h-4 w-4" />
                  Nome da Pizzaria
                </Label>
                <Input
                  id="nome"
                  value={config.nome}
                  onChange={(e) => setConfig({ ...config, nome: e.target.value })}
                  placeholder="Digite o nome da sua pizzaria"
                  className="mt-1 rounded-lg border-gray-200 focus:border-blue-300 focus:ring-blue-200"
                />
              </div>

              <div>
                <Label htmlFor="endereco" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Endereço Completo
                </Label>
                <Textarea
                  id="endereco"
                  value={config.endereco}
                  onChange={(e) => setConfig({ ...config, endereco: e.target.value })}
                  placeholder="Rua, número, bairro, cidade, CEP"
                  className="mt-1 rounded-lg border-gray-200 focus:border-blue-300 focus:ring-blue-200"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="telefone" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Telefone
                  </Label>
                  <Input
                    id="telefone"
                    value={config.telefone}
                    onChange={(e) => setConfig({ ...config, telefone: e.target.value })}
                    placeholder="(11) 3333-4444"
                    className="mt-1 rounded-lg border-gray-200 focus:border-blue-300 focus:ring-blue-200"
                  />
                </div>

                <div>
                  <Label htmlFor="whatsapp" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </Label>
                  <Input
                    id="whatsapp"
                    value={config.whatsapp}
                    onChange={(e) => setConfig({ ...config, whatsapp: e.target.value })}
                    placeholder="5511999887766"
                    className="mt-1 rounded-lg border-gray-200 focus:border-blue-300 focus:ring-blue-200"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="descricao_pizzas" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <UtensilsCrossed className="h-4 w-4" />
                  Descrição das Pizzas
                </Label>
                <Input
                  id="descricao_pizzas"
                  value={config.descricao_pizzas}
                  onChange={(e) => setConfig({ ...config, descricao_pizzas: e.target.value })}
                  placeholder="Pizzas doces e salgadas (Tradicional 8 fatias / Broto 4 fatias)"
                  className="mt-1 rounded-lg border-gray-200 focus:border-blue-300 focus:ring-blue-200"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Texto exibido na seção de pizzas da homepage
                </p>
              </div>

              {/* Seção Redes Sociais do Rodapé */}
              <div className="border-t border-gray-200 pt-6">
                <Label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-4">
                  <Share2 className="h-4 w-4" />
                  Redes Sociais do Rodapé
                </Label>
                <p className="text-sm text-gray-600 mb-4">
                  Configure quais ícones de redes sociais aparecerão no rodapé do cardápio
                </p>
                
                <div className="space-y-4">
                  {/* WhatsApp */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 transition-colors hover:bg-gray-100">
                      <input
                        type="checkbox"
                        checked={config.whatsapp_ativo}
                        onChange={(e) => setConfig({ ...config, whatsapp_ativo: e.target.checked })}
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <MessageCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-gray-900">WhatsApp</span>
                    </label>
                    {config.whatsapp_ativo && (
                      <Input
                        value={config.whatsapp_link}
                        onChange={(e) => setConfig({ ...config, whatsapp_link: e.target.value })}
                        placeholder="https://wa.me/5511999887766"
                        className="ml-7 rounded-lg border-gray-200 focus:border-green-300 focus:ring-green-200"
                      />
                    )}
                  </div>

                  {/* Instagram */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 transition-colors hover:bg-gray-100">
                      <input
                        type="checkbox"
                        checked={config.instagram_ativo}
                        onChange={(e) => setConfig({ ...config, instagram_ativo: e.target.checked })}
                        className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                      />
                      <Instagram className="h-4 w-4 text-pink-600" />
                      <span className="text-sm font-medium text-gray-900">Instagram</span>
                    </label>
                    {config.instagram_ativo && (
                      <Input
                        value={config.instagram_link}
                        onChange={(e) => setConfig({ ...config, instagram_link: e.target.value })}
                        placeholder="https://instagram.com/suapizzaria"
                        className="ml-7 rounded-lg border-gray-200 focus:border-pink-300 focus:ring-pink-200"
                      />
                    )}
                  </div>

                  {/* Facebook */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 transition-colors hover:bg-gray-100">
                      <input
                        type="checkbox"
                        checked={config.facebook_ativo}
                        onChange={(e) => setConfig({ ...config, facebook_ativo: e.target.checked })}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <Facebook className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-gray-900">Facebook</span>
                    </label>
                    {config.facebook_ativo && (
                      <Input
                        value={config.facebook_link}
                        onChange={(e) => setConfig({ ...config, facebook_link: e.target.value })}
                        placeholder="https://facebook.com/suapizzaria"
                        className="ml-7 rounded-lg border-gray-200 focus:border-blue-300 focus:ring-blue-200"
                      />
                    )}
                  </div>

                  {/* Google Maps */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 transition-colors hover:bg-gray-100">
                      <input
                        type="checkbox"
                        checked={config.maps_ativo}
                        onChange={(e) => setConfig({ ...config, maps_ativo: e.target.checked })}
                        className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                      />
                      <MapPin className="h-4 w-4 text-red-600" />
                      <span className="text-sm font-medium text-gray-900">Google Maps</span>
                    </label>
                    {config.maps_ativo && (
                      <Input
                        value={config.maps_link}
                        onChange={(e) => setConfig({ ...config, maps_link: e.target.value })}
                        placeholder="https://maps.google.com/..."
                        className="ml-7 rounded-lg border-gray-200 focus:border-red-300 focus:ring-red-200"
                      />
                    )}
                  </div>

                  {/* Compartilhar */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 transition-colors hover:bg-gray-100">
                      <input
                        type="checkbox"
                        checked={config.compartilhar_ativo}
                        onChange={(e) => setConfig({ ...config, compartilhar_ativo: e.target.checked })}
                        className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
                      />
                      <Share2 className="h-4 w-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-900">Compartilhar</span>
                    </label>
                    <p className="ml-7 text-xs text-gray-500">
                      Permite que os clientes compartilhem o link do cardápio
                    </p>
                  </div>
                </div>
              </div>

              {/* Botão Salvar Informações Básicas */}
              <div className="pt-4 flex justify-end">
                <Button
                  onClick={handleSaveBasicInfo}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  {loading ? (
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
              </div>
            </CardContent>
          </Card>

          {/* Delivery Settings */}
          <Card className="shadow-lg border-0 bg-white rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100 p-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Bike className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Configurações de Entrega
                  </CardTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    Taxas, tempos e formas de pagamento
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="taxa_entrega" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Taxa de Entrega
                  </Label>
                  <Input
                    id="taxa_entrega"
                    type="text"
                    value={taxaEntregaFormatada}
                    onChange={(e) => {
                      const valorFormatado = formatCurrencyInput(e.target.value)
                      setTaxaEntregaFormatada(valorFormatado)
                      const valorNumerico = parseCurrencyInput(valorFormatado)
                      setConfig({ ...config, taxa_entrega: valorNumerico })
                    }}
                    placeholder="R$ 0,00"
                    className="mt-1 rounded-lg border-gray-200 focus:border-green-300 focus:ring-green-200"
                  />
                </div>

                <div>
                  <Label htmlFor="valor_minimo" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Valor Mínimo
                  </Label>
                  <Input
                    id="valor_minimo"
                    type="text"
                    value={valorMinimoFormatado}
                    onChange={(e) => {
                      const valorFormatado = formatCurrencyInput(e.target.value)
                      setValorMinimoFormatado(valorFormatado)
                      const valorNumerico = parseCurrencyInput(valorFormatado)
                      setConfig({ ...config, valor_minimo: valorNumerico })
                    }}
                    placeholder="R$ 0,00"
                    className="mt-1 rounded-lg border-gray-200 focus:border-green-300 focus:ring-green-200"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-3">
                  <Clock className="h-4 w-4" />
                  Tempo de Entrega
                </Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tempo_min" className="text-xs text-gray-500">Mínimo (min)</Label>
                    <Input
                      id="tempo_min"
                      type="number"
                      value={config.tempo_entrega_min}
                      onChange={(e) => setConfig({ ...config, tempo_entrega_min: Number.parseInt(e.target.value) || 0 })}
                      className="mt-1 rounded-lg border-gray-200 focus:border-green-300 focus:ring-green-200"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tempo_max" className="text-xs text-gray-500">Máximo (min)</Label>
                    <Input
                      id="tempo_max"
                      type="number"
                      value={config.tempo_entrega_max}
                      onChange={(e) => setConfig({ ...config, tempo_entrega_max: Number.parseInt(e.target.value) || 0 })}
                      className="mt-1 rounded-lg border-gray-200 focus:border-green-300 focus:ring-green-200"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-3">
                  <CreditCard className="h-4 w-4" />
                  Formas de Pagamento
                </Label>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 transition-colors hover:bg-gray-100">
                    <input
                      type="checkbox"
                      checked={config.aceita_dinheiro}
                      onChange={(e) => setConfig({ ...config, aceita_dinheiro: e.target.checked })}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm font-medium text-gray-900 flex items-center gap-2">
                      <Banknote className="h-4 w-4 text-green-600" />
                      Dinheiro
                    </span>
                  </label>
                  <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 transition-colors hover:bg-gray-100">
                    <input
                      type="checkbox"
                      checked={config.aceita_cartao}
                      onChange={(e) => setConfig({ ...config, aceita_cartao: e.target.checked })}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm font-medium text-gray-900 flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-purple-600" />
                      Cartão
                    </span>
                  </label>
                  <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 transition-colors hover:bg-gray-100">
                    <input
                      type="checkbox"
                      checked={config.aceita_pix}
                      onChange={(e) => setConfig({ ...config, aceita_pix: e.target.checked })}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm font-medium text-gray-900 flex items-center gap-2">
                      <QrCode className="h-4 w-4 text-blue-600" />
                      Pix
                    </span>
                  </label>
                  <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 transition-colors hover:bg-gray-100">
                    <input
                      type="checkbox"
                      checked={config.aceita_ticket_alimentacao}
                      onChange={(e) => setConfig({ ...config, aceita_ticket_alimentacao: e.target.checked })}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm font-medium text-gray-900 flex items-center gap-2">
                      <UtensilsCrossed className="h-4 w-4 text-amber-600" />
                      Ticket Alimentação
                    </span>
                  </label>
                </div>
              </div>

              {/* Botão Salvar Configurações de Entrega */}
              <div className="pt-4 flex justify-end">
                <Button
                  onClick={handleSaveDeliverySettings}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  {loading ? (
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
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Operating Hours */}
        <Card className="shadow-lg border-0 bg-white rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 border-b border-purple-100 p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Horários de Funcionamento
                </CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  Configure os horários de abertura e fechamento para cada dia da semana
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {daysOrder.map((dia) => {
                const horario = config.horario_funcionamento?.[dia] || ""
                const { inicio, fim, fechado } = parseHorario(horario)
                const dayNames = {
                  segunda: 'Segunda-feira',
                  terca: 'Terça-feira',
                  quarta: 'Quarta-feira',
                  quinta: 'Quinta-feira',
                  sexta: 'Sexta-feira',
                  sabado: 'Sábado',
                  domingo: 'Domingo'
                }
                
                return (
                  <div key={dia} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    {/* Cabeçalho do dia com toggle Fechado */}
                    <div className="flex items-center justify-between mb-4">
                      <Label className="text-sm font-medium text-gray-700">
                        {dayNames[dia as keyof typeof dayNames]}
                      </Label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={fechado}
                          onChange={(e) => {
                            const novoFechado = e.target.checked
                            updateHorarioSeparado(dia, inicio, fim, novoFechado)
                          }}
                          className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                        />
                        <span className="text-sm text-gray-600">Fechado</span>
                      </label>
                    </div>
                    
                    {/* Campos de horário */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor={`${dia}-inicio`} className="text-xs text-gray-500 mb-1 block">
                          Abertura
                        </Label>
                        <input
                          id={`${dia}-inicio`}
                          type="time"
                          value={inicio}
                          disabled={fechado}
                          onChange={(e) => updateHorarioSeparado(dia, e.target.value, fim, fechado)}
                          className={`w-full px-3 py-2 text-sm border rounded-lg transition-colors ${
                            fechado 
                              ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed' 
                              : 'bg-white border-gray-200 focus:border-purple-300 focus:ring-purple-200 focus:ring-2 focus:ring-opacity-20'
                          }`}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`${dia}-fim`} className="text-xs text-gray-500 mb-1 block">
                          Fechamento
                        </Label>
                        <input
                          id={`${dia}-fim`}
                          type="time"
                          value={fim}
                          disabled={fechado}
                          onChange={(e) => updateHorarioSeparado(dia, inicio, e.target.value, fechado)}
                          className={`w-full px-3 py-2 text-sm border rounded-lg transition-colors ${
                            fechado 
                              ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed' 
                              : 'bg-white border-gray-200 focus:border-purple-300 focus:ring-purple-200 focus:ring-2 focus:ring-opacity-20'
                          }`}
                        />
                      </div>
                    </div>
                    
                    {/* Indicador visual do status */}
                    <div className="mt-3 text-center">
                      {fechado ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          Fechado
                        </span>
                      ) : inicio && fim ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          {inicio} às {fim}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                          Horário incompleto
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-700">
                💡 <strong>Dica:</strong> Para cada dia, defina os horários de abertura e fechamento ou marque como "Fechado". 
                Os horários são salvos automaticamente no formato compatível com o sistema.
              </p>
            </div>

            {/* Botão Salvar Horários */}
            <div className="pt-4 flex justify-end">
              <Button
                onClick={handleSaveSchedule}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                {loading ? (
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
            </div>
          </CardContent>
        </Card>

        {/* Images */}
        <Card className="shadow-lg border-0 bg-white rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100 p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Image className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Imagens da Pizzaria
                </CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  Faça upload das imagens que aparecerão no cardápio
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            {/* Upload Foto de Capa */}
            <div>
              <Label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-3">
                <FileImage className="h-4 w-4" />
                Foto de Capa
              </Label>
              
              <div className="space-y-3">
                {/* Preview da imagem atual */}
                {config.foto_capa && (
                  <div className="relative">
                    <img
                      src={config.foto_capa}
                      alt="Preview da capa"
                      className="w-full h-40 object-cover rounded-lg border border-gray-200"
                    />
                    <div className="absolute top-2 right-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleDeleteCapa}
                        className="h-8 px-3 bg-red-600 hover:bg-red-700 text-white shadow-lg"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Área de upload */}
                <div 
                  className="border-2 border-dashed border-orange-300 rounded-lg p-6 text-center hover:border-orange-400 transition-colors cursor-pointer"
                  onClick={() => capaInputRef.current?.click()}
                >
                  {uploadingCapa ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-8 w-8 text-orange-600 animate-spin" />
                      <p className="text-sm text-gray-600">Processando imagem...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="h-8 w-8 text-orange-600" />
                      <p className="text-sm font-medium text-gray-700">Clique para selecionar imagem</p>
                      <p className="text-xs text-gray-500">PNG, JPG até 5MB</p>
                    </div>
                  )}
                </div>
                
                <input
                  ref={capaInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCapaUpload}
                  className="hidden"
                />
                
                <p className="text-xs text-gray-500">
                  Imagem principal exibida no topo do cardápio. Tamanho ideal: 1200x675px.
                </p>
              </div>
            </div>

            {/* Upload Foto de Perfil */}
            <div>
              <Label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-3">
                <FileImage className="h-4 w-4" />
                Foto de Perfil
              </Label>
              
              <div className="space-y-3">
                {/* Preview da imagem atual */}
                {config.foto_perfil && (
                  <div className="relative inline-block">
                    <img
                      src={config.foto_perfil}
                      alt="Preview do perfil"
                      className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                    />
                    <div className="absolute -top-2 -right-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleDeletePerfil}
                        className="h-8 px-3 bg-red-600 hover:bg-red-700 text-white shadow-lg"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Área de upload */}
                <div 
                  className="border-2 border-dashed border-orange-300 rounded-lg p-6 text-center hover:border-orange-400 transition-colors cursor-pointer"
                  onClick={() => perfilInputRef.current?.click()}
                >
                  {uploadingPerfil ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-8 w-8 text-orange-600 animate-spin" />
                      <p className="text-sm text-gray-600">Processando imagem...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="h-8 w-8 text-orange-600" />
                      <p className="text-sm font-medium text-gray-700">Clique para selecionar imagem</p>
                      <p className="text-xs text-gray-500">PNG, JPG até 5MB</p>
                    </div>
                  )}
                </div>
                
                <input
                  ref={perfilInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePerfilUpload}
                  className="hidden"
                />
                
                <p className="text-xs text-gray-500">
                  Logo ou imagem de perfil da pizzaria. Tamanho ideal: 300x300px.
                </p>
              </div>
            </div>

            {/* Botão Salvar Imagens */}
            <div className="pt-4 flex justify-end">
              <Button
                onClick={handleSaveImages}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                {loading ? (
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
            </div>
          </CardContent>
        </Card>

        {/* Carousel */}
        <Card className="shadow-lg border-0 bg-white rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100 p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ImageIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Carousel da Homepage
                </CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  Gerencie as imagens do carousel que aparece na homepage
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-6">
            {/* Configurações do Carousel */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-gray-700">
                  Carousel Ativo
                </Label>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="carousel-ativo"
                    checked={carouselConfig.ativo}
                    onChange={(e) => setCarouselConfig(prev => ({ ...prev, ativo: e.target.checked }))}
                    className="h-4 w-4 text-purple-600 rounded focus:ring-purple-500"
                  />
                  <Label htmlFor="carousel-ativo" className="text-sm">
                    {carouselConfig.ativo ? 'Ativo' : 'Inativo'}
                  </Label>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Intervalo de Transição (segundos)
                </Label>
                <Input
                  type="number"
                  min="1"
                  max="30"
                  value={carouselConfig.intervalo_segundos}
                  onChange={(e) => setCarouselConfig(prev => ({ ...prev, intervalo_segundos: parseInt(e.target.value) || 5 }))}
                  className="w-24"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Tempo entre cada imagem (1-30 segundos)
                </p>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleSaveCarouselConfig}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Configurações
                </Button>
              </div>
            </div>

            {/* Upload de Imagens */}
            <div className="border-t pt-6">
              <Label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-3">
                <Upload className="h-4 w-4" />
                Adicionar Imagens ({carouselImages.length}/10)
              </Label>
              
              <div 
                className="border-2 border-dashed border-purple-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors cursor-pointer"
                onClick={() => carouselInputRef.current?.click()}
              >
                {uploadingCarousel ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 text-purple-600 animate-spin" />
                    <p className="text-sm text-gray-600">Processando imagens...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-8 w-8 text-purple-600" />
                    <p className="text-sm font-medium text-gray-700">Clique para selecionar imagens</p>
                    <p className="text-xs text-gray-500">PNG, JPG - Múltiplas imagens permitidas</p>
                  </div>
                )}
              </div>
              
              <input
                ref={carouselInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleCarouselUpload}
                className="hidden"
              />
              
                             <p className="text-xs text-gray-500 mt-2">
                 <strong>Tamanho recomendado:</strong> 1200x320px. As imagens serão redimensionadas automaticamente.
               </p>
            </div>

            {/* Lista de Imagens */}
            {carouselImages.length > 0 && (
              <div className="border-t pt-6">
                <Label className="text-sm font-medium text-gray-700 mb-3 block">
                  Imagens do Carousel
                </Label>
                
                <div className="space-y-3">
                  {carouselImages.map((image, index) => (
                    <div key={image.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                      {/* Preview da imagem */}
                      <div className="relative">
                                                 <img
                           src={image.url}
                           alt={`Carousel ${index + 1}`}
                           className="w-20 h-8 object-cover rounded-lg border border-gray-200"
                         />
                        {!image.ativo && (
                          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                            <EyeOff className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </div>

                      {/* Informações */}
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-700">
                          Imagem {index + 1}
                        </p>
                        <p className="text-xs text-gray-500">
                          Ordem: {image.ordem} • {image.ativo ? 'Ativa' : 'Inativa'}
                        </p>
                      </div>

                      {/* Controles de ordem */}
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUpdateCarouselOrder(image.id, image.ordem - 1)}
                          disabled={index === 0}
                          className="h-6 w-6 p-0"
                        >
                          <RotateCcw className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUpdateCarouselOrder(image.id, image.ordem + 1)}
                          disabled={index === carouselImages.length - 1}
                          className="h-6 w-6 p-0"
                        >
                          <RotateCcw className="h-3 w-3 rotate-180" />
                        </Button>
                      </div>

                      {/* Botões de ação */}
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleCarouselImage(image.id, image.ativo)}
                          className="h-8 w-8 p-0"
                        >
                          {image.ativo ? (
                            <Eye className="h-4 w-4 text-green-600" />
                          ) : (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCarouselImage(image.id, image.url)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mensagem de feedback */}
            {carouselMessage && (
              <div className={`p-3 rounded-lg ${
                carouselMessage.includes('sucesso') || carouselMessage.includes('salva')
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                <div className="flex items-center gap-2">
                  {carouselMessage.includes('sucesso') || carouselMessage.includes('salva') ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <span className="text-sm">{carouselMessage}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
  )
}
