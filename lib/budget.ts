// Daily spend guard for the shared workspace forecast endpoint. The per-request
// budget limits one call; this limits how much a leaked access code can spend
// in a UTC day. State is per server instance, so on serverless hosting it is a
// backstop, not an account-wide ledger: keep the Anjoman escrow balance small.

export function createBudget(limitUsd: number) {
  let day = ''
  let spent = 0
  const roll = (now: number) => {
    const today = new Date(now).toISOString().slice(0, 10)
    if (today !== day) { day = today; spent = 0 }
  }
  return {
    // Reserve the full request budget before calling, so concurrent calls
    // cannot overshoot the daily limit.
    reserve(amountUsd: number, now = Date.now()) {
      roll(now)
      if (!(amountUsd > 0) || spent + amountUsd > limitUsd + 1e-9) return false
      spent += amountUsd
      return true
    },
    // Replace the reservation with the observed cost. An unknown cost keeps
    // the full reservation, which errs on the side of spending less.
    settle(reservedUsd: number, actualUsd: number | undefined, now = Date.now()) {
      roll(now)
      if (typeof actualUsd === 'number' && Number.isFinite(actualUsd) && actualUsd >= 0 && actualUsd <= reservedUsd) {
        spent = Math.max(0, spent - reservedUsd + actualUsd)
      }
    },
    remaining(now = Date.now()) { roll(now); return Math.max(0, limitUsd - spent) },
  }
}

type Run = (commands: (string | number)[][]) => Promise<unknown[]>

// Account-wide daily budget shared by every server instance, using an atomic
// Redis counter per UTC day. Falls back to the per-instance budget when the
// store is unavailable, so forecasts never run without a limit.
export function createSharedBudget(limitUsd: number, run: Run | undefined, fallback = createBudget(limitUsd)) {
  const key = (now: number) => `pt:budget:${new Date(now).toISOString().slice(0, 10)}`
  return {
    async reserve(amountUsd: number, now = Date.now()) {
      if (!run) return fallback.reserve(amountUsd, now)
      try {
        const [total] = await run([['INCRBYFLOAT', key(now), amountUsd], ['EXPIRE', key(now), 172_800]])
        if (Number(total) <= limitUsd + 1e-9) return true
        await run([['INCRBYFLOAT', key(now), -amountUsd]])
        return false
      } catch { return fallback.reserve(amountUsd, now) }
    },
    async settle(reservedUsd: number, actualUsd: number | undefined, now = Date.now()) {
      if (!(typeof actualUsd === 'number' && Number.isFinite(actualUsd) && actualUsd >= 0 && actualUsd <= reservedUsd)) return
      if (!run) return fallback.settle(reservedUsd, actualUsd, now)
      try { await run([['INCRBYFLOAT', key(now), actualUsd - reservedUsd]]) } catch { /* keep the reservation */ }
    },
  }
}
