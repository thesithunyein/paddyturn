import { test } from 'node:test'
import assert from 'node:assert/strict'
import { anjomanResult } from '../lib/anjoman.ts'

const start = Date.parse('2026-11-18T07:00:00Z')
const source = { result: { start_time: '2026-11-18T07:00:00Z', hourly_count: 3, hourly_max_precipitation_mm: 0.3 } }

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
