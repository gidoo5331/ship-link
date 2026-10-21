"use client"

// Form sections shared by the new-product steps and the product editor.

import { useState } from "react"
import { Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Field, inputClass } from "@/components/form"
import { AVAILABILITY_LABELS } from "@/components/products/status"
import { ghsEstimate } from "@/lib/format"
import type { Category, ProductAvailability, ProductSpec } from "@/lib/types"
import { cn } from "@/lib/utils"

const AVAILABILITY_HINTS: Record<ProductAvailability, string> = {
  AVAILABLE: "In stock or already sourced",
  ON_REQUEST: "Imported to order, with a lead time",
  SOLD: "Hidden from listings; its link shows it as sold",
}

export function parsePrice(text: string): number | null {
  const clean = text.replace(/,/g, "").trim()
  return clean === "" ? null : Number(clean)
}

// Spec rows for a category's template; keeps typed values when labels match
export function specsFromTemplate(template: string[], current: ProductSpec[] = []): ProductSpec[] {
  return template.map((label) => ({ label, value: current.find((s) => s.label === label)?.value ?? "" }))
}

// ── Category ────────────────────────────────────────────────────────────────

export function CategoryField({
  categories,
  value,
  onChange,
  hint,
}: {
  categories: Category[] | null // null while loading
  value: string
  onChange: (categoryId: string) => void
  hint?: string
}) {
  return (
    <Field
      label="Category"
      htmlFor="category"
      hint={categories?.length === 0 ? "No categories yet. Add them from Products → Manage categories." : hint}
    >
      <select
        id="category"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={categories === null}
        className={inputClass}
      >
        <option value="">{categories === null ? "Loading…" : "No category"}</option>
        {categories?.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    </Field>
  )
}

// ── Price ───────────────────────────────────────────────────────────────────

export function PriceField({
  price,
  currency,
  onPriceChange,
  onCurrencyChange,
}: {
  price: string
  currency: string
  onPriceChange: (price: string) => void
  onCurrencyChange: (currency: string) => void
}) {
  const amount = parsePrice(price)
  const ghs = amount !== null && !Number.isNaN(amount) ? ghsEstimate(amount, currency) : null
  const invalid = amount !== null && Number.isNaN(amount)

  return (
    <Field
      label="Price estimate"
      htmlFor="price"
      hint={ghs ? `Shown on the website as ≈ ${ghs}` : undefined}
      error={invalid ? "Enter a number, e.g. 22500" : undefined}
    >
      <div className="flex gap-2">
        <label htmlFor="currency" className="sr-only">
          Currency
        </label>
        <select id="currency" value={currency} onChange={(e) => onCurrencyChange(e.target.value)} className={cn(inputClass, "w-24 shrink-0")}>
          <option>USD</option>
          <option>GHS</option>
        </select>
        <input
          id="price"
          inputMode="decimal"
          value={price}
          onChange={(e) => onPriceChange(e.target.value)}
          aria-invalid={invalid}
          className={inputClass}
          placeholder="0"
        />
      </div>
    </Field>
  )
}

// ── Availability ────────────────────────────────────────────────────────────

export function AvailabilityField({
  value,
  leadTime,
  onChange,
  onLeadTimeChange,
}: {
  value: ProductAvailability
  leadTime: string
  onChange: (value: ProductAvailability) => void
  onLeadTimeChange: (leadTime: string) => void
}) {
  return (
    <div className="flex flex-col gap-3">
      <fieldset className="flex flex-col gap-2">
        <legend className="sr-only">Availability</legend>
        {(Object.keys(AVAILABILITY_LABELS) as ProductAvailability[]).map((a) => (
          <label
            key={a}
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-lg border p-3 has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/40",
              value === a && "border-primary bg-muted/40",
            )}
          >
            <input
              type="radio"
              name="availability"
              value={a}
              checked={value === a}
              onChange={() => onChange(a)}
              className="mt-0.5 size-4 accent-primary"
            />
            <span className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">{AVAILABILITY_LABELS[a]}</span>
              <span className="text-xs text-muted-foreground">{AVAILABILITY_HINTS[a]}</span>
            </span>
          </label>
        ))}
      </fieldset>
      {value === "ON_REQUEST" && (
        <Field label="Lead time" htmlFor="lead-time">
          <input id="lead-time" value={leadTime} onChange={(e) => onLeadTimeChange(e.target.value)} placeholder="e.g. 6–8 weeks" className={inputClass} />
        </Field>
      )}
    </div>
  )
}

// ── Specs ───────────────────────────────────────────────────────────────────

export function SpecsField({ specs, onChange }: { specs: ProductSpec[]; onChange: (specs: ProductSpec[]) => void }) {
  const update = (i: number, patch: Partial<ProductSpec>) => onChange(specs.map((s, j) => (j === i ? { ...s, ...patch } : s)))

  return (
    <div className="flex flex-col gap-3">
      {specs.length > 0 && (
        <div className="flex flex-col gap-2">
          {specs.map((spec, i) => (
            <div key={i} className="flex items-center gap-2">
              <label htmlFor={`spec-label-${i}`} className="sr-only">
                Spec name
              </label>
              <input
                id={`spec-label-${i}`}
                value={spec.label}
                onChange={(e) => update(i, { label: e.target.value })}
                placeholder="Name"
                className={cn(inputClass, "w-36 shrink-0 bg-muted/50 sm:w-56")}
              />
              <label htmlFor={`spec-value-${i}`} className="sr-only">
                {spec.label || "Spec"} value
              </label>
              <input
                id={`spec-value-${i}`}
                value={spec.value}
                onChange={(e) => update(i, { value: e.target.value })}
                placeholder="Value"
                className={inputClass}
              />
              <Button
                variant="outline"
                size="icon-lg"
                className="size-10 shrink-0"
                onClick={() => onChange(specs.filter((_, j) => j !== i))}
                aria-label={`Remove ${spec.label || "spec"}`}
              >
                <X aria-hidden />
              </Button>
            </div>
          ))}
        </div>
      )}
      <Button variant="outline" size="lg" className="self-start" onClick={() => onChange([...specs, { label: "", value: "" }])}>
        <Plus aria-hidden />
        Add spec
      </Button>
    </div>
  )
}

// ── Features ────────────────────────────────────────────────────────────────

export function FeaturesField({ features, onChange }: { features: string[]; onChange: (features: string[]) => void }) {
  const [draft, setDraft] = useState("")

  function add() {
    const value = draft.trim()
    if (value && !features.includes(value)) onChange([...features, value])
    setDraft("")
  }

  return (
    <div className="flex flex-col gap-3">
      {features.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {features.map((f) => (
            <li key={f} className="flex h-8 items-center gap-1 rounded-full bg-muted pl-3 pr-1 text-sm font-medium">
              {f}
              <button
                type="button"
                onClick={() => onChange(features.filter((x) => x !== f))}
                aria-label={`Remove ${f}`}
                className="flex size-6 items-center justify-center rounded-full text-muted-foreground hover:bg-background"
              >
                <X className="size-3" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex max-w-md gap-2">
        <label htmlFor="feature" className="sr-only">
          Add a feature
        </label>
        <input
          id="feature"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              add()
            }
          }}
          placeholder="e.g. Reverse camera"
          className={inputClass}
        />
        <Button variant="outline" size="lg" className="h-10" disabled={!draft.trim()} onClick={add}>
          Add
        </Button>
      </div>
    </div>
  )
}
