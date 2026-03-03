export function shuffle<T>(arr: T[]) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function toMs(ts: string | Date | null | undefined) {
  if (!ts) return null
  if (ts instanceof Date) return ts.getTime()
  const t = new Date(ts).getTime()
  return Number.isFinite(t) ? t : null
}

export function msLeft(phaseStartedAt: string | Date | null, durationSec: number) {
  const started = toMs(phaseStartedAt)
  if (!started) return durationSec * 1000
  const now = Date.now()
  return Math.max(0, durationSec * 1000 - (now - started))
}