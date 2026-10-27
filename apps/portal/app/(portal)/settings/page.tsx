"use client"

import { useEffect, useRef, useState } from "react"
import { ExternalLink, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, Field, inputClass, textareaClass } from "@/components/form"
import { LoadError, Loading } from "@/components/load-state"
import { api, ApiError, uploadToPresignedUrl } from "@/lib/api"
import { companyPath, useAuth } from "@/lib/auth"
import { initials, websiteHost, websiteUrl } from "@/lib/format"
import { cn } from "@/lib/utils"

type Settings = {
  id: string
  name: string
  subdomain: string
  email: string | null
  phone: string | null
  whatsapp: string | null
  address: string | null
  logoUrl: string | null
  tagline: string | null
  heroHeading: string | null
  heroSubheading: string | null
  about: string | null
  rentalsEnabled: boolean
}

type Form = Record<"name" | "email" | "phone" | "whatsapp" | "address" | "tagline" | "heroHeading" | "heroSubheading" | "about", string> & {
  rentalsEnabled: boolean
}

const LOGO_TYPES = ["image/jpeg", "image/png", "image/webp"]
const LOGO_MAX_BYTES = 2 * 1024 * 1024

function toForm(s: Settings): Form {
  return {
    name: s.name,
    email: s.email ?? "",
    phone: s.phone ?? "",
    whatsapp: s.whatsapp ?? "",
    address: s.address ?? "",
    tagline: s.tagline ?? "",
    heroHeading: s.heroHeading ?? "",
    heroSubheading: s.heroSubheading ?? "",
    about: s.about ?? "",
    rentalsEnabled: s.rentalsEnabled,
  }
}

export default function SettingsPage() {
  const { user, refreshUser } = useAuth()
  const [settings, setSettings] = useState<Settings | null>(null)
  const [form, setForm] = useState<Form | null>(null)
  const [saving, setSaving] = useState(false)
  const [logoBusy, setLogoBusy] = useState(false)
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const settingsPath = companyPath(user, "/settings")

  useEffect(() => {
    api<Settings>("GET", settingsPath)
      .then((s) => {
        setSettings(s)
        setForm(toForm(s))
      })
      .catch((e) => setMessage({ text: e instanceof ApiError ? e.message : "Couldn't load settings.", error: true }))
  }, [settingsPath])

  const dirty = !!settings && !!form && JSON.stringify(form) !== JSON.stringify(toForm(settings))

  useEffect(() => {
    if (!dirty) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener("beforeunload", onBeforeUnload)
    return () => window.removeEventListener("beforeunload", onBeforeUnload)
  }, [dirty])

  async function apply(update: Promise<Settings>, success: string) {
    const next = await update
    setSettings(next)
    setForm(toForm(next))
    setMessage({ text: success })
    await refreshUser().catch(() => {})
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!form) return
    if (!form.name.trim()) {
      setMessage({ text: "Company name can't be empty.", error: true })
      return
    }
    setSaving(true)
    setMessage(null)
    try {
      await apply(api<Settings>("PATCH", settingsPath, { ...form, whatsapp: form.whatsapp.replace(/[\s+()-]/g, "") }), "Saved. Your website updates within a minute.")
    } catch (err) {
      setMessage({ text: err instanceof ApiError ? err.message : "Couldn't save.", error: true })
    } finally {
      setSaving(false)
    }
  }

  async function uploadLogo(file: File | undefined) {
    if (!file) return
    setMessage(null)
    if (!LOGO_TYPES.includes(file.type) || file.size > LOGO_MAX_BYTES) {
      setMessage({ text: "Use a JPG, PNG or WebP logo under 2 MB.", error: true })
      return
    }
    setLogoBusy(true)
    try {
      const { uploadUrl, url } = await api<{ uploadUrl: string; url: string }>("POST", `${settingsPath}/logo/upload-url`, {
        contentType: file.type,
        size: file.size,
      })
      await uploadToPresignedUrl(uploadUrl, file)
      await apply(api<Settings>("PATCH", settingsPath, { logoUrl: url }), "Logo updated.")
    } catch (err) {
      setMessage({ text: err instanceof ApiError ? err.message : "Logo upload failed.", error: true })
    } finally {
      setLogoBusy(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  async function removeLogo() {
    setLogoBusy(true)
    setMessage(null)
    try {
      await apply(api<Settings>("PATCH", settingsPath, { logoUrl: null }), "Logo removed.")
    } catch (err) {
      setMessage({ text: err instanceof ApiError ? err.message : "Couldn't remove the logo.", error: true })
    } finally {
      setLogoBusy(false)
    }
  }

  if (!settings || !form) {
    return (
      <div className="p-8">
        {message?.error ? (
          <LoadError message={message.text} onRetry={() => window.location.reload()} />
        ) : (
          <Loading label="Loading settings…" />
        )}
      </div>
    )
  }

  const set = (key: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [key]: e.target.value })

  return (
    <form onSubmit={save} className="flex flex-col" noValidate>
      <header className="sticky top-0 z-10 flex flex-wrap items-center gap-3 border-b bg-background/95 px-6 py-3 backdrop-blur md:px-8">
        <h1 className="text-lg font-semibold tracking-tight">Settings</h1>
        {dirty && <span className="text-xs text-muted-foreground">Unsaved changes</span>}
        <Button type="submit" size="lg" className="ml-auto h-10 px-4" disabled={saving || !dirty}>
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </header>

      {message && (
        <p
          role={message.error ? "alert" : "status"}
          className={cn("mx-6 mt-4 rounded-lg px-3 py-2 text-sm md:mx-8", message.error ? "bg-red-50 text-red-700" : "bg-green-50 text-green-800")}
        >
          {message.text}
        </p>
      )}

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-8 md:px-8">
        <Card aria-labelledby="logo-h" className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 id="logo-h" className="text-base font-semibold">
              Logo
            </h2>
            <p className="text-sm text-muted-foreground">Shown in your website&apos;s header and in this portal. Square works best; JPG, PNG or WebP under 2 MB.</p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex size-16 items-center justify-center overflow-hidden rounded-xl bg-primary text-xl font-semibold text-primary-foreground">
              {settings.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- logo from storage
                <img src={settings.logoUrl} alt={`${settings.name} logo`} className="size-full object-cover" />
              ) : (
                <span aria-hidden>{initials(settings.name)}</span>
              )}
            </span>
            <div className="flex flex-wrap gap-2">
              <label
                className={cn(
                  "inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-lg border px-4 text-sm font-medium hover:bg-muted focus-within:ring-3 focus-within:ring-ring/40",
                  logoBusy && "pointer-events-none opacity-60",
                )}
              >
                <Upload className="size-4" aria-hidden />
                {logoBusy ? "Uploading…" : settings.logoUrl ? "Replace logo" : "Upload logo"}
                <input ref={fileRef} type="file" accept={LOGO_TYPES.join(",")} className="sr-only" onChange={(e) => uploadLogo(e.target.files?.[0])} />
              </label>
              {settings.logoUrl && (
                <Button type="button" variant="outline" size="lg" className="h-10 px-4" disabled={logoBusy} onClick={removeLogo}>
                  Remove
                </Button>
              )}
            </div>
          </div>
        </Card>

        <Card aria-labelledby="company-h" className="flex flex-col gap-4">
          <h2 id="company-h" className="text-base font-semibold">
            Company details
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Company name" htmlFor="name" className="sm:col-span-2">
              <input id="name" value={form.name} onChange={set("name")} className={inputClass} required />
            </Field>
            <Field label="Email" htmlFor="email">
              <input id="email" type="email" value={form.email} onChange={set("email")} className={inputClass} placeholder="info@company.com" />
            </Field>
            <Field label="Phone" htmlFor="phone">
              <input id="phone" type="tel" value={form.phone} onChange={set("phone")} className={inputClass} placeholder="+233 24 000 0000" />
            </Field>
            <Field label="WhatsApp number" htmlFor="whatsapp" hint="With country code, e.g. 233 24 000 0000. Powers the “Ask on WhatsApp” buttons.">
              <input id="whatsapp" type="tel" value={form.whatsapp} onChange={set("whatsapp")} className={inputClass} placeholder="233240000000" />
            </Field>
            <Field label="Address" htmlFor="address">
              <input id="address" value={form.address} onChange={set("address")} className={inputClass} placeholder="Street, town" />
            </Field>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="text-sm font-medium">Website address</span>
              <a
                href={websiteUrl(settings.subdomain)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 self-start text-sm text-neutral-700 underline underline-offset-4"
              >
                {websiteHost(settings.subdomain)}
                <ExternalLink className="size-3.5" aria-hidden />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
              <p className="text-xs text-muted-foreground">To change your web address, contact ShipLink support.</p>
            </div>
          </div>
        </Card>

        <Card aria-labelledby="website-h" className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 id="website-h" className="text-base font-semibold">
              Website content
            </h2>
            <p className="text-sm text-muted-foreground">The words on your website&apos;s home and About pages. Empty fields use a sensible default.</p>
          </div>
          <Field label="Tagline" htmlFor="tagline" hint="One line under your name, e.g. “Quality foreign-used cars, delivered”">
            <input id="tagline" value={form.tagline} onChange={set("tagline")} maxLength={120} className={inputClass} />
          </Field>
          <Field label="Home page heading" htmlFor="heroHeading">
            <input
              id="heroHeading"
              value={form.heroHeading}
              onChange={set("heroHeading")}
              maxLength={120}
              className={inputClass}
              placeholder="e.g. Find your perfect car — delivered across Ghana"
            />
          </Field>
          <Field label="Home page intro" htmlFor="heroSubheading">
            <textarea id="heroSubheading" rows={2} value={form.heroSubheading} onChange={set("heroSubheading")} maxLength={300} className={textareaClass} />
          </Field>
          <Field label="About your company" htmlFor="about" hint={`${form.about.length} / 2000`}>
            <textarea id="about" rows={6} value={form.about} onChange={set("about")} maxLength={2000} className={textareaClass} />
          </Field>
        </Card>

        <Card aria-labelledby="rentals-h" className="flex flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex max-w-lg flex-col gap-1">
              <h2 id="rentals-h" className="text-base font-semibold">
                Rentals
              </h2>
              <p id="rentals-desc" className="text-sm text-muted-foreground">
                Rent out some of your products as well as selling them. You can then set a rental rate on any product, and people can
                enquire to rent it on your website. You agree dates and terms with them directly.
              </p>
            </div>
            <label className="flex cursor-pointer items-center gap-3">
              <span className="text-sm font-medium">{form.rentalsEnabled ? "On" : "Off"}</span>
              <input
                type="checkbox"
                role="switch"
                aria-labelledby="rentals-h"
                aria-describedby="rentals-desc"
                checked={form.rentalsEnabled}
                onChange={(e) => setForm({ ...form, rentalsEnabled: e.target.checked })}
                className="peer sr-only"
              />
              <span
                aria-hidden
                className="relative h-6 w-11 shrink-0 rounded-full bg-neutral-300 transition-colors peer-checked:bg-primary peer-focus-visible:ring-3 peer-focus-visible:ring-ring/40 after:absolute after:left-0.5 after:top-0.5 after:size-5 after:rounded-full after:bg-white after:shadow-sm after:transition-transform peer-checked:after:translate-x-5 motion-reduce:transition-none motion-reduce:after:transition-none"
              />
            </label>
          </div>
          {settings.rentalsEnabled && !form.rentalsEnabled && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Turning this off hides rental prices and rent-only products from your website. Their rental details are kept, so you can turn
              it back on later.
            </p>
          )}
        </Card>
      </div>
    </form>
  )
}
