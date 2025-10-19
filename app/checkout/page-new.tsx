"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function CheckoutPage() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirecionar para a nova página de resumo
    router.replace("/checkout/resumo")
  }, [router])
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
    </div>
  )
}
