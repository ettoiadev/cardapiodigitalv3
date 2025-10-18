"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { LogOut, Settings, Package, Home, Menu, X } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

interface AdminLayoutProps {
  children: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { admin, logout, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (!loading && !admin) {
      router.push("/admin/login")
    }
  }, [admin, loading, router])

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>
  }

  if (!admin) {
    return null
  }

  const menuItems = [
    { href: "/admin", icon: Home, label: "Dashboard" },
    { href: "/admin/produtos", icon: Package, label: "Produtos" },
    { href: "/admin/config", icon: Settings, label: "Configurações" },
  ]

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header with Horizontal Navigation */}
      <header className="bg-red-700 text-white shadow-lg sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo/Title */}
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">Painel Administrativo</h1>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {menuItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive 
                        ? "bg-red-800" 
                        : "hover:bg-red-600"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>

            {/* User Menu & Mobile Menu Button */}
            <div className="flex items-center space-x-4">
              {/* User Info - Hidden on very small screens */}
              <span className="hidden sm:block text-sm">Olá, {admin.nome}</span>
              
              {/* Logout Button */}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={logout} 
                className="hidden sm:flex bg-white text-red-700 hover:bg-gray-100 border-white"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>

              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden hover:bg-red-600"
                onClick={toggleMobileMenu}
                aria-label="Abrir menu"
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-red-600">
              <div className="pt-2 pb-3 space-y-1">
                {menuItems.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center space-x-3 px-3 py-3 text-base font-medium transition-colors ${
                        isActive
                          ? "bg-red-800"
                          : "hover:bg-red-600"
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
                
                {/* Mobile User Info & Logout */}
                <div className="border-t border-red-600 pt-3 mt-3">
                  <div className="flex items-center justify-between px-3 py-2">
                    <span className="text-sm">Olá, {admin.nome}</span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        logout()
                        setIsMobileMenuOpen(false)
                      }}
                      className="bg-white text-red-700 hover:bg-gray-100 border-white"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sair
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  )
}
