import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useFilters } from "@/context/FiltersContext"
import { PageShell } from "@/pages/PageShell"

export function SettingsPage() {
  const { resetFilters } = useFilters()

  return (
    <PageShell title="Settings" subtitle="Local UI preferences and debugging helpers. Coming next…">
      <Card className="border-border/60 bg-card/40">
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground">
            Filters are saved in <span className="text-foreground/90">localStorage</span>.
          </div>
          <Button variant="outline" className="border-border/70 bg-card/40 hover:bg-card/70" onClick={resetFilters}>
            Reset filters
          </Button>
        </CardContent>
      </Card>
    </PageShell>
  )
}


