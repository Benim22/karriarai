"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { FileText, Plus, Download, Eye, Edit, Trash2, TrendingUp, Users, Star, Palette } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { sv } from "date-fns/locale"
import { getCVTemplates, CVTemplateWithStats } from "@/lib/cv-templates"
import { 
  ClassicProfessionalPreview, 
  ModernMinimalistPreview, 
  CreativeDesignerPreview 
} from "@/components/cv-template-preview"
import { CVLimitDialog } from "@/components/cv-limit-dialog"
import { useCVLimits } from "@/hooks/use-cv-limits"
import { useAuth } from "@/components/auth-provider"

interface DashboardContentProps {
  cvs: any[]
  exports: any[]
  profile: any
}

export function DashboardContent({ cvs, exports, profile }: DashboardContentProps) {
  const [selectedCV, setSelectedCV] = useState<string | null>(null)
  const [templates, setTemplates] = useState<CVTemplateWithStats[]>([])
  const { user } = useAuth()
  
  // Använd den nya CV limits hooken
  const {
    canCreateCV,
    currentCVCount,
    limits,
    showLimitDialog,
    setShowLimitDialog,
    handleCreateCV
  } = useCVLimits(profile, cvs)

  useEffect(() => {
    const loadTemplates = async () => {
      const cvTemplates = await getCVTemplates()
      setTemplates(cvTemplates.slice(0, 3)) // Visa bara de första 3 mallarna
    }
    loadTemplates()
  }, [])

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            Välkommen tillbaka, {profile?.full_name?.split(" ")[0] || "Användare"}!
          </h1>
          <p className="text-muted-foreground">Hantera dina CV och se din jobbsökningsframgång</p>
        </div>
        <div className="flex items-center gap-4 mt-4 md:mt-0">
          <Badge variant={profile?.subscription_tier === "free" ? "secondary" : "default"}>
            {profile?.subscription_tier === "free"
              ? "Gratis plan"
              : profile?.subscription_tier === "mini"
                ? "Mini plan"
                : profile?.subscription_tier === "pro"
                  ? "Pro plan"
                  : "Premium plan"}
          </Badge>
          <Button onClick={() => handleCreateCV()}>
            <Plus className="mr-2 h-4 w-4" />
            Nytt CV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totala CV</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cvs.length}</div>
            {limits.cvs !== -1 && (
              <div className="mt-2">
                <Progress value={(cvs.length / (limits.cvs + (profile?.extra_cv_credits || 0))) * 100} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {cvs.length} av {limits.cvs + (profile?.extra_cv_credits || 0)} använda
                  {profile?.extra_cv_credits > 0 && (
                    <span className="text-blue-600"> (+{profile.extra_cv_credits} extra)</span>
                  )}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exporter</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{exports.length}</div>
            <p className="text-xs text-muted-foreground">Senaste månaden</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visningar</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Kommer snart</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jobbmatcher</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              <Link href="/jobbmatchning" className="text-primary hover:underline cursor-pointer">
                Se jobb
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* CV List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Mina CV</CardTitle>
              <CardDescription>Hantera och redigera dina CV</CardDescription>
            </CardHeader>
            <CardContent>
              {cvs.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Inga CV än</h3>
                  <p className="text-muted-foreground mb-4">Skapa ditt första CV för att komma igång</p>
                  <Button onClick={() => handleCreateCV()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Skapa ditt första CV
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {cvs.map((cv) => (
                    <div
                      key={cv.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{cv.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            Uppdaterad{" "}
                            {formatDistanceToNow(new Date(cv.updated_at), {
                              addSuffix: true,
                              locale: sv,
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="ghost" asChild>
                          <Link href={`/cv-builder?id=${cv.id}`} className="cursor-pointer">
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button size="sm" variant="ghost" className="cursor-pointer">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="cursor-pointer">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Snabbåtgärder</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full" onClick={() => handleCreateCV()}>
                <Plus className="mr-2 h-4 w-4" />
                Nytt CV
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/jobbmatchning" className="cursor-pointer">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Hitta jobb
                </Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/exempel-cv" className="cursor-pointer">
                  <Eye className="mr-2 h-4 w-4" />
                  Se alla mallar
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Popular Templates */}
          {templates.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Populära mallar
                </CardTitle>
                <CardDescription>Snabbstart med våra mest använda mallar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {templates.map((template) => {
                  const PreviewComponent = 
                    template.name.includes('Klassisk') ? ClassicProfessionalPreview :
                    template.name.includes('Modern') ? ModernMinimalistPreview :
                    template.name.includes('Kreativ') ? CreativeDesignerPreview :
                    ClassicProfessionalPreview

                  return (
                    <div
                      key={template.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors group"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-16 bg-gray-50 rounded border overflow-hidden">
                          <div className="scale-[0.2] origin-top-left">
                            <PreviewComponent className="w-60 h-80" />
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">{template.name}</h4>
                          <p className="text-xs text-muted-foreground">{template.industry}</p>
                          {template.isPremium && (
                            <Badge variant="secondary" className="text-xs mt-1">
                              Premium
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleCreateCV(template.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  )
                })}
                <Button variant="outline" size="sm" className="w-full mt-2" asChild>
                  <Link href="/exempel-cv" className="cursor-pointer">
                    Se alla {templates.length > 3 ? `${templates.length - 3} fler` : ''} mallar
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Recent Exports */}
          <Card>
            <CardHeader>
              <CardTitle>Senaste exporter</CardTitle>
            </CardHeader>
            <CardContent>
              {exports.length === 0 ? (
                <p className="text-sm text-muted-foreground">Inga exporter än</p>
              ) : (
                <div className="space-y-3">
                  {exports.slice(0, 3).map((exportItem) => (
                    <div key={exportItem.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Download className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{exportItem.export_type.toUpperCase()}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(exportItem.created_at), {
                          addSuffix: true,
                          locale: sv,
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upgrade Prompt */}
          {profile?.subscription_tier === "free" && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-primary">Uppgradera ditt konto</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Få tillgång till obegränsade CV, alla mallar och exportfunktioner
                </p>
                <Button asChild className="w-full">
                  <Link href="/priser" className="cursor-pointer">Se planer</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* CV Limit Dialog */}
      <CVLimitDialog
        isOpen={showLimitDialog}
        onClose={() => setShowLimitDialog(false)}
        currentCVCount={currentCVCount}
        userEmail={user?.email}
      />
    </div>
  )
}
