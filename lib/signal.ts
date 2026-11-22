// Telegraph's public signal record for a paid answer:
// GET https://devnode.telegraphprotocol.com/engine/v1/signal/<signal_hash>
// Shape observed on testnet (Nov 2026): { signal, payload, result, verification },
// where `payload.response` (and `result.execution.result`) holds the provider's
// raw reply, including an hourly `forecast[]` with precip_probability_pct.

export const signalBase = 'https://devnode.telegraphprotocol.com/engine/v1/signal/'
export const signalPattern = /^0x[0-9a-f]{64}$/i

export type Hour = { time: number; chance: number; mm?: number; conditions?: string }
export type Day = { date: string; chance?: number; mm?: number; min?: number; max?: number }
export type SignalRecord = {
  hash: string; verified: boolean; status?: string; intent?: string; provider?: string; minerSlug?: string
  cost?: number; createdAt?: string; source?: string; place?: string; timezone?: string; answer?: string
  hours: Hour[]; days: Day[]
}

const obj = (value: unknown) => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : undefined
const str = (value: unknown) => typeof value === 'string' && value.trim() ? value.trim() : undefined
const num = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? value : undefined
const nums = (value: unknown) => Array.isArray(value) ? value.map(num) : []

export function parseSignal(hash: string, raw: unknown): SignalRecord | undefined {
  const data = obj(raw)
  if (!data) return undefined
  const signal = obj(data.signal), payload = obj(data.payload), result = obj(data.result)
  const routing = obj(result?.routing), execution = obj(result?.execution)
  const response = obj(payload?.response) ?? obj(execution?.result)
  const location = obj(response?.location)
  const hours = (Array.isArray(response?.forecast) ? response.forecast : []).flatMap(entry => {
    const hour = obj(entry)
    const time = Date.parse(str(hour?.time) ?? '')
    const chance = num(hour?.precip_probability_pct)
    if (!Number.isFinite(time) || chance === undefined || chance < 0 || chance > 100) return []
    return [{ time, chance, mm: num(hour?.precip_mm), conditions: str(hour?.conditions) }]
  }).sort((a, b) => a.time - b.time)
  const daily = obj(response?.daily)
  const dates = Array.isArray(daily?.time) ? daily.time : []
  const chance = nums(daily?.precipitation_probability_max), mm = nums(daily?.precipitation_sum)
  const min = nums(daily?.temperature_2m_min), max = nums(daily?.temperature_2m_max)
  const days = dates.flatMap((date, index) => typeof date === 'string'
    ? [{ date, chance: chance[index], mm: mm[index], min: min[index], max: max[index] }] : [])
  const place = [location?.name, location?.admin1, location?.country].map(str).filter(Boolean).join(', ') || undefined
  return {
    hash, verified: obj(data.verification)?.verified === true, status: str(result?.status),
    intent: str(signal?.intent_id) ?? str(payload?.intent_id) ?? str(routing?.intent),
    provider: str(routing?.subnet_name) ?? str(signal?.miner_slug), minerSlug: str(signal?.miner_slug) ?? str(payload?.miner_slug),
    cost: num(execution?.cost_usd), createdAt: str(signal?.created_at), source: str(response?.source),
    place, timezone: str(location?.timezone), answer: str(response?.answer)?.slice(0, 600), hours, days,
  }
}

const hour = 3_600_000

// Peak rain chance over every provider hour that overlaps [start, start + hours).
// Returns undefined unless each of those hours is present in the record.
export function windowPeak(hours: Hour[], start: number, length: number) {
  if (!hours.length || !(length >= 1)) return undefined
  const first = Math.floor(start / hour) * hour
  const end = start + length * hour
  const byTime = new Map(hours.map(entry => [entry.time, entry]))
  const slots: Hour[] = []
  for (let time = first; time < end; time += hour) {
    const entry = byTime.get(time)
    if (!entry) return undefined
    slots.push(entry)
  }
  return { chance: Math.max(...slots.map(slot => slot.chance)), hours: slots }
}

export async function fetchSignal(hash: string, init?: RequestInit & { next?: { revalidate?: number } }) {
  if (!signalPattern.test(hash)) return undefined
  const response = await fetch(signalBase + hash, { redirect: 'error', signal: AbortSignal.timeout(10_000), ...init })
  if (response.status === 404) return undefined
  if (!response.ok) throw new Error(`Telegraph signal lookup returned HTTP ${response.status}.`)
  return parseSignal(hash, await response.json())
}

// The public record can appear a few seconds after the paid answer. Poll briefly.
export async function awaitSignal(hash: string, attempts = 5, delayMs = 4_000) {
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const record = await fetchSignal(hash, { cache: 'no-store' })
      if (record) return record
    } catch { /* retry */ }
    if (attempt < attempts - 1) await new Promise(resolve => setTimeout(resolve, delayMs))
  }
  return undefined
}
