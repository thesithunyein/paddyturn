import { timingSafeEqual } from 'node:crypto'
import { purchase } from '../../../lib/telegraph'

export async function POST(request: Request) {
  const expected = process.env.LOCAL_FORECAST_TOKEN
  const provided = request.headers.get('x-paddyturn-token') || ''
  if (!expected || Buffer.byteLength(expected) < 24 || Buffer.byteLength(expected) !== Buffer.byteLength(provided)
    || !timingSafeEqual(Buffer.from(expected), Buffer.from(provided))) {
    return Response.json({ reason: 'Live mode requires the local access token.' }, { status: 403 })
  }
  try {
    const { latitude, longitude, hours, threshold } = await request.json()
    if (!Number.isFinite(latitude) || Math.abs(latitude) > 90 || !Number.isFinite(longitude) || Math.abs(longitude) > 180
      || !Number.isInteger(hours) || hours < 1 || hours > 6 || !Number.isFinite(threshold) || threshold <= 0 || threshold > 10) {
      return Response.json({ reason: 'Check the coordinates and drying-window settings.' }, { status: 400 })
    }
    const start = Math.floor(Date.now() / 3600000) * 3600000
    return Response.json(await purchase(latitude, longitude, start, hours, threshold))
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Forecast request failed.'
    return Response.json({ reason }, { status: 503 })
  }
}
