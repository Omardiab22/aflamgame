export function shuffle<T>(arr: T[]) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function msLeft(startedAtIso: string | null, durationSec: number) {
  if (!startedAtIso) return durationSec * 1000
  const started = new Date(startedAtIso).getTime()
  const now = Date.now()
  return Math.max(0, durationSec * 1000 - (now - started))
}