"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Search, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { inputClass } from "@/components/form"
import { LoadError, RefreshButton, TableRowsSkeleton } from "@/components/load-state"
import { Modal } from "@/components/modal"
import { CustomerFields, customerFormValid, emptyCustomerForm, type CustomerForm } from "@/components/customers/customer-fields"
import { api, ApiError } from "@/lib/api"
import { companyPath, useAuth } from "@/lib/auth"
import { formatDate, initials } from "@/lib/format"
import type { Customer, Paginated } from "@/lib/types"
import { cn } from "@/lib/utils"

export default function CustomersPage() {
  const { user } = useAuth()
  const router = useRouter()
  const customersPath = companyPath(user, "/customers")
  const [search, setSearch] = useState("")
  const [data, setData] = useState<Paginated<Customer> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState<CustomerForm>(emptyCustomerForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [duplicateId, setDuplicateId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    const q = new URLSearchParams({ pageSize: "50" })
    if (search.trim()) q.set("search", search.trim())
    setLoading(true)
    return api<Paginated<Customer>>("GET", `${customersPath}?${q}`)
      .then((d) => {
        setData(d)
        setError(null)
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Couldn't load customers."))
      .finally(() => setLoading(false))
  }, [customersPath, search])

  useEffect(() => {
    const t = setTimeout(load, 250)
    return () => clearTimeout(t)
  }, [load])

  async function add(allowDuplicatePhone = false) {
    setSaving(true)
    setFormError(null)
    try {
      const created = await api<Customer>("POST", customersPath, { ...form, allowDuplicatePhone })
      setAddOpen(false)
      router.push(`/customers/${created.id}`)
    } catch (err) {
      if (err instanceof ApiError && err.status === 409 && typeof err.details?.duplicateCustomerId === "string") {
        setDuplicateId(err.details.duplicateCustomerId)
        setFormError(err.message)
      } else {
        setFormError(err instanceof ApiError ? err.message : "Couldn't add this customer.")
      }
    } finally {
      setSaving(false)
    }
  }

  function closeAdd() {
    setAddOpen(false)
    setForm(emptyCustomerForm)
    setFormError(null)
    setDuplicateId(null)
  }

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-5 p-6 md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
          <p className="text-sm text-muted-foreground">People you&apos;re doing business with. Converted leads land here.</p>
        </div>
        <Button size="lg" className="h-10 px-4" onClick={() => setAddOpen(true)}>
          <UserPlus aria-hidden />
          Add customer
        </Button>
      </div>

      <div className="flex gap-2">
        <div className="relative w-72 max-w-full">
          <label htmlFor="customer-search" className="sr-only">
            Search customers
          </label>
          <Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" aria-hidden />
          <input
            id="customer-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name, phone or email"
            className={cn(inputClass, "pl-9")}
          />
        </div>
        <RefreshButton onClick={load} busy={loading} label="Refresh customers" />
      </div>

      {error && data !== null && (
        <p role="alert" className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error} Showing the last list we loaded.
          <button type="button" onClick={load} className="font-medium underline underline-offset-4">
            Try again
          </button>
        </p>
      )}

      {data === null && error ? (
        <LoadError message={error} onRetry={load} retrying={loading} />
      ) : (
      <div className="overflow-hidden rounded-xl border">
        {data === null && (
          <span role="status" className="sr-only">
            Loading customers…
          </span>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left text-[13px] text-muted-foreground">
                <th scope="col" className="px-4 py-2.5 font-medium">Customer</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Phone</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Location</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Ghana Card</th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">Enquiries</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Added</th>
              </tr>
            </thead>
            <tbody>
              {data === null ? (
                <TableRowsSkeleton cols={6} />
              ) : data.items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                    {search ? "No customers match your search." : "No customers yet. Convert a lead or add one yourself."}
                  </td>
                </tr>
              ) : (
                data.items.map((c) => (
                  <tr key={c.id} className="border-b last:border-0 hover:bg-muted/40">
                    <td className="px-4 py-3">
                      <Link href={`/customers/${c.id}`} className="flex items-center gap-2.5">
                        <span aria-hidden className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                          {initials(`${c.firstName} ${c.lastName}`)}
                        </span>
                        <span className="flex min-w-0 flex-col">
                          <span className="font-medium underline-offset-4 hover:underline">
                            {c.firstName} {c.lastName}
                          </span>
                          {c.email && <span className="text-xs text-muted-foreground">{c.email}</span>}
                        </span>
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums">{c.phone}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-neutral-700">{[c.city, c.region].filter(Boolean).join(", ") || "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {c.ghanaCardNumber ? <span className="font-mono text-xs">{c.ghanaCardNumber}</span> : <span className="text-muted-foreground">Missing</span>}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">{c.leadCount ?? 0}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{formatDate(c.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}
      {data && data.total > data.items.length && (
        <p className="text-sm text-muted-foreground">
          Showing {data.items.length} of {data.total}. Search to find someone specific.
        </p>
      )}

      <Modal open={addOpen} onClose={closeAdd} title="Add a customer" description="For people who contact you directly, not through the website.">
        <form
          className="flex flex-col gap-4"
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            add()
          }}
        >
          <CustomerFields value={form} onChange={setForm} idPrefix="add" showNotes />
          {formError && (
            <div role="alert" className="flex flex-col gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              <span>{formError}</span>
              {duplicateId && (
                <span className="flex flex-wrap gap-3">
                  <Link href={`/customers/${duplicateId}`} className="font-medium underline underline-offset-4">
                    Open their profile
                  </Link>
                  <button type="button" onClick={() => add(true)} className="font-medium underline underline-offset-4">
                    Add as a separate customer
                  </button>
                </span>
              )}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="lg" className="h-10 px-4" onClick={closeAdd}>
              Cancel
            </Button>
            <Button type="submit" size="lg" className="h-10 px-4" disabled={saving || !customerFormValid(form)}>
              {saving ? "Adding…" : "Add customer"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
