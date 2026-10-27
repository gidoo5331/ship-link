"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Menu, X } from "lucide-react"
import { Loading } from "@/components/load-state"
import { Sidebar } from "@/components/sidebar"
import { Topbar } from "@/components/topbar"
import { useAuth } from "@/lib/auth"

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.replace("/login")
  }, [loading, user, router])

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loading />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* mobile top bar */}
      <div className="flex items-center justify-between border-b px-4 py-2 md:hidden">
        <span className="truncate text-sm font-semibold">{user.company?.name ?? "ShipLink"}</span>
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-controls="portal-sidebar"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          className="flex size-10 items-center justify-center rounded-lg"
        >
          {menuOpen ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
        </button>
      </div>

      <aside
        id="portal-sidebar"
        className={`${menuOpen ? "block" : "hidden"} border-b bg-sidebar md:sticky md:top-0 md:block md:h-screen md:w-[248px] md:shrink-0 md:overflow-y-auto md:border-b-0 md:border-r`}
      >
        <Sidebar onNavigate={() => setMenuOpen(false)} />
      </aside>

      <main className="min-w-0 flex-1">
        <Topbar />
        {children}
      </main>
    </div>
  )
}
