"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AdminLayout } from "@/components/admin-layout"
import { supabase } from "@/lib/supabase"
import { 
  Package, 
  BarChart3, 
  Activity,
  ChefHat,
  Settings
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface DashboardStats {
  totalProdutos: number
  totalCategorias: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProdutos: 0,
    totalCategorias: 0,
  })

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      // Carregar estatísticas
      const [produtosRes, categoriasRes] = await Promise.all([
        supabase.from("produtos").select("id", { count: "exact" }).eq("ativo", true),
        supabase.from("categorias").select("id", { count: "exact" }).eq("ativo", true),
      ])

      const totalProdutos = produtosRes.count || 0
      const totalCategorias = categoriasRes.count || 0

      setStats({
        totalProdutos,
        totalCategorias,
      })
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error)
    }
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-8 p-4 md:p-8">
        {/* Header Section */}
        <div className="bg-secondary rounded-2xl p-8 border border-border shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <BarChart3 className="h-8 w-8 text-primary" />
                Dashboard
              </h1>
              <p className="text-muted-foreground max-w-2xl">
                Visão geral do seu negócio com estatísticas e métricas importantes.
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-primary-foreground bg-primary px-4 py-2 rounded-lg">
              <Activity className="h-4 w-4" />
              Sistema Operacional
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="shadow-md rounded-xl bg-blue-50 border-blue-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-bold text-blue-800">Total de Produtos</p>
                  <p className="text-3xl font-bold text-gray-800">{stats.totalProdutos}</p>
                  <p className="text-xs text-blue-700">produtos ativos</p>
                </div>
                <div className="p-3 bg-white rounded-full">
                  <Package className="h-8 w-8 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md rounded-xl bg-yellow-50 border-yellow-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-bold text-yellow-800">Categorias Ativas</p>
                  <p className="text-3xl font-bold text-gray-800">{stats.totalCategorias}</p>
                  <p className="text-xs text-yellow-700">categorias do cardápio</p>
                </div>
                <div className="p-3 bg-white rounded-full">
                  <ChefHat className="h-8 w-8 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Information Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="shadow-md rounded-xl bg-green-50 border-green-200 overflow-hidden">
            <CardHeader className="border-b border-green-200 p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg">
                  <BarChart3 className="h-6 w-6 text-green-700" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-gray-800">
                    Resumo do Sistema
                  </CardTitle>
                  <p className="text-sm text-green-800 mt-1">
                    Principais métricas do seu negócio
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200">
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-green-700" />
                    <span className="font-bold text-gray-800">Produtos ativos</span>
                  </div>
                  <span className="text-xl font-bold text-green-800">{stats.totalProdutos}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200">
                  <div className="flex items-center gap-3">
                    <ChefHat className="h-5 w-5 text-green-700" />
                    <span className="font-bold text-gray-800">Categorias ativas</span>
                  </div>
                  <span className="text-xl font-bold text-green-800">{stats.totalCategorias}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md rounded-xl bg-orange-50 border-orange-200 overflow-hidden">
            <CardHeader className="border-b border-orange-200 p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg">
                  <Settings className="h-6 w-6 text-orange-700" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-gray-800">
                    Gestão Rápida
                  </CardTitle>
                  <p className="text-sm text-orange-800 mt-1">
                    Principais funcionalidades do sistema
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-orange-200 hover:shadow-sm transition-shadow">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Package className="h-5 w-5 text-orange-700" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800">Gerenciar Produtos</h3>
                      <p className="text-sm text-orange-800">Organize produtos e categorias do cardápio</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="bg-neutral-100 hover:bg-neutral-200 text-gray-800 rounded-full">Ver</Button>
                </div>
                <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-orange-200 hover:shadow-sm transition-shadow">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Settings className="h-5 w-5 text-orange-700" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800">Configurar Sistema</h3>
                      <p className="text-sm text-orange-800">Ajuste informações da pizzaria</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="bg-neutral-100 hover:bg-neutral-200 text-gray-800 rounded-full">Ajustar</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
