import { Inter } from "next/font/google"
import "./globals.css"
import { cn } from "@/lib/utils"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

// Shared by the public site (app/(site)) and the content editor (app/keystatic).
// The site's header and footer live in app/(site)/layout.tsx.
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={cn("h-full antialiased", inter.variable)}>
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  )
}
