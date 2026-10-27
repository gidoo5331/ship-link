"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/modal"
import { CustomerFields, customerFormValid, emptyCustomerForm, type CustomerForm } from "@/components/customers/customer-fields"
import { api, ApiError } from "@/lib/api"
import { formatDate } from "@/lib/format"
import type { Lead } from "@/lib/types"
import { cn } from "@/lib/utils"

function formFromLead(lead: Lead): CustomerForm {
  const [first, ...rest] = lead.fullName.trim().split(/\s+/)
  return { ...emptyCustomerForm, firstName: first ?? "", lastName: rest.join(" "), phone: lead.phone, city: lead.location ?? "" }
}

// Turn a lead into a customer: link someone who already has this phone
// number, or create a new customer pre-filled from the lead.
export function ConvertLeadModal({
  lead,
  leadPath,
  open,
  onClose,
  onConverted,
}: {
  lead: Lead
  leadPath: string
  open: boolean
  onClose: () => void
  onConverted: (lead: Lead) => void
}) {
  const matches = lead.matchingCustomers ?? []
  const [mode, setMode] = useState<string>(matches[0]?.id ?? "new") // customer id to link, or "new"
  const [form, setForm] = useState<CustomerForm>(() => formFromLead(lead))
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const prefilled: (keyof CustomerForm)[] = ["firstName", "lastName", "phone", ...(lead.location ? (["city"] as const) : [])]

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const body =
        mode === "new"
          ? { customer: { ...form, allowDuplicatePhone: matches.length > 0 } }
          : { customerId: mode }
      onConverted(await api<Lead>("POST", `${leadPath}/convert`, body))
    } catch (err) {
      if (err instanceof ApiError && err.status === 409 && typeof err.details?.duplicateCustomerId === "string") {
        setError(`${err.message}. Link to them instead, or change the phone number.`)
      } else {
        setError(err instanceof ApiError ? err.message : "Couldn't convert this lead.")
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Convert ${lead.fullName} to a customer`}
      description="Details from the enquiry are filled in. Add what you know, like their Ghana Card number."
    >
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        {matches.length > 0 && (
          <fieldset className="flex flex-col gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
            <legend className="sr-only">Customer record</legend>
            <p className="text-sm text-amber-900">
              <span className="font-semibold">This phone number already belongs to a customer.</span> Link the enquiry to them to avoid a duplicate.
            </p>
            {matches.map((m) => (
              <label key={m.id} className={cn("flex cursor-pointer items-start gap-2.5 rounded-lg bg-background p-2.5", mode === m.id && "ring-2 ring-primary")}>
                <input type="radio" name="convert-mode" checked={mode === m.id} onChange={() => setMode(m.id)} className="mt-0.5 size-4 accent-primary" />
                <span className="flex flex-col text-sm">
                  <span className="font-medium">
                    Link to {m.firstName} {m.lastName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {[m.phone, m.city, `customer since ${formatDate(m.createdAt)}`].filter(Boolean).join(" · ")}
                  </span>
                </span>
              </label>
            ))}
            <label className={cn("flex cursor-pointer items-center gap-2.5 rounded-lg bg-background p-2.5 text-sm", mode === "new" && "ring-2 ring-primary")}>
              <input type="radio" name="convert-mode" checked={mode === "new"} onChange={() => setMode("new")} className="size-4 accent-primary" />
              Create a new customer anyway
            </label>
          </fieldset>
        )}

        {mode === "new" && <CustomerFields value={form} onChange={setForm} prefilled={prefilled} idPrefix="convert" />}

        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" size="lg" className="h-10 px-4" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="lg" className="h-10 px-4" disabled={busy || (mode === "new" && !customerFormValid(form))}>
            {busy ? "Converting…" : mode === "new" ? "Create customer" : "Link customer"}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
