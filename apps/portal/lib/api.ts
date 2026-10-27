// Thin client for the ShipLink API.
// The API returns snake_case keys; everything in the portal uses camelCase.

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1").replace(/\/+$/, "")
const TOKEN_KEY = "shiplink.token"

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: Record<string, unknown>,
  ) {
    super(message)
  }
}

// ── Token storage ────────────────────────────────────────────────────────────

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    // storage blocked — session lasts until reload
  }
}

// ── Key casing ───────────────────────────────────────────────────────────────

function toCamel(key: string) {
  return key.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase())
}

function camelize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(camelize)
  if (value && typeof value === "object" && value.constructor === Object) {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [toCamel(k), camelize(v)]))
  }
  return value
}

// ── Requests ─────────────────────────────────────────────────────────────────

type Method = "GET" | "POST" | "PATCH" | "DELETE"

export async function api<T>(method: Method, path: string, body?: unknown): Promise<T> {
  const token = getToken()
  let res: Response
  try {
    res = await fetch(API_URL + path, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    // no response at all: offline, server down or wrong API URL
    throw new ApiError(0, "Can't reach the server. Check your connection and try again.")
  }

  const data = res.status === 204 ? null : await res.json().catch(() => null)

  if (!res.ok) {
    if (res.status === 401) {
      setToken(null)
      window.dispatchEvent(new Event("shiplink:unauthorized"))
    }
    const message = Array.isArray(data?.message) ? data.message.join(", ") : data?.message
    throw new ApiError(res.status, message || res.statusText || "Request failed", camelize(data) as Record<string, unknown>)
  }

  return camelize(data) as T
}

// Upload a file straight to storage with a presigned URL from the API.
export async function uploadToPresignedUrl(uploadUrl: string, file: File) {
  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  })
  if (!res.ok) throw new ApiError(res.status, "Upload failed")
}
