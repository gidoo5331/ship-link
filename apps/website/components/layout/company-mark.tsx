import type { SiteCompany } from "@/types"

// Logo from Settings, or the company's initials
export default function CompanyMark({ company }: { company: SiteCompany }) {
  const initials = company.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("")

  if (company.logoUrl && !company.isSample) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- logo from storage
      <img src={company.logoUrl} alt="" className="h-8 w-8 rounded-md object-cover" />
    )
  }

  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
      <span className="text-sm font-bold text-primary-foreground">{initials}</span>
    </div>
  )
}
