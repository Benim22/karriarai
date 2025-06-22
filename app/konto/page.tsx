"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  Linkedin, 
  Github, 
  Briefcase, 
  Building, 
  CreditCard, 
  Settings, 
  Bell, 
  Eye, 
  Shield,
  Save,
  Camera,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Wand2
} from "lucide-react"
import type { UserProfile } from "@/types/user"

export default function KontoPage() {
  const { user, profile, updateProfile, loading, error } = useAuth()
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateMessage, setUpdateMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [formData, setFormData] = useState<Partial<UserProfile>>({})

  // Initialize form data when profile loads or create fallback from user data
  useEffect(() => {
    if (profile) {
      setFormData(profile)
    } else if (user && !loading) {
      // Create fallback profile from user data if profile doesn't exist
      const fallbackProfile: Partial<UserProfile> = {
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Användare',
        subscription_tier: 'free' as const,
        subscription_status: 'inactive' as const,
        role: 'user' as const,
        email_notifications: true,
        marketing_emails: false,
        profile_visibility: 'private' as const,
        job_search_status: 'not_looking' as const,
        remote_work_preference: 'hybrid' as const,
        onboarding_completed: false
      }
      setFormData(fallbackProfile)
    }
  }, [profile, user, loading])

  // Debug logging
  useEffect(() => {
    console.log("Konto page - Auth state:", { 
      user: user?.email, 
      profile: profile?.full_name, 
      loading, 
      error 
    })
  }, [user, profile, loading, error])

  const handleInputChange = (field: keyof UserProfile, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    if (!user) return

    setIsUpdating(true)
    setUpdateMessage(null)

    try {
      await updateProfile(formData)
      setUpdateMessage({ type: 'success', text: 'Profilen har uppdaterats!' })
    } catch (error) {
      console.error('Error updating profile:', error)
      setUpdateMessage({ type: 'error', text: 'Kunde inte uppdatera profilen. Kontrollera att databasen är konfigurerad.' })
    } finally {
      setIsUpdating(false)
    }
  }

  const improveWithAI = async (field: string, currentValue: string) => {
    setIsUpdating(true)
    
    try {
      const response = await fetch('/api/ai/improve-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: currentValue,
          type: field,
          context: { jobTitle: formData.job_title }
        }),
      })

      if (!response.ok) {
        throw new Error('AI improvement failed')
      }

      const data = await response.json()
      const improvedValue = data.improvedText || currentValue
      
      handleInputChange(field as keyof UserProfile, improvedValue)
    } catch (error) {
      console.error('AI improvement failed:', error)
      // Keep original value if AI fails
    } finally {
      setIsUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Laddar kontoinformation...</p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Du måste vara inloggad för att komma åt kontoinställningar.
            </AlertDescription>
          </Alert>
        </div>
        <Footer />
      </div>
    )
  }

  // Show loading only if we don't have any form data yet
  if (!formData.email && loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Laddar profilinformation...</p>
            <p className="text-sm text-muted-foreground mt-2">
              Inloggad som: {user.email}
            </p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Kontoinställningar</h1>
        <p className="text-muted-foreground mt-2">
          Hantera din profil, prenumeration och inställningar
        </p>
      </div>

      {/* Show error if there's an auth error */}
      {error && (
        <Alert className="mb-6 border-yellow-500">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-700">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Show warning if profile couldn't be loaded from database */}
      {user && !profile && !loading && (
        <Alert className="mb-6 border-blue-500">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-700">
            Profilinformation laddas från fallback-data. Ändringar sparas när databasen är tillgänglig.
          </AlertDescription>
        </Alert>
      )}

      {updateMessage && (
        <Alert className={`mb-6 ${updateMessage.type === 'success' ? 'border-green-500' : 'border-red-500'}`}>
          {updateMessage.type === 'success' ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className={updateMessage.type === 'success' ? 'text-green-700' : 'text-red-700'}>
            {updateMessage.text}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profil</TabsTrigger>
          <TabsTrigger value="preferences">Preferenser</TabsTrigger>
          <TabsTrigger value="subscription">Prenumeration</TabsTrigger>
          <TabsTrigger value="settings">Inställningar</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personlig Information
              </CardTitle>
              <CardDescription>
                Uppdatera din grundläggande profilinformation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={formData.avatar_url || "/placeholder.svg"} alt={formData.full_name} />
                  <AvatarFallback className="text-lg">
                    {formData.full_name?.charAt(0) || user.email?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Button variant="outline" size="sm" className="mb-2">
                    <Camera className="h-4 w-4 mr-2" />
                    Byt profilbild
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    JPG, PNG eller GIF. Max 5MB.
                  </p>
                </div>
              </div>

              <Separator />

              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Fullständigt namn</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name || ''}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                    placeholder="Ditt fullständiga namn"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-post</Label>
                  <Input
                    id="email"
                    value={formData.email || ''}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    E-postadressen kan inte ändras
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefonnummer</Label>
                  <Input
                    id="phone"
                    value={formData.phone || ''}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+46 70 123 45 67"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Plats</Label>
                  <Input
                    id="location"
                    value={formData.location || ''}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="Stockholm, Sverige"
                  />
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio" className="flex items-center gap-2">
                  Om mig
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-purple-600 hover:text-purple-700"
                    onClick={() => improveWithAI('bio', formData.bio || '')}
                    disabled={isUpdating}
                    title="Förbättra med AI"
                  >
                    {isUpdating ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-b border-purple-600" />
                    ) : (
                      <Sparkles className="h-3 w-3" />
                    )}
                  </Button>
                </Label>
                <Textarea
                  id="bio"
                  value={formData.bio || ''}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  placeholder="Berätta lite om dig själv..."
                  rows={4}
                />
              </div>

              {/* Professional Info */}
              <Separator />
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Professionell Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="job_title" className="flex items-center gap-2">
                      Jobbtitel
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-blue-600 hover:text-blue-700"
                        onClick={() => improveWithAI('job_title', formData.job_title || '')}
                        disabled={isUpdating}
                        title="Förbättra med AI"
                      >
                        {isUpdating ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-600" />
                        ) : (
                          <Wand2 className="h-3 w-3" />
                        )}
                      </Button>
                    </Label>
                    <Input
                      id="job_title"
                      value={formData.job_title || ''}
                      onChange={(e) => handleInputChange('job_title', e.target.value)}
                      placeholder="Senior Utvecklare"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Företag</Label>
                    <Input
                      id="company"
                      value={formData.company || ''}
                      onChange={(e) => handleInputChange('company', e.target.value)}
                      placeholder="Ditt nuvarande företag"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experience_level">Erfarenhetsnivå</Label>
                  <Select
                    value={formData.experience_level || ''}
                    onValueChange={(value) => handleInputChange('experience_level', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Välj erfarenhetsnivå" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="junior">Junior (0-2 år)</SelectItem>
                      <SelectItem value="mid">Mellannivå (2-5 år)</SelectItem>
                      <SelectItem value="senior">Senior (5-10 år)</SelectItem>
                      <SelectItem value="lead">Lead (10+ år)</SelectItem>
                      <SelectItem value="executive">Executive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Social Links */}
              <Separator />
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Sociala länkar</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="website" className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Webbsida
                    </Label>
                    <Input
                      id="website"
                      value={formData.website || ''}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      placeholder="https://din-webbsida.se"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="linkedin_url" className="flex items-center gap-2">
                      <Linkedin className="h-4 w-4" />
                      LinkedIn
                    </Label>
                    <Input
                      id="linkedin_url"
                      value={formData.linkedin_url || ''}
                      onChange={(e) => handleInputChange('linkedin_url', e.target.value)}
                      placeholder="https://linkedin.com/in/ditt-namn"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="github_url" className="flex items-center gap-2">
                    <Github className="h-4 w-4" />
                    GitHub
                  </Label>
                  <Input
                    id="github_url"
                    value={formData.github_url || ''}
                    onChange={(e) => handleInputChange('github_url', e.target.value)}
                    placeholder="https://github.com/ditt-användarnamn"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Jobbsökningspreferenser
              </CardTitle>
              <CardDescription>
                Anpassa dina jobbsökningsinställningar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Jobbsökningsstatus</Label>
                <Select
                  value={formData.job_search_status || ''}
                  onValueChange={(value) => handleInputChange('job_search_status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Välj status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="actively_looking">Aktivt sökande</SelectItem>
                    <SelectItem value="open_to_offers">Öppen för erbjudanden</SelectItem>
                    <SelectItem value="not_looking">Söker inte</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Distansarbete</Label>
                <Select
                  value={formData.remote_work_preference || ''}
                  onValueChange={(value) => handleInputChange('remote_work_preference', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Välj preferens" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="remote">Endast distans</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                    <SelectItem value="onsite">På plats</SelectItem>
                    <SelectItem value="flexible">Flexibelt</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="salary_min">Minimilön (SEK/månad)</Label>
                  <Input
                    id="salary_min"
                    type="number"
                    value={formData.preferred_salary_min || ''}
                    onChange={(e) => handleInputChange('preferred_salary_min', parseInt(e.target.value) || 0)}
                    placeholder="35000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salary_max">Maximilön (SEK/månad)</Label>
                  <Input
                    id="salary_max"
                    type="number"
                    value={formData.preferred_salary_max || ''}
                    onChange={(e) => handleInputChange('preferred_salary_max', parseInt(e.target.value) || 0)}
                    placeholder="65000"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscription Tab */}
        <TabsContent value="subscription" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Prenumeration
              </CardTitle>
              <CardDescription>
                Hantera din prenumeration och betalning
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">
                      {formData.subscription_tier === 'free' && 'Gratis Plan'}
                      {formData.subscription_tier === 'pro' && 'Pro Plan'}
                      {formData.subscription_tier === 'premium' && 'Premium Plan'}
                      {formData.subscription_tier === 'enterprise' && 'Enterprise Plan'}
                    </h3>
                    <Badge variant={formData.subscription_status === 'active' ? 'default' : 'secondary'}>
                      {formData.subscription_status === 'active' && 'Aktiv'}
                      {formData.subscription_status === 'inactive' && 'Inaktiv'}
                      {formData.subscription_status === 'canceled' && 'Avbruten'}
                      {formData.subscription_status === 'past_due' && 'Förfallen'}
                      {formData.subscription_status === 'trialing' && 'Testperiod'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formData.subscription_tier === 'free' && 'Grundläggande funktioner inkluderade'}
                    {formData.subscription_tier === 'pro' && '99 kr/månad - Avancerade funktioner'}
                    {formData.subscription_tier === 'premium' && '199 kr/månad - Alla funktioner'}
                    {formData.subscription_tier === 'enterprise' && '299 kr/månad - Företagslösning'}
                  </p>
                  {formData.subscription_expires_at && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Förnyelse: {new Date(formData.subscription_expires_at).toLocaleDateString('sv-SE')}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  {formData.subscription_tier === 'free' ? (
                    <Button>Uppgradera</Button>
                  ) : (
                    <>
                      <Button variant="outline">Ändra plan</Button>
                      <Button variant="destructive">Avbryt</Button>
                    </>
                  )}
                </div>
              </div>

              {formData.subscription_tier !== 'free' && (
                <div className="space-y-4">
                  <h4 className="font-semibold">Betalningshistorik</h4>
                  <div className="border rounded-lg">
                    <div className="p-4 text-center text-muted-foreground">
                      Inga betalningar att visa
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifieringar
              </CardTitle>
              <CardDescription>
                Hantera dina notifieringsinställningar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email_notifications">E-postnotifieringar</Label>
                  <p className="text-sm text-muted-foreground">
                    Få viktiga uppdateringar via e-post
                  </p>
                </div>
                <Switch
                  id="email_notifications"
                  checked={formData.email_notifications || false}
                  onCheckedChange={(checked) => handleInputChange('email_notifications', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="marketing_emails">Marknadsföringsmail</Label>
                  <p className="text-sm text-muted-foreground">
                    Få tips, nyheter och erbjudanden
                  </p>
                </div>
                <Switch
                  id="marketing_emails"
                  checked={formData.marketing_emails || false}
                  onCheckedChange={(checked) => handleInputChange('marketing_emails', checked)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Integritet
              </CardTitle>
              <CardDescription>
                Kontrollera vem som kan se din profil
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>Profilsynlighet</Label>
                <Select
                  value={formData.profile_visibility || ''}
                  onValueChange={(value) => handleInputChange('profile_visibility', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Välj synlighet" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Offentlig</SelectItem>
                    <SelectItem value="recruiters_only">Endast rekryterare</SelectItem>
                    <SelectItem value="private">Privat</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  {formData.profile_visibility === 'public' && 'Din profil är synlig för alla'}
                  {formData.profile_visibility === 'recruiters_only' && 'Endast verifierade rekryterare kan se din profil'}
                  {formData.profile_visibility === 'private' && 'Din profil är privat och inte synlig för andra'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <Shield className="h-5 w-5" />
                Farlig zon
              </CardTitle>
              <CardDescription>
                Irreversibla åtgärder för ditt konto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border border-red-200 rounded-lg bg-red-50 dark:bg-red-950/20 dark:border-red-800">
                  <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">Radera konto</h4>
                  <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                    Detta kommer permanent radera ditt konto och all associerad data. 
                    Denna åtgärd kan inte ångras.
                  </p>
                  <Button variant="destructive" size="sm">
                    Radera konto
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

        {/* Save Button */}
        <div className="flex justify-end pt-6 border-t">
          <Button 
            onClick={handleSave} 
            disabled={isUpdating}
            className="flex items-center gap-2"
          >
            {isUpdating ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isUpdating ? 'Sparar...' : 'Spara ändringar'}
          </Button>
        </div>
      </div>
      <Footer />
    </div>
  )
}