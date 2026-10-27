"use client"

import { AlertCircle, Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("size-4 animate-spin", className)} aria-hidden />
}

// Shown in place of content while it loads
export function Loading({ label = "Loading…", className }: { label?: string; className?: string }) {
  return (
    <div role="status" className={cn("flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground", className)}>
      <Spinner />
      {label}
    </div>
  )
}

// Shown in place of content when loading failed
export function LoadError({
  message,
  onRetry,
  retrying,
  className,
}: {
  message: string
  onRetry: () => void
  retrying?: boolean
  className?: string
}) {
  return (
    <div role="alert" className={cn("flex flex-col items-center gap-3 rounded-xl border border-red-200 bg-red-50/60 px-4 py-10 text-center", className)}>
      <AlertCircle className="size-6 text-red-700" aria-hidden />
      <p className="max-w-md text-sm text-red-800">{message}</p>
      <Button variant="outline" size="lg" className="h-10 px-4" onClick={onRetry} disabled={retrying}>
        {retrying ? <Spinner /> : <RefreshCw aria-hidden />}
        {retrying ? "Trying again…" : "Try again"}
      </Button>
    </div>
  )
}

// ── Skeletons: the page's shape while its data loads ─────────────────────────

export function Skeleton({ className }: { className?: string }) {
  return <span aria-hidden className={cn("block animate-pulse rounded-md bg-neutral-200/80", className)} />
}

// Wraps skeletons so screen readers hear "Loading…" once instead of nothing
export function SkeletonGroup({ label = "Loading…", className, children }: { label?: string; className?: string; children: React.ReactNode }) {
  return (
    <div role="status" className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  )
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border">
      <Skeleton className="h-44 rounded-none" />
      <div className="flex flex-col gap-2.5 px-4 pb-4 pt-3.5">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/3" />
        <div className="mt-2 flex items-center justify-between border-t pt-2.5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-14" />
        </div>
      </div>
    </div>
  )
}

// Avatar + two lines, used for list rows (leads, latest leads, recent products)
export function RowSkeleton({ avatar = false }: { avatar?: boolean }) {
  return (
    <div className="flex items-center gap-3 py-3">
      {avatar && <Skeleton className="size-9 shrink-0 rounded-full" />}
      <div className="flex flex-1 flex-col gap-1.5">
        <Skeleton className="h-3.5 w-2/5" />
        <Skeleton className="h-3 w-3/5" />
      </div>
      <Skeleton className="h-5 w-16 rounded-full" />
    </div>
  )
}

// Rows for a <tbody>; first cell gets an avatar + two lines
export function TableRowsSkeleton({ cols, rows = 5 }: { cols: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }, (_, r) => (
        <tr key={r} className="border-b last:border-0" aria-hidden>
          {Array.from({ length: cols }, (_, c) => (
            <td key={c} className="px-4 py-3">
              {c === 0 ? (
                <span className="flex items-center gap-2.5">
                  <Skeleton className="size-8 shrink-0 rounded-full" />
                  <span className="flex flex-1 flex-col gap-1.5">
                    <Skeleton className="h-3.5 w-28" />
                    <Skeleton className="h-3 w-36" />
                  </span>
                </span>
              ) : (
                <Skeleton className="h-3.5 w-20" />
              )}
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

// Icon button that reloads the current view; spins while busy
export function RefreshButton({ onClick, busy, label = "Refresh" }: { onClick: () => void; busy?: boolean; label?: string }) {
  return (
    <Button variant="outline" size="icon-lg" className="size-10 shrink-0" onClick={onClick} disabled={busy} aria-label={busy ? "Refreshing" : label} title={label}>
      <RefreshCw className={cn(busy && "animate-spin")} aria-hidden />
    </Button>
  )
}
