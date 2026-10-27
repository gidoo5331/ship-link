"use client"

import { useCallback, useEffect, useState } from "react"
import { LoadError, RefreshButton, RowSkeleton, SkeletonGroup } from "@/components/load-state"
import { CategoriesManager } from "@/components/products/categories-manager"
import { api, ApiError } from "@/lib/api"
import { companyPath, useAuth } from "@/lib/auth"
import type { Category } from "@/lib/types"

export default function CategoriesPage() {
  const { user } = useAuth()
  const basePath = companyPath(user, "/categories")
  const [categories, setCategories] = useState<Category[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // state is only set once the request settles (the first load starts with loading = true)
  const fetchCategories = useCallback(
    () =>
      api<Category[]>("GET", basePath)
        .then((c) => {
          setCategories(c)
          setError(null)
        })
        .catch((e) => setError(e instanceof ApiError ? e.message : "Couldn't load your categories."))
        .finally(() => setLoading(false)),
    [basePath],
  )

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const load = async () => {
    setLoading(true)
    await fetchCategories()
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 p-6 md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Categories</h1>
          <p className="text-sm text-muted-foreground">
            Group your products on the website. A category&apos;s spec fields are filled in for you when you add a product to it.
          </p>
        </div>
        <RefreshButton onClick={load} busy={loading} label="Refresh categories" />
      </div>

      {categories === null ? (
        error ? (
          <LoadError message={error} onRetry={load} retrying={loading} />
        ) : (
          <SkeletonGroup label="Loading categories…" className="divide-y rounded-xl border px-4">
            {Array.from({ length: 4 }, (_, i) => (
              <RowSkeleton key={i} />
            ))}
          </SkeletonGroup>
        )
      ) : (
        <CategoriesManager basePath={basePath} categories={categories} onChanged={load} />
      )}
    </div>
  )
}
