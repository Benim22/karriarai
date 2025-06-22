"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Loader2, CreditCard, Crown, Zap, Building, ArrowRight, AlertTriangle } from 'lucide-react'
import { getPlanDetails, type PlanType } from '@/lib/stripe'

interface PaymentButtonProps {
  planType: PlanType
  email?: string
  successUrl?: string
  cancelUrl?: string
  className?: string
  variant?: 'default' | 'outline' | 'secondary' | 'destructive' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  children?: React.ReactNode
  showIcon?: boolean
  disabled?: boolean
}

const planIcons = {
  pro_monthly: Zap,
  pro_lifetime: Crown,
  enterprise_monthly: Building,
  enterprise_lifetime: Building,
  extra_cv: CreditCard,
  single_export: ArrowRight
}

export function PaymentButton({
  planType,
  email,
  successUrl,
  cancelUrl,
  className,
  variant = 'default',
  size = 'default',
  children,
  showIcon = true,
  disabled = false
}: PaymentButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  
  const planDetails = getPlanDetails(planType)
  const Icon = planIcons[planType] || CreditCard

  const handlePayment = async () => {
    if (!email) {
      toast({
        title: "Email krävs",
        description: "Du måste logga in för att göra en betalning",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planType,
          email,
          successUrl,
          cancelUrl
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 503) {
          toast({
            title: "Betalningssystem inte konfigurerat",
            description: "Kontakta support för att slutföra köpet.",
            variant: "destructive"
          })
          return
        }
        throw new Error(data.error || 'Failed to create checkout session')
      }

      const { url } = data
      
      if (url) {
        window.location.href = url
      } else {
        throw new Error('No checkout URL received')
      }
    } catch (error) {
      console.error('Payment error:', error)
      toast({
        title: "Betalningsfel",
        description: "Kunde inte starta betalningen. Försök igen eller kontakta support.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!planDetails) {
    return null
  }

  return (
    <Button
      onClick={handlePayment}
      disabled={isLoading || disabled}
      variant={variant}
      size={size}
      className={className}
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        showIcon && <Icon className="mr-2 h-4 w-4" />
      )}
      {children || `Köp ${planDetails.name} - ${planDetails.price} kr`}
      {isLoading && "Laddar..."}
    </Button>
  )
}

// Specialized components for common use cases
export function ProMonthlyButton({ email, className, ...props }: Omit<PaymentButtonProps, 'planType'>) {
  return (
    <PaymentButton
      planType="pro_monthly"
      email={email}
      className={className}
      {...props}
    >
      Uppgradera till Pro - 99 kr/mån
    </PaymentButton>
  )
}

export function ProLifetimeButton({ email, className, ...props }: Omit<PaymentButtonProps, 'planType'>) {
  return (
    <PaymentButton
      planType="pro_lifetime"
      email={email}
      variant="default"
      className={`bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 ${className}`}
      {...props}
    >
      Köp Pro Livstid - 1,990 kr
    </PaymentButton>
  )
}

export function EnterpriseMonthlyButton({ email, className, ...props }: Omit<PaymentButtonProps, 'planType'>) {
  return (
    <PaymentButton
      planType="enterprise_monthly"
      email={email}
      className={className}
      {...props}
    >
      Uppgradera till Enterprise - 299 kr/mån
    </PaymentButton>
  )
}

export function EnterpriseLifetimeButton({ email, className, ...props }: Omit<PaymentButtonProps, 'planType'>) {
  return (
    <PaymentButton
      planType="enterprise_lifetime"
      email={email}
      variant="default"
      className={`bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 ${className}`}
      {...props}
    >
      Köp Enterprise Livstid - 4,990 kr
    </PaymentButton>
  )
}

export function ExtraCVButton({ email, className, ...props }: Omit<PaymentButtonProps, 'planType'>) {
  return (
    <PaymentButton
      planType="extra_cv"
      email={email}
      variant="outline"
      className={className}
      {...props}
    >
      Köp Extra CV - 19 kr
    </PaymentButton>
  )
}

export function SingleExportButton({ email, className, ...props }: Omit<PaymentButtonProps, 'planType'>) {
  return (
    <PaymentButton
      planType="single_export"
      email={email}
      variant="outline"
      className={className}
      {...props}
    >
      Köp Export - 9 kr
    </PaymentButton>
  )
}

// Component to show when payment system is not configured
export function PaymentUnavailableNotice() {
  return (
    <div className="flex items-center gap-2 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
      <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
      <div className="text-sm text-yellow-800 dark:text-yellow-200">
        Betalningssystemet konfigureras just nu. Kontakta oss för att slutföra ditt köp.
      </div>
    </div>
  )
} 