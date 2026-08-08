import { useState, useCallback } from "react"

const STORAGE_KEY = "resource_thumbnails"

function load(): Record<number, string> {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") }
  catch { return {} }
}

export function useThumbnails() {
  const [thumbnails, setThumbnailsState] = useState<Record<number, string>>(load)

  const setThumbnail = useCallback((resourceId: number, url: string) => {
    setThumbnailsState(prev => {
      const next = { ...prev, [resourceId]: url }
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  return { thumbnails, setThumbnail }
}
