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
  location: z.string().min(2, "Please enter your city or region"),
  agentReferral: z.string().optional(),
  carId: z.string(),
  carName: z.string(),
})

type FormData = z.infer<typeof schema>

type Props = {
  carId: string
  carName: string
}

function Field({
  label,
  error,
  children,
  hint,
}: {
  label: string
  error?: string
  children: React.ReactNode
  hint?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

const inputCls =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors aria-invalid:border-destructive aria-invalid:ring-destructive/20"

export default function InterestForm({ carId, carName }: Props) {
  const [submitted, setSubmitted] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { carId, carName },
  })

  const onSubmit = async (data: FormData) => {
    setServerError(null)
    const endpoint = process.env.NEXT_PUBLIC_FORMSPREE_URL

    if (!endpoint) {
      setServerError("Contact form is not configured yet. Please reach out via WhatsApp or phone.")
      return
    }

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(data),
      })

      if (!res.ok) throw new Error("Submission failed")
      setSubmitted(true)
    } catch {
      setServerError("Something went wrong. Please try again or contact us directly.")
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-slate-50 px-6 py-10 text-center">
        <CheckCircle2 className="h-10 w-10 text-green-500" />
        <div>
          <p className="text-base font-semibold text-foreground">Request Received!</p>
          <p className="mt-1 text-sm text-muted-foreground">
            We&apos;ll be in touch within 24 hours to discuss your interest in the {carName}.
          </p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <input type="hidden" {...register("carId")} />
      <input type="hidden" {...register("carName")} />

      <Field label="Full Name" error={errors.fullName?.message}>
        <input
          {...register("fullName")}
          placeholder="e.g. Kofi Mensah"
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

      <Field label="Your City / Region" error={errors.location?.message}>
        <input
          {...register("location")}
          placeholder="e.g. Kumasi"
          className={cn(inputCls)}
          aria-invalid={!!errors.location}
        />
      </Field>

      <Field
        label="Agent Code or Name (Optional)"
        error={errors.agentReferral?.message}
        hint="Were you referred by one of our agents? Enter their name or code so we can credit them."
      >
        <input
          {...register("agentReferral")}
          placeholder="e.g. AGENT-042 or Kwame Asante"
          className={cn(inputCls)}
        />
      </Field>

      {serverError && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {serverError}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isSubmitting ? "Sending…" : "Submit Interest"}
      </Button>
    </form>
  )
}
