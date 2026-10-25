import Link from "next/link"
import { Button } from "@/components/ui/button"
import Hero from "@/components/home/hero"
import HowItWorks from "@/components/home/how-it-works"
import TrustSection from "@/components/home/trust-section"
import ProductCard from "@/components/products/product-card"
import LoadFailed from "@/components/load-failed"
import { getCompany, getProducts } from "@/api"
import { ArrowRight } from "lucide-react"

export default async function Home() {
  // newest cars first; fall back to any product if there are no cars yet
  const company = await getCompany()
  let featured: Awaited<ReturnType<typeof getProducts>> | null = null
  let showingCars = false
  try {
    const cars = await getProducts("cars")
    showingCars = cars.length > 0
    featured = (showingCars ? cars : await getProducts()).slice(0, 3)
  } catch (error) {
    // the rest of the home page still renders
    console.error("[website] Couldn't load featured products:", error instanceof Error ? error.message : error)
  }

  return (
    <>
      <Hero company={company} />
      <HowItWorks />
      <TrustSection />

      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                {showingCars ? "Featured Cars" : "Featured Products"}
              </h2>
              <p className="mt-3 text-base text-muted-foreground">
                A selection of what&apos;s available right now.
              </p>
            </div>
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link href={showingCars ? "/products?category=cars" : "/products"}>
                View All
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {featured ? (
            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="mt-10">
              <LoadFailed title="We couldn't load our products right now" />
            </div>
          )}

          <div className="mt-8 flex justify-center sm:hidden">
            <Button asChild variant="outline">
              <Link href={showingCars ? "/products?category=cars" : "/products"}>
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
