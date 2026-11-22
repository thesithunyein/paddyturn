import type { ReactNode } from 'react'
import '@fontsource-variable/manrope'
import '@fontsource-variable/fraunces'
import './style.css'
import { LanguageProvider } from '../lib/i18n'

const description = 'Dryer scheduling for small rice mills, with verified rain checks through Telegraph.'
export const metadata = {
  metadataBase: new URL('https://paddyturn.vercel.app'),
  title: { default: 'PaddyTurn — Dry the right batch next', template: '%s · PaddyTurn' },
  description,
  icons: { icon: '/paddyturn.svg' },
  openGraph: { type: 'website', siteName: 'PaddyTurn', title: 'PaddyTurn — Dry the right batch next', description,
    url: 'https://paddyturn.vercel.app' },
  twitter: { card: 'summary', title: 'PaddyTurn', description },
}
export const viewport = { themeColor: '#244c37' }
export default function Layout({ children }: { children: ReactNode }) {
  return <html lang="en"><body><LanguageProvider>{children}</LanguageProvider></body></html>
}
