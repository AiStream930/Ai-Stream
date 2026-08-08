import { Link, useLocation } from "wouter"
import {
  Folder as FolderIcon,
  Film,
  Plus,
  BarChart2,
  FileBox
} from "lucide-react"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface SidebarProps {
  currentFolderId: number | null
  onCreateFolder: () => void
  width: number
}

export function Sidebar({ currentFolderId, onCreateFolder, width }: SidebarProps) {
  const [location] = useLocation()
  const { folders, getStats } = useStore()
  const stats = getStats()

  const isAllResources = location === "/"

  // Only show root-level folders (no parent) in sidebar
  const rootFolders = folders.filter(f => f.parentFolderId === null)

  return (
    <aside
      className="flex flex-col border-r bg-sidebar border-sidebar-border h-full shrink-0"
      style={{ width: `${width}px` }}
    >
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border shrink-0">
        <Link href="/" className="flex items-center gap-3 text-sidebar-foreground hover:opacity-80 transition-opacity">
          <div className="h-8 w-8 bg-primary rounded-md flex items-center justify-center text-primary-foreground shadow-sm shrink-0">
            <Film size={18} />
          </div>
          <div className="min-w-0">
            <h1 className="font-serif font-bold text-base leading-tight">Ai Stream Movie Video</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Links & files organizer</p>
          </div>
        </Link>
      </div>

      {/* New Folder button */}
      <div className="p-4 shrink-0">
        <Button className="w-full justify-start gap-2 shadow-sm font-medium" onClick={onCreateFolder}>
          <Plus size={16} /> New Folder
        </Button>
      </div>

      {/* Scrollable nav area — vertical + horizontal */}
      <div className="flex-1 overflow-auto min-h-0 px-3 pb-4">
        <div style={{ minWidth: "max-content" }} className="w-full">
          {/* All Resources */}
          <Link href="/">
            <div className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm cursor-pointer transition-colors whitespace-nowrap",
              isAllResources
                ? "bg-sidebar-accent text-sidebar-foreground font-medium"
                : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            )}>
              <FileBox size={16} className={isAllResources ? "text-primary" : ""} />
              <span>All Resources</span>
              <span className="ml-auto pl-4 text-xs opacity-60">{stats.totalResources}</span>
            </div>
          </Link>

          {/* Folders header */}
          <div className="pt-4 pb-1 px-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Folders</h3>
          </div>

          {rootFolders.length === 0 ? (
            <div className="px-3 py-4 text-sm text-muted-foreground text-center whitespace-nowrap">
              No folders yet
            </div>
          ) : (
            rootFolders.map((folder) => {
              const isActive = currentFolderId === folder.id
              return (
                <Link key={folder.id} href={`/folder/${folder.id}`}>
                  <div className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm cursor-pointer transition-colors group whitespace-nowrap",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-foreground font-medium"
                      : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  )}>
                    <FolderIcon
                      size={16}
                      className={cn("shrink-0", isActive ? "text-primary fill-primary/20" : "group-hover:text-primary transition-colors")}
                    />
                    <span>{folder.name}</span>
                    <span className="ml-auto pl-4 text-xs opacity-60 shrink-0">{folder.resourceCount}</span>
                  </div>
                </Link>
              )
            })
          )}
        </div>
      </div>

      {/* Stats footer */}
      <div className="p-4 border-t border-sidebar-border bg-sidebar shrink-0">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          <BarChart2 size={14} /> <span>Library Stats</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-background rounded-md p-2 text-center border shadow-sm">
            <div className="text-xs text-muted-foreground">Links</div>
            <div className="font-semibold">{stats.byType.link}</div>
          </div>
          <div className="bg-background rounded-md p-2 text-center border shadow-sm">
            <div className="text-xs text-muted-foreground">Files</div>
            <div className="font-semibold">{stats.byType.file}</div>
          </div>
          <div className="bg-background rounded-md p-2 text-center border shadow-sm">
            <div className="text-xs text-muted-foreground">Video</div>
            <div className="font-semibold">{stats.byType.video}</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
