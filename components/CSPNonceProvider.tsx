'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface CSPNonceContextType {
  nonce: string
}

const CSPNonceContext = createContext<CSPNonceContextType>({ nonce: '' })

export const useCSPNonce = () => useContext(CSPNonceContext)

interface CSPNonceProviderProps {
  children: ReactNode
  fallbackNonce?: string
}

export function CSPNonceProvider({ children, fallbackNonce = 'fallback-nonce' }: CSPNonceProviderProps) {
  const [nonce, setNonce] = useState(fallbackNonce)

  useEffect(() => {
    // Get nonce from meta tag set by middleware
    const nonceElement = document.querySelector('meta[name="csp-nonce"]')
    if (nonceElement) {
      const nonceValue = nonceElement.getAttribute('content')
      if (nonceValue) {
        setNonce(nonceValue)
      }
    }
  }, [])

  return (
    <CSPNonceContext.Provider value={{ nonce }}>
      {children}
    </CSPNonceContext.Provider>
  )
}

// HOC for components that need nonce
export function withCSPNonce<P extends object>(Component: React.ComponentType<P & { nonce: string }>) {
  return function CSPNonceWrappedComponent(props: P) {
    const { nonce } = useCSPNonce()
    return <Component {...props} nonce={nonce} />
  }
}