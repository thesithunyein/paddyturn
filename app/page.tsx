'use client'

import Link from 'next/link'
import { LanguageToggle, useT } from '../lib/i18n'
import './landing.css'

// A real forecast check from the production workspace (22 Nov 2026, Telegraph
// test network), shown as the sample log. The record is public.
const proofSignal = '0xd06ae8c038d83ecd2c1fc631210b7e87dad9cdb618abca1547b43d2056e1ee46'
const proofUrl = `/proof/${proofSignal}`

const steps = [1, 2, 3] as const
const questions = [1, 2, 3, 4, 5, 6, 7] as const

function OpenWorkspace() {
  const t = useT()
  return <Link className="primary landing-action" href="/app">{t('hero.open')}
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" /></svg>
  </Link>
}

export default function Landing() {
  const t = useT()
  return <main className="landing">
    <header className="top">
      <Link href="/" className="brand home-link"><img src="/paddyturn.svg" alt="" width="42" height="42" /><strong>PaddyTurn</strong></Link>
      <nav className="landing-links" aria-label="Main navigation">
        <a className="landing-nav" href="#how-it-works">{t('nav.how')}</a>
        <a className="landing-nav" href="#sample-log">{t('nav.sample')}</a>
        <a className="landing-nav" href="#faq">{t('nav.faq')}</a>
        <LanguageToggle />
      </nav>
    </header>
    <section className="landing-hero">
      <div className="landing-copy">
        <h1>{t('hero.title')}</h1>
        <p>{t('hero.sub')}</p>
        <div className="landing-actions">
          <OpenWorkspace />
          <Link className="landing-ghost" href="/app?sample=1">{t('hero.see')}</Link>
        </div>
        <p className="landing-trust">{t('hero.trust')}</p>
      </div>
      <div className="landing-overview">
        <div className="drying-floor-frame">
          <img className="drying-floor" src="/mill-drying-yard.webp" alt={t('hero.alt')} width="1440" height="960" fetchPriority="high" />
        </div>
        <section id="how-it-works" className="landing-steps">
          <h2>{t('steps.title')}</h2>
          <ol>{steps.map(n => <li key={n}><h3>{t(`step.${n}.t`)}</h3><p>{t(`step.${n}.d`)}</p></li>)}</ol>
        </section>
      </div>
    </section>
    <section className="landing-weather" aria-labelledby="weather-title">
      <div className="weather-intro">
        <h2 id="weather-title">{t('wx.title')}</h2>
      </div>
      <dl>
        {(['dry', 'rain', 'unsure'] as const).map(id => <div key={id}><dt>{t(`wx.${id}.t`)}</dt><dd>{t(`wx.${id}.d`)}</dd></div>)}
      </dl>
    </section>
    <section id="sample-log" className="landing-proof" aria-labelledby="proof-title">
      <div className="proof-copy">
        <h2 id="proof-title">{t('proof.title')}</h2>
        <p>{t('proof.sub')}</p>
      </div>
      <figure className="proof-sample">
        <figcaption>{t('proof.caption')}</figcaption>
        <div className="evidence">
          <div className="evidence-head">
            <span className="badge ok">{t('proof.badge')}</span>
          </div>
          <div className="evidence-main">
            <p className="evidence-figure"><strong>0%</strong><span>{t('proof.rainChance')}</span></p>
            <p className="verdict dry">{t('proof.sample')}</p>
          </div>
          <a className="evidence-link" href={proofUrl}>{t('proof.open')}</a>
        </div>
      </figure>
    </section>
    <section id="faq" className="landing-faq" aria-labelledby="faq-title">
      <h2 id="faq-title">{t('faq.title')}</h2>
      <div className="landing-questions">
        {questions.map(n => <details key={n}>
          <summary>{t(`faq.${n}.q`)}<span aria-hidden="true" /></summary>
          <p>{t(`faq.${n}.a`)}</p>
        </details>)}
      </div>
    </section>
    <section className="landing-free" aria-labelledby="free-title">
      <div><h2 id="free-title">{t('free.title')}</h2><p>{t('free.body')}</p></div>
      <Link className="primary landing-action" href="/app?sample=1">{t('hero.see')}</Link>
    </section>
    <footer className="landing-footer">
      <Link href="/" className="brand home-link"><img src="/paddyturn.svg" alt="" width="32" height="32" /><strong>PaddyTurn</strong></Link>
      <nav className="landing-links" aria-label="Footer navigation">
        <Link href="/app">{t('foot.workspace')}</Link>
        <Link href="/docs">{t('foot.docs')}</Link>
        <a href="https://github.com/thesithunyein/paddyturn/issues">{t('foot.issue')}</a>
      </nav>
      <p className="landing-note">{t('foot.note')}</p>
    </footer>
  </main>
}
