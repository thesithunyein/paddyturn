// Telegraph's WEATHER_FORECAST_GENERAL intent (response format v4) returns
// `location`, `when`, `temp_max_c`, `temp_min_c`, `precipitation_probability_pct`
// (peak chance of precipitation over the window) and `condition`. It does not
// return hourly rainfall amounts, so the drying decision is made on the peak
// rain chance against an operator-set limit.

type FieldStatus = Record<string, unknown> | undefined

export type RainCheck = { weather: 'dry' | 'rain'; chance: number; condition?: string; when?: string; location?: string }

export function classifyRainChance(result: unknown, fieldStatus: FieldStatus, limitPct: number): RainCheck {
  if (!Number.isFinite(limitPct) || limitPct < 1 || limitPct > 100) throw new Error('Rain chance limit must be 1 to 100%.')
  if (!result || typeof result !== 'object') throw new Error('Forecast returned no structured result.')
  const data = result as Record<string, unknown>
  // When the node shaped the answer, it reports per-field status. Anything
  // other than `ok` means the value was missing, rejected or unparsed.
  const status = fieldStatus?.precipitation_probability_pct
  if (fieldStatus && status !== 'ok') throw new Error('Forecast rain chance was not verified by the node.')
  const chance = data.precipitation_probability_pct
  if (typeof chance !== 'number' || !Number.isFinite(chance) || chance < 0 || chance > 100) {
    throw new Error('Forecast lacks a valid rain chance.')
  }
  const text = (value: unknown) => typeof value === 'string' && value.trim() ? value.trim().slice(0, 160) : undefined
  return { weather: chance >= limitPct ? 'rain' : 'dry', chance,
    condition: text(data.condition), when: text(data.when), location: text(data.location) }
}

export function validLocation(value: unknown): value is string {
  // The intent accepts a city or place name (max 256 bytes on-chain).
  return typeof value === 'string' && value.trim().length >= 2 && Buffer.byteLength(value) <= 120
    && !/[\u0000-\u001f\u007f]/.test(value)
}
