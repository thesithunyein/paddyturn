import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseSignal, windowPeak } from '../lib/signal.ts'
import { applySignalCheck } from '../lib/check.ts'

const hash = '0x' + 'd0'.repeat(32)
const hourly = Array.from({ length: 6 }, (_, index) => ({
  time: `2026-11-22T${String(14 + index).padStart(2, '0')}:00Z`, temp_c: 28, precip_mm: 0,
  precip_probability_pct: [0, 5, 10, 60, 0, 0][index], conditions: 'partly_cloudy' }))
// Shape observed from the public signal record on testnet (Nov 2026).
const raw = {
  signal_hash: hash, kind: 'direct_result',
  signal: { intent_id: 'WEATHER_FORECAST_GENERAL', miner_slug: 'isobar-weather', subnet_id: '20260826', created_at: '2026-11-22T15:17:41Z' },
  payload: { intent_id: 'WEATHER_FORECAST_GENERAL', response: {
    source: 'open-meteo', forecast: hourly,
    daily: { time: ['2026-11-22'], precipitation_probability_max: [60], precipitation_sum: [1.2], temperature_2m_min: [23.1], temperature_2m_max: [31.3] },
    location: { name: 'Pathein', admin1: 'Ayeyarwady', country: 'Myanmar', timezone: 'Asia/Yangon' } } },
  result: { status: 'success', routing: { subnet_name: 'Isobar Weather', intent: 'WEATHER_FORECAST_GENERAL' }, execution: { cost_usd: 0.01 } },
  verification: { algorithm: 'keccak256', commitment: 'payload', verified: true },
}
const start = Date.parse('2026-11-22T14:20:00Z')

test('parses the public signal record', () => {
  const record = parseSignal(hash, raw)!
  assert.equal(record.verified, true)
  assert.equal(record.provider, 'Isobar Weather')
  assert.equal(record.place, 'Pathein, Ayeyarwady, Myanmar')
  assert.equal(record.cost, 0.01)
  assert.equal(record.hours.length, 6)
  assert.equal(record.days[0].chance, 60)
  assert.equal(parseSignal(hash, null), undefined)
})

test('window peak covers every overlapping hour and needs full coverage', () => {
  const { hours } = parseSignal(hash, raw)!
  const onHour = Date.parse('2026-11-22T14:00:00Z')
  assert.equal(windowPeak(hours, onHour, 3)?.chance, 10)      // 14:00, 15:00, 16:00
  assert.equal(windowPeak(hours, start, 3)?.chance, 60)       // 14:20–17:20 overlaps the 17:00 hour
  assert.equal(windowPeak(hours, Date.parse('2026-11-22T19:00:00Z'), 3), undefined) // runs past the data
})

const paid = { weather: 'rain' as const, chance: 60, evidence: { intent: 'WEATHER_FORECAST_GENERAL', signalHash: hash } }

test('a verified record decides on the exact window, not the daily peak', () => {
  const checked = applySignalCheck(paid, parseSignal(hash, raw), Date.parse('2026-11-22T14:00:00Z'), 3, 40)
  assert.equal(checked.weather, 'dry')
  assert.equal(checked.chance, 10)
  assert.equal(checked.dailyPeak, 60)
  assert.equal(checked.scope, 'window')
  assert.equal(checked.record, 'verified')
})

test('pending, unverified or mismatched records are handled safely', () => {
  assert.equal(applySignalCheck(paid, undefined, start, 3, 40).record, 'pending')
  assert.equal(applySignalCheck(paid, undefined, start, 3, 40).weather, 'rain')
  const unverified = parseSignal(hash, { ...raw, verification: { verified: false } })
  assert.equal(applySignalCheck(paid, unverified, start, 3, 40).weather, 'unknown')
  const other = parseSignal(hash, { ...raw, signal: { ...raw.signal, intent_id: 'OTHER' } })
  assert.equal(applySignalCheck(paid, other, start, 3, 40).record, 'failed')
  const review = { weather: 'unknown' as const, evidence: { signalHash: hash } }
  assert.equal(applySignalCheck(review, parseSignal(hash, raw), start, 3, 40).weather, 'unknown')
})
