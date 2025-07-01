/**
 * Motion System Test Suite
 * Target: 90% coverage for animation system
 */

import {
  zenEasing,
  hardwareEasing,
  notebookLMEasing,
  DURATION,
  GPU_OPTIMIZED,
  zenFade,
  whisperUp,
  microFloat,
  zenBreathe,
  whisperHover,
  breathHover,
  zenScale,
  notebookLMCard,
  notebookLMStagger,
  notebookLMButton
} from '../motion'

describe('Motion System', () => {
  describe('Constants and Configuration', () => {
    it('should export easing curves', () => {
      expect(zenEasing).toEqual([0.25, 0.46, 0.45, 0.94])
      expect(hardwareEasing).toEqual([0.4, 0, 0.2, 1])
      expect(notebookLMEasing).toEqual([0.2, 0, 0, 1])
    })

    it('should define duration constants', () => {
      expect(DURATION.instant).toBe(0.1)
      expect(DURATION.whisper).toBe(0.2)
      expect(DURATION.breath).toBe(0.3)
      expect(DURATION.meditation).toBe(0.8)
      expect(DURATION.frame).toBe(0.016)
      expect(DURATION.smooth).toBe(0.25)
    })

    it('should define GPU optimization constants', () => {
      expect(GPU_OPTIMIZED).toEqual({
        willChange: 'transform, opacity',
        force3d: true,
        isolation: 'isolate'
      })
    })

    it('should define all Material Design 3 durations', () => {
      expect(DURATION.short1).toBe(0.05)
      expect(DURATION.short2).toBe(0.1)
      expect(DURATION.medium1).toBe(0.25)
      expect(DURATION.medium2).toBe(0.3)
      expect(DURATION.long1).toBe(0.45)
      expect(DURATION.extraLong1).toBe(0.7)
    })
  })

  describe('Animation Variants', () => {
    it('should define zenFade variant correctly', () => {
      expect(zenFade.hidden).toMatchObject({
        opacity: 0,
        scale: 0.98,
        willChange: 'transform, opacity',
        force3d: true,
        isolation: 'isolate'
      })
      
      expect(zenFade.visible).toMatchObject({
        opacity: 1,
        scale: 1,
        willChange: 'transform, opacity',
        force3d: true,
        isolation: 'isolate'
      })
      
      expect(zenFade.visible.transition).toMatchObject({
        duration: DURATION.smooth,
        ease: hardwareEasing,
        type: 'tween'
      })
    })

    it('should define whisperUp variant correctly', () => {
      expect(whisperUp.hidden).toMatchObject({
        opacity: 0,
        y: 4,
        scale: 0.99
      })
      
      expect(whisperUp.visible).toMatchObject({
        opacity: 1,
        y: 0,
        scale: 1
      })
      
      expect(whisperUp.visible.transition.duration).toBe(DURATION.smooth)
      expect(whisperUp.visible.transition.ease).toEqual(hardwareEasing)
    })

    it('should define microFloat variant correctly', () => {
      expect(microFloat.hidden).toMatchObject({
        opacity: 0,
        y: 2
      })
      
      expect(microFloat.visible).toMatchObject({
        opacity: 1,
        y: 0
      })
      
      expect(microFloat.visible.transition.duration).toBe(DURATION.whisper)
    })

    it('should define zenBreathe variant with stagger', () => {
      expect(zenBreathe.hidden).toMatchObject({
        opacity: 0,
        y: 8,
        scale: 0.98
      })
      
      expect(zenBreathe.visible.transition).toMatchObject({
        duration: DURATION.meditation,
        ease: hardwareEasing,
        type: 'tween',
        staggerChildren: 0.05,
        delayChildren: 0.05
      })
    })
  })

  describe('Interaction Variants', () => {
    it('should define whisperHover correctly', () => {
      expect(whisperHover.whileHover).toMatchObject({
        y: -1,
        willChange: 'transform, opacity',
        force3d: true,
        isolation: 'isolate'
      })
      
      expect(whisperHover.whileTap).toMatchObject({
        scale: 0.99,
        willChange: 'transform, opacity',
        force3d: true,
        isolation: 'isolate'
      })
      
      expect(whisperHover.whileHover.transition.duration).toBe(DURATION.frame)
      expect(whisperHover.whileTap.transition.duration).toBe(DURATION.frame)
    })

    it('should define breathHover correctly', () => {
      expect(breathHover.whileHover).toMatchObject({
        y: -2,
        scale: 1.01
      })
      
      expect(breathHover.whileTap).toMatchObject({
        scale: 0.98
      })
      
      expect(breathHover.whileHover.transition.duration).toBe(DURATION.twoFrame)
      expect(breathHover.whileTap.transition.duration).toBe(DURATION.frame)
    })

    it('should define zenScale correctly', () => {
      expect(zenScale.whileHover).toMatchObject({
        scale: 1.005
      })
      
      expect(zenScale.whileTap).toMatchObject({
        scale: 0.995
      })
      
      expect(zenScale.whileHover.transition.duration).toBe(DURATION.twoFrame)
      expect(zenScale.whileTap.transition.duration).toBe(DURATION.frame)
    })
  })

  describe('NotebookLM Variants', () => {
    it('should define notebookLMCard correctly', () => {
      expect(notebookLMCard.hidden).toMatchObject({
        opacity: 0,
        y: 8,
        scale: 0.96,
        willChange: 'transform, opacity',
        force3d: true,
        isolation: 'isolate'
      })
      
      expect(notebookLMCard.visible).toMatchObject({
        opacity: 1,
        y: 0,
        scale: 1,
        willChange: 'transform, opacity',
        force3d: true,
        isolation: 'isolate'
      })
      
      expect(notebookLMCard.visible.transition.duration).toBe(DURATION.medium2)
    })

    it('should define notebookLMStagger correctly', () => {
      expect(notebookLMStagger.hidden).toMatchObject({
        opacity: 0
      })
      
      expect(notebookLMStagger.visible).toMatchObject({
        opacity: 1
      })
      
      expect(notebookLMStagger.visible.transition).toMatchObject({
        staggerChildren: 0.05,
        delayChildren: 0.1,
        duration: DURATION.short2
      })
    })

    it('should define notebookLMButton correctly', () => {
      expect(notebookLMButton.whileHover).toMatchObject({
        y: -1,
        scale: 1.02,
        willChange: 'transform, opacity',
        force3d: true,
        isolation: 'isolate'
      })
      
      expect(notebookLMButton.whileTap).toMatchObject({
        scale: 0.98,
        willChange: 'transform, opacity',
        force3d: true,
        isolation: 'isolate'
      })
      
      expect(notebookLMButton.whileHover.transition.duration).toBe(DURATION.short1)
      expect(notebookLMButton.whileTap.transition.duration).toBe(DURATION.short1)
    })
  })

  describe('Vietnamese Cultural Rhythms', () => {
    it('should define morning rhythm', () => {
      const { morningRhythm } = require('../motion')
      
      expect(morningRhythm.hidden).toMatchObject({
        opacity: 0,
        y: 2
      })
      
      expect(morningRhythm.visible).toMatchObject({
        opacity: 1,
        y: 0
      })
      
      expect(morningRhythm.visible.transition.duration).toBe(DURATION.instant)
    })

    it('should define evening rhythm', () => {
      const { eveningRhythm } = require('../motion')
      
      expect(eveningRhythm.hidden).toMatchObject({
        opacity: 0,
        y: 6
      })
      
      expect(eveningRhythm.visible).toMatchObject({
        opacity: 1,
        y: 0
      })
      
      expect(eveningRhythm.visible.transition.duration).toBe(DURATION.meditation)
    })

    it('should define Vietnamese breathing pattern', () => {
      const { vietnameseBreathe } = require('../motion')
      
      expect(vietnameseBreathe.hidden).toMatchObject({
        opacity: 0,
        y: 4,
        scale: 0.99
      })
      
      expect(vietnameseBreathe.visible.transition).toMatchObject({
        duration: DURATION.breath,
        staggerChildren: 0.15,
        delayChildren: 0.05
      })
    })
  })

  describe('Legacy Compatibility', () => {
    it('should export legacy variant mappings', () => {
      const { 
        fadeIn, 
        slideUp, 
        slideDown, 
        scaleIn, 
        staggerContainer, 
        listItem, 
        hoverScale, 
        hoverLift 
      } = require('../motion')
      
      expect(fadeIn).toBeDefined()
      expect(slideUp).toBeDefined()
      expect(slideDown).toBeDefined()
      expect(scaleIn).toBeDefined()
      expect(staggerContainer).toBeDefined()
      expect(listItem).toBeDefined()
      expect(hoverScale).toBeDefined()
      expect(hoverLift).toBeDefined()
    })

    it('should map legacy variants to correct animations', () => {
      const { fadeIn, slideUp, staggerContainer } = require('../motion')
      
      expect(fadeIn).toBe(zenFade)
      expect(slideUp).toBe(whisperUp)
      expect(staggerContainer).toBe(zenBreathe)
    })
  })

  describe('Advanced Variants', () => {
    it('should define ultra smooth variant', () => {
      const { ultraSmooth } = require('../motion')
      
      expect(ultraSmooth).toMatchObject({
        ...zenFade,
        willChange: 'transform, opacity',
        force3d: true,
        isolation: 'isolate'
      })
      
      expect(ultraSmooth.transition.duration).toBe(DURATION.frame)
      expect(ultraSmooth.transition.ease).toEqual(hardwareEasing)
    })

    it('should define instant response variant', () => {
      const { instantResponse } = require('../motion')
      
      expect(instantResponse.whileHover).toMatchObject({
        scale: 1.02,
        willChange: 'transform, opacity',
        force3d: true,
        isolation: 'isolate'
      })
      
      expect(instantResponse.whileTap).toMatchObject({
        scale: 0.98,
        willChange: 'transform, opacity',
        force3d: true,
        isolation: 'isolate'
      })
    })
  })

  describe('NotebookLM Extended Variants', () => {
    it('should define page transition variant', () => {
      const { notebookLMPageTransition } = require('../motion')
      
      expect(notebookLMPageTransition.hidden).toMatchObject({
        opacity: 0,
        y: 12
      })
      
      expect(notebookLMPageTransition.visible).toMatchObject({
        opacity: 1,
        y: 0
      })
      
      expect(notebookLMPageTransition.exit).toMatchObject({
        opacity: 0,
        y: -12
      })
    })

    it('should define modal variant', () => {
      const { notebookLMModal } = require('../motion')
      
      expect(notebookLMModal.hidden).toMatchObject({
        opacity: 0,
        scale: 0.95,
        y: 20
      })
      
      expect(notebookLMModal.visible).toMatchObject({
        opacity: 1,
        scale: 1,
        y: 0
      })
    })

    it('should define list item variant', () => {
      const { notebookLMListItem } = require('../motion')
      
      expect(notebookLMListItem.hidden).toMatchObject({
        opacity: 0,
        x: -8
      })
      
      expect(notebookLMListItem.visible).toMatchObject({
        opacity: 1,
        x: 0
      })
    })

    it('should define drawer variant', () => {
      const { notebookLMDrawer } = require('../motion')
      
      expect(notebookLMDrawer.hidden).toMatchObject({
        x: '-100%'
      })
      
      expect(notebookLMDrawer.visible).toMatchObject({
        x: 0
      })
      
      expect(notebookLMDrawer.exit).toMatchObject({
        x: '-100%'
      })
    })
  })

  describe('Consistency and Performance', () => {
    it('should use consistent easing curves', () => {
      expect(zenFade.visible.transition.ease).toEqual(hardwareEasing)
      expect(whisperUp.visible.transition.ease).toEqual(hardwareEasing)
      expect(microFloat.visible.transition.ease).toEqual(hardwareEasing)
    })

    it('should include GPU optimizations in all variants', () => {
      const variants = [zenFade, whisperUp, microFloat, zenBreathe]
      
      variants.forEach(variant => {
        expect(variant.hidden).toMatchObject(GPU_OPTIMIZED)
        expect(variant.visible).toMatchObject(GPU_OPTIMIZED)
      })
    })

    it('should use appropriate durations for different animation types', () => {
      // Quick interactions should use frame-perfect durations
      expect(whisperHover.whileHover.transition.duration).toBe(DURATION.frame)
      expect(whisperHover.whileTap.transition.duration).toBe(DURATION.frame)
      
      // Entrance animations should use smooth durations
      expect(zenFade.visible.transition.duration).toBe(DURATION.smooth)
      expect(whisperUp.visible.transition.duration).toBe(DURATION.smooth)
      
      // Staggered animations should use longer durations
      expect(zenBreathe.visible.transition.duration).toBe(DURATION.meditation)
    })

    it('should maintain consistent scaling patterns', () => {
      // Hidden states should scale down slightly
      expect(zenFade.hidden.scale).toBe(0.98)
      expect(whisperUp.hidden.scale).toBe(0.99)
      expect(zenBreathe.hidden.scale).toBe(0.98)
      
      // Visible states should return to normal scale
      expect(zenFade.visible.scale).toBe(1)
      expect(whisperUp.visible.scale).toBe(1)
      expect(zenBreathe.visible.scale).toBe(1)
    })
  })

  describe('Material Design Compliance', () => {
    it('should use Material Design 3 durations', () => {
      const { notebookLMEasing, notebookLMEmphasized, notebookLMDecelerate } = require('../motion')
      
      expect(notebookLMEasing).toEqual([0.2, 0, 0, 1])
      expect(notebookLMEmphasized).toEqual([0.05, 0.7, 0.1, 1])
      expect(notebookLMDecelerate).toEqual([0, 0, 0.2, 1])
    })

    it('should follow Material Design motion patterns', () => {
      // Entrance animations should decelerate
      expect(notebookLMCard.visible.transition.ease).toEqual([0, 0, 0.2, 1])
      
      // Button interactions should be quick
      expect(notebookLMButton.whileHover.transition.duration).toBe(DURATION.short1)
      expect(notebookLMButton.whileTap.transition.duration).toBe(DURATION.short1)
    })
  })
})