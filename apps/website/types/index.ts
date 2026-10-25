export type Car = {
  id: string
  slug: string
  make: string
  model: string
  year: number
  price: number
  mileage: number
  engineSize: string
  transmission: string
  color: string
  condition: string
  images: string[]
  features: string[]
  description: string
  available: boolean
}

export type Company = {
  name: string
  tagline: string
  phone: string
  email: string
  address: string
  logoUrl: string
  whatsapp: string
  about: string
  heroHeading: string
  heroSubheading: string
}

export type LeadFormData = {
  fullName: string
  phone: string
  location: string
  agentReferral?: string
  carId: string
  carName: string
}

export type ProductSpec = {
  label: string
  value: string | number
}

export type Product = {
  id: string
  slug: string
  name: string
  category: string          // e.g. "Generators", "Lighting", "Electronics"
  price: number
  images: string[]
  specs: ProductSpec[]
  features: string[]
  description: string
  available: boolean
}

// ── Catalog from the ShipLink API (public endpoints) ────────────────────────

// Company details shown on the site; empty strings mean "not set"
export type SiteCompany = {
  name: string
  tagline: string
  phone: string
  email: string
  address: string
  logoUrl: string | null
  whatsapp: string
  about: string
  heroHeading: string
  heroSubheading: string
  // true when showing the bundled sample company (no API configured)
  isSample: boolean
  // true when the API couldn't be reached and only the name is known
  unavailable?: boolean
}

export type CatalogCategory = {
  id: string
  name: string
  slug: string
}

export type CatalogProduct = {
  id: string
  slug: string
  name: string
  description: string | null
  price: number | null
  currency: string
  availability: "AVAILABLE" | "ON_REQUEST" | "SOLD"
  leadTime: string | null
  images: string[]
  specs: { label: string; value: string }[]
  features: string[]
  category: CatalogCategory | null
}
