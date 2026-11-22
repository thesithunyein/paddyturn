import { test } from 'node:test'
import assert from 'node:assert/strict'
import { validWorkspace } from '../lib/workspace.ts'
import { millId, validMillCode } from '../lib/store.ts'

const batch = { key: 'k1', id: 'TEST-01', arrival: '08:00', moisture: 25, outdoor: true }

test('accepts the workspace shape the app writes, rejects anything else', () => {
  assert.equal(validWorkspace({ batches: [batch], history: [{ batch, at: '2026-11-22T15:00:00Z' }], priority: 'moisture', weather: 'unknown' }), true)
  assert.equal(validWorkspace({ batches: [{ ...batch, moisture: '25' }], history: [], priority: 'moisture', weather: 'unknown' }), false)
  assert.equal(validWorkspace({ batches: [], history: [], priority: 'other', weather: 'unknown' }), false)
  assert.equal(validWorkspace({ batches: Array(201).fill(batch), history: [], priority: 'moisture', weather: 'dry' }), false)
  assert.equal(validWorkspace(null), false)
})

test('mill codes are long enough and only their hash is used as the key', () => {
  assert.equal(validMillCode('pathein-mill-1'), true)
  assert.equal(validMillCode('short'), false)
  assert.equal(validMillCode('has space in it'), false)
  assert.equal(millId('pathein-mill-1'), millId('pathein-mill-1'))
  assert.notEqual(millId('pathein-mill-1'), millId('pathein-mill-2'))
  assert.equal(millId('pathein-mill-1').includes('pathein'), false)
})
