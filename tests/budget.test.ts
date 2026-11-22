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
