"use client"

import { useState } from "react"
import type { Product } from "@/types"
import ProductCard from "./product-card"
import { cn } from "@/lib/utils"

type Props = {
  products: Product[]
  categories: string[]
}

export default function ProductsGrid({ products, categories }: Props) {
  const [active, setActive] = useState<string>("All")

  const filtered = active === "All" ? products : products.filter((p) => p.category === active)

  return (
    <div>
      {/* Category tabs */}
      <div className="flex flex-wrap gap-2">
        {["All", ...categories].map((cat) => (
          <button
            key={cat}
            onClick={() => setActive(cat)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
              active === cat
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-white text-muted-foreground hover:border-primary/40 hover:text-foreground"
            )}
          >
            {cat}
            <span className="ml-1.5 text-xs opacity-70">
              ({cat === "All" ? products.length : products.filter((p) => p.category === cat).length})
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
