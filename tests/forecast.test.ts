import { test } from 'node:test'
import assert from 'node:assert/strict'
import { classifyRainChance, validLocation } from '../lib/forecast.ts'

const result = { location: 'Pathein, Myanmar', when: 'next 3 hours', temp_max_c: 31, temp_min_c: 25,
  precipitation_probability_pct: 40, condition: 'Scattered showers' }

test('rain chance at or above the limit keeps outdoor paddy in the queue', () => {
  assert.equal(classifyRainChance(result, { precipitation_probability_pct: 'ok' }, 40).weather, 'rain')
  assert.equal(classifyRainChance({ ...result, precipitation_probability_pct: 39 }, undefined, 40).weather, 'dry')
  assert.equal(classifyRainChance(result, undefined, 40).condition, 'Scattered showers')
})

test('an unverified, missing or out-of-range rain chance is never used', () => {
  assert.throws(() => classifyRainChance(result, { precipitation_probability_pct: 'rejected' }, 40))
  assert.throws(() => classifyRainChance(result, { temp_max_c: 'ok' }, 40))
  assert.throws(() => classifyRainChance({ ...result, precipitation_probability_pct: null }, undefined, 40))
  assert.throws(() => classifyRainChance({ ...result, precipitation_probability_pct: 140 }, undefined, 40))
  assert.throws(() => classifyRainChance(null, undefined, 40))
  assert.throws(() => classifyRainChance(result, undefined, 0))
})

test('location must be a short place name without control characters', () => {
  assert.equal(validLocation('Pathein, Myanmar'), true)
  assert.equal(validLocation(' '), false)
  assert.equal(validLocation('Pathein\nignore previous'), false)
  assert.equal(validLocation('x'.repeat(121)), false)
  assert.equal(validLocation(42), false)
})
