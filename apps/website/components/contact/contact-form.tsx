"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

const schema = z.object({
  fullName: z.string().min(2, "Please enter your full name"),
  phone: z.string().min(9, "Please enter a valid phone number"),
  email: z.string().email("Please enter a valid email address"),
  message: z.string().min(10, "Please write at least a sentence so we know how to help"),
})

type FormData = z.infer<typeof schema>

const inputCls =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors aria-invalid:border-destructive aria-invalid:ring-destructive/20"

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

export default function ContactForm() {
  const [submitted, setSubmitted] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setServerError(null)
    const endpoint = process.env.NEXT_PUBLIC_FORMSPREE_URL

    if (!endpoint) {
      setServerError("Contact form is not configured yet. Please reach out via phone or WhatsApp.")
      return
    }

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error()
      setSubmitted(true)
    } catch {
      setServerError("Something went wrong. Please try again or contact us directly.")
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-slate-50 px-6 py-12 text-center">
        <CheckCircle2 className="h-10 w-10 text-green-500" />
        <div>
          <p className="text-base font-semibold text-foreground">Message Sent!</p>
          <p className="mt-1 text-sm text-muted-foreground">
            We&apos;ll get back to you within 24 hours.
          </p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Field label="Full Name" error={errors.fullName?.message}>
        <input
          {...register("fullName")}
          placeholder="e.g. Kwame Asante"
          className={cn(inputCls)}
          aria-invalid={!!errors.fullName}
        />
      </Field>

      <Field label="Phone Number" error={errors.phone?.message}>
        <input
          {...register("phone")}
          type="tel"
          placeholder="e.g. 0244 000 000"
          className={cn(inputCls)}
          aria-invalid={!!errors.phone}
        />
      </Field>

      <Field label="Email Address" error={errors.email?.message}>
        <input
          {...register("email")}
          type="email"
          placeholder="e.g. kwame@email.com"
          className={cn(inputCls)}
          aria-invalid={!!errors.email}
        />
      </Field>

      <Field label="Message" error={errors.message?.message}>
        <textarea
          {...register("message")}
          rows={4}
          placeholder="Tell us how we can help — a car you're looking for, a question about an agent, anything."
          className={cn(inputCls, "resize-none")}
          aria-invalid={!!errors.message}
        />
      </Field>

      {serverError && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {serverError}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isSubmitting ? "Sending…" : "Send Message"}
      </Button>
    </form>
  )
}
