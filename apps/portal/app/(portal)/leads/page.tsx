"use client"

import { Suspense, useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ExternalLink, ImageOff, MessageCircle, Phone, Search } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Badge, inputClass, textareaClass } from "@/components/form"
import { ConvertLeadModal } from "@/components/leads/convert-lead-modal"
import { LoadError, Loading, RefreshButton, RowSkeleton, SkeletonGroup } from "@/components/load-state"
import { api, ApiError } from "@/lib/api"
import { companyPath, useAuth } from "@/lib/auth"
import { formatMoney, formatRentalRate, timeAgo, whatsappLink } from "@/lib/format"
import type { Lead, LeadPage, LeadStatus, LeadType } from "@/lib/types"
import { cn } from "@/lib/utils"

const STATUS: Record<LeadStatus, { label: string; tone: "blue" | "amber" | "green" | "neutral" }> = {
  NEW: { label: "New", tone: "blue" },
  CONTACTED: { label: "Contacted", tone: "amber" },
  CONVERTED: { label: "Customer", tone: "green" },
  CLOSED: { label: "Closed", tone: "neutral" },
}

const TABS: { key: LeadStatus | "ALL"; label: string }[] = [
  { key: "NEW", label: "New" },
  { key: "CONTACTED", label: "Contacted" },
  { key: "CONVERTED", label: "Customers" },
  { key: "CLOSED", label: "Closed" },
  { key: "ALL", label: "All" },
]

export default function LeadsPage() {
  return (
    <Suspense>
      <LeadsView />
    </Suspense>
  )
}

function LeadsView() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useSearchParams()
  const leadsPath = companyPath(user, "/leads")
  // rental leads can exist from before rentals were turned off, so the badge always shows
  const rentalsEnabled = !!user?.company?.rentalsEnabled

  const [tab, setTab] = useState<LeadStatus | "ALL">(params.get("id") ? "ALL" : "NEW")
  const [search, setSearch] = useState("")
  const [type, setType] = useState<LeadType | "">("")
  const [page, setPage] = useState<LeadPage | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(params.get("id"))
  const [lead, setLead] = useState<Lead | null>(null)
  const [notes, setNotes] = useState("")
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null)
  const [convertOpen, setConvertOpen] = useState(false)
  const [listLoading, setListLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)

  const loadList = useCallback(() => {
    const q = new URLSearchParams({ pageSize: "50" })
    if (tab !== "ALL") q.set("status", tab)
    if (type) q.set("type", type)
    if (search.trim()) q.set("search", search.trim())
    setListLoading(true)
    return api<LeadPage>("GET", `${leadsPath}?${q}`)
      .then((p) => {
        setPage(p)
        setListError(null)
        // keep the selection if it's still listed; otherwise pick the first
        setSelectedId((current) => (current && (p.items.some((l) => l.id === current) || current === params.get("id")) ? current : (p.items[0]?.id ?? null)))
      })
      .catch((e) => setListError(e instanceof ApiError ? e.message : "Couldn't load leads."))
      .finally(() => setListLoading(false))
  }, [leadsPath, tab, type, search, params])

  useEffect(() => {
    const t = setTimeout(loadList, 250)
    return () => clearTimeout(t)
  }, [loadList])

  useEffect(() => {
    if (!selectedId) return
    api<Lead>("GET", `${leadsPath}/${selectedId}`)
      .then((l) => {
        setLead(l)
        setNotes(l.notes ?? "")
      })
      .catch(() => setLead(null))
  }, [selectedId, leadsPath])

  function select(id: string) {
    setSelectedId(id)
    setMessage(null)
    router.replace(`/leads?id=${id}`, { scroll: false })
  }

  async function update(body: { status?: LeadStatus; notes?: string }, success: string) {
    if (!lead) return
    setBusy(true)
    setMessage(null)
    try {
      const updated = await api<Lead>("PATCH", `${leadsPath}/${lead.id}`, body)
      setLead({ ...updated, matchingCustomers: lead.matchingCustomers })
      setNotes(updated.notes ?? "")
      // refresh the list first so the message and the list agree
      await loadList()
      setMessage({ text: success })
    } catch (err) {
      setMessage({ text: err instanceof ApiError ? err.message : "Couldn't update this lead.", error: true })
    } finally {
      setBusy(false)
    }
  }

  const counts = page?.counts
  const tabCount = (key: LeadStatus | "ALL") =>
    counts ? (key === "ALL" ? Object.values(counts).reduce((a, b) => a + b, 0) : counts[key.toLowerCase() as keyof typeof counts]) : null

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-5 p-6 md:p-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Leads</h1>
        <p className="text-sm text-muted-foreground">People who clicked “I’m interested” on your website, or asked for something you don’t list.</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="group" aria-label="Filter by status" className="flex flex-wrap gap-1.5 rounded-xl bg-muted p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              aria-pressed={tab === t.key}
              onClick={() => setTab(t.key)}
              className={cn("flex h-8 items-center gap-2 rounded-lg px-3 text-sm", tab === t.key ? "bg-background font-medium shadow-sm" : "text-neutral-700")}
            >
              {t.label}
              {tabCount(t.key) !== null && <span className="text-xs text-muted-foreground tabular-nums">{tabCount(t.key)}</span>}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {rentalsEnabled && (
            <>
              <label htmlFor="lead-type" className="sr-only">
                Buying or renting
              </label>
              <select id="lead-type" value={type} onChange={(e) => setType(e.target.value as LeadType | "")} className={cn(inputClass, "w-auto")}>
                <option value="">Buying and renting</option>
                <option value="PURCHASE">Buying</option>
                <option value="RENTAL">Renting</option>
              </select>
            </>
          )}
          <div className="relative w-64 max-w-full">
            <label htmlFor="lead-search" className="sr-only">
              Search leads
            </label>
            <Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" aria-hidden />
            <input
              id="lead-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name, phone or product"
              className={cn(inputClass, "pl-9")}
            />
          </div>
          <RefreshButton onClick={loadList} busy={listLoading} label="Check for new leads" />
        </div>
      </div>

      {listError && page !== null && (
        <p role="alert" className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {listError} Showing the last list we loaded.
          <button type="button" onClick={loadList} className="font-medium underline underline-offset-4">
            Try again
          </button>
        </p>
      )}

      <div className="flex flex-wrap items-start gap-6">
        <ul aria-label="Leads" className="flex min-w-0 flex-[1_1_360px] flex-col overflow-hidden rounded-xl border">
          {page === null ? (
            <li>
              {listError ? (
                <LoadError message={listError} onRetry={loadList} retrying={listLoading} className="rounded-none border-0" />
              ) : (
                <SkeletonGroup label="Loading leads…" className="divide-y px-4">
                  {Array.from({ length: 6 }, (_, i) => (
                    <RowSkeleton key={i} />
                  ))}
                </SkeletonGroup>
              )}
            </li>
          ) : page.items.length === 0 ? (
            <li className="px-4 py-10 text-center text-sm text-muted-foreground">
              {search || type ? "No leads match these filters." : tab === "NEW" ? "No new leads. They appear here when someone enquires on your website." : "Nothing here."}
            </li>
          ) : (
            page.items.map((l) => (
              <li key={l.id} className="border-b last:border-0">
                <button
                  type="button"
                  aria-current={l.id === selectedId ? "true" : undefined}
                  onClick={() => select(l.id)}
                  className={cn("flex w-full flex-col gap-1.5 px-4 py-3.5 text-left", l.id === selectedId ? "bg-muted" : "hover:bg-muted/50")}
                >
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-semibold">{l.fullName}</span>
                    <span className="whitespace-nowrap text-xs text-muted-foreground">{timeAgo(l.createdAt)}</span>
                  </span>
                  <span className="line-clamp-2 text-sm text-neutral-800">
                    {l.productName ? `${l.type === "RENTAL" ? "Wants to rent" : "Interested in"} ${l.productName}` : l.customRequest}
                  </span>
                  <span className="flex flex-wrap items-center gap-1.5">
                    <Badge tone={STATUS[l.status].tone}>{STATUS[l.status].label}</Badge>
                    {l.type === "RENTAL" && <Badge tone="amber">Rental</Badge>}
                    {!l.productName && <Badge>Custom request</Badge>}
                    {l.location && <span className="text-xs text-muted-foreground">{l.location}</span>}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>

        <section aria-label="Lead details" className="flex min-w-0 flex-[999_1_520px] flex-col rounded-xl border">
          {!lead || lead.id !== selectedId ? (
            selectedId ? (
              <Loading label="Loading lead…" />
            ) : (
              <p className="px-5 py-10 text-center text-sm text-muted-foreground">
                {page?.items.length ? "Select a lead to see the details." : "Nothing selected."}
              </p>
            )
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3 border-b p-5">
                <div className="flex flex-col gap-1">
                  <h2 className="text-lg font-semibold">{lead.fullName}</h2>
                  <span className="text-sm text-muted-foreground">Enquired {timeAgo(lead.createdAt)} on your website</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {lead.type === "RENTAL" && <Badge tone="amber">Rental</Badge>}
                  <Badge tone={STATUS[lead.status].tone} dot>
                    {STATUS[lead.status].label}
                  </Badge>
                </div>
              </div>

              <div className="flex flex-col gap-5 p-5">
                <div className="flex flex-wrap gap-2">
                  <a href={`tel:${lead.phone}`} className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-10 px-4")}>
                    <Phone aria-hidden />
                    {lead.phone}
                  </a>
                  <a
                    href={whatsappLink(lead.phoneKey, `Hi ${lead.fullName.split(" ")[0]}, thanks for your enquiry${lead.productName ? ` about ${lead.type === "RENTAL" ? "renting " : ""}the ${lead.productName}` : ""}.`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-10 px-4 text-green-700")}
                  >
                    <MessageCircle aria-hidden />
                    WhatsApp
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                </div>

                <dl className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs text-muted-foreground">Location</dt>
                    <dd className="mt-1 text-sm font-medium">{lead.location ?? "Not given"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Referral</dt>
                    <dd className="mt-1 text-sm font-medium">
                      {lead.agent ? (
                        <>
                          {lead.agent.name} <span className="font-mono text-xs text-muted-foreground">{lead.agent.referralCode}</span>
                        </>
                      ) : lead.referralCode ? (
                        <>
                          “{lead.referralCode}” <span className="text-xs font-normal text-muted-foreground">(no matching agent)</span>
                        </>
                      ) : (
                        "None"
                      )}
                    </dd>
                  </div>
                </dl>

                <div className="flex flex-col gap-2">
                  <h3 className="text-sm font-semibold">{lead.type === "RENTAL" ? "Wants to rent" : "Interested in"}</h3>
                  {lead.product ? (
                    <Link href={`/products/${lead.product.id}`} className="flex items-center gap-3 rounded-xl border p-2.5 hover:bg-muted/40">
                      <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted text-muted-foreground">
                        {lead.product.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element -- storage thumbnail
                          <img src={lead.product.imageUrl} alt="" className="size-full object-cover" />
                        ) : (
                          <ImageOff className="size-4" aria-hidden />
                        )}
                      </span>
                      <span className="flex min-w-0 flex-col">
                        <span className="text-sm font-semibold">{lead.product.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {lead.type === "RENTAL"
                            ? lead.product.rental
                              ? formatRentalRate(lead.product.rental)
                              : "No longer for rent"
                            : lead.product.price !== null
                              ? formatMoney(lead.product.price, lead.product.currency)
                              : "No price"}
                          {lead.product.status !== "PUBLISHED" && " · no longer on your website"}
                        </span>
                      </span>
                    </Link>
                  ) : lead.productName ? (
                    <p className="text-sm">{lead.productName} <span className="text-muted-foreground">(product deleted)</span></p>
                  ) : (
                    <blockquote className="rounded-xl border bg-muted/40 px-4 py-3 text-sm leading-relaxed">“{lead.customRequest}”</blockquote>
                  )}
                </div>

                {lead.customer && (
                  <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-900">
                    Now a customer:{" "}
                    <Link href={`/customers/${lead.customer.id}`} className="font-semibold underline underline-offset-4">
                      {lead.customer.firstName} {lead.customer.lastName}
                    </Link>
                  </p>
                )}

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="lead-notes" className="text-sm font-semibold">
                    Notes
                  </label>
                  <textarea
                    id="lead-notes"
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Call outcome, budget, preferred colour…"
                    className={textareaClass}
                  />
                  {notes !== (lead.notes ?? "") && (
                    <Button variant="outline" className="self-start" disabled={busy} onClick={() => update({ notes }, "Notes saved.")}>
                      Save notes
                    </Button>
                  )}
                </div>

                {message && (
                  <p role={message.error ? "alert" : "status"} className={cn("rounded-lg px-3 py-2 text-sm", message.error ? "bg-red-50 text-red-700" : "bg-green-50 text-green-800")}>
                    {message.text}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t p-4">
                {lead.status === "CONVERTED" ? (
                  <Link href={`/customers/${lead.customerId}`} className={cn(buttonVariants({ size: "lg" }), "ml-auto h-10 px-4")}>
                    View customer
                    <ExternalLink aria-hidden />
                  </Link>
                ) : (
                  <>
                    {lead.status === "CLOSED" ? (
                      <Button variant="outline" size="lg" className="h-10 px-4" disabled={busy} onClick={() => update({ status: "NEW" }, "Lead reopened.")}>
                        Reopen
                      </Button>
                    ) : (
                      <Button variant="ghost" size="lg" className="h-10 px-4" disabled={busy} onClick={() => update({ status: "CLOSED" }, "Lead closed.")}>
                        Close lead
                      </Button>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {lead.status === "NEW" && (
                        <Button variant="outline" size="lg" className="h-10 px-4" disabled={busy} onClick={() => update({ status: "CONTACTED" }, "Marked as contacted.")}>
                          Mark contacted
                        </Button>
                      )}
                      <Button size="lg" className="h-10 px-4" disabled={busy} onClick={() => setConvertOpen(true)}>
                        Convert to customer
                      </Button>
                    </div>
                  </>
                )}
              </div>

              <ConvertLeadModal
                key={lead.id}
                lead={lead}
                leadPath={`${leadsPath}/${lead.id}`}
                open={convertOpen}
                onClose={() => setConvertOpen(false)}
                onConverted={(converted) => {
                  setConvertOpen(false)
                  setLead(converted)
                  setMessage({ text: "Converted. They're now in Customers." })
                  loadList()
                }}
              />
            </>
          )}
        </section>
      </div>
    </div>
  )
}
