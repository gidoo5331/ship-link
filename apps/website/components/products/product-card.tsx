import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { CatalogProduct } from "@/types"
import { ArrowRight, Tag } from "lucide-react"
import { formatPrice } from "@/lib/currency"

type Props = { product: CatalogProduct }

export default function ProductCard({ product }: Props) {
  const price = product.price !== null ? formatPrice(product.price, product.currency) : null
  const specs = product.specs.filter((s) => s.value.trim()).slice(0, 2)

  return (
    <Card className="overflow-hidden py-0 transition-shadow hover:shadow-md">
      <div className="relative h-48 w-full overflow-hidden bg-slate-100">
        {product.images[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.images[0]}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-400">
            <Tag className="h-12 w-12" />
          </div>
        )}
        {product.category && (
          <span className="absolute left-3 top-3 rounded-full bg-primary/90 px-2.5 py-0.5 text-xs font-medium text-primary-foreground shadow-sm">
            {product.category.name}
          </span>
        )}
        {product.availability === "ON_REQUEST" && (
          <span className="absolute right-3 top-3 rounded-full bg-white/95 px-2.5 py-0.5 text-xs font-medium text-foreground shadow-sm">
            On request{product.leadTime ? ` · ${product.leadTime}` : ""}
          </span>
        )}
      </div>

      <CardContent className="p-5">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
          {product.name}
        </h3>

        {price ? (
          <div className="mt-3">
            <p className="text-lg font-bold text-primary">{price.main}</p>
            {price.secondary && <p className="text-xs text-muted-foreground">{price.secondary}</p>}
          </div>
        ) : (
          <p className="mt-3 text-sm font-medium text-muted-foreground">Price on request</p>
        )}

        {specs.length > 0 && (
          <p className="mt-2 text-xs text-muted-foreground">
            {specs.map((s, i) => (
              <span key={s.label}>
                {i > 0 && " · "}
                {s.label}: <span className="font-medium text-foreground">{s.value}</span>
              </span>
            ))}
          </p>
        )}

        <Button asChild variant="outline" size="sm" className="mt-4 w-full">
          <Link href={`/products/${product.slug}`}>
            View Details
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
