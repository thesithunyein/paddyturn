import { classifyForecast, classifyWindow } from './forecast.ts'

const endpoint = 'https://backend.telegraphprotocol.com'
// This is the live, ranked testnet weather-forecast intent. It can be
// overridden server-side if Telegraph's active provider catalogue changes.
const intent = process.env.TELEGRAPH_INTENT?.trim() || 'WEATHER_FORECAST_GENERAL'
const configuredSpend = Number(process.env.TELEGRAPH_MAX_SPEND_USD || '0.10')
// A forecast can involve more than one ranked miner. Keep a real ceiling, but
// allow enough room for a useful multi-miner answer.
const maxSpendUsd = Number.isFinite(configuredSpend) && configuredSpend >= 0.01 && configuredSpend <= 0.10
  ? configuredSpend : 0.10

type Job = { status?: string; outcome?: string; jobId?: string; id?: string; costUsd?: unknown; cost_usd?: unknown; sources?: unknown; result?: unknown }

export function anjomanResult(job: Job, jobId: string | undefined, start: number, hours: number, threshold: number) {
  const cost = job.costUsd ?? job.cost_usd
  const evidence = { billing: 'anjoman' as const, jobId, intent,
    cost: typeof cost === 'number' && Number.isFinite(cost) && cost >= 0 ? cost : undefined }
  if (!(job.status === 'complete' || job.status === 'completed' || job.outcome === 'complete' || job.outcome === 'completed') || !jobId || evidence.cost === undefined || evidence.cost <= 0 || evidence.cost > maxSpendUsd) {
    return { weather: 'unknown' as const, evidence, reason: 'Anjoman did not confirm a completed paid forecast. Check the job and available balance.' }
  }
  const results = Array.isArray(job.sources) ? job.sources : job.result ? [job.result] : []
  for (const source of results) {
    const data = source?.result ?? source?.data?.result ?? source?.data ?? source
    if (!data || typeof data !== 'object') continue
    try {
      const forecast = Array.isArray(data.hourly)
        ? classifyForecast(data.hourly, start, hours, threshold)
        : classifyWindow(data, start, hours, threshold)
      const provider = source?.miner_name ?? source?.minerName
      return { ...forecast, evidence: { ...evidence, provider: typeof provider === 'string' ? provider : undefined } }
    } catch {
      // A source can lack the full forecast window. Check the remaining sources.
    }
  }
  return { weather: 'unknown' as const, evidence, reason: 'Anjoman did not return source data covering the requested rainfall window. Review conditions manually.' }
}

export async function requestAnjomanForecast(latitude: number, longitude: number, start: number, hours: number, threshold: number) {
  const key = process.env.TELEGRAPH_API_KEY?.trim()
  if (!key) throw new Error('Forecast service is not configured. Enter outdoor conditions manually.')
  const headers = { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }
  const signal = AbortSignal.timeout(105_000)
  const response = await fetch(`${endpoint}/agent/chat`, {
    method: 'POST', headers, signal, redirect: 'error', cache: 'no-store',
    body: JSON.stringify({ message: `Hourly precipitation forecast for ${latitude},${longitude} starting ${new Date(start).toISOString()}.`,
      intent, params: { location: `${latitude},${longitude}`, window_hours: hours }, maxSpendUsd, stream: false }),
  })
  if (!response.ok) throw new Error(`Anjoman returned HTTP ${response.status}. Check API access and account balance.`)
  let job: Job = await response.json()
  const candidateJobId = job.jobId ?? job.id
  const jobId = typeof candidateJobId === 'string' && /^[0-9a-f-]{36}$/i.test(candidateJobId) ? candidateJobId : undefined
  try {
    while (job.status === 'running' && jobId && !signal.aborted) {
      await new Promise(resolve => setTimeout(resolve, 2500))
      const status = await fetch(`${endpoint}/agent/jobs/${jobId}`, { headers, signal, redirect: 'error', cache: 'no-store' })
      if (!status.ok) throw new Error('Job lookup failed.')
      job = await status.json()
    }
  } catch {
    return { weather: 'unknown' as const, evidence: { billing: 'anjoman' as const, jobId, intent },
      reason: 'Forecast job status is unavailable. Check Anjoman Jobs before retrying.' }
  }
  return anjomanResult(job, jobId, start, hours, threshold)
}
