import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { cn } from "@/lib/utils"
import Navbar from "@/components/layout/navbar"
import Footer from "@/components/layout/footer"
import { getCompany } from "@/api"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

export async function generateMetadata(): Promise<Metadata> {
  const company = await getCompany()
  return {
    title: company.name,
    description: company.tagline || company.heroSubheading,
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const company = await getCompany()

  return (
    <html lang="en" className={cn("h-full antialiased", inter.variable)}>
      <body className="flex min-h-full flex-col font-sans">
        <Navbar company={company} />
        <main className="flex-1">{children}</main>
        <Footer company={company} />
      </body>
    </html>
  )
}
