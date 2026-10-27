"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ProductForm } from "@/components/products/product-form"
import { api, ApiError } from "@/lib/api"
import { companyPath, useAuth } from "@/lib/auth"
import type { Product } from "@/lib/types"
import { Loading } from "@/components/load-state"

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [product, setProduct] = useState<Product | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api<Product>("GET", companyPath(user, `/products/${id}`))
      .then(setProduct)
      .catch((e) => setError(e instanceof ApiError && e.status === 404 ? "This product doesn't exist." : "Could not load the product."))
  }, [user, id])

  if (error) {
    return (
      <div className="flex flex-col items-start gap-3 p-8">
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
        <Link href="/products" className="text-sm font-medium underline">
          Back to products
        </Link>
      </div>
    )
  }

  if (!product) {
    return (
      <Loading label="Loading product…" />
    )
  }

  // key resets the form when navigating between products
  return <ProductForm key={product.id} product={product} />
}
