import type { Metadata } from "next"
import { getCategories, getCompany, getProducts } from "@/lib/content"
import ProductsGrid from "@/components/products/products-grid"

export async function generateMetadata(): Promise<Metadata> {
  const company = await getCompany()
  return {
    title: `Products — ${company.name}`,
    description: "Browse our full range of products — generators, lighting, electronics and more.",
  }
}

export default async function ProductsPage() {
  const [products, allCategories] = await Promise.all([getProducts(), getCategories()])
  const available = products.filter((p) => p.available)
  // only categories that have something to show
  const categories = allCategories.filter((c) => available.some((p) => p.category === c))

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Products
          </h1>
          <p className="mt-2 text-base text-muted-foreground">
            {available.length} {available.length === 1 ? "item" : "items"} in stock across {categories.length} {categories.length === 1 ? "category" : "categories"}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <ProductsGrid products={available} categories={categories} />
      </div>
    </div>
  )
}
