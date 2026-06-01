import Link from "next/link"
import { Button } from "@/components/ui/button"
import Hero from "@/components/home/hero"
import HowItWorks from "@/components/home/how-it-works"
import TrustSection from "@/components/home/trust-section"
import CarCard from "@/components/cars/car-card"
import { cars } from "@/data/cars"
import { ArrowRight } from "lucide-react"

export default function Home() {
  const featured = cars.filter((c) => c.available).slice(0, 3)

  return (
    <>
      <Hero />
      <HowItWorks />
      <TrustSection />

      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Featured Cars
              </h2>
              <p className="mt-3 text-base text-muted-foreground">
                A selection of what&apos;s available right now.
              </p>
            </div>
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link href="/cars">
                View All
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((car) => (
              <CarCard key={car.id} car={car} />
            ))}
          </div>

          <div className="mt-8 flex justify-center sm:hidden">
            <Button asChild variant="outline">
              <Link href="/cars">
                View All Cars
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}
