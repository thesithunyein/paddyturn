'use client'

import Link from 'next/link'
import { useState } from 'react'
import { schedule, type Batch } from '../lib/schedule'

const example: Batch[] = [
  { id: 'PT-024', arrival: '07:30', moisture: 25, outdoor: true },
  { id: 'PT-025', arrival: '07:45', moisture: 23, outdoor: false },
]

export default function QueuePreview() {
  const [weather, setWeather] = useState<'dry' | 'rain'>('rain')
  const { next, baseline } = schedule(example, 'moisture', weather)

  return <figure className="landing-preview">
    <figcaption className="preview-header"><strong>What happens if it rains?</strong><span>Sample data</span></figcaption>
    <table>
      <thead><tr><th scope="col">Batch</th><th scope="col">Arrival</th><th scope="col">Moisture</th></tr></thead>
      <tbody>{example.map(batch => <tr key={batch.id}><th scope="row">{batch.id}</th><td>{batch.arrival}</td><td>{batch.moisture}%</td></tr>)}</tbody>
    </table>
    <div className="preview-weather" role="group" aria-label="Sample weather">
      <button type="button" aria-pressed={weather === 'dry'} onClick={() => setWeather('dry')}>Dry weather</button>
      <button type="button" aria-pressed={weather === 'rain'} onClick={() => setWeather('rain')}>Rain likely</button>
    </div>
    <div className="preview-next">
      <div className="grain-scene" aria-hidden="true">
        <div className="grain-medallion">
          <span className="grain-back" />
          <span className="grain-rim" />
          <span className="grain-face"><img src="/paddyturn.svg" alt="" /></span>
        </div>
      </div>
      <div aria-live="polite">
        <span>Next dryer turn</span><strong>{next?.id}</strong>
        <small>{weather === 'dry' ? baseline?.id + ' can dry outdoors.' : 'Rain keeps the wetter batch indoors.'}</small>
      </div>
    </div>
    <Link href="/app" className="preview-open">Open workspace <span aria-hidden="true">→</span></Link>
  </figure>
}
