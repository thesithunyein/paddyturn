'use client'

import Link from 'next/link'
import { LanguageToggle, useLang } from '../../lib/i18n'
import { docs } from './content'

export default function DocsView() {
  const { lang } = useLang()
  const page = docs[lang]
  return <main className="docs">
    <header className="top">
      <Link href="/" className="brand home-link"><img src="/paddyturn.svg" alt="" width="42" height="42" /><strong>PaddyTurn</strong></Link>
      <nav className="top-tools docs-top-links"><Link href="/app">{page.open}</Link><LanguageToggle /></nav>
    </header>
    <div className="docs-layout">
      <aside className="docs-toc" aria-label={page.toc}><p>{page.toc}</p>
        <ol>{page.sections.map(section => <li key={section.id}><a href={`#${section.id}`}>{section.title}</a></li>)}</ol></aside>
      <article>
        <h1>{page.title}</h1>
        <p className="docs-lead">{page.lead}</p>
        {page.sections.map(section => <section key={section.id} id={section.id}><h2>{section.title}</h2>{section.body}</section>)}
      </article>
    </div>
  </main>
}
