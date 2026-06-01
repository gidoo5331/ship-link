import type { Metadata } from "next"
import { company } from "@/data/company"
import { ShieldCheck, FileText, MapPin, Users, ArrowRight } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: `About Us — ${company.name}`,
  description: company.about,
}

const regions = [
  "Greater Accra", "Ashanti", "Western", "Central",
  "Eastern", "Northern", "Upper East", "Upper West",
  "Volta", "Bono", "Ahafo", "Savannah",
]

const values = [
  {
    icon: ShieldCheck,
    title: "Verified Agents Only",
    body: "Every agent in our network goes through a personal vetting process. They carry official Frank Ventures ID and are held to a strict code of conduct. If an agent ever behaves outside our standards, we want to know.",
  },
  {
    icon: FileText,
    title: "Signed Contracts, Every Time",
    body: "Every purchase is backed by a written agreement — signed by you, your agent, and Frank Ventures. You know exactly what you're buying, for exactly how much, with no hidden charges.",
  },
  {
    icon: Users,
    title: "Agents Who Know Your Area",
    body: "Our agents live and work in the regions they serve. They know the roads, the processes, the local registration offices — and they speak your language. No outsider showing up with a phone.",
  },
  {
    icon: MapPin,
    title: "Nationwide, Not Just Accra",
    body: "We started in Accra but we've grown. Today we have verified agents across 12 regions. Whether you're in Tamale, Takoradi, or Techiman, there's an agent near you.",
  },
]

const steps = [
  { step: "01", title: "Agent Joins Our Network", body: "Agents apply, are interviewed in person, and sign our agent agreement. We verify their identity and background before they represent us." },
  { step: "02", title: "Agent Shares Your Listing", body: "The agent shows a customer our inventory — online or in person — and helps them choose the right car for their budget and needs." },
  { step: "03", title: "Customer Expresses Interest", body: "The customer submits interest through our site with the agent's code or name. This ties the agent to the sale." },
  { step: "04", title: "Sale is Completed", body: "Papers are signed, payment is confirmed, and the agent earns their commission. The customer drives away with a car they trust." },
]

export default function AboutPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <div className="bg-slate-950 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
              About Frank Ventures
            </h1>
            <p className="mt-6 text-lg leading-8 text-slate-400">
              {company.about}
            </p>
          </div>
        </div>
      </div>

      {/* Values */}
      <div className="py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Why Customers Trust Us
            </h2>
            <p className="mt-4 text-base text-muted-foreground">
              Buying a car is one of the biggest purchases you&apos;ll make. Here&apos;s how we make sure you&apos;re protected every step of the way.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2">
            {values.map((v) => (
              <div key={v.title} className="rounded-2xl border border-border bg-slate-50 p-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <v.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-5 text-base font-semibold text-foreground">{v.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How the agent network works */}
      <div className="border-t border-border bg-slate-50 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              How Our Agent Network Works
            </h2>
            <p className="mt-4 text-base text-muted-foreground">
              Agents are the backbone of Frank Ventures. They make car buying personal, local, and safe.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s) => (
              <div key={s.step} className="rounded-2xl border border-border bg-white p-6">
                <span className="text-4xl font-black text-primary/20">{s.step}</span>
                <h3 className="mt-3 text-base font-semibold text-foreground">{s.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Regions */}
      <div className="py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Regions We Cover
            </h2>
            <p className="mt-4 text-base text-muted-foreground">
              We have verified agents operating across all major regions of Ghana.
            </p>
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {regions.map((region) => (
              <span
                key={region}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-slate-50 px-4 py-2 text-sm font-medium text-foreground"
              >
                <MapPin className="h-3.5 w-3.5 text-primary" />
                {region}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="border-t border-border bg-slate-950 py-16">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">Ready to find your car?</h2>
          <p className="mt-3 text-slate-400">Browse our full inventory and connect with an agent near you.</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/cars">
                Browse Cars
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-slate-700 bg-transparent text-slate-200 hover:bg-slate-800 hover:text-white">
              <Link href="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
