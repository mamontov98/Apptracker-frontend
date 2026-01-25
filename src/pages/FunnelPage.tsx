import { useEffect, useState } from "react"
import { useFilters } from "@/context/FiltersContext"
import { PageShell } from "@/pages/PageShell"
import { fetchFunnel } from "@/api/apiClient"
import { ErrorBanner } from "@/components/common/ErrorBanner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Fixed steps for MVP
const FUNNEL_STEPS = ["app_open", "screen_view", "login_success", "purchase_success"]

type FunnelStep = {
  eventName: string
  users: number
  dropOff?: number // percentage compared to previous step
  barWidth?: number // percentage compared to first step
}

// Helper: Calculate drop-off percentage
function calculateDropOff(current: number, previous: number): number {
  if (previous === 0) return 0
  return ((previous - current) / previous) * 100
}

// Helper: Calculate bar width percentage (relative to first step)
function calculateBarWidth(current: number, first: number): number {
  if (first === 0) return 0
  return (current / first) * 100
}

export function FunnelPage() {
  const { filters } = useFilters()
  const [data, setData] = useState<FunnelStep[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<"USER" | "PROCESS">("USER")
  const [processName, setProcessName] = useState<string>("checkout")

  // Load data when projectKey is selected, refreshToken changes, or manual trigger
  const loadFunnel = async () => {
    if (!filters.projectKey) {
      setData([])
      setError(null)
      return
    }

    // Validate: if PROCESS mode, processName is required
    if (mode === "PROCESS" && (!processName || !processName.trim())) {
      setError("Process name is required when using Process Funnel mode")
      setData([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Build request body
      const body: { 
        projectKey: string
        steps: string[]
        from?: string
        to?: string
        mode?: "USER" | "PROCESS"
        processName?: string
      } = {
        projectKey: filters.projectKey!,
        steps: FUNNEL_STEPS,
        mode: mode,
      }
      if (filters.from && filters.from.trim()) body.from = filters.from
      if (filters.to && filters.to.trim()) body.to = filters.to
      if (mode === "PROCESS" && processName && processName.trim()) {
        body.processName = processName.trim()
      }

      const response = await fetchFunnel(body)

      // Calculate drop-off and bar widths
      const processedSteps: FunnelStep[] = response.steps.map((step, index) => {
        const previousUsers = index > 0 ? response.steps[index - 1].users : step.users
        const firstUsers = response.steps[0].users

        return {
          eventName: step.eventName,
          users: step.users,
          dropOff: calculateDropOff(step.users, previousUsers),
          barWidth: calculateBarWidth(step.users, firstUsers),
        }
      })

      setData(processedSteps)
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.error ||
        err?.message ||
        "Failed to load funnel data"
      setError(errorMsg)
      setData([])
    } finally {
      setLoading(false)
    }
  }

  // Auto-load on projectKey, mode, processName, or refreshToken change
  useEffect(() => {
    loadFunnel()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.projectKey, filters.from, filters.to, filters.refreshToken, mode, processName])

  const hasProject = !!filters.projectKey

  return (
    <PageShell
      title="Funnel"
      subtitle="Step-by-step user progression"
    >
      {error && <ErrorBanner message={error} className="mb-4" />}

      {!hasProject ? (
        <Card className="border-border/60 bg-card/40 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Select a project</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Select a project from the top bar to run a funnel.
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Funnel Mode Selection and Controls */}
          <Card className="border-border/60 bg-card/40 shadow-sm mb-4">
            <CardHeader>
              <CardTitle className="text-base">Funnel Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Mode Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Funnel Mode</label>
                <Select value={mode} onValueChange={(value) => setMode(value as "USER" | "PROCESS")}>
                  <SelectTrigger className="w-full max-w-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">User Funnel</SelectItem>
                    <SelectItem value="PROCESS">Process Funnel</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {mode === "USER" 
                    ? "Track user progression through funnel steps"
                    : "Track process/flow progression (supports multiple processes per user)"}
                </p>
              </div>

              {/* Process Name Input (only shown for PROCESS mode) */}
              {mode === "PROCESS" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Process Name</label>
                  <Input
                    type="text"
                    placeholder="e.g., checkout, onboarding"
                    value={processName}
                    onChange={(e) => setProcessName(e.target.value)}
                    className="max-w-xs"
                  />
                  <p className="text-xs text-muted-foreground">
                    The name of the process/flow to track (e.g., "checkout", "onboarding")
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Run Funnel button */}
          <div className="mb-4">
            <Button
              onClick={loadFunnel}
              disabled={loading || (mode === "PROCESS" && !processName?.trim())}
              className="bg-primary hover:bg-primary/90"
            >
              {loading ? "Running..." : "Run Funnel"}
            </Button>
          </div>

          {/* Results table */}
          <Card className="border-border/60 bg-card/40 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Funnel Results</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {FUNNEL_STEPS.map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-8 w-32 bg-muted/40" />
                      <Skeleton className="h-8 w-24 bg-muted/40" />
                      <Skeleton className="h-8 flex-1 bg-muted/40" />
                    </div>
                  ))}
                </div>
              ) : data.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  Click "Run Funnel" to see results.
                </div>
              ) : (
                <div className="space-y-4 animate-[fadeIn_0.3s_ease-in-out]">
                  {/* Table header */}
                  <div className="grid grid-cols-12 gap-4 pb-2 border-b border-border/60">
                    <div className="col-span-4 text-sm font-medium text-muted-foreground">Step</div>
                    <div className="col-span-2 text-sm font-medium text-muted-foreground text-right">
                      {mode === "PROCESS" ? "Processes" : "Users"}
                    </div>
                    <div className="col-span-2 text-sm font-medium text-muted-foreground text-right">Drop-off</div>
                    <div className="col-span-4 text-sm font-medium text-muted-foreground">Visualization</div>
                  </div>

                  {/* Table rows */}
                  {data.map((step, index) => (
                    <div
                      key={step.eventName}
                      className="grid grid-cols-12 gap-4 items-center py-2 animate-[fadeIn_0.3s_ease-in-out]"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      {/* Step name */}
                      <div className="col-span-4">
                        <div className="font-medium text-foreground">{step.eventName}</div>
                      </div>

                      {/* Users count */}
                      <div className="col-span-2 text-right">
                        <div className="font-semibold text-foreground">{step.users.toLocaleString()}</div>
                      </div>

                      {/* Drop-off percentage */}
                      <div className="col-span-2 text-right">
                        {index === 0 ? (
                          <div className="text-sm text-muted-foreground">—</div>
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            {step.dropOff?.toFixed(1)}%
                          </div>
                        )}
                      </div>

                      {/* Bar visualization */}
                      <div className="col-span-4">
                        <div className="relative h-6 w-full rounded bg-muted/20 overflow-hidden">
                          <div
                            className="absolute left-0 top-0 h-full bg-primary transition-all duration-300"
                            style={{ width: `${step.barWidth || 0}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </PageShell>
  )
}
