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
  rentalsEnabled: boolean
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
export type RentalUnit = "DAY" | "WEEK" | "MONTH"
export type ProductRental = { rate: number; currency: string; unit: RentalUnit; notes: string | null }

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
  forSale: boolean
  rental: ProductRental | null // set = for rent
  images: ProductImage[]
  specs: ProductSpec[]
  features: string[]
  categoryId: string | null
  category: { id: string; name: string; slug: string } | null
  publishedAt: string | null
  updatedAt: string
  publishChecklist: string[]
}

export type Customer = {
  id: string
  firstName: string
  lastName: string
  phone: string
  email: string | null
  ghanaCardNumber: string | null
  address: string | null
  city: string | null
  region: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  leadCount?: number
}

export type CustomerMatch = Pick<Customer, "id" | "firstName" | "lastName" | "phone" | "email" | "city" | "createdAt">

export type LeadStatus = "NEW" | "CONTACTED" | "CONVERTED" | "CLOSED"
export type LeadType = "PURCHASE" | "RENTAL"

export type Lead = {
  id: string
  type: LeadType
  fullName: string
  phone: string
  phoneKey: string
  location: string | null
  productId: string | null
  productName: string | null
  customRequest: string | null
  referralCode: string | null
  status: LeadStatus
  notes: string | null
  customerId: string | null
  contactedAt: string | null
  closedAt: string | null
  convertedAt: string | null
  createdAt: string
  product: {
    id: string
    name: string
    slug: string
    status: ProductStatus
    price: number | null
    currency: string
    rental: Omit<ProductRental, "notes"> | null
    imageUrl: string | null
  } | null
  agent: { id: string; referralCode: string; name: string } | null
  customer: { id: string; firstName: string; lastName: string } | null
  matchingCustomers?: CustomerMatch[]
}

export type LeadPage = Paginated<Lead> & {
  counts: Record<"new" | "contacted" | "converted" | "closed", number>
}

export type Paginated<T> = {
  items: T[]
  total: number
  page: number
  pageSize: number
}
