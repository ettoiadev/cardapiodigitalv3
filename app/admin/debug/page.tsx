"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"

export default function DebugPage() {
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const runTest = async (testName: string, queryFunction: () => Promise<any>) => {
    setLoading(true)
    try {
      console.log(`🧪 Executando teste: ${testName}`)
      const result = await queryFunction()
      console.log(`📊 Resultado ${testName}:`, result)
      
      setResults(prev => [...prev, {
        test: testName,
        timestamp: new Date().toLocaleTimeString(),
        success: !result.error,
        data: result.data,
        error: result.error,
        count: result.count
      }])
    } catch (error) {
      console.error(`❌ Erro no teste ${testName}:`, error)
      setResults(prev => [...prev, {
        test: testName,
        timestamp: new Date().toLocaleTimeString(),
        success: false,
        error: error
      }])
    } finally {
      setLoading(false)
    }
  }

  const tests = [
    {
      name: "1. Listar todos os admins",
      fn: async () => await supabase.from("admins").select("*")
    },
    {
      name: "2. Buscar admin específico (sem ativo)",
      fn: async () => await supabase.from("admins").select("*").eq("email", "admin@pizzaria.com")
    },
    {
      name: "3. Buscar admin específico (com ativo=true)",
      fn: async () => await supabase.from("admins").select("*").eq("email", "admin@pizzaria.com").eq("ativo", true)
    },
    {
      name: "4. Buscar admin com single()",
      fn: async () => await supabase.from("admins").select("*").eq("email", "admin@pizzaria.com").eq("ativo", true).single()
    },
    {
      name: "5. Buscar admin com maybeSingle()",
      fn: async () => await supabase.from("admins").select("*").eq("email", "admin@pizzaria.com").eq("ativo", true).maybeSingle()
    },
    {
      name: "6. Contar admins",
      fn: async () => await supabase.from("admins").select("*", { count: 'exact' }).eq("email", "admin@pizzaria.com")
    }
  ]

  const clearResults = () => {
    setResults([])
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>🧪 Debug - Consultas Admin</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              {tests.map((test, index) => (
                <Button
                  key={index}
                  onClick={() => runTest(test.name, test.fn)}
                  disabled={loading}
                  variant="outline"
                  size="sm"
                >
                  {test.name}
                </Button>
              ))}
            </div>

            <div className="flex gap-2">
              <Button onClick={clearResults} variant="secondary" size="sm">
                Limpar Resultados
              </Button>
              <Button 
                onClick={() => {
                  tests.forEach((test, index) => {
                    setTimeout(() => runTest(test.name, test.fn), index * 1000)
                  })
                }}
                disabled={loading}
                variant="default"
              >
                Executar Todos os Testes
              </Button>
            </div>

            {results.length > 0 && (
              <div className="space-y-4 mt-6">
                <h3 className="text-lg font-semibold">📊 Resultados dos Testes</h3>
                {results.map((result, index) => (
                  <Card key={index} className={result.success ? "border-green-200" : "border-red-200"}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{result.test}</span>
                        <div className="flex gap-2 text-sm">
                          <span className="text-muted-foreground">{result.timestamp}</span>
                          <span className={result.success ? "text-green-600" : "text-red-600"}>
                            {result.success ? "✅ Sucesso" : "❌ Erro"}
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {result.success ? (
                        <div className="space-y-2">
                          {result.count !== undefined && (
                            <div className="text-sm text-blue-600">
                              📊 Count: {result.count}
                            </div>
                          )}
                          <div className="text-sm text-green-600">
                            📋 Dados ({Array.isArray(result.data) ? result.data.length : result.data ? 1 : 0} items):
                          </div>
                          <pre className="text-xs bg-green-50 p-2 rounded overflow-auto max-h-40">
                            {JSON.stringify(result.data, null, 2)}
                          </pre>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="text-sm text-red-600">
                            ❌ Erro:
                          </div>
                          <pre className="text-xs bg-red-50 p-2 rounded overflow-auto max-h-40">
                            {JSON.stringify(result.error, null, 2)}
                          </pre>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">🔍 Como usar este debug:</h4>
              <ol className="text-sm text-blue-700 space-y-1">
                <li>1. Execute os testes um por vez ou todos juntos</li>
                <li>2. Verifique qual consulta funciona e qual falha</li>
                <li>3. Compare os resultados com o que esperamos</li>
                <li>4. Abra o console (F12) para ver logs detalhados</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 