import type { Metadata } from "next"
import { products, CATEGORIES } from "@/data/products"
import { company } from "@/data/company"
import ProductsGrid from "@/components/products/products-grid"

export const metadata: Metadata = {
  title: `Products — ${company.name}`,
  description: "Browse our full range of products — generators, lighting, electronics and more.",
}

export default function ProductsPage() {
  const available = products.filter((p) => p.available)
  const categories = [...CATEGORIES] as string[]

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Products
          </h1>
          <p className="mt-2 text-base text-muted-foreground">
            {available.length} {available.length === 1 ? "item" : "items"} in stock across {CATEGORIES.length} categories
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <ProductsGrid products={available} categories={categories} />
      </div>
    </div>
  )
}
