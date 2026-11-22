import { classifyRainChance } from './forecast.ts'

export const node = 'https://devnode.telegraphprotocol.com'
// This is the live, ranked testnet weather-forecast intent. Mission pages use
// human-readable labels; the request must use the currently supported ID.
export const intent = process.env.TELEGRAPH_INTENT || 'WEATHER_FORECAST_GENERAL'
const network = 'eip155:11155111'
const asset = '0xcc194e1a843B658526D0D5C431f670028582Ae17'
let attempted = false

type Miner = { id?: unknown; activation_status?: unknown; min_price_usdc?: unknown; scores?: unknown }

async function resolveMiner() {
  const configured = process.env.TELEGRAPH_MINER_ID?.trim()
  if (configured) {
    if (!/^\d+$/.test(configured)) throw new Error('Invalid Telegraph miner ID.')
    return configured
  }
  const response = await fetch(`${node}/api/miners?intent=${encodeURIComponent(intent)}&limit=25`, {
    signal: AbortSignal.timeout(12_000), cache: 'no-store', redirect: 'error',
  })
  if (!response.ok) throw new Error(`Telegraph miner discovery returned HTTP ${response.status}.`)
  const payload = await response.json() as unknown
  const miners = Array.isArray(payload) ? payload as Miner[] : []
  const candidates = miners.map(miner => {
    const id = typeof miner.id === 'string' || typeof miner.id === 'number' ? String(miner.id) : ''
    const price = typeof miner.min_price_usdc === 'number' ? miner.min_price_usdc : Number.POSITIVE_INFINITY
    const score = Array.isArray(miner.scores) ? miner.scores.find((item: { intent_id?: unknown; rank?: unknown }) => item?.intent_id === intent) : undefined
    const rank = typeof score?.rank === 'number' ? score.rank : Number.POSITIVE_INFINITY
    return { id, price, rank, active: miner.activation_status === 'active' }
  }).filter(candidate => candidate.active && /^\d+$/.test(candidate.id) && Number.isFinite(candidate.price))
    .sort((a, b) => a.rank - b.rank || a.price - b.price)
  if (!candidates[0]) throw new Error(`No active Telegraph provider is available for ${intent}.`)
  return candidates[0].id
}

async function forecastRequest(location: string, hours: number) {
  const miner = await resolveMiner()
  return { miner, url: node + '/engine/v1/ask/' + miner, options: {
    method: 'POST', redirect: 'error' as const, signal: AbortSignal.timeout(25000),
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ intent, params: { location, window_hours: hours } }),
  } }
}

export function readSepoliaQuote(header: string | null) {
  if (!header) throw new Error('Telegraph did not include an x402 payment challenge.')
  const challenge = JSON.parse(Buffer.from(header, 'base64').toString('utf8'))
  const option = Array.isArray(challenge.accepts) ? challenge.accepts.find((value: Record<string, unknown>) =>
    value?.scheme === 'exact' && value.network === network && typeof value.asset === 'string'
    && value.asset.toLowerCase() === asset.toLowerCase()) : undefined
  if (!option || typeof option.amount !== 'string' || !/^[1-9]\d*$/.test(option.amount)) {
    throw new Error('No valid exact-payment quote for Sepolia test USDC.')
  }
  return { network, asset, amountMicroUsdc: option.amount }
}

export async function quoteForecast(location: string, hours: number) {
  const { miner, url, options } = await forecastRequest(location, hours)
  const response = await fetch(url, options)
  if (response.status !== 402) throw new Error(`Expected a Telegraph quote, received HTTP ${response.status}.`)
  return { status: 'quote-only', intent, miner, ...readSepoliaQuote(response.headers.get('payment-required')) }
}

export async function purchase(location: string, hours: number, limitPct: number) {
  const key = process.env.SEPOLIA_PRIVATE_KEY
  if (!key || !/^0x[0-9a-fA-F]{64}$/.test(key)) throw new Error('Configure a dedicated Sepolia test wallet.')
  const cap = Number(process.env.MAX_TEST_MICRO_USDC || '10000')
  if (!Number.isSafeInteger(cap) || cap < 1 || cap > 100000) throw new Error('Invalid testnet spend cap.')
  if (attempted) throw new Error('The local process already attempted a purchase. Review settlement before restarting.')
  // These libraries are only needed for an actual paid x402 run. Loading them
  // here keeps quote discovery and its tests usable in Node environments that
  // do not resolve their ESM subpath exports correctly.
  const [{ wrapFetchWithPaymentFromConfig }, { ExactEvmScheme }, { privateKeyToAccount }] = await Promise.all([
    import('@x402/fetch'), import('@x402/evm'), import('viem/accounts'),
  ])
  const account = privateKeyToAccount(key as `0x${string}`)
  const client = wrapFetchWithPaymentFromConfig(fetch, {
    schemes: [{ network, client: new ExactEvmScheme(account) }],
    spendControls: { allowedAssets: [{ network, asset, maxAmountPerPayment: String(cap) }] },
  })

  const { miner, url, options } = await forecastRequest(location, hours)
  attempted = true
  const response = await client(url, options)
  if (!response.ok) throw new Error(`Telegraph returned HTTP ${response.status}. Check settlement before retrying.`)
  const answer = await response.json()
  const rawReceipt = response.headers.get('x-telegraph-receipt')
  if (!rawReceipt || !answer.signal_hash) throw new Error('Telegraph did not return verifiable purchase evidence.')
  const receipt = JSON.parse(Buffer.from(rawReceipt, 'base64').toString('utf8'))
  const evidence = { intent, miner, provider: answer.miner_name, cost: answer.cost_usd,
    signalHash: answer.signal_hash, receiptHash: receipt.receipt_hash, transaction: receipt.tx_hash }
  try {
    // Only the rain chance decides the turn; classifyRainChance checks its
    // field status. Optional descriptive fields may be missing.
    if (answer.error || answer.result?.error) throw new Error('Telegraph returned an error result.')
    const forecast = classifyRainChance(answer.result, answer.field_status, limitPct)
    return { ...forecast, evidence }
  } catch (error) {
    return { weather: 'unknown' as const, evidence,
      reason: error instanceof Error ? error.message : 'Unusable forecast.' }
  }
}
