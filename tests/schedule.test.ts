import { test } from 'node:test'
import assert from 'node:assert/strict'
import { sample, schedule } from '../lib/schedule.ts'
import { classifyForecast } from '../lib/forecast.ts'

test('rain, dry conditions and unavailable evidence change the next turn', () => {
  assert.equal(schedule(sample, 'moisture', 'dry').next?.id, 'P-02')
  assert.equal(schedule(sample, 'moisture', 'rain').next?.id, 'P-01')
  assert.equal(schedule(sample, 'moisture', 'unknown').review, true)
})

test('an indoor first batch needs no purchase', () => {
  const result = schedule(sample.slice(1), 'arrival', 'unknown')
  assert.equal(result.next?.id, 'P-02')
  assert.equal(result.needsWeather, false)
})

test('forecast must cover each hour exactly and threshold is inclusive', () => {
  const time = '2026-11-18T09:00:00Z'
  const hour = { time, precipitation_mm: 0.2 }
  assert.equal(classifyForecast([hour], Date.parse(time), 1, 0.2).weather, 'rain')
  assert.throws(() => classifyForecast([hour], Date.parse(time), 2, 0.2))
  assert.throws(() => classifyForecast([hour, hour], Date.parse(time), 1, 0.2))
})
