import type { Metadata } from "next"
import KeystaticApp from "./keystatic"

export const metadata: Metadata = {
  title: "Edit website content",
  robots: { index: false, follow: false },
}

// The content editor takes over the whole page (no site header/footer)
export default function KeystaticLayout() {
  return <KeystaticApp />
}
