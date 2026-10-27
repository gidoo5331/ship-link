"use client"

import { useState } from "react"
import { Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { inputClass } from "@/components/form"
import { api, ApiError } from "@/lib/api"
import type { Category } from "@/lib/types"

export const CATEGORIES_CHANGED = "shiplink:categories-changed"

const splitSpecs = (text: string) =>
  text
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)

export function CategoriesManager({
  basePath,
  categories,
  onChanged,
  onClose,
}: {
  basePath: string // e.g. /companies/:id/categories
  categories: Category[]
  onChanged: () => Promise<void> | void
  onClose?: () => void // panel mode: shows its own heading and a close button
}) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editSpecs, setEditSpecs] = useState("")
  const [newName, setNewName] = useState("")
  const [newSpecs, setNewSpecs] = useState("")
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null)

  async function run(action: () => Promise<unknown>, success?: string) {
    setBusy(true)
    setMessage(null)
    try {
      await action()
      await onChanged()
      // the sidebar lists categories too
      window.dispatchEvent(new Event(CATEGORIES_CHANGED))
      if (success) setMessage({ text: success })
      return true
    } catch (e) {
      setMessage({ text: e instanceof ApiError ? e.message : "Something went wrong", error: true })
      return false
    } finally {
      setBusy(false)
    }
  }

  async function add(e: React.FormEvent) {
    e.preventDefault()
    const ok = await run(() => api("POST", basePath, { name: newName.trim(), specTemplate: splitSpecs(newSpecs) }))
    if (ok) {
      setNewName("")
      setNewSpecs("")
    }
  }

  async function save(id: string) {
    const ok = await run(() => api("PATCH", `${basePath}/${id}`, { name: editName.trim(), specTemplate: splitSpecs(editSpecs) }))
    if (ok) setEditingId(null)
  }

  async function remove(category: Category) {
    const n = category.productCount
    const warning = n
      ? `Delete “${category.name}”? Its ${n} product${n === 1 ? "" : "s"} will become uncategorised (not deleted).`
      : `Delete “${category.name}”?`
    if (!window.confirm(warning)) return
    await run(() => api("DELETE", `${basePath}/${category.id}`), `“${category.name}” deleted.`)
  }

  return (
    <section
      id="categories-manager"
      {...(onClose ? { "aria-labelledby": "categories-h" } : { "aria-label": "Categories" })}
      className={`flex flex-col rounded-xl border bg-sidebar ${onClose ? "" : "pt-5"}`}
    >
      {onClose && (
        <div className="flex items-start justify-between gap-3 px-5 pb-3 pt-5">
          <div className="flex flex-col gap-1">
            <h2 id="categories-h" className="text-base font-semibold">
              Categories
            </h2>
            <p className="text-sm text-muted-foreground">
              Group your products on the website. Spec fields are pre-filled when you add a product to a category.
            </p>
          </div>
          <Button variant="outline" size="icon-lg" onClick={onClose} aria-label="Close categories">
            <X aria-hidden />
          </Button>
        </div>
      )}

      {categories.length === 0 ? (
        <div className="mx-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed bg-background p-4">
          <p className="text-sm text-muted-foreground">No categories yet. Start with Cars, Generators, Electronics and Household, then edit them.</p>
          <Button
            variant="outline"
            size="lg"
            disabled={busy}
            onClick={() => run(() => api("POST", `${basePath}/starter`))}
          >
            Add starter categories
          </Button>
        </div>
      ) : (
        <ul className="flex flex-col gap-2 px-5">
          {categories.map((c) => (
            <li key={c.id} className="rounded-lg border bg-background px-3.5 py-3">
              {editingId === c.id ? (
                <div className="flex flex-wrap items-end gap-2">
                  <div className="flex min-w-48 flex-1 flex-col gap-1.5">
                    <label htmlFor={`edit-name-${c.id}`} className="text-xs font-medium">
                      Name
                    </label>
                    <input id={`edit-name-${c.id}`} value={editName} onChange={(e) => setEditName(e.target.value)} className={inputClass} />
                  </div>
                  <div className="flex min-w-64 flex-[2] flex-col gap-1.5">
                    <label htmlFor={`edit-specs-${c.id}`} className="text-xs font-medium">
                      Spec fields <span className="font-normal text-muted-foreground">(comma separated)</span>
                    </label>
                    <input id={`edit-specs-${c.id}`} value={editSpecs} onChange={(e) => setEditSpecs(e.target.value)} className={inputClass} />
                  </div>
                  <div className="flex gap-1.5">
                    <Button variant="outline" size="lg" className="h-10" onClick={() => setEditingId(null)}>
                      Cancel
                    </Button>
                    <Button size="lg" className="h-10" disabled={busy || !editName.trim()} onClick={() => save(c.id)}>
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex min-w-60 flex-1 flex-col gap-1.5">
                    <span className="flex items-baseline gap-2">
                      <span className="text-sm font-semibold">{c.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {c.productCount} {c.productCount === 1 ? "product" : "products"}
                      </span>
                    </span>
                    <span className="flex flex-wrap gap-1.5">
                      {c.specTemplate.length ? (
                        c.specTemplate.map((s) => (
                          <span key={s} className="rounded-md bg-muted px-2 py-0.5 text-xs text-neutral-700">
                            {s}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">No spec template</span>
                      )}
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditingId(c.id)
                        setEditName(c.name)
                        setEditSpecs(c.specTemplate.join(", "))
                        setMessage(null)
                      }}
                    >
                      Edit
                    </Button>
                    <Button variant="outline" className="text-red-700" onClick={() => remove(c)} aria-label={`Delete ${c.name}`}>
                      Delete
                    </Button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {message && (
        <p role="status" className={`mx-5 mt-2 text-sm ${message.error ? "text-red-700" : "text-neutral-700"}`}>
          {message.text}
        </p>
      )}

      <form onSubmit={add} className="mx-5 mb-5 mt-4 flex flex-wrap items-end gap-2 border-t pt-4">
        <div className="flex min-w-48 flex-1 flex-col gap-1.5">
          <label htmlFor="new-category" className="text-xs font-medium">
            New category
          </label>
          <input id="new-category" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Perfumes" className={inputClass} />
        </div>
        <div className="flex min-w-64 flex-[2] flex-col gap-1.5">
          <label htmlFor="new-specs" className="text-xs font-medium">
            Spec fields <span className="font-normal text-muted-foreground">(optional, comma separated)</span>
          </label>
          <input
            id="new-specs"
            value={newSpecs}
            onChange={(e) => setNewSpecs(e.target.value)}
            placeholder="e.g. Size, Concentration, Scent family"
            className={inputClass}
          />
        </div>
        <Button type="submit" size="lg" className="h-10" disabled={busy || !newName.trim()}>
          <Plus aria-hidden />
          Add category
        </Button>
      </form>
    </section>
  )
}
