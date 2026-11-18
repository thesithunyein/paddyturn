export type Batch = { id: string; arrival: string; moisture: number; outdoor: boolean }
export type Weather = 'dry' | 'rain' | 'unknown'

export const sample: Batch[] = [
  { id: 'P-01', arrival: '07:30', moisture: 25, outdoor: true },
  { id: 'P-02', arrival: '07:45', moisture: 23, outdoor: false },
  { id: 'P-03', arrival: '08:10', moisture: 21, outdoor: false },
]

export function schedule(batches: Batch[], priority: 'moisture' | 'arrival', weather: Weather) {
  const ranked = [...batches].sort((a, b) =>
    (priority === 'moisture' ? b.moisture - a.moisture : a.arrival.localeCompare(b.arrival))
    || a.arrival.localeCompare(b.arrival) || a.id.localeCompare(b.id))
  const baseline = ranked[0]
  const indoor = ranked.find(batch => !batch.outdoor)
  const needsWeather = Boolean(baseline?.outdoor)
  const next = weather === 'dry' ? indoor : weather === 'rain' || !needsWeather ? baseline : undefined

  return { baseline, next, needsWeather, review: needsWeather && weather === 'unknown',
    outdoor: weather === 'dry' && needsWeather ? ranked.filter(batch => batch.outdoor) : [] }
}
