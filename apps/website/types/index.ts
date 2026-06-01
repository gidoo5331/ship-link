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
