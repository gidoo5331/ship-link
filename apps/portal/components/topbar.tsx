"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ExternalLink, Search } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { inputClass } from "@/components/form"
import { useAuth } from "@/lib/auth"
import { websiteUrl } from "@/lib/format"
import { cn } from "@/lib/utils"

// Shown above every portal page. Search covers products for now; it widens
// to leads, shipments and customers as those are built.
export function Topbar() {
  const { user } = useAuth()
  const router = useRouter()
  const [query, setQuery] = useState("")
  const subdomain = user?.company?.subdomain

  return (
    <header className="flex flex-wrap items-center gap-3 border-b px-6 py-3 md:px-8">
      <form
        role="search"
        className="relative w-full max-w-md flex-1"
        onSubmit={(e) => {
          e.preventDefault()
          const q = query.trim()
          router.push(q ? `/products?search=${encodeURIComponent(q)}` : "/products")
        }}
      >
        <label htmlFor="global-search" className="sr-only">
          Search products
        </label>
        <Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" aria-hidden />
        <input
          id="global-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products…"
          className={cn(inputClass, "pl-9")}
        />
      </form>
      {subdomain && (
        <a
          href={websiteUrl(subdomain)}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonVariants({ variant: "outline", size: "lg" }), "ml-auto h-10 px-4")}
        >
          View website
          <ExternalLink aria-hidden />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      )}
    </header>
  )
}
