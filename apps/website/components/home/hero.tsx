import Link from "next/link"
import { Button } from "@/components/ui/button"
import { company } from "@/data/company"
import { ArrowRight, MessageCircle } from "lucide-react"

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-slate-950 py-20 sm:py-28 lg:py-36">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,oklch(0.28_0.12_254/0.35)_0%,transparent_60%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-full bg-primary/10 blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary/80">
            Trusted by customers across Ghana
          </span>

          <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
            {company.heroHeading}
          </h1>

          <p className="mt-6 text-lg leading-8 text-slate-400">
            {company.heroSubheading}
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/cars">
                Browse Cars
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>

            <Button
              asChild
              size="lg"
              variant="outline"
              className="w-full border-slate-700 bg-transparent text-slate-200 hover:bg-slate-800 hover:text-white sm:w-auto"
            >
              <a
                href={`https://wa.me/${company.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="mr-2 h-4 w-4 text-green-400" />
                WhatsApp Us
              </a>
            </Button>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-3 divide-x divide-slate-800 rounded-xl border border-slate-800 bg-slate-900/60 py-6 backdrop-blur">
          {[
            { value: "200+", label: "Cars Sold" },
            { value: "10+", label: "Regions Covered" },
            { value: "100%", label: "Verified Agents" },
          ].map((stat) => (
            <div key={stat.label} className="px-4 text-center">
              <p className="text-2xl font-bold text-white sm:text-3xl">{stat.value}</p>
              <p className="mt-1 text-xs text-slate-500 sm:text-sm">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
