import { NavLink } from "react-router-dom"
import { BarChart3, Cable, Clock, Settings, Target, TrendingUp } from "lucide-react"

const navItems = [
  { to: "/overview", label: "Overview", icon: BarChart3 },
  { to: "/top-events", label: "Top Events", icon: Target },
  { to: "/time-series", label: "Time Series", icon: Clock },
  { to: "/funnel", label: "Funnel", icon: Cable },
  { to: "/conversion", label: "Conversion", icon: TrendingUp },
  { to: "/settings", label: "Settings", icon: Settings },
]

export function Sidebar() {
  return (
    <div className="flex h-full flex-col p-4">
      <div className="mb-4 flex items-center gap-2 rounded-xl border border-border/60 bg-card/60 px-3 py-2 shadow-sm">
        <div className="h-8 w-8 rounded-lg bg-primary/20 ring-1 ring-primary/20" />
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold tracking-tight">AppTracker</div>
        </div>
      </div>

      <nav className="space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              [
                "group flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                "hover:bg-primary/10 hover:text-foreground",
                isActive ? "bg-primary/15 text-foreground ring-1 ring-primary/30" : "text-muted-foreground",
              ].join(" ")
            }
          >
            <item.icon className="h-4 w-4 opacity-90" />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto pt-4 text-xs text-muted-foreground">
        <div className="rounded-lg border border-border/60 bg-card/40 p-3">
          <div className="font-medium text-foreground/90">Tip</div>
          <div className="mt-1">
            Select a project in the top bar to enable filters and start exploring reports.
          </div>
        </div>
      </div>
    </div>
  )
}


