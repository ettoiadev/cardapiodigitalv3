"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { supabase } from "@/lib/supabase"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CarouselImage {
  id: string
  url: string
  ordem: number
  ativo: boolean
}

interface CarouselConfig {
  ativo: boolean
  intervalo_segundos: number
}

export function HomepageCarousel() {
  const [images, setImages] = useState<CarouselImage[]>([])
  const [config, setConfig] = useState<CarouselConfig>({ ativo: true, intervalo_segundos: 5 })
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCarouselData()
  }, [])

  useEffect(() => {
    if (!config.ativo || images.length <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === images.length - 1 ? 0 : prevIndex + 1
      )
    }, config.intervalo_segundos * 1000)

    return () => clearInterval(interval)
  }, [images.length, config.ativo, config.intervalo_segundos])

  const loadCarouselData = async () => {
    try {
      // Carregar configuração do carousel
      const { data: configData } = await supabase
        .from('carousel_config')
        .select('ativo, intervalo_segundos')
        .single()

      if (configData) {
        setConfig(configData)
      }

      // Carregar imagens ativas ordenadas
      const { data: imagesData } = await supabase
        .from('carousel_images')
        .select('id, url, ordem, ativo')
        .eq('ativo', true)
        .order('ordem')

      if (imagesData && imagesData.length > 0) {
        setImages(imagesData)
      }
    } catch (error) {
      console.error('Erro ao carregar dados do carousel:', error)
    } finally {
      setLoading(false)
    }
  }

  const goToPrevious = () => {
    setCurrentIndex(currentIndex === 0 ? images.length - 1 : currentIndex - 1)
  }

  const goToNext = () => {
    setCurrentIndex(currentIndex === images.length - 1 ? 0 : currentIndex + 1)
  }

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
  }

  // Não renderizar se não estiver ativo, ainda carregando, ou sem imagens
  if (loading || !config.ativo || images.length === 0) {
    return null
  }

  return (
    <div className="relative w-full bg-gray-100 rounded-lg overflow-hidden shadow-sm mx-auto" style={{ maxWidth: '1200px', aspectRatio: '1200/320' }}>
      {/* Container das imagens */}
      <div className="relative w-full h-full">
        {images.map((image, index) => (
          <div
            key={image.id}
            className={`absolute inset-0 transition-opacity duration-500 ${
              index === currentIndex ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Image
              src={image.url}
              alt={`Slide ${index + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 1200px"
              priority={index === 0}
            />
          </div>
        ))}
      </div>

      {/* Controles de navegação (apenas se houver mais de uma imagem) */}
      {images.length > 1 && (
        <>
          {/* Botões de navegação */}
          <Button
            variant="ghost"
            size="sm"
            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white h-8 w-8 p-0 rounded-full"
            onClick={goToPrevious}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white h-8 w-8 p-0 rounded-full"
            onClick={goToNext}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* Indicadores de slide */}
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {images.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex 
                    ? 'bg-white' 
                    : 'bg-white/50 hover:bg-white/75'
                }`}
                onClick={() => goToSlide(index)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
} 