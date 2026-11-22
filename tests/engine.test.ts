import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readEngineAnswer, requestBudgetUsd } from '../lib/engine.ts'

const receipt = '0x' + 'ab'.repeat(32)
const signal = '0x' + 'cd'.repeat(32)
const answer = {
  intent: 'WEATHER_FORECAST_GENERAL', miner_id: '4433', miner_name: 'Oathcast Weather', cost_usd: 0.01,
  signal_hash: signal, result_shape: 'intent', field_status: { precipitation_probability_pct: 'ok' },
  result: { location: 'Pathein, Myanmar', precipitation_probability_pct: 20, condition: 'Partly cloudy' },
  fulfillment: { status: 'complete', payments: [{ miner: '4433', intent: 'WEATHER_FORECAST_GENERAL', amount_uusdc: 10000, receipt_hash: receipt }] },
}

test('a paid, shaped answer decides the turn and keeps receipt evidence', () => {
  const forecast = readEngineAnswer(answer, 40, 0.10)
  assert.equal(forecast.weather, 'dry')
  assert.deepEqual(forecast.evidence.receipts, [receipt])
  assert.equal(forecast.evidence.signalHash, signal)
  assert.equal(forecast.evidence.cost, 0.01)
  assert.equal(forecast.evidence.provider, 'Oathcast Weather')
})

test('API-key answers prove payment with the top-level receipt record', () => {
  const { fulfillment, ...rest } = answer
  const forecast = readEngineAnswer({ ...rest, signal_hash: undefined, receipt: { receipt_hash: receipt, amount_uusdc: 10000 } }, 40, 0.10)
  assert.equal(forecast.weather, 'dry')
  assert.deepEqual(forecast.evidence.receipts, [receipt])
  assert.equal(readEngineAnswer({ ...rest, signal_hash: undefined, cost_usd: undefined, receipt: { receipt_hash: receipt, amount_uusdc: 10000 } }, 40, 0.10).evidence.cost, 0.01)
})

test('cost falls back to the sum of fulfillment payments', () => {
  assert.equal(readEngineAnswer({ ...answer, cost_usd: undefined }, 40, 0.10).evidence.cost, 0.01)
})

test('answers without proof, over budget, partial or unshaped require operator review', () => {
  assert.equal(readEngineAnswer({ ...answer, signal_hash: undefined, fulfillment: { status: 'complete', payments: [] } }, 40, 0.10).weather, 'unknown')
  assert.equal(readEngineAnswer({ ...answer, cost_usd: 0.5 }, 40, 0.10).weather, 'unknown')
  assert.equal(readEngineAnswer({ ...answer, fulfillment: { ...answer.fulfillment, status: 'partial' } }, 40, 0.10).weather, 'unknown')
  assert.equal(readEngineAnswer({ ...answer, result_shape: 'raw' }, 40, 0.10).weather, 'unknown')
  assert.equal(readEngineAnswer({ ...answer, error: 'upstream' }, 40, 0.10).weather, 'unknown')
  assert.equal(readEngineAnswer({ ...answer, field_status: { precipitation_probability_pct: 'missing' } }, 40, 0.10).weather, 'unknown')
})

test('request budget stays inside the testnet range', () => {
  assert.equal(requestBudgetUsd('0.05'), 0.05)
  assert.equal(requestBudgetUsd('0.30'), 0.10)
  assert.equal(requestBudgetUsd('0'), 0.10)
  assert.equal(requestBudgetUsd('abc'), 0.10)
})
