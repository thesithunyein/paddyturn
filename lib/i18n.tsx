'use client'

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { translate, type Key, type Lang } from './messages'

const storageKey = 'paddyturn.lang'
const Context = createContext<{ lang: Lang; setLang: (lang: Lang) => void }>({ lang: 'en', setLang: () => {} })

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en')
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved === 'my' || saved === 'en') setLangState(saved)
    } catch { /* storage unavailable */ }
  }, [])
  useEffect(() => { document.documentElement.lang = lang }, [lang])
  const setLang = useCallback((next: Lang) => {
    setLangState(next)
    try { localStorage.setItem(storageKey, next) } catch { /* storage unavailable */ }
  }, [])
  return <Context.Provider value={{ lang, setLang }}>{children}</Context.Provider>
}

export function useT() {
  const { lang } = useContext(Context)
  return useCallback((key: Key, vars?: Record<string, string | number>) => translate(lang, key, vars), [lang])
}

export function useLang() { return useContext(Context) }

export function LanguageToggle() {
  const { lang, setLang } = useLang()
  const t = useT()
  return <div className="lang-toggle" role="group" aria-label={t('lang.label')}>
    <button type="button" aria-pressed={lang === 'en'} onClick={() => setLang('en')} lang="en">English</button>
    <button type="button" aria-pressed={lang === 'my'} onClick={() => setLang('my')} lang="my">မြန်မာ</button>
  </div>
}
