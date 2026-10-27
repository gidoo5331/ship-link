"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge, Card, Field, inputClass, textareaClass } from "@/components/form"
import {
  AvailabilityField,
  CategoryField,
  FeaturesField,
  OfferField,
  offerError,
  offerFrom,
  offerPayload,
  type OfferState,
  parsePrice,
  PriceField,
  SpecsField,
  specsFromTemplate,
} from "@/components/products/fields"
import { ImageManager } from "@/components/products/image-manager"
import { api, ApiError } from "@/lib/api"
import { companyPath, useAuth } from "@/lib/auth"
import { CHECKLIST_LABELS } from "@/lib/format"
import type { Category, Product, ProductAvailability, ProductSpec } from "@/lib/types"
import { cn } from "@/lib/utils"

type FormState = {
  name: string
  categoryId: string
  price: string
  currency: string
  description: string
  availability: ProductAvailability
  leadTime: string
  specs: ProductSpec[]
  features: string[]
  offer: OfferState
}

function toForm(p: Product): FormState {
  return {
    offer: offerFrom(p),
    name: p.name,
    categoryId: p.categoryId ?? "",
    price: p.price != null ? String(p.price) : "",
    currency: p.currency,
    description: p.description ?? "",
    availability: p.availability,
    leadTime: p.leadTime ?? "",
    specs: p.specs,
    features: p.features,
  }
}

// Sale/rental settings are only sent while rentals are on, so turning rentals
// off in Settings never wipes a product's rental details.
export function toProductPayload(f: Omit<FormState, "name"> & { name?: string }, rentalsEnabled: boolean) {
  return {
    ...(f.name !== undefined && { name: f.name.trim() }),
    ...(rentalsEnabled && offerPayload(f.offer)),
    categoryId: f.categoryId || null,
    price: parsePrice(f.price),
    currency: f.currency,
    description: f.description.trim(),
    availability: f.availability,
    leadTime: f.availability === "ON_REQUEST" ? f.leadTime.trim() || null : null,
    specs: f.specs.filter((s) => s.label.trim()).map((s) => ({ label: s.label.trim(), value: s.value.trim() })),
    features: f.features,
  }
}

export function apiErrorText(e: unknown) {
  if (e instanceof ApiError) {
    const missing = e.details?.missing
    if (Array.isArray(missing)) return `Add before publishing: ${missing.map((m) => CHECKLIST_LABELS[m] ?? m).join(", ")}.`
    return e.message
  }
  return "Something went wrong. Try again."
}

// Single-page editor for an existing product. New products go through the steps in ProductWizard.
export function ProductForm({ product: initial }: { product: Product }) {
  const { user } = useAuth()
  const router = useRouter()
  const [product, setProduct] = useState<Product>(initial)
  const [form, setForm] = useState<FormState>(() => toForm(initial))
  const [saved, setSaved] = useState<FormState>(() => toForm(initial))
  const [categories, setCategories] = useState<Category[] | null>(null)
  const [busy, setBusy] = useState<null | "save" | "publish" | "unpublish" | "archive" | "delete">(null)
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null)

  const rentalsEnabled = !!user?.company?.rentalsEnabled
  const productPath = companyPath(user, `/products/${product.id}`)
  const dirty = JSON.stringify(form) !== JSON.stringify(saved)
  const published = product.status === "PUBLISHED"

  useEffect(() => {
    api<Category[]>("GET", companyPath(user, "/categories"))
      .then(setCategories)
      .catch(() => setCategories([]))
  }, [user])

  // warn before leaving with unsaved changes
  useEffect(() => {
    if (!dirty) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener("beforeunload", onBeforeUnload)
    return () => window.removeEventListener("beforeunload", onBeforeUnload)
  }, [dirty])

  // what's still missing, from the form as it is now
  const checklist = useMemo(() => {
    const missing: string[] = []
    if (!product.images.length) missing.push("photo")
    if (!form.categoryId) missing.push("category")
    const forSale = !rentalsEnabled || form.offer.forSale
    if (rentalsEnabled && !form.offer.forSale && !form.offer.forRent) missing.push("offer")
    if (forSale && form.price.trim() === "") missing.push("price")
    if (!form.description.trim()) missing.push("description")
    return missing
  }, [form, product, rentalsEnabled])

  const checklistKeys = publishChecklistKeys(rentalsEnabled, !rentalsEnabled || form.offer.forSale)

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }))

  function changeCategory(categoryId: string) {
    const template = categories?.find((c) => c.id === categoryId)?.specTemplate ?? []
    // pre-fill spec labels when nothing has been typed yet
    setForm((f) => ({
      ...f,
      categoryId,
      specs: f.specs.every((s) => !s.value.trim()) ? specsFromTemplate(template) : f.specs,
    }))
  }

  async function save(): Promise<Product | null> {
    if (!form.name.trim()) {
      setMessage({ text: "Give the product a name.", error: true })
      return null
    }
    const payload = toProductPayload(form, rentalsEnabled)
    if (payload.price !== null && Number.isNaN(payload.price)) {
      setMessage({ text: "Price must be a number.", error: true })
      return null
    }
    const rentalError = rentalsEnabled ? offerError(form.offer) : null
    if (rentalError) {
      setMessage({ text: rentalError, error: true })
      return null
    }
    const next = await api<Product>("PATCH", productPath, payload)
    setProduct(next)
    setForm(toForm(next))
    setSaved(toForm(next))
    return next
  }

  async function act(kind: NonNullable<typeof busy>, fn: () => Promise<void>) {
    setBusy(kind)
    setMessage(null)
    try {
      await fn()
    } catch (e) {
      setMessage({ text: apiErrorText(e), error: true })
    } finally {
      setBusy(null)
    }
  }

  const onSave = () =>
    act("save", async () => {
      const next = await save()
      if (!next) return
      setMessage({
        text: next.status === "DRAFT" && published ? "Saved. It went back to draft because something required is missing." : "Saved.",
      })
    })

  const onPublish = () =>
    act("publish", async () => {
      if (dirty && !(await save())) return
      setProduct(await api<Product>("POST", `${productPath}/publish`))
      setMessage({ text: "Published. It's now on your website." })
    })

  const onUnpublish = () =>
    act("unpublish", async () => {
      setProduct(await api<Product>("POST", `${productPath}/unpublish`))
      setMessage({ text: "Unpublished. Only your team can see it now." })
    })

  const onArchive = () =>
    act("archive", async () => {
      if (!window.confirm("Archive this product? It leaves your website and the default product list.")) return
      await api("POST", `${productPath}/archive`)
      router.push("/products")
    })

  const onDelete = () =>
    act("delete", async () => {
      if (!window.confirm("Delete this product and its photos permanently?")) return
      await api("DELETE", productPath)
      router.push("/products")
    })

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-10 flex flex-wrap items-center gap-3 border-b bg-background/95 px-6 py-3 backdrop-blur md:px-8">
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
          <Link href="/products" className="hover:text-foreground">
            Products
          </Link>
          <span aria-hidden className="px-1.5">
            /
          </span>
          <span className="font-medium text-foreground">{product.name}</span>
        </nav>
        <Badge tone={published ? "green" : "neutral"} dot>
          {published ? "Published" : product.status === "ARCHIVED" ? "Archived" : "Draft"}
        </Badge>
        {dirty && <span className="text-xs text-muted-foreground">Unsaved changes</span>}
        <div className="ml-auto flex flex-wrap gap-2">
          <Button variant="outline" size="lg" className="h-10 px-4" disabled={busy !== null || !dirty} onClick={onSave}>
            {busy === "save" ? "Saving…" : published ? "Save changes" : "Save draft"}
          </Button>
          {published ? (
            <Button variant="outline" size="lg" className="h-10 px-4" disabled={busy !== null} onClick={onUnpublish}>
              {busy === "unpublish" ? "Unpublishing…" : "Unpublish"}
            </Button>
          ) : (
            <Button size="lg" className="h-10 px-4" disabled={busy !== null || checklist.length > 0} onClick={onPublish}>
              {busy === "publish" ? "Publishing…" : "Publish to website"}
            </Button>
          )}
        </div>
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
          <Card aria-labelledby="photos-h" className="flex flex-col gap-3.5">
            <div className="flex flex-col gap-1">
              <h2 id="photos-h" className="text-base font-semibold">
                Photos
              </h2>
              <p className="text-sm text-muted-foreground">The first photo is the cover on your website. JPG, PNG or WebP, up to 5 MB each.</p>
            </div>
            <ImageManager productPath={productPath} product={product} onChange={setProduct} />
          </Card>

          <Card aria-labelledby="details-h" className="flex flex-col gap-4">
            <h2 id="details-h" className="text-base font-semibold">
              Details
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" htmlFor="name" className="sm:col-span-2">
                <input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} className={inputClass} />
              </Field>
              <CategoryField categories={categories} value={form.categoryId} onChange={changeCategory} />
              {!rentalsEnabled && (
                <PriceField
                  price={form.price}
                  currency={form.currency}
                  onPriceChange={(v) => set("price", v)}
                  onCurrencyChange={(v) => set("currency", v)}
                />
              )}
              <Field label="Description" htmlFor="description" className="sm:col-span-2">
                <textarea
                  id="description"
                  rows={4}
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  className={textareaClass}
                />
              </Field>
            </div>
          </Card>

          {rentalsEnabled && (
            <Card aria-labelledby="offer-h" className="flex flex-col gap-3.5">
              <div className="flex flex-col gap-1">
                <h2 id="offer-h" className="text-base font-semibold">
                  Sale and rental
                </h2>
                <p className="text-sm text-muted-foreground">Tick both if customers can buy or rent it.</p>
              </div>
              <OfferField
                offer={form.offer}
                onChange={(v) => set("offer", v)}
                price={form.price}
                currency={form.currency}
                onPriceChange={(v) => set("price", v)}
                onCurrencyChange={(v) => set("currency", v)}
              />
            </Card>
          )}

          <Card aria-labelledby="specs-h" className="flex flex-col gap-3.5">
            <div className="flex flex-col gap-1">
              <h2 id="specs-h" className="text-base font-semibold">
                Specifications
              </h2>
              <p className="text-sm text-muted-foreground">Empty values are not shown on the website.</p>
            </div>
            <SpecsField specs={form.specs} onChange={(v) => set("specs", v)} />
          </Card>

          <Card aria-labelledby="features-h" className="flex flex-col gap-3.5">
            <h2 id="features-h" className="text-base font-semibold">
              Features
            </h2>
            <FeaturesField features={form.features} onChange={(v) => set("features", v)} />
          </Card>
        </div>

        <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-6">
          <Card aria-labelledby="website-h" className="flex flex-col gap-3">
            <h2 id="website-h" className="text-base font-semibold">
              Website
            </h2>
            <p className="text-sm leading-relaxed text-neutral-700">
              {published
                ? form.availability === "SOLD"
                  ? "Published but sold: hidden from listings, its link shows it as sold."
                  : "Live on your website."
                : "Only your team can see this product. Customers see it after you publish."}
            </p>
            {!published && <PublishChecklist keys={checklistKeys} missing={checklist} />}
          </Card>

          <Card aria-labelledby="availability-h" className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <h2 id="availability-h" className="text-base font-semibold">
                Availability
              </h2>
              <p className="text-sm text-muted-foreground">What customers see once it&apos;s published.</p>
            </div>
            <AvailabilityField
              value={form.availability}
              leadTime={form.leadTime}
              onChange={(v) => set("availability", v)}
              onLeadTimeChange={(v) => set("leadTime", v)}
            />
          </Card>

          <div className="flex flex-wrap gap-2">
            {product.status !== "ARCHIVED" && (
              <Button variant="outline" size="lg" className="h-10 px-4" disabled={busy !== null} onClick={onArchive}>
                Archive
              </Button>
            )}
            <Button variant="destructive" size="lg" className="h-10 px-4" disabled={busy !== null} onClick={onDelete}>
              Delete
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// The checklist items that apply: "offer" only when the company rents,
// "price" only when the product is for sale
export function publishChecklistKeys(rentalsEnabled: boolean, forSale: boolean) {
  return Object.keys(CHECKLIST_LABELS).filter((k) => (k === "offer" ? rentalsEnabled : k === "price" ? forSale : true))
}

export function PublishChecklist({
  keys,
  missing,
  renderAction,
}: {
  keys: string[]
  missing: string[]
  renderAction?: (key: string) => React.ReactNode
}) {
  return (
    <ul aria-label="Ready to publish" className="flex flex-col gap-2 rounded-lg bg-muted/60 p-3">
      {keys.map((key) => {
        const label = CHECKLIST_LABELS[key]
        const done = !missing.includes(key)
        return (
          <li key={key} className="flex items-center gap-2 text-sm">
            <span
              className={cn(
                "flex size-[18px] shrink-0 items-center justify-center rounded-full",
                done ? "bg-green-700 text-white" : "border-[1.5px] border-neutral-400",
              )}
            >
              {done && <Check className="size-2.5" strokeWidth={3.5} aria-hidden />}
            </span>
            <span className={cn("flex-1", !done && "text-neutral-700")}>{label}</span>
            <span className="sr-only">{done ? "(done)" : "(missing)"}</span>
            {!done && renderAction?.(key)}
          </li>
        )
      })}
    </ul>
  )
}
