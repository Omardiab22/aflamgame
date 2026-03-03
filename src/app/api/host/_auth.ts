import { isHostAuthed } from "../../../../lib/hostAuth"

export function assertHost() {
  if (!isHostAuthed()) {
    return { ok: false as const, error: "Unauthorized" }
  }
  return { ok: true as const }
}