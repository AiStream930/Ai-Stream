import { ReactNode, useState, useCallback } from "react"
import { Sidebar } from "./sidebar"

interface MainLayoutProps {
  children: ReactNode
  currentFolderId: number | null
  onCreateFolder: () => void
}

const MIN_W = 160
const MAX_W = 480
const DEFAULT_W = 256

function loadWidth() {
  try {
    const v = localStorage.getItem("sidebar_w")
    if (v) return Math.max(MIN_W, Math.min(MAX_W, parseInt(v)))
  } catch {}
  return DEFAULT_W
}

export function MainLayout({ children, currentFolderId, onCreateFolder }: MainLayoutProps) {
  const [width, setWidth] = useState(loadWidth)

  const onDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const startX = e.clientX
    const startW = width

    const onMove = (ev: MouseEvent) => {
      const next = Math.max(MIN_W, Math.min(MAX_W, startW + ev.clientX - startX))
      setWidth(next)
      try { localStorage.setItem("sidebar_w", String(next)) } catch {}
    }
    const onUp = () => {
      document.removeEventListener("mousemove", onMove)
      document.removeEventListener("mouseup", onUp)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }
    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"
    document.addEventListener("mousemove", onMove)
    document.addEventListener("mouseup", onUp)
  }, [width])

  return (
    <div className="flex h-[100dvh] w-full bg-background overflow-hidden">
      <Sidebar
        width={width}
        currentFolderId={currentFolderId}
        onCreateFolder={onCreateFolder}
      />

      {/* Drag handle */}
      <div
        onMouseDown={onDragStart}
        className="w-1 shrink-0 cursor-col-resize bg-sidebar-border hover:bg-primary/50 active:bg-primary transition-colors"
      />

      {/* Right panel — scrollable */}
      <main className="flex-1 min-w-0 h-full overflow-y-auto overflow-x-hidden">
        {children}
      </main>
    </div>
  )
}
