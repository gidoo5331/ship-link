import Link from "next/link"
import { company } from "@/data/company"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
              <span className="text-sm font-bold text-primary-foreground">AL</span>
            </div>
            <span className="text-lg font-semibold tracking-tight text-foreground">
              {company.name}
            </span>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            <Link
              href="/cars"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Cars
            </Link>
            <Link
              href="/about"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              About
            </Link>
            <Link
              href="/contact"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Contact
            </Link>
            <Button asChild size="sm">
              <Link href="/cars">Browse Cars</Link>
            </Button>
          </nav>

          <button className="flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-muted md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Open menu</span>
          </button>
        </div>
      </div>
    </header>
  )
}
