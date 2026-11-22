'use client'

import Link from 'next/link'
import { LanguageToggle, useT } from '../lib/i18n'
import './landing.css'

// A real testnet check from the production workspace (22 Nov 2026), shown as
// a sample. Anyone can open the signal on Telegraph's public lookup.
const proofSignal = '0xd06ae8c038d83ecd2c1fc631210b7e87dad9cdb618abca1547b43d2056e1ee46'
const proofUrl = `/proof/${proofSignal}`

const audience = [1, 2, 3] as const
const steps = [1, 2, 3] as const
const proofPoints = [1, 2, 3] as const
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
        <a className="landing-nav" href="#proof">{t('nav.proof')}</a>
        <a className="landing-nav" href="#faq">{t('nav.faq')}</a>
        <Link className="landing-nav" href="/docs">{t('nav.docs')}</Link>
        <LanguageToggle />
      </nav>
    </header>
    <div className="landing-progress" aria-hidden="true" />
    <section className="landing-hero">
      <div className="landing-copy">
        <h1>{t('hero.title')}</h1>
        <p>{t('hero.sub')}</p>
        <div className="landing-actions">
          <OpenWorkspace />
          <a className="landing-secondary" href="#proof">{t('hero.see')}</a>
        </div>
        <p className="landing-trust">{t('hero.trust')}</p>
      </div>
      <div className="drying-floor-frame">
        <img className="drying-floor" src="/drying-floor.svg?v=2" alt={t('hero.alt')} width="620" height="430" />
      </div>
    </section>
    <section className="landing-audience" aria-label={t('aud.label')}>
      {audience.map(n => <div key={n}><h2>{t(`aud.${n}.t`)}</h2><p>{t(`aud.${n}.d`)}</p></div>)}
    </section>
    <section id="how-it-works" className="landing-steps">
      <h2>{t('steps.title')}</h2>
      <ol>{steps.map(n => <li key={n}><h3>{t(`step.${n}.t`)}</h3><p>{t(`step.${n}.d`)}</p></li>)}</ol>
    </section>
    <section className="landing-weather" aria-labelledby="weather-title">
      <div className="weather-intro">
        <h2 id="weather-title">{t('wx.title')}</h2>
        <div className="weather-scene" aria-hidden="true">
          <div className="weather-object">
            <span className="weather-depth" />
            <span className="weather-face">
              <svg width="44" height="44" viewBox="0 0 48 48" fill="none">
                <circle cx="18" cy="17" r="8" fill="#e6be64" />
                <path d="M18 5V2M6 17H3M9 8 6 5M28 8l3-3" stroke="#9a712e" strokeWidth="2" strokeLinecap="round" />
                <path d="M17 33h19a7 7 0 1 0-1-14 9 9 0 0 0-17 5 4.5 4.5 0 0 0-1 9Z" fill="#fffdf4" stroke="#42694d" strokeWidth="2" />
                <path d="m23 38-2 4m10-4-2 4" stroke="#42694d" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </span>
          </div>
        </div>
      </div>
      <dl>
        {(['dry', 'rain', 'unsure'] as const).map(id => <div key={id}><dt>{t(`wx.${id}.t`)}</dt><dd>{t(`wx.${id}.d`)}</dd></div>)}
      </dl>
    </section>
    <section id="proof" className="landing-proof" aria-labelledby="proof-title">
      <div className="proof-copy">
        <h2 id="proof-title">{t('proof.title')}</h2>
        <p>{t('proof.sub')}</p>
        <dl>{proofPoints.map(n => <div key={n}><dt>{t(`proof.${n}.t`)}</dt><dd>{t(`proof.${n}.d`)}</dd></div>)}</dl>
      </div>
      <figure className="proof-sample">
        <figcaption>{t('proof.caption')}</figcaption>
        <div className="evidence">
          <div className="evidence-head">
            <span className="badge ok">{t('ev.verified')}</span>
            <span className="badge net">{t('ev.testnet')}</span>
          </div>
          <div className="evidence-main">
            <p className="evidence-figure"><strong>0%</strong><span>{t('ev.chanceDay')} · clear</span></p>
            <p className="verdict dry">{t('proof.sample')}</p>
          </div>
          <dl className="evidence-facts">
            <div><dt>{t('ev.place')}</dt><dd>Pathein, Myanmar</dd></div>
            <div><dt>{t('ev.source')}</dt><dd>Isobar Weather</dd></div>
            <div><dt>{t('ev.cost')}</dt><dd>{t('ev.costValue', { c: 0.01 })}</dd></div>
            <div><dt>{t('ev.signal')}</dt><dd><code>0xd06ae8…e1ee46</code></dd></div>
          </dl>
          <a className="evidence-link" href={proofUrl}>{t('ev.check')}</a>
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
    <footer className="landing-footer">
      <Link href="/" className="brand home-link"><img src="/paddyturn.svg" alt="" width="32" height="32" /><strong>PaddyTurn</strong></Link>
      <nav className="landing-links" aria-label="Footer navigation">
        <Link href="/app">{t('foot.workspace')}</Link>
        <Link href="/docs">{t('foot.docs')}</Link>
        <a href="https://github.com/thesithunyein/paddyturn/issues">{t('foot.issue')}</a>
        <a href="https://telegraphprotocol.com/">Telegraph</a>
      </nav>
      <p className="landing-note">{t('foot.note')}</p>
    </footer>
  </main>
}
