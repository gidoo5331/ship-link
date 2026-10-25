import { apiEnabled, publicUrl } from "./client"

// Where the "I'm interested" and request forms post. Read on the server and
// passed to the form, because the API URL isn't exposed to the browser.
// null on the sample site: the forms fall back to Formspree.
export const leadsEndpoint = apiEnabled ? publicUrl("/leads") : null

export type LeadSubmission = {
  fullName: string
  phone: string
  location: string
  productId?: string // "I'm interested" in a product…
  productName?: string
  customRequest?: string // …or a request for something not listed
  referralCode?: string
  website?: string // spam trap; real visitors leave it empty
}

// Runs in the visitor's browser. Returns an error message to show, or null on success.
export async function submitLead(endpoint: string | null, lead: LeadSubmission): Promise<string | null> {
  const url = endpoint ?? process.env.NEXT_PUBLIC_FORMSPREE_URL
  if (!url) return "This form isn't set up yet. Please reach out by phone or WhatsApp."

  // the API only accepts its own fields; Formspree takes everything
  const body = endpoint
    ? {
        fullName: lead.fullName,
        phone: lead.phone,
        location: lead.location,
        ...(lead.productId ? { productId: lead.productId } : { customRequest: lead.customRequest }),
        ...(lead.referralCode?.trim() && { referralCode: lead.referralCode.trim() }),
        ...(lead.website && { website: lead.website }),
      }
    : lead

  let res: Response
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
    })
  } catch {
    return "Couldn't send — check your connection and try again."
  }

  if (res.ok) return null
  if (res.status === 429) return "Too many attempts. Please wait a minute and try again."

  const json = await res.json().catch(() => null)
  const message = Array.isArray(json?.message) ? json.message[0] : json?.message
  return res.status === 400 && message ? message : "Something went wrong. Please try again or contact us directly."
}
