"use client"

import dynamic from "next/dynamic"

const LeadForm = dynamic(() => import("./lead-form"), { ssr: false })

export default function LeadFormWrapper(props: { endpoint: string | null; productId?: string; productName?: string }) {
  return <LeadForm {...props} />
}
