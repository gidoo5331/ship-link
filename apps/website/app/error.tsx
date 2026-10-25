"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

// Last resort for an unexpected error inside a page. The header and footer
// (from the layout) still render around it.
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-24 text-center">
      <AlertCircle className="h-10 w-10 text-muted-foreground" aria-hidden />
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Something went wrong</h1>
      <p className="text-sm leading-6 text-muted-foreground">
        This page didn&apos;t load properly. Please try again — if it keeps happening, our contact details are on the Contact page.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>
          <RefreshCw className="mr-2 h-4 w-4" aria-hidden />
          Try again
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Go to the home page</Link>
        </Button>
      </div>
    </div>
  )
}
