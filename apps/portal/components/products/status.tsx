import { Badge } from "@/components/form"
import type { Product } from "@/lib/types"

export const AVAILABILITY_LABELS = {
  AVAILABLE: "Available",
  ON_REQUEST: "On request",
  SOLD: "Sold",
} as const

// Drafts and archived products show their status; published ones show what customers see
export function ProductStatusBadge({ product, className }: { product: Product; className?: string }) {
  if (product.status === "DRAFT") return <Badge className={className} dot>Draft</Badge>
  if (product.status === "ARCHIVED") return <Badge className={className}>Archived</Badge>

  const tone = product.availability === "AVAILABLE" ? "green" : product.availability === "ON_REQUEST" ? "blue" : "neutral"
  return (
    <Badge tone={tone} dot className={className}>
      {AVAILABILITY_LABELS[product.availability]}
    </Badge>
  )
}
