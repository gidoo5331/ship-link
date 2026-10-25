import Link from "next/link"
import type { SiteCompany } from "@/types"
import { Phone, Mail, MapPin, MessageCircle } from "lucide-react"
import CompanyMark from "./company-mark"

export default function Footer({ company }: { company: SiteCompany }) {
  return (
    <footer className="border-t border-border bg-slate-950 text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2">
              <CompanyMark company={company} />
              <span className="text-lg font-semibold text-white">{company.name}</span>
            </div>
            {company.tagline && <p className="mt-4 text-sm leading-6 text-slate-400">{company.tagline}</p>}
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
              Quick Links
            </h3>
            <ul className="mt-4 space-y-2">
              {[
                { label: "Browse Products", href: "/products" },
                { label: "About Us", href: "/about" },
                { label: "Contact", href: "/contact" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
              Contact
            </h3>
            {!company.phone && !company.email && !company.address && !company.whatsapp && (
              <p className="mt-4 text-sm text-slate-400">
                <Link href="/contact" className="underline underline-offset-4 hover:text-white">
                  Send us a message
                </Link>
              </p>
            )}
            <ul className="mt-4 space-y-3">
              {company.phone && (
                <li className="flex items-start gap-2">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                  <a href={`tel:${company.phone}`} className="text-sm text-slate-400 hover:text-white">
                    {company.phone}
                  </a>
                </li>
              )}
              {company.email && (
                <li className="flex items-start gap-2">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                  <a href={`mailto:${company.email}`} className="text-sm text-slate-400 hover:text-white">
                    {company.email}
                  </a>
                </li>
              )}
              {company.address && (
                <li className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                  <span className="text-sm text-slate-400">{company.address}</span>
                </li>
              )}
              {company.whatsapp && (
                <li className="flex items-start gap-2">
                  <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                  <a
                    href={`https://wa.me/${company.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-slate-400 hover:text-white"
                  >
                    WhatsApp Us
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-800 pt-6 text-center text-xs text-slate-500">
          &copy; {new Date().getFullYear()} {company.name}. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
