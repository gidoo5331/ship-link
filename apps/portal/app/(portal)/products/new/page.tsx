import { Suspense } from "react"
import { ProductWizard } from "@/components/products/product-wizard"

// useSearchParams (draft id + step) needs a Suspense boundary
export default function NewProductPage() {
  return (
    <Suspense
      fallback={
        <p className="p-8 text-sm text-muted-foreground" role="status">
          Loading…
        </p>
      }
    >
      <ProductWizard />
    </Suspense>
  )
}
