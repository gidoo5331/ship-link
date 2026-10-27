"use client"

import { Suspense, useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ImageIcon, LayoutGrid, Plus, Rows3, Search } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Badge, inputClass } from "@/components/form"
import { LoadError, ProductCardSkeleton, RefreshButton, SkeletonGroup } from "@/components/load-state"
import { ActiveFilterChips, ProductFiltersButton, type ProductFilterValues } from "@/components/products/product-filters"
import { ProductStatusBadge } from "@/components/products/status"
import { api, ApiError } from "@/lib/api"
import { companyPath, useAuth } from "@/lib/auth"
import { formatMoney, formatRentalRate, ghsEstimate, timeAgo } from "@/lib/format"
import type { Category, Paginated, Product } from "@/lib/types"
import { cn } from "@/lib/utils"

const VIEW_KEY = "shiplink.productsView"

// The top bar searches by navigating to /products?search=…
export default function ProductsPage() {
  return (
    <Suspense>
      <ProductsRoute />
    </Suspense>
  )
}

// The category lives in the URL (?category=…) so the sidebar's category
// links and the tabs here stay in step.
function ProductsRoute() {
  const params = useSearchParams()
  const search = params.get("search") ?? ""
  const category = params.get("category") || "all"
  // a new search from the top bar resets the view
  return <ProductsView key={search} initialSearch={search} tab={category} />
}

function ProductsView({ initialSearch, tab }: { initialSearch: string; tab: string }) {
  const { user } = useAuth()
  const router = useRouter()
  const params = useSearchParams()
  const rentalsEnabled = !!user?.company?.rentalsEnabled
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Paginated<Product> | null>(null)
  const [status, setStatus] = useState("")
  const [listing, setListing] = useState("")
  const [search, setSearch] = useState(initialSearch)
  const [error, setError] = useState<string | null>(null) // failed actions, e.g. publish
  const [loadError, setLoadError] = useState<string | null>(null) // the list itself failed to load
  const [loading, setLoading] = useState(true)
  const [publishing, setPublishing] = useState<string | null>(null)
  const [view, setView] = useState<"grid" | "table">(() => {
    try {
      return localStorage.getItem(VIEW_KEY) === "table" ? "table" : "grid"
    } catch {
      return "grid"
    }
  })

  // remembered per browser
  function changeView(next: "grid" | "table") {
    setView(next)
    try {
      localStorage.setItem(VIEW_KEY, next)
    } catch {
      // storage blocked: the choice lasts until reload
    }
  }

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

  function selectTab(id: string) {
    const next = new URLSearchParams(params)
    if (id === "all") next.delete("category")
    else next.set("category", id)
    const qs = next.toString()
    router.replace(qs ? `/products?${qs}` : "/products", { scroll: false })
  }

  const filterProps = {
    values: { category: tab, status, listing },
    categories,
    rentalsEnabled,
    onChange: (patch: Partial<ProductFilterValues>) => {
      if (patch.category !== undefined) selectTab(patch.category)
      if (patch.status !== undefined) setStatus(patch.status)
      if (patch.listing !== undefined) setListing(patch.listing)
    },
  }

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

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-5 p-6 md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
          <p className="text-sm text-muted-foreground">Your catalog. Only published products appear on your website.</p>
        </div>
        <div className="flex gap-2">
          <RefreshButton onClick={refresh} busy={loading} label="Refresh products" />
          <Link href="/products/new" className={cn(buttonVariants({ size: "lg" }), "h-10 px-4")}>
            <Plus aria-hidden />
            Add product
          </Link>
        </div>
      </div>

      {/* categories are also listed under Products in the sidebar; the Filters
          panel covers phones (sidebar behind the menu) and "Uncategorised" */}
      <div className="flex flex-col gap-3">
        <div className="flex w-full flex-wrap gap-2">
          <div className="relative min-w-60 max-w-sm flex-1">
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
          <ProductFiltersButton {...filterProps} />
          <div role="group" aria-label="View" className="hidden rounded-lg border p-0.5 md:flex">
            {(
              [
                { value: "grid", label: "Grid view", icon: LayoutGrid },
                { value: "table", label: "Table view", icon: Rows3 },
              ] as const
            ).map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                aria-pressed={view === value}
                aria-label={label}
                title={label}
                onClick={() => changeView(value)}
                className={cn(
                  "flex size-9 items-center justify-center rounded-md",
                  view === value ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-4" aria-hidden />
              </button>
            ))}
          </div>
        </div>
        <ActiveFilterChips {...filterProps} />
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
        <>
          {/* phones always get the grid; the table needs the width */}
          <div className={cn("grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4", view === "table" && "md:hidden")}>
            {products.items.map((p) => (
              <article key={p.id} className="flex flex-col overflow-hidden rounded-xl border">
                <div className="relative flex h-44 items-center justify-center bg-muted text-muted-foreground">
                  {p.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element -- R2 URLs are already sized; no image optimizer needed in the portal
                    <img src={p.images[0].url} alt="" className="size-full object-cover" />
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
                  <PriceLines product={p} rentalsEnabled={rentalsEnabled} />
                  <div className="mt-auto flex items-center justify-between gap-2 border-t pt-2.5">
                    <span className="text-xs text-muted-foreground">{websiteNote(p)}</span>
                    <ProductActions product={p} publishing={publishing} onPublish={publish} />
                  </div>
                </div>
              </article>
            ))}
          </div>

          {view === "table" && (
            <div className="hidden overflow-hidden rounded-xl border md:block">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                  <tr>
                    <th scope="col" className="px-4 py-2.5 font-medium">
                      Product
                    </th>
                    <th scope="col" className="px-4 py-2.5 font-medium">
                      Price
                    </th>
                    <th scope="col" className="px-4 py-2.5 font-medium">
                      Status
                    </th>
                    <th scope="col" className="px-4 py-2.5 font-medium">
                      Updated
                    </th>
                    <th scope="col" className="px-4 py-2.5 text-right font-medium">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {products.items.map((p) => (
                    <tr key={p.id} className="align-middle hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted text-muted-foreground">
                            {p.images[0] ? (
                              // eslint-disable-next-line @next/next/no-img-element -- storage thumbnail
                              <img src={p.images[0].url} alt="" className="size-full object-cover" />
                            ) : (
                              <ImageIcon className="size-4" aria-label="No photos yet" />
                            )}
                          </span>
                          <span className="flex min-w-0 flex-col">
                            <Link href={`/products/${p.id}`} className="font-semibold leading-snug hover:underline">
                              {p.name}
                            </Link>
                            <span className="text-xs text-muted-foreground">{p.category?.name ?? "Uncategorised"}</span>
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <PriceLines product={p} rentalsEnabled={rentalsEnabled} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col items-start gap-1">
                          <span className="flex flex-wrap gap-1.5">
                            <ProductStatusBadge product={p} />
                            {rentalsEnabled && p.rental && <Badge tone="amber">{p.forSale ? "Sale & rent" : "For rent"}</Badge>}
                          </span>
                          <span className="text-xs text-muted-foreground">{websiteNote(p)}</span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{timeAgo(p.updatedAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          <ProductActions product={p} publishing={publishing} onPublish={publish} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
      {products && products.total > products.items.length && (
        <p className="text-sm text-muted-foreground">
          Showing {products.items.length} of {products.total}. Narrow the list with search or filters.
        </p>
      )}
    </div>
  )
}

// "On your website", "Ready to publish" or what's still missing
function websiteNote(p: Product) {
  if (p.status === "PUBLISHED") return "On your website"
  if (p.status === "ARCHIVED") return "Archived"
  if (p.publishChecklist.length === 0) return "Ready to publish"
  return `Needs: ${p.publishChecklist.map((k) => (k === "offer" ? "sale or rent" : k)).join(", ")}`
}

function PriceLines({ product: p, rentalsEnabled }: { product: Product; rentalsEnabled: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      {/* rent-only products have no sale price to show */}
      {(!rentalsEnabled || p.forSale) && (
        <div className="flex flex-wrap items-baseline gap-x-2">
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
  )
}

function ProductActions({
  product: p,
  publishing,
  onPublish,
}: {
  product: Product
  publishing: string | null
  onPublish: (p: Product) => void
}) {
  const canPublish = p.status === "DRAFT" && p.publishChecklist.length === 0
  return (
    <div className="flex gap-1.5">
      <Link href={`/products/${p.id}`} className={buttonVariants({ variant: "outline" })} aria-label={`Edit ${p.name}`}>
        Edit
      </Link>
      {canPublish && (
        <Button disabled={publishing === p.id} onClick={() => onPublish(p)}>
          {publishing === p.id ? "Publishing…" : "Publish"}
        </Button>
      )}
    </div>
  )
}
