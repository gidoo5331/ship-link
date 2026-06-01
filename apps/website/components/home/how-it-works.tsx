import { Search, MessageSquare, HandshakeIcon, Car } from "lucide-react"

const steps = [
  {
    icon: Search,
    title: "Browse Inventory",
    description:
      "Explore our curated selection of foreign-used vehicles. Filter by make, model, budget, and more.",
  },
  {
    icon: MessageSquare,
    title: "Express Interest",
    description:
      "Found a car you like? Submit your interest with your name and location. If an agent referred you, add their code.",
  },
  {
    icon: HandshakeIcon,
    title: "Meet Your Agent",
    description:
      "A verified agent in your area will reach out to walk you through the purchase, paperwork, and payment.",
  },
  {
    icon: Car,
    title: "Receive Your Car",
    description:
      "Once everything is signed and payment is confirmed, your car is delivered or ready for pickup.",
  },
]

export default function HowItWorks() {
  return (
    <section className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            How It Works
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            Buying a foreign-used car in Ghana has never been this straightforward.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <div key={step.title} className="relative flex flex-col items-start">
              {index < steps.length - 1 && (
                <div
                  aria-hidden="true"
                  className="absolute left-[calc(50%+2rem)] top-6 hidden h-px w-full border-t border-dashed border-border lg:block"
                />
              )}

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <step.icon className="h-6 w-6 text-primary" />
              </div>

              <div className="mt-1 flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground">
                  Step {index + 1}
                </span>
              </div>

              <h3 className="mt-2 text-base font-semibold text-foreground">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
