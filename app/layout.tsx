import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/components/auth-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "KarriärAI - Skapa professionella CV med AI-stöd",
  description:
    "Skapa, anpassa och exportera professionella CV med AI-stöd. Välj mellan moderna mallar och få jobbförslag som matchar din profil.",
  keywords: "CV, curriculum vitae, jobbsökning, karriär, AI, mallar, professionell",
  authors: [{ name: "KarriärAI Team" }],
  openGraph: {
    title: "KarriärAI - Skapa professionella CV med AI-stöd",
    description: "Skapa, anpassa och exportera professionella CV med AI-stöd",
    url: "https://karriarai.se",
    siteName: "KarriärAI",
    locale: "sv_SE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "KarriärAI - Skapa professionella CV med AI-stöd",
    description: "Skapa, anpassa och exportera professionella CV med AI-stöd",
  },
  robots: {
    index: true,
    follow: true,
  },
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="sv" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
