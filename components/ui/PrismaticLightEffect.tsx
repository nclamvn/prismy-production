'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

interface PrismaticLightEffectProps {
  trigger?: boolean
  onComplete?: () => void
  className?: string
}

export default function PrismaticLightEffect({ 
  trigger = false, 
  onComplete,
  className = "" 
}: PrismaticLightEffectProps) {
  const [animationPhase, setAnimationPhase] = useState<'hidden' | 'light' | 'rainbow' | 'fade'>('hidden')
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (trigger) {
      const sequence = async () => {
        // Phase 1: Gray light beam appears (0-1.5s)
        setIsVisible(true)
        setAnimationPhase('light')
        
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        // Phase 2: Rainbow rays expand (1.5-4s)
        setAnimationPhase('rainbow')
        
        await new Promise(resolve => setTimeout(resolve, 2500))
        
        // Phase 3: Gentle fade out (4-6s)
        setAnimationPhase('fade')
        
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        setIsVisible(false)
        setAnimationPhase('hidden')
        onComplete?.()
      }
      
      sequence()
    }
  }, [trigger, onComplete])

  if (!isVisible) return null

  // Rainbow colors with exact spectrum
  const rainbowColors = [
    '#ff0000', // Red
    '#ff7f00', // Orange  
    '#ffff00', // Yellow
    '#00ff00', // Green
    '#0000ff', // Blue
    '#4b0082', // Indigo
    '#9400d3'  // Violet
  ]

  return (
    <div 
      className={`fixed inset-0 pointer-events-none z-[1] overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {/* Subtle gray light beam from top-left to header center-bottom */}
      <motion.div
        className="absolute"
        style={{
          top: '0%',
          left: '0%',
          width: '2px',
          height: '50vh',
          background: 'linear-gradient(135deg, rgba(128,128,128,0.2) 0%, rgba(128,128,128,0.15) 50%, rgba(128,128,128,0.1) 100%)',
          transformOrigin: 'top left',
          filter: 'blur(1px)',
        }}
        initial={{ scaleY: 0, opacity: 0 }}
        animate={animationPhase === 'light' ? { 
          scaleY: 1, 
          opacity: 1,
          transition: { duration: 1.5, ease: "easeOut" }
        } : animationPhase === 'rainbow' ? {
          scaleY: 1,
          opacity: 0.8,
          transition: { duration: 0.5 }
        } : animationPhase === 'fade' ? {
          opacity: 0,
          transition: { duration: 2.0, ease: "easeOut" }
        } : { opacity: 0 }}
      />

      {/* Seven rainbow rays fanning upward from header center-bottom */}
      <div 
        className="absolute"
        style={{
          top: '50vh',
          left: '50%',
          transform: 'translateX(-50%)',
        }}
      >
        {rainbowColors.map((color, index) => {
          // Center the rays around 0 degrees, spacing them 6 degrees apart
          const angle = (index - 3) * 6 // -18, -12, -6, 0, 6, 12, 18 degrees
          
          return (
            <motion.div
              key={color}
              className="absolute"
              style={{
                width: '1px',
                height: '50vh',
                background: `linear-gradient(180deg, ${color}40 0%, ${color}30 50%, ${color}20 80%, transparent 100%)`,
                transformOrigin: 'bottom center',
                bottom: 0,
                left: '50%',
                marginLeft: '-0.5px',
                filter: 'blur(1.5px)',
                transform: `rotate(${angle}deg)`,
              }}
              initial={{ scaleY: 0, opacity: 0 }}
              animate={animationPhase === 'rainbow' ? {
                scaleY: 1,
                opacity: 1,
                transition: { 
                  duration: 2.5, 
                  delay: index * 0.15,
                  ease: "easeOut" 
                }
              } : animationPhase === 'fade' ? {
                opacity: 0,
                transition: { 
                  duration: 2.0, 
                  delay: index * 0.1,
                  ease: "easeOut" 
                }
              } : { opacity: 0 }}
            />
          )
        })}
      </div>
    </div>
  )
}