import { notFound } from "next/navigation"
import type { Metadata } from "next"
import Link from "next/link"
import CarGallery from "@/components/cars/car-gallery"
import LeadFormWrapper from "@/components/leads/lead-form-wrapper"
import LoadFailed from "@/components/load-failed"
import { Button } from "@/components/ui/button"
import { ChevronLeft, MessageCircle } from "lucide-react"
import { formatPrice } from "@/lib/currency"
import { getCompany, getProduct, leadsEndpoint } from "@/api"

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const [product, company] = await Promise.all([getProduct(slug).catch(() => null), getCompany()])
  if (!product) return {}
  return {
    title: `${product.name} — ${company.name}`,
    description: product.description ?? undefined,
  }
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params
  const company = await getCompany()

  // "doesn't exist" → 404 page; "couldn't load" → a retry message, not a crash
  let product: Awaited<ReturnType<typeof getProduct>>
  try {
    product = await getProduct(slug)
  } catch (error) {
    console.error(`[website] Couldn't load product "${slug}":`, error instanceof Error ? error.message : error)
    return (
      <div className="bg-white py-10 sm:py-14">
        <div className="mx-auto max-w-3xl space-y-6 px-4 sm:px-6 lg:px-8">
          <Link href="/products" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-4 w-4" />
            Back to Products
          </Link>
          <LoadFailed title="We couldn't load this product right now" />
        </div>
      </div>
    )
  }
  if (!product) notFound()

  const price = product.price !== null ? formatPrice(product.price, product.currency) : null
  const specs = product.specs.filter((s) => s.value.trim())
  const sold = product.availability === "SOLD"

  const whatsappMessage = encodeURIComponent(
    `Hi ${company.name}! I'm interested in the ${product.name}${price ? ` (${price.main})` : ""}. Can you tell me more?`
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
          {/* Left — images + specs */}
          <div className="space-y-8">
            <CarGallery images={product.images} alt={product.name} />

            {specs.length > 0 && (
              <div>
                <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  <span className="h-3.5 w-1 rounded-full bg-primary" />
                  Specifications
                </h2>
                <dl className="mt-3 overflow-hidden rounded-xl border border-border divide-y divide-border">
                  {specs.map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between gap-4 px-4 py-3">
                      <dt className="text-sm text-muted-foreground">{label}</dt>
                      <dd className="text-right text-sm font-medium text-foreground">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>

          {/* Right — info + form */}
          <div className="space-y-8">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                {product.category && (
                  <Link
                    href={`/products?category=${product.category.slug}`}
                    className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
                  >
                    {product.category.name}
                  </Link>
                )}
                {product.availability === "ON_REQUEST" && (
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-foreground">
                    On request{product.leadTime ? ` · ships in ${product.leadTime}` : ""}
                  </span>
                )}
                {sold && (
                  <span className="inline-flex items-center rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                    Sold
                  </span>
                )}
              </div>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                {product.name}
              </h1>
              <div className="mt-4">
                {price ? (
                  <>
                    <p className="text-4xl font-bold text-primary">{price.main}</p>
                    {price.secondary && <p className="mt-1 text-sm text-muted-foreground">{price.secondary}</p>}
                  </>
                ) : (
                  <p className="text-lg font-semibold text-muted-foreground">Price on request</p>
                )}
              </div>
            </div>

            {product.description && (
              <p className="whitespace-pre-line text-sm leading-7 text-muted-foreground">{product.description}</p>
            )}

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

            {sold ? (
              <div className="rounded-2xl border border-border bg-slate-50 p-6">
                <p className="text-base font-semibold text-foreground">This item has been sold.</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Looking for something similar?{" "}
                  <Link href="/products" className="font-medium text-primary underline-offset-4 hover:underline">
                    Browse what&apos;s available
                  </Link>{" "}
                  or ask us on WhatsApp.
                </p>
              </div>
            ) : (
              <>
                {company.whatsapp && (
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
                )}

                <div className="overflow-hidden rounded-2xl border border-border">
                  <div className="bg-primary px-6 py-4">
                    <h2 className="text-base font-semibold text-primary-foreground">I&apos;m Interested</h2>
                    <p className="mt-0.5 text-sm text-primary-foreground/70">
                      Leave your details and we&apos;ll get back to you.
                    </p>
                  </div>
                  <div className="p-6">
                    <LeadFormWrapper endpoint={leadsEndpoint} productId={product.id} productName={product.name} />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
