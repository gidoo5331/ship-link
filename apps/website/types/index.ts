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
