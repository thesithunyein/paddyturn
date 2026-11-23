import type { ReactNode } from 'react'
import '@fontsource-variable/manrope'
import './style.css'
import { LanguageProvider } from '../lib/i18n'

const description = 'Prioritize wet paddy batches, check local rain forecasts and schedule your mechanical dryer. Built for small rice mills and drying cooperatives.'
export const metadata = {
  metadataBase: new URL('https://paddyturn.vercel.app'),
  title: { default: 'PaddyTurn — Dryer scheduling for rice mills', template: '%s · PaddyTurn' },
  description,
  icons: { icon: '/paddyturn.svg' },
  openGraph: { type: 'website', siteName: 'PaddyTurn', title: 'PaddyTurn — Dryer scheduling for rice mills', description,
    url: 'https://paddyturn.vercel.app' },
  twitter: { card: 'summary', title: 'PaddyTurn', description },
}
export const viewport = { themeColor: '#244c37' }
export default function Layout({ children }: { children: ReactNode }) {
  return <html lang="en"><body><LanguageProvider>{children}</LanguageProvider></body></html>
}
