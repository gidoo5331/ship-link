import { notFound } from "next/navigation"
import type { Metadata } from "next"
import Link from "next/link"
import { products } from "@/data/products"
import { company } from "@/data/company"
import InterestFormWrapper from "@/components/cars/interest-form-wrapper"
import { Button } from "@/components/ui/button"
import { ChevronLeft, MessageCircle } from "lucide-react"
import { formatGHS, formatUSD } from "@/lib/currency"

type Props = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const product = products.find((p) => p.slug === slug)
  if (!product) return {}
  return {
    title: `${product.name} — ${company.name}`,
    description: product.description,
  }
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params
  const product = products.find((p) => p.slug === slug)
  if (!product) notFound()

  const whatsappMessage = encodeURIComponent(
    `Hi ${company.name}! I'm interested in the ${product.name} (${formatGHS(product.price)}). Can you tell me more?`
  )

  return (
    <div className="bg-white py-10 sm:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Link
          href="/products"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Products
        </Link>

        <div className="mt-6 grid grid-cols-1 gap-12 lg:grid-cols-2">
          {/* Left — image + specs */}
          <div className="space-y-8">
            {/* Image gallery (simple, no carousel needed for products) */}
            <div className="space-y-3">
              <div className="overflow-hidden rounded-2xl bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="h-80 w-full object-cover lg:h-[380px]"
                />
              </div>
              {product.images.length > 1 && (
                <div className="flex gap-2">
                  {product.images.slice(1).map((src, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={i}
                      src={src}
                      alt={`${product.name} view ${i + 2}`}
                      className="h-20 w-28 rounded-lg object-cover opacity-80 hover:opacity-100"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Specs table */}
            {product.specs.length > 0 && (
              <div>
                <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  <span className="h-3.5 w-1 rounded-full bg-primary" />
                  Specifications
                </h2>
                <dl className="mt-3 overflow-hidden rounded-xl border border-border divide-y divide-border">
                  {product.specs.map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between px-4 py-3">
                      <dt className="text-sm text-muted-foreground">{label}</dt>
                      <dd className="text-sm font-medium text-foreground">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>

          {/* Right — info + form */}
          <div className="space-y-8">
            <div>
              <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                {product.category}
              </span>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                {product.name}
              </h1>
              <div className="mt-4">
                <p className="text-4xl font-bold text-primary">{formatGHS(product.price)}</p>
                <p className="mt-1 text-sm text-muted-foreground">{formatUSD(product.price)}</p>
              </div>
            </div>

            <p className="text-sm leading-7 text-muted-foreground">{product.description}</p>

            {product.features.length > 0 && (
              <div>
                <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  <span className="h-3.5 w-1 rounded-full bg-primary" />
                  Features
                </h2>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {product.features.map((f) => (
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

            <div className="overflow-hidden rounded-2xl border border-border">
              <div className="bg-primary px-6 py-4">
                <h2 className="text-base font-semibold text-primary-foreground">I&apos;m Interested</h2>
                <p className="mt-0.5 text-sm text-primary-foreground/70">
                  Leave your details and we&apos;ll get back to you.
                </p>
              </div>
              <div className="p-6">
                <InterestFormWrapper carId={product.id} carName={product.name} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
