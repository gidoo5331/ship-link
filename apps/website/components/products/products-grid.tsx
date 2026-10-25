"use client"

import { useState } from "react"
import type { CatalogCategory, CatalogProduct } from "@/types"
import ProductCard from "./product-card"
import { cn } from "@/lib/utils"

type Props = {
  products: CatalogProduct[]
  categories: CatalogCategory[]
  initialCategory?: string // category slug
}

export default function ProductsGrid({ products, categories, initialCategory }: Props) {
  const [active, setActive] = useState<string>(
    initialCategory && categories.some((c) => c.slug === initialCategory) ? initialCategory : "all",
  )

  const filtered = active === "all" ? products : products.filter((p) => p.category?.slug === active)
  const tabs = [{ slug: "all", name: "All" }, ...categories]

  return (
    <div>
      {/* Category tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((cat) => (
          <button
            key={cat.slug}
            onClick={() => setActive(cat.slug)}
            aria-pressed={active === cat.slug}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
              active === cat.slug
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-white text-muted-foreground hover:border-primary/40 hover:text-foreground"
            )}
          >
            {cat.name}
            <span className="ml-1.5 text-xs opacity-70">
              ({cat.slug === "all" ? products.length : products.filter((p) => p.category?.slug === cat.slug).length})
            </span>
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="mt-16 text-center text-muted-foreground">
          No products available in this category.
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
