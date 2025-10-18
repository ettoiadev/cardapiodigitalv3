"use client"

import { useState, useEffect } from "react"
import { MessageCircle, Instagram, Facebook, MapPin, Share2 } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface SocialConfig {
  whatsapp_ativo: boolean
  whatsapp_link: string | null
  instagram_ativo: boolean
  instagram_link: string | null
  facebook_ativo: boolean
  facebook_link: string | null
  maps_ativo: boolean
  maps_link: string | null
  compartilhar_ativo: boolean
}

interface SocialFooterProps {
  hasCartItems?: boolean
}

export function SocialFooter({ hasCartItems = false }: SocialFooterProps) {
  const [config, setConfig] = useState<SocialConfig | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSocialConfig()
  }, [])

  const loadSocialConfig = async () => {
    try {
      const { data, error } = await supabase
        .from("pizzaria_config")
        .select("whatsapp_ativo, whatsapp_link, instagram_ativo, instagram_link, facebook_ativo, facebook_link, maps_ativo, maps_link, compartilhar_ativo")
        .single()

      if (error && error.code !== "PGRST116") {
        console.error("Erro ao carregar configurações sociais:", error)
        return
      }

      if (data) {
        setConfig(data)
      }
    } catch (error) {
      console.error("Erro ao conectar com Supabase:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Cardápio Digital',
          text: 'Confira nosso cardápio!',
          url: window.location.href,
        })
      } catch (error) {
        console.log('Compartilhamento cancelado')
      }
    } else {
      // Fallback para navegadores que não suportam Web Share API
      try {
        await navigator.clipboard.writeText(window.location.href)
        alert('Link copiado para a área de transferência!')
      } catch (error) {
        console.error('Erro ao copiar link:', error)
      }
    }
  }

  const handleSocialClick = (url: string | null) => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  // Não renderizar se ainda estiver carregando ou se não há configuração
  if (loading || !config) {
    return null
  }

  // Verificar quais ícones devem ser exibidos
  const socialItems = [
    {
      id: 'whatsapp',
      icon: MessageCircle,
      active: config.whatsapp_ativo && config.whatsapp_link,
      url: config.whatsapp_link,
      label: 'WhatsApp'
    },
    {
      id: 'instagram',
      icon: Instagram,
      active: config.instagram_ativo && config.instagram_link,
      url: config.instagram_link,
      label: 'Instagram'
    },
    {
      id: 'facebook',
      icon: Facebook,
      active: config.facebook_ativo && config.facebook_link,
      url: config.facebook_link,
      label: 'Facebook'
    },
    {
      id: 'maps',
      icon: MapPin,
      active: config.maps_ativo && config.maps_link,
      url: config.maps_link,
      label: 'Localização'
    },
    {
      id: 'share',
      icon: Share2,
      active: config.compartilhar_ativo,
      url: null,
      label: 'Compartilhar',
      action: handleShare
    }
  ]

  const activeItems = socialItems.filter(item => item.active)

  // Se não há itens ativos, não renderizar
  if (activeItems.length === 0) {
    return null
  }

  return (
    <footer 
      className={`
        w-full bg-red-600 shadow-sm flex-shrink-0
        transition-all duration-300 ease-in-out
        ${hasCartItems ? 'mb-20 md:mb-20' : 'mb-0'}
      `}
      style={{ 
        zIndex: 40
      }}
    >
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-4">
            {activeItems.map((item) => {
              const IconComponent = item.icon
              return (
                <button
                  key={item.id}
                  onClick={item.action || (() => handleSocialClick(item.url))}
                  className="
                    p-3 rounded-full transition-all duration-200 cursor-pointer
                    hover:opacity-80 active:scale-95 text-white
                  "
                  aria-label={item.label}
                  title={item.label}
                >
                  <IconComponent className="w-6 h-6" />
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </footer>
  )
} 