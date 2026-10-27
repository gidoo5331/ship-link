import { Suspense } from "react"
import { ProductWizard } from "@/components/products/product-wizard"
import { Loading } from "@/components/load-state"

// useSearchParams (draft id + step) needs a Suspense boundary
export default function NewProductPage() {
  return (
    <Suspense
      fallback={
        <Loading label="Loading…" />
      }
    >
      <ProductWizard />
    </Suspense>
  )
}
