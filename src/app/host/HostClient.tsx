"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { AppShell } from "@/components/AppShell"
import { msLeft } from "@/lib/utils"

type Player = { id: string; name: string; score: number }
type GameState = {
  status: string
  phase: "lobby" | "countdown" | "question" | "leaderboard" | "finished"
  current_question_index: number
  phase_started_at: string | null
  countdown_duration_sec: number
  question_duration_sec: number
  leaderboard_duration_sec: number
}

export default function HostClient() {
  const router = useRouter()
  const [players, setPlayers] = useState<Player[]>([])
  const [gs, setGs] = useState<GameState | null>(null)
  const [now, setNow] = useState(Date.now())

  const busyRef = useRef(false)
  const lastActRef = useRef<string>("") // phase#index لمنع تكرار calls

  const tickTimer = useMemo(() => setInterval(() => setNow(Date.now())), [])

  useEffect(() => {
    return () => clearInterval(tickTimer)
  }, [tickTimer])

  const refreshData = async () => {
    const { data: gs0 } = await supabase
      .from("game_state")
      .select("status,phase,current_question_index,phase_started_at,countdown_duration_sec,question_duration_sec,leaderboard_duration_sec")
      .eq("id", "global")
      .single()
    if (gs0) setGs(gs0 as any)

    const { data: p0 } = await supabase
      .from("players")
      .select("id,name,score")
      .eq("is_active", true)
      .order("score", { ascending: false })
    if (p0) setPlayers(p0)
  }

  useEffect(() => {
    let chGs: any
    ;(async () => {
      await refreshData()

      chGs = supabase
        .channel("gs_watch_host")
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "game_state" }, (payload) => {
          // @ts-ignore
          setGs(payload.new)
        })
        .subscribe()
    })()

    return () => {
      if (chGs) supabase.removeChannel(chGs)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const post = async (path: string) => {
    const res = await fetch(path, { method: "POST", credentials: "include" })
    const j = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(j?.error ?? "Unauthorized")
    return j
  }

  // ✅ auto-advance engine
  useEffect(() => {
    if (!gs) return
    if (gs.status !== "running") return

    const dur =
      gs.phase === "countdown"
        ? gs.countdown_duration_sec
        : gs.phase === "question"
        ? gs.question_duration_sec
        : gs.phase === "leaderboard"
        ? gs.leaderboard_duration_sec
        : 0

    if (!dur) return

    const left = msLeft(gs.phase_started_at, dur)
    if (left > 0) return

    const key = `${gs.phase}#${gs.current_question_index}`
    if (lastActRef.current === key) return
    if (busyRef.current) return

    busyRef.current = true

    ;(async () => {
      try {
        if (gs.phase === "countdown") {
          await post("/api/host/begin")
        } else if (gs.phase === "question") {
          await post("/api/host/close")
        } else if (gs.phase === "leaderboard") {
          await post("/api/host/next")
        }
        lastActRef.current = key
      } catch (e: any) {
        // لو Unauthorized أو أي مشكلة
        alert(e?.message ?? "Auto advance failed")
        router.refresh()
      } finally {
        busyRef.current = false
      }
    })()
  }, [gs, now, router])

  const startGame = async () => {
    try {
      await post("/api/host/start")
      await refreshData()
    } catch (e: any) {
      alert(e.message ?? "Start failed")
      router.refresh()
    }
  }

  const cancelGame = async () => {
    try {
      await post("/api/host/cancel")
      await refreshData()
    } catch (e: any) {
      alert(e.message ?? "Cancel failed")
      router.refresh()
    }
  }

  const resetToLobby = async () => {
    try {
      await post("/api/host/reset")
      await refreshData()
    } catch (e: any) {
      alert(e.message ?? "Reset failed")
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
      subtitle="Start مرة واحدة والجيم هيجري لوحده"
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
          <button className="btn" onClick={cancelGame} style={{ borderColor: "rgba(239,68,68,0.35)" }}>
            Cancel → Results
          </button>
          <button className="btn" onClick={resetToLobby}>
            Reset → Lobby
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
            {players.map((p, i) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-2xl px-4 py-3"
                style={{ border: "1px solid var(--stroke)", background: "rgba(255,255,255,0.04)" }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="text-xs px-2 py-1 rounded-full"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid var(--stroke)" }}
                  >
                    #{i + 1}
                  </span>
                  <span className="font-semibold">{p.name}</span>
                </div>
                <span className="text-sm font-bold">{p.score}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  )
}