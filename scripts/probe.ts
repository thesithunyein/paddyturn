import { intent, node, purchase, quoteForecast } from '../lib/telegraph.ts'

// Pathein, Ayeyarwady Region: a rice-milling town in the delta.
const location = process.env.PROBE_LOCATION || 'Pathein, Myanmar'
try {
  if (process.argv.includes('--buy')) {
    const result = await purchase(location, 3, 40)
    console.log(JSON.stringify(result, null, 2))
    if (result.weather === 'unknown') process.exitCode = 1
  } else if (process.argv.includes('--quote')) {
    console.log(JSON.stringify(await quoteForecast(location, 3), null, 2))
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
