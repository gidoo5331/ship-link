"use client"

import dynamic from "next/dynamic"

const InterestForm = dynamic(() => import("./interest-form"), { ssr: false })

export default function InterestFormWrapper(props: { carId: string; carName: string }) {
  return <InterestForm {...props} />
}
