"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AppShell } from "../../../../components/AppShell"

export default function HostLogin() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const login = async () => {
    setErr(null)
    setLoading(true)

    const res = await fetch("/api/host/login", {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username, password }),
    })

    const j = await res.json().catch(() => ({}))
    setLoading(false)

    if (!res.ok) return setErr(j?.error ?? "Login failed")

    // ✅ بعد ما الكوكي تتسجل، نعمل refresh للسيرفر component
    router.refresh()
  }

  return (
    <AppShell title="Host Login" subtitle="دخول الهوست فقط">
      <div className="panel p-5">
        <label className="text-sm" style={{ color: "var(--muted)" }}>
          Username
        </label>
        <input className="input mt-2" value={username} onChange={(e) => setUsername(e.target.value)} />

        <label className="text-sm mt-4 block" style={{ color: "var(--muted)" }}>
          Password
        </label>
        <input
          className="input mt-2"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {err ? <p className="mt-3 text-sm text-red-400">{err}</p> : null}

        <button className={`btn btn-primary mt-4 w-full ${loading ? "opacity-70" : ""}`} onClick={login} disabled={loading}>
          {loading ? "Signing in..." : "Login"}
        </button>
      </div>
    </AppShell>
  )
}