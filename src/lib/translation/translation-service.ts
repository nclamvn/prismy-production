import { getFeatureFlags } from '@/lib/feature-flags'

export async function translateText(
  text: string,
  fromLang: string,
  toLang: string
): Promise<string> {
  const flags = getFeatureFlags()
  
  if (!flags.ENABLE_TRANSLATION_API) {
    // MVP mode: Return demo translation
    return `[TRANSLATED from ${fromLang} to ${toLang}]\n\n${text}`
  }
  
  // Check if we have API keys
  const openaiKey = process.env.OPENAI_API_KEY
  const anthropicKey = process.env.ANTHROPIC_API_KEY
  
  if (openaiKey) {
    return await translateWithOpenAI(text, fromLang, toLang)
  }
  
  if (anthropicKey) {
    return await translateWithAnthropic(text, fromLang, toLang)
  }
  
  // Fallback to demo mode
  return `[DEMO TRANSLATION from ${fromLang} to ${toLang}]\n\n${text}`
}

async function translateWithOpenAI(text: string, fromLang: string, toLang: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a professional translator. Translate the following text from ${fromLang} to ${toLang}. Preserve formatting and maintain the original meaning. Return only the translation without any additional text.`
        },
        {
          role: 'user',
          content: text
        }
      ],
      temperature: 0.3
    })
  })
  
  if (!response.ok) {
    throw new Error('OpenAI translation failed')
  }
  
  const data = await response.json()
  return data.choices[0].message.content
}

async function translateWithAnthropic(text: string, fromLang: string, toLang: string): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: `Translate the following text from ${fromLang} to ${toLang}. Preserve formatting and maintain the original meaning. Return only the translation without any additional text.\n\nText to translate:\n${text}`
        }
      ]
    })
  })
  
  if (!response.ok) {
    throw new Error('Anthropic translation failed')
  }
  
  const data = await response.json()
  return data.content[0].text
}