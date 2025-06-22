"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { FileText, Plus, Calendar, Edit, Trash2, Eye } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { sv } from "date-fns/locale"
import { getSubscriptionLimits, getUserSubscriptionInfo } from "@/lib/subscription-helpers"

interface CV {
  id: string
  title: string
  content: any
  created_at: string
  updated_at: string
}

interface Profile {
  id: string
  subscription_tier: string
  extra_cv_credits: number
}

interface UserData {
  profile: Profile | null
  subscriptionTier: string
}

interface CVOverviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateNew: () => void
  onShowPayment: () => void
}

export function CVOverviewDialog({ open, onOpenChange, onCreateNew, onShowPayment }: CVOverviewDialogProps) {
  const { user } = useAuth()
  const [cvs, setCVs] = useState<CV[]>([])
  const [userData, setUserData] = useState<UserData>({ profile: null, subscriptionTier: 'free' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && user) {
      loadData()
    }
  }, [open, user])



  const loadData = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const { supabase } = await import("@/lib/supabase")
      
      // Hämta CV:n, profil och prenumerationsnivå parallellt
      const [cvsResult, profileResult, subscriptionTier] = await Promise.all([
        supabase
          .from('cvs')
          .select('*')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false }),
        supabase
          .from('karriar_profiles')
          .select('*')
          .eq('id', user.id)
          .single(),
        getUserSubscriptionInfo(user.id)
      ])

      if (cvsResult.error) throw cvsResult.error
      if (profileResult.error) throw profileResult.error

      setCVs(cvsResult.data || [])
      setUserData({
        profile: profileResult.data,
        subscriptionTier: subscriptionTier?.subscription_tier || 'free'
      })
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateNew = () => {
    if (!userData.profile) return

    const limits = getSubscriptionLimits(userData.subscriptionTier)
    const extraCredits = userData.profile.extra_cv_credits || 0
    const totalAllowed = limits.cvs === -1 ? -1 : limits.cvs + extraCredits

    // Kontrollera om användaren har nått sin gräns
    if (totalAllowed !== -1 && cvs.length >= totalAllowed) {
      // Visa betalningsdialog
      onShowPayment()
    } else {
      // Gå direkt till CV-byggaren
      onCreateNew()
    }
  }

  const deletCV = async (cvId: string) => {
    if (!user) return
    
    try {
      const { supabase } = await import("@/lib/supabase")
      
      const { error } = await supabase
        .from('cvs')
        .delete()
        .eq('id', cvId)
        .eq('user_id', user.id)

      if (error) throw error
      
      // Uppdatera listan
      setCVs(prev => prev.filter(cv => cv.id !== cvId))
    } catch (error) {
      console.error('Error deleting CV:', error)
    }
  }

  const canCreateMore = () => {
    if (!userData.profile) return false
    const limits = getSubscriptionLimits(userData.subscriptionTier)
    const extraCredits = userData.profile.extra_cv_credits || 0
    const totalAllowed = limits.cvs === -1 ? -1 : limits.cvs + extraCredits
    return totalAllowed === -1 || cvs.length < totalAllowed
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Mina CV:n
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Skapa nytt CV knapp */}
          <Card className="border-dashed border-2 hover:border-primary/50 transition-colors">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Plus className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Skapa nytt CV</h3>
              <p className="text-muted-foreground text-center mb-4">
                {canCreateMore() 
                  ? "Börja med att skapa ett nytt professionellt CV"
                  : "Du har nått din CV-gräns. Uppgradera eller köp extra krediter för att skapa fler CV:n"
                }
              </p>
              <Button onClick={handleCreateNew} className="gap-2">
                <Plus className="h-4 w-4" />
                {canCreateMore() ? "Skapa nytt CV" : "Skapa nytt CV (19 kr)"}
              </Button>
              {userData.profile && (
                <p className="text-xs text-muted-foreground mt-2">
                  {userData.subscriptionTier === 'free' 
                    ? `${cvs.length}/${getSubscriptionLimits(userData.subscriptionTier).cvs + (userData.profile.extra_cv_credits || 0)} CV:n använda`
                    : "Obegränsade CV:n"
                  }
                </p>
              )}
            </CardContent>
          </Card>

          {/* Befintliga CV:n */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Laddar dina CV:n...</p>
            </div>
          ) : cvs.length > 0 ? (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-4">Befintliga CV:n ({cvs.length})</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {cvs.map((cv) => (
                    <Card key={cv.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-start justify-between">
                          <span className="line-clamp-1">{cv.title}</span>
                          <Badge variant="secondary" className="ml-2 shrink-0">
                            <FileText className="h-3 w-3 mr-1" />
                            CV
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3" />
                            Uppdaterad {formatDistanceToNow(new Date(cv.updated_at), { 
                              addSuffix: true, 
                              locale: sv 
                            })}
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            asChild
                            className="flex-1"
                            onClick={() => onOpenChange(false)}
                          >
                            <Link href={`/cv-builder?id=${cv.id}`}>
                              <Edit className="h-3 w-3 mr-1" />
                              Redigera
                            </Link>
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => deletCV(cv.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Inga CV:n ännu</h3>
              <p className="text-muted-foreground">
                Du har inte skapat några CV:n ännu. Kom igång genom att skapa ditt första CV!
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 