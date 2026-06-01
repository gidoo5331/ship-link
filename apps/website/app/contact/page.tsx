import type { Metadata } from "next"
import { company } from "@/data/company"
import { Phone, Mail, MapPin, MessageCircle, Clock } from "lucide-react"
import ContactFormWrapper from "@/components/contact/contact-form-wrapper"

export const metadata: Metadata = {
  title: `Contact Us — ${company.name}`,
  description: `Get in touch with ${company.name}. Call, WhatsApp, or send us a message and we'll connect you with a local agent.`,
}

const contactDetails = [
  {
    icon: Phone,
    label: "Phone",
    value: company.phone,
    href: `tel:${company.phone}`,
  },
  {
    icon: Mail,
    label: "Email",
    value: company.email,
    href: `mailto:${company.email}`,
  },
  {
    icon: MessageCircle,
    label: "WhatsApp",
    value: "Chat with us directly",
    href: `https://wa.me/${company.whatsapp}`,
    external: true,
    highlight: true,
  },
  {
    icon: MapPin,
    label: "Address",
    value: company.address,
    href: undefined,
  },
  {
    icon: Clock,
    label: "Hours",
    value: "Mon – Sat, 8am – 6pm",
    href: undefined,
  },
]

export default function ContactPage() {
  return (
    <div className="bg-white">
      {/* Header */}
      <div className="bg-slate-950 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Get In Touch
            </h1>
            <p className="mt-4 text-base leading-7 text-slate-400">
              Have a question about a car, need help finding an agent in your area, or just want to chat? We&apos;re here.
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">

          {/* Left — contact info */}
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Contact Details</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Reach us directly or send a message and we&apos;ll respond within 24 hours.
              </p>
            </div>

            <ul className="space-y-5">
              {contactDetails.map(({ icon: Icon, label, value, href, external, highlight }) => (
                <li key={label} className="flex items-start gap-4">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${highlight ? "bg-green-50" : "bg-primary/10"}`}>
                    <Icon className={`h-5 w-5 ${highlight ? "text-green-600" : "text-primary"}`} />
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
                    {href ? (
                      <a
                        href={href}
                        target={external ? "_blank" : undefined}
                        rel={external ? "noopener noreferrer" : undefined}
                        className={`mt-0.5 text-sm font-medium ${highlight ? "text-green-600 hover:text-green-700" : "text-foreground hover:text-primary"} transition-colors`}
                      >
                        {value}
                      </a>
                    ) : (
                      <p className="mt-0.5 text-sm text-foreground">{value}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            {/* WhatsApp CTA card */}
            <div className="rounded-2xl border border-green-200 bg-green-50 p-6">
              <div className="flex items-center gap-3">
                <MessageCircle className="h-6 w-6 text-green-600" />
                <h3 className="text-base font-semibold text-green-800">Fastest Response: WhatsApp</h3>
              </div>
              <p className="mt-2 text-sm text-green-700">
                Send us a WhatsApp message and we typically respond within minutes during business hours.
              </p>
              <a
                href={`https://wa.me/${company.whatsapp}?text=Hi%20Frank%20Ventures%2C%20I%20have%20a%20question.`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
              >
                <MessageCircle className="h-4 w-4" />
                Open WhatsApp
              </a>
            </div>
          </div>

          {/* Right — form */}
          <div className="rounded-2xl border border-border p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-foreground">Send a Message</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Fill in the form and we&apos;ll get back to you within 24 hours.
            </p>
            <div className="mt-6">
              <ContactFormWrapper />
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
