"use client"

import { createContext, useCallback, useContext, useEffect, useState } from "react"
import { api, getToken, setToken } from "@/lib/api"
import type { User } from "@/lib/types"

type AuthState = {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // restore the session from a stored token
  useEffect(() => {
    const restore = getToken()
      ? api<User>("GET", "/auth/me").then(setUser).catch(() => setToken(null))
      : Promise.resolve()
    restore.finally(() => setLoading(false))
  }, [])

  // any 401 from the API ends the session
  useEffect(() => {
    const onUnauthorized = () => setUser(null)
    window.addEventListener("shiplink:unauthorized", onUnauthorized)
    return () => window.removeEventListener("shiplink:unauthorized", onUnauthorized)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const res = await api<{ accessToken: string; user: User }>("POST", "/auth/login", { email, password })
    setToken(res.accessToken)
    setUser(res.user)
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
  }, [])

  // re-read the user (and company) after it changes, e.g. a renamed company
  const refreshUser = useCallback(async () => {
    setUser(await api<User>("GET", "/auth/me"))
  }, [])

  return <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>")
  return ctx
}

// Company-scoped API paths, e.g. companyPath(user, "/products")
export function companyPath(user: User | null, path: string) {
  if (!user?.companyId) throw new Error("This account is not linked to a company")
  return `/companies/${user.companyId}${path}`
}
