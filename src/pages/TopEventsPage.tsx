import { useEffect, useState, useMemo } from "react"
import { useFilters } from "@/context/FiltersContext"
import { PageShell } from "@/pages/PageShell"
import { fetchTopEvents, fetchTopScreens } from "@/api/apiClient"
import { ErrorBanner } from "@/components/common/ErrorBanner"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type TopEventItem = {
  eventName: string
  count: number
}

type TopScreenItem = {
  screenName: string
  count: number
}

export function TopEventsPage() {
  const { filters } = useFilters()
  const [data, setData] = useState<TopEventItem[]>([])
  const [screensData, setScreensData] = useState<TopScreenItem[]>([])
  const [loading, setLoading] = useState(false)
  const [screensLoading, setScreensLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [screensError, setScreensError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

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
        const params: { projectKey: string; from?: string; to?: string; limit?: number } = {
          projectKey: filters.projectKey!,
          limit: 50, // Max limit
        }
        if (filters.from && filters.from.trim()) params.from = filters.from
        if (filters.to && filters.to.trim()) params.to = filters.to

        const response = await fetchTopEvents(params)
        setData(response.items)
      } catch (err: any) {
        const errorMsg =
          err?.response?.data?.error ||
          err?.message ||
          "Failed to load top events"
        setError(errorMsg)
        setData([])
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [filters.projectKey, filters.from, filters.to, filters.refreshToken])

  // Load top screens data
  useEffect(() => {
    if (!filters.projectKey) {
      setScreensData([])
      setScreensError(null)
      return
    }

    const loadScreensData = async () => {
      setScreensLoading(true)
      setScreensError(null)

      try {
        const params: { projectKey: string; from?: string; to?: string; limit?: number } = {
          projectKey: filters.projectKey!,
          limit: 50, // Max limit
        }
        if (filters.from && filters.from.trim()) params.from = filters.from
        if (filters.to && filters.to.trim()) params.to = filters.to

        const response = await fetchTopScreens(params)
        setScreensData(response.items)
      } catch (err: any) {
        const errorMsg =
          err?.response?.data?.error ||
          err?.message ||
          "Failed to load top screens"
        setScreensError(errorMsg)
        setScreensData([])
      } finally {
        setScreensLoading(false)
      }
    }

    loadScreensData()
  }, [filters.projectKey, filters.from, filters.to, filters.refreshToken])

  // Filter events by search query (client-side) and exclude screen_view
  const filteredData = useMemo(() => {
    // Filter out screen_view events (backend should already filter, but this is a safety measure)
    const filtered = data.filter((item) => item.eventName !== "screen_view")
    
    if (!searchQuery.trim()) return filtered

    const query = searchQuery.toLowerCase().trim()
    return filtered.filter((item) =>
      item.eventName.toLowerCase().includes(query)
    )
  }, [data, searchQuery])

  // Sort by count descending (already sorted from backend, but ensure it)
  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => b.count - a.count)
  }, [filteredData])

  const hasProject = !!filters.projectKey

  return (
    <PageShell
      title="Top Events"
      subtitle="Most frequent events for the selected project"
    >
      {error && <ErrorBanner message={error} className="mb-4" />}

      {!hasProject ? (
        <Card className="border-border/60 bg-card/40 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Select a project</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Choose a project from the top bar to view top events.
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Search box */}
          <div className="mb-4">
            <Input
              type="text"
              placeholder="Search events by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md bg-background/40"
            />
          </div>

          {/* Table */}
          <Card className="border-border/60 bg-card/40 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">
                Top Events {sortedData.length > 0 && `(${sortedData.length})`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center justify-between py-2">
                      <Skeleton className="h-5 w-48 bg-muted/40" />
                      <Skeleton className="h-5 w-16 bg-muted/40" />
                    </div>
                  ))}
                </div>
              ) : sortedData.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  {searchQuery ? "No events match your search." : "No events found."}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border/60">
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          Event Name
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                          Count
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedData.map((item, index) => (
                        <tr
                          key={item.eventName}
                          className="border-b border-border/40 transition-colors hover:bg-card/60 animate-[fadeIn_0.3s_ease-in-out]"
                          style={{ animationDelay: `${index * 0.05}s` }}
                        >
                          <td className="px-4 py-3">
                            <div className="font-medium text-foreground">
                              {item.eventName}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="font-semibold text-foreground">
                              {item.count.toLocaleString()}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Screens Card */}
          <Card className="border-border/60 bg-card/40 shadow-sm mt-6">
            <CardHeader>
              <CardTitle className="text-base">
                Top Screens {screensData.length > 0 && `(${screensData.length})`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {screensLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center justify-between py-2">
                      <Skeleton className="h-5 w-48 bg-muted/40" />
                      <Skeleton className="h-5 w-16 bg-muted/40" />
                    </div>
                  ))}
                </div>
              ) : screensError ? (
                <ErrorBanner message={screensError} className="mb-0" />
              ) : screensData.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No screen views found.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border/60">
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          Screen Name
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                          Count
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {screensData.map((item, index) => (
                        <tr
                          key={item.screenName}
                          className="border-b border-border/40 transition-colors hover:bg-card/60 animate-[fadeIn_0.3s_ease-in-out]"
                          style={{ animationDelay: `${index * 0.05}s` }}
                        >
                          <td className="px-4 py-3">
                            <div className="font-medium text-foreground">
                              {item.screenName}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="font-semibold text-foreground">
                              {item.count.toLocaleString()}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </PageShell>
  )
}
