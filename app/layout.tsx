import type { ReactNode } from 'react'
import '@fontsource-variable/manrope'
import '@fontsource-variable/fraunces'
import './style.css'

const description = 'Dryer scheduling for small rice mills: rank arriving paddy batches and decide with a verified rain-chance forecast bought through Telegraph.'
export const metadata = {
  metadataBase: new URL('https://paddyturn.vercel.app'),
  title: { default: 'PaddyTurn — Know which paddy goes in the dryer next', template: '%s · PaddyTurn' },
  description,
  icons: { icon: '/paddyturn.svg' },
  openGraph: { type: 'website', siteName: 'PaddyTurn', title: 'PaddyTurn — Know which paddy goes in the dryer next', description,
    url: 'https://paddyturn.vercel.app' },
  twitter: { card: 'summary', title: 'PaddyTurn', description },
}
export const viewport = { themeColor: '#244c37' }
export default function Layout({ children }: { children: ReactNode }) {
  return <html lang="en"><body>{children}</body></html>
}
