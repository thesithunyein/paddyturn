export function classifyForecast(hours: unknown, start: number, count: number, threshold: number) {
  if (!Array.isArray(hours)) throw new Error('Missing hourly precipitation data.')
  const expected = Array.from({ length: count }, (_, i) => start + i * 3600000)
  const rain = expected.map(time => {
    const matches = hours.filter(hour => hour && typeof hour.time === 'string'
      && /(?:Z|[+-]\d\d:\d\d)$/i.test(hour.time) && Date.parse(hour.time) === time)
    const value = matches[0]?.precipitation_mm
    if (matches.length !== 1 || typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
      throw new Error('Forecast lacks a complete, unambiguous drying window.')
    }
    return value
  })
  return { weather: rain.some(value => value >= threshold) ? 'rain' as const : 'dry' as const, rain }
}

export function classifyWindow(result: Record<string, unknown> | undefined, start: number, count: number, threshold: number) {
  // An exact zero total bounds every hourly amount, provided the source
  // explicitly covers the whole window. A free-text window is insufficient.
  const windowStart = result?.start_time
  const windowEnd = result?.end_time
  if (result?.total_precipitation_mm === 0 && typeof windowStart === 'string' && typeof windowEnd === 'string'
    && /(?:Z|[+-]\d\d:\d\d)$/i.test(windowStart) && /(?:Z|[+-]\d\d:\d\d)$/i.test(windowEnd)
    && Date.parse(windowStart) === start && Date.parse(windowEnd) === start + count * 3_600_000) {
    return { weather: 'dry' as const, rain: [], peak: 0 }
  }
  const peak = result?.hourly_max_precipitation_mm ?? result?.max_precipitation_mm
  const timestamp = result?.start_time
  const normalized = typeof timestamp === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/.test(timestamp)
    ? timestamp + 'Z' : timestamp
  if (typeof normalized !== 'string' || Date.parse(normalized) !== start || result?.hourly_count !== count
    || typeof peak !== 'number' || !Number.isFinite(peak) || peak < 0) {
    throw new Error('Forecast did not verify the requested UTC window and peak hourly precipitation.')
  }
  return { weather: peak >= threshold ? 'rain' as const : 'dry' as const, rain: [], peak }
}
