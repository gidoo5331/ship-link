"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { AlertTriangle, CheckCircle2, Globe, ImageOff, Inbox, Package, Plus, type LucideIcon } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { Badge, Card } from "@/components/form"
import { ProductStatusBadge } from "@/components/products/status"
import { api } from "@/lib/api"
import { companyPath, useAuth } from "@/lib/auth"
import type { Paginated, Product } from "@/lib/types"
import { SAMPLE, STAGES } from "@/lib/sample-data"
import { cn } from "@/lib/utils"

type CatalogStats = {
  total: number
  live: number
  drafts: Product[]
  recent: Product[]
}

const STAGE_BAR = { neutral: "bg-neutral-400", blue: "bg-blue-600", amber: "bg-amber-600", green: "bg-green-600" }

function greeting() {
  const hour = new Date().getHours()
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<CatalogStats | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    const path = (q: string) => companyPath(user, `/products?${q}`)
    Promise.all([
      api<Paginated<Product>>("GET", path("pageSize=6")),
      api<Paginated<Product>>("GET", path("status=PUBLISHED&availability=AVAILABLE&pageSize=1")),
      api<Paginated<Product>>("GET", path("status=PUBLISHED&availability=ON_REQUEST&pageSize=1")),
      api<Paginated<Product>>("GET", path("status=DRAFT&pageSize=100")),
    ])
      .then(([recent, available, onRequest, drafts]) =>
        setStats({
          total: recent.total,
          live: available.total + onRequest.total,
          drafts: drafts.items,
          recent: recent.items,
        }),
      )
      .catch(() => setError(true))
  }, [user])

  const ready = stats?.drafts.filter((p) => p.publishChecklist.length === 0) ?? []
  const noPhotos = stats?.drafts.filter((p) => p.publishChecklist.includes("photo")) ?? []

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 p-6 md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {greeting()}, {user?.firstName}
          </h1>
          <p className="text-sm text-muted-foreground">Here&apos;s what&apos;s happening at {user?.company?.name ?? "your company"}.</p>
        </div>
        <Link href="/products/new" className={cn(buttonVariants({ size: "lg" }), "h-10 px-4")}>
          <Plus aria-hidden />
          Add product
        </Link>
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          Couldn&apos;t load your catalog numbers. Refresh to try again.
        </p>
      )}

      <section aria-label="Key numbers" className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
        <Stat
          label="Live on your website"
          icon={Globe}
          value={stats ? String(stats.live) : "–"}
          sub={stats ? `of ${stats.total} product${stats.total === 1 ? "" : "s"}` : "Loading…"}
          href="/products"
        />
        <Stat
          label="Drafts"
          icon={Package}
          value={stats ? String(stats.drafts.length) : "–"}
          sub={stats ? `${ready.length} ready to publish` : "Loading…"}
          href="/products"
        />
        <Stat label="New leads" icon={Inbox} value={String(SAMPLE.newLeads)} sub={`${SAMPLE.leadsToday} today, from your website`} sample />
        <Stat label="Open shipments" icon={Package} value={String(SAMPLE.openShipments)} sub="Requested to ready for pickup" sample />
      </section>

      <div className="flex flex-wrap items-start gap-6">
        <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-6">
          <Card aria-labelledby="catalog-h" className="flex flex-col gap-1 p-0">
            <div className="flex items-center justify-between gap-2 px-5 pb-2 pt-4">
              <h2 id="catalog-h" className="text-base font-semibold">
                Recently updated products
              </h2>
              <Link href="/products" className="text-sm font-medium underline-offset-4 hover:underline">
                All products
              </Link>
            </div>
            {stats === null ? (
              <p className="px-5 pb-5 text-sm text-muted-foreground" role="status">
                Loading…
              </p>
            ) : stats.recent.length === 0 ? (
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 pb-5">
                <p className="text-sm text-muted-foreground">No products yet. Add one and publish it to your website.</p>
                <Link href="/products/new" className={buttonVariants({ variant: "outline" })}>
                  Add product
                </Link>
              </div>
            ) : (
              <ul>
                {stats.recent.map((p) => (
                  <li key={p.id} className="border-t">
                    <Link href={`/products/${p.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/50">
                      <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted text-muted-foreground">
                        {p.images[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element -- storage thumbnail
                          <img src={p.images[0].url} alt="" className="size-full object-cover" />
                        ) : (
                          <ImageOff className="size-4" aria-hidden />
                        )}
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-sm font-medium">{p.name}</span>
                        <span className="text-xs text-muted-foreground">{p.category?.name ?? "Uncategorised"}</span>
                      </span>
                      <ProductStatusBadge product={p} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card aria-labelledby="pipeline-h" className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 id="pipeline-h" className="text-base font-semibold">
                Shipment pipeline
              </h2>
              <SampleTag />
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-5">
              {STAGES.map((s) => (
                <div key={s.key} className="flex min-w-0 flex-col gap-1.5">
                  <span aria-hidden className={cn("h-1 rounded-full", STAGE_BAR[s.tone])} />
                  <span className="truncate text-xs text-muted-foreground">{s.label}</span>
                  <span className="text-xl font-semibold tabular-nums">{SAMPLE.stageCounts[s.key]}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card aria-labelledby="requests-h" className="flex flex-col p-0">
            <div className="flex flex-wrap items-center justify-between gap-2 px-5 pb-3 pt-4">
              <h2 id="requests-h" className="text-base font-semibold">
                Recent shipment requests
              </h2>
              <SampleTag />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-y text-left text-[13px] text-muted-foreground">
                    <th scope="col" className="px-5 py-2.5 font-medium">Request</th>
                    <th scope="col" className="px-5 py-2.5 font-medium">Customer</th>
                    <th scope="col" className="px-5 py-2.5 font-medium">Product</th>
                    <th scope="col" className="px-5 py-2.5 font-medium">Status</th>
                    <th scope="col" className="px-5 py-2.5 text-right font-medium">Est. cost</th>
                  </tr>
                </thead>
                <tbody>
                  {SAMPLE.recentRequests.map((r) => {
                    const stage = STAGES.find((s) => s.key === r.stage)!
                    return (
                      <tr key={r.id} className="border-b last:border-0">
                        <td className="whitespace-nowrap px-5 py-3 font-mono text-[13px] font-medium">{r.id}</td>
                        <td className="whitespace-nowrap px-5 py-3">{r.customer}</td>
                        <td className="whitespace-nowrap px-5 py-3 text-neutral-700">{r.product}</td>
                        <td className="whitespace-nowrap px-5 py-3">
                          <Badge tone={stage.tone} dot>
                            {stage.label}
                          </Badge>
                        </td>
                        <td className="whitespace-nowrap px-5 py-3 text-right tabular-nums">{r.cost}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-6">
          <Card aria-labelledby="attention-h" className="flex flex-col gap-1">
            <h2 id="attention-h" className="mb-2 text-base font-semibold">
              Needs attention
            </h2>
            {stats === null ? (
              <p className="text-sm text-muted-foreground" role="status">
                Loading…
              </p>
            ) : ready.length === 0 && noPhotos.length === 0 ? (
              <p className="flex items-center gap-2 border-t pt-3 text-sm text-muted-foreground">
                <CheckCircle2 className="size-4 text-green-700" aria-hidden />
                Nothing waiting on you in the catalog.
              </p>
            ) : (
              <>
                {ready.slice(0, 3).map((p) => (
                  <Attention
                    key={p.id}
                    href={`/products/${p.id}`}
                    icon={Globe}
                    tone="bg-green-50 text-green-800"
                    title={`${p.name} is ready to publish`}
                    meta="Draft · all details added"
                  />
                ))}
                {noPhotos.length > 0 && (
                  <Attention
                    href="/products"
                    icon={AlertTriangle}
                    tone="bg-amber-50 text-amber-800"
                    title={`${noPhotos.length} draft${noPhotos.length === 1 ? "" : "s"} need${noPhotos.length === 1 ? "s" : ""} photos`}
                    meta="Products can't be published without a photo"
                  />
                )}
              </>
            )}
          </Card>

          <Card aria-labelledby="leads-h" className="flex flex-col gap-1">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h2 id="leads-h" className="text-base font-semibold">
                Latest leads
              </h2>
              <SampleTag />
            </div>
            {SAMPLE.latestLeads.map((l) => (
              <div key={l.name} className="flex items-center gap-3 border-t py-2.5">
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-sm font-medium">{l.name}</span>
                  <span className="truncate text-xs text-muted-foreground">{l.subject}</span>
                </span>
                <span className="whitespace-nowrap text-xs text-muted-foreground">{l.when}</span>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  )
}

function Stat({
  label,
  value,
  sub,
  icon: Icon,
  href,
  sample,
}: {
  label: string
  value: string
  sub: string
  icon: LucideIcon
  href?: string
  sample?: boolean
}) {
  const body = (
    <>
      <span className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <Icon className="size-4 text-muted-foreground" aria-hidden />
      </span>
      <span className="text-3xl font-semibold tracking-tight tabular-nums">{value}</span>
      <span className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        {sub}
        {sample && <SampleTag />}
      </span>
    </>
  )
  const className = "flex flex-col gap-2 rounded-xl border bg-card p-5"
  return href ? (
    <Link href={href} className={cn(className, "transition-colors hover:bg-muted/40")}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  )
}

function Attention({ href, icon: Icon, tone, title, meta }: { href: string; icon: LucideIcon; tone: string; title: string; meta: string }) {
  return (
    <Link href={href} className="flex gap-3 border-t py-2.5 hover:bg-muted/40">
      <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", tone)}>
        <Icon className="size-4" aria-hidden />
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="text-sm font-medium">{title}</span>
        <span className="text-xs text-muted-foreground">{meta}</span>
      </span>
    </Link>
  )
}

// Marks sections that show placeholder numbers until their API exists
function SampleTag() {
  return (
    <span
      title="Placeholder numbers — this feature is coming soon"
      className="rounded-full border border-dashed px-2 py-px text-[11px] font-medium text-neutral-600"
    >
      Sample data
    </span>
  )
}
