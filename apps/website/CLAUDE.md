# ShipLink — apps/web CLAUDE.md

## What is apps/web

A single Next.js deployment that serves a **public-facing website for every company on the ShipLink platform**. Each company gets their own subdomain:

```
gh-motors.shiplink.com
kumasi-imports.shiplink.com
```

Next.js middleware reads the subdomain from the request host, resolves the matching company from the API, and renders that company's content — their branding, inventory, and contact details. One codebase, one Vercel deployment, many companies.

**Current phase:** The first company's site is **static** — content is hardcoded in local data files. Once the portal is live and the company has entered their details, static content is replaced with live API data fetched by subdomain.

The company imports multiple product types: **cars, generators, microwaves, electronics, and household items**. The site is not car-only.

The site has one critical interactive feature: an **agent referral flow** on every product's interest form, where a visitor expresses interest in a product and optionally enters the agent code or name who referred them. This lets the company owner track and reward agents who bring in customers.

---

## Tech Stack (fixed — do not suggest alternatives)

| Concern | Technology |
|---|---|
| Framework | Next.js (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS + shadcn/ui |
| Forms | React Hook Form + Zod |
| Form submission (now) | Formspree (no backend needed yet) |
| Form submission (later) | ShipLink backend API (`POST /api/v1/leads`) |
| Animations | Tailwind + CSS (keep it light) |
| Deployment | Vercel |

---

## Inventory Structure

Products are split into two tiers based on detail level:

### Tier 1 — Cars (rich detail page)
Cars get their own full detail page at `/inventory/cars/[slug]` with:
- Image gallery
- Full specs (make, model, year, mileage, engine, transmission, condition, VIN)
- Price in USD + GHS estimate
- Interest form with agent referral

### Tier 2 — General products (filterable listings page)
All other products live on a single `/inventory` page, filterable by category:
- Generators
- Electronics
- Microwaves
- Household items
- Other

General products show a product card. Clicking opens a **detail modal** (not a new page) with a description, images, price, and the interest form with agent referral.

### Categories (enum — use exactly these strings)
```typescript
export type ProductCategory =
  | 'CAR'
  | 'GENERATOR'
  | 'ELECTRONICS'
  | 'MICROWAVE'
  | 'HOUSEHOLD'
  | 'OTHER'
```

---

## Project Structure

```
apps/web/
├── middleware.ts                    # Subdomain resolution — reads host, injects companySlug
├── app/
│   ├── layout.tsx                   # Root layout — navbar + footer
│   ├── page.tsx                     # Home page
│   ├── inventory/
│   │   ├── page.tsx                 # All products — filterable grid (non-car categories shown here too)
│   │   └── cars/
│   │       └── [slug]/
│   │           └── page.tsx         # Car detail page (rich — cars only)
│   ├── about/
│   │   └── page.tsx
│   └── contact/
│       └── page.tsx
├── components/
│   ├── layout/
│   │   ├── navbar.tsx
│   │   └── footer.tsx
│   ├── inventory/
│   │   ├── product-grid.tsx         # Renders all products, handles category filter
│   │   ├── product-card.tsx         # Generic card — used for all product types
│   │   ├── product-filter.tsx       # Category filter bar (All, Cars, Generators, etc.)
│   │   ├── product-modal.tsx        # Detail modal for non-car products
│   │   ├── car-card.tsx             # Car-specific card (links to detail page)
│   │   ├── car-gallery.tsx          # Image gallery on car detail page
│   │   └── interest-form.tsx        # Shared — used in car detail page + product modal
│   ├── home/
│   │   ├── hero.tsx
│   │   ├── how-it-works.tsx
│   │   ├── trust-section.tsx
│   │   └── featured-products.tsx    # Shows mix of featured items (not just cars)
│   └── ui/                          # shadcn/ui components
├── data/
│   ├── products.ts                  # All products — cars + general (static phase only)
│   └── company.ts                   # Hardcoded company info (static phase only)
├── lib/
│   ├── utils.ts
│   └── get-company.ts               # Resolve company from subdomain
├── public/
│   └── images/
│       └── products/                # Product photos organised by category
│           ├── cars/
│           ├── generators/
│           ├── electronics/
│           └── household/
├── types/
│   └── index.ts
└── .env.local
```

---

## Domain Architecture

### How subdomains work
Each company registered on ShipLink is assigned a unique `subdomain` slug (e.g. `gh-motors`). Their public website is served at:
```
gh-motors.shiplink.com
```

Vercel is configured with a wildcard domain `*.shiplink.com` pointing to this deployment. Next.js middleware intercepts every request, extracts the subdomain, and passes it as a header so server components can fetch the right company's data.

### Middleware (`middleware.ts`)
```typescript
import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const subdomain = hostname.split('.')[0]

  // skip for localhost, admin, app subdomains
  const reserved = ['localhost', 'www', 'app', 'admin', 'shiplink']
  if (reserved.includes(subdomain)) return NextResponse.next()

  // inject subdomain into header so server components can read it
  const response = NextResponse.next()
  response.headers.set('x-company-slug', subdomain)
  return response
}

export const config = {
  matcher: ['/((?!_next|favicon.ico).*)'],
}
```

### Company resolver (`lib/get-company.ts`)
```typescript
// Static phase: returns hardcoded data, ignores slug
// API phase: fetches GET /api/v1/companies/by-slug/:slug/public
export async function getCompany(slug: string): Promise<Company> {
  const { company } = await import('@/data/company')
  return company
}
```

All server components call `getCompany(slug)` — when migrating to the API, only this one function changes.

### Phase 2 — Custom domains (future)
Companies on a paid plan can use their own domain (e.g. `gh-motors.com`). They add a CNAME record pointing to ShipLink's Vercel deployment. The middleware resolves the full hostname against the `customDomain` field in the companies table instead of the subdomain.

---

## Current Phase: Static

All content lives in `data/products.ts` and `data/company.ts`. No API calls yet.

**In scope:**
- Home page (hero, how it works, trust message, featured products)
- Inventory page — filterable grid of all products, category filter tabs
- Car detail page — rich page with gallery, specs, interest form
- General product detail — modal with images, description, interest form
- About page
- Contact page
- Mobile responsive layout

**Out of scope for now:**
- Authentication
- Customer dashboard
- Live API data
- Shipment tracking on the website
- Payment on the website

---

## Data Shape (static, in `data/`)

### `data/company.ts`
```typescript
export const company = {
  name: "string",
  subdomain: "string",       // e.g. "gh-motors" — used to match *.shiplink.com
  tagline: "string",
  phone: "string",
  email: "string",
  address: "string",
  logoUrl: "string",
  whatsapp: "string",
  about: "string",
  heroHeading: "string",
  heroSubheading: "string",
}
```

### `data/products.ts`
One unified product list. Cars include extra fields; other products only use the base fields.

```typescript
export type ProductCategory = 'CAR' | 'GENERATOR' | 'ELECTRONICS' | 'MICROWAVE' | 'HOUSEHOLD' | 'OTHER'

export type Product = {
  id: string
  slug: string
  category: ProductCategory
  name: string               // e.g. "2020 Toyota Corolla" or "6.5KVA Firman Generator"
  price: number              // USD
  images: string[]
  description: string
  available: boolean
  featured: boolean          // show on home page featured section

  // Car-only fields (undefined for other categories)
  make?: string
  model?: string
  year?: number
  mileage?: number
  engineSize?: string
  transmission?: string
  condition?: string         // e.g. "Foreign Used"
  vin?: string
}

export const products: Product[] = [
  // cars, generators, electronics, etc. all in one array
]
```

### Helper — filter by category
```typescript
export const getCars = () => products.filter(p => p.category === 'CAR')
export const getGeneralProducts = () => products.filter(p => p.category !== 'CAR')
export const getFeatured = () => products.filter(p => p.featured && p.available)
```

---

## Agent Referral Flow

The same interest form is used across all product types — car detail page and general product modal.

### User journey
1. Visitor finds a product they like (car or general)
2. They click **"I'm Interested"** or **"Request This Item"**
3. Form opens with:
   - Full name (required)
   - Phone number (required)
   - Location / city (required)
   - Agent code or name (optional) — helper text: *"Were you referred by one of our agents? Enter their name or code so we can credit them."*
4. On submit:
   - **Now:** posts to Formspree → owner gets email with customer details + product + agent reference
   - **Later:** posts to `POST /api/v1/leads` with `referredByCode`

### Interest form schema (Zod)
```typescript
const interestFormSchema = z.object({
  fullName: z.string().min(2, "Please enter your full name"),
  phone: z.string().min(9, "Please enter a valid phone number"),
  location: z.string().min(2, "Please enter your city or region"),
  agentReferral: z.string().optional(),
  productId: z.string(),      // hidden — product being enquired about
  productName: z.string(),    // hidden — human-readable product name
  category: z.string(),       // hidden — product category
})
```

### Formspree setup
- Create a free Formspree form at https://formspree.io
- Store endpoint in `.env.local` as `NEXT_PUBLIC_FORMSPREE_URL`
- Submit with plain `fetch` POST — do not use the Formspree React library

---

## Pages

### Home (`/`)
- **Hero** — company name, tagline, CTA ("Browse Inventory" + "Contact Us")
- **How it works** — Browse → Express Interest → Visit Agent → Receive Your Item
- **Trust section** — agent verification network, physical signing, why it's safe
- **Featured products** — mix of featured items across all categories (not cars only)
- **Category shortcuts** — quick links to Cars / Generators / Electronics / Household

### Inventory (`/inventory`)
- Category filter tabs: All · Cars · Generators · Electronics · Microwaves · Household · Other
- Responsive product grid
- Cars → `CarCard` (links to `/inventory/cars/[slug]`)
- All other products → `ProductCard` (opens `ProductModal` on click)
- Show only `available: true` products

### Car Detail (`/inventory/cars/[slug]`)
- Full image gallery
- Specs table: make, model, year, mileage, engine, transmission, condition, VIN
- Price in USD (+ GHS estimate)
- Description
- Interest form with agent referral (inline, not modal)
- WhatsApp CTA: pre-filled message with car name

### About (`/about`)
- Company story
- Products they import (list all categories)
- Agent trust network — how it works, why it matters
- Regions covered

### Contact (`/contact`)
- Name, phone, email, message
- Company phone, email, address, WhatsApp shown alongside

---

## Design Direction

The site should feel **professional, trustworthy, and modern**.

- Not a car dealership template — it's an import business that handles many product types
- Clean whitespace, strong typography
- Trust signals everywhere (agent network, physical verification, signed contracts)
- Mobile-first — most visitors will be on phones
- Premium accent color (deep blue, navy, or charcoal)
- Product images are the hero — give them space regardless of category

---

## Migration Path (static → live API)

| Now (static) | Later (API) |
|---|---|
| `data/company.ts` | `GET /api/v1/companies/by-slug/:slug/public` |
| `data/products.ts` | `GET /api/v1/companies/by-slug/:slug/inventory` |
| Formspree submission | `POST /api/v1/leads` with `referredByCode` and `category` |
| Agent referral = free text | Agent referral = validated against agents table, stored as `agentId` |
| `lib/get-company.ts` returns static import | Fetches from API using slug from middleware header |

Only `lib/get-company.ts` and the form submission handler change. All pages and components stay the same.

---

## Environment Variables

```env
# .env.local

# Static phase
NEXT_PUBLIC_FORMSPREE_URL=https://formspree.io/f/your-form-id

# API phase (add when backend is live)
NEXT_PUBLIC_API_URL=https://api.shiplink.com
```

---

## Naming Conventions

- Files and folders: `kebab-case`
- Components: `PascalCase`
- Types: `PascalCase`
- Variables/functions: `camelCase`
- All server components by default — add `"use client"` only when needed (forms, modals, interactivity)