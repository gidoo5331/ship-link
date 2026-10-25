import type { CatalogCategory, CatalogProduct } from "@/types"
import { apiEnabled, getPublic } from "./client"
import { sampleProducts } from "./sample"

// Listed products: published and not sold
export async function getProducts(categorySlug?: string): Promise<CatalogProduct[]> {
  if (apiEnabled) {
    const query = categorySlug ? `?category=${encodeURIComponent(categorySlug)}` : ""
    return (await getPublic<CatalogProduct[]>(`/products${query}`)) ?? []
  }
  return sampleProducts().filter(
    (p) => p.availability !== "SOLD" && (!categorySlug || p.category?.slug === categorySlug),
  )
}

// A single product page — sold products still resolve
export async function getProduct(slug: string): Promise<CatalogProduct | null> {
  if (apiEnabled) return getPublic<CatalogProduct>(`/products/${encodeURIComponent(slug)}`)
  return sampleProducts().find((p) => p.slug === slug) ?? null
}

// Categories that have at least one listed product
export async function getCategories(): Promise<CatalogCategory[]> {
  if (apiEnabled) return (await getPublic<CatalogCategory[]>("/categories")) ?? []

  const seen = new Map<string, CatalogCategory>()
  for (const p of await getProducts()) {
    if (p.category && !seen.has(p.category.slug)) seen.set(p.category.slug, p.category)
  }
  return [...seen.values()]
}
