"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, User, LogOut, Settings, FileText, AlertTriangle, X } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { refreshSession, clearLocalSession } from "@/lib/auth-helpers"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CVOverviewDialog } from "@/components/cv-overview-dialog"
import { CVPaymentDialog } from "@/components/cv-payment-dialog"

const publicNavItems = [
  { href: "/", label: "Hem" },
  { href: "/priser", label: "Priser" },
  { href: "/exempel-cv", label: "Exempel" },
  { href: "/om-oss", label: "Om oss" },
  { href: "/kontakt", label: "Kontakt" },
  { href: "/blogg", label: "Blogg" },
]

const protectedNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: FileText },
  { href: "#", label: "CV-byggare", icon: FileText, isDialog: true },
  { href: "/exempel-cv", label: "CV-mallar", icon: FileText },
  { href: "/jobbmatchning", label: "Jobb", icon: FileText },
]

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [showError, setShowError] = useState(true)
  const [showCVOverview, setShowCVOverview] = useState(false)
  const [showCVPayment, setShowCVPayment] = useState(false)
  const pathname = usePathname()
  const { user, profile, error, signOut } = useAuth()

  const handleSignOut = async () => {
    try {
      await signOut()
      // Successful logout - could redirect or show success message
    } catch (error) {
      console.error("Error signing out:", error)
      // Even if there's an error, the auth provider should handle cleanup
      // So we don't need to show an error to the user for logout
    }
  }

  const handleRefreshSession = async () => {
    try {
      const result = await refreshSession()
      if (result.success) {
        setShowError(false)
        window.location.reload() // Reload to refresh auth state
      }
    } catch (error) {
      console.error("Error refreshing session:", error)
    }
  }

  const handleForceLogout = () => {
    // Force logout by clearing everything
    clearLocalSession()
    setShowError(false)
    window.location.href = '/auth/login' // Hard redirect to login
  }

  const handleCVBuilderClick = (e: React.MouseEvent) => {
    e.preventDefault()
    setShowCVOverview(true)
  }

  const handleCreateNewCV = () => {
    setShowCVOverview(false)
    // Gå direkt till CV-byggaren för att skapa nytt CV
    window.location.href = '/cv-builder'
  }

  const handleShowPayment = () => {
    setShowCVOverview(false)
    setShowCVPayment(true)
  }

  const handlePayOneTime = () => {
    setShowCVPayment(false)
    // Betalning hanteras i CVPaymentDialog komponenten
  }

  const handleUpgradeSubscription = () => {
    setShowCVPayment(false)
    // Redirect hanteras i CVPaymentDialog komponenten
  }

  return (
    <>
      {/* Error Alert */}
      {error && showError && (
        <Alert variant="destructive" className="rounded-none border-x-0 border-t-0">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <div className="flex items-center gap-2">
              {error.includes('Session') && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRefreshSession}
                    className="h-6 px-2 text-xs hover:bg-transparent cursor-pointer"
                  >
                    Uppdatera
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleForceLogout}
                    className="h-6 px-2 text-xs hover:bg-transparent text-red-600 cursor-pointer"
                  >
                    Logga ut
                  </Button>
                </>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowError(false)}
                className="h-6 w-6 p-0 hover:bg-transparent cursor-pointer"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 cursor-pointer">
            <Image 
              src="/logo.png" 
              alt="KarriärAI Logo" 
              width={40} 
              height={40}
              className="h-8 w-auto sm:h-10"
              priority
            />
            <span className="font-bold text-lg sm:text-xl">KarriärAI</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {user ? (
              // Authenticated navigation
              <>
                {protectedNavItems.map((item) => (
                  item.isDialog ? (
                    <button
                      key={item.href}
                      onClick={handleCVBuilderClick}
                      className={`text-sm font-medium transition-colors hover:text-primary cursor-pointer ${
                        pathname === item.href ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                      {item.label}
                    </button>
                  ) : (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`text-sm font-medium transition-colors hover:text-primary cursor-pointer ${
                        pathname === item.href ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                      {item.label}
                    </Link>
                  )
                ))}
              </>
            ) : (
              // Public navigation
              <>
                {publicNavItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`text-sm font-medium transition-colors hover:text-primary cursor-pointer ${
                      pathname === item.href ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            <ThemeToggle />

            {user ? (
              // User menu
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full cursor-pointer">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile?.avatar_url || "/placeholder.svg"} alt={profile?.full_name} />
                      <AvatarFallback>{profile?.full_name?.charAt(0) || user.email?.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      {profile?.full_name && <p className="font-medium">{profile.full_name}</p>}
                      <p className="w-[200px] truncate text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/konto" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Kontoinställningar
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/betalning" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Prenumeration
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logga ut
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              // Auth buttons
              <div className="hidden md:flex items-center space-x-2">
                <Button variant="ghost" asChild>
                  <Link href="/auth/login" className="cursor-pointer">Logga in</Link>
                </Button>
                <Button asChild>
                  <Link href="/auth/register" className="cursor-pointer">Kom igång</Link>
                </Button>
              </div>
            )}

            {/* Mobile menu */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden cursor-pointer">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Öppna meny</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <div className="flex flex-col space-y-4 mt-4">
                  {user ? (
                    <>
                      {protectedNavItems.map((item) => (
                        item.isDialog ? (
                          <button
                            key={item.href}
                            onClick={() => {
                              handleCVBuilderClick(new MouseEvent('click') as any)
                              setIsOpen(false)
                            }}
                            className={`text-sm font-medium transition-colors hover:text-primary cursor-pointer text-left ${
                              pathname === item.href ? "text-primary" : "text-muted-foreground"
                            }`}
                          >
                            {item.label}
                          </button>
                        ) : (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={`text-sm font-medium transition-colors hover:text-primary cursor-pointer ${
                              pathname === item.href ? "text-primary" : "text-muted-foreground"
                            }`}
                            onClick={() => setIsOpen(false)}
                          >
                            {item.label}
                          </Link>
                        )
                      ))}
                      <div className="border-t pt-4">
                        <Link
                          href="/konto"
                          className="block text-sm font-medium text-muted-foreground hover:text-primary cursor-pointer"
                          onClick={() => setIsOpen(false)}
                        >
                          Kontoinställningar
                        </Link>
                        <Link
                          href="/betalning"
                          className="block text-sm font-medium text-muted-foreground hover:text-primary mt-2 cursor-pointer"
                          onClick={() => setIsOpen(false)}
                        >
                          Prenumeration
                        </Link>
                        <button
                          onClick={() => {
                            handleSignOut()
                            setIsOpen(false)
                          }}
                          className="block text-sm font-medium text-muted-foreground hover:text-primary mt-2 cursor-pointer"
                        >
                          Logga ut
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      {publicNavItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`text-sm font-medium transition-colors hover:text-primary cursor-pointer ${
                            pathname === item.href ? "text-primary" : "text-muted-foreground"
                          }`}
                          onClick={() => setIsOpen(false)}
                        >
                          {item.label}
                        </Link>
                      ))}
                      <div className="border-t pt-4 space-y-2">
                        <Button variant="ghost" asChild className="w-full justify-start">
                          <Link href="/auth/login" onClick={() => setIsOpen(false)} className="cursor-pointer">
                            Logga in
                          </Link>
                        </Button>
                        <Button asChild className="w-full">
                          <Link href="/auth/register" onClick={() => setIsOpen(false)} className="cursor-pointer">
                            Kom igång
                          </Link>
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>

    {/* CV Dialogs */}
    <CVOverviewDialog
      open={showCVOverview}
      onOpenChange={setShowCVOverview}
      onCreateNew={handleCreateNewCV}
      onShowPayment={handleShowPayment}
    />
    
    <CVPaymentDialog
      open={showCVPayment}
      onOpenChange={setShowCVPayment}
      onPayOneTime={handlePayOneTime}
      onUpgradeSubscription={handleUpgradeSubscription}
    />
    </>
  )
}
