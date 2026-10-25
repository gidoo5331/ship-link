import type { Company } from "@/types"

// The logo from Keystatic, or the company's initials if there isn't one
export default function CompanyMark({ company }: { company: Company }) {
  if (company.logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- uploaded logo, any size
      <img src={company.logoUrl} alt="" className="h-8 w-8 rounded-md object-cover" />
    )
  }

  const initials = company.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("")

  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
      <span className="text-sm font-bold text-primary-foreground">{initials}</span>
    </div>
  )
}
