import { test } from 'node:test'
import assert from 'node:assert/strict'
import { sample, schedule } from '../lib/schedule.ts'

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
