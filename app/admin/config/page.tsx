"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { AdminLayout } from "@/components/admin-layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings, FileText, Award, Star, MapPin } from "lucide-react"

// Importar componentes das abas
import GeralTab from "./tabs/geral"
import CupomFiscalTab from "./tabs/cupom-fiscal"
import FidelidadeTab from "./tabs/fidelidade"
import AvaliacoesTab from "./tabs/avaliacoes"
import TaxasTab from "./tabs/taxas"

export default function ConfigPage() {
  const searchParams = useSearchParams()
  const tabFromUrl = searchParams.get("tab")
  const [activeTab, setActiveTab] = useState(tabFromUrl || "geral")

  // Atualizar aba quando a URL mudar
  useEffect(() => {
    if (tabFromUrl) {
      setActiveTab(tabFromUrl)
    }
  }, [tabFromUrl])

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Settings className="h-8 w-8 text-red-600" />
            Configurações
          </h1>
          <p className="text-gray-600 mt-1">
            Gerencie todas as configurações do sistema
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 gap-2 h-auto bg-gray-100 p-2 rounded-lg">
            <TabsTrigger 
              value="geral" 
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm py-2.5"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Geral</span>
              <span className="sm:hidden">Geral</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="cupom-fiscal" 
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm py-2.5"
            >
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Cupom Fiscal</span>
              <span className="sm:hidden">Cupom</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="fidelidade" 
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm py-2.5"
            >
              <Award className="h-4 w-4" />
              <span className="hidden sm:inline">Fidelidade</span>
              <span className="sm:hidden">Pontos</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="avaliacoes" 
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm py-2.5"
            >
              <Star className="h-4 w-4" />
              <span className="hidden sm:inline">Avaliações</span>
              <span className="sm:hidden">Aval.</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="taxas" 
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm py-2.5"
            >
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">Taxas</span>
              <span className="sm:hidden">Taxas</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="geral" className="mt-6">
            <GeralTab />
          </TabsContent>

          <TabsContent value="cupom-fiscal" className="mt-6">
            <CupomFiscalTab />
          </TabsContent>

          <TabsContent value="fidelidade" className="mt-6">
            <FidelidadeTab />
          </TabsContent>

          <TabsContent value="avaliacoes" className="mt-6">
            <AvaliacoesTab />
          </TabsContent>

          <TabsContent value="taxas" className="mt-6">
            <TaxasTab />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  )
}
