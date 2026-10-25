// Shared plumbing for the ShipLink API.
//
// The site reads its company and catalog from the API once SHIPLINK_API_URL
// and COMPANY_SUBDOMAIN are set. Until then it serves the bundled sample data
// (see ./sample.ts), so it never goes blank.

export const API_URL = process.env.SHIPLINK_API_URL?.replace(/\/+$/, "")
export const SUBDOMAIN = process.env.COMPANY_SUBDOMAIN

// how long the site caches API data before fetching fresh copies
const REVALIDATE_SECONDS = 60

export const apiEnabled = Boolean(API_URL && SUBDOMAIN)

// This company's public endpoints, e.g. publicUrl("/products")
export function publicUrl(path: string) {
  return `${API_URL}/public/companies/${SUBDOMAIN}${path}`
}

// The API returns snake_case keys; the site uses camelCase
function toCamel(key: string) {
  return key.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase())
}

export function camelize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(camelize)
  if (value && typeof value === "object" && value.constructor === Object) {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [toCamel(k), camelize(v)]))
  }
  return value
}

// GET a public endpoint for this company. 404 → null; other failures throw
// (during a background refresh Next keeps serving the previous page).
export async function getPublic<T>(path: string): Promise<T | null> {
  let res: Response
  try {
    res = await fetch(publicUrl(path), { next: { revalidate: REVALIDATE_SECONDS } })
  } catch {
    throw new Error(`Can't reach the ShipLink API at ${API_URL}. Is the backend running, and is SHIPLINK_API_URL right?`)
  }

  // the API always answers JSON; HTML means the URL points at some other server
  if (!res.headers.get("content-type")?.includes("application/json")) {
    throw new Error(`SHIPLINK_API_URL (${API_URL}) doesn't point to the ShipLink API — it answered with ${res.status} ${res.headers.get("content-type") ?? "no content type"}.`)
  }
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`ShipLink API request failed: ${res.status} ${path}`)
  return camelize(await res.json()) as T
}
