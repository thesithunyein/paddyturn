import { classifyRainChance } from './forecast.ts'

// Anjoman API (API key, paid from the account's testnet escrow). The routed
// ask lets Telegraph pick the best-ranked miner for the intent and returns
// per-payment receipts in `fulfillment.payments` when a budget is set.
// Docs: https://anjoman.ai/docs/using/api-keys and /docs/using/engine-ask
const endpoint = process.env.TELEGRAPH_API_BASE?.trim() || 'https://backend.telegraphprotocol.com'
export const intent = process.env.TELEGRAPH_INTENT?.trim() || 'WEATHER_FORECAST_GENERAL'

// Testnet accepts max_budget_usdc from 10000 to 260000 μUSDC ($0.01–$0.26).
export function requestBudgetUsd(raw = process.env.TELEGRAPH_MAX_SPEND_USD) {
  const value = Number(raw ?? '0.10')
  return Number.isFinite(value) && value >= 0.01 && value <= 0.26 ? value : 0.10
}

type Payment = { miner?: unknown; intent?: unknown; amount_uusdc?: unknown; receipt_hash?: unknown }
type Answer = {
  result?: unknown; result_shape?: unknown; field_status?: Record<string, unknown>; cost_usd?: unknown
  signal_hash?: unknown; miner_id?: unknown; miner_name?: unknown; intent?: unknown; timestamp?: unknown
  fulfillment?: { status?: unknown; stopped?: unknown; payments?: unknown }; error?: unknown
}

export type Evidence = {
  billing: 'escrow'; intent: string; provider?: string; minerId?: string; cost?: number
  signalHash?: string; receipts: string[]; fulfillment?: string; timestamp?: string
}

const hex = (value: unknown) => typeof value === 'string' && /^(0x)?[0-9a-f]{16,128}$/i.test(value) ? value : undefined

export function readEngineAnswer(answer: Answer, limitPct: number, budgetUsd: number) {
  const payments = Array.isArray(answer.fulfillment?.payments) ? answer.fulfillment.payments as Payment[] : []
  const receipts = payments.map(payment => hex(payment?.receipt_hash)).filter((value): value is string => Boolean(value))
  const paid = payments.reduce((sum, payment) => sum + (typeof payment?.amount_uusdc === 'number' ? payment.amount_uusdc : 0), 0) / 1e6
  const reported = typeof answer.cost_usd === 'number' && Number.isFinite(answer.cost_usd) ? answer.cost_usd : undefined
  const cost = reported ?? (payments.length ? paid : undefined)
  const evidence: Evidence = {
    billing: 'escrow', intent: typeof answer.intent === 'string' ? answer.intent : intent,
    provider: typeof answer.miner_name === 'string' ? answer.miner_name.slice(0, 80) : undefined,
    minerId: typeof answer.miner_id === 'string' || typeof answer.miner_id === 'number' ? String(answer.miner_id) : undefined,
    cost: cost !== undefined && cost >= 0 ? cost : undefined,
    signalHash: hex(answer.signal_hash), receipts,
    fulfillment: typeof answer.fulfillment?.status === 'string' ? answer.fulfillment.status : undefined,
    timestamp: typeof answer.timestamp === 'string' ? answer.timestamp : undefined,
  }
  const review = (reason: string) => ({ weather: 'unknown' as const, evidence, reason })
  if (answer.error) return review('Telegraph reported an error for this request. Review conditions manually.')
  if (!evidence.signalHash && !receipts.length) return review('Telegraph returned no signal hash or receipt, so the forecast is not used.')
  if (evidence.cost === undefined || evidence.cost > budgetUsd + 1e-9) return review('The paid cost could not be verified against the request budget.')
  if (answer.result_shape !== undefined && answer.result_shape !== 'intent') return review('Telegraph could not shape the forecast into the intent fields.')
  if (evidence.fulfillment && evidence.fulfillment !== 'complete') return review(`Forecast fulfillment was ${evidence.fulfillment}. Review conditions manually.`)
  try {
    return { ...classifyRainChance(answer.result, answer.field_status, limitPct), evidence }
  } catch (error) {
    return review(error instanceof Error ? error.message : 'Unusable forecast.')
  }
}

export async function requestForecast(location: string, hours: number, limitPct: number, budgetUsd = requestBudgetUsd()) {
  const key = process.env.TELEGRAPH_API_KEY?.trim()
  if (!key) throw new Error('Forecast service is not configured. Enter outdoor conditions manually.')
  const response = await fetch(`${endpoint}/engine/ask`, {
    method: 'POST', redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(55_000),
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ intent, params: { location: location.trim(), window_hours: hours },
      max_budget_usdc: Math.round(budgetUsd * 1e6), deadline_ms: 45_000 }),
  })
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { error?: unknown; code?: unknown }
    const code = [body.code, body.error].find(value => typeof value === 'string') as string | undefined
    // 4xx/503 responses from the engine are documented as not charged.
    throw new Error(`Telegraph returned HTTP ${response.status}${code ? ` (${code.slice(0, 80)})` : ''}. No forecast was used.`)
  }
  return readEngineAnswer(await response.json() as Answer, limitPct, budgetUsd)
}
