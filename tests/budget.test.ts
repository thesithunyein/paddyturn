import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createBudget } from '../lib/budget.ts'

const day = Date.parse('2026-11-22T03:00:00Z')

test('daily budget reserves up front and settles to the observed cost', () => {
  const budget = createBudget(0.25)
  assert.equal(budget.reserve(0.10, day), true)
  assert.equal(budget.reserve(0.10, day), true)
  assert.equal(budget.reserve(0.10, day), false)
  budget.settle(0.10, 0.01, day)
  assert.equal(budget.reserve(0.10, day), true)
})

test('unknown cost keeps the reservation and the limit resets each UTC day', () => {
  const budget = createBudget(0.10)
  assert.equal(budget.reserve(0.10, day), true)
  budget.settle(0.10, undefined, day)
  assert.equal(budget.reserve(0.01, day), false)
  assert.equal(budget.reserve(0.10, day + 24 * 3_600_000), true)
})

test('shared budget uses one atomic counter and rolls back over-limit reservations', async () => {
  const { createSharedBudget } = await import('../lib/budget.ts')
  const counters = new Map<string, number>()
  const run = async (commands: (string | number)[][]) => commands.map(([op, key, value]) => {
    if (op !== 'INCRBYFLOAT') return 1
    const next = (counters.get(String(key)) ?? 0) + Number(value)
    counters.set(String(key), next)
    return String(next)
  })
  const budget = createSharedBudget(0.5, run)
  assert.equal(await budget.reserve(0.26, day), true)
  assert.equal(await budget.reserve(0.26, day), false)   // 0.52 > 0.5, rolled back
  await budget.settle(0.26, 0.01, day)                   // first request cost 0.01
  assert.equal(await budget.reserve(0.26, day), true)    // 0.01 + 0.26
  assert.ok(Math.abs([...counters.values()][0] - 0.27) < 1e-9)
})

test('shared budget falls back to the per-instance limit if storage fails', async () => {
  const { createSharedBudget } = await import('../lib/budget.ts')
  const budget = createSharedBudget(0.3, async () => { throw new Error('down') })
  assert.equal(await budget.reserve(0.26, day), true)
  assert.equal(await budget.reserve(0.26, day), false)
})
