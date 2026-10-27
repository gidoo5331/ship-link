"use client"

import { useEffect, useRef, useState } from "react"
import { SlidersHorizontal, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Field, selectClass } from "@/components/form"
import type { Category } from "@/lib/types"
import { cn } from "@/lib/utils"

export const STATUS_FILTERS = [
  { value: "", label: "Published and drafts" },
  { value: "PUBLISHED", label: "Published" },
  { value: "DRAFT", label: "Drafts" },
  { value: "ARCHIVED", label: "Archived" },
]

export const LISTING_FILTERS = [
  { value: "", label: "Sale and rent" },
  { value: "sale", label: "For sale" },
  { value: "rent", label: "For rent" },
]

export type ProductFilterValues = {
  category: string // "all" | category id | "none" (uncategorised)
  status: string // "" = published and drafts
  listing: string // "" = sale and rent
}

type Props = {
  values: ProductFilterValues
  categories: Category[]
  rentalsEnabled: boolean
  onChange: (patch: Partial<ProductFilterValues>) => void
}

const DEFAULTS: ProductFilterValues = { category: "all", status: "", listing: "" }

// The filters that differ from the defaults, as removable chips
function activeFilters({ values, categories, rentalsEnabled }: Omit<Props, "onChange">) {
  const active: { key: keyof ProductFilterValues; label: string }[] = []
  if (values.category !== "all") {
    const name = values.category === "none" ? "Uncategorised" : categories.find((c) => c.id === values.category)?.name
    active.push({ key: "category", label: name ?? "Category" })
  }
  if (values.status) active.push({ key: "status", label: STATUS_FILTERS.find((f) => f.value === values.status)?.label ?? values.status })
  if (rentalsEnabled && values.listing)
    active.push({ key: "listing", label: LISTING_FILTERS.find((f) => f.value === values.listing)?.label ?? values.listing })
  return active
}

// "Filters" button with a small panel of dropdowns. Changes apply straight away.
export function ProductFiltersButton({ values, categories, rentalsEnabled, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const count = activeFilters({ values, categories, rentalsEnabled }).length

  // close on Escape (focus back to the button) or a click outside
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    const onPointer = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("keydown", onKey)
    document.addEventListener("pointerdown", onPointer)
    return () => {
      document.removeEventListener("keydown", onKey)
      document.removeEventListener("pointerdown", onPointer)
    }
  }, [open])

  return (
    <div ref={wrapRef} className="relative">
      <Button
        ref={buttonRef}
        variant="outline"
        size="lg"
        className="h-10 px-3.5"
        aria-expanded={open}
        aria-controls="product-filters"
        onClick={() => setOpen((o) => !o)}
      >
        <SlidersHorizontal aria-hidden />
        Filters
        {count > 0 && (
          <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
            {count}
            <span className="sr-only"> active</span>
          </span>
        )}
      </Button>

      {open && (
        <div
          id="product-filters"
          role="group"
          aria-label="Filter products"
          className="absolute left-0 top-full z-20 mt-2 flex w-[min(20rem,calc(100vw-3rem))] flex-col gap-3.5 rounded-xl border bg-background p-4 shadow-lg md:left-auto md:right-0"
        >
          <Field label="Category" htmlFor="category-filter">
            <select
              id="category-filter"
              autoFocus
              value={values.category}
              onChange={(e) => onChange({ category: e.target.value })}
              className={selectClass}
            >
              <option value="all">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.productCount})
                </option>
              ))}
              <option value="none">Uncategorised</option>
            </select>
          </Field>
          <Field label="Status" htmlFor="status-filter">
            <select id="status-filter" value={values.status} onChange={(e) => onChange({ status: e.target.value })} className={selectClass}>
              {STATUS_FILTERS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </Field>
          {rentalsEnabled && (
            <Field label="Sale or rent" htmlFor="listing-filter">
              <select id="listing-filter" value={values.listing} onChange={(e) => onChange({ listing: e.target.value })} className={selectClass}>
                {LISTING_FILTERS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <div className="flex items-center justify-between gap-2 border-t pt-3">
            <Button variant="ghost" disabled={count === 0} onClick={() => onChange(DEFAULTS)}>
              Clear all
            </Button>
            <Button
              onClick={() => {
                setOpen(false)
                buttonRef.current?.focus()
              }}
            >
              Done
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// The active filters under the bar; each one can be removed on its own
export function ActiveFilterChips({ values, categories, rentalsEnabled, onChange }: Props) {
  const active = activeFilters({ values, categories, rentalsEnabled })
  if (active.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground">Filtered by</span>
      <ul className="flex flex-wrap gap-2">
        {active.map((f) => (
          <li key={f.key}>
            <button
              type="button"
              onClick={() => onChange({ [f.key]: DEFAULTS[f.key] })}
              aria-label={`Remove filter: ${f.label}`}
              className={cn(
                "flex h-8 items-center gap-1.5 rounded-full border bg-muted/50 pl-3 pr-2 text-sm font-medium",
                "hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
              )}
            >
              {f.label}
              <X className="size-3.5 text-muted-foreground" aria-hidden />
            </button>
          </li>
        ))}
      </ul>
      {active.length > 1 && (
        <button type="button" onClick={() => onChange(DEFAULTS)} className="text-sm font-medium underline underline-offset-4">
          Clear all
        </button>
      )}
    </div>
  )
}
