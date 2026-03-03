"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../../lib/supabaseClient"
import { AppShell } from "@/components/AppShell"

type Player = { id: string; name: string; score: number }
type GameState = { status: string; phase: string; current_question_index: number }

export default function HostClient() {
  const router = useRouter()
  const [players, setPlayers] = useState<Player[]>([])
  const [gs, setGs] = useState<GameState | null>(null)

  const refreshData = async () => {
    const { data: gs0 } = await supabase
      .from("game_state")
      .select("status,phase,current_question_index")
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

  const call = async (path: string) => {
    const res = await fetch(path, { method: "POST", credentials: "include" })
    const j = await res.json().catch(() => ({}))

    if (!res.ok) {
      alert(j?.error ?? "Unauthorized")
      // لو الكوكي راحت/انتهت، رجّع للّوجين
      router.refresh()
      return
    }

    await refreshData()
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
          <button className="btn btn-primary" onClick={() => call("/api/host/start")}>
            Start Game
          </button>
          <button className="btn" onClick={() => call("/api/host/close")}>
            Close Q → Leaderboard
          </button>
          <button className="btn" onClick={() => call("/api/host/next")}>
            Next Question
          </button>
          <button className="btn" onClick={() => router.push("/lobby")}>
            View Lobby
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