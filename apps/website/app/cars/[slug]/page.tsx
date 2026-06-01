import { notFound } from "next/navigation"
import type { Metadata } from "next"
import Link from "next/link"
import { cars } from "@/data/cars"
import { company } from "@/data/company"
import CarGallery from "@/components/cars/car-gallery"
import InterestForm from "@/components/cars/interest-form"
import { Button } from "@/components/ui/button"
import { ChevronLeft, MessageCircle } from "lucide-react"
import { formatGHS, formatUSD } from "@/lib/currency"

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return cars.map((car) => ({ slug: car.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const car = cars.find((c) => c.slug === slug)
  if (!car) return {}
  return {
    title: `${car.year} ${car.make} ${car.model} — ${company.name}`,
    description: car.description,
  }
}

const specRows = (car: (typeof cars)[0]) => [
  { label: "Year", value: car.year },
  { label: "Condition", value: car.condition },
  { label: "Colour", value: car.color },
  { label: "Mileage", value: `${car.mileage.toLocaleString("en-US")} km` },
  { label: "Engine", value: car.engineSize },
  { label: "Transmission", value: car.transmission },
]

export default async function CarDetailPage({ params }: Props) {
  const { slug } = await params
  const car = cars.find((c) => c.slug === slug)

  if (!car) notFound()

  const carName = `${car.year} ${car.make} ${car.model}`

  const whatsappMessage = encodeURIComponent(
    `Hi Frank Ventures! I'm interested in the ${carName} (${formatGHS(car.price)}). Can you tell me more?`
  )

  return (
    <div className="bg-white py-10 sm:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Link
          href="/cars"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Cars
        </Link>

        <div className="mt-6 grid grid-cols-1 gap-12 lg:grid-cols-2">
          {/* Left — gallery + specs */}
          <div className="space-y-8">
            <CarGallery images={car.images} alt={carName} />

            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Specifications
              </h2>
              <dl className="mt-3 divide-y divide-border rounded-xl border border-border overflow-hidden">
                {specRows(car).map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between px-4 py-3">
                    <dt className="text-sm text-muted-foreground">{label}</dt>
                    <dd className="text-sm font-medium text-foreground">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {car.features.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Features
                </h2>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {car.features.map((f) => (
                    <li
                      key={f}
                      className="rounded-full border border-border bg-slate-50 px-3 py-1 text-xs font-medium text-foreground"
                    >
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Right — price, description, form */}
          <div className="space-y-8">
            <div>
              <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                {car.condition}
              </span>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                {carName}
              </h1>
              <div className="mt-4">
                <p className="text-4xl font-bold text-primary">{formatGHS(car.price)}</p>
                <p className="mt-1 text-sm text-muted-foreground">{formatUSD(car.price)}</p>
              </div>
            </div>

            <p className="text-sm leading-7 text-muted-foreground">{car.description}</p>

            <Button
              asChild
              size="lg"
              variant="outline"
              className="w-full border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700"
            >
              <a
                href={`https://wa.me/${company.whatsapp}?text=${whatsappMessage}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Ask on WhatsApp
              </a>
            </Button>

            <div className="rounded-2xl border border-border p-6">
              <h2 className="text-base font-semibold text-foreground">I&apos;m Interested</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Fill in your details and we&apos;ll connect you with a local agent.
              </p>
              <div className="mt-5">
                <InterestForm carId={car.id} carName={carName} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
