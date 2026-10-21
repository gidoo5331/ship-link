"use client"

import { useCallback, useEffect, useState } from "react"
import { Check, Copy, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge, Field, inputClass } from "@/components/form"
import { Modal } from "@/components/modal"
import { api, ApiError } from "@/lib/api"
import { companyPath, useAuth } from "@/lib/auth"
import { initials } from "@/lib/format"
import { cn } from "@/lib/utils"

type StaffMember = {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  systemRole: "COMPANY_ADMIN" | "COMPANY_STAFF"
  isActive: boolean
  role: { id: string; name: string } | null
  createdAt: string
}

// What the admin needs to pass on after adding someone or resetting a password
type Credentials = { name: string; email: string; password: string; isNew: boolean }

const emptyForm = { firstName: "", lastName: "", email: "", phone: "" }

export default function StaffPage() {
  const { user } = useAuth()
  const staffPath = companyPath(user, "/staff")
  const [staff, setStaff] = useState<StaffMember[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [credentials, setCredentials] = useState<Credentials | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(
    () =>
      api<StaffMember[]>("GET", staffPath)
        .then(setStaff)
        .catch((e) => setError(e instanceof ApiError ? e.message : "Couldn't load your team.")),
    [staffPath],
  )

  useEffect(() => {
    load()
  }, [load])

  async function addStaff(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    setSaving(true)
    try {
      const res = await api<{ staff: StaffMember; temporaryPassword: string }>("POST", staffPath, {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        ...(form.phone.trim() && { phone: form.phone.trim() }),
      })
      setAddOpen(false)
      setForm(emptyForm)
      setCredentials({
        name: `${res.staff.firstName} ${res.staff.lastName}`,
        email: res.staff.email,
        password: res.temporaryPassword,
        isNew: true,
      })
      await load()
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Couldn't add this person.")
    } finally {
      setSaving(false)
    }
  }

  async function resetPassword(member: StaffMember) {
    if (!window.confirm(`Give ${member.firstName} a new temporary password? Their current password stops working.`)) return
    setBusyId(member.id)
    setError(null)
    try {
      const res = await api<{ temporaryPassword: string }>("POST", `${staffPath}/${member.id}/reset-password`)
      setCredentials({ name: `${member.firstName} ${member.lastName}`, email: member.email, password: res.temporaryPassword, isNew: false })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't reset the password.")
    } finally {
      setBusyId(null)
    }
  }

  async function setActive(member: StaffMember, isActive: boolean) {
    if (!isActive && !window.confirm(`Deactivate ${member.firstName}? They won't be able to sign in until you reactivate them.`)) return
    setBusyId(member.id)
    setError(null)
    try {
      await api("PATCH", `${staffPath}/${member.id}/active`, { isActive })
      await load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't update this account.")
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-5 p-6 md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Staff</h1>
          <p className="text-sm text-muted-foreground">Who can sign in to your portal. Everyone you add gets full access.</p>
        </div>
        <Button size="lg" className="h-10 px-4" onClick={() => setAddOpen(true)}>
          <UserPlus aria-hidden />
          Add staff
        </Button>
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="overflow-hidden rounded-xl border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left text-[13px] text-muted-foreground">
                <th scope="col" className="px-4 py-2.5 font-medium">Name</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Role</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Status</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Added</th>
                <th scope="col" className="px-4 py-2.5">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {staff === null ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground" role="status">
                    Loading…
                  </td>
                </tr>
              ) : (
                staff.map((m) => {
                  const isAdmin = m.systemRole === "COMPANY_ADMIN"
                  const isMe = m.id === user?.id
                  return (
                    <tr key={m.id} className="border-b last:border-0">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span aria-hidden className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                            {initials(`${m.firstName} ${m.lastName}`)}
                          </span>
                          <div className="flex min-w-0 flex-col">
                            <span className="font-medium">
                              {m.firstName} {m.lastName}
                              {isMe && <span className="font-normal text-muted-foreground"> (you)</span>}
                            </span>
                            <span className="text-xs text-muted-foreground">{m.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {isAdmin ? <Badge>Owner</Badge> : (m.role?.name ?? "No role")}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <Badge tone={m.isActive ? "green" : "neutral"} dot>
                          {m.isActive ? "Active" : "Deactivated"}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                        {new Date(m.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        {!isAdmin && (
                          <div className="flex justify-end gap-1.5">
                            <Button variant="outline" disabled={busyId === m.id} onClick={() => resetPassword(m)}>
                              Reset password
                            </Button>
                            {!isMe &&
                              (m.isActive ? (
                                <Button variant="outline" className="text-red-700" disabled={busyId === m.id} onClick={() => setActive(m, false)}>
                                  Deactivate
                                </Button>
                              ) : (
                                <Button variant="outline" disabled={busyId === m.id} onClick={() => setActive(m, true)}>
                                  Reactivate
                                </Button>
                              ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={addOpen}
        onClose={() => {
          setAddOpen(false)
          setFormError(null)
        }}
        title="Add a staff member"
        description="You'll get a temporary password to give them. They can sign in straight away."
      >
        <form onSubmit={addStaff} className="flex flex-col gap-4" noValidate>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="First name" htmlFor="first-name">
              <input id="first-name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className={inputClass} autoFocus />
            </Field>
            <Field label="Last name" htmlFor="last-name">
              <input id="last-name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Email" htmlFor="staff-email" className="sm:col-span-2">
              <input
                id="staff-email"
                type="email"
                autoComplete="off"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={inputClass}
                placeholder="name@company.com"
              />
            </Field>
            <Field label="Phone (optional)" htmlFor="staff-phone" className="sm:col-span-2">
              <input id="staff-phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} />
            </Field>
          </div>
          {formError && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {formError}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="lg" className="h-10 px-4" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="lg"
              className="h-10 px-4"
              disabled={saving || !form.firstName.trim() || !form.lastName.trim() || !form.email.trim()}
            >
              {saving ? "Adding…" : "Add staff member"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={credentials !== null}
        onClose={() => setCredentials(null)}
        title={credentials?.isNew ? `${credentials.name} has been added` : "Password reset"}
        description="Give them these details. The password is shown only once — copy it before closing."
      >
        {credentials && (
          <div className="flex flex-col gap-4">
            <dl className="flex flex-col gap-3 rounded-xl bg-muted/60 p-4">
              <CredentialRow label="Email" value={credentials.email} />
              <CredentialRow label="Temporary password" value={credentials.password} mono />
            </dl>
            <p className="text-sm text-muted-foreground">They sign in at this portal&apos;s login page.</p>
            <div className="flex justify-end">
              <Button size="lg" className="h-10 px-4" onClick={() => setCredentials(null)}>
                Done
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

function CredentialRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  const [copied, setCopied] = useState(false)

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 flex-col">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className={cn("truncate text-sm font-medium", mono && "font-mono text-base tracking-wide")}>{value}</dd>
      </div>
      <Button
        variant="outline"
        aria-label={`Copy ${label.toLowerCase()}`}
        onClick={() => {
          navigator.clipboard.writeText(value).then(() => {
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
          })
        }}
      >
        {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
        {copied ? "Copied" : "Copy"}
      </Button>
    </div>
  )
}
