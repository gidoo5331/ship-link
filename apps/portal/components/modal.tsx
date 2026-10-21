"use client"

import { useEffect, useRef } from "react"
import { X } from "lucide-react"

// Native <dialog>: focus trapping, Esc to close and the backdrop come from the browser.
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: React.ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="modal-title"
      aria-describedby={description ? "modal-description" : undefined}
      className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl bg-background p-0 text-foreground shadow-2xl backdrop:bg-black/45"
    >
      {open && (
        <div className="flex flex-col gap-5 p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <h2 id="modal-title" className="text-lg font-semibold">
                {title}
              </h2>
              {description && (
                <p id="modal-description" className="text-sm text-muted-foreground">
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex size-9 shrink-0 items-center justify-center rounded-lg text-neutral-700 hover:bg-muted"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  )
}
