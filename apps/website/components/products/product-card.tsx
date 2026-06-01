import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { Product } from "@/types"
import { ArrowRight, Tag } from "lucide-react"
import { formatGHS, formatUSD } from "@/lib/currency"

type Props = { product: Product }

export default function ProductCard({ product }: Props) {
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
        <span className="absolute left-3 top-3 rounded-full bg-primary/90 px-2.5 py-0.5 text-xs font-medium text-primary-foreground shadow-sm">
          {product.category}
        </span>
      </div>

      <CardContent className="p-5">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
          {product.name}
        </h3>

        <div className="mt-3">
          <p className="text-lg font-bold text-primary">{formatGHS(product.price)}</p>
          <p className="text-xs text-muted-foreground">{formatUSD(product.price)}</p>
        </div>

        {product.specs.length > 0 && (
          <p className="mt-2 text-xs text-muted-foreground">
            {product.specs[0].label}: <span className="font-medium text-foreground">{product.specs[0].value}</span>
            {product.specs[1] && (
              <> · {product.specs[1].label}: <span className="font-medium text-foreground">{product.specs[1].value}</span></>
            )}
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
