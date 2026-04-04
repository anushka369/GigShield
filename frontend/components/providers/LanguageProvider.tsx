'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { NextIntlClientProvider } from 'next-intl'
import enMessages from '@/messages/en.json'
import hiMessages from '@/messages/hi.json'

type Locale = 'en' | 'hi'

const LanguageContext = createContext<{
  locale: Locale
  setLocale: (l: Locale) => void
}>({
  locale: 'en',
  setLocale: () => {},
})

export const useLanguage = () => useContext(LanguageContext)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en')

  useEffect(() => {
    const saved = localStorage.getItem('aegisync_locale') as Locale | null
    if (saved === 'en' || saved === 'hi') setLocaleState(saved)
  }, [])

  const setLocale = (l: Locale) => {
    setLocaleState(l)
    localStorage.setItem('aegisync_locale', l)
  }

  const messages = locale === 'hi' ? hiMessages : enMessages

  return (
    <LanguageContext.Provider value={{ locale, setLocale }}>
      <NextIntlClientProvider locale={locale} messages={messages}>
        {children}
      </NextIntlClientProvider>
    </LanguageContext.Provider>
  )
}
