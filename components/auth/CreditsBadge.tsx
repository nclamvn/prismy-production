'use client'

import { useAuth } from '@/hooks/useAuth'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/Button'
import { Coins, CreditCard, Loader2, AlertTriangle } from 'lucide-react'
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface CreditsBadgeProps {
  showUpgradeModal?: boolean
  className?: string
}

export function CreditsBadge({ showUpgradeModal = true, className }: CreditsBadgeProps) {
  const { credits, creditsLoading, getUserTier } = useAuth()
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false)

  if (creditsLoading) {
    return (
      <Badge variant="secondary" className={className}>
        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
        Loading...
      </Badge>
    )
  }

  if (!credits) {
    return (
      <Badge variant="destructive" className={className}>
        <AlertTriangle className="h-3 w-3 mr-1" />
        Credits unavailable
      </Badge>
    )
  }

  const tier = getUserTier()
  const isLowCredits = credits.credits_left <= 2
  const isOutOfCredits = credits.credits_left === 0

  const badgeVariant = isOutOfCredits 
    ? 'destructive' 
    : isLowCredits 
    ? 'secondary' 
    : 'default'

  const BadgeContent = (
    <Badge 
      variant={badgeVariant} 
      className={`cursor-pointer hover:opacity-80 transition-opacity ${className}`}
    >
      <Coins className="h-3 w-3 mr-1" />
      {credits.credits_left} credits
    </Badge>
  )

  if (!showUpgradeModal || (!isLowCredits && !isOutOfCredits)) {
    return BadgeContent
  }

  return (
    <Dialog open={upgradeModalOpen} onOpenChange={setUpgradeModalOpen}>
      <DialogTrigger asChild>
        {BadgeContent}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <CreditCard className="h-5 w-5 mr-2 text-blue-600" />
            {isOutOfCredits ? 'Out of Credits' : 'Low on Credits'}
          </DialogTitle>
          <DialogDescription>
            {isOutOfCredits 
              ? 'You\'ve used all your free credits. Upgrade to continue using AI features.'
              : `You have ${credits.credits_left} credits remaining. Upgrade to get more credits and unlock premium features.`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Usage */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Current Plan</span>
              <Badge variant="outline" className="capitalize">{tier}</Badge>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Credits Used</span>
              <span className="text-sm font-medium">{credits.credits_used}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Credits Remaining</span>
              <span className={`text-sm font-medium ${isOutOfCredits ? 'text-red-600' : 'text-green-600'}`}>
                {credits.credits_left}
              </span>
            </div>
          </div>

          {/* Upgrade Options */}
          <div className="space-y-2">
            <Button className="w-full" size="sm">
              <CreditCard className="h-4 w-4 mr-2" />
              Upgrade to Basic - $9/month
            </Button>
            <Button variant="outline" className="w-full" size="sm">
              <Coins className="h-4 w-4 mr-2" />
              Buy 50 Credits - $5
            </Button>
          </div>

          {/* Benefits */}
          <div className="text-xs text-gray-500 space-y-1">
            <p className="font-medium">Upgrade benefits:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Unlimited document translations</li>
              <li>Priority AI processing</li>
              <li>Advanced chat features</li>
              <li>Export to multiple formats</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}