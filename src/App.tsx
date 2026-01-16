import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"

import { FiltersProvider } from "@/context/FiltersContext"
import { DashboardLayout } from "@/layout/DashboardLayout"
import { ConversionPage } from "@/pages/ConversionPage"
import { FunnelPage } from "@/pages/FunnelPage"
import { OverviewPage } from "@/pages/OverviewPage"
import { SettingsPage } from "@/pages/SettingsPage"
import { TimeSeriesPage } from "@/pages/TimeSeriesPage"
import { TopEventsPage } from "@/pages/TopEventsPage"

export default function App() {
  return (
    <FiltersProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<Navigate to="/overview" replace />} />
          <Route path="/overview" element={<OverviewPage />} />
          <Route path="/top-events" element={<TopEventsPage />} />
          <Route path="/time-series" element={<TimeSeriesPage />} />
          <Route path="/funnel" element={<FunnelPage />} />
          <Route path="/conversion" element={<ConversionPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </FiltersProvider>
  )
}
