'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { rankBatches, schedule, type Batch, type Weather } from '../../lib/schedule'

type Priority = 'moisture' | 'arrival'
type Entry = Batch & { key: string }
type History = { batch: Entry; at: string; forecast?: Forecast }
type Workspace = { batches: Entry[]; history: History[]; priority: Priority; weather: Weather }
// `rain`, `peak` and `jobId` are kept so assignments recorded by earlier
// versions still display their evidence.
type Forecast = { weather?: Weather; chance?: number; condition?: string; when?: string; location?: string
  rain?: number[]; peak?: number; validUntil?: number; reason?: string; windowStart?: number; threshold?: number
  evidence?: { billing?: 'escrow' | 'anjoman'; jobId?: string; receiptHash?: string; receipts?: string[]; transaction?: string
    provider?: string; minerId?: string; intent?: string; miner?: string; cost?: number; signalHash?: string; fulfillment?: string } }

const storageKey = 'paddyturn.workspace.v1'
const initial: Workspace = { batches: [], history: [], priority: 'moisture', weather: 'unknown' }
const weatherOptions = [{ id: 'unknown', label: 'Not sure' }, { id: 'dry', label: 'Dry weather' }, { id: 'rain', label: 'Rain likely' }] as const

function Icon({ name }: { name: 'plus' | 'queue' | 'weather' | 'edit' | 'check' | 'close' }) {
  const paths = {
    plus: 'M12 5v14M5 12h14', queue: 'M4 6h16M4 12h16M4 18h10',
    weather: 'M4 16h13a4 4 0 1 0-1-7.9A6 6 0 0 0 4 12a2 2 0 0 0 0 4Zm4 4h8',
    edit: 'm4 16 12-12 4 4L8 20H4v-4Zm10-10 4 4',
    check: 'm5 12 4 4L19 6', close: 'm6 6 12 12M18 6 6 18',
  }
  return <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>
}

function ForecastEvidence({ forecast }: { forecast: Forecast }) {
  const { evidence, peak, rain, windowStart, validUntil, threshold, chance, condition, when, location } = forecast
  const unit = chance !== undefined || forecast.evidence?.billing === 'escrow' ? '%' : ' mm/h'
  return <div className="forecast-evidence">
    {windowStart !== undefined && validUntil !== undefined &&
      <p>Forecast window: {new Date(windowStart).toLocaleString()} to {new Date(validUntil).toLocaleString()}</p>}
    {location && <p>Location: {location}</p>}
    {when && <p>Provider forecast period starts: {when}</p>}
    {chance !== undefined && <p>Peak rain chance in the provider’s period: {chance}%{condition ? ` · ${condition}` : ''}</p>}
    {threshold !== undefined && <p>Rain limit: {threshold}{unit}</p>}
    {peak !== undefined && <p>Peak hourly rain: {peak} mm</p>}
    {!!rain?.length && <p>Hourly rain: {rain.join(', ')} mm</p>}
    {evidence && <>
      <p>{evidence.billing ? 'Billing: Anjoman testnet escrow' : 'Network: Ethereum Sepolia (testnet)'}</p>
      {evidence.jobId && <p>Job ID: <code>{evidence.jobId}</code></p>}
      {evidence.intent && <p>Intent: <code>{evidence.intent}</code></p>}
      {(evidence.provider || evidence.miner || evidence.minerId) && <p>Provider: {evidence.provider || evidence.miner}{evidence.minerId ? ` (miner ${evidence.minerId})` : ''}</p>}
      {evidence.fulfillment && <p>Fulfillment: {evidence.fulfillment}</p>}
      {evidence.receipts?.map(receipt => <p key={receipt}>Receipt: <code>{receipt}</code></p>)}
      {typeof evidence.cost === 'number' && <p>Cost: {evidence.cost} test USDC</p>}
      {evidence.receiptHash && <p>Receipt: <code>{evidence.receiptHash}</code></p>}
      {evidence.signalHash && <p>Signal: <code>{evidence.signalHash}</code></p>}
      {/^(0x)[0-9a-f]{64}$/i.test(evidence.transaction || '') &&
        <a href={`https://sepolia.etherscan.io/tx/${evidence.transaction}`} target="_blank" rel="noreferrer">View Sepolia settlement</a>}
    </>}
  </div>
}

export default function Dashboard() {
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
  useEffect(() => {
    try {
      const data = localStorage.getItem(storageKey)
      if (data) setWorkspace(JSON.parse(data))
    } catch { setStorageError(true) }
    setReady(true)
  }, [])

  useEffect(() => {
    if (editing && dialog.current && !dialog.current.open) dialog.current.showModal()
  }, [editing])

  function save(next: Workspace) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(next))
      setStorageError(false)
    } catch { setStorageError(true) }
    setWorkspace(next)
  }

  const { batches, history, priority, weather } = workspace
  const baseline = schedule(batches, priority, 'unknown')
  const forecastCurrent = Boolean(forecast?.validUntil && forecast.validUntil > Date.now())
  const conditions = forecast ? (forecastCurrent ? forecast.weather ?? 'unknown' : 'unknown') : weather
  const decision = schedule(batches, priority, conditions)

  useEffect(() => {
    if (!forecast?.validUntil) return
    const timer = window.setTimeout(() => setForecast(previous => previous && {
      ...previous, weather: 'unknown', reason: 'Forecast expired. Check current conditions.',
    }), Math.max(0, forecast.validUntil - Date.now()))
    return () => window.clearTimeout(timer)
  }, [forecast?.validUntil])

  async function checkForecast(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (checking || !baseline.needsWeather) return
    const form = new FormData(event.currentTarget)
    setChecking(true)
    setForecast({ reason: 'Checking forecast…' })
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
      setForecast(response.ok ? result : { reason: result.reason || 'Forecast unavailable.' })
    } catch {
      setForecast({ reason: 'Forecast unavailable. Check settlement before retrying.' })
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
      setError('Enter a unique batch ID.')
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
    <header className="top"><Link href="/" className="brand home-link"><img src="/paddyturn.svg" alt="" width="42" height="42" /><strong>PaddyTurn</strong></Link><span>Mill workspace</span></header>
    <div className="intro"><div><h1>Dryer queue</h1></div>
      <button className="primary" disabled={!ready} onClick={() => { setTab('queue'); open() }}><Icon name="plus" /> Add batch</button></div>
    {storageError && <p role="alert" className="error">Browser storage is unavailable. Changes may be lost when you leave.</p>}
    {assigned && <div className="assignment-notice" role="status">
      <span><strong>{assigned}</strong> assigned to the dryer.</span>
      <button onClick={() => setTab('history')}>View history</button>
    </div>}
    <div className={batches.length && tab === 'queue' ? 'grid queue-active' : 'grid'}>
      <section className="card queue">
        <div className="tabs" aria-label="Workspace view">
          <button aria-pressed={tab === 'queue'} onClick={() => setTab('queue')}>Queue <span>{batches.length}</span></button>
          <button aria-pressed={tab === 'history'} onClick={() => setTab('history')}>History <span>{history.length}</span></button>
        </div>
        {tab === 'queue' ? <>
          <div className="section-bar"><h2>Waiting batches</h2><label>Sort by <select disabled={!ready} value={priority} onChange={e => save({ ...workspace, priority: e.target.value as Priority })}><option value="moisture">Wettest first</option><option value="arrival">First to arrive</option></select></label></div>
          {ordered.length ? <div className="scroll"><table><thead><tr><th>Batch</th><th>Arrival</th><th>Moisture</th><th>Outdoor</th><th><span className="sr">Actions</span></th></tr></thead>
            <tbody>{ordered.map(batch => <tr key={batch.key}><th scope="row">{batch.id}</th><td>{batch.arrival}</td><td>{batch.moisture}%</td><td>{batch.outdoor ? 'Eligible' : '—'}</td><td><button className="icon-button" aria-label={'Edit ' + batch.id} onClick={() => open(batch)}><Icon name="edit" /></button></td></tr>)}</tbody></table></div>
            : <div className="empty"><div className="tile"><Icon name="queue" /></div><h3>{ready ? 'No batches in queue' : 'Opening workspace…'}</h3><p>Add a batch when it arrives at the mill.</p><button disabled={!ready} onClick={() => open()}>Add first batch</button></div>}
        </> : <><div className="section-bar"><h2>Dryer history</h2></div>{history.length ? <div className="scroll"><table><thead><tr><th>Batch</th><th>Moisture</th><th>Assigned at</th><th>Forecast</th></tr></thead><tbody>
          {history.map(item => <tr key={item.batch.key}><th scope="row">{item.batch.id}</th><td>{item.batch.moisture}%</td><td>{new Date(item.at).toLocaleString()}</td><td>{item.forecast ? <details className="history-forecast"><summary>View evidence</summary><ForecastEvidence forecast={item.forecast} /></details> : "—"}</td></tr>)}
          </tbody></table></div> : <div className="empty"><h3>No dryer assignments yet</h3><p>Assigned batches appear here.</p></div>}</>}
        <footer>Saved in this browser</footer>
      </section>
      <aside className="side">
        <section className="card next" aria-live="polite">
          <img className="mill" src="/mill.svg" alt="" />
          <div className="next-copy"><h2>Next batch to dry</h2>
            <p className="answer" key={next?.id ?? (decision.review ? 'review' : outdoor.length ? 'outdoor' : 'empty')}>{next?.id ?? (decision.review ? 'Check weather' : outdoor.length ? 'Dry outdoors' : '—')}</p>
            <p>{!batches.length ? 'Add a batch to start.' : decision.review ? forecast?.reason || decision.baseline?.id + ' can dry outdoors. Check the weather before assigning it.' : outdoor.length ? 'Can dry outdoors: ' + outdoor.join(', ') : conditions === 'rain' && decision.baseline?.outdoor ? 'Rain keeps this batch in the dryer queue.' : priority === 'moisture' ? 'Highest moisture reading in the queue.' : 'First to arrive.'}</p>
            {decision.review && <a className="conditions-link" href="#outdoor-conditions">Set the weather</a>}
            {next && <dl className="next-facts"><div><dt>Moisture</dt><dd>{next.moisture}%</dd></div><div><dt>Arrival</dt><dd>{next.arrival}</dd></div></dl>}
            {next && <button className="primary" onClick={() => record(next)}><Icon name="check" /> Assign to dryer</button>}
          </div>
        </section>
        <section id="outdoor-conditions" className="card weather" tabIndex={-1}><h2><Icon name="weather" /> Weather for outdoor drying</h2>
          <div className="weather-options">{weatherOptions.map(option => <button key={option.id} disabled={!ready || checking} aria-pressed={!forecast && weather === option.id} onClick={() => {
            setForecast(undefined)
            save({ ...workspace, weather: option.id })
          }}>{option.label}</button>)}</div>
        </section>
      </aside>
    </div>
    <details className="card forecast forecast-panel">
      <summary>Optional forecast check</summary>
      <div className="forecast-panel-body">
        <form onSubmit={checkForecast}>
          <div className="fields">
            <label>Mill location<input name="location" type="text" minLength={2} maxLength={120} defaultValue="Pathein, Myanmar" required /></label>
            <label>Window (hours)<input name="hours" type="number" min="1" max="6" defaultValue="3" required /></label>
            <label>Rain chance limit (%)<input name="threshold" type="number" min="1" max="100" step="1" defaultValue="40" required /></label>
          </div>
          <p>Ask your mill manager for the forecast access code.</p>
          <label>Forecast access code<input name="token" type="password" autoComplete="off" required /></label>
          <button type="submit" disabled={!baseline.needsWeather || checking}>{checking ? 'Checking…' : 'Get forecast'}</button>
          {!baseline.needsWeather && <p>The next batch does not need a forecast.</p>}
        </form>
        {forecast && <div className="forecast-result" aria-live="polite">
          <p>{forecast.reason || (conditions === 'rain' ? 'Rain chance at or above your limit. Keep outdoor batches in the dryer queue.' : conditions === 'dry' ? 'Rain chance below your limit. Outdoor drying is an option.' : 'Forecast unavailable.')}</p>
          <p className="forecast-note">Bought through Telegraph on testnet. Each check costs at most the configured request budget.</p>
          <ForecastEvidence forecast={forecast} />
        </div>}
      </div>
    </details>
    {editing && <dialog ref={dialog} aria-label={editing.key ? 'Edit batch' : 'Add batch'} onCancel={() => setEditing(null)}>
      <form onSubmit={submit}>
        <div className="section-bar"><h2>{editing.key ? 'Edit batch' : 'Add batch'}</h2><button type="button" className="icon-button" aria-label="Close" onClick={() => setEditing(null)}><Icon name="close" /></button></div>
        <label>Batch ID<input name="id" required autoFocus maxLength={32} defaultValue={editing.id} placeholder="e.g. PT-024" /></label>
        <div className="fields"><label>Arrival<input name="arrival" type="time" required defaultValue={editing.arrival} /></label>
          <label>Moisture reading (%)<input name="moisture" type="number" min="0" max="100" step="0.1" required defaultValue={Number.isFinite(editing.moisture) ? editing.moisture : ''} /></label></div>
        <label className="check"><input type="checkbox" name="outdoor" defaultChecked={editing.outdoor} /> This batch can dry outdoors</label>
        {error && <p role="alert" className="error">{error}</p>}
        <div className="actions">{editing.key && <button type="button" className="remove" onClick={() => {
          save({ ...workspace, batches: batches.filter(batch => batch.key !== editing.key) }); setEditing(null)
        }}>Remove batch</button>}<button className="primary" type="submit">Save batch</button></div>
      </form>
    </dialog>}
  </main>
}
