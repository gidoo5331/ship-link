export type SystemRole = "SUPER_ADMIN" | "COMPANY_ADMIN" | "COMPANY_STAFF" | "AGENT"

export type User = {
  id: string
  firstName: string
  lastName: string
  email: string
  systemRole: SystemRole
  companyId: string | null
  company: Company | null
}

export type Company = {
  id: string
  name: string
  subdomain: string
  logoUrl: string | null
}

export type Category = {
  id: string
  name: string
  slug: string
  sortOrder: number
  specTemplate: string[]
  productCount: number
}

export type ProductStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED"
export type ProductAvailability = "AVAILABLE" | "ON_REQUEST" | "SOLD"
export type ProductSpec = { label: string; value: string }
export type ProductImage = { key: string; url: string }

export type Product = {
  id: string
  slug: string
  name: string
  description: string | null
  price: number | null
  currency: string
  status: ProductStatus
  availability: ProductAvailability
  leadTime: string | null
  images: ProductImage[]
  specs: ProductSpec[]
  features: string[]
  categoryId: string | null
  category: { id: string; name: string; slug: string } | null
  publishedAt: string | null
  updatedAt: string
  publishChecklist: string[]
}

export type Paginated<T> = {
  items: T[]
  total: number
  page: number
  pageSize: number
}
