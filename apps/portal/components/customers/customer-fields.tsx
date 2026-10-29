"use client"

import { Field, inputClass, textareaClass } from "@/components/form"
import type { Customer } from "@/lib/types"

export type CustomerForm = {
  firstName: string
  lastName: string
  phone: string
  email: string
  ghanaCardNumber: string
  address: string
  city: string
  region: string
  notes: string
}

export const emptyCustomerForm: CustomerForm = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  ghanaCardNumber: "",
  address: "",
  city: "",
  region: "",
  notes: "",
}

export function customerToForm(c: Customer): CustomerForm {
  return {
    firstName: c.firstName,
    lastName: c.lastName,
    phone: c.phone,
    email: c.email ?? "",
    ghanaCardNumber: c.ghanaCardNumber ?? "",
    address: c.address ?? "",
    city: c.city ?? "",
    region: c.region ?? "",
    notes: c.notes ?? "",
  }
}

export const customerFormValid = (f: CustomerForm) =>
  !!f.firstName.trim() && !!f.lastName.trim() && f.phone.replace(/\D/g, "").length >= 9

// Shared by "Add customer", lead conversion and the customer page.
// `prefilled` marks fields that came from a lead.
export function CustomerFields({
  value,
  onChange,
  prefilled = [],
  showNotes = false,
  idPrefix = "c",
}: {
  value: CustomerForm
  onChange: (value: CustomerForm) => void
  prefilled?: (keyof CustomerForm)[]
  showNotes?: boolean
  idPrefix?: string
}) {
  const field = (key: keyof CustomerForm) => ({
    id: `${idPrefix}-${key}`,
    value: value[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange({ ...value, [key]: e.target.value }),
  })
  const label = (text: string, key: keyof CustomerForm) =>
    prefilled.includes(key) ? (
      <span className="flex items-center gap-1.5">
        {text}
        <span className="rounded-full bg-blue-50 px-1.5 py-px text-[11px] font-medium text-blue-700">From lead</span>
      </span>
    ) : (
      text
    )

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label={label("First name", "firstName")} htmlFor={`${idPrefix}-firstName`}>
        <input {...field("firstName")} className={inputClass} autoComplete="off" />
      </Field>
      <Field label={label("Last name", "lastName")} htmlFor={`${idPrefix}-lastName`}>
        <input {...field("lastName")} className={inputClass} autoComplete="off" />
      </Field>
      <Field label={label("Phone", "phone")} htmlFor={`${idPrefix}-phone`}>
        <input {...field("phone")} type="tel" className={inputClass} autoComplete="off" />
      </Field>
      <Field label="Email (optional)" htmlFor={`${idPrefix}-email`}>
        <input {...field("email")} type="email" className={inputClass} autoComplete="off" />
      </Field>
      <Field label="Ghana Card number" htmlFor={`${idPrefix}-ghanaCardNumber`}>
        <input {...field("ghanaCardNumber")} className={inputClass} placeholder="GHA-000000000-0" autoComplete="off" />
      </Field>
      <Field label={label("City", "city")} htmlFor={`${idPrefix}-city`}>
        <input {...field("city")} className={inputClass} autoComplete="off" />
      </Field>
      <Field label="Region" htmlFor={`${idPrefix}-region`}>
        <input {...field("region")} className={inputClass} placeholder="e.g. Ashanti" autoComplete="off" />
      </Field>
      <Field label="Address" htmlFor={`${idPrefix}-address`}>
        <input {...field("address")} className={inputClass} placeholder="House number, street, area" autoComplete="off" />
      </Field>
      {showNotes && (
        <Field label="Notes" htmlFor={`${idPrefix}-notes`} className="sm:col-span-2">
          <textarea {...field("notes")} rows={3} className={textareaClass} />
        </Field>
      )}
    </div>
  )
}
