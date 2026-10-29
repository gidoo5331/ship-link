# Product catalog & leads — Phase 1 plan

## Why

Each company's website (`apps/website`) already shows a catalog (cars, generators, electronics…) with an
interest form and agent referral field. Today that content is hardcoded and the form posts to Formspree.
This plan moves both into the platform:

- **Products** — the company manages its catalog in the portal; the website reads it from the API.
- **Leads** — the website's interest form creates a lead; staff follow up and convert it into a
  customer + shipment request.

## MVP scope

**Top priority: a company's products show on its website.** Everything else is built after that works.

| In the MVP | Later ("Soon" in the portal sidebar) |
|---|---|
| Auth, Staff & roles (built) | Verifications (agent sessions, evidence uploads) |
| **Categories, Products, product photos** | Payments ledger (agent confirmation, partial payments) |
| **Website reads products from the API** | Contracts |
| Leads (website interest form) | Notifications |
| Customers, Shipments (status pipeline) | |
| Agents (referral codes) | |
| "Mark as paid" on a shipment (amount + note → moves to At warehouse) | |

## Flow

```
Website visitor ── "I'm interested" ──► Lead (NEW)
  (product, or a custom request          │  staff contact the visitor
   like "2022 Toyota Camry")             ▼
                                       Lead (CONTACTED)
                                         │  "Convert"
                                         ▼
                        Customer (found by phone, or created)
                        ShipmentRequest (REQUESTED, productId, referredByCode)
                                         │
                                         ▼
                        existing flow: approve → assign agent → verify → pay → ship
```

## Decisions

1. **One `Product` model for all categories, cars included.** Car-only fields (make, model, year, mileage,
   engine, transmission, condition) are stored as `specs` (label/value pairs). The website's separate
   `Car` and `Product` types merge into one, with one detail page layout for every product.
2. **Categories are company-defined, not an enum.** Each company creates its own (`Cars`, `Generators` for
   an importer; `Oud`, `Floral` for a perfume seller). A category can carry a **spec template** — the
   suggested spec labels pre-filled when adding a product (Cars → Make, Model, Year, Mileage…). New
   companies are offered a starter set they can edit or skip; nothing is hardcoded.
3. **Publishing is separate from availability, and nothing goes online by accident.**
   - `status` — is it on the website? `DRAFT` (default for every new product) → `PUBLISHED` → `ARCHIVED`.
     Only an explicit **Publish** action moves a product to `PUBLISHED`; **Unpublish** moves it back to `DRAFT`.
   - `availability` — what customers see once published: `AVAILABLE` (in stock / sourced),
     `ON_REQUEST` (imported to order, shown with `leadTime`), `SOLD` (hidden from listings; the link shows it as sold).
   - **Publish checklist** (enforced by the API, shown in the editor): at least one photo, a category, a price
     estimate and a description. `POST …/products/:id/publish` returns 422 listing what's missing.
4. **Leads, not `product_requests`.** A website visitor is not a `Customer` yet (no Ghana Card, maybe a
   duplicate phone). Keeping leads separate stops junk/spam from polluting the customer table. A lead
   with no `productId` is a custom request ("I want a 2022 Camry").
5. **Referral codes resolve to agents.** On create, `referralCode` is matched against `Agent.referralCode`;
   if it matches, `agentId` is set. On convert, the code is copied to `ShipmentRequest.referredByCode` and
   the agent is pre-selected for assignment.
6. **Price** is stored once, with a currency (`USD` by default, as the website shows today); the GHS
   estimate stays a display-time conversion (`apps/website/lib/currency.ts`). Payments remain in GHS.
7. **Permissions:** add `products` and `leads` as resources in the role matrix (create/read/update/delete).
8. **Out of scope for Phase 1:** customer accounts that browse and track orders. Browsing is the
   public website; customer tracking comes later.

## Schema (additions)

```prisma
enum ProductStatus       { DRAFT PUBLISHED ARCHIVED }
enum ProductAvailability { AVAILABLE ON_REQUEST SOLD }
enum LeadStatus      { NEW CONTACTED CONVERTED CLOSED }

model Category {
  id           String    @id @default(uuid())
  companyId    String
  company      Company   @relation(fields: [companyId], references: [id])
  name         String
  slug         String
  sortOrder    Int       @default(0)
  specTemplate String[]  // suggested spec labels, e.g. ["Make", "Model", "Year", "Mileage"]
  products     Product[]
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  @@unique([companyId, slug])
  @@map("categories")
}

model Product {
  id          String          @id @default(uuid())
  companyId   String
  company     Company         @relation(fields: [companyId], references: [id])
  slug        String
  name        String
  categoryId  String?         // optional: uncategorised products are allowed
  category    Category?       @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  description String?
  price       Decimal?        @db.Decimal(12, 2)
  currency    String          @default("USD")
  status       ProductStatus       @default(DRAFT)
  availability ProductAvailability @default(AVAILABLE)
  publishedAt  DateTime?
  leadTime     String?         // e.g. "4–6 weeks" for ON_REQUEST
  images      String[]        // storage URLs, first = cover
  specs       Json            @default("[]")   // [{ label, value }]
  features    String[]
  createdById String?
  leads       Lead[]
  shipmentRequests ShipmentRequest[]
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt

  @@unique([companyId, slug])
  @@index([companyId, status, categoryId])
  @@map("products")
}

model Lead {
  id                String     @id @default(uuid())
  companyId         String
  company           Company    @relation(fields: [companyId], references: [id])
  fullName          String
  phone             String
  location          String?
  productId         String?    // null = custom request
  product           Product?   @relation(fields: [productId], references: [id])
  customRequest     String?
  referralCode      String?
  agentId           String?
  agent             Agent?     @relation(fields: [agentId], references: [id])
  status            LeadStatus @default(NEW)
  notes             String?
  customerId        String?    // set on convert
  shipmentRequestId String?    @unique
  createdAt         DateTime   @default(now())
  updatedAt         DateTime   @updatedAt

  @@index([companyId, status])
  @@map("leads")
}
```

`ShipmentRequest` gains `productId String?` (keeps `productName` as a snapshot, since catalog items change).

## API

| Method | Path | Who |
|---|---|---|
| `GET` | `/public/companies/:subdomain/categories` | Website (no auth) — for the filter bar |
| `GET` | `/public/companies/:subdomain/products?category=:slug` | Website (no auth) — `PUBLISHED` and not `SOLD` |
| `GET` | `/public/companies/:subdomain/products/:slug` | Website (no auth) |
| `POST` | `/public/companies/:subdomain/leads` | Website (no auth, rate-limited) |
| `GET/POST/PATCH/DELETE` | `/companies/:id/categories` | Portal — `products:*` (delete leaves products uncategorised) |
| `GET/POST/PATCH/DELETE` | `/companies/:id/products` | Portal — `products:*` (create always makes a draft) |
| `POST` | `/companies/:id/products/:productId/publish` · `/unpublish` | Portal — `products:update`; publish checks the checklist |
| `POST` | `/companies/:id/products/:productId/images` | Portal — upload to storage |
| `GET/PATCH` | `/companies/:id/leads` | Portal — `leads:read/update` |
| `POST` | `/companies/:id/leads/:leadId/convert` | Portal — creates Customer + ShipmentRequest |

## File storage: Cloudflare R2 (decided)

Product photos go to **Cloudflare R2** (free tier: 10 GB, no egress fees; S3-compatible, so the AWS S3 SDK
works). Uploads use **presigned URLs**: the portal asks the backend for a short-lived upload URL, then sends
the file straight to R2, so the 256 MB Northflank container never holds image bytes in memory. Photos are
served from a public R2 bucket URL (or a custom domain later). The same storage covers contracts, IDs and
receipts later.

Setup needed: an R2 bucket, an API token scoped to it, and env vars on Northflank —
`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_URL`.

## Build order

**Milestone 1 — products live on the website** ✅ built on `feat/product-catalog` (R2 bucket still to be created)
1. ✅ Schema + migration (`Category`, `Product`)
2. ✅ Categories + Products CRUD (portal API) + public read endpoints
3. ✅ Storage (R2 presigned uploads) + image upload
4. ✅ Portal screens: login, Products (with categories), Product editor
5. ✅ Website: reads the public API when `SHIPLINK_API_URL` + `COMPANY_SUBDOMAIN` are set; `/cars` redirects to the Cars category

**Milestone 2 — leads and shipments**
6. Schema: `Lead`, `ShipmentRequest.productId`, Customers, Shipments
7. Leads: public create (replaces Formspree), portal list/update, convert
8. Shipments pipeline + "Mark as paid"
9. Portal screens: Leads, Customers, Shipments, Agents
