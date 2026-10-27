// Matches apps/website/lib/currency.ts until rates come from the API
export const USD_TO_GHS = 11.45

export function formatMoney(amount: number, currency: string) {
  return `${currency} ${Math.round(amount).toLocaleString("en-US")}`
}

export function ghsEstimate(amount: number, currency: string) {
  return currency === "GHS" ? null : formatMoney(amount * USD_TO_GHS, "GHS")
}

// The company's public website. NEXT_PUBLIC_WEBSITE_URL may contain
// {subdomain}, e.g. https://{subdomain}.shiplink.com
export function websiteUrl(subdomain: string) {
  const template = process.env.NEXT_PUBLIC_WEBSITE_URL || "https://{subdomain}.shiplink.com"
  return template.replace("{subdomain}", subdomain).replace(/\/+$/, "")
}

export function websiteHost(subdomain: string) {
  const url = websiteUrl(subdomain)
  try {
    return new URL(url).host
  } catch {
    return url
  }
}

export function initials(text: string) {
  return text
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("")
}

// "just now", "5 min ago", "3 h ago", "yesterday", "12 Oct"
export function timeAgo(iso: string) {
  const then = new Date(iso)
  const minutes = Math.round((Date.now() - then.getTime()) / 60_000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} h ago`
  if (hours < 48) return "yesterday"
  return then.toLocaleDateString("en-GB", { day: "numeric", month: "short", ...(then.getFullYear() !== new Date().getFullYear() && { year: "numeric" }) })
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

// wa.me needs digits with the country code; leads store that as phoneKey
export function whatsappLink(phoneKey: string, text?: string) {
  return `https://wa.me/${phoneKey}${text ? `?text=${encodeURIComponent(text)}` : ""}`
}

const RENTAL_UNITS = { DAY: "day", WEEK: "week", MONTH: "month" } as const

// "GHS 600 / day"
export function formatRentalRate(rental: { rate: number; currency: string; unit: keyof typeof RENTAL_UNITS }) {
  return `${formatMoney(rental.rate, rental.currency)} / ${RENTAL_UNITS[rental.unit]}`
}

// Keys the API can return in publishChecklist. "offer" only appears for
// products that are neither for sale nor for rent.
export const CHECKLIST_LABELS: Record<string, string> = {
  photo: "At least one photo",
  category: "Category chosen",
  offer: "For sale or for rent",
  price: "Price estimate set",
  description: "Description written",
}
