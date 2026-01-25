import { useEffect, useState, useRef } from "react"
import { useFilters } from "@/context/FiltersContext"
import { PageShell } from "@/pages/PageShell"
import { fetchFunnel, fetchEventNames } from "@/api/apiClient"
import { ErrorBanner } from "@/components/common/ErrorBanner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ArrowUp, ArrowDown, X, Plus, Save, FolderOpen, Trash2 } from "lucide-react"

// Default steps for initial state (can be loaded from preset later)
const DEFAULT_FUNNEL_STEPS = ["app_open", "screen_view", "login_success", "purchase_success"]

type FunnelPreset = {
  presetName: string
  steps: string[]
  createdAt: string
}

// LocalStorage helpers for presets
const PRESETS_STORAGE_KEY = "funnel_presets"

function getPresetsStorageKey(projectKey: string): string {
  return `${PRESETS_STORAGE_KEY}_${projectKey}`
}

function loadPresets(projectKey: string): FunnelPreset[] {
  if (!projectKey) return []
  try {
    const stored = localStorage.getItem(getPresetsStorageKey(projectKey))
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (err) {
    console.error("Failed to load presets:", err)
  }
  return []
}

function savePreset(projectKey: string, preset: FunnelPreset): void {
  if (!projectKey) return
  try {
    const presets = loadPresets(projectKey)
    const updated = [...presets.filter(p => p.presetName !== preset.presetName), preset]
    localStorage.setItem(getPresetsStorageKey(projectKey), JSON.stringify(updated))
  } catch (err) {
    console.error("Failed to save preset:", err)
  }
}

function deletePreset(projectKey: string, presetName: string): void {
  if (!projectKey) return
  try {
    const presets = loadPresets(projectKey)
    const updated = presets.filter(p => p.presetName !== presetName)
    localStorage.setItem(getPresetsStorageKey(projectKey), JSON.stringify(updated))
  } catch (err) {
    console.error("Failed to delete preset:", err)
  }
}

type FunnelStep = {
  eventName: string
  users: number
  dropOff?: number // percentage dropped from previous step
  conversionRate?: number // percentage converted from previous step
  barWidth?: number // percentage compared to first step
}

// Helper: Calculate drop-off percentage (how many dropped from previous step)
function calculateDropOff(current: number, previous: number): number {
  if (previous === 0) return 0
  return ((previous - current) / previous) * 100
}

// Helper: Calculate conversion rate percentage (how many converted from previous step)
function calculateConversionRate(current: number, previous: number): number {
  if (previous === 0) return 0
  return (current / previous) * 100
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
  const [steps, setSteps] = useState<string[]>(DEFAULT_FUNNEL_STEPS)
  const [newStepInput, setNewStepInput] = useState<string>("")
  const [stepError, setStepError] = useState<string | null>(null)
  const [eventNames, setEventNames] = useState<string[]>([])
  const [loadingEventNames, setLoadingEventNames] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const [presets, setPresets] = useState<FunnelPreset[]>([])
  const [presetNameInput, setPresetNameInput] = useState<string>("")
  const [showPresetDialog, setShowPresetDialog] = useState(false)

  // Load presets when projectKey changes
  useEffect(() => {
    if (filters.projectKey) {
      const loadedPresets = loadPresets(filters.projectKey)
      setPresets(loadedPresets)
      
      // Try to load default preset if exists
      const defaultPreset = loadedPresets.find(p => p.presetName === "Default")
      if (defaultPreset && defaultPreset.steps.length >= 2) {
        setSteps(defaultPreset.steps)
      }
    } else {
      setPresets([])
    }
  }, [filters.projectKey])

  // Validate steps before submission
  const validateSteps = (stepsToValidate: string[]): string | null => {
    if (stepsToValidate.length < 2) {
      return "At least 2 steps are required"
    }
    const trimmedSteps = stepsToValidate.map(s => s.trim()).filter(s => s.length > 0)
    if (trimmedSteps.length !== stepsToValidate.length) {
      return "Steps cannot be empty or whitespace only"
    }
    const duplicates = trimmedSteps.filter((step, index) => trimmedSteps.indexOf(step) !== index)
    if (duplicates.length > 0) {
      return `Duplicate steps found: ${duplicates.join(", ")}`
    }
    return null
  }

  // Filter suggestions based on input
  const filteredSuggestions = eventNames.filter(
    (name) => name.toLowerCase().includes(newStepInput.toLowerCase()) && !steps.includes(name)
  ).slice(0, 10) // Limit to 10 suggestions

  // Add a new step
  const handleAddStep = (stepName?: string) => {
    const trimmed = (stepName || newStepInput).trim()
    if (!trimmed) {
      setStepError("Step name cannot be empty")
      return
    }
    if (steps.includes(trimmed)) {
      setStepError(`Step "${trimmed}" already exists`)
      return
    }
    const newSteps = [...steps, trimmed]
    const validationError = validateSteps(newSteps)
    if (validationError) {
      setStepError(validationError)
      return
    }
    setSteps(newSteps)
    setNewStepInput("")
    setStepError(null)
    setShowSuggestions(false)
  }

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    handleAddStep(suggestion)
  }

  // Remove a step
  const handleRemoveStep = (index: number) => {
    const newSteps = steps.filter((_, i) => i !== index)
    const validationError = validateSteps(newSteps)
    if (validationError) {
      setStepError(validationError)
      return
    }
    setSteps(newSteps)
    setStepError(null)
  }

  // Move step up
  const handleMoveUp = (index: number) => {
    if (index === 0) return
    const newSteps = [...steps]
    ;[newSteps[index - 1], newSteps[index]] = [newSteps[index], newSteps[index - 1]]
    setSteps(newSteps)
  }

  // Move step down
  const handleMoveDown = (index: number) => {
    if (index === steps.length - 1) return
    const newSteps = [...steps]
    ;[newSteps[index], newSteps[index + 1]] = [newSteps[index + 1], newSteps[index]]
    setSteps(newSteps)
  }

  // Preset management
  const handleSavePreset = () => {
    if (!filters.projectKey) return
    const trimmed = presetNameInput.trim()
    if (!trimmed) {
      setStepError("Preset name cannot be empty")
      return
    }
    if (steps.length < 2) {
      setStepError("At least 2 steps are required to save a preset")
      return
    }
    
    const preset: FunnelPreset = {
      presetName: trimmed,
      steps: [...steps],
      createdAt: new Date().toISOString(),
    }
    
    savePreset(filters.projectKey, preset)
    setPresets(loadPresets(filters.projectKey))
    setPresetNameInput("")
    setShowPresetDialog(false)
    setStepError(null)
  }

  const handleLoadPreset = (preset: FunnelPreset) => {
    if (preset.steps.length >= 2) {
      setSteps(preset.steps)
      setStepError(null)
    }
  }

  const handleDeletePreset = (presetName: string) => {
    if (!filters.projectKey) return
    if (confirm(`Are you sure you want to delete preset "${presetName}"?`)) {
      deletePreset(filters.projectKey, presetName)
      setPresets(loadPresets(filters.projectKey))
    }
  }

  // Load data when projectKey is selected, refreshToken changes, or manual trigger
  const loadFunnel = async () => {
    if (!filters.projectKey) {
      setData([])
      setError(null)
      return
    }

    // Validate steps
    const validationError = validateSteps(steps)
    if (validationError) {
      setError(`Invalid funnel steps: ${validationError}`)
      setData([])
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
    setStepError(null)

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
        steps: steps, // Use steps from state instead of FUNNEL_STEPS
        mode: mode,
      }
      if (filters.from && filters.from.trim()) body.from = filters.from
      if (filters.to && filters.to.trim()) body.to = filters.to
      if (mode === "PROCESS" && processName && processName.trim()) {
        body.processName = processName.trim()
      }

      const response = await fetchFunnel(body)

      // Calculate drop-off, conversion rate, and bar widths
      const processedSteps: FunnelStep[] = response.steps.map((step, index) => {
        const previousUsers = index > 0 ? response.steps[index - 1].users : step.users
        const firstUsers = response.steps[0].users

        return {
          eventName: step.eventName,
          users: step.users,
          dropOff: index > 0 ? calculateDropOff(step.users, previousUsers) : undefined,
          conversionRate: index > 0 ? calculateConversionRate(step.users, previousUsers) : undefined,
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

  // Load event names when projectKey changes
  useEffect(() => {
    const loadEventNames = async () => {
      if (!filters.projectKey) {
        setEventNames([])
        return
      }
      
      setLoadingEventNames(true)
      try {
        const response = await fetchEventNames({
          projectKey: filters.projectKey,
          from: filters.from,
          to: filters.to,
        })
        setEventNames(response.eventNames || [])
      } catch (err) {
        // Silently fail - user can still type custom event names
        console.error("Failed to load event names:", err)
        setEventNames([])
      } finally {
        setLoadingEventNames(false)
      }
    }
    
    loadEventNames()
  }, [filters.projectKey, filters.from, filters.to])

  // Auto-load on projectKey, mode, processName, steps, or refreshToken change
  useEffect(() => {
    loadFunnel()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.projectKey, filters.from, filters.to, filters.refreshToken, mode, processName, steps])

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

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
          {/* Funnel Builder - Step Editor */}
          <Card className="border-border/60 bg-card/40 shadow-sm mb-4">
            <CardHeader>
              <CardTitle className="text-base">Funnel Steps Builder</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current Steps List */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Funnel Steps (in order)</label>
                {steps.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-2">
                    No steps added. Add at least 2 steps to create a funnel.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 p-3 border border-border/60 rounded-md bg-muted/20 min-h-[60px]">
                    {steps.map((step, index) => (
                      <Badge
                        key={`${step}-${index}`}
                        variant="secondary"
                        className="flex items-center gap-1 px-2 py-1 text-sm"
                      >
                        <span className="text-xs text-muted-foreground mr-1">{index + 1}.</span>
                        <span>{step}</span>
                        <div className="flex items-center gap-0.5 ml-1">
                          <button
                            onClick={() => handleMoveUp(index)}
                            disabled={index === 0}
                            className="p-0.5 hover:bg-muted rounded disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Move up"
                          >
                            <ArrowUp className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => handleMoveDown(index)}
                            disabled={index === steps.length - 1}
                            className="p-0.5 hover:bg-muted rounded disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Move down"
                          >
                            <ArrowDown className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => handleRemoveStep(index)}
                            className="p-0.5 hover:bg-destructive/20 rounded"
                            title="Remove"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      </Badge>
                    ))}
                  </div>
                )}
                {stepError && (
                  <div className="text-sm text-destructive">{stepError}</div>
                )}
              </div>

              {/* Add New Step */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Add Step</label>
                <div className="relative flex gap-2">
                  <div className="flex-1 relative">
                    <Input
                      ref={inputRef}
                      type="text"
                      placeholder={loadingEventNames ? "Loading events..." : "Enter event name or select from list"}
                      value={newStepInput}
                      onChange={(e) => {
                        setNewStepInput(e.target.value)
                        setStepError(null)
                        setShowSuggestions(true)
                      }}
                      onFocus={() => {
                        if (newStepInput && filteredSuggestions.length > 0) {
                          setShowSuggestions(true)
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          if (filteredSuggestions.length === 1) {
                            handleAddStep(filteredSuggestions[0])
                          } else {
                            handleAddStep()
                          }
                        } else if (e.key === "Escape") {
                          setShowSuggestions(false)
                        }
                      }}
                      className="flex-1"
                    />
                    {/* Suggestions dropdown */}
                    {showSuggestions && filteredSuggestions.length > 0 && (
                      <div
                        ref={suggestionsRef}
                        className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto"
                      >
                        {filteredSuggestions.map((suggestion) => (
                          <button
                            key={suggestion}
                            type="button"
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="w-full text-left px-3 py-2 hover:bg-accent hover:text-accent-foreground text-sm transition-colors"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={() => handleAddStep()}
                    disabled={!newStepInput.trim()}
                    variant="outline"
                    size="icon"
                    title="Add step"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-start justify-between">
                  <p className="text-xs text-muted-foreground">
                    {eventNames.length > 0 
                      ? `Add steps in order. ${eventNames.length} events available.`
                      : "Add steps in the order users should progress through the funnel"}
                  </p>
                  {eventNames.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {filteredSuggestions.length > 0 && `(${filteredSuggestions.length} matches)`}
                    </p>
                  )}
                </div>
              </div>

              {/* Validation Warnings */}
              {steps.length > 0 && (
                <div className="space-y-1 text-xs">
                  {steps.length < 2 && (
                    <div className="text-amber-600 dark:text-amber-400">
                      ⚠️ At least 2 steps are required to run a funnel
                    </div>
                  )}
                  {steps.length >= 2 && steps.length > 10 && (
                    <div className="text-amber-600 dark:text-amber-400">
                      ⚠️ Large funnels ({steps.length} steps) may take longer to process
                    </div>
                  )}
                  {steps.length >= 2 && !steps[0]?.includes("open") && !steps[0]?.includes("start") && (
                    <div className="text-blue-600 dark:text-blue-400">
                      💡 Tip: Consider starting with an entry event (e.g., app_open, screen_view)
                    </div>
                  )}
                </div>
              )}

              {/* Presets Management */}
              <div className="space-y-2 pt-2 border-t border-border/60">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Presets</label>
                  <Button
                    onClick={() => setShowPresetDialog(!showPresetDialog)}
                    variant="outline"
                    size="sm"
                    className="h-8"
                  >
                    <Save className="h-3 w-3 mr-1" />
                    Save Preset
                  </Button>
                </div>
                
                {showPresetDialog && (
                  <div className="space-y-2 p-3 border border-border/60 rounded-md bg-muted/20">
                    <Input
                      type="text"
                      placeholder="Preset name (e.g., Checkout Funnel)"
                      value={presetNameInput}
                      onChange={(e) => setPresetNameInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          handleSavePreset()
                        } else if (e.key === "Escape") {
                          setShowPresetDialog(false)
                          setPresetNameInput("")
                        }
                      }}
                      className="max-w-xs"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={handleSavePreset}
                        disabled={!presetNameInput.trim() || steps.length < 2}
                        size="sm"
                        variant="default"
                      >
                        Save
                      </Button>
                      <Button
                        onClick={() => {
                          setShowPresetDialog(false)
                          setPresetNameInput("")
                        }}
                        size="sm"
                        variant="outline"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {presets.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {presets.map((preset) => (
                      <Badge
                        key={preset.presetName}
                        variant="outline"
                        className="flex items-center gap-1 px-2 py-1 text-sm cursor-pointer hover:bg-accent"
                      >
                        <button
                          onClick={() => handleLoadPreset(preset)}
                          className="flex items-center gap-1"
                          title={`Load preset: ${preset.presetName}`}
                        >
                          <FolderOpen className="h-3 w-3" />
                          <span>{preset.presetName}</span>
                          <span className="text-xs text-muted-foreground">
                            ({preset.steps.length} steps)
                          </span>
                        </button>
                        <button
                          onClick={() => handleDeletePreset(preset.presetName)}
                          className="ml-1 p-0.5 hover:bg-destructive/20 rounded"
                          title="Delete preset"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    No presets saved. Save your current funnel steps as a preset for quick access.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

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
                  {steps.map((_, i) => (
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
                    <div className="col-span-2 text-sm font-medium text-muted-foreground text-right">% from Start</div>
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

                      {/* Percentage from start */}
                      <div className="col-span-2 text-right">
                        <div className="text-sm font-semibold">
                          <span className={
                            step.barWidth && step.barWidth >= 50 
                              ? "text-green-500" 
                              : step.barWidth && step.barWidth >= 25 
                              ? "text-yellow-500" 
                              : "text-red-500"
                          }>
                            {step.barWidth?.toFixed(1)}%
                          </span>
                          {index > 0 && step.conversionRate && (
                            <span className="text-xs text-muted-foreground ml-1 block">
                              ({step.conversionRate.toFixed(1)}% from prev)
                            </span>
                          )}
                        </div>
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
