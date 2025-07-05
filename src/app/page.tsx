import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Prismy - Dịch tài liệu chuyên nghiệp với AI',
  description: 'Nền tảng dịch tài liệu nhanh chóng, chính xác với công nghệ AI. Hỗ trợ 50+ ngôn ngữ, bảo mật doanh nghiệp, dịch PDF/DOCX giữ nguyên định dạng.',
  keywords: 'dịch tài liệu, AI translation, Vietnamese, PDF translation, document translation',
  authors: [{ name: 'Prismy Team' }],
  creator: 'Prismy',
  publisher: 'Prismy',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://prismy.in'),
  alternates: {
    canonical: '/',
    languages: {
      'vi': '/',
      'en': '/en',
    },
  },
  openGraph: {
    title: 'Prismy - Dịch tài liệu chuyên nghiệp với AI',
    description: 'Nền tảng dịch tài liệu nhanh chóng, chính xác với công nghệ AI.',
    url: 'https://prismy.in',
    siteName: 'Prismy',
    locale: 'vi_VN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Prismy - Dịch tài liệu chuyên nghiệp với AI',
    description: 'Nền tảng dịch tài liệu nhanh chóng, chính xác với công nghệ AI.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootPage() {
  // Redirect to Vietnamese version with proper SEO
  redirect('/vi')
}