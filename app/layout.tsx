import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { CartProvider } from "@/lib/cart-context"
import { AuthProvider } from "@/lib/auth-context"
import { ConfigProvider } from "@/lib/config-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Pizzaria Digital",
  description: "Cardápio digital para pizzaria",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <AuthProvider>
          <ConfigProvider>
            <CartProvider>{children}</CartProvider>
          </ConfigProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
