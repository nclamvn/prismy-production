'use client'

import { useState } from 'react'
import { AuthProvider } from '@/contexts/AuthContext'
import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import { TemplateChips } from '@/components/TemplateChip'
import Workbench from '@/components/Workbench'
import StatCard from '@/components/StatCard'
import LogoWall from '@/components/LogoWall'
import Footer from '@/components/Footer'

export default function Home() {
  const [language, setLanguage] = useState<'vi' | 'en'>('en')

  return (
    <AuthProvider>
      <div className="min-h-screen bg-main relative">
        <Navbar language={language} setLanguage={setLanguage} />
        <main className="bg-main">
          <Hero language={language} />
          <TemplateChips language={language} />
          <Workbench language={language} />
          <StatCard language={language} />
          <LogoWall language={language} />
        </main>
        <Footer language={language} />
      </div>
    </AuthProvider>
  )
}