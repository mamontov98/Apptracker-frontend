import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { cn } from "@/lib/utils"

export function ErrorBanner({ 
  title = "Something went wrong", 
  message,
  className 
}: { 
  title?: string
  message: string
  className?: string
}) {
  return (
    <Alert variant="destructive" className={cn("border-destructive/40 bg-destructive/10", className)}>
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="mt-1">{message}</AlertDescription>
    </Alert>
  )
}


