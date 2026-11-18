import type { ReactNode } from 'react'
import '@fontsource-variable/manrope'
import '@fontsource-variable/fraunces'
import './style.css'

export const metadata = { title: 'PaddyTurn', description: 'Plan the next dryer turn.', icons: { icon: '/paddyturn.svg' } }
export default function Layout({ children }: { children: ReactNode }) {
  return <html lang="en"><body>{children}</body></html>
}
