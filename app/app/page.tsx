'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { rankBatches, schedule, type Batch, type Weather } from '../../lib/schedule'
import { LanguageToggle, useT } from '../../lib/i18n'

type Priority = 'moisture' | 'arrival'
type Entry = Batch & { key: string }
type History = { batch: Entry; at: string; forecast?: Forecast }
type Workspace = { batches: Entry[]; history: History[]; priority: Priority; weather: Weather }
// `rain`, `peak` and `jobId` are kept so assignments recorded by earlier
// versions still display their evidence.
type Forecast = { weather?: Weather; chance?: number; condition?: string; when?: string; location?: string
  scope?: 'window' | 'day'; dailyPeak?: number; record?: 'verified' | 'pending' | 'failed' | 'none'; windowHours?: number
  rain?: number[]; peak?: number; validUntil?: number; reason?: string; windowStart?: number; threshold?: number
  evidence?: { billing?: 'escrow' | 'anjoman'; jobId?: string; receiptHash?: string; receipts?: string[]; transaction?: string
    provider?: string; minerId?: string; intent?: string; miner?: string; cost?: number; signalHash?: string; fulfillment?: string } }

const storageKey = 'paddyturn.workspace.v1'
const millKey = 'paddyturn.mill'
type Sync = 'local' | 'syncing' | 'synced' | 'error' | 'off'
const initial: Workspace = { batches: [], history: [], priority: 'moisture', weather: 'unknown' }
const weatherOptions = ['unknown', 'dry', 'rain'] as const

function Icon({ name }: { name: 'plus' | 'queue' | 'weather' | 'edit' | 'check' | 'close' }) {
  const paths = {
    plus: 'M12 5v14M5 12h14', queue: 'M4 6h16M4 12h16M4 18h10',
    weather: 'M4 16h13a4 4 0 1 0-1-7.9A6 6 0 0 0 4 12a2 2 0 0 0 0 4Zm4 4h8',
    edit: 'm4 16 12-12 4 4L8 20H4v-4Zm10-10 4 4',
    check: 'm5 12 4 4L19 6', close: 'm6 6 12 12M18 6 6 18',
  }
  return <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>
}

const signalUrl = (hash: string) => `/proof/${hash}`
const short = (value: string) => value.length > 18 ? `${value.slice(0, 8)}…${value.slice(-6)}` : value

function CopyValue({ label, value }: { label: string; value: string }) {
  const t = useT()
  const [copied, setCopied] = useState(false)
  async function copy() {
    try { await navigator.clipboard.writeText(value); setCopied(true); window.setTimeout(() => setCopied(false), 1500) } catch { /* clipboard unavailable */ }
  }
  return <div className="tech-row"><dt>{label}</dt><dd>
    <code title={value}>{short(value)}</code>
    <button type="button" className="copy" onClick={copy} aria-label={`${t('ev.copy')} ${label}`}>{copied ? t('ev.copied') : t('ev.copy')}</button>
  </dd></div>
}

function ForecastEvidence({ forecast }: { forecast: Forecast }) {
  const { evidence, peak, rain, windowStart, validUntil, threshold, chance, condition, when, location, weather,
    scope, dailyPeak, record, windowHours } = forecast
  const t = useT()
  if (!evidence && chance === undefined && peak === undefined) return null
  const receipts = [...(evidence?.receipts ?? []), ...(evidence?.receiptHash ? [evidence.receiptHash] : [])]
  const verified = Boolean(evidence?.signalHash || receipts.length)
  const unit = chance !== undefined || evidence?.billing === 'escrow' ? '%' : ' mm/h'
  const provider = evidence?.provider || evidence?.miner
  const usable = weather === 'dry' || weather === 'rain'
  return <div className="evidence">
    <div className="evidence-head">
      <span className={verified ? 'badge ok' : 'badge warn'}>{verified ? t('ev.verified') : t('ev.notVerified')}</span>
      {record === 'verified' && <span className="badge ok">{t('ev.recordChecked')}</span>}
      {record === 'pending' && <span className="badge net">{t('ev.recordPending')}</span>}
      <span className="badge net">{t('ev.testnet')}</span>
    </div>
    {chance !== undefined && <div className="evidence-main">
      <p className="evidence-figure"><strong>{chance}%</strong><span>{scope === 'window' && windowHours
        ? t('ev.chanceWindow', { h: windowHours }) : t('ev.chanceDay')}{condition ? ` · ${condition}` : ''}</span></p>
      {usable && threshold !== undefined && <p className={weather === 'rain' ? 'verdict rain' : 'verdict dry'}>
        {weather === 'rain' ? t('ev.rain', { t: threshold }) : t('ev.dry', { t: threshold })}</p>}
    </div>}
    {chance === undefined && peak !== undefined && <p className="evidence-figure"><strong>{peak} mm</strong><span>{t('ev.peakHourly')}</span></p>}
    <dl className="evidence-facts">
      {location && <div><dt>{t('ev.place')}</dt><dd>{location}</dd></div>}
      {provider && <div><dt>{t('ev.source')}</dt><dd>{provider}</dd></div>}
      {typeof evidence?.cost === 'number' && <div><dt>{t('ev.cost')}</dt><dd>{t('ev.costValue', { c: evidence.cost })}</dd></div>}
      {windowStart !== undefined && <div><dt>{t('ev.checked')}</dt><dd>{new Date(windowStart).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</dd></div>}
    </dl>
    {evidence?.signalHash && <a className="evidence-link" href={signalUrl(evidence.signalHash)} target="_blank" rel="noreferrer">
      {t('ev.check')}</a>}
    {evidence && <details className="evidence-tech">
      <summary>{t('ev.tech')}</summary>
      <dl>
        {evidence.intent && <div className="tech-row"><dt>Intent</dt><dd><code>{evidence.intent}</code></dd></div>}
        {evidence.minerId && <div className="tech-row"><dt>Miner</dt><dd>{evidence.minerId}</dd></div>}
        {receipts.map(receipt => <CopyValue key={receipt} label="Receipt" value={receipt} />)}
        {evidence.signalHash && <CopyValue label="Signal" value={evidence.signalHash} />}
        {evidence.jobId && <CopyValue label="Job ID" value={evidence.jobId} />}
        {evidence.fulfillment && <div className="tech-row"><dt>Fulfillment</dt><dd>{evidence.fulfillment}</dd></div>}
        <div className="tech-row"><dt>Billing</dt><dd>{evidence.billing ? 'Anjoman testnet escrow' : 'Ethereum Sepolia (testnet)'}</dd></div>
        {when && <div className="tech-row"><dt>Provider period</dt><dd>from {when}</dd></div>}
        {dailyPeak !== undefined && <div className="tech-row"><dt>Day peak</dt><dd>{dailyPeak}% (provider answer)</dd></div>}
        {scope && <div className="tech-row"><dt>Decided on</dt><dd>{scope === 'window' ? 'Hourly data for your window, from Telegraph’s public record' : 'The provider’s daily peak'}</dd></div>}
        {windowStart !== undefined && validUntil !== undefined && <div className="tech-row"><dt>Requested window</dt>
          <dd>{new Date(windowStart).toLocaleTimeString([], { timeStyle: 'short' })}–{new Date(validUntil).toLocaleTimeString([], { timeStyle: 'short' })}</dd></div>}
        {threshold !== undefined && <div className="tech-row"><dt>Rain limit</dt><dd>{threshold}{unit}</dd></div>}
        {!!rain?.length && <div className="tech-row"><dt>Hourly rain</dt><dd>{rain.join(', ')} mm</dd></div>}
      </dl>
      {/^(0x)[0-9a-f]{64}$/i.test(evidence.transaction || '') &&
        <a href={`https://sepolia.etherscan.io/tx/${evidence.transaction}`} target="_blank" rel="noreferrer">View Sepolia settlement ↗</a>}
    </details>}
  </div>
}

export default function Dashboard() {
  const t = useT()
  const [workspace, setWorkspace] = useState(initial)
  const [ready, setReady] = useState(false)
  const [storageError, setStorageError] = useState(false)
  const dialog = useRef<HTMLDialogElement>(null)
  const [editing, setEditing] = useState<Entry | null>(null)
  const [assigned, setAssigned] = useState('')
  const [error, setError] = useState('')
  const [forecast, setForecast] = useState<Forecast>()
  const [checking, setChecking] = useState(false)
  const [tab, setTab] = useState<'queue' | 'history'>('queue')
  const [millCode, setMillCode] = useState('')
  const [sync, setSync] = useState<Sync>('local')
  const [activeDays, setActiveDays] = useState(0)
  const [joining, setJoining] = useState(false)
  const [syncError, setSyncError] = useState('')
  const pushTimer = useRef<number | undefined>(undefined)
  useEffect(() => {
    let local = initial
    try {
      const data = localStorage.getItem(storageKey)
      if (data) { local = JSON.parse(data); setWorkspace(local) }
      const code = localStorage.getItem(millKey)
      if (code) void connect(code, local)
    } catch { setStorageError(true) }
    setReady(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Pull the latest mill workspace when the tab comes back into view.
  useEffect(() => {
    if (!millCode) return
    const refresh = () => { if (document.visibilityState === 'visible') void pull(millCode) }
    document.addEventListener('visibilitychange', refresh)
    return () => document.removeEventListener('visibilitychange', refresh)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [millCode])

  async function pull(code: string) {
    const response = await fetch('/api/workspace', { headers: { 'x-mill-code': code }, cache: 'no-store' })
    const body = await response.json().catch(() => ({}))
    if (response.status === 503 && !body.workspace) throw Object.assign(new Error('off'), { off: /not set up/.test(body.reason || '') })
    if (!response.ok) throw new Error(body.reason || 'sync')
    setActiveDays(body.activeDays || 0)
    if (body.workspace) {
      const { batches, history, priority, weather } = body.workspace as Workspace
      const next = { batches, history, priority, weather }
      try { localStorage.setItem(storageKey, JSON.stringify(next)) } catch { /* keep in memory */ }
      setWorkspace(next)
    }
    return Boolean(body.workspace)
  }

  async function push(code: string, next: Workspace) {
    setSync('syncing')
    try {
      const response = await fetch('/api/workspace', { method: 'PUT', headers: { 'Content-Type': 'application/json', 'x-mill-code': code },
        body: JSON.stringify({ workspace: next }) })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.reason || 'sync')
      setActiveDays(body.activeDays || 0)
      setSync('synced')
    } catch { setSync('error') }
  }

  async function connect(code: string, local: Workspace) {
    setSync('syncing'); setSyncError('')
    try {
      // Server data wins; an empty mill workspace is filled from this browser.
      const found = await pull(code)
      if (!found) await push(code, local)
      try { localStorage.setItem(millKey, code) } catch { /* not remembered */ }
      setMillCode(code); setSync('synced'); setJoining(false)
    } catch (error) {
      setSync((error as { off?: boolean }).off ? 'off' : 'error')
    }
  }

  function disconnect() {
    try { localStorage.removeItem(millKey) } catch { /* nothing to remove */ }
    setMillCode(''); setSync('local'); setActiveDays(0)
  }

  useEffect(() => {
    if (editing && dialog.current && !dialog.current.open) dialog.current.showModal()
  }, [editing])

  function save(next: Workspace) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(next))
      setStorageError(false)
    } catch { setStorageError(true) }
    setWorkspace(next)
    if (millCode) {
      window.clearTimeout(pushTimer.current)
      pushTimer.current = window.setTimeout(() => void push(millCode, next), 600)
    }
  }

  function joinMill(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const code = String(new FormData(event.currentTarget).get('mill') || '').trim()
    if (code.length < 10 || code.length > 64 || /\s/.test(code)) { setSyncError(t('sync.invalid')); return }
    void connect(code, workspace)
  }

  const { batches, history, priority, weather } = workspace
  const baseline = schedule(batches, priority, 'unknown')
  const forecastCurrent = Boolean(forecast?.validUntil && forecast.validUntil > Date.now())
  const conditions = forecast ? (forecastCurrent ? forecast.weather ?? 'unknown' : 'unknown') : weather
  const decision = schedule(batches, priority, conditions)

  useEffect(() => {
    if (!forecast?.validUntil) return
    const timer = window.setTimeout(() => setForecast(previous => previous && {
      ...previous, weather: 'unknown', reason: t('fc.expired'),
    }), Math.max(0, forecast.validUntil - Date.now()))
    return () => window.clearTimeout(timer)
  }, [forecast?.validUntil])

  async function checkForecast(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (checking || !baseline.needsWeather) return
    const form = new FormData(event.currentTarget)
    setChecking(true)
    setForecast({ reason: t('fc.inProgress') })
    try {
      const response = await fetch('/api/forecast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-paddyturn-token': String(form.get('token')) },
        body: JSON.stringify({
          location: String(form.get('location') || '').trim(),
          hours: Number(form.get('hours')), threshold: Number(form.get('threshold')),
        }),
      })
      const result: Forecast = await response.json()
      setForecast(response.ok ? result : { reason: result.reason || t('fc.unavailable') })
    } catch {
      setForecast({ reason: t('fc.failed') })
    } finally {
      setChecking(false)
    }
  }
  const next = batches.find(batch => batch.id === decision.next?.id)
  const outdoor = decision.outdoor.map(batch => batch.id)
  const ordered = rankBatches(batches, priority)

  function open(batch?: Entry) {
    setError('')
    setEditing(batch ?? { key: '', id: '', arrival: new Date().toTimeString().slice(0, 5), moisture: NaN, outdoor: false })
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editing) return
    const form = new FormData(event.currentTarget)
    const id = String(form.get('id')).trim()
    if (!id || batches.some(batch => batch.key !== editing.key && batch.id.toLowerCase() === id.toLowerCase())) {
      setError(t('dlg.unique'))
      return
    }
    const entry = { key: editing.key || crypto.randomUUID(), id, arrival: String(form.get('arrival')),
      moisture: Number(form.get('moisture')), outdoor: form.has('outdoor') }
    save({ ...workspace, batches: editing.key ? batches.map(batch => batch.key === editing.key ? entry : batch) : [...batches, entry] })
    setEditing(null)
  }

  function record(batch: Entry) {
    if (baseline.needsWeather && forecast && (!forecast.validUntil || forecast.validUntil <= Date.now())) return
    const proof = forecast?.evidence?.signalHash || forecast?.evidence?.receiptHash || forecast?.evidence?.receipts?.length
    const usedForecast = baseline.needsWeather && proof && conditions !== 'unknown' ? forecast : undefined
    save({ ...workspace, batches: batches.filter(item => item.key !== batch.key),
      history: [{ batch, at: new Date().toISOString(), forecast: usedForecast }, ...history] })
    setAssigned(batch.id)
  }

  return <main>
    <header className="top"><Link href="/" className="brand home-link"><img src="/paddyturn.svg" alt="" width="42" height="42" /><strong>PaddyTurn</strong></Link><div className="top-tools"><span>{t('app.title')}</span><LanguageToggle /></div></header>
    <div className="intro"><div><h1>{t('app.queueTitle')}</h1></div>
      <button className="primary" disabled={!ready} onClick={() => { setTab('queue'); open() }}><Icon name="plus" /> {t('app.add')}</button></div>
    {storageError && <p role="alert" className="error">{t('app.storageError')}</p>}
    {assigned && <div className="assignment-notice" role="status">
      <span>{t('app.assigned', { id: assigned })}</span>
      <button onClick={() => setTab('history')}>{t('app.viewHistory')}</button>
    </div>}
    <div className={batches.length && tab === 'queue' ? 'grid queue-active' : 'grid'}>
      <section className="card queue">
        <div className="tabs" aria-label={t('app.tabs')}>
          <button aria-pressed={tab === 'queue'} onClick={() => setTab('queue')}>{t('app.tab.queue')} <span>{batches.length}</span></button>
          <button aria-pressed={tab === 'history'} onClick={() => setTab('history')}>{t('app.tab.history')} <span>{history.length}</span></button>
        </div>
        {tab === 'queue' ? <>
          <div className="section-bar"><h2>{t('app.waiting')}</h2><label>{t('app.sortBy')} <select disabled={!ready} value={priority} onChange={e => save({ ...workspace, priority: e.target.value as Priority })}><option value="moisture">{t('app.sort.moisture')}</option><option value="arrival">{t('app.sort.arrival')}</option></select></label></div>
          {ordered.length ? <div className="scroll"><table><thead><tr><th>{t('app.col.batch')}</th><th>{t('app.col.arrival')}</th><th>{t('app.col.moisture')}</th><th>{t('app.col.outdoor')}</th><th><span className="sr">{t('app.col.actions')}</span></th></tr></thead>
            <tbody>{ordered.map(batch => <tr key={batch.key}><th scope="row">{batch.id}</th><td>{batch.arrival}</td><td>{batch.moisture}%</td><td>{batch.outdoor ? t('app.eligible') : '—'}</td><td><button className="icon-button" aria-label={t('app.edit', { id: batch.id })} onClick={() => open(batch)}><Icon name="edit" /></button></td></tr>)}</tbody></table></div>
            : <div className="empty"><div className="tile"><Icon name="queue" /></div><h3>{ready ? t('app.empty') : t('app.opening')}</h3><p>{t('app.emptyHint')}</p><button disabled={!ready} onClick={() => open()}>{t('app.addFirst')}</button></div>}
        </> : <><div className="section-bar"><h2>{t('app.historyTitle')}</h2></div>{history.length ? <div className="scroll"><table><thead><tr><th>{t('app.col.batch')}</th><th>{t('app.col.moisture')}</th><th>{t('app.col.assignedAt')}</th><th>{t('app.col.forecast')}</th></tr></thead><tbody>
          {history.map(item => <tr key={item.batch.key}><th scope="row">{item.batch.id}</th><td>{item.batch.moisture}%</td><td>{new Date(item.at).toLocaleString()}</td><td>{item.forecast ? <details className="history-forecast"><summary>{t('app.viewEvidence')}</summary><ForecastEvidence forecast={item.forecast} /></details> : "—"}</td></tr>)}
          </tbody></table></div> : <div className="empty"><h3>{t('app.noHistory')}</h3><p>{t('app.noHistoryHint')}</p></div>}</>}
        <footer className="sync">
          {millCode ? <>
            <span>{sync === 'syncing' ? t('sync.syncing') : sync === 'error' ? t('sync.error') : t('sync.synced', { n: activeDays })}</span>
            <button type="button" className="link-button" onClick={disconnect}>{t('sync.leave')}</button>
          </> : joining ? <form className="sync-form" onSubmit={joinMill}>
            <label>{t('sync.code')}<input name="mill" type="password" autoComplete="off" minLength={10} maxLength={64} required /></label>
            <button type="submit" disabled={sync === 'syncing'}>{sync === 'syncing' ? t('sync.syncing') : t('sync.connect')}</button>
            <button type="button" className="link-button" onClick={() => { setJoining(false); setSyncError('') }}>{t('sync.cancel')}</button>
            <p>{syncError || (sync === 'off' ? t('sync.off') : sync === 'error' ? t('sync.error') : t('sync.hint'))}</p>
          </form> : <>
            <span>{t('app.savedBrowser')}</span>
            <button type="button" className="link-button" disabled={!ready} onClick={() => setJoining(true)}>{t('sync.use')}</button>
          </>}
        </footer>
      </section>
      <aside className="side">
        <section className="card next" aria-live="polite">
          <img className="mill" src="/mill.svg" alt="" />
          <div className="next-copy"><h2>{t('next.title')}</h2>
            <p className="answer" key={next?.id ?? (decision.review ? 'review' : outdoor.length ? 'outdoor' : 'empty')}>{next?.id ?? (decision.review ? t('next.check') : outdoor.length ? t('next.outdoors') : '—')}</p>
            <p>{!batches.length ? t('next.start') : decision.review ? forecast?.reason || t('next.review', { id: decision.baseline?.id ?? '' }) : outdoor.length ? t('next.outdoorList', { ids: outdoor.join(', ') }) : conditions === 'rain' && decision.baseline?.outdoor ? t('next.rainKeeps') : priority === 'moisture' ? t('next.wettest') : t('next.first')}</p>
            {decision.review && <a className="conditions-link" href="#outdoor-conditions">{t('next.setWeather')}</a>}
            {next && <dl className="next-facts"><div><dt>{t('next.moisture')}</dt><dd>{next.moisture}%</dd></div><div><dt>{t('next.arrival')}</dt><dd>{next.arrival}</dd></div></dl>}
            {next && <button className="primary" onClick={() => record(next)}><Icon name="check" /> {t('next.assign')}</button>}
          </div>
        </section>
        <section id="outdoor-conditions" className="card weather" tabIndex={-1}><h2><Icon name="weather" /> {t('wx.card')}</h2>
          <div className="weather-options">{weatherOptions.map(option => <button key={option} disabled={!ready || checking} aria-pressed={!forecast && weather === option} onClick={() => {
            setForecast(undefined)
            save({ ...workspace, weather: option })
          }}>{t(`wx.opt.${option}`)}</button>)}</div>
        </section>
      </aside>
    </div>
    <details className="card forecast forecast-panel">
      <summary>{t('fc.title')}</summary>
      <div className="forecast-panel-body">
        <form onSubmit={checkForecast}>
          <div className="fields">
            <label>{t('fc.location')}<input name="location" type="text" minLength={2} maxLength={120} defaultValue="Pathein, Myanmar" required /></label>
            <label>{t('fc.window')}<input name="hours" type="number" min="1" max="6" defaultValue="3" required /></label>
            <label>{t('fc.limit')}<input name="threshold" type="number" min="1" max="100" step="1" defaultValue="40" required /></label>
          </div>
          <p>{t('fc.ask')}</p>
          <label>{t('fc.code')}<input name="token" type="password" autoComplete="off" required /></label>
          <button type="submit" disabled={!baseline.needsWeather || checking}>{checking ? t('fc.checking') : t('fc.get')}</button>
          {!baseline.needsWeather && <p>{t('fc.notNeeded')}</p>}
        </form>
        {forecast && <div className="forecast-result" aria-live="polite">
          {(forecast.reason || conditions === 'unknown') && <p className="forecast-message">{forecast.reason || t('fc.unavailable')}</p>}
          <ForecastEvidence forecast={forecast} />
        </div>}
      </div>
    </details>
    {editing && <dialog ref={dialog} aria-label={editing.key ? t('dlg.edit') : t('dlg.add')} onCancel={() => setEditing(null)}>
      <form onSubmit={submit}>
        <div className="section-bar"><h2>{editing.key ? t('dlg.edit') : t('dlg.add')}</h2><button type="button" className="icon-button" aria-label={t('dlg.close')} onClick={() => setEditing(null)}><Icon name="close" /></button></div>
        <label>{t('dlg.id')}<input name="id" required autoFocus maxLength={32} defaultValue={editing.id} placeholder={t('dlg.idHint')} /></label>
        <div className="fields"><label>{t('dlg.arrival')}<input name="arrival" type="time" required defaultValue={editing.arrival} /></label>
          <label>{t('dlg.moisture')}<input name="moisture" type="number" min="0" max="100" step="0.1" required defaultValue={Number.isFinite(editing.moisture) ? editing.moisture : ''} /></label></div>
        <label className="check"><input type="checkbox" name="outdoor" defaultChecked={editing.outdoor} /> {t('dlg.outdoor')}</label>
        {error && <p role="alert" className="error">{error}</p>}
        <div className="actions">{editing.key && <button type="button" className="remove" onClick={() => {
          save({ ...workspace, batches: batches.filter(batch => batch.key !== editing.key) }); setEditing(null)
        }}>{t('dlg.remove')}</button>}<button className="primary" type="submit">{t('dlg.save')}</button></div>
      </form>
    </dialog>}
  </main>
}
