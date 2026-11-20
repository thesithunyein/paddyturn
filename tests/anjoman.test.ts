import { test } from 'node:test'
import assert from 'node:assert/strict'
import { anjomanResult } from '../lib/anjoman.ts'

const start = Date.parse('2026-11-18T07:00:00Z')
const source = { result: { start_time: '2026-11-18T07:00:00Z', hourly_count: 3, hourly_max_precipitation_mm: 0.3 } }

test('paid aggregate is usable only with zero rain and exact structured coverage', () => {
  const saved = { precipitation_mm: 0, window: '2026-11-20T16:00Z to 2026-11-20T18:00Z (3 hours)', window_hours: 3 }
  const requested = Date.parse('2026-11-20T16:00Z')
  const classify = (result: object) => anjomanResult({ status: 'complete', costUsd: 0.01, sources: [{ result }] }, 'job', requested, 3, 0.2).weather
  const aggregate = { total_precipitation_mm: 0, start_time: '2026-11-20T16:00Z', end_time: '2026-11-20T19:00Z' }
  assert.equal(classify(saved), 'unknown')
  assert.equal(classify(aggregate), 'dry')
  assert.equal(classify({ ...aggregate, end_time: '2026-11-20T18:00Z' }), 'unknown')
  assert.equal(classify({ ...aggregate, total_precipitation_mm: 0.3 }), 'unknown')
})

test('paid job uses the structured rainfall source and retains job evidence', () => {
  const result = anjomanResult({ status: 'complete', costUsd: 0.01, sources: [source] }, 'job', start, 3, 0.2)
  assert.equal(result.weather, 'rain')
  assert.equal(result.evidence.jobId, 'job')
  assert.equal(result.evidence.cost, 0.01)
})

test('failed jobs and unsupported or mismatched source windows require review', () => {
  assert.equal(anjomanResult({ status: 'failed' }, 'job', start, 3, 0.2).weather, 'unknown')
  assert.equal(anjomanResult({ status: 'complete', costUsd: 0.01, sources: [source] }, 'job', start, 2, 0.2).weather, 'unknown')
})
