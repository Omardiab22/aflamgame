import { isHostAuthed } from "@/lib/hostAuth"

export async function assertHost() {
  const ok = await isHostAuthed()
  if (!ok) return { ok: false as const, error: "Unauthorized" }
  return { ok: true as const }
}