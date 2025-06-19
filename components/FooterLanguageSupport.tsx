'use client'

import { useEffect } from 'react'

interface FooterLanguageSupportProps {
  language: 'vi' | 'en'
}

export default function FooterLanguageSupport({ language }: FooterLanguageSupportProps) {
  useEffect(() => {
    // Update footer attribution text based on language
    const style = document.createElement('style')
    style.id = 'footer-language-style'
    
    // Remove existing style if present
    const existing = document.getElementById('footer-language-style')
    if (existing) {
      existing.remove()
    }
    
    const attributionText = language === 'vi' 
      ? 'Một sản phẩm của Làng Vũ Đại'
      : 'A product of Làng Vũ Đại'
    
    style.innerHTML = `
      .footer-bottom::after {
        content: "${attributionText}" !important;
      }
    `
    
    document.head.appendChild(style)
    
    return () => {
      const styleEl = document.getElementById('footer-language-style')
      if (styleEl) {
        styleEl.remove()
      }
    }
  }, [language])
  
  return null
}