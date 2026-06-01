import type { Metadata } from "next"
import { cars } from "@/data/cars"
import { company } from "@/data/company"
import CarCard from "@/components/cars/car-card"

export const metadata: Metadata = {
  title: `Browse Cars — ${company.name}`,
  description: "Browse our full inventory of quality foreign-used vehicles available across Ghana.",
}

export default function CarsPage() {
  const available = cars.filter((c) => c.available)

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Available Cars
          </h1>
          <p className="mt-2 text-base text-muted-foreground">
            {available.length} {available.length === 1 ? "vehicle" : "vehicles"} in stock
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {available.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-lg font-medium text-foreground">No cars available right now.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Check back soon or contact us to discuss your requirements.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {available.map((car) => (
              <CarCard key={car.id} car={car} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
