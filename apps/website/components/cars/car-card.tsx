import Link from "next/link"
import { Card } from "@/components/ui/card"
import type { Car } from "@/types"
import { ArrowRight, Camera, Cog, Fuel, Gauge } from "lucide-react"
import { formatGHS, formatUSD } from "@/lib/currency"

type Props = {
  car: Car
}

export default function CarCard({ car }: Props) {
  const name = `${car.year} ${car.make} ${car.model}`
  const specs = [
    { icon: Gauge, label: `${car.mileage.toLocaleString("en-US")} km`, title: "Mileage" },
    { icon: Fuel, label: car.engineSize, title: "Engine" },
    { icon: Cog, label: car.transmission, title: "Transmission" },
  ].filter((s) => s.label)

  return (
    // The title link is stretched over the whole card, so the card is one tap target
    <Card className="group relative gap-0 py-0 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-within:ring-2 focus-within:ring-primary motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {car.images[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={car.images[0]}
            alt={name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <Camera className="h-10 w-10" aria-hidden />
          </div>
        )}

        <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          <span className="whitespace-nowrap rounded-full bg-white/95 px-2.5 py-1 text-xs font-medium text-slate-800 shadow-sm">
            {car.condition}
          </span>
          {car.images.length > 1 && (
            <span className="flex items-center gap-1 whitespace-nowrap rounded-full bg-black/60 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
              <Camera className="h-3.5 w-3.5" aria-hidden />
              {car.images.length}
              <span className="sr-only">photos</span>
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-sm font-medium text-muted-foreground">{car.year}</p>
        <h3 className="mt-0.5 text-lg font-semibold leading-snug text-foreground">
          <Link
            href={`/cars/${car.slug}`}
            className="outline-none after:absolute after:inset-0 after:rounded-xl after:content-['']"
          >
            {car.make} {car.model}
          </Link>
        </h3>

        <ul className="mb-5 mt-3 flex flex-wrap gap-2" aria-label="Key details">
          {specs.map(({ icon: Icon, label, title }) => (
            <li
              key={title}
              title={title}
              className="flex items-center gap-1.5 whitespace-nowrap rounded-md bg-muted px-2 py-1 text-sm text-muted-foreground"
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              <span className="sr-only">{title}: </span>
              {label}
            </li>
          ))}
        </ul>

        <div className="mt-auto flex items-end justify-between gap-3 border-t pt-4">
          <div>
            <p className="text-xl font-bold tracking-tight text-primary">{formatGHS(car.price)}</p>
            <p className="text-sm text-muted-foreground">{formatUSD(car.price)}</p>
          </div>
          <span
            className="flex items-center gap-1 whitespace-nowrap text-sm font-medium text-primary"
            aria-hidden
          >
            View details
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none" />
          </span>
        </div>
      </div>
    </Card>
  )
}
