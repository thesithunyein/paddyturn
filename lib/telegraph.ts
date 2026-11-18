import { wrapFetchWithPaymentFromConfig } from '@x402/fetch'
import { ExactEvmScheme } from '@x402/evm'
import { privateKeyToAccount } from 'viem/accounts'
import { classifyForecast, classifyWindow } from './forecast.ts'

export const node = 'https://devnode.telegraphprotocol.com'
export const intent = process.env.TELEGRAPH_INTENT || 'WEATHER_FORECAST_GENERAL'
const network = 'eip155:11155111'
const asset = '0xcc194e1a843B658526D0D5C431f670028582Ae17'
let attempted = false

export async function purchase(latitude: number, longitude: number, start: number, hours: number, threshold: number) {
  const key = process.env.SEPOLIA_PRIVATE_KEY
  if (!key || !/^0x[0-9a-fA-F]{64}$/.test(key)) throw new Error('Configure a dedicated Sepolia test wallet.')
  const cap = Number(process.env.MAX_TEST_MICRO_USDC || '10000')
  if (!Number.isSafeInteger(cap) || cap < 1 || cap > 100000) throw new Error('Invalid testnet spend cap.')
  if (attempted) throw new Error('The local process already attempted a purchase. Review settlement before restarting.')
  const account = privateKeyToAccount(key as `0x${string}`)
  const client = wrapFetchWithPaymentFromConfig(fetch, {
    schemes: [{ network, client: new ExactEvmScheme(account) }],
    spendControls: { allowedAssets: [{ network, asset, maxAmountPerPayment: String(cap) }] },
  })

  const miner = process.env.TELEGRAPH_MINER_ID || '4433'
  if (!/^\d+$/.test(miner)) throw new Error('Invalid Telegraph miner ID.')
  attempted = true
  const response = await client(node + '/engine/v1/ask/' + miner, {
    method: 'POST', redirect: 'error', signal: AbortSignal.timeout(25000),
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ intent, params: { location: `${latitude},${longitude}`, window_hours: hours } }),
  })
  if (!response.ok) throw new Error(`Telegraph returned HTTP ${response.status}. Check settlement before retrying.`)
  const answer = await response.json()
  const rawReceipt = response.headers.get('x-telegraph-receipt')
  if (!rawReceipt || !answer.signal_hash) throw new Error('Telegraph did not return verifiable purchase evidence.')
  const receipt = JSON.parse(Buffer.from(rawReceipt, 'base64').toString('utf8'))
  const evidence = { intent, miner, provider: answer.miner_name, cost: answer.cost_usd,
    signalHash: answer.signal_hash, receiptHash: receipt.receipt_hash, transaction: receipt.tx_hash }
  try {
    if (answer.error || answer.result?.error || Object.values(answer.field_status || {}).some(status => status !== 'ok')) {
      throw new Error('Telegraph returned unusable forecast fields.')
    }
    const forecast = Array.isArray(answer.result?.hourly)
      ? classifyForecast(answer.result.hourly, start, hours, threshold)
      : classifyWindow(answer.result, start, hours, threshold)
    return { ...forecast, evidence }
  } catch (error) {
    return { weather: 'unknown' as const, rain: [], evidence,
      reason: error instanceof Error ? error.message : 'Unusable forecast.' }
  }
}
