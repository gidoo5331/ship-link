import { ShieldCheck, FileText, MapPin } from "lucide-react"

const trustSignals = [
  {
    icon: ShieldCheck,
    title: "Verified Agent Network",
    description:
      "Every agent in our network has been personally vetted. They carry ID, represent our brand, and are accountable to us. No imposters, no surprises.",
  },
  {
    icon: FileText,
    title: "Physical Contracts",
    description:
      "Every sale is backed by a signed purchase agreement between you, your agent, and AutoLink. You always know exactly what you're paying for.",
  },
  {
    icon: MapPin,
    title: "Nationwide Coverage",
    description:
      "We have agents in Accra, Kumasi, Tamale, Takoradi, and more. Wherever you are in Ghana, a local agent is there to assist you in person.",
  },
]

export default function TrustSection() {
  return (
    <section className="bg-slate-50 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Buy With Confidence
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            We built our business on trust. Here&apos;s what makes buying through AutoLink different.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-3">
          {trustSignals.map((signal) => (
            <div
              key={signal.title}
              className="rounded-2xl border border-border bg-white p-8 shadow-sm"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <signal.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mt-5 text-base font-semibold text-foreground">{signal.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{signal.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
