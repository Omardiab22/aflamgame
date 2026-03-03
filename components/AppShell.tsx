export function AppShell({
  title,
  subtitle,
  right,
  children,
}: {
  title: string
  subtitle?: string
  right?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <main className="min-h-dvh w-full flex justify-center px-4 py-6">
      <div className="w-full max-w-md">
        <header className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold leading-tight">{title}</h1>
            {subtitle ? (
              <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                {subtitle}
              </p>
            ) : null}
          </div>
          {right}
        </header>

        <section className="mt-5">{children}</section>

        <footer className="mt-8 text-center text-xs" style={{ color: "var(--muted)" }}>
          Aflam Game
        </footer>
      </div>
    </main>
  )
}