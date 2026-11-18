'use client'

import { useState } from 'react'
import { sample, schedule, type Batch, type Weather } from '../lib/schedule'

type Forecast = { weather?: Weather; rain?: number[]; peak?: number; reason?: string;
  evidence?: { provider?: string; cost?: number; receiptHash?: string; signalHash?: string; transaction?: string } }

export default function Dashboard() {
  const [batches, setBatches] = useState(sample)
  const [priority, setPriority] = useState<'moisture' | 'arrival'>('moisture')
  const [mode, setMode] = useState('dry')
  const [output, setOutput] = useState<Forecast>()
  const [busy, setBusy] = useState(false)
  const [token, setToken] = useState('')
  const [latitude, setLatitude] = useState('16.78')
  const [longitude, setLongitude] = useState('94.73')
  const [hours, setHours] = useState('3')
  const [threshold, setThreshold] = useState('0.2')
  const plan = schedule(batches, priority, 'unknown')
  const weather = mode === 'live' ? output?.weather || 'unknown' : mode as Weather
  const decision = schedule(batches, priority, weather)
  const valid = batches.every(batch => /^([01]\d|2[0-3]):[0-5]\d$/.test(batch.arrival)
    && Number.isFinite(batch.moisture) && batch.moisture >= 0 && batch.moisture <= 100)
  const update = (index: number, fields: Partial<Batch>) => {
    setBatches(current => current.map((batch, i) => i === index ? { ...batch, ...fields } : batch))
    setOutput(undefined)
  }

  async function run() {
    if (!valid || !plan.needsWeather || busy || output) return
    setBusy(true)
    try {
      const response = await fetch('/api/forecast', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'x-paddyturn-token': token },
        body: JSON.stringify({ latitude: Number(latitude), longitude: Number(longitude), hours: Number(hours), threshold: Number(threshold) }),
      })
      setOutput(await response.json())
    } catch {
      setOutput({ reason: 'The forecast service did not respond. Check settlement before trying again.' })
    } finally {
      setBusy(false)
    }
  }

  return <main>
    <header><div className="mark" aria-hidden="true">PT</div><strong>PaddyTurn</strong><span>Shift planning</span></header>
    <section className="hero"><p>Ayeyarwady Delta · Mill operations</p><h1>Know which paddy<br />batch to dry next.</h1></section>
    <div className="grid">
      <section className="panel">
        <h2>Incoming batches</h2>
        <label className="priority">Priority <select disabled={busy} value={priority} onChange={e => {
          setPriority(e.target.value as typeof priority); setOutput(undefined)
        }}><option value="moisture">Highest measured moisture</option><option value="arrival">Earliest arrival</option></select></label>
        <div className="scroll"><table><thead><tr><th>Batch</th><th>Arrival</th><th>Moisture %</th><th>Outdoor</th></tr></thead>
          <tbody>{batches.map((batch, i) => <tr key={batch.id}>
            <th scope="row">{batch.id}</th>
            <td><input aria-label={batch.id + ' arrival'} disabled={busy} type="time" value={batch.arrival} onChange={e => update(i, { arrival: e.target.value })} /></td>
            <td><input aria-label={batch.id + ' moisture'} disabled={busy} type="number" min="0" max="100" step="0.1" value={Number.isNaN(batch.moisture) ? '' : batch.moisture} onChange={e => update(i, { moisture: e.target.valueAsNumber })} /></td>
            <td><input aria-label={batch.id + ' eligible for outdoor drying'} disabled={busy} type="checkbox" checked={batch.outdoor} onChange={e => update(i, { outdoor: e.target.checked })} /></td>
          </tr>)}</tbody></table></div>
        <h2>Weather evidence</h2>
        <div className="modes" aria-label="Weather mode">{[['dry','Dry replay'],['rain','Rain replay'],['unknown','Unavailable replay'],['live','Live testnet']].map(([value,label]) =>
          <button key={value} disabled={busy} aria-pressed={mode === value} onClick={() => { setMode(value); setOutput(undefined) }}>{label}</button>)}</div>
        {mode === 'live' && <div className="live">
          {([['Latitude',latitude,setLatitude],['Longitude',longitude,setLongitude],['Hours',hours,setHours],['Rain threshold mm/h',threshold,setThreshold],['Local access token',token,setToken]] as const).map(([label,value,set]) =>
            <label key={label}>{label}<input disabled={busy} type={label === 'Local access token' ? 'password' : 'number'}
              value={value} onChange={e => { set(e.target.value); setOutput(undefined) }} /></label>)}
          <button className="primary" disabled={busy || !valid || !plan.needsWeather || !token || !latitude || !longitude || !!output} onClick={run}>{busy ? 'Checking Telegraph…' : 'Run live assessment'}</button>
        </div>}
      </section>
      <section className="panel result" aria-live="polite">
        <p className="eyebrow">{mode === 'live' ? 'Ethereum Sepolia' : 'Simulated forecast replay'}</p>
        <h2>Next dryer turn</h2>
        <p className="answer">{!valid ? 'Check inputs' : decision.review ? 'Operator review' : decision.next?.id || 'No dryer batch'}</p>
        <p>{!valid ? 'Enter a valid arrival time and moisture reading for each batch.'
          : !plan.needsWeather ? 'The first-ranked batch requires the dryer. No forecast purchase is needed.'
          : decision.review ? output?.reason || 'A usable forecast is needed to choose the next batch.'
          : weather === 'dry' ? 'The first-ranked batch can be considered for outdoor drying in this dry window.'
          : 'Rain keeps the first-ranked batch in the mechanical dryer queue.'}</p>
        {valid && <dl><div><dt>Original priority</dt><dd>{decision.baseline?.id}</dd></div>
          <div><dt>Outdoor candidates</dt><dd>{decision.outdoor.map(batch => batch.id).join(', ') || 'None'}</dd></div>
          {output?.peak !== undefined && <div><dt>Peak hourly rain (mm)</dt><dd>{output.peak}</dd></div>}
          {output?.rain?.length ? <div><dt>Hourly rain (mm)</dt><dd>{output.rain.join(', ')}</dd></div> : null}
        </dl>}
        {output?.evidence && <div className="evidence"><h3>Telegraph purchase</h3><p>Provider {output.evidence.provider || 'Unknown'}</p>
          <p>Testnet cost {output.evidence.cost ?? 'Unavailable'}</p><p>Receipt <code>{output.evidence.receiptHash}</code></p>
          <p>Signal <code>{output.evidence.signalHash}</code></p>
          {/^0x[0-9a-f]{64}$/i.test(output.evidence.transaction || '') && <a href={'https://sepolia.etherscan.io/tx/' + output.evidence.transaction} target="_blank" rel="noreferrer">View settlement</a>}
        </div>}
        <p className="foot">Use measured moisture and your mill’s procedures for storage decisions.</p>
      </section>
    </div>
  </main>
}
