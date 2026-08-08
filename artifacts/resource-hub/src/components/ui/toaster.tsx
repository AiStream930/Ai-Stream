import { Toaster as SonnerToaster } from "sonner"

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      toastOptions={{
        className: "bg-background text-foreground border-border",
        style: {
          fontFamily: "var(--font-sans)",
        }
      }}
    />
  )
}
