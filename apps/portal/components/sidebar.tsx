"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Briefcase,
  CreditCard,
  FileText,
  Inbox,
  LayoutGrid,
  Lock,
  LogOut,
  MapPin,
  Package,
  Settings,
  ShieldCheck,
  Tag,
  Users,
  type LucideIcon,
} from "lucide-react"
import { useAuth } from "@/lib/auth"
import { initials, websiteHost } from "@/lib/format"
import { cn } from "@/lib/utils"

type NavItem = { label: string; href: string; icon: LucideIcon; soon?: boolean }

// `soon` items are planned but not built yet (see docs/plans)
const NAV: { label: string; items: NavItem[] }[] = [
  { label: "Overview", items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutGrid }] },
  {
    label: "Operations",
    items: [
      { label: "Leads", href: "/leads", icon: Inbox, soon: true },
      { label: "Shipments", href: "/shipments", icon: Package, soon: true },
      { label: "Verifications", href: "/verifications", icon: ShieldCheck, soon: true },
      { label: "Payments", href: "/payments", icon: CreditCard, soon: true },
      { label: "Contracts", href: "/contracts", icon: FileText, soon: true },
    ],
  },
  { label: "Catalog", items: [{ label: "Products", href: "/products", icon: Tag }] },
  {
    label: "People",
    items: [
      { label: "Customers", href: "/customers", icon: Users, soon: true },
      { label: "Agents", href: "/agents", icon: MapPin, soon: true },
    ],
  },
  {
    label: "Company",
    items: [
      { label: "Staff", href: "/staff", icon: Briefcase, soon: true },
      { label: "Roles & permissions", href: "/roles", icon: Lock, soon: true },
      { label: "Settings", href: "/settings", icon: Settings, soon: true },
    ],
  },
]

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Platform admin",
  COMPANY_ADMIN: "Company admin",
  COMPANY_STAFF: "Staff",
  AGENT: "Agent",
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const userInitials = user ? initials(`${user.firstName} ${user.lastName}`) : ""
  const company = user?.company

  return (
    <div className="flex min-h-full flex-col gap-5 px-3 pb-5 pt-4">
      <div className="flex items-center gap-2.5 px-2 py-1.5">
        <span
          aria-hidden
          className="flex size-[34px] shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary text-[13px] font-semibold text-primary-foreground"
        >
          {company?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- company logo from storage
            <img src={company.logoUrl} alt="" className="size-full object-cover" />
          ) : company ? (
            initials(company.name)
          ) : (
            <Package className="size-4" />
          )}
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-semibold">{company?.name ?? "ShipLink"}</span>
          {company && <span className="truncate text-xs text-muted-foreground">{websiteHost(company.subdomain)}</span>}
        </div>
      </div>

      <nav aria-label="Portal" className="flex flex-col gap-4">
        {NAV.map((group) => (
          <div key={group.label} className="flex flex-col gap-0.5">
            <span className="px-2.5 pb-1.5 text-xs font-medium text-muted-foreground">{group.label}</span>
            {group.items.map((item) => {
              const active = !item.soon && pathname.startsWith(item.href)
              const Icon = item.icon
              const content = (
                <>
                  <Icon className="size-4" aria-hidden />
                  <span className="flex-1">{item.label}</span>
                  {item.soon && (
                    <span className="rounded-full border bg-background px-1.5 py-px text-[11px] font-medium text-neutral-600">
                      Soon
                    </span>
                  )}
                </>
              )
              const base = "flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm"
              return item.soon ? (
                <span key={item.href} aria-disabled="true" className={cn(base, "text-muted-foreground")}>
                  {content}
                </span>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    base,
                    active
                      ? "bg-background font-medium text-foreground shadow-[0_0_0_1px_var(--border)]"
                      : "text-neutral-700 hover:bg-background/70",
                  )}
                >
                  {content}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="mt-auto flex items-center gap-2.5 border-t px-2 pt-3">
        <span
          aria-hidden
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold"
        >
          {userInitials}
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-medium">
            {user?.firstName} {user?.lastName}
          </span>
          <span className="text-xs text-muted-foreground">{user ? ROLE_LABELS[user.systemRole] : ""}</span>
        </div>
        <button
          type="button"
          onClick={logout}
          aria-label="Sign out"
          className="flex size-9 items-center justify-center rounded-lg text-neutral-700 hover:bg-background"
        >
          <LogOut className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  )
}
