"use client"

import { Suspense, useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ImageIcon, ListTree, Plus, Search } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Badge, inputClass } from "@/components/form"
import { LoadError, ProductCardSkeleton, RefreshButton, SkeletonGroup } from "@/components/load-state"
import { CategoriesManager } from "@/components/products/categories-manager"
import { ProductStatusBadge } from "@/components/products/status"
import { api, ApiError } from "@/lib/api"
import { companyPath, useAuth } from "@/lib/auth"
import { formatMoney, formatRentalRate, ghsEstimate } from "@/lib/format"
import type { Category, Paginated, Product } from "@/lib/types"
import { cn } from "@/lib/utils"

const STATUS_FILTERS = [
  { value: "", label: "Published and drafts" },
  { value: "PUBLISHED", label: "Published" },
  { value: "DRAFT", label: "Drafts" },
  { value: "ARCHIVED", label: "Archived" },
]

const LISTING_FILTERS = [
  { value: "", label: "Sale and rent" },
  { value: "sale", label: "For sale" },
  { value: "rent", label: "For rent" },
]

// The top bar searches by navigating to /products?search=…
export default function ProductsPage() {
  return (
    <Suspense>
      <ProductsRoute />
    </Suspense>
  )
}

function ProductsRoute() {
  const search = useSearchParams().get("search") ?? ""
  // a new search from the top bar resets the view
  return <ProductsView key={search} initialSearch={search} />
}

function ProductsView({ initialSearch }: { initialSearch: string }) {
  const { user } = useAuth()
  const rentalsEnabled = !!user?.company?.rentalsEnabled
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Paginated<Product> | null>(null)
  const [tab, setTab] = useState<string>("all")
  const [status, setStatus] = useState("")
  const [listing, setListing] = useState("")
  const [search, setSearch] = useState(initialSearch)
  const [manageOpen, setManageOpen] = useState(false)
  const [error, setError] = useState<string | null>(null) // failed actions, e.g. publish
  const [loadError, setLoadError] = useState<string | null>(null) // the list itself failed to load
  const [loading, setLoading] = useState(true)
  const [publishing, setPublishing] = useState<string | null>(null)

  const loadCategories = useCallback(
    () => api<Category[]>("GET", companyPath(user, "/categories")).then(setCategories),
    [user],
  )

  const loadProducts = useCallback(async () => {
    const params = new URLSearchParams({ pageSize: "60" })
    if (tab !== "all") params.set("categoryId", tab)
    if (status) params.set("status", status)
    if (rentalsEnabled && listing) params.set("listing", listing)
    if (search.trim()) params.set("search", search.trim())
    setLoading(true)
    try {
      setProducts(await api<Paginated<Product>>("GET", companyPath(user, `/products?${params}`)))
      setLoadError(null)
    } catch (e) {
      setLoadError(e instanceof ApiError ? e.message : "Couldn't load your products.")
    } finally {
      setLoading(false)
    }
  }, [user, tab, status, listing, rentalsEnabled, search])

  // categories failing just hides the tabs; the product list shows the error
  useEffect(() => {
    loadCategories().catch(() => {})
  }, [loadCategories])

  // debounce typing in the search box
  useEffect(() => {
    const t = setTimeout(loadProducts, 250)
    return () => clearTimeout(t)
  }, [loadProducts])

  const refresh = () => {
    setError(null)
    loadCategories().catch(() => {})
    loadProducts()
  }

  async function publish(product: Product) {
    setPublishing(product.id)
    try {
      await api("POST", companyPath(user, `/products/${product.id}/publish`))
      await loadProducts()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not publish")
    } finally {
      setPublishing(null)
    }
  }

  const tabs = [
    { id: "all", label: "All" },
    ...categories.map((c) => ({ id: c.id, label: c.name, count: c.productCount })),
    { id: "none", label: "Uncategorised" },
  ]

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-5 p-6 md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
          <p className="text-sm text-muted-foreground">Your catalog. Only published products appear on your website.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="lg"
            className="h-10"
            aria-expanded={manageOpen}
            aria-controls="categories-manager"
            onClick={() => setManageOpen((o) => !o)}
          >
            <ListTree aria-hidden />
            Manage categories
          </Button>
          <Link href="/products/new" className={cn(buttonVariants({ size: "lg" }), "h-10 px-4")}>
            <Plus aria-hidden />
            Add product
          </Link>
        </div>
      </div>

      {manageOpen && (
        <CategoriesManager
          basePath={companyPath(user, "/categories")}
          categories={categories}
          onChanged={async () => {
            await loadCategories()
            await loadProducts()
          }}
          onClose={() => setManageOpen(false)}
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="group" aria-label="Filter by category" className="flex flex-wrap gap-1.5 rounded-xl bg-muted p-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={tab === t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex h-8 items-center gap-2 rounded-lg px-3 text-sm",
                tab === t.id ? "bg-background font-medium shadow-sm" : "text-neutral-700",
              )}
            >
              {t.label}
              {"count" in t && <span className="text-xs text-muted-foreground">{t.count}</span>}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="relative w-60 max-w-full">
            <label htmlFor="product-search" className="sr-only">
              Search products
            </label>
            <Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" aria-hidden />
            <input
              id="product-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products"
              className={cn(inputClass, "pl-9")}
            />
          </div>
          <label htmlFor="status-filter" className="sr-only">
            Status
          </label>
          <select id="status-filter" value={status} onChange={(e) => setStatus(e.target.value)} className={cn(inputClass, "w-auto")}>
            {STATUS_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
          {rentalsEnabled && (
            <>
              <label htmlFor="listing-filter" className="sr-only">
                Sale or rent
              </label>
              <select id="listing-filter" value={listing} onChange={(e) => setListing(e.target.value)} className={cn(inputClass, "w-auto")}>
                {LISTING_FILTERS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </>
          )}
          <RefreshButton onClick={refresh} busy={loading} label="Refresh products" />
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {/* a refresh failed but we still have the last list: keep it, say so */}
      {loadError && products !== null && (
        <p role="alert" className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {loadError} Showing the last list we loaded.
          <button type="button" onClick={refresh} className="font-medium underline underline-offset-4">
            Try again
          </button>
        </p>
      )}

      {products === null ? (
        loadError ? (
          <LoadError message={loadError} onRetry={refresh} retrying={loading} />
        ) : (
          <SkeletonGroup label="Loading products…" className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
            {Array.from({ length: 8 }, (_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </SkeletonGroup>
        )
      ) : products.items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-4 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            {search || status || listing || tab !== "all" ? "No products match these filters." : "No products yet. Add your first one."}
          </p>
          <Link href="/products/new" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-10 px-4")}>
            <Plus aria-hidden />
            Add product
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
          {products.items.map((p) => {
            const cover = p.images[0]?.url
            const canPublish = p.status === "DRAFT" && p.publishChecklist.length === 0
            return (
              <article key={p.id} className="flex flex-col overflow-hidden rounded-xl border">
                <div className="relative flex h-44 items-center justify-center bg-muted text-muted-foreground">
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element -- R2 URLs are already sized; no image optimizer needed in the portal
                    <img src={cover} alt="" className="size-full object-cover" />
                  ) : (
                    <span className="flex flex-col items-center gap-1.5 text-xs">
                      <ImageIcon className="size-7" aria-hidden />
                      No photos yet
                    </span>
                  )}
                  <ProductStatusBadge product={p} className="absolute left-2.5 top-2.5 shadow-sm" />
                  {rentalsEnabled && p.rental && (
                    <Badge tone="amber" className="absolute right-2.5 top-2.5 shadow-sm">
                      {p.forSale ? "Sale & rent" : "For rent"}
                    </Badge>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-2.5 px-4 pb-4 pt-3.5">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {p.category?.name ?? "Uncategorised"}
                    </span>
                    <h2 className="text-[15px] font-semibold leading-snug">{p.name}</h2>
                  </div>
                  <div className="flex flex-col gap-1">
                    {/* rent-only products have no sale price to show */}
                    {(!rentalsEnabled || p.forSale) && (
                      <div className="flex items-baseline gap-2">
                        {p.price !== null ? (
                          <>
                            <span className="font-semibold tabular-nums">{formatMoney(p.price, p.currency)}</span>
                            {ghsEstimate(p.price, p.currency) && (
                              <span className="text-xs tabular-nums text-muted-foreground">≈ {ghsEstimate(p.price, p.currency)}</span>
                            )}
                          </>
                        ) : (
                          <span className="text-sm text-muted-foreground">No price yet</span>
                        )}
                      </div>
                    )}
                    {rentalsEnabled && p.rental && (
                      <span className="text-sm tabular-nums">
                        <span className="text-muted-foreground">Rent </span>
                        <span className="font-semibold">{formatRentalRate(p.rental)}</span>
                      </span>
                    )}
                  </div>
                  <div className="mt-auto flex items-center justify-between gap-2 border-t pt-2.5">
                    <span className="text-xs text-muted-foreground">
                      {p.status === "PUBLISHED"
                        ? "On your website"
                        : p.status === "ARCHIVED"
                          ? "Archived"
                          : canPublish
                            ? "Ready to publish"
                            : `Needs: ${p.publishChecklist.map((k) => (k === "offer" ? "sale or rent" : k)).join(", ")}`}
                    </span>
                    <div className="flex gap-1.5">
                      <Link href={`/products/${p.id}`} className={buttonVariants({ variant: "outline" })}>
                        Edit
                      </Link>
                      {canPublish && (
                        <Button disabled={publishing === p.id} onClick={() => publish(p)}>
                          {publishing === p.id ? "Publishing…" : "Publish"}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
      {products && products.total > products.items.length && (
        <p className="text-sm text-muted-foreground">
          Showing {products.items.length} of {products.total}. Narrow the list with search or filters.
        </p>
      )}
    </div>
  )
}
