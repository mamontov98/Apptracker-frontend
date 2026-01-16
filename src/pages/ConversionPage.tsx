import { useEffect, useState } from "react"
import { useFilters } from "@/context/FiltersContext"
import { PageShell } from "@/pages/PageShell"
import { fetchConversion } from "@/api/apiClient"
import { ErrorBanner } from "@/components/common/ErrorBanner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"

// Common conversion events
const CONVERSION_EVENTS = [
  { value: "purchase_success", label: "Purchase Success" },
  { value: "signup_success", label: "Signup Success" },
  { value: "login_success", label: "Login Success" },
]

// Helper: Format percentage
function formatPercent(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`
}

export function ConversionPage() {
  const { filters } = useFilters()
  const [conversionEvent, setConversionEvent] = useState("purchase_success")
  const [data, setData] = useState<{
    totalUsers: number
    convertedUsers: number
    conversionRate: number
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load data when projectKey, refreshToken, or conversionEvent changes
  useEffect(() => {
    if (!filters.projectKey) {
      setData(null)
      setError(null)
      return
    }

    const loadData = async () => {
      setLoading(true)
      setError(null)

      try {
        // Build params
        const params: { projectKey: string; eventName: string; from?: string; to?: string } = {
          projectKey: filters.projectKey!,
          eventName: conversionEvent,
        }
        if (filters.from && filters.from.trim()) params.from = filters.from
        if (filters.to && filters.to.trim()) params.to = filters.to

        const response = await fetchConversion(params)
        setData({
          totalUsers: response.totalUsers,
          convertedUsers: response.convertedUsers,
          conversionRate: response.conversionRate,
        })
      } catch (err: any) {
        const errorMsg =
          err?.response?.data?.error ||
          err?.message ||
          "Failed to load conversion data"
        setError(errorMsg)
        setData(null)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [filters.projectKey, filters.from, filters.to, filters.refreshToken, conversionEvent])

  const hasProject = !!filters.projectKey

  return (
    <PageShell
      title="Conversion"
      subtitle="Conversion rate analysis"
    >
      {error && <ErrorBanner message={error} className="mb-4" />}

      {!hasProject ? (
        <Card className="border-border/60 bg-card/40 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Select a project</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Select a project from the top bar to view conversion.
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Conversion Event Selector */}
          <div className="mb-4">
            <div className="mb-2 text-sm font-medium text-muted-foreground">Conversion Event</div>
            <Select value={conversionEvent} onValueChange={setConversionEvent}>
              <SelectTrigger className="w-[250px] bg-background/40">
                <SelectValue placeholder="Select event" />
              </SelectTrigger>
              <SelectContent>
                {CONVERSION_EVENTS.map((event) => (
                  <SelectItem key={event.value} value={event.value}>
                    {event.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Selected event name */}
          {conversionEvent && (
            <div className="mb-4 text-sm text-muted-foreground">
              Tracking: <span className="font-medium text-foreground/90">{conversionEvent}</span>
            </div>
          )}

          {/* KPI Cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Total Users Card */}
            <Card className="border-border/60 bg-card/40 shadow-sm transition hover:bg-card/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-24 bg-muted/40" />
                ) : data ? (
                  <div className="animate-[fadeIn_0.3s_ease-in-out]">
                    <div className="text-3xl font-bold text-foreground">
                      {data.totalUsers.toLocaleString()}
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Users in selected range
                    </div>
                  </div>
                ) : (
                  <div className="text-3xl font-bold text-muted-foreground/50">—</div>
                )}
              </CardContent>
            </Card>

            {/* Converted Users Card */}
            <Card className="border-border/60 bg-card/40 shadow-sm transition hover:bg-card/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Converted Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-24 bg-muted/40" />
                ) : data ? (
                  <div className="animate-[fadeIn_0.3s_ease-in-out]">
                    <div className="text-3xl font-bold text-foreground">
                      {data.convertedUsers.toLocaleString()}
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Users who converted
                    </div>
                  </div>
                ) : (
                  <div className="text-3xl font-bold text-muted-foreground/50">—</div>
                )}
              </CardContent>
            </Card>

            {/* Conversion Rate Card */}
            <Card className="border-border/60 bg-card/40 shadow-sm transition hover:bg-card/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Conversion Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-24 bg-muted/40" />
                ) : data ? (
                  <div className="animate-[fadeIn_0.3s_ease-in-out]">
                    <div className="text-3xl font-bold text-primary">
                      {formatPercent(data.conversionRate)}
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Conversion percentage
                    </div>
                  </div>
                ) : (
                  <div className="text-3xl font-bold text-muted-foreground/50">—</div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Empty state */}
          {data && data.totalUsers === 0 && (
            <Card className="mt-4 border-border/60 bg-card/40 shadow-sm">
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                No users found for this range.
              </CardContent>
            </Card>
          )}
        </>
      )}
    </PageShell>
  )
}

