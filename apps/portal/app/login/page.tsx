"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Field, inputClass } from "@/components/form"
import { useAuth } from "@/lib/auth"

export default function LoginPage() {
  const { user, loading, login } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard")
  }, [loading, user, router])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(email, password)
      router.replace("/dashboard")
    } catch {
      setError("Email or password is incorrect.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <section className="flex flex-col justify-between gap-12 bg-primary px-8 py-10 text-primary-foreground md:w-1/2 md:px-12">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary-foreground text-primary">
            <Package className="size-[18px]" aria-hidden />
          </span>
          <span className="text-lg font-semibold tracking-tight">ShipLink</span>
        </div>
        <div className="flex max-w-md flex-col gap-4">
          <p className="text-3xl font-semibold leading-tight tracking-tight">Every shipment, from request to doorstep.</p>
          <p className="text-neutral-300">Manage your catalog, leads and shipments in one place.</p>
        </div>
        <p className="text-sm text-neutral-400">© {new Date().getFullYear()} ShipLink</p>
      </section>

      <section className="flex flex-1 items-center justify-center px-6 py-10">
        <form onSubmit={onSubmit} className="flex w-full max-w-sm flex-col gap-6" noValidate>
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">Sign in to your portal</h1>
            <p className="text-sm text-muted-foreground">Use the email your company registered with.</p>
          </div>

          <div className="flex flex-col gap-4">
            <Field label="Email" htmlFor="email">
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                placeholder="you@company.com"
              />
            </Field>
            <Field label="Password" htmlFor="password">
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>

          {error && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <Button type="submit" size="lg" className="h-10" disabled={submitting || !email || !password}>
            {submitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </section>
    </div>
  )
}
