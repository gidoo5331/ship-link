import { cache } from "react"
import type { SiteCompany } from "@/types"
import { apiEnabled, getPublic, SUBDOMAIN } from "./client"
import { sampleCompany } from "./sample"

type ApiCompany = {
  name: string
  email: string | null
  phone: string | null
  address: string | null
  logoUrl: string | null
  whatsapp: string | null
  tagline: string | null
  heroHeading: string | null
  heroSubheading: string | null
  about: string | null
}

const DEFAULT_SUBHEADING = "Browse what's available now, or tell us what you're looking for and we'll source it for you."

// "gh-motors" → "Gh Motors": the best name we have without the API
function nameFromSubdomain(subdomain: string) {
  return subdomain
    .split("-")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ")
}

// Used when the API can't be reached, so the header and footer still render
// and pages can say "temporarily unavailable" instead of crashing.
function unavailableCompany(): SiteCompany {
  const name = nameFromSubdomain(SUBDOMAIN ?? "") || "Our store"
  return {
    name,
    tagline: "",
    phone: "",
    email: "",
    address: "",
    logoUrl: null,
    whatsapp: "",
    about: "",
    heroHeading: `Welcome to ${name}`,
    heroSubheading: DEFAULT_SUBHEADING,
    isSample: false,
    unavailable: true,
  }
}

// Company details from the portal's Settings, with neutral wording for any
// field left empty. Cached so the layout and page share one request.
// Never throws: if the API is down the site still renders, with less detail.
export const getCompany = cache(async (): Promise<SiteCompany> => {
  if (!apiEnabled) return sampleCompany

  let c: ApiCompany | null
  try {
    c = await getPublic<ApiCompany>("")
  } catch (error) {
    console.error("[website] Couldn't load company details:", error instanceof Error ? error.message : error)
    return unavailableCompany()
  }
  if (!c) {
    console.error(`[website] Company "${SUBDOMAIN}" not found or not approved — check COMPANY_SUBDOMAIN`)
    return unavailableCompany()
  }

  return {
    name: c.name,
    tagline: c.tagline ?? "",
    phone: c.phone ?? "",
    email: c.email ?? "",
    address: c.address ?? "",
    logoUrl: c.logoUrl,
    whatsapp: c.whatsapp ?? "",
    about: c.about ?? `${c.name} sources quality products and delivers them across Ghana.`,
    heroHeading: c.heroHeading ?? `Welcome to ${c.name}`,
    heroSubheading: c.heroSubheading ?? DEFAULT_SUBHEADING,
    isSample: false,
  }
})
