"use client"

// Roles & permissions — UI preview. Not connected to the API yet: everything
// lives in local state and resets on reload. The data shape matches the
// backend's roles endpoints (name, description, permissions[{ resource, actions }])
// so wiring it up means replacing the state updates with API calls.

import { useMemo, useState } from "react"
import Link from "next/link"
import { Copy, Info, Lock, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge, Field, inputClass } from "@/components/form"
import { initials } from "@/lib/format"
import { cn } from "@/lib/utils"

type Action = "read" | "create" | "update" | "delete"
type Permission = { resource: string; actions: Action[] }
type Role = {
  id: string
  name: string
  description: string
  permissions: Permission[]
  members: { name: string; email: string }[]
  locked?: boolean // the default "Full Access" role
}

const ACTIONS: { key: Action; label: string }[] = [
  { key: "read", label: "View" },
  { key: "create", label: "Create" },
  { key: "update", label: "Edit" },
  { key: "delete", label: "Delete" },
]

// Same resource names as backend/src/shared/types/permissions.types.ts
const GROUPS: { label: string; resources: { key: string; label: string; hint: string; soon?: boolean }[] }[] = [
  {
    label: "Sales",
    resources: [
      { key: "leads", label: "Leads", hint: "Website enquiries, notes and converting them" },
      { key: "customers", label: "Customers", hint: "Customer records and details" },
    ],
  },
  {
    label: "Catalog",
    resources: [{ key: "products", label: "Products", hint: "Products, categories, photos and publishing" }],
  },
  {
    label: "Operations",
    resources: [
      { key: "shipments", label: "Shipments", hint: "Requests and status updates", soon: true },
      { key: "agents", label: "Agents", hint: "Regional agents and referral codes", soon: true },
      { key: "verifications", label: "Verifications", hint: "Verification sessions and evidence", soon: true },
      { key: "payments", label: "Payments", hint: "Recording and confirming payments", soon: true },
      { key: "contracts", label: "Contracts", hint: "Contract uploads", soon: true },
      { key: "invoices", label: "Invoices", hint: "Customer invoices", soon: true },
      { key: "reports", label: "Reports", hint: "Business reports", soon: true },
    ],
  },
  {
    label: "Company",
    resources: [
      { key: "staff", label: "Staff", hint: "Adding staff, resetting passwords, deactivating" },
      { key: "roles", label: "Roles", hint: "Creating roles and changing permissions" },
      { key: "company", label: "Company settings", hint: "Logo, contact details and website content" },
    ],
  },
]

const ALL_RESOURCES = GROUPS.flatMap((g) => g.resources.map((r) => r.key))
const FULL: Action[] = ["read", "create", "update", "delete"]

const SAMPLE_ROLES: Role[] = [
  {
    id: "full",
    name: "Full Access",
    description: "Complete control — everything except account-level actions",
    permissions: ALL_RESOURCES.map((resource) => ({ resource, actions: FULL })),
    members: [{ name: "Joseph Owusu", email: "joseph@company.com" }],
    locked: true,
  },
  {
    id: "sales",
    name: "Sales",
    description: "Follows up website enquiries and manages customers",
    permissions: [
      { resource: "leads", actions: ["read", "create", "update"] },
      { resource: "customers", actions: ["read", "create", "update"] },
      { resource: "products", actions: ["read"] },
    ],
    members: [
      { name: "Rita Amponsah", email: "rita@company.com" },
      { name: "Kofi Mensah", email: "kofi@company.com" },
    ],
  },
  {
    id: "catalog",
    name: "Catalog editor",
    description: "Adds and publishes products",
    permissions: [{ resource: "products", actions: FULL }],
    members: [],
  },
]

function actionsFor(role: Role, resource: string): Action[] {
  return role.permissions.find((p) => p.resource === resource)?.actions ?? []
}

// Keep "View" consistent: any other action needs it, and removing it removes the rest.
function toggleAction(current: Action[], action: Action): Action[] {
  const has = current.includes(action)
  if (action === "read") return has ? [] : ["read"]
  const next = has ? current.filter((a) => a !== action) : [...current, action]
  return next.length && !next.includes("read") ? ["read", ...next] : next
}

function withActions(role: Role, resource: string, actions: Action[]): Role {
  const others = role.permissions.filter((p) => p.resource !== resource)
  const ordered = FULL.filter((a) => actions.includes(a))
  return { ...role, permissions: ordered.length ? [...others, { resource, actions: ordered }] : others }
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>(SAMPLE_ROLES)
  const [selectedId, setSelectedId] = useState(SAMPLE_ROLES[1].id)
  const [draft, setDraft] = useState<Role>(SAMPLE_ROLES[1])
  const [message, setMessage] = useState<string | null>(null)

  const saved = roles.find((r) => r.id === selectedId)!
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved)
  const nameTaken = roles.some((r) => r.id !== draft.id && r.name.trim().toLowerCase() === draft.name.trim().toLowerCase())
  const grantedCount = useMemo(() => draft.permissions.reduce((n, p) => n + p.actions.length, 0), [draft])

  function select(id: string) {
    if (dirty && !window.confirm("Discard your changes to this role?")) return
    const role = roles.find((r) => r.id === id)!
    setSelectedId(id)
    setDraft(role)
    setMessage(null)
  }

  function addRole(from?: Role) {
    if (dirty && !window.confirm("Discard your changes to this role?")) return
    const id = `role-${Date.now()}`
    const role: Role = from
      ? { ...from, id, name: `${from.name} (copy)`, members: [], locked: false }
      : { id, name: "New role", description: "", permissions: [{ resource: "products", actions: ["read"] }], members: [] }
    setRoles((rs) => [...rs, role])
    setSelectedId(id)
    setDraft(role)
    setMessage(from ? `Copied “${from.name}”. Rename it and adjust permissions.` : "New role added. Name it and choose what it can do.")
  }

  function save() {
    setRoles((rs) => rs.map((r) => (r.id === draft.id ? { ...draft, name: draft.name.trim() } : r)))
    setMessage("Saved in this preview only — changes reset when you reload.")
  }

  function remove() {
    if (!window.confirm(`Delete the “${saved.name}” role?`)) return
    const rest = roles.filter((r) => r.id !== saved.id)
    setRoles(rest)
    setSelectedId(rest[0].id)
    setDraft(rest[0])
    setMessage(null)
  }

  const setRow = (resource: string, actions: Action[]) => setDraft((d) => withActions(d, resource, actions))

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-5 p-6 md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Roles &amp; permissions</h1>
          <p className="text-sm text-muted-foreground">
            A role is a set of permissions. Give each <Link href="/staff" className="underline underline-offset-4">staff member</Link> one role.
          </p>
        </div>
        <Button size="lg" className="h-10 px-4" onClick={() => addRole()}>
          <Plus aria-hidden />
          New role
        </Button>
      </div>

      <p className="flex items-start gap-2 rounded-lg border border-dashed px-3 py-2.5 text-sm text-neutral-700">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
        <span>
          <span className="font-semibold">Preview.</span>{" "}
          This screen isn&apos;t connected yet — roles and changes here are examples and
          reset when you reload. Everyone you add on the Staff page gets Full Access for now.
        </span>
      </p>

      <div className="flex flex-wrap items-start gap-6">
        <ul aria-label="Roles" className="flex min-w-0 flex-[1_1_260px] flex-col gap-1 rounded-xl border p-1.5">
          {roles.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                aria-current={r.id === selectedId ? "true" : undefined}
                onClick={() => select(r.id)}
                className={cn("flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left", r.id === selectedId ? "bg-muted" : "hover:bg-muted/50")}
              >
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium">{r.id === selectedId ? draft.name || "Untitled role" : r.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {r.members.length} {r.members.length === 1 ? "member" : "members"}
                  </span>
                </span>
                {r.locked && (
                  <Badge>
                    <Lock className="size-3" aria-hidden />
                    Default
                  </Badge>
                )}
              </button>
            </li>
          ))}
        </ul>

        <section aria-labelledby="role-h" className="flex min-w-0 flex-[999_1_640px] flex-col rounded-xl border">
          <div className="flex flex-col gap-4 border-b p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 id="role-h" className="text-lg font-semibold">
                {draft.name || "Untitled role"}
              </h2>
              <span className="text-xs text-muted-foreground">
                {grantedCount} of {ALL_RESOURCES.length * ACTIONS.length} permissions
              </span>
            </div>
            {draft.locked && (
              <p className="rounded-lg bg-muted/60 px-3 py-2 text-sm text-neutral-700">
                Created automatically for every company. It always has every permission and can&apos;t be edited or deleted — copy it to
                make a custom version.
              </p>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Role name" htmlFor="role-name" error={nameTaken ? "Another role already has this name" : undefined}>
                <input
                  id="role-name"
                  value={draft.name}
                  readOnly={draft.locked}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  className={cn(inputClass, draft.locked && "bg-muted/50")}
                  aria-invalid={nameTaken}
                />
              </Field>
              <Field label="Description" htmlFor="role-description">
                <input
                  id="role-description"
                  value={draft.description}
                  readOnly={draft.locked}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  className={cn(inputClass, draft.locked && "bg-muted/50")}
                  placeholder="What is this role for?"
                />
              </Field>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">Permissions for {draft.name}</caption>
              <thead>
                <tr className="border-b bg-muted/50 text-[13px] text-muted-foreground">
                  <th scope="col" className="px-5 py-2.5 text-left font-medium">
                    Area
                  </th>
                  {ACTIONS.map((a) => (
                    <th key={a.key} scope="col" className="w-20 px-2 py-2.5 text-center font-medium">
                      {a.label}
                    </th>
                  ))}
                  <th scope="col" className="w-20 px-2 py-2.5 text-center font-medium">
                    All
                  </th>
                </tr>
              </thead>
              {GROUPS.map((group) => (
                <tbody key={group.label}>
                  <tr>
                    <th colSpan={6} scope="colgroup" className="bg-background px-5 pb-1 pt-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {group.label}
                    </th>
                  </tr>
                  {group.resources.map((res) => {
                    const current = actionsFor(draft, res.key)
                    const all = current.length === FULL.length
                    return (
                      <tr key={res.key} className="border-b last:border-0">
                        <th scope="row" className="px-5 py-2.5 text-left font-normal">
                          <span className="flex flex-col">
                            <span className="flex items-center gap-2 font-medium">
                              {res.label}
                              {res.soon && <span className="rounded-full border px-1.5 text-[10px] font-medium text-neutral-600">Soon</span>}
                            </span>
                            <span className="text-xs text-muted-foreground">{res.hint}</span>
                          </span>
                        </th>
                        {ACTIONS.map((a) => (
                          <td key={a.key} className="px-2 py-2.5 text-center">
                            <input
                              type="checkbox"
                              aria-label={`${a.label} ${res.label.toLowerCase()}`}
                              checked={current.includes(a.key)}
                              disabled={draft.locked}
                              onChange={() => setRow(res.key, toggleAction(current, a.key))}
                              className="size-[18px] cursor-pointer accent-primary disabled:cursor-default"
                            />
                          </td>
                        ))}
                        <td className="px-2 py-2.5 text-center">
                          <input
                            type="checkbox"
                            aria-label={`All ${res.label.toLowerCase()} permissions`}
                            checked={all}
                            disabled={draft.locked}
                            onChange={() => setRow(res.key, all ? [] : FULL)}
                            className="size-[18px] cursor-pointer accent-primary disabled:cursor-default"
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              ))}
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t p-5">
            <h3 className="text-sm font-semibold">
              Members <span className="font-normal text-muted-foreground">({saved.members.length})</span>
            </h3>
            {saved.members.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nobody has this role yet. Assign it from the Staff page.</p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {saved.members.map((m) => (
                  <li key={m.email} className="flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-sm">
                    <span aria-hidden className="flex size-6 items-center justify-center rounded-full bg-muted text-[10px] font-semibold">
                      {initials(m.name)}
                    </span>
                    {m.name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {message && (
            <p role="status" className="mx-5 mb-1 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
              {message}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 border-t p-4">
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="lg" className="h-10 px-4" onClick={() => addRole(saved)}>
                <Copy aria-hidden />
                Duplicate
              </Button>
              {!saved.locked && (
                <Button
                  variant="outline"
                  size="lg"
                  className="h-10 px-4 text-red-700"
                  disabled={saved.members.length > 0}
                  title={saved.members.length > 0 ? "Move its members to another role first" : undefined}
                  onClick={remove}
                >
                  <Trash2 aria-hidden />
                  Delete role
                </Button>
              )}
            </div>
            {!draft.locked && (
              <div className="flex gap-2">
                {dirty && (
                  <Button variant="ghost" size="lg" className="h-10 px-4" onClick={() => setDraft(saved)}>
                    Discard
                  </Button>
                )}
                <Button size="lg" className="h-10 px-4" disabled={!dirty || !draft.name.trim() || nameTaken || grantedCount === 0} onClick={save}>
                  Save changes
                </Button>
              </div>
            )}
          </div>
          {!saved.locked && saved.members.length > 0 && (
            <p className="px-5 pb-4 text-xs text-muted-foreground">A role with members can&apos;t be deleted. Move them to another role first.</p>
          )}
        </section>
      </div>
    </div>
  )
}
