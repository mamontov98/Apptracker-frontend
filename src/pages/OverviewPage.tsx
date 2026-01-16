import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useFilters } from "@/context/FiltersContext"
import { PageShell } from "@/pages/PageShell"
import { fetchOverview, fetchConversion, fetchButtonClicks, fetchViewItems, fetchScreenViewsByHour } from "@/api/apiClient"
import { ErrorBanner } from "@/components/common/ErrorBanner"

type OverviewData = {
  totalEvents: number
  uniqueUsers: number
  conversionRate: number | null // null if not loaded
}

export function OverviewPage() {
  const { filters } = useFilters()
  const [data, setData] = useState<OverviewData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // New sections data
  const [buttonClicks, setButtonClicks] = useState<Array<{ buttonId: string; buttonText: string; count: number }>>([])
  const [viewItems, setViewItems] = useState<Array<{ itemId: string; itemName: string; count: number }>>([])
  const [screenViewsByHour, setScreenViewsByHour] = useState<Array<{ screenName: string; hour: number; count: number }>>([])
  const [detailsLoading, setDetailsLoading] = useState(false)

  // Load data when projectKey is selected and refreshToken changes
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
        const params: { projectKey: string; from?: string; to?: string } = {
          projectKey: filters.projectKey!, // We know it's not null because of the check above
        }
        if (filters.from && filters.from.trim()) params.from = filters.from
        if (filters.to && filters.to.trim()) params.to = filters.to

        // Fetch both reports in parallel
        const [overviewRes, conversionRes] = await Promise.all([
          fetchOverview(params),
          fetchConversion({ ...params, eventName: "purchase_success" }),
        ])

        setData({
          totalEvents: overviewRes.totalEvents,
          uniqueUsers: overviewRes.uniqueUsers,
          conversionRate: conversionRes.conversionRate,
        })
        
        // Load detailed breakdowns
        setDetailsLoading(true)
        try {
          const [buttonClicksRes, viewItemsRes, screenViewsRes] = await Promise.all([
            fetchButtonClicks({ ...params, limit: 20 }),
            fetchViewItems({ ...params, limit: 20 }),
            fetchScreenViewsByHour(params),
          ])
          
          setButtonClicks(buttonClicksRes.items)
          setViewItems(viewItemsRes.items)
          setScreenViewsByHour(screenViewsRes.items)
        } catch (err) {
          // Silently fail for details - don't break the main overview
          console.error("Failed to load detailed breakdowns:", err)
        } finally {
          setDetailsLoading(false)
        }
      } catch (err: any) {
        const errorMsg =
          err?.response?.data?.error ||
          err?.message ||
          "Failed to load overview data"
        setError(errorMsg)
        setData(null)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [filters.projectKey, filters.from, filters.to, filters.refreshToken])

  const hasProject = !!filters.projectKey

  return (
    <PageShell
      title="Overview"
      subtitle="High-level metrics and health for your selected project"
    >
      {error && <ErrorBanner message={error} className="mb-4" />}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Total Events Card */}
        <Card className="border-border/60 bg-card/40 shadow-sm transition hover:bg-card/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24 bg-muted/40" />
            ) : hasProject && data ? (
              <div className="animate-[fadeIn_0.3s_ease-in-out]">
                <div className="text-3xl font-bold text-foreground">
                  {data.totalEvents.toLocaleString()}
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Events in selected range
                </div>
              </div>
            ) : (
              <div className="text-3xl font-bold text-muted-foreground/50">
                —
              </div>
            )}
          </CardContent>
        </Card>

        {/* Unique Users Card */}
        <Card className="border-border/60 bg-card/40 shadow-sm transition hover:bg-card/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Unique Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24 bg-muted/40" />
            ) : hasProject && data ? (
              <div className="animate-[fadeIn_0.3s_ease-in-out]">
                <div className="text-3xl font-bold text-foreground">
                  {data.uniqueUsers.toLocaleString()}
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Active users in range
                </div>
              </div>
            ) : (
              <div className="text-3xl font-bold text-muted-foreground/50">
                —
              </div>
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
            ) : hasProject && data && data.conversionRate !== null ? (
              <div className="animate-[fadeIn_0.3s_ease-in-out]">
                <div
                  className={`text-3xl font-bold ${
                    data.conversionRate >= 0.3
                      ? "text-primary" // bright blue
                      : data.conversionRate >= 0.1
                      ? "text-primary/80" // medium blue
                      : data.conversionRate > 0
                      ? "text-primary/50" // muted blue
                      : "text-muted-foreground" // neutral for zero
                  }`}
                >
                  {(data.conversionRate * 100).toFixed(1)}%
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Purchase success rate
                </div>
              </div>
            ) : (
              <div className="text-3xl font-bold text-muted-foreground/50">
                —
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Breakdowns Section */}
      {hasProject && (
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Top Button Clicks */}
          <Card className="border-border/60 bg-card/40 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Top Button Clicks</CardTitle>
            </CardHeader>
            <CardContent>
              {detailsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between py-2">
                      <Skeleton className="h-5 w-32 bg-muted/40" />
                      <Skeleton className="h-5 w-16 bg-muted/40" />
                    </div>
                  ))}
                </div>
              ) : buttonClicks.length === 0 ? (
                <div className="py-4 text-center text-sm text-muted-foreground">
                  No button clicks found.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border/60">
                        <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">
                          Button ID
                        </th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">
                          Button Text
                        </th>
                        <th className="px-4 py-2 text-right text-sm font-medium text-muted-foreground">
                          Count
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {buttonClicks.map((item, index) => (
                        <tr
                          key={`${item.buttonId}-${index}`}
                          className="border-b border-border/40 transition-colors hover:bg-card/60"
                        >
                          <td className="px-4 py-2 text-sm text-foreground">
                            {item.buttonId}
                          </td>
                          <td className="px-4 py-2 text-sm text-foreground">
                            {item.buttonText}
                          </td>
                          <td className="px-4 py-2 text-right text-sm font-semibold text-foreground">
                            {item.count.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Most Viewed Items */}
          <Card className="border-border/60 bg-card/40 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Most Viewed Items</CardTitle>
            </CardHeader>
            <CardContent>
              {detailsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between py-2">
                      <Skeleton className="h-5 w-32 bg-muted/40" />
                      <Skeleton className="h-5 w-16 bg-muted/40" />
                    </div>
                  ))}
                </div>
              ) : viewItems.length === 0 ? (
                <div className="py-4 text-center text-sm text-muted-foreground">
                  No viewed items found.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border/60">
                        <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">
                          Item ID
                        </th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">
                          Item Name
                        </th>
                        <th className="px-4 py-2 text-right text-sm font-medium text-muted-foreground">
                          Views
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewItems.map((item, index) => (
                        <tr
                          key={`${item.itemId}-${index}`}
                          className="border-b border-border/40 transition-colors hover:bg-card/60"
                        >
                          <td className="px-4 py-2 text-sm text-foreground">
                            {item.itemId}
                          </td>
                          <td className="px-4 py-2 text-sm text-foreground">
                            {item.itemName}
                          </td>
                          <td className="px-4 py-2 text-right text-sm font-semibold text-foreground">
                            {item.count.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Screen Views by Hour */}
      {hasProject && (
        <Card className="mt-6 border-border/60 bg-card/40 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Screen Views by Hour</CardTitle>
          </CardHeader>
          <CardContent>
            {detailsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center justify-between py-2">
                    <Skeleton className="h-5 w-48 bg-muted/40" />
                    <Skeleton className="h-5 w-16 bg-muted/40" />
                  </div>
                ))}
              </div>
            ) : screenViewsByHour.length === 0 ? (
              <div className="py-4 text-center text-sm text-muted-foreground">
                No screen views found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/60">
                      <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">
                        Screen Name
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">
                        Hour
                      </th>
                      <th className="px-4 py-2 text-right text-sm font-medium text-muted-foreground">
                        Count
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {screenViewsByHour.map((item, index) => (
                      <tr
                        key={`${item.screenName}-${item.hour}-${index}`}
                        className="border-b border-border/40 transition-colors hover:bg-card/60"
                      >
                        <td className="px-4 py-2 text-sm text-foreground">
                          {item.screenName}
                        </td>
                        <td className="px-4 py-2 text-sm text-foreground">
                          {item.hour}:00
                        </td>
                        <td className="px-4 py-2 text-right text-sm font-semibold text-foreground">
                          {item.count.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!hasProject && (
        <Card className="mt-4 border-border/60 bg-card/40 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Select a project</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Choose a project from the top bar to view overview metrics.
          </CardContent>
        </Card>
      )}
    </PageShell>
  )
}


