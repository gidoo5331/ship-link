"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { MessageCircle, Phone } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Badge, Card } from "@/components/form"
import { CustomerFields, customerFormValid, customerToForm, type CustomerForm } from "@/components/customers/customer-fields"
import { api, ApiError } from "@/lib/api"
import { companyPath, useAuth } from "@/lib/auth"
import { formatDate, initials, timeAgo, whatsappLink } from "@/lib/format"
import type { Customer, LeadStatus } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Loading } from "@/components/load-state"

type CustomerDetail = Customer & {
  leads: {
    id: string
    status: LeadStatus
    productName: string | null
    customRequest: string | null
    createdAt: string
    product: { id: string; name: string; slug: string } | null
  }[]
}

const LEAD_STATUS: Record<LeadStatus, { label: string; tone: "blue" | "amber" | "green" | "neutral" }> = {
  NEW: { label: "New", tone: "blue" },
  CONTACTED: { label: "Contacted", tone: "amber" },
  CONVERTED: { label: "Converted", tone: "green" },
  CLOSED: { label: "Closed", tone: "neutral" },
}

// digits with country code, for wa.me (local 0XX… numbers get 233)
function phoneDigits(phone: string) {
  const d = phone.replace(/\D/g, "")
  return /^0\d{9}$/.test(d) ? `233${d.slice(1)}` : d
}

export default function CustomerPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const path = companyPath(user, `/customers/${id}`)
  const [customer, setCustomer] = useState<CustomerDetail | null>(null)
  const [form, setForm] = useState<CustomerForm | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null)

  useEffect(() => {
    api<CustomerDetail>("GET", path)
      .then((c) => {
        setCustomer(c)
        setForm(customerToForm(c))
      })
      .catch((e) => setLoadError(e instanceof ApiError && e.status === 404 ? "This customer doesn't exist." : "Couldn't load this customer."))
  }, [path])

  if (loadError) {
    return (
      <div className="flex flex-col items-start gap-3 p-8">
        <p role="alert" className="text-sm text-red-700">
          {loadError}
        </p>
        <Link href="/customers" className="text-sm font-medium underline">
          Back to customers
        </Link>
      </div>
    )
  }
  if (!customer || !form) {
    return (
      <Loading label="Loading customer…" />
    )
  }

  const dirty = JSON.stringify(form) !== JSON.stringify(customerToForm(customer))

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!form) return
    setSaving(true)
    setMessage(null)
    try {
      const updated = await api<Customer>("PATCH", path, form)
      setCustomer((c) => (c ? { ...c, ...updated } : c))
      setForm(customerToForm(updated))
      setMessage({ text: "Saved." })
    } catch (err) {
      setMessage({ text: err instanceof ApiError ? err.message : "Couldn't save.", error: true })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={save} className="flex flex-col" noValidate>
      <header className="sticky top-0 z-10 flex flex-wrap items-center gap-3 border-b bg-background/95 px-6 py-3 backdrop-blur md:px-8">
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
          <Link href="/customers" className="hover:text-foreground">
            Customers
          </Link>
          <span aria-hidden className="px-1.5">
            /
          </span>
          <span className="font-medium text-foreground">
            {customer.firstName} {customer.lastName}
          </span>
        </nav>
        {dirty && <span className="text-xs text-muted-foreground">Unsaved changes</span>}
        <Button type="submit" size="lg" className="ml-auto h-10 px-4" disabled={saving || !dirty || !customerFormValid(form)}>
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </header>

      {message && (
        <p
          role={message.error ? "alert" : "status"}
          className={cn("mx-6 mt-4 rounded-lg px-3 py-2 text-sm md:mx-8", message.error ? "bg-red-50 text-red-700" : "bg-green-50 text-green-800")}
        >
          {message.text}
        </p>
      )}

      <div className="mx-auto flex w-full max-w-[1600px] flex-wrap items-start gap-6 p-6 md:p-8">
        <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-6">
          <Card className="flex flex-wrap items-center gap-4">
            <span aria-hidden className="flex size-14 items-center justify-center rounded-full bg-muted text-lg font-semibold">
              {initials(`${customer.firstName} ${customer.lastName}`)}
            </span>
            <div className="flex flex-1 flex-col gap-0.5">
              <h1 className="text-xl font-semibold">
                {customer.firstName} {customer.lastName}
              </h1>
              <span className="text-sm text-muted-foreground">Customer since {formatDate(customer.createdAt)}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <a href={`tel:${customer.phone}`} className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-10 px-4")}>
                <Phone aria-hidden />
                Call
              </a>
              <a
                href={whatsappLink(phoneDigits(customer.phone))}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-10 px-4 text-green-700")}
              >
                <MessageCircle aria-hidden />
                WhatsApp
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </div>
          </Card>

          <Card aria-labelledby="details-h" className="flex flex-col gap-4">
            <h2 id="details-h" className="text-base font-semibold">
              Details
            </h2>
            <CustomerFields value={form} onChange={setForm} idPrefix="customer" showNotes />
          </Card>
        </div>

        <Card aria-labelledby="enquiries-h" className="flex min-w-0 flex-[1_1_320px] flex-col gap-1">
          <h2 id="enquiries-h" className="mb-2 text-base font-semibold">
            Enquiries
          </h2>
          {customer.leads.length === 0 ? (
            <p className="border-t pt-3 text-sm text-muted-foreground">Added directly, not from a website enquiry.</p>
          ) : (
            customer.leads.map((l) => (
              <Link key={l.id} href={`/leads?id=${l.id}`} className="flex items-start justify-between gap-3 border-t py-2.5 hover:bg-muted/40">
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate text-sm font-medium">{l.product?.name ?? l.productName ?? `“${l.customRequest}”`}</span>
                  <span className="text-xs text-muted-foreground">{timeAgo(l.createdAt)}</span>
                </span>
                <Badge tone={LEAD_STATUS[l.status].tone}>{LEAD_STATUS[l.status].label}</Badge>
              </Link>
            ))
          )}
          <p className="mt-3 text-xs text-muted-foreground">Shipments for this customer will appear here once Shipments is available.</p>
        </Card>
      </div>
    </form>
  )
}
