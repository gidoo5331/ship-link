"use client"

import dynamic from "next/dynamic"

const ContactForm = dynamic(() => import("./contact-form"), { ssr: false })

export default function ContactFormWrapper() {
  return <ContactForm />
}
