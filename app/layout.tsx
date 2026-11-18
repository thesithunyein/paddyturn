import type { ReactNode } from 'react'
import './style.css'

export const metadata = { title: 'PaddyTurn', description: 'Know which paddy batch to dry next.' }
export default function Layout({ children }: { children: ReactNode }) {
  return <html lang="en"><body>{children}</body></html>
}
