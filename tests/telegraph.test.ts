import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readSepoliaQuote } from '../lib/telegraph.ts'

const header = (accepts: unknown[]) => Buffer.from(JSON.stringify({ accepts })).toString('base64')
const exact = { scheme: 'exact', network: 'eip155:11155111',
  asset: '0xcc194e1a843B658526D0D5C431f670028582Ae17', amount: '10000' }

test('quote selects the Sepolia test asset and skips the escrow option', () => {
  const quote = readSepoliaQuote(header([{ ...exact, scheme: 'escrow' }, exact]))
  assert.equal(quote.amountMicroUsdc, '10000')
})

test('quote rejects missing, wrong-network and malformed payment requirements', () => {
  assert.throws(() => readSepoliaQuote(null))
  assert.throws(() => readSepoliaQuote(header([{ ...exact, network: 'eip155:1' }])))
  assert.throws(() => readSepoliaQuote(header([{ ...exact, amount: '-1' }])))
})
