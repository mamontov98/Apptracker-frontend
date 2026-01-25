import axios from "axios"

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"

export const apiClient = axios.create({
  baseURL,
  timeout: 15000,
})

export type Project = {
  name: string
  projectKey: string
  createdAt?: string | null
  isActive: boolean
}

export async function fetchProjects(): Promise<Project[]> {
  const res = await apiClient.get<{ projects: Project[] }>("/v1/projects")
  return res.data.projects
}

export type OverviewResponse = {
  projectKey: string
  range: {
    from: string | null
    to: string | null
  }
  totalEvents: number
  uniqueUsers: number
  uniqueEventNames: number
}

export type ConversionResponse = {
  projectKey: string
  conversionEvent: string
  range: {
    from: string | null
    to: string | null
  }
  totalUsers: number
  convertedUsers: number
  conversionRate: number // 0.0 to 1.0
}

export async function fetchOverview(params: { projectKey: string; from?: string; to?: string }): Promise<OverviewResponse> {
  const res = await apiClient.get<OverviewResponse>("/v1/reports/overview", { params })
  return res.data
}

export type TopEventsResponse = {
  projectKey: string
  items: Array<{
    eventName: string
    count: number
  }>
}

export async function fetchTopEvents(params: { projectKey: string; from?: string; to?: string; limit?: number }): Promise<TopEventsResponse> {
  const res = await apiClient.get<TopEventsResponse>("/v1/reports/top-events", { params })
  return res.data
}

export type TopScreensResponse = {
  projectKey: string
  items: Array<{
    screenName: string
    count: number
  }>
}

export async function fetchTopScreens(params: { projectKey: string; from?: string; to?: string; limit?: number }): Promise<TopScreensResponse> {
  const res = await apiClient.get<TopScreensResponse>("/v1/reports/top-screens", { params })
  return res.data
}

export type TimeSeriesResponse = {
  projectKey: string
  interval: string
  items: Array<{
    time: string
    count: number
  }>
}

export async function fetchTimeSeries(params: {
  projectKey: string
  from?: string
  to?: string
  interval?: "day" | "hour"
}): Promise<TimeSeriesResponse> {
  const res = await apiClient.get<TimeSeriesResponse>("/v1/reports/events-timeseries", { params })
  return res.data
}

export type FunnelResponse = {
  projectKey: string
  mode?: "USER" | "PROCESS"
  processName?: string
  totalProcesses?: number
  steps: Array<{
    eventName: string
    users: number
  }>
}

export async function fetchFunnel(data: { 
  projectKey: string
  steps: string[]
  from?: string
  to?: string
  mode?: "USER" | "PROCESS"
  processName?: string
}): Promise<FunnelResponse> {
  const res = await apiClient.post<FunnelResponse>("/v1/reports/funnel", data)
  return res.data
}

export async function fetchConversion(params: { projectKey: string; eventName: string; from?: string; to?: string }): Promise<ConversionResponse> {
  const res = await apiClient.get<ConversionResponse>("/v1/reports/conversion", { params })
  return res.data
}

export type ButtonClicksResponse = {
  projectKey: string
  items: Array<{
    buttonId: string
    buttonText: string
    count: number
  }>
}

export async function fetchButtonClicks(params: { projectKey: string; from?: string; to?: string; limit?: number }): Promise<ButtonClicksResponse> {
  const res = await apiClient.get<ButtonClicksResponse>("/v1/reports/button-clicks", { params })
  return res.data
}

export type ViewItemsResponse = {
  projectKey: string
  items: Array<{
    itemId: string
    itemName: string
    count: number
  }>
}

export async function fetchViewItems(params: { projectKey: string; from?: string; to?: string; limit?: number }): Promise<ViewItemsResponse> {
  const res = await apiClient.get<ViewItemsResponse>("/v1/reports/view-items", { params })
  return res.data
}

export type ScreenViewsByHourResponse = {
  projectKey: string
  items: Array<{
    screenName: string
    hour: number
    count: number
  }>
}

export async function fetchScreenViewsByHour(params: { projectKey: string; from?: string; to?: string }): Promise<ScreenViewsByHourResponse> {
  const res = await apiClient.get<ScreenViewsByHourResponse>("/v1/reports/screen-views-by-hour", { params })
  return res.data
}

export type EventNamesResponse = {
  projectKey: string
  eventNames: string[]
  range: {
    from: string | null
    to: string | null
  }
}

export async function fetchEventNames(params: { projectKey: string; from?: string; to?: string }): Promise<EventNamesResponse> {
  const res = await apiClient.get<EventNamesResponse>(`/v1/projects/${params.projectKey}/events/names`, { 
    params: { from: params.from, to: params.to } 
  })
  return res.data
}


