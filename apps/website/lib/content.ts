// Website content, edited by the client in Keystatic (/keystatic) and stored
// as files in content/ and public/images/. Returns the same shapes the pages
// used with the old hardcoded data/*.ts, so components didn't need to change.
// When the ShipLink backend takes over, only this file needs swapping.

import { cache } from "react"
import { createReader } from "@keystatic/core/reader"
import keystaticConfig from "@/keystatic.config"
import type { Car, Company, Product } from "@/types"

const reader = createReader(process.cwd(), keystaticConfig)

export const getCompany = cache(async (): Promise<Company> => {
  const c = await reader.singletons.company.read()
  if (!c) throw new Error("Company details are missing — fill them in at /keystatic")
  return {
    name: c.name,
    tagline: c.tagline,
    phone: c.phone,
    email: c.email,
    address: c.address,
    logoUrl: c.logo ?? "",
    whatsapp: c.whatsapp,
    about: c.about,
    heroHeading: c.heroHeading,
    heroSubheading: c.heroSubheading,
  }
})

// All cars, available first (the pages filter sold ones out)
export const getCars = cache(async (): Promise<Car[]> => {
  const entries = await reader.collections.cars.all()
  return entries
    .map(({ slug, entry }) => ({
      id: slug,
      slug,
      make: entry.make,
      model: entry.model,
      year: Number(entry.year),
      price: entry.price,
      mileage: entry.mileage,
      engineSize: entry.engineSize,
      transmission: entry.transmission,
      color: entry.color,
      condition: entry.condition,
      images: [...entry.images],
      features: [...entry.features],
      description: entry.description,
      available: entry.available,
    }))
    .sort((a, b) => Number(b.available) - Number(a.available) || b.year - a.year)
})

export async function getCar(slug: string): Promise<Car | undefined> {
  return (await getCars()).find((c) => c.slug === slug)
}

// Category names in the order set in Keystatic
export const getCategories = cache(async (): Promise<string[]> => {
  const entries = await reader.collections.categories.all()
  return entries
    .sort((a, b) => (a.entry.sortOrder ?? 0) - (b.entry.sortOrder ?? 0) || a.entry.name.localeCompare(b.entry.name))
    .map(({ entry }) => entry.name)
})

export const getProducts = cache(async (): Promise<Product[]> => {
  const [entries, categories] = await Promise.all([
    reader.collections.products.all(),
    reader.collections.categories.all(),
  ])
  const categoryName = new Map(categories.map(({ slug, entry }) => [slug, entry.name]))

  return entries.map(({ slug, entry }) => ({
    id: slug,
    slug,
    name: entry.name,
    category: (entry.category && categoryName.get(entry.category)) || "Other",
    price: entry.price,
    images: [...entry.images],
    specs: entry.specs.filter((s) => s.label.trim()).map((s) => ({ label: s.label, value: s.value })),
    features: [...entry.features],
    description: entry.description,
    available: entry.available,
  }))
})

export async function getProduct(slug: string): Promise<Product | undefined> {
  return (await getProducts()).find((p) => p.slug === slug)
}
