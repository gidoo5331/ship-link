"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Check, ImageIcon } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, Field, inputClass, textareaClass } from "@/components/form"
import {
  AvailabilityField,
  CategoryField,
  FeaturesField,
  OfferField,
  offerError,
  offerFrom,
  type OfferState,
  parsePrice,
  PriceField,
  SpecsField,
  specsFromTemplate,
} from "@/components/products/fields"
import { ImageManager } from "@/components/products/image-manager"
import { apiErrorText, PublishChecklist, publishChecklistKeys, toProductPayload } from "@/components/products/product-form"
import { AVAILABILITY_LABELS } from "@/components/products/status"
import { api } from "@/lib/api"
import { companyPath, useAuth } from "@/lib/auth"
import { formatMoney, formatRentalRate, ghsEstimate } from "@/lib/format"
import type { Category, Product, ProductAvailability, ProductSpec } from "@/lib/types"
import { cn } from "@/lib/utils"

const STEPS = ["Basics", "Photos", "Details", "Review"] as const

type Details = {
  price: string
  currency: string
  description: string
  availability: ProductAvailability
  leadTime: string
  specs: ProductSpec[]
  features: string[]
  offer: OfferState
}

function detailsFrom(p: Product): Details {
  return {
    offer: offerFrom(p),
    price: p.price != null ? String(p.price) : "",
    currency: p.currency,
    description: p.description ?? "",
    availability: p.availability,
    leadTime: p.leadTime ?? "",
    specs: p.specs,
    features: p.features,
  }
}

// Which step fixes each publish-checklist item
const FIX_STEP: Record<string, number> = { photo: 2, category: 1, offer: 3, price: 3, description: 3 }

// New products are created in four steps. The draft is saved after step 1,
// and every step saves, so leaving part-way keeps a draft. Progress lives in
// the URL (?id=…&step=…) so a reload resumes where you were.
export function ProductWizard() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useSearchParams()
  const productId = params.get("id")
  const step = productId ? Math.min(4, Math.max(1, Number(params.get("step")) || 1)) : 1

  const [product, setProduct] = useState<Product | null>(null)
  const [categories, setCategories] = useState<Category[] | null>(null)
  const [name, setName] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [details, setDetails] = useState<Details | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  const rentalsEnabled = !!user?.company?.rentalsEnabled
  const productsPath = companyPath(user, "/products")

  useEffect(() => {
    api<Category[]>("GET", companyPath(user, "/categories"))
      .then(setCategories)
      .catch(() => setCategories([]))
  }, [user])

  // resume a draft from the URL
  useEffect(() => {
    if (!productId || product?.id === productId) return
    api<Product>("GET", `${productsPath}/${productId}`)
      .then((p) => {
        setProduct(p)
        setName(p.name)
        setCategoryId(p.categoryId ?? "")
        setDetails(detailsFrom(p))
      })
      .catch(() => setLoadError("This draft couldn't be loaded."))
  }, [productId, product?.id, productsPath])

  const goTo = useCallback(
    (next: number, id = productId) => {
      setError(null)
      router.replace(`/products/new?id=${id}&step=${next}`, { scroll: false })
      window.scrollTo({ top: 0 })
    },
    [router, productId],
  )

  async function run(fn: () => Promise<void>) {
    setBusy(true)
    setError(null)
    try {
      await fn()
    } catch (e) {
      setError(apiErrorText(e))
    } finally {
      setBusy(false)
    }
  }

  // ── Step 1: create the draft (or update it when coming back) ───────────────

  const saveBasics = () =>
    run(async () => {
      if (!name.trim()) {
        setError("Give the product a name.")
        return
      }
      const template = categories?.find((c) => c.id === categoryId)?.specTemplate ?? []

      if (!product) {
        const created = await api<Product>("POST", productsPath, {
          name: name.trim(),
          categoryId: categoryId || null,
          specs: specsFromTemplate(template),
        })
        setProduct(created)
        setDetails(detailsFrom(created))
        goTo(2, created.id)
        return
      }

      const categoryChanged = (product.categoryId ?? "") !== categoryId
      const untouchedSpecs = product.specs.every((s) => !s.value.trim())
      const updated = await api<Product>("PATCH", `${productsPath}/${product.id}`, {
        name: name.trim(),
        categoryId: categoryId || null,
        ...(categoryChanged && untouchedSpecs && { specs: specsFromTemplate(template) }),
      })
      setProduct(updated)
      setDetails(detailsFrom(updated))
      goTo(2)
    })

  // ── Step 3: save details ──────────────────────────────────────────────────

  async function persistDetails() {
    if (!product || !details) return false
    const price = parsePrice(details.price)
    if (price !== null && Number.isNaN(price)) {
      setError("Price must be a number.")
      return false
    }
    const rentalError = rentalsEnabled ? offerError(details.offer) : null
    if (rentalError) {
      setError(rentalError)
      return false
    }
    const updated = await api<Product>(
      "PATCH",
      `${productsPath}/${product.id}`,
      toProductPayload({ ...details, categoryId: product.categoryId ?? "" }, rentalsEnabled),
    )
    setProduct(updated)
    setDetails(detailsFrom(updated))
    return true
  }

  const saveDetailsAndGo = (next: number) =>
    run(async () => {
      if (await persistDetails()) goTo(next)
    })

  // ── Step 4: publish ───────────────────────────────────────────────────────

  const publish = () =>
    run(async () => {
      await api<Product>("POST", `${productsPath}/${product!.id}/publish`)
      router.push("/products")
    })

  const exit = () =>
    run(async () => {
      if (step === 3 && !(await persistDetails())) return
      router.push("/products")
    })

  // ── Render ────────────────────────────────────────────────────────────────

  if (loadError) {
    return (
      <div className="flex flex-col items-start gap-3 p-8">
        <p role="alert" className="text-sm text-red-700">
          {loadError}
        </p>
        <Link href="/products" className="text-sm font-medium underline">
          Back to products
        </Link>
      </div>
    )
  }

  if (productId && (!product || !details)) {
    return (
      <p className="p-8 text-sm text-muted-foreground" role="status">
        Loading draft…
      </p>
    )
  }

  const missing = product?.publishChecklist ?? []

  return (
    <div className="flex flex-col">
      <header className="flex flex-wrap items-center gap-3 border-b px-6 py-3 md:px-8">
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
          <Link href="/products" className="hover:text-foreground">
            Products
          </Link>
          <span aria-hidden className="px-1.5">
            /
          </span>
          <span className="font-medium text-foreground">{product?.name || "New product"}</span>
        </nav>
        <div className="ml-auto">
          {product ? (
            <Button variant="outline" size="lg" className="h-10 px-4" disabled={busy} onClick={exit}>
              Save draft &amp; exit
            </Button>
          ) : (
            <Link href="/products" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-10 px-4")}>
              Cancel
            </Link>
          )}
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-8 md:px-8">
        <ol aria-label="Steps" className="grid grid-cols-4 gap-2">
          {STEPS.map((label, i) => {
            const n = i + 1
            const done = n < step
            const current = n === step
            const reachable = !!product && !current
            const inner = (
              <>
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                    done && "bg-primary text-primary-foreground",
                    current && "border-2 border-primary text-foreground",
                    !done && !current && "border text-muted-foreground",
                  )}
                >
                  {done ? <Check className="size-3.5" strokeWidth={3} aria-hidden /> : n}
                </span>
                {/* on phones only the current step is labelled */}
                <span className={cn("text-sm", current ? "font-semibold" : "hidden text-muted-foreground sm:inline")}>{label}</span>
              </>
            )
            return (
              <li key={label} aria-current={current ? "step" : undefined} className="flex flex-col gap-2">
                <span className={cn("h-1 rounded-full", n <= step ? "bg-primary" : "bg-muted")} aria-hidden />
                {reachable ? (
                  <button
                    type="button"
                    onClick={() => (step === 3 ? saveDetailsAndGo(n) : goTo(n))}
                    className="flex items-center gap-2 rounded-md text-left hover:underline"
                  >
                    {inner}
                  </button>
                ) : (
                  <span className="flex items-center gap-2">{inner}</span>
                )}
              </li>
            )
          })}
        </ol>

        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        {/* ── Step 1 ── */}
        {step === 1 && (
          <Card aria-labelledby="step-h" className="flex flex-col gap-5 p-6">
            <div className="flex flex-col gap-1">
              <h1 id="step-h" className="text-xl font-semibold tracking-tight">
                What are you adding?
              </h1>
              <p className="text-sm text-muted-foreground">It&apos;s saved as a draft. Nothing goes on your website until you publish.</p>
            </div>
            <form
              className="flex flex-col gap-4"
              onSubmit={(e) => {
                e.preventDefault()
                saveBasics()
              }}
            >
              <Field label="Name" htmlFor="name">
                <input
                  id="name"
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. 2021 Toyota Camry"
                />
              </Field>
              <CategoryField
                categories={categories}
                value={categoryId}
                onChange={setCategoryId}
                hint="Its spec fields are filled in for you in the Details step."
              />
              <div className="flex items-center justify-between gap-2 border-t pt-5">
                {/* nothing is saved until Continue; once it is, the header offers "Save draft & exit" */}
                {product ? (
                  <span />
                ) : (
                  <Link href="/products" className={cn(buttonVariants({ variant: "ghost", size: "lg" }), "h-10 px-4")}>
                    Cancel
                  </Link>
                )}
                <Button type="submit" size="lg" className="h-10 px-5" disabled={busy || !name.trim()}>
                  {busy ? "Saving…" : "Continue"}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* ── Step 2 ── */}
        {step === 2 && product && (
          <Card aria-labelledby="step-h" className="flex flex-col gap-5 p-6">
            <div className="flex flex-col gap-1">
              <h1 id="step-h" className="text-xl font-semibold tracking-tight">
                Add photos
              </h1>
              <p className="text-sm text-muted-foreground">
                The first photo is the cover on your website. JPG, PNG or WebP, up to 5 MB each. You need at least one to publish.
              </p>
            </div>
            <ImageManager productPath={`${productsPath}/${product.id}`} product={product} onChange={setProduct} />
            <StepButtons
              onBack={() => goTo(1)}
              onNext={() => goTo(3)}
              nextLabel={product.images.length ? "Continue" : "Skip for now"}
              busy={busy}
            />
          </Card>
        )}

        {/* ── Step 3 ── */}
        {step === 3 && product && details && (
          <Card aria-labelledby="step-h" className="flex flex-col gap-6 p-6">
            <div className="flex flex-col gap-1">
              <h1 id="step-h" className="text-xl font-semibold tracking-tight">
                Price and details
              </h1>
              <p className="text-sm text-muted-foreground">What customers read on the product page.</p>
            </div>
            {rentalsEnabled ? (
              <OfferField
                offer={details.offer}
                onChange={(offer) => setDetails({ ...details, offer })}
                price={details.price}
                currency={details.currency}
                onPriceChange={(price) => setDetails({ ...details, price })}
                onCurrencyChange={(currency) => setDetails({ ...details, currency })}
              />
            ) : (
              <PriceField
                price={details.price}
                currency={details.currency}
                onPriceChange={(price) => setDetails({ ...details, price })}
                onCurrencyChange={(currency) => setDetails({ ...details, currency })}
              />
            )}
            <Field label="Description" htmlFor="description">
              <textarea
                id="description"
                rows={4}
                value={details.description}
                onChange={(e) => setDetails({ ...details, description: e.target.value })}
                className={textareaClass}
                placeholder="Condition, history, what's included…"
              />
            </Field>
            <section aria-labelledby="specs-h" className="flex flex-col gap-2">
              <h2 id="specs-h" className="text-sm font-medium">
                Specifications <span className="font-normal text-muted-foreground">(empty ones are hidden)</span>
              </h2>
              <SpecsField specs={details.specs} onChange={(specs) => setDetails({ ...details, specs })} />
            </section>
            <section aria-labelledby="features-h" className="flex flex-col gap-2">
              <h2 id="features-h" className="text-sm font-medium">
                Features <span className="font-normal text-muted-foreground">(optional)</span>
              </h2>
              <FeaturesField features={details.features} onChange={(features) => setDetails({ ...details, features })} />
            </section>
            <section aria-labelledby="availability-h" className="flex flex-col gap-2">
              <h2 id="availability-h" className="text-sm font-medium">
                Availability
              </h2>
              <AvailabilityField
                value={details.availability}
                leadTime={details.leadTime}
                onChange={(availability) => setDetails({ ...details, availability })}
                onLeadTimeChange={(leadTime) => setDetails({ ...details, leadTime })}
              />
            </section>
            <StepButtons onBack={() => saveDetailsAndGo(2)} onNext={() => saveDetailsAndGo(4)} nextLabel="Continue" busy={busy} />
          </Card>
        )}

        {/* ── Step 4 ── */}
        {step === 4 && product && (
          <Card aria-labelledby="step-h" className="flex flex-col gap-6 p-6">
            <div className="flex flex-col gap-1">
              <h1 id="step-h" className="text-xl font-semibold tracking-tight">
                Review and publish
              </h1>
              <p className="text-sm text-muted-foreground">This is how it appears in your website&apos;s product list.</p>
            </div>

            <div className="flex flex-wrap gap-6">
              <ProductPreview product={product} rentalsEnabled={rentalsEnabled} />
              <div className="flex min-w-60 flex-1 flex-col gap-3">
                <h2 className="text-sm font-medium">{missing.length ? "Before you can publish" : "Ready to publish"}</h2>
                <PublishChecklist
                  keys={publishChecklistKeys(rentalsEnabled, !rentalsEnabled || product.forSale)}
                  missing={missing}
                  renderAction={(key) => (
                    <button type="button" onClick={() => goTo(FIX_STEP[key])} className="text-sm font-medium underline underline-offset-4">
                      Add
                    </button>
                  )}
                />
                <p className="text-sm text-muted-foreground">You can change anything later, even after it&apos;s published.</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-5">
              <Button variant="ghost" size="lg" className="h-10" onClick={() => goTo(3)}>
                <ArrowLeft aria-hidden />
                Back
              </Button>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="lg" className="h-10 px-4" disabled={busy} onClick={() => router.push("/products")}>
                  Save as draft
                </Button>
                <Button size="lg" className="h-10 px-5" disabled={busy || missing.length > 0} onClick={publish}>
                  {busy ? "Publishing…" : "Publish to website"}
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

function StepButtons({ onBack, onNext, nextLabel, busy }: { onBack: () => void; onNext: () => void; nextLabel: string; busy: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2 border-t pt-5">
      <Button variant="ghost" size="lg" className="h-10" disabled={busy} onClick={onBack}>
        <ArrowLeft aria-hidden />
        Back
      </Button>
      <Button size="lg" className="h-10 px-5" disabled={busy} onClick={onNext}>
        {busy ? "Saving…" : nextLabel}
      </Button>
    </div>
  )
}

function ProductPreview({ product, rentalsEnabled }: { product: Product; rentalsEnabled: boolean }) {
  const cover = product.images[0]?.url
  const ghs = product.price !== null ? ghsEstimate(product.price, product.currency) : null
  const specs = product.specs.filter((s) => s.value.trim()).slice(0, 2)

  return (
    <div className="w-64 shrink-0 overflow-hidden rounded-xl border" aria-label="Website preview">
      <div className="flex h-40 items-center justify-center bg-muted text-muted-foreground">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element -- storage URL preview
          <img src={cover} alt="" className="size-full object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-1 text-xs">
            <ImageIcon className="size-7" aria-hidden />
            No cover photo
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1.5 p-4">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{product.category?.name ?? "No category"}</span>
        <span className="text-sm font-semibold leading-snug">{product.name}</span>
        {!product.forSale ? null : product.price !== null ? (
          <span className="text-sm">
            <span className="font-semibold tabular-nums">{ghs ?? formatMoney(product.price, product.currency)}</span>
            {ghs && <span className="text-muted-foreground"> · {formatMoney(product.price, product.currency)}</span>}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">No price yet</span>
        )}
        {rentalsEnabled && product.rental && (
          <span className="text-sm">
            <span className="text-muted-foreground">For rent: </span>
            <span className="font-semibold tabular-nums">{formatRentalRate(product.rental)}</span>
          </span>
        )}
        {specs.length > 0 && (
          <span className="text-xs text-muted-foreground">{specs.map((s) => `${s.label}: ${s.value}`).join(" · ")}</span>
        )}
        <span className="text-xs text-muted-foreground">
          {AVAILABILITY_LABELS[product.availability]}
          {product.availability === "ON_REQUEST" && product.leadTime ? ` · ${product.leadTime}` : ""}
        </span>
      </div>
    </div>
  )
}
