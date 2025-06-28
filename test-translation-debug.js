#!/usr/bin/env node

/**
 * EMERGENCY TRANSLATION API DEBUGGER
 * Test the translation pipeline to identify why output is failing
 */

console.log('🔍 DEBUGGING TRANSLATION PIPELINE...\n')

// Test 1: Check environment variables
console.log('📋 Environment Check:')
console.log(
  '- GOOGLE_CLOUD_PROJECT_ID:',
  process.env.GOOGLE_CLOUD_PROJECT_ID ? '✅ Set' : '❌ Missing'
)
console.log(
  '- GOOGLE_TRANSLATE_API_KEY:',
  process.env.GOOGLE_TRANSLATE_API_KEY ? '✅ Set' : '❌ Missing'
)
console.log(
  '- GOOGLE_CLOUD_KEY_FILE:',
  process.env.GOOGLE_CLOUD_KEY_FILE ? '✅ Set' : '❌ Missing'
)
console.log('')

// Test 2: Try to import and initialize translation service
async function testTranslationService() {
  try {
    console.log('🔧 Testing Translation Service Import...')

    // Dynamic import to avoid build issues
    const { translationService } = await import('./lib/translation-service.js')
    console.log('✅ Translation service imported successfully')

    // Test translation
    console.log('\n🚀 Testing Simple Translation...')
    const result = await translationService.translateText({
      text: 'Hello world',
      sourceLang: 'en',
      targetLang: 'vi',
      qualityTier: 'standard',
    })

    console.log('✅ Translation Result:', {
      translatedText: result.translatedText,
      confidence: result.confidence,
      cached: result.cached,
    })

    return result
  } catch (error) {
    console.error('❌ Translation Service Error:', error.message)
    console.error('📍 Error Details:', error)
    return null
  }
}

// Test 3: Check database connection
async function testDatabaseConnection() {
  try {
    console.log('\n🗄️ Testing Database Connection...')
    const { createServiceRoleClient } = await import('./lib/supabase.js')
    const supabase = createServiceRoleClient()

    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)

    if (error) {
      console.error('❌ Database Error:', error.message)
      return false
    }

    console.log('✅ Database connection successful')
    return true
  } catch (error) {
    console.error('❌ Database Connection Error:', error.message)
    return false
  }
}

// Test 4: Check Redis cache
async function testRedisCache() {
  try {
    console.log('\n🔄 Testing Redis Cache...')
    const { redisTranslationCache } = await import(
      './lib/redis-translation-cache.js'
    )

    const health = await redisTranslationCache.getHealthInfo()
    console.log('✅ Redis Health:', {
      connected: health.connected,
      memoryUsed: health.memoryUsed,
      totalKeys: health.totalKeys,
    })

    return health.connected
  } catch (error) {
    console.error('❌ Redis Cache Error:', error.message)
    return false
  }
}

// Run all tests
async function runDiagnostics() {
  console.log('🏁 Starting Translation Pipeline Diagnostics...\n')

  const dbConnected = await testDatabaseConnection()
  const redisConnected = await testRedisCache()
  const translationResult = await testTranslationService()

  console.log('\n📊 DIAGNOSTIC SUMMARY:')
  console.log('- Database:', dbConnected ? '✅ Working' : '❌ Failed')
  console.log('- Redis Cache:', redisConnected ? '✅ Working' : '❌ Failed')
  console.log('- Translation:', translationResult ? '✅ Working' : '❌ Failed')

  if (translationResult) {
    console.log('\n🎉 GOOD NEWS: Core translation is working!')
    console.log(
      '👀 Issue is likely in the API endpoint or frontend integration'
    )
  } else {
    console.log('\n🚨 PROBLEM: Core translation service is failing')
    console.log('🔧 Check Google Cloud API configuration')
  }

  console.log('\n🔍 Next Steps:')
  console.log('1. Fix any failed components above')
  console.log('2. Test the API endpoint with proper authentication')
  console.log('3. Check frontend error handling and state management')
}

runDiagnostics().catch(console.error)
