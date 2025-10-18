"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function CupomFiscalRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/admin/config?tab=cupom-fiscal")
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-gray-600">Redirecionando para Configurações...</p>
      </div>
    </div>
  )
}
