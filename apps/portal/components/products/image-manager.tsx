"use client"

import { useRef, useState } from "react"
import { ArrowLeft, ArrowRight, Upload, X } from "lucide-react"
import { api, ApiError, uploadToPresignedUrl } from "@/lib/api"
import type { Product } from "@/lib/types"
import { cn } from "@/lib/utils"

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"]
const MAX_BYTES = 5 * 1024 * 1024
const MAX_IMAGES = 10

// Photos upload straight to storage, then the product's ordered key list is saved.
export function ImageManager({
  productPath,
  product,
  onChange,
}: {
  productPath: string // /companies/:id/products/:productId
  product: Product
  onChange: (product: Product) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const keys = product.images.map((i) => i.key)

  async function saveOrder(next: string[]) {
    setError(null)
    try {
      onChange(await api<Product>("PATCH", productPath, { images: next }))
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not update photos")
    }
  }

  async function upload(files: FileList | null) {
    if (!files?.length) return
    setError(null)
    const list = Array.from(files).slice(0, MAX_IMAGES - keys.length)
    const rejected = list.filter((f) => !ACCEPTED.includes(f.type) || f.size > MAX_BYTES)
    if (rejected.length) {
      setError(`${rejected.map((f) => f.name).join(", ")}: use JPG, PNG or WebP under 5 MB.`)
    }
    const valid = list.filter((f) => !rejected.includes(f))
    if (!valid.length) return

    setUploading(valid.length)
    const added: string[] = []
    try {
      for (const file of valid) {
        const { uploadUrl, key } = await api<{ uploadUrl: string; key: string }>("POST", `${productPath}/images/upload-url`, {
          contentType: file.type,
          size: file.size,
        })
        await uploadToPresignedUrl(uploadUrl, file)
        added.push(key)
        setUploading((n) => n - 1)
      }
    } catch (e) {
      setError(e instanceof ApiError && e.status !== 0 ? e.message : "Upload failed. Check your connection and try again.")
    } finally {
      setUploading(0)
      if (inputRef.current) inputRef.current.value = ""
    }
    if (added.length) await saveOrder([...keys, ...added])
  }

  function move(index: number, by: number) {
    const next = [...keys]
    const [item] = next.splice(index, 1)
    next.splice(index + by, 0, item)
    saveOrder(next)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
        {product.images.map((img, i) => (
          <figure key={img.key} className="relative m-0 h-32 overflow-hidden rounded-lg border bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element -- storage URLs, no optimizer in the portal */}
            <img src={img.url} alt={`Photo ${i + 1}`} className="size-full object-cover" />
            {i === 0 && (
              <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[11px] font-medium text-primary-foreground">
                Cover
              </span>
            )}
            <button
              type="button"
              onClick={() => saveOrder(keys.filter((k) => k !== img.key))}
              aria-label={`Remove photo ${i + 1}`}
              className="absolute right-1.5 top-1.5 flex size-7 items-center justify-center rounded-full border bg-background text-neutral-700"
            >
              <X className="size-3.5" aria-hidden />
            </button>
            <div className="absolute bottom-1.5 right-1.5 flex gap-1">
              <button
                type="button"
                disabled={i === 0}
                onClick={() => move(i, -1)}
                aria-label={`Move photo ${i + 1} earlier`}
                className="flex size-7 items-center justify-center rounded-full border bg-background text-neutral-700 disabled:opacity-40"
              >
                <ArrowLeft className="size-3.5" aria-hidden />
              </button>
              <button
                type="button"
                disabled={i === product.images.length - 1}
                onClick={() => move(i, 1)}
                aria-label={`Move photo ${i + 1} later`}
                className="flex size-7 items-center justify-center rounded-full border bg-background text-neutral-700 disabled:opacity-40"
              >
                <ArrowRight className="size-3.5" aria-hidden />
              </button>
            </div>
          </figure>
        ))}

        {keys.length < MAX_IMAGES && (
          <label
            className={cn(
              "flex h-32 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-[1.5px] border-dashed text-sm font-medium text-neutral-700 focus-within:ring-3 focus-within:ring-ring/40",
              uploading > 0 && "pointer-events-none opacity-60",
            )}
          >
            <Upload className="size-5" aria-hidden />
            {uploading > 0 ? `Uploading ${uploading}…` : "Upload photos"}
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED.join(",")}
              multiple
              className="sr-only"
              onChange={(e) => upload(e.target.files)}
            />
          </label>
        )}
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  )
}
