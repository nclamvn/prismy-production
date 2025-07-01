'use client'

import { useState } from 'react'
import { useWorkspaceStore } from './hooks/useWorkspaceStore'
import { X, Crown, Check, Zap, Shield, Bot } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  reason?: 'credits' | 'features'
}

export function UpgradeModal({ isOpen, onClose, reason = 'credits' }: UpgradeModalProps) {
  const { credits, tier } = useWorkspaceStore()
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'pro' | 'enterprise'>('basic')

  if (!isOpen) return null

  const plans = [
    {
      id: 'basic' as const,
      name: 'Basic',
      price: '$9',
      period: '/month',
      credits: '500 credits/month',
      description: 'Perfect for individuals and small teams',
      features: [
        'High-quality AI translation',
        'Advanced document parsing',
        'Chat with unlimited documents',
        'Download translated files',
        'Email support'
      ],
      popular: false
    },
    {
      id: 'pro' as const,
      name: 'Pro',
      price: '$29',
      period: '/month',
      credits: '2,000 credits/month',
      description: 'For growing businesses and power users',
      features: [
        'Everything in Basic',
        'Premium AI models (GPT-4, Claude)',
        'Batch document processing',
        'Layout preservation for PDFs',
        'Priority support',
        'API access'
      ],
      popular: true
    },
    {
      id: 'enterprise' as const,
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      credits: 'Unlimited credits',
      description: 'For large organizations with custom needs',
      features: [
        'Everything in Pro',
        'Custom AI model training',
        'On-premise deployment',
        'SSO integration',
        'Dedicated account manager',
        'SLA guarantee'
      ],
      popular: false
    }
  ]

  const handleUpgrade = async (planId: string) => {
    // In production, integrate with Stripe or your payment processor
    console.log('Upgrading to plan:', planId)
    
    // Mock upgrade success
    alert(`Upgrade to ${planId} plan initiated! You would be redirected to Stripe checkout.`)
    
    // For demo purposes, just close the modal
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-bg-overlay"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-surface border border-border-default rounded-lg elevation-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-surface border-b border-border-default p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-primary">
              {reason === 'credits' ? 'Credits Exhausted' : 'Upgrade Your Plan'}
            </h2>
            <p className="text-secondary mt-1">
              {reason === 'credits' 
                ? `You have ${credits} credits remaining. Upgrade to continue using AI features.`
                : 'Unlock more features with a premium plan'
              }
            </p>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 hover:bg-bg-muted rounded-lg transition-colors"
            aria-label="Close upgrade modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Current Usage */}
        {reason === 'credits' && (
          <div className="p-6 border-b border-border-default bg-bg-muted">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-primary">Current Plan: {tier}</h3>
                <p className="text-secondary text-sm">Credits remaining: {credits}/20</p>
              </div>
              
              <div className="w-32 bg-border-default rounded-full h-3">
                <div 
                  className="bg-accent-brand h-3 rounded-full transition-all"
                  style={{ width: `${(credits / 20) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Pricing Plans */}
        <div className="p-6">
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`
                  relative border rounded-lg p-6 cursor-pointer transition-all
                  ${selectedPlan === plan.id 
                    ? 'border-accent-brand bg-accent-brand-light' 
                    : 'border-border-default hover:border-border-focus'
                  }
                  ${plan.popular ? 'ring-2 ring-accent-brand' : ''}
                `}
                onClick={() => setSelectedPlan(plan.id)}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <div className="bg-accent-brand text-white px-3 py-1 rounded-full text-xs font-medium">
                      Most Popular
                    </div>
                  </div>
                )}

                {/* Plan Header */}
                <div className="text-center mb-6">
                  <div className="flex items-center justify-center mb-2">
                    <Crown size={24} className="text-accent-brand" />
                  </div>
                  <h3 className="text-xl font-bold text-primary">{plan.name}</h3>
                  <div className="mt-2">
                    <span className="text-3xl font-bold text-primary">{plan.price}</span>
                    <span className="text-secondary">{plan.period}</span>
                  </div>
                  <p className="text-sm text-accent-brand font-medium mt-1">{plan.credits}</p>
                  <p className="text-xs text-secondary mt-2">{plan.description}</p>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <Check size={16} className="text-accent-brand flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-secondary">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Select Button */}
                <Button
                  variant={selectedPlan === plan.id ? 'default' : 'outline'}
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleUpgrade(plan.id)
                  }}
                >
                  {plan.id === 'enterprise' ? 'Contact Sales' : 'Select Plan'}
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Benefits Summary */}
        <div className="border-t border-border-default p-6 bg-bg-muted">
          <h3 className="font-semibold text-primary mb-4 text-center">
            Why upgrade from the free tier?
          </h3>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <Zap size={32} className="text-accent-brand mx-auto mb-2" />
              <h4 className="font-medium text-primary mb-1">Faster Processing</h4>
              <p className="text-sm text-secondary">Premium AI models with better accuracy and speed</p>
            </div>
            
            <div className="text-center">
              <Shield size={32} className="text-accent-brand mx-auto mb-2" />
              <h4 className="font-medium text-primary mb-1">Advanced Security</h4>
              <p className="text-sm text-secondary">Enterprise-grade encryption and compliance</p>
            </div>
            
            <div className="text-center">
              <Bot size={32} className="text-accent-brand mx-auto mb-2" />
              <h4 className="font-medium text-primary mb-1">Unlimited AI Chat</h4>
              <p className="text-sm text-secondary">Ask unlimited questions about your documents</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border-default p-6 text-center">
          <p className="text-sm text-secondary">
            All plans include a 14-day free trial. Cancel anytime.
          </p>
          <p className="text-xs text-muted mt-2">
            By upgrading, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  )
}