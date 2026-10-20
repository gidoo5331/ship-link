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

export const CHECKLIST_LABELS: Record<string, string> = {
  photo: "At least one photo",
  category: "Category chosen",
  price: "Price estimate set",
  description: "Description written",
}
