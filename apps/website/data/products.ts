import type { Product } from "@/types"

export const CATEGORIES = ["Generators", "Lighting", "Electronics"] as const
export type Category = (typeof CATEGORIES)[number]

export const products: Product[] = [
  // ── Generators ──────────────────────────────────────────────────────────────
  {
    id: "g1",
    slug: "kipor-kde6700t-5kva-diesel-generator",
    name: "Kipor KDE6700T 5KVA Diesel Generator",
    category: "Generators",
    price: 3200,
    images: [
      "https://placehold.co/800x500/1e293b/ffffff?text=Kipor+5KVA+Diesel+Generator",
      "https://placehold.co/800x500/334155/ffffff?text=Generator+Control+Panel",
      "https://placehold.co/800x500/475569/ffffff?text=Generator+Side+View",
    ],
    specs: [
      { label: "Power Output", value: "5 KVA" },
      { label: "Fuel Type", value: "Diesel" },
      { label: "Runtime (full load)", value: "8 hrs" },
      { label: "Tank Capacity", value: "15 L" },
      { label: "Noise Level", value: "72 dB" },
      { label: "Phase", value: "Single Phase" },
    ],
    features: [
      "Electric Start",
      "Auto Low-Oil Shutdown",
      "Voltmeter & Frequency Meter",
      "12V DC Output",
      "Heavy-Duty Frame",
    ],
    description:
      "A rugged diesel generator built for Ghana's demands. The KDE6700T delivers reliable 5KVA power for homes, small offices, and workshops — with an 8-hour runtime per tank and auto safety shutdowns.",
    available: true,
  },
  {
    id: "g2",
    slug: "sumec-firman-10kva-generator",
    name: "Sumec Firman 10KVA Generator",
    category: "Generators",
    price: 5800,
    images: [
      "https://placehold.co/800x500/1e3a5f/ffffff?text=Firman+10KVA+Generator",
      "https://placehold.co/800x500/1e4976/ffffff?text=Generator+Panel",
      "https://placehold.co/800x500/1a5276/ffffff?text=Firman+Generator+Side",
    ],
    specs: [
      { label: "Power Output", value: "10 KVA" },
      { label: "Fuel Type", value: "Petrol" },
      { label: "Runtime (full load)", value: "10 hrs" },
      { label: "Tank Capacity", value: "25 L" },
      { label: "Noise Level", value: "68 dB" },
      { label: "Phase", value: "Single Phase" },
    ],
    features: [
      "Remote Start",
      "ATS Compatible",
      "AVR for Stable Voltage",
      "4x 13A Outlets",
      "USB Charging Port",
      "Low Noise Muffler",
    ],
    description:
      "The Firman 10KVA is a serious machine for serious power cuts. With ATS compatibility, remote start, and a 25-litre tank, it keeps your home or business running through the longest outages.",
    available: true,
  },
  {
    id: "g3",
    slug: "honda-eu22i-2kva-inverter-generator",
    name: "Honda EU22i 2KVA Inverter Generator",
    category: "Generators",
    price: 2100,
    images: [
      "https://placehold.co/800x500/0f172a/ffffff?text=Honda+EU22i+Inverter",
      "https://placehold.co/800x500/1e293b/ffffff?text=Honda+EU22i+Panel",
      "https://placehold.co/800x500/334155/ffffff?text=Honda+EU22i+Compact",
    ],
    specs: [
      { label: "Power Output", value: "2.2 KVA" },
      { label: "Fuel Type", value: "Petrol" },
      { label: "Runtime (eco mode)", value: "8.1 hrs" },
      { label: "Tank Capacity", value: "3.6 L" },
      { label: "Noise Level", value: "53 dB" },
      { label: "Weight", value: "21 kg" },
    ],
    features: [
      "Pure Sine Wave Inverter",
      "Ultra Quiet (53 dB)",
      "Safe for Laptops & Electronics",
      "Eco-Throttle Mode",
      "Parallel Capability",
      "Lightweight & Portable",
    ],
    description:
      "The quietest generator we stock. The Honda EU22i runs at just 53 dB — barely louder than a conversation — making it perfect for homes, offices, and anywhere noise matters. Safe for all sensitive electronics.",
    available: true,
  },

  // ── Lighting ─────────────────────────────────────────────────────────────────
  {
    id: "l1",
    slug: "philips-100w-led-flood-light",
    name: "Philips 100W LED Flood Light",
    category: "Lighting",
    price: 180,
    images: [
      "https://placehold.co/800x500/0f3460/ffffff?text=Philips+100W+Flood+Light",
      "https://placehold.co/800x500/16213e/ffffff?text=Flood+Light+Installed",
      "https://placehold.co/800x500/1a1a2e/ffffff?text=Flood+Light+Close-up",
    ],
    specs: [
      { label: "Wattage", value: "100W" },
      { label: "Lumen Output", value: "10,000 lm" },
      { label: "Colour Temperature", value: "6500K (Daylight)" },
      { label: "IP Rating", value: "IP66 Weatherproof" },
      { label: "Lifespan", value: "50,000 hrs" },
      { label: "Beam Angle", value: "120°" },
    ],
    features: [
      "IP66 Weatherproof",
      "Adjustable Mounting Bracket",
      "No Warm-Up Time",
      "Surge Protection",
      "Wide Beam Coverage",
    ],
    description:
      "Bright, efficient, and built to last. The Philips 100W flood light replaces a 500W halogen with 10,000 lumens of crisp daylight output — perfect for compounds, shops, warehouses, and car parks.",
    available: true,
  },
  {
    id: "l2",
    slug: "solar-street-light-60w-all-in-one",
    name: "60W All-in-One Solar Street Light",
    category: "Lighting",
    price: 420,
    images: [
      "https://placehold.co/800x500/374151/ffffff?text=60W+Solar+Street+Light",
      "https://placehold.co/800x500/4b5563/ffffff?text=Solar+Light+Panel",
      "https://placehold.co/800x500/6b7280/ffffff?text=Solar+Light+Installed",
    ],
    specs: [
      { label: "LED Power", value: "60W" },
      { label: "Solar Panel", value: "25W Monocrystalline" },
      { label: "Battery", value: "30Ah Lithium" },
      { label: "Backup Nights", value: "3 nights" },
      { label: "Motion Sensor", value: "Yes (8m range)" },
      { label: "IP Rating", value: "IP65" },
    ],
    features: [
      "No Wiring Required",
      "Motion Sensor (dims to 30% when idle)",
      "3-Night Battery Backup",
      "Dusk-to-Dawn Automation",
      "Remote Control Included",
      "Easy Pole Mounting",
    ],
    description:
      "No electrician, no PHCN connection, no running costs. This all-in-one solar street light installs on any pole in under an hour and runs automatically every night — with smart motion sensing to maximise battery life.",
    available: true,
  },
  {
    id: "l3",
    slug: "led-panel-light-48w-recessed",
    name: "48W LED Recessed Panel Light",
    category: "Lighting",
    price: 95,
    images: [
      "https://placehold.co/800x500/1e293b/e2e8f0?text=48W+LED+Panel+Light",
      "https://placehold.co/800x500/334155/e2e8f0?text=Panel+Light+Installed",
      "https://placehold.co/800x500/475569/e2e8f0?text=Panel+Light+Detail",
    ],
    specs: [
      { label: "Wattage", value: "48W" },
      { label: "Lumen Output", value: "4,320 lm" },
      { label: "Colour Temperature", value: "4000K (Cool White)" },
      { label: "Size", value: "600mm × 600mm" },
      { label: "Lifespan", value: "40,000 hrs" },
      { label: "CRI", value: ">80" },
    ],
    features: [
      "Flicker-Free",
      "Even Light Distribution",
      "Drop Ceiling Compatible",
      "No UV or IR Emissions",
      "Easy Plug-In Installation",
    ],
    description:
      "The go-to panel for offices, clinics, and shops. A single 48W panel lights a full 3×3m room with even, glare-free illumination — replacing four 20W fluorescent tubes at a fraction of the running cost.",
    available: true,
  },
]
