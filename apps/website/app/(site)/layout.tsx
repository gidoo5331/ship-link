import type { Metadata } from "next"
import Navbar from "@/components/layout/navbar"
import Footer from "@/components/layout/footer"
import { getCompany } from "@/lib/content"

export async function generateMetadata(): Promise<Metadata> {
  const company = await getCompany()
  return {
    title: company.name,
    description: company.tagline,
  }
}

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  )
}
