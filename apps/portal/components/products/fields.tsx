"use client"

// Form sections shared by the new-product steps and the product editor.

import { useState } from "react"
import { Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Field, inputClass, selectClass, textareaClass } from "@/components/form"
import { AVAILABILITY_LABELS } from "@/components/products/status"
import { ghsEstimate } from "@/lib/format"
import type { Category, Product, ProductAvailability, ProductSpec, RentalUnit } from "@/lib/types"
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
      hint={categories?.length === 0 ? "No categories yet. Add them from Products → Categories in the menu." : hint}
    >
      <select
        id="category"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={categories === null}
        className={selectClass}
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
        <select id="currency" value={currency} onChange={(e) => onCurrencyChange(e.target.value)} className={cn(selectClass, "w-24 shrink-0")}>
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

// ── Sale and rental ─────────────────────────────────────────────────────────

export type OfferState = {
  forSale: boolean
  forRent: boolean
  rentalRate: string
  rentalCurrency: string
  rentalUnit: RentalUnit
  rentalNotes: string
}

export function offerFrom(p: Product): OfferState {
  return {
    forSale: p.forSale,
    forRent: !!p.rental,
    rentalRate: p.rental ? String(p.rental.rate) : "",
    rentalCurrency: p.rental?.currency ?? "GHS",
    rentalUnit: p.rental?.unit ?? "DAY",
    rentalNotes: p.rental?.notes ?? "",
  }
}

// What's wrong with the rental part, if anything
export function offerError(o: OfferState): string | null {
  if (!o.forRent) return null
  const rate = parsePrice(o.rentalRate)
  if (rate === null) return "Enter a rental rate, or untick “For rent”."
  if (Number.isNaN(rate)) return "Rental rate must be a number."
  return null
}

export function offerPayload(o: OfferState) {
  return {
    forSale: o.forSale,
    rental: o.forRent
      ? { rate: parsePrice(o.rentalRate), currency: o.rentalCurrency, unit: o.rentalUnit, notes: o.rentalNotes.trim() || null }
      : null,
  }
}

const UNIT_LABELS: Record<RentalUnit, string> = { DAY: "per day", WEEK: "per week", MONTH: "per month" }

// Shown instead of the plain price field when the company does rentals.
// The sale price lives under "For sale"; the rental rate under "For rent".
export function OfferField({
  offer,
  onChange,
  price,
  currency,
  onPriceChange,
  onCurrencyChange,
}: {
  offer: OfferState
  onChange: (offer: OfferState) => void
  price: string
  currency: string
  onPriceChange: (price: string) => void
  onCurrencyChange: (currency: string) => void
}) {
  const set = <K extends keyof OfferState>(key: K, value: OfferState[K]) => onChange({ ...offer, [key]: value })
  const rate = parsePrice(offer.rentalRate)
  const rateInvalid = rate !== null && Number.isNaN(rate)

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-2 text-sm font-medium">How is it offered?</legend>

      <div className={cn("flex flex-col gap-3 rounded-lg border p-3", offer.forSale && "border-primary bg-muted/30")}>
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={offer.forSale}
            onChange={(e) => set("forSale", e.target.checked)}
            className="mt-0.5 size-4 shrink-0 accent-primary"
          />
          <span className="flex flex-col gap-0.5">
            <span className="text-sm font-medium">For sale</span>
            <span className="text-xs text-muted-foreground">Customers can buy it</span>
          </span>
        </label>
        {offer.forSale && (
          <div className="pl-7">
            <PriceField price={price} currency={currency} onPriceChange={onPriceChange} onCurrencyChange={onCurrencyChange} />
          </div>
        )}
      </div>

      <div className={cn("flex flex-col gap-3 rounded-lg border p-3", offer.forRent && "border-primary bg-muted/30")}>
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={offer.forRent}
            onChange={(e) => set("forRent", e.target.checked)}
            className="mt-0.5 size-4 shrink-0 accent-primary"
          />
          <span className="flex flex-col gap-0.5">
            <span className="text-sm font-medium">For rent</span>
            <span className="text-xs text-muted-foreground">Customers can enquire to rent it. You agree dates and terms with them directly.</span>
          </span>
        </label>
        {offer.forRent && (
          <div className="flex flex-col gap-3 pl-7">
            <Field label="Rental rate" htmlFor="rental-rate" error={rateInvalid ? "Enter a number, e.g. 600" : undefined}>
              <div className="flex flex-wrap gap-2">
                <label htmlFor="rental-currency" className="sr-only">
                  Rental currency
                </label>
                <select
                  id="rental-currency"
                  value={offer.rentalCurrency}
                  onChange={(e) => set("rentalCurrency", e.target.value)}
                  className={cn(selectClass, "w-24 shrink-0")}
                >
                  <option>GHS</option>
                  <option>USD</option>
                </select>
                <input
                  id="rental-rate"
                  inputMode="decimal"
                  value={offer.rentalRate}
                  onChange={(e) => set("rentalRate", e.target.value)}
                  aria-invalid={rateInvalid}
                  placeholder="0"
                  className={cn(inputClass, "min-w-24 flex-1")}
                />
                <label htmlFor="rental-unit" className="sr-only">
                  Charged
                </label>
                <select
                  id="rental-unit"
                  value={offer.rentalUnit}
                  onChange={(e) => set("rentalUnit", e.target.value as RentalUnit)}
                  className={cn(selectClass, "w-32 shrink-0")}
                >
                  {(Object.keys(UNIT_LABELS) as RentalUnit[]).map((u) => (
                    <option key={u} value={u}>
                      {UNIT_LABELS[u]}
                    </option>
                  ))}
                </select>
              </div>
            </Field>
            <Field label="Rental notes" htmlFor="rental-notes" hint="Optional. Shown on the website, e.g. driver, deposit, minimum days.">
              <textarea
                id="rental-notes"
                rows={2}
                maxLength={500}
                value={offer.rentalNotes}
                onChange={(e) => set("rentalNotes", e.target.value)}
                placeholder="e.g. Comes with a driver. GH₵2,000 refundable deposit."
                className={textareaClass}
              />
            </Field>
          </div>
        )}
      </div>

      {!offer.forSale && !offer.forRent && (
        <p className="text-sm text-amber-800">Tick at least one to publish it.</p>
      )}
    </fieldset>
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
