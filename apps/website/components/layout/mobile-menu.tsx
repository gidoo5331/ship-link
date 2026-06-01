"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"

const links = [
  { label: "Cars", href: "/cars" },
  { label: "Products", href: "/products" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
]

export default function MobileMenu() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // close on route change
  useEffect(() => { setOpen(false) }, [pathname])

  // prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [open])

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-muted"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open && (
        <div className="absolute inset-x-0 top-16 z-40 border-b border-border bg-white shadow-lg">
          <nav className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
            <ul className="flex flex-col gap-1">
              {links.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="flex w-full rounded-lg px-3 py-3 text-base font-medium text-foreground hover:bg-muted"
                    onClick={() => setOpen(false)}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-4 border-t border-border pt-4">
              <Button asChild className="w-full" onClick={() => setOpen(false)}>
                <Link href="/cars">Browse Cars</Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </div>
  )
}
