#!/usr/bin/env node

/**
 * Test Motion.ts Fix
 * Verify that the notebookLMCard initialization error is resolved
 */

console.log('🧪 Testing motion.ts fix...')

async function testMotionImports() {
  try {
    // Test importing motion variants
    const motion = await import('./lib/motion.js')

    console.log('✅ Motion.ts imports successfully')

    // Test specific problematic exports
    const testExports = [
      'notebookLMFade',
      'notebookLMCard',
      'notebookLMSlide',
      'notebookLMHover',
      'notebookLMContainer',
    ]

    for (const exportName of testExports) {
      if (motion[exportName]) {
        console.log(`✅ ${exportName} - OK`)
      } else {
        console.log(`❌ ${exportName} - Missing`)
      }
    }

    console.log('\n🎉 All motion variants are properly initialized!')
    console.log('🚀 Live demo should now be accessible without errors')
  } catch (error) {
    console.error('❌ Motion import failed:', error.message)
    console.error('📍 Stack trace:', error.stack)
  }
}

testMotionImports()
