'use client'

import Link from 'next/link'
import { useState } from 'react'
import { signalBase, type SignalRecord } from '../../../lib/signal'
import { LanguageToggle, useT } from '../../../lib/i18n'

const short = (value: string) => `${value.slice(0, 10)}…${value.slice(-8)}`

export default function ProofView({ hash, record, unavailable }: { hash: string; record?: SignalRecord; unavailable?: boolean }) {
  const t = useT()
  // Show times in the mill's own timezone (from the record), the same on server and browser.
  const timeZone = record?.timezone || 'UTC'
  const zone = timeZone === 'UTC' ? 'UTC' : timeZone.split('/').pop()?.replace('_', ' ')
  const [copied, setCopied] = useState(false)
  const next = record?.hours.filter(hour => hour.time >= Date.now() - 3_600_000).slice(0, 24) ?? []
  const hours = next.length ? next : record?.hours.slice(0, 24) ?? []
  async function copy() {
    try { await navigator.clipboard.writeText(hash); setCopied(true); window.setTimeout(() => setCopied(false), 1500) } catch { /* unavailable */ }
  }
  return <main className="proof-page">
    <header className="top">
      <Link href="/" className="brand home-link"><img src="/paddyturn.svg" alt="" width="42" height="42" /><strong>PaddyTurn</strong></Link>
      <div className="top-tools"><span>{t('pf.title')}</span><LanguageToggle /></div>
    </header>
    {unavailable || !record ? <section className="card proof-card"><h1>{t('pf.down')}</h1>
      <p>{t('pf.downHint')}</p>
      <a className="evidence-link" href={signalBase + hash} target="_blank" rel="noreferrer">{t('pf.open')}</a></section>
    : <section className="card proof-card">
      <div className="evidence-head">
        <span className={record.verified ? 'badge ok' : 'badge warn'}>{record.verified ? t('ev.verified') : t('ev.notVerified')}</span>
        <span className="badge net">{t('ev.testnet')}</span>
      </div>
      <h1>{record.place ?? t('pf.fallback')}</h1>
      <dl className="evidence-facts proof-facts">
        <div><dt>{t('ev.source')}</dt><dd>{record.provider ?? '—'}</dd></div>
        <div><dt>{t('ev.cost')}</dt><dd>{record.cost !== undefined ? t('ev.costValue', { c: record.cost }) : '—'}</dd></div>
        <div><dt>{t('pf.recorded')}</dt><dd>{record.createdAt ? `${new Date(record.createdAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone })} (${zone})` : '—'}</dd></div>
        <div><dt>{t('pf.request')}</dt><dd><code>{record.intent ?? '—'}</code></dd></div>
      </dl>

      {!!record.days.length && <div className="proof-block"><h2>{t('pf.byDay')}</h2>
        <table className="proof-days"><thead><tr><th>{t('pf.day')}</th><th>{t('pf.chance')}</th><th>{t('pf.rain')}</th><th>{t('pf.temp')}</th></tr></thead>
          <tbody>{record.days.map(day => <tr key={day.date}>
            <th scope="row">{new Date(day.date + 'T00:00:00Z').toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })}</th>
            <td>{day.chance ?? '—'}%</td><td>{day.mm ?? '—'} mm</td>
            <td>{day.min !== undefined && day.max !== undefined ? `${Math.round(day.min)}–${Math.round(day.max)}°C` : '—'}</td></tr>)}</tbody></table></div>}

      {!!hours.length && <div className="proof-block"><h2>{t('pf.hourly')}</h2>
        <div className="proof-hours" role="img" aria-label={t('pf.peak', { p: Math.max(...hours.map(hour => hour.chance)) })}>
          {hours.map(hour => <span key={hour.time} title={`${new Date(hour.time).toLocaleString('en-GB', { weekday: 'short', hour: '2-digit', minute: '2-digit', timeZone })}: ${hour.chance}%`}>
            <i style={{ height: `${Math.max(4, hour.chance)}%` }} /></span>)}
        </div>
        <p className="proof-axis"><span>{new Date(hours[0].time).toLocaleString('en-GB', { weekday: 'short', hour: '2-digit', minute: '2-digit', timeZone })}</span>
          <span>{zone}</span>
          <span>{new Date(hours[hours.length - 1].time).toLocaleString('en-GB', { weekday: 'short', hour: '2-digit', minute: '2-digit', timeZone })}</span></p></div>}

      <div className="proof-block proof-tech"><h2>{t('pf.yourself')}</h2>
        <dl><div className="tech-row"><dt>{t('ev.signal')}</dt><dd><code title={hash}>{short(hash)}</code>
          <button type="button" className="copy" onClick={copy}>{copied ? t('ev.copied') : t('ev.copy')}</button></dd></div></dl>
        <p>{record.verified ? t('pf.match') : t('pf.noMatch')}</p>
        <a className="evidence-link" href={signalBase + hash} target="_blank" rel="noreferrer">{t('pf.raw')}</a>
      </div>
    </section>}
    <p className="proof-back"><Link href="/app">{t('pf.back')}</Link></p>
  </main>
}
