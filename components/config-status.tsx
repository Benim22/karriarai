"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, ExternalLink, Database, Key } from "lucide-react"

export function ConfigStatus() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (supabaseUrl && supabaseKey) {
    return null // Configuration is complete
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Alert className="mb-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Konfiguration krävs</AlertTitle>
        <AlertDescription>
          Supabase-miljövariabler saknas. Appen körs i demo-läge med begränsad funktionalitet.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Konfigurera Supabase
          </CardTitle>
          <CardDescription>
            För att få full funktionalitet behöver du konfigurera Supabase-integrationen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Key className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">NEXT_PUBLIC_SUPABASE_URL</p>
                  <p className="text-sm text-muted-foreground">Din Supabase projekt-URL</p>
                </div>
              </div>
              <div className="text-sm">
                {supabaseUrl ? (
                  <span className="text-green-600">✓ Konfigurerad</span>
                ) : (
                  <span className="text-red-600">✗ Saknas</span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Key className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">NEXT_PUBLIC_SUPABASE_ANON_KEY</p>
                  <p className="text-sm text-muted-foreground">Din Supabase anonym nyckel</p>
                </div>
              </div>
              <div className="text-sm">
                {supabaseKey ? (
                  <span className="text-green-600">✓ Konfigurerad</span>
                ) : (
                  <span className="text-red-600">✗ Saknas</span>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <h4 className="font-medium mb-2">Nästa steg:</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Skapa ett Supabase-projekt på supabase.com</li>
              <li>Kopiera projekt-URL och anonym nyckel</li>
              <li>Lägg till miljövariablerna i din .env.local fil</li>
              <li>Kör databasmigreringarna</li>
            </ol>
          </div>

          <Button asChild className="w-full">
                            <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="cursor-pointer">
              Öppna Supabase
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
