"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

// Shown in place of a section whose data couldn't be loaded.
// "Try again" re-renders the page on the server without a full reload.
export default function LoadFailed({
  title = "We couldn't load this right now",
  message = "Please try again in a moment.",
}: {
  title?: string
  message?: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-white px-6 py-14 text-center">
      <AlertCircle className="h-8 w-8 text-muted-foreground" aria-hidden />
      <div>
        <p className="text-base font-semibold text-foreground">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{message}</p>
      </div>
      <Button variant="outline" disabled={pending} onClick={() => startTransition(() => router.refresh())}>
        {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : <RefreshCw className="mr-2 h-4 w-4" aria-hidden />}
        {pending ? "Trying again…" : "Try again"}
      </Button>
    </div>
  )
}
