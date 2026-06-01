import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { Car } from "@/types"
import { Fuel, Gauge, ArrowRight } from "lucide-react"
import { formatGHS, formatUSD } from "@/lib/currency"

type Props = {
  car: Car
}

export default function CarCard({ car }: Props) {
  const formattedMileage = car.mileage.toLocaleString("en-US")

  return (
    <Card className="overflow-hidden py-0 transition-shadow hover:shadow-md">
      <div className="relative h-48 w-full overflow-hidden bg-slate-100">
        {car.images[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={car.images[0]}
            alt={`${car.year} ${car.make} ${car.model}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-400">
            <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M8 7h8M5 11h14M5 11l1-4h12l1 4M5 11v5h14v-5M9 16v2m6-2v2"
              />
            </svg>
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-medium text-slate-700 shadow-sm">
          {car.condition}
        </span>
      </div>

      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {car.year}
            </p>
            <h3 className="mt-0.5 text-base font-semibold text-foreground">
              {car.make} {car.model}
            </h3>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-primary">{formatGHS(car.price)}</p>
            <p className="text-xs text-muted-foreground">{formatUSD(car.price)}</p>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Gauge className="h-3.5 w-3.5" />
            {formattedMileage} km
          </span>
          <span className="flex items-center gap-1">
            <Fuel className="h-3.5 w-3.5" />
            {car.engineSize}
          </span>
          <span>{car.transmission}</span>
        </div>

        <Button asChild variant="outline" size="sm" className="mt-4 w-full">
          <Link href={`/cars/${car.slug}`}>
            View Details
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
