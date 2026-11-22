'use client'

import Link from 'next/link'
import { useState } from 'react'
import { signalBase, type SignalRecord } from '../../../lib/signal'

const short = (value: string) => `${value.slice(0, 10)}…${value.slice(-8)}`

export default function ProofView({ hash, record, unavailable }: { hash: string; record?: SignalRecord; unavailable?: boolean }) {
  const [copied, setCopied] = useState(false)
  const next = record?.hours.filter(hour => hour.time >= Date.now() - 3_600_000).slice(0, 24) ?? []
  const hours = next.length ? next : record?.hours.slice(0, 24) ?? []
  async function copy() {
    try { await navigator.clipboard.writeText(hash); setCopied(true); window.setTimeout(() => setCopied(false), 1500) } catch { /* unavailable */ }
  }
  return <main className="proof-page">
    <header className="top">
      <Link href="/" className="brand home-link"><img src="/paddyturn.svg" alt="" width="42" height="42" /><strong>PaddyTurn</strong></Link>
      <span>Forecast proof</span>
    </header>
    {unavailable || !record ? <section className="card proof-card"><h1>Telegraph is not responding</h1>
      <p>Try again in a minute, or open the record directly.</p>
      <a className="evidence-link" href={signalBase + hash} target="_blank" rel="noreferrer">Open on Telegraph ↗</a></section>
    : <section className="card proof-card">
      <div className="evidence-head">
        <span className={record.verified ? 'badge ok' : 'badge warn'}>{record.verified ? '✓ Verified by Telegraph' : 'Not verified'}</span>
        <span className="badge net">Testnet</span>
      </div>
      <h1>{record.place ?? 'Weather check'}</h1>
      <dl className="evidence-facts proof-facts">
        <div><dt>Source</dt><dd>{record.provider ?? '—'}</dd></div>
        <div><dt>Cost</dt><dd>{record.cost !== undefined ? `${record.cost} test USDC` : '—'}</dd></div>
        <div><dt>Recorded</dt><dd>{record.createdAt ? new Date(record.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '—'}</dd></div>
        <div><dt>Request</dt><dd><code>{record.intent ?? '—'}</code></dd></div>
      </dl>

      {!!record.days.length && <div className="proof-block"><h2>Rain chance by day</h2>
        <table className="proof-days"><thead><tr><th>Day</th><th>Rain chance</th><th>Rain</th><th>Temp</th></tr></thead>
          <tbody>{record.days.map(day => <tr key={day.date}>
            <th scope="row">{new Date(day.date + 'T00:00:00Z').toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })}</th>
            <td>{day.chance ?? '—'}%</td><td>{day.mm ?? '—'} mm</td>
            <td>{day.min !== undefined && day.max !== undefined ? `${Math.round(day.min)}–${Math.round(day.max)}°C` : '—'}</td></tr>)}</tbody></table></div>}

      {!!hours.length && <div className="proof-block"><h2>Hourly rain chance</h2>
        <div className="proof-hours" role="img" aria-label={`Hourly rain chance, peak ${Math.max(...hours.map(hour => hour.chance))}%`}>
          {hours.map(hour => <span key={hour.time} title={`${new Date(hour.time).toLocaleString([], { weekday: 'short', hour: 'numeric' })}: ${hour.chance}%`}>
            <i style={{ height: `${Math.max(4, hour.chance)}%` }} /></span>)}
        </div>
        <p className="proof-axis"><span>{new Date(hours[0].time).toLocaleTimeString([], { hour: 'numeric' })}</span>
          <span>{new Date(hours[hours.length - 1].time).toLocaleTimeString([], { hour: 'numeric' })}</span></p></div>}

      <div className="proof-block proof-tech"><h2>Check it yourself</h2>
        <dl><div className="tech-row"><dt>Signal</dt><dd><code title={hash}>{short(hash)}</code>
          <button type="button" className="copy" onClick={copy}>{copied ? 'Copied' : 'Copy'}</button></dd></div></dl>
        <p>This record is published by Telegraph. Its payload hash is checked with {record.verified ? 'keccak256 and matches' : 'keccak256 and does not match'}.</p>
        <a className="evidence-link" href={signalBase + hash} target="_blank" rel="noreferrer">Open the raw record on Telegraph ↗</a>
      </div>
    </section>}
    <p className="proof-back"><Link href="/app">Open the PaddyTurn workspace →</Link></p>
  </main>
}
