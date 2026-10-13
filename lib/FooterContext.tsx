'use client'

import { createContext, useContext, useState } from 'react'

const FooterBorderContext = createContext<{
  showBorder: boolean
  setShowBorder: (v: boolean) => void
}>({ showBorder: false, setShowBorder: () => {} })

export function FooterBorderProvider({ children }: { children: React.ReactNode }) {
  const [showBorder, setShowBorder] = useState(false)
  return (
    <FooterBorderContext.Provider value={{ showBorder, setShowBorder }}>
      {children}
    </FooterBorderContext.Provider>
  )
}

export function useFooterBorder() {
  return useContext(FooterBorderContext)
}