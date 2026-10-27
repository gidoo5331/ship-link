"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { Suspense, useEffect, useState } from "react"
import {
  Briefcase,
  ChevronDown,
  // CreditCard, // for the commented-out "soon" items
  // FileText, // for the commented-out "soon" items
  Inbox,
  LayoutGrid,
  ListTree,
  Lock,
  LogOut,
  // MapPin, // for the commented-out "soon" items
  Package,
  Settings,
  // ShieldCheck, // for the commented-out "soon" items
  Tag,
  Users,
  type LucideIcon,
} from "lucide-react"
import { CATEGORIES_CHANGED } from "@/components/products/categories-manager"
import { api } from "@/lib/api"
import { companyPath, useAuth } from "@/lib/auth"
import { initials, websiteHost } from "@/lib/format"
import type { Category } from "@/lib/types"
import { cn } from "@/lib/utils"

// `products` opens to list the company's categories (see ProductsNav)
type NavItem = { label: string; href: string; icon: LucideIcon; soon?: boolean; products?: boolean }

const isCategoriesPage = (p: string) => p.startsWith("/products/categories")

// `soon` items are planned but not built yet (see docs/plans). They're
// commented out to keep the menu short; uncomment one to show it with a "Soon" badge.
const NAV: { label: string; items: NavItem[] }[] = [
  { label: "Overview", items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutGrid }] },
  {
    label: "Operations",
    items: [
      { label: "Leads", href: "/leads", icon: Inbox },
      // { label: "Shipments", href: "/shipments", icon: Package, soon: true },
      // { label: "Verifications", href: "/verifications", icon: ShieldCheck, soon: true },
      // { label: "Payments", href: "/payments", icon: CreditCard, soon: true },
      // { label: "Contracts", href: "/contracts", icon: FileText, soon: true },
    ],
  },
  {
    label: "Catalog",
    items: [
      { label: "Products", href: "/products", icon: Tag, products: true },
      { label: "Categories", href: "/products/categories", icon: ListTree },
    ],
  },
  {
    label: "People",
    items: [
      { label: "Customers", href: "/customers", icon: Users },
      // { label: "Agents", href: "/agents", icon: MapPin, soon: true },
    ],
  },
  {
    label: "Company",
    items: [
      { label: "Staff", href: "/staff", icon: Briefcase },
      { label: "Roles & permissions", href: "/roles", icon: Lock },
      { label: "Settings", href: "/settings", icon: Settings },
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
              if (item.products) {
                // ProductsNav reads ?category=, which needs a Suspense boundary
                return (
                  <Suspense key={item.href} fallback={<span className={cn(base, "text-neutral-700")}>{content}</span>}>
                    <ProductsNav item={item} pathname={pathname} onNavigate={onNavigate} />
                  </Suspense>
                )
              }
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

// Products, opening to "All products" plus a link per category. It opens by
// itself on product pages and can be toggled anywhere with the chevron.
function ProductsNav({ item, pathname, onNavigate }: { item: NavItem; pathname: string; onNavigate?: () => void }) {
  const { user } = useAuth()
  const category = useSearchParams().get("category")
  const inside = pathname.startsWith("/products") && !isCategoriesPage(pathname)
  const [toggled, setToggled] = useState<boolean | null>(null) // null = follow the current page
  const [categories, setCategories] = useState<Category[]>([])
  const open = toggled ?? inside
  const Icon = item.icon

  // refetched on navigation (product counts change as products are added or
  // deleted) and when the categories page edits them
  useEffect(() => {
    if (!user?.companyId) return
    const load = () =>
      api<Category[]>("GET", companyPath(user, "/categories"))
        .then(setCategories)
        .catch(() => {}) // the links are a shortcut; the Products page still has its tabs
    load()
    window.addEventListener(CATEGORIES_CHANGED, load)
    return () => window.removeEventListener(CATEGORIES_CHANGED, load)
  }, [user, pathname])

  const links = [
    // a product's own pages (new, edit) count as "All products"
    { key: "all", label: "All products", href: "/products", active: inside && !category, count: undefined as number | undefined },
    ...categories.map((c) => ({
      key: c.id,
      label: c.name,
      href: `/products?category=${c.id}`,
      active: pathname === "/products" && category === c.id,
      count: c.productCount,
    })),
  ]

  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-0.5">
        <Link
          href={item.href}
          onClick={() => {
            setToggled(null)
            onNavigate?.()
          }}
          className={cn(
            "flex h-9 flex-1 items-center gap-2.5 rounded-lg px-2.5 text-sm",
            inside ? "font-medium text-foreground" : "text-neutral-700 hover:bg-background/70",
          )}
        >
          <Icon className="size-4" aria-hidden />
          <span className="flex-1">{item.label}</span>
        </Link>
        <button
          type="button"
          onClick={() => setToggled(!open)}
          aria-expanded={open}
          aria-controls="nav-products"
          aria-label={`${open ? "Hide" : "Show"} product categories`}
          className="flex size-9 shrink-0 items-center justify-center rounded-lg text-neutral-700 hover:bg-background/70"
        >
          <ChevronDown className={cn("size-4 transition-transform motion-reduce:transition-none", open && "rotate-180")} aria-hidden />
        </button>
      </div>
      {open && (
        <ul id="nav-products" className="ml-[18px] flex flex-col gap-0.5 border-l pl-2.5">
          {links.map((link) => (
            <li key={link.key}>
              <Link
                href={link.href}
                onClick={onNavigate}
                aria-current={link.active ? "page" : undefined}
                className={cn(
                  "flex h-9 items-center gap-2 rounded-lg px-2.5 text-sm",
                  link.active
                    ? "bg-background font-medium text-foreground shadow-[0_0_0_1px_var(--border)]"
                    : "text-neutral-700 hover:bg-background/70",
                )}
              >
                <span className="min-w-0 flex-1 truncate">{link.label}</span>
                {link.count !== undefined && (
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {link.count}
                    <span className="sr-only"> products</span>
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
