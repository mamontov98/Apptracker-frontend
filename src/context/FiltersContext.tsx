import React, { createContext, useContext, useEffect, useMemo, useState } from "react"

export type RefreshInterval = 30 | 60

export type FiltersState = {
  projectKey: string | null
  from: string
  to: string
  eventName: string
  userId: string
  anonymousId: string
  autoRefreshEnabled: boolean
  autoRefreshInterval: RefreshInterval
  // Changes when user presses refresh or auto-refresh ticks
  refreshToken: number
}

type FiltersContextValue = {
  filters: FiltersState
  setProjectKey: (projectKey: string | null) => void
  setFrom: (value: string) => void
  setTo: (value: string) => void
  setEventName: (value: string) => void
  setUserId: (value: string) => void
  setAnonymousId: (value: string) => void
  setAutoRefreshEnabled: (enabled: boolean) => void
  setAutoRefreshInterval: (interval: RefreshInterval) => void
  triggerRefresh: () => void
  resetFilters: () => void
}

const STORAGE_KEY = "analytics-dashboard.filters.v1"

const FiltersContext = createContext<FiltersContextValue | null>(null)

function safeParseJson<T>(value: string | null): T | null {
  if (!value) return null
  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

const defaultFilters: FiltersState = {
  projectKey: null,
  from: "",
  to: "",
  eventName: "",
  userId: "",
  anonymousId: "",
  autoRefreshEnabled: false,
  autoRefreshInterval: 30,
  refreshToken: 0,
}

export function FiltersProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFilters] = useState<FiltersState>(() => {
    const saved = safeParseJson<Partial<FiltersState>>(localStorage.getItem(STORAGE_KEY))
    if (!saved) return defaultFilters

    return {
      ...defaultFilters,
      ...saved,
      // Always start with a fresh token on boot
      refreshToken: 0,
    }
  })

  // Persist filters (excluding refreshToken)
  useEffect(() => {
    const { refreshToken: _ignore, ...toSave } = filters
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
  }, [filters])

  // Auto refresh: only when enabled + project selected
  useEffect(() => {
    if (!filters.autoRefreshEnabled) return
    if (!filters.projectKey) return

    const ms = filters.autoRefreshInterval * 1000
    const id = window.setInterval(() => {
      setFilters((prev) => ({ ...prev, refreshToken: Date.now() }))
    }, ms)

    return () => window.clearInterval(id)
  }, [filters.autoRefreshEnabled, filters.autoRefreshInterval, filters.projectKey])

  const value: FiltersContextValue = useMemo(
    () => ({
      filters,
      setProjectKey: (projectKey) => setFilters((p) => ({ ...p, projectKey })),
      setFrom: (value) => setFilters((p) => ({ ...p, from: value })),
      setTo: (value) => setFilters((p) => ({ ...p, to: value })),
      setEventName: (value) => setFilters((p) => ({ ...p, eventName: value })),
      setUserId: (value) => setFilters((p) => ({ ...p, userId: value })),
      setAnonymousId: (value) => setFilters((p) => ({ ...p, anonymousId: value })),
      setAutoRefreshEnabled: (enabled) => setFilters((p) => ({ ...p, autoRefreshEnabled: enabled })),
      setAutoRefreshInterval: (interval) => setFilters((p) => ({ ...p, autoRefreshInterval: interval })),
      triggerRefresh: () => setFilters((p) => ({ ...p, refreshToken: Date.now() })),
      resetFilters: () => setFilters({ ...defaultFilters, refreshToken: Date.now() }),
    }),
    [filters]
  )

  return <FiltersContext.Provider value={value}>{children}</FiltersContext.Provider>
}

export function useFilters() {
  const ctx = useContext(FiltersContext)
  if (!ctx) throw new Error("useFilters must be used within FiltersProvider")
  return ctx
}


