import { windowPeak, type SignalRecord } from './signal.ts'

type Checked = {
  weather: 'dry' | 'rain' | 'unknown'; chance?: number; reason?: string
  evidence: { intent?: string; signalHash?: string }
}

// Cross-check a paid answer against Telegraph's public signal record.
// - Not yet published: keep the paid answer (provider's daily peak), mark pending.
// - Published but not verified, or for another intent: do not use the forecast.
// - Verified with hourly data covering the window: decide on the exact window.
export type CheckResult<T> = Omit<T, 'weather' | 'chance' | 'reason'> & {
  weather: 'dry' | 'rain' | 'unknown'; chance?: number; reason?: string
  record: 'none' | 'pending' | 'verified' | 'failed'; scope: 'window' | 'day'; dailyPeak?: number
}

export function applySignalCheck<T extends Checked>(forecast: T, record: SignalRecord | undefined,
  windowStart: number, hours: number, threshold: number): CheckResult<T> {
  if (!forecast.evidence.signalHash) return { ...forecast, record: 'none' as const, scope: 'day' as const }
  if (!record) return { ...forecast, record: 'pending' as const, scope: 'day' as const }
  if (!record.verified || (record.intent && forecast.evidence.intent && record.intent !== forecast.evidence.intent)) {
    return { ...forecast, weather: 'unknown' as const, record: 'failed' as const, scope: 'day' as const,
      reason: 'Telegraph’s public record did not verify this answer. Check conditions yourself.' }
  }
  const peak = forecast.weather === 'unknown' ? undefined : windowPeak(record.hours, windowStart, hours)
  if (!peak) return { ...forecast, record: 'verified' as const, scope: 'day' as const }
  return { ...forecast, record: 'verified' as const, scope: 'window' as const, dailyPeak: forecast.chance,
    chance: peak.chance, weather: peak.chance >= threshold ? 'rain' as const : 'dry' as const }
}
