# ShipLink — apps/web CLAUDE.md

## What is apps/web

The public-facing marketing and inventory website for a company using the ShipLink platform. It is currently **static** — all content (company info, car listings) is hardcoded in local data files. Once the ShipLink portal is live and the company has entered their details, the static content will be replaced with live API data.

The site has one critical interactive feature: an **agent referral flow** on the car detail page, where a visitor expresses interest in buying a car and optionally enters the agent code or name who referred them. This lets the company owner track and reward agents who bring in customers.

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

## Project Structure

```
apps/web/
├── app/
│   ├── layout.tsx               # Root layout — navbar + footer
│   ├── page.tsx                 # Home page
│   ├── cars/
│   │   ├── page.tsx             # Car listings grid
│   │   └── [slug]/
│   │       └── page.tsx         # Car detail + interest form
│   ├── about/
│   │   └── page.tsx             # Company story + agent trust message
│   └── contact/
│       └── page.tsx             # Contact form
├── components/
│   ├── layout/
│   │   ├── navbar.tsx
│   │   └── footer.tsx
│   ├── cars/
│   │   ├── car-card.tsx         # Card used in listings grid
│   │   ├── car-gallery.tsx      # Image gallery on detail page
│   │   └── interest-form.tsx    # "I'm interested" form with agent referral field
│   ├── home/
│   │   ├── hero.tsx
│   │   ├── how-it-works.tsx
│   │   └── trust-section.tsx
│   └── ui/                      # shadcn/ui components
├── data/
│   ├── cars.ts                  # Hardcoded car listings (replace with API later)
│   └── company.ts               # Hardcoded company info (replace with API later)
├── lib/
│   └── utils.ts
├── public/
│   └── images/
│       └── cars/                # Car photos
├── types/
│   └── index.ts                 # Car, Company, LeadFormData types
└── .env.local
```

---

## Current Phase: Static

All content lives in `data/cars.ts` and `data/company.ts`. No API calls yet.

**In scope:**
- Home page (hero, how it works, trust message)
- Car listings page (grid of available cars)
- Car detail page (specs, gallery, interest form with agent referral)
- About page (company story, agent network)
- Contact page (general enquiry form)
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
  tagline: "string",
  phone: "string",
  email: "string",
  address: "string",
  logoUrl: "string",
  whatsapp: "string",        // WhatsApp number for direct contact
  about: "string",
  heroHeading: "string",
  heroSubheading: "string",
}
```

### `data/cars.ts`
```typescript
export type Car = {
  id: string
  slug: string               // URL-friendly id e.g. "2020-toyota-corolla"
  make: string
  model: string
  year: number
  price: number              // in USD
  mileage: number
  engineSize: string
  transmission: string
  condition: string          // e.g. "Foreign Used"
  images: string[]           // array of image paths in /public/images/cars/
  features: string[]
  description: string
  available: boolean
}

export const cars: Car[] = [
  // hardcoded listings here
]
```

---

## Agent Referral Flow

This is the most important interactive feature on the site.

### User journey
1. Visitor browses cars and clicks on one they like
2. On the car detail page, they click **"I'm Interested"** or **"Request This Car"**
3. A form opens (inline section or modal) with these fields:
   - Full name (required)
   - Phone number (required)
   - Location / city (required)
   - Agent code or name (optional) — with helper text: *"Were you referred by one of our agents? Enter their name or code so we can credit them."*
4. On submit:
   - **Now (static phase):** form posts to Formspree → owner receives an email with all details including agent reference
   - **Later (API phase):** form posts to `POST /api/v1/leads` with `referredByCode` field → stored in database

### Interest form validation (Zod)
```typescript
const interestFormSchema = z.object({
  fullName: z.string().min(2, "Please enter your full name"),
  phone: z.string().min(9, "Please enter a valid phone number"),
  location: z.string().min(2, "Please enter your city or region"),
  agentReferral: z.string().optional(),
  carId: z.string(),         // hidden field — car being enquired about
  carName: z.string(),       // hidden field — human-readable car name
})
```

### Formspree setup
- Create a free Formspree form at https://formspree.io
- Store the endpoint in `.env.local` as `NEXT_PUBLIC_FORMSPREE_URL`
- Submit with a plain `fetch` POST — do not use the Formspree React library

---

## Pages

### Home (`/`)
- **Hero** — company name, tagline, prominent CTA ("Browse Cars" + "Contact Us")
- **How it works** — 3 steps: Browse → Express Interest → Visit Agent → Receive Your Car
- **Trust section** — explain the agent verification network, why it's safe, physical signing
- **Featured cars** — show 3–4 cars from `data/cars.ts` with a "View All" link

### Cars (`/cars`)
- Responsive grid of `CarCard` components
- Each card: main image, make/model/year, price, mileage, "View Details" button
- Show only `available: true` cars

### Car Detail (`/cars/[slug]`)
- Image gallery
- Full specs table (year, mileage, engine, transmission, condition)
- Price in USD (add GHS equivalent if known)
- Description
- **Interest form** (agent referral flow — see above)
- WhatsApp CTA button: direct link to company WhatsApp with pre-filled message

### About (`/about`)
- Company story
- The agent trust network — explain how it works, why it matters
- List of regions covered (can be hardcoded)

### Contact (`/contact`)
- Name, phone, email, message fields
- Same Formspree endpoint or a separate one
- Company phone, email, address, WhatsApp displayed alongside

---

## Design Direction

The site should feel **professional, trustworthy, and modern** — not like a generic car dealership template.

- Clean whitespace, strong typography
- Trust signals everywhere (agent network, physical verification, signed contracts)
- Mobile-first — most visitors will be on phones
- Accent color should feel premium (deep blue, navy, or charcoal — not flashy)
- Car images are the hero — give them space

---

## Migration Path (static → live API)

When the ShipLink portal is ready and the company has entered their data:

| Now (static) | Later (API) |
|---|---|
| `data/company.ts` | `GET /api/v1/companies/:id/public` |
| `data/cars.ts` | `GET /api/v1/companies/:id/inventory` |
| Formspree form submission | `POST /api/v1/leads` with `referredByCode` |
| Agent referral = free text | Agent referral = validated against agents table, stored as `agentId` |

All data-fetching will move into Next.js server components using `fetch`. No structural changes to pages or components needed — only the data source changes.

---

## Environment Variables

```env
# .env.local
NEXT_PUBLIC_FORMSPREE_URL=https://formspree.io/f/your-form-id
```

---

## Naming Conventions

- Files and folders: `kebab-case`
- Components: `PascalCase`
- Types: `PascalCase`
- Variables/functions: `camelCase`
- All server components by default — add `"use client"` only when needed (forms, interactivity)