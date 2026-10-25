"use client"

import { useId, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { submitLead } from "@/api/leads"

type Props = {
  // ShipLink API endpoint for this company's leads; null = use Formspree (sample site)
  endpoint: string | null
  // set for "I'm interested" on a product; omitted for a custom request
  productId?: string
  productName?: string
}

const inputCls =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors aria-invalid:border-destructive aria-invalid:ring-destructive/20"

function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string
  label: string
  error?: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && (
        <p id={`${id}-error`} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

export default function LeadForm({ endpoint, productId, productName }: Props) {
  const isRequest = !productId
  const uid = useId()
  const [submitted, setSubmitted] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const schema = z.object({
    fullName: z.string().trim().min(2, "Please enter your full name"),
    phone: z.string().refine((v) => v.replace(/\D/g, "").length >= 9, "Please enter a valid phone number"),
    location: z.string().trim().min(2, "Please enter your city or region"),
    customRequest: isRequest
      ? z.string().trim().min(5, "Tell us a little about what you're looking for")
      : z.string().optional(),
    referralCode: z.string().optional(),
    website: z.string().optional(), // spam trap
  })
  type FormData = z.infer<typeof schema>

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setServerError(null)
    const error = await submitLead(endpoint, { ...data, productId, productName })
    if (error) setServerError(error)
    else setSubmitted(true)
  }

  if (submitted) {
    return (
      <div role="status" className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-slate-50 px-6 py-10 text-center">
        <CheckCircle2 className="h-10 w-10 text-green-500" aria-hidden />
        <div>
          <p className="text-base font-semibold text-foreground">Request received!</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {productName
              ? `We'll be in touch within 24 hours about the ${productName}.`
              : "We'll be in touch within 24 hours to talk about what you need."}
          </p>
        </div>
      </div>
    )
  }

  const id = (name: string) => `${uid}-${name}`
  const invalid = (name: keyof FormData) => ({
    "aria-invalid": !!errors[name],
    "aria-describedby": errors[name] ? `${id(name)}-error` : undefined,
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {isRequest && (
        <Field id={id("customRequest")} label="What are you looking for?" error={errors.customRequest?.message}>
          <textarea
            id={id("customRequest")}
            rows={3}
            {...register("customRequest")}
            placeholder="e.g. A 2022 Toyota Camry, white or silver, under USD 28,000"
            className={cn(inputCls, "resize-y")}
            {...invalid("customRequest")}
          />
        </Field>
      )}

      <Field id={id("fullName")} label="Full Name" error={errors.fullName?.message}>
        <input id={id("fullName")} {...register("fullName")} autoComplete="name" placeholder="e.g. Kofi Mensah" className={inputCls} {...invalid("fullName")} />
      </Field>

      <Field id={id("phone")} label="Phone Number" error={errors.phone?.message}>
        <input id={id("phone")} {...register("phone")} type="tel" autoComplete="tel" placeholder="e.g. 0244 000 000" className={inputCls} {...invalid("phone")} />
      </Field>

      <Field id={id("location")} label="Your City / Region" error={errors.location?.message}>
        <input id={id("location")} {...register("location")} placeholder="e.g. Kumasi" className={inputCls} {...invalid("location")} />
      </Field>

      <Field
        id={id("referralCode")}
        label="Agent Code or Name (Optional)"
        hint="Were you referred by one of our agents? Enter their name or code so we can credit them."
      >
        <input id={id("referralCode")} {...register("referralCode")} placeholder="e.g. AGENT-042 or Kwame Asante" className={inputCls} />
      </Field>

      {/* spam trap: hidden from people and screen readers, bots fill it in */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor={id("website")}>Leave this empty</label>
        <input id={id("website")} {...register("website")} tabIndex={-1} autoComplete="off" />
      </div>

      {serverError && (
        <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {serverError}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
        {isSubmitting ? "Sending…" : isRequest ? "Send Request" : "Submit Interest"}
      </Button>
    </form>
  )
}
