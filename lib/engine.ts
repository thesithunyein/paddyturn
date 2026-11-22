import { classifyRainChance } from './forecast.ts'

// Anjoman API (API key, paid from the account's testnet escrow). The routed
// ask lets Telegraph pick the best-ranked miner for the intent. With an API
// key the body is only `intent` + `params` (or `query`): Anjoman sets the
// routed budget itself (0.26 USD) and returns the payment record in `receipt`.
// Docs: https://anjoman.ai/docs/using/api-keys and /docs/using/engine-ask
const endpoint = process.env.TELEGRAPH_API_BASE?.trim() || 'https://backend.telegraphprotocol.com'
export const intent = process.env.TELEGRAPH_INTENT?.trim() || 'WEATHER_FORECAST_GENERAL'

// Anjoman caps a routed API-key ask at 0.26 USD. The daily budget reserves
// that full amount per request; this setting is the most PaddyTurn accepts
// as a verified cost for one forecast (0.01–0.26).
export const routedCapUsd = 0.26
export function requestBudgetUsd(raw = process.env.TELEGRAPH_MAX_SPEND_USD) {
  const value = Number(raw ?? '0.10')
  return Number.isFinite(value) && value >= 0.01 && value <= 0.26 ? value : 0.10
}

type Payment = { miner?: unknown; intent?: unknown; amount_uusdc?: unknown; receipt_hash?: unknown }
type Answer = {
  result?: unknown; result_shape?: unknown; field_status?: Record<string, unknown>; cost_usd?: unknown
  signal_hash?: unknown; miner_id?: unknown; miner_name?: unknown; intent?: unknown; timestamp?: unknown
  fulfillment?: { status?: unknown; stopped?: unknown; payments?: unknown }; error?: unknown
  receipt?: unknown
}

export type Evidence = {
  billing: 'escrow'; intent: string; provider?: string; minerId?: string; cost?: number
  signalHash?: string; receipts: string[]; fulfillment?: string; timestamp?: string
}

// Amount fields vary between the engine reference and the API-key reply:
// USD values as numbers or numeric strings, or μUSDC integers.
const num = (value: unknown) => typeof value === 'number' ? value
  : typeof value === 'string' && /^\d+(\.\d+)?$/.test(value) ? Number(value) : undefined
export function costFrom(source: unknown): number | undefined {
  if (!source || typeof source !== 'object') return undefined
  const data = source as Record<string, unknown>
  for (const key of ['cost_usd', 'costUsd', 'amount_usd', 'amountUsd', 'price_usd', 'priceUsd']) {
    const value = num(data[key])
    if (value !== undefined && Number.isFinite(value) && value >= 0) return value
  }
  for (const key of ['amount_uusdc', 'amountUusdc', 'amount_micro_usdc', 'cost_uusdc', 'costUusdc']) {
    const value = num(data[key])
    if (value !== undefined && Number.isFinite(value) && value >= 0) return value / 1e6
  }
  return undefined
}

const hex = (value: unknown) => typeof value === 'string' && /^(0x)?[0-9a-f]{16,128}$/i.test(value) ? value : undefined

// The API-key reply is `{ result, receipt }`, where `result` holds the node's
// own reply (result, field_status, signal_hash, miner fields). Unwrap it so
// the same rules apply to both reply forms. Observed on testnet, Nov 2026.
export function unwrapAnswer(answer: Answer): Answer {
  const inner = answer?.result
  if (inner && typeof inner === 'object' && !Array.isArray(inner)
    && ['result', 'field_status', 'signal_hash', 'result_shape', 'miner_id'].some(key => key in inner)) {
    return { ...(inner as Answer), receipt: answer.receipt ?? (inner as Answer).receipt }
  }
  return answer
}

export function readEngineAnswer(raw: Answer, limitPct: number, budgetUsd: number) {
  const answer = unwrapAnswer(raw)
  const payments = Array.isArray(answer.fulfillment?.payments) ? answer.fulfillment.payments as Payment[] : []
  // Receipts come from `fulfillment.payments` (budgeted asks) and/or the
  // top-level `receipt` payment record (API-key asks): a hash or an object.
  const record = answer.receipt
  const recordHashes = typeof record === 'string' ? [record]
    : record && typeof record === 'object' ? ['receipt_hash', 'receiptHash', 'hash', 'tx_hash', 'txHash']
      .map(key => (record as Record<string, unknown>)[key]) : []
  const receipts = [...new Set([...payments.map(payment => payment?.receipt_hash), ...recordHashes]
    .map(hex).filter((value): value is string => Boolean(value)))]
  const recordCost = costFrom(record)
  const paid = payments.reduce((sum, payment) => sum + (typeof payment?.amount_uusdc === 'number' ? payment.amount_uusdc : 0), 0) / 1e6
  const cost = costFrom(answer) ?? (payments.length ? paid : recordCost)
  const evidence: Evidence = {
    billing: 'escrow', intent: typeof answer.intent === 'string' ? answer.intent : intent,
    provider: typeof answer.miner_name === 'string' ? answer.miner_name.slice(0, 80) : undefined,
    // The receipt's miner is the registry ID; the reply's miner_id can be a subnet ID.
    minerId: [(record as Record<string, unknown> | undefined)?.miner, answer.miner_id]
      .find(value => typeof value === 'string' || typeof value === 'number')?.toString(),
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
    method: 'POST', redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(35_000),
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ intent, params: { location: location.trim(), window_hours: hours } }),
  })
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as Record<string, unknown>
    const detail = [body.message, body.error, body.code].find(value => typeof value === 'string') as string | undefined
    // Logged without secrets so the deployment logs show why Telegraph refused.
    console.error('telegraph_engine_error', response.status, JSON.stringify(body).slice(0, 600))
    // Engine 4xx/503 responses are documented as not charged.
    throw new Error(`Telegraph returned HTTP ${response.status}${detail ? `: ${detail.slice(0, 160)}` : ''}. No forecast was used.`)
  }
  const answer = await response.json() as Answer
  // Shape only (keys, receipt record, cost fields) so integration issues can
  // be diagnosed from deployment logs. No credentials are in the reply.
  const inner = unwrapAnswer(answer)
  console.log('telegraph_engine_answer', JSON.stringify({ keys: Object.keys(answer ?? {}), innerKeys: Object.keys(inner ?? {}),
    receipt: answer?.receipt, result_shape: inner?.result_shape, field_status: inner?.field_status,
    result: inner?.result, signal_hash: inner?.signal_hash, fulfillment: inner?.fulfillment?.status }).slice(0, 2500))
  return readEngineAnswer(answer, limitPct, budgetUsd)
}
