// Bundled sample data (data/*.ts), shaped like API responses. Used when the
// site isn't connected to a company yet.

import { cars } from "@/data/cars"
import { company } from "@/data/company"
import { products } from "@/data/products"
import type { CatalogProduct, SiteCompany } from "@/types"

const slugify = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")

export const sampleCompany: SiteCompany = { ...company, isSample: true }

export function sampleProducts(): CatalogProduct[] {
  const fromCars: CatalogProduct[] = cars.map((car) => ({
    id: `car-${car.id}`,
    slug: car.slug,
    name: `${car.year} ${car.make} ${car.model}`,
    description: car.description,
    price: car.price,
    currency: "USD",
    availability: car.available ? "AVAILABLE" : "SOLD",
    leadTime: null,
    images: car.images,
    specs: [
      { label: "Year", value: String(car.year) },
      { label: "Condition", value: car.condition },
      { label: "Colour", value: car.color },
      { label: "Mileage", value: `${car.mileage.toLocaleString("en-US")} km` },
      { label: "Engine", value: car.engineSize },
      { label: "Transmission", value: car.transmission },
    ],
    features: car.features,
    category: { id: "cars", name: "Cars", slug: "cars" },
  }))

  const fromProducts: CatalogProduct[] = products.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    description: p.description,
    price: p.price,
    currency: "USD",
    availability: p.available ? "AVAILABLE" : "SOLD",
    leadTime: null,
    images: p.images,
    specs: p.specs.map((s) => ({ label: s.label, value: String(s.value) })),
    features: p.features,
    category: { id: slugify(p.category), name: p.category, slug: slugify(p.category) },
  }))

  return [...fromCars, ...fromProducts]
}
