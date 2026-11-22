import { test } from 'node:test'
import assert from 'node:assert/strict'
import { messages, translate } from '../lib/messages.ts'

test('Burmese has every English key, and no extra or empty ones', () => {
  const en = Object.keys(messages.en).sort(), my = Object.keys(messages.my).sort()
  assert.deepEqual(my, en)
  for (const [key, value] of Object.entries(messages.my)) assert.ok(value.trim(), `empty: ${key}`)
})

test('placeholders match between languages and are filled in', () => {
  const vars = (text: string) => (text.match(/\{\w+\}/g) ?? []).sort().join()
  for (const key of Object.keys(messages.en) as (keyof typeof messages.en)[]) {
    assert.equal(vars(messages.my[key]), vars(messages.en[key]), key)
  }
  assert.equal(translate('en', 'app.assigned', { id: 'PT-1' }), 'PT-1 assigned to the dryer.')
  assert.equal(translate('my', 'ev.dry', { t: 40 }), '40% အောက်။ အပြင်လှန်းရန် စိတ်ချရသည်။')
})
