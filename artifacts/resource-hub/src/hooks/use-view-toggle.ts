import { useState, useCallback } from "react"

export function useViewToggle() {
  const [view, setView] = useState<"grid" | "list">("grid")

  const toggleView = useCallback(() => {
    setView(v => v === "grid" ? "list" : "grid")
  }, [])

  return { view, toggleView, setView }
}
