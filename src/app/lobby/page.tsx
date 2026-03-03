"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../../lib/supabaseClient"
import { AppShell } from "../../../components/AppShell"

type Player = { id: string; name: string; score: number; last_seen_at: string }
type GameState = {
  status: string
  phase: string
  current_question_index: number
  phase_started_at: string | null
  question_duration_sec: number
  leaderboard_duration_sec: number
}

function sinceIso(ms: number) {
  return new Date(Date.now() - ms).toISOString()
}

export default function LobbyPage() {
  const router = useRouter()
  const [players, setPlayers] = useState<Player[]>([])
  const [gs, setGs] = useState<GameState | null>(null)

  const myId = useMemo(
    () => (typeof window !== "undefined" ? localStorage.getItem("player_id") : null),
    []
  )

  useEffect(() => {
    if (!myId) router.replace("/")
  }, [myId, router])

  const fetchPlayers = async () => {
    // Show only people "online" in last 30 seconds
    const since = sinceIso(30_000)
    const { data } = await supabase
      .from("players")
      .select("id,name,score,last_seen_at")
      .gte("last_seen_at", since)
      .order("score", { ascending: false })

    if (data) setPlayers(data as Player[])
  }

  useEffect(() => {
    let chPlayers: any, chGs: any

    ;(async () => {
      const { data: gs0 } = await supabase
        .from("game_state")
        .select("*")
        .eq("id", "global")
        .single()
      if (gs0) setGs(gs0 as any)

      await fetchPlayers()

      // Players realtime refresh
      chPlayers = supabase
        .channel("players_watch_lobby")
        .on("postgres_changes", { event: "*", schema: "public", table: "players" }, async () => {
          await fetchPlayers()
        })
        .subscribe()

      // Game state realtime
      chGs = supabase
        .channel("gs_watch_lobby")
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "game_state" }, (payload) => {
          // @ts-ignore
          setGs(payload.new)
        })
        .subscribe()
    })()

    return () => {
      if (chPlayers) supabase.removeChannel(chPlayers)
      if (chGs) supabase.removeChannel(chGs)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Heartbeat + leave
  useEffect(() => {
    if (!myId) return

    const tick = async () => {
      await supabase
        .from("players")
        .update({ last_seen_at: new Date().toISOString(), is_active: true })
        .eq("id", myId)
    }

    tick()
    const i = setInterval(tick, 10_000) // كل 10 ثواني

    const leave = () => {
      const payload = JSON.stringify({ playerId: myId })

      // Best-effort beacon
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/player/leave", new Blob([payload], { type: "application/json" }))
      } else {
        // fallback (keepalive)
        fetch("/api/player/leave", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch(() => {})
      }
    }

    window.addEventListener("beforeunload", leave)

    return () => {
      clearInterval(i)
      window.removeEventListener("beforeunload", leave)
    }
  }, [myId])

  useEffect(() => {
    if (gs?.status === "running") router.replace("/play")
    if (gs?.status === "finished") router.replace("/results")
  }, [gs?.status, router])

  return (
    <AppShell
      title="اللوبي"
      subtitle="استنى الهوست يبدأ…"
      right={
        <span
          className="px-3 py-1 text-xs rounded-full border"
          style={{ borderColor: "var(--stroke)", background: "var(--panel)" }}
        >
          {players.length} لاعب
        </span>
      }
    >
      <div className="panel p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm" style={{ color: "var(--muted)" }}>
            Players
          </span>
          <span className="text-xs" style={{ color: "var(--muted)" }}>
            status: {gs?.status ?? "…"}
          </span>
        </div>

        <div className="mt-4 grid gap-2">
          {players.slice(0, 30).map((p, idx) => (
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
                  #{idx + 1}
                </span>
                <span className="font-semibold">{p.name}</span>
                {p.id === myId ? (
                  <span className="text-xs" style={{ color: "var(--muted)" }}>
                    (أنت)
                  </span>
                ) : null}
              </div>
              <span className="text-sm font-bold">{p.score}</span>
            </div>
          ))}
        </div>

        <p className="mt-4 text-xs" style={{ color: "var(--muted)" }}>
          أول ما الهوست يضغط Start هتدخل على اللعب تلقائيًا. (اللي يقفل الموقع بيختفي بعد ثواني)
        </p>
      </div>
    </AppShell>
  )
}