import Link from "next/link"
import { Facebook, Twitter, Instagram, Linkedin, Mail } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-muted/50 border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-blue-600 to-emerald-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">K</span>
              </div>
              <span className="font-bold text-xl">KarriärAI</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Skapa professionella CV med AI-stöd och hitta ditt drömjobb.
            </p>
            <div className="flex space-x-4">
              <Link href="#" className="text-muted-foreground hover:text-primary cursor-pointer">
                <Facebook className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary cursor-pointer">
                <Twitter className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary cursor-pointer">
                <Instagram className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary cursor-pointer">
                <Linkedin className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Product */}
          <div className="space-y-4">
            <h3 className="font-semibold">Produkt</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/cv-builder" className="text-muted-foreground hover:text-primary cursor-pointer">
                  CV-byggare
                </Link>
              </li>
              <li>
                <Link href="/exempel-cv" className="text-muted-foreground hover:text-primary cursor-pointer">
                  CV-mallar
                </Link>
              </li>
              <li>
                <Link href="/jobbmatchning" className="text-muted-foreground hover:text-primary cursor-pointer">
                  Jobbmatchning
                </Link>
              </li>
              <li>
                <Link href="/priser" className="text-muted-foreground hover:text-primary cursor-pointer">
                  Priser
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <h3 className="font-semibold">Resurser</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/blogg" className="text-muted-foreground hover:text-primary cursor-pointer">
                  Blogg
                </Link>
              </li>
              <li>
                <Link href="/blogg/cv-tips" className="text-muted-foreground hover:text-primary cursor-pointer">
                  CV-tips
                </Link>
              </li>
              <li>
                <Link href="/blogg/intervjutips" className="text-muted-foreground hover:text-primary cursor-pointer">
                  Intervjutips
                </Link>
              </li>
              <li>
                <Link href="/blogg/karriarrad" className="text-muted-foreground hover:text-primary cursor-pointer">
                  Karriärråd
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-4">
            <h3 className="font-semibold">Företag</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/om-oss" className="text-muted-foreground hover:text-primary cursor-pointer">
                  Om oss
                </Link>
              </li>
              <li>
                <Link href="/kontakt" className="text-muted-foreground hover:text-primary cursor-pointer">
                  Kontakt
                </Link>
              </li>
              <li>
                <Link href="/integritetspolicy" className="text-muted-foreground hover:text-primary cursor-pointer">
                  Integritetspolicy
                </Link>
              </li>
              <li>
                <Link href="/användarvillkor" className="text-muted-foreground hover:text-primary cursor-pointer">
                  Användarvillkor
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground">© 2024 KarriärAI. Alla rättigheter förbehållna.</p>
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <Link href="mailto:support@karriarai.se" className="text-muted-foreground hover:text-primary cursor-pointer">
              <Mail className="h-4 w-4" />
            </Link>
            <span className="text-sm text-muted-foreground">support@karriarai.se</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
