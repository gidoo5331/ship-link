import Link from "next/link"
import { SearchX } from "lucide-react"
import { Button } from "@/components/ui/button"

// Unknown pages and products that don't exist (or were unpublished)
export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-24 text-center">
      <SearchX className="h-10 w-10 text-muted-foreground" aria-hidden />
      <h1 className="text-2xl font-bold tracking-tight text-foreground">We can&apos;t find that page</h1>
      <p className="text-sm leading-6 text-muted-foreground">
        It may have been sold or moved. Have a look at what&apos;s available now, or tell us what you&apos;re looking for.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href="/products">Browse products</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/products#request">Request something</Link>
        </Button>
      </div>
    </div>
  )
}
