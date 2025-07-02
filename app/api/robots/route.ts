import { NextResponse } from 'next/server'

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://prismy.in'

  const robotsTxt = `# Prismy Robots.txt
User-agent: *
Allow: /
Disallow: /api/
Disallow: /auth/
Disallow: /workspace/
Disallow: /_next/
Disallow: /storybook-static/

# Sitemaps
Sitemap: ${baseUrl}/sitemap.xml

# Crawl-delay
Crawl-delay: 1

# AI Crawlers
User-agent: GPTBot
Disallow: /

User-agent: ChatGPT-User
Disallow: /

User-agent: CCBot
Disallow: /

User-agent: anthropic-ai
Disallow: /

User-agent: Claude-Web
Disallow: /
`

  return new NextResponse(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400', // 24 hours
    },
  })
}
