import type { Metadata } from "next"
import ProductsGrid from "@/components/products/products-grid"
import LeadFormWrapper from "@/components/leads/lead-form-wrapper"
import LoadFailed from "@/components/load-failed"
import { getCategories, getCompany, getProducts, leadsEndpoint } from "@/api"

export async function generateMetadata(): Promise<Metadata> {
  const company = await getCompany()
  return {
    title: `Products — ${company.name}`,
    description: `Browse everything available from ${company.name}.`,
  }
}

type Props = { searchParams: Promise<{ category?: string }> }

export default async function ProductsPage({ searchParams }: Props) {
  const { category } = await searchParams

  // if the catalog can't be loaded, the rest of the page (and the request form) still works
  let catalog: { products: Awaited<ReturnType<typeof getProducts>>; categories: Awaited<ReturnType<typeof getCategories>> } | null = null
  try {
    const [products, categories] = await Promise.all([getProducts(), getCategories()])
    catalog = { products, categories }
  } catch (error) {
    console.error("[website] Couldn't load products:", error instanceof Error ? error.message : error)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Products
          </h1>
          {catalog && (
            <p className="mt-2 text-base text-muted-foreground">
              {catalog.products.length} {catalog.products.length === 1 ? "item" : "items"} across {catalog.categories.length}{" "}
              {catalog.categories.length === 1 ? "category" : "categories"}
            </p>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {catalog ? (
          // key resets the selected tab when the ?category link changes
          <ProductsGrid key={category ?? "all"} products={catalog.products} categories={catalog.categories} initialCategory={category} />
        ) : (
          <LoadFailed
            title="We couldn't load our products right now"
            message="Please try again in a moment. You can still tell us what you're looking for below."
          />
        )}

        <section
          id="request"
          aria-labelledby="request-h"
          className="mt-16 grid gap-8 rounded-2xl border border-border bg-white p-6 sm:p-8 lg:grid-cols-2"
        >
          <div>
            <h2 id="request-h" className="text-2xl font-bold tracking-tight text-foreground">
              Can&apos;t find what you&apos;re looking for?
            </h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              Tell us what you need — make, model, year, budget, anything — and we&apos;ll source it for you and get back
              to you with a quote.
            </p>
          </div>
          <LeadFormWrapper endpoint={leadsEndpoint} />
        </section>
      </div>
    </div>
  )
}
