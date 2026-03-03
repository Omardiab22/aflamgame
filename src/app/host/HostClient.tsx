"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { AppShell } from "@/components/AppShell"

type Player = { id: string; name: string; score: number }
type GameState = {
  status: string
  phase: string
  current_question_index: number
  countdown_duration_sec?: number
  question_duration_sec?: number
  leaderboard_duration_sec?: number
}

export default function HostClient() {
  const router = useRouter()
  const [players, setPlayers] = useState<Player[]>([])
  const [gs, setGs] = useState<GameState | null>(null)

  const refreshData = async () => {
    const { data: gs0 } = await supabase
      .from("game_state")
      .select("status,phase,current_question_index,countdown_duration_sec,question_duration_sec,leaderboard_duration_sec")
      .eq("id", "global")
      .single()
    if (gs0) setGs(gs0)

    const { data: p0 } = await supabase
      .from("players")
      .select("id,name,score")
      .eq("is_active", true)
      .order("joined_at", { ascending: true })
    if (p0) setPlayers(p0)
  }

  useEffect(() => {
    refreshData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const post = async (path: string) => {
    const res = await fetch(path, { method: "POST", credentials: "include" })
    const j = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(j?.error ?? "Unauthorized")
    return j
  }

  const startGame = async () => {
    try {
      await post("/api/host/start")
      await refreshData()

      // ✅ Auto-begin بعد 5 ثواني (أو اللي في DB)
      const cd = gs?.countdown_duration_sec ?? 5
      setTimeout(async () => {
        try {
          await post("/api/host/begin")
          await refreshData()
        } catch {
          // ignore
        }
      }, cd * 1000)
    } catch (e: any) {
      alert(e.message ?? "Start failed")
      router.refresh()
    }
  }

  const closeQuestion = async () => {
    try {
      await post("/api/host/close")
      await refreshData()

      // ✅ Auto-next بعد 2 ثانية (مدة leaderboard)
      const lb = gs?.leaderboard_duration_sec ?? 2
      setTimeout(async () => {
        try {
          await post("/api/host/next")
          await refreshData()
        } catch {
          // ignore
        }
      }, lb * 1000)
    } catch (e: any) {
      alert(e.message ?? "Close failed")
      router.refresh()
    }
  }

  const nextQuestion = async () => {
    try {
      await post("/api/host/next")
      await refreshData()
    } catch (e: any) {
      alert(e.message ?? "Next failed")
      router.refresh()
    }
  }

  const cancelGame = async () => {
    try {
      await post("/api/host/cancel")
      await refreshData()
      // الناس هتتحول لوحدها للنتائج بسبب status=finished
    } catch (e: any) {
      alert(e.message ?? "Cancel failed")
      router.refresh()
    }
  }

  const logout = async () => {
    await fetch("/api/host/logout", { method: "POST", credentials: "include" })
    router.refresh()
  }

  return (
    <AppShell
      title="Host Panel"
      subtitle="تحكم كامل في اللعبة"
      right={
        <button
          className="px-3 py-1 text-xs rounded-full border"
          style={{ borderColor: "var(--stroke)", background: "var(--panel)" }}
          onClick={logout}
        >
          Logout
        </button>
      }
    >
      <div className="panel p-5">
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-primary" onClick={startGame}>
            Start Game
          </button>

          <button className="btn" onClick={closeQuestion}>
            Close Q → Leaderboard
          </button>

          <button className="btn" onClick={nextQuestion}>
            Next Question
          </button>

          <button className="btn" onClick={() => router.push("/lobby")}>
            View Lobby
          </button>

          <button className="btn" onClick={cancelGame} style={{ borderColor: "rgba(239,68,68,0.35)" }}>
            Cancel Game → Results
          </button>
        </div>

        <div className="mt-4 text-xs" style={{ color: "var(--muted)" }}>
          status: <b>{gs?.status ?? "…"}</b> — phase: <b>{gs?.phase ?? "…"}</b> — qIndex:{" "}
          <b>{gs?.current_question_index ?? "…"}</b>
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: "var(--muted)" }}>
              Players
            </span>
            <span className="text-xs" style={{ color: "var(--muted)" }}>
              {players.length} لاعب
            </span>
          </div>

          <div className="mt-3 grid gap-2">
            {players.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-2xl px-4 py-3"
                style={{ border: "1px solid var(--stroke)", background: "rgba(255,255,255,0.04)" }}
              >
                <span className="font-semibold">{p.name}</span>
                <span className="text-sm font-bold">{p.score}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  )
}