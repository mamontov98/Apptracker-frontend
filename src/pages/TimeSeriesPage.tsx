import { useEffect, useState } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { useFilters } from "@/context/FiltersContext"
import { PageShell } from "@/pages/PageShell"
import { fetchTimeSeries } from "@/api/apiClient"
import { ErrorBanner } from "@/components/common/ErrorBanner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function TimeSeriesPage() {
  const { filters } = useFilters()
  const [data, setData] = useState<Array<{ time: string; count: number }>>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load data when projectKey is selected and refreshToken changes
  useEffect(() => {
    if (!filters.projectKey) {
      setData([])
      setError(null)
      return
    }

    const loadData = async () => {
      setLoading(true)
      setError(null)

      try {
        // Build params
        const params: { projectKey: string; from?: string; to?: string; interval?: "day" | "hour" } = {
          projectKey: filters.projectKey!,
          interval: "day",
        }
        if (filters.from && filters.from.trim()) params.from = filters.from
        if (filters.to && filters.to.trim()) params.to = filters.to

        const response = await fetchTimeSeries(params)
        setData(response.items)
      } catch (err: any) {
        const errorMsg =
          err?.response?.data?.error ||
          err?.message ||
          "Failed to load time series data"
        setError(errorMsg)
        setData([])
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [filters.projectKey, filters.from, filters.to, filters.refreshToken])

  const hasProject = !!filters.projectKey

  return (
    <PageShell
      title="Time Series"
      subtitle="Events over time"
    >
      {error && <ErrorBanner message={error} className="mb-4" />}

      {!hasProject ? (
        <Card className="border-border/60 bg-card/40 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Select a project</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Select a project from the top bar to view time series.
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/60 bg-card/40 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Events Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[400px] w-full">
                <Skeleton className="h-full w-full bg-muted/40" />
              </div>
            ) : data.length === 0 ? (
              <div className="flex h-[400px] items-center justify-center text-sm text-muted-foreground">
                No data available for the selected time range.
              </div>
            ) : (
              <div className="h-[400px] w-full animate-[fadeIn_0.3s_ease-in-out]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis
                      dataKey="time"
                      stroke="hsl(var(--muted-foreground))"
                      style={{ fontSize: "12px" }}
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      style={{ fontSize: "12px" }}
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "6px",
                      }}
                      labelStyle={{ color: "hsl(var(--foreground))" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--primary))", r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </PageShell>
  )
}
