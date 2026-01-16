import { useEffect, useMemo, useState } from "react"
import { RefreshCw } from "lucide-react"

import { fetchProjects, type Project } from "@/api/apiClient"
import { ErrorBanner } from "@/components/common/ErrorBanner"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { useFilters } from "@/context/FiltersContext"

export function Topbar() {
  const {
    filters,
    setProjectKey,
    setFrom,
    setTo,
    setEventName,
    setUserId,
    setAnonymousId,
    setAutoRefreshEnabled,
    setAutoRefreshInterval,
    triggerRefresh,
  } = useFilters()

  const [projects, setProjects] = useState<Project[]>([])
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [projectsError, setProjectsError] = useState<string | null>(null)

  const isProjectSelected = !!filters.projectKey
  const filtersDisabled = !isProjectSelected

  useEffect(() => {
    let isMounted = true
    setLoadingProjects(true)
    setProjectsError(null)

    fetchProjects()
      .then((items) => {
        if (!isMounted) return
        setProjects(items)
        // Clear error on success
        setProjectsError(null)
      })
      .catch((err) => {
        if (!isMounted) return
        
        // Handle different error types
        if (err?.code === "ERR_NETWORK" || err?.message?.includes("Network Error")) {
          setProjectsError("Network error: Could not connect to the backend. Is the server running?")
        } else if (err?.response?.status === 500) {
          setProjectsError("Server error: The backend encountered an issue. Please try again later.")
        } else {
          setProjectsError(err?.response?.data?.error || err?.message || "Failed to load projects. Please try again.")
        }
      })
      .finally(() => {
        if (!isMounted) return
        setLoadingProjects(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  const selectedProject = useMemo(
    () => projects.find((p) => p.projectKey === filters.projectKey) || null,
    [projects, filters.projectKey]
  )

  return (
    <div className="px-4 py-3 md:px-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-lg font-semibold tracking-tight">Dashboard</div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="border-border/70 bg-card/40 hover:bg-card/70"
            onClick={triggerRefresh}
            disabled={!isProjectSelected}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <Separator className="my-3 opacity-60" />

      {projectsError ? (
        <div className="mb-3">
          <ErrorBanner title="Projects API error" message={projectsError} />
        </div>
      ) : null}

      <Card className="border-border/60 bg-card/40 p-3 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
          {/* Project selector */}
          <div className="md:col-span-3">
            <div className="mb-1 text-xs font-medium text-muted-foreground">Project</div>
            <Select
              value={filters.projectKey ?? ""}
              onValueChange={(v) => setProjectKey(v || null)}
              disabled={loadingProjects || projects.length === 0}
            >
              <SelectTrigger className="bg-background/40">
                <SelectValue 
                  placeholder={
                    loadingProjects 
                      ? "Loading..." 
                      : projects.length === 0 
                        ? "No projects found" 
                        : "Select a project"
                  } 
                />
              </SelectTrigger>
              <SelectContent>
                {projects.length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">No projects found</div>
                ) : (
                  projects.map((p) => (
                    <SelectItem key={p.projectKey} value={p.projectKey}>
                      {p.name} {p.isActive ? "" : "(inactive)"}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {selectedProject ? (
              <div className="mt-1 text-xs text-muted-foreground">
                key: <span className="text-foreground/90">{selectedProject.projectKey}</span>
              </div>
            ) : null}
            {!loadingProjects && !projectsError && projects.length === 0 ? (
              <div className="mt-1 text-xs text-muted-foreground">
                No projects found. Create a project first.
              </div>
            ) : null}
          </div>

          {/* Date range */}
          <div className="md:col-span-2">
            <div className="mb-1 text-xs font-medium text-muted-foreground">From</div>
            <Input
              value={filters.from}
              onChange={(e) => setFrom(e.target.value)}
              placeholder="2025-01-01T00:00:00Z"
              disabled={filtersDisabled}
              className="bg-background/40"
            />
          </div>
          <div className="md:col-span-2">
            <div className="mb-1 text-xs font-medium text-muted-foreground">To</div>
            <Input
              value={filters.to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="2025-01-10T00:00:00Z"
              disabled={filtersDisabled}
              className="bg-background/40"
            />
          </div>

          {/* Event name */}
          <div className="md:col-span-2">
            <div className="mb-1 text-xs font-medium text-muted-foreground">Event name</div>
            <Input
              value={filters.eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="purchase_success"
              disabled={filtersDisabled}
              className="bg-background/40"
            />
          </div>

          {/* User filters */}
          <div className="md:col-span-2">
            <div className="mb-1 text-xs font-medium text-muted-foreground">UserId</div>
            <Input
              value={filters.userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="user-123"
              disabled={filtersDisabled}
              className="bg-background/40"
            />
          </div>
          <div className="md:col-span-1">
            <div className="mb-1 text-xs font-medium text-muted-foreground">AnonId</div>
            <Input
              value={filters.anonymousId}
              onChange={(e) => setAnonymousId(e.target.value)}
              placeholder="anon-1"
              disabled={filtersDisabled}
              className="bg-background/40"
            />
          </div>

          {/* Auto refresh */}
          <div className="md:col-span-12">
            <Separator className="my-2 opacity-60" />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={filters.autoRefreshEnabled}
                    onCheckedChange={setAutoRefreshEnabled}
                    disabled={!isProjectSelected}
                  />
                  <div className="text-sm font-medium">Auto refresh</div>
                </div>

                <Select
                  value={String(filters.autoRefreshInterval)}
                  onValueChange={(v) => setAutoRefreshInterval((Number(v) as 30 | 60) || 30)}
                  disabled={!filters.autoRefreshEnabled || !isProjectSelected}
                >
                  <SelectTrigger className="h-9 w-[140px] bg-background/40">
                    <SelectValue placeholder="Interval" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">Every 30s</SelectItem>
                    <SelectItem value="60">Every 60s</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {!isProjectSelected ? (
                <div className="text-xs text-muted-foreground">
                  Select a project to enable filters & refresh.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}


