import { createHash } from 'node:crypto'

// Upstash Redis over its REST API (no client package). Vercel's Upstash
// integration sets KV_REST_API_*; a direct Upstash database sets UPSTASH_REDIS_REST_*.
const url = (process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || '').replace(/\/$/, '')
const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || ''
export const storeReady = Boolean(url && token)

type Command = (string | number)[]

export async function redis(commands: Command[]): Promise<unknown[]> {
  if (!storeReady) throw new Error('Storage is not configured.')
  const response = await fetch(`${url}/pipeline`, {
    method: 'POST', cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(8_000),
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(commands),
  })
  if (!response.ok) throw new Error(`Storage returned HTTP ${response.status}.`)
  const results = await response.json() as { result?: unknown; error?: string }[]
  const failed = results.find(item => item.error)
  if (failed) throw new Error(`Storage error: ${failed.error}`)
  return results.map(item => item.result)
}

// A mill code is a shared secret chosen by the mill. Only its hash is stored.
export const validMillCode = (code: unknown): code is string =>
  typeof code === 'string' && code.length >= 10 && code.length <= 64 && /^[\x21-\x7e]+$/.test(code)
export const millId = (code: string) => createHash('sha256').update('paddyturn:' + code).digest('hex').slice(0, 32)
export const today = (now = Date.now()) => new Date(now).toISOString().slice(0, 10)
