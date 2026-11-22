import { timingSafeEqual } from 'node:crypto'
import { createBudget } from '../../../lib/budget'
import { requestBudgetUsd, requestForecast, routedCapUsd } from '../../../lib/engine'
import { validLocation } from '../../../lib/forecast'

export const maxDuration = 60

const dailyLimit = Number(process.env.TELEGRAPH_DAILY_BUDGET_USD || '1')
const budget = createBudget(Number.isFinite(dailyLimit) && dailyLimit > 0 && dailyLimit <= 20 ? dailyLimit : 1)

function authorized(request: Request) {
  const expected = process.env.LOCAL_FORECAST_TOKEN || ''
  const provided = request.headers.get('x-paddyturn-token') || ''
  return Buffer.byteLength(expected) >= 24 && Buffer.byteLength(expected) === Buffer.byteLength(provided)
    && timingSafeEqual(Buffer.from(expected), Buffer.from(provided))
}

export async function POST(request: Request) {
  if (!authorized(request)) return Response.json({ reason: 'The forecast access code is not valid.' }, { status: 403 })
  let body: { location?: unknown; hours?: unknown; threshold?: unknown }
  try { body = await request.json() } catch { return Response.json({ reason: 'Invalid request.' }, { status: 400 }) }
  const { location, hours, threshold } = body
  if (!validLocation(location) || !Number.isInteger(hours) || (hours as number) < 1 || (hours as number) > 6
    || !Number.isInteger(threshold) || (threshold as number) < 1 || (threshold as number) > 100) {
    return Response.json({ reason: 'Check the location, drying window and rain chance limit.' }, { status: 400 })
  }
  const requestBudget = requestBudgetUsd()
  // Anjoman may spend up to its routed cap, so reserve that, then settle.
  if (!budget.reserve(routedCapUsd)) {
    return Response.json({ reason: 'Today’s forecast budget is used up. Enter outdoor conditions manually.' }, { status: 429 })
  }
  const windowStart = Date.now()
  try {
    // The paid cost is verified against Anjoman's routed cap, which is what
    // the account can actually be charged for one ask.
    const forecast = await requestForecast(location, hours as number, threshold as number, Math.max(requestBudget, routedCapUsd))
    budget.settle(routedCapUsd, forecast.evidence.cost)
    return Response.json({ ...forecast, location: ('location' in forecast && forecast.location) || location.trim(), windowStart, threshold, validUntil: windowStart + (hours as number) * 3_600_000 })
  } catch (error) {
    // Engine errors before a paid call are documented as not charged; a
    // timeout may still have been charged, so the reservation is kept.
    const reason = error instanceof Error ? error.message : 'Forecast request failed.'
    return Response.json({ reason }, { status: 503 })
  }
}
