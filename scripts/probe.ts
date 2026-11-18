import { intent, node, purchase } from '../lib/telegraph.ts'

const latitude = 16.78
const longitude = 94.73
try {
  if (process.argv.includes('--buy')) {
    const start = Math.floor(Date.now() / 3600000) * 3600000
    const result = await purchase(latitude, longitude, start, 3, 0.2)
    console.log(JSON.stringify(result, null, 2))
    if (result.weather === 'unknown') process.exitCode = 1
  } else {
    const response = await fetch(node + '/api/miners?intent=' + encodeURIComponent(intent) + '&limit=5', {
      signal: AbortSignal.timeout(12000),
    })
    if (!response.ok) throw new Error('Miner discovery returned HTTP ' + response.status)
    console.log(JSON.stringify(await response.json(), null, 2))
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Forecast probe failed.')
  process.exitCode = 1
}
