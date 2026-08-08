import { useState, useRef } from "react"
import { useParams, Link } from "wouter"
import { Resource, Folder } from "@/lib/types"
import { useStore } from "@/lib/store"
import {
  Search,
  LayoutGrid,
  List,
  Plus,
  ChevronRight,
  FolderOpen,
  Lock,
  Clock,
  X,
  Tv2,
} from "lucide-react"

import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ResourceCard } from "@/components/resources/resource-card"
import { FolderCard } from "@/components/resources/folder-card"
import { ResourceDialog } from "@/components/resources/resource-dialog"
import { FolderDialog } from "@/components/resources/folder-dialog"
import { useViewToggle } from "@/hooks/use-view-toggle"
import { useThumbnails } from "@/hooks/use-thumbnails"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

type FilterType = "all" | "link" | "file" | "video"

type PendingAction =
  | { type: "editResource"; resource: Resource }
  | { type: "deleteResource"; resource: Resource }
  | { type: "editFolder"; folder: Folder }
  | { type: "deleteFolder"; folder: Folder }
  | { type: "setThumbnail"; resource: Resource }

const ADMIN_PASSWORD = "928928928"

export default function Hub() {
  const params = useParams()
  const folderId = params.id ? parseInt(params.id) : null
  const { toast } = useToast()
  const { folders, resources, deleteResource, deleteFolder } = useStore()

  // State
  const [search, setSearch] = useState("")
  const [filterType, setFilterType] = useState<FilterType>("all")
  const { view, toggleView } = useViewToggle()

  // Dialog state
  const [isResourceDialogOpen, setIsResourceDialogOpen] = useState(false)
  const [resourceToEdit, setResourceToEdit] = useState<Resource | undefined>()

  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false)
  const [folderToEdit, setFolderToEdit] = useState<Folder | undefined>()

  const [resourceToDelete, setResourceToDelete] = useState<Resource | null>(null)
  const [folderToDelete, setFolderToDelete] = useState<Folder | null>(null)

  // Thumbnails — stored in localStorage, keyed by resource id
  const { thumbnails, setThumbnail } = useThumbnails()
  const thumbnailInputRef = useRef<HTMLInputElement>(null)
  const thumbnailTargetRef = useRef<Resource | null>(null)

  const handleThumbnailFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    const resource = thumbnailTargetRef.current
    e.target.value = ""
    if (!file || !resource) return
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/upload", { method: "POST", body: formData })
      if (!res.ok) throw new Error("Upload failed")
      const data = await res.json() as { url: string }
      const fullUrl = data.url.startsWith("/") ? `${window.location.origin}${data.url}` : data.url
      setThumbnail(resource.id, fullUrl)
      toast({ title: "Thumbnail set", description: resource.name })
    } catch {
      toast({ title: "Upload failed", description: "Could not set thumbnail.", variant: "destructive" })
    }
  }

  // Play Later queue (temporary — in-memory only)
  const [playLaterList, setPlayLaterList] = useState<Resource[]>([])

  const handlePlayLater = (resource: Resource) => {
    setPlayLaterList(prev =>
      prev.find(r => r.id === resource.id) ? prev : [...prev, resource]
    )
    toast({ title: "Added to Play Later", description: resource.name })
  }

  const removeFromPlayLater = (id: number) =>
    setPlayLaterList(prev => prev.filter(r => r.id !== id))

  const openInStreamer = (url: string) => {
    const resolvedUrl = url.startsWith("/") ? `${window.location.origin}${url}` : url
    const room = Math.floor(Math.random() * 1_000_000) + 1
    window.open(
      `https://videoplayerstreamer.base44.app/?room=${room}&src=${encodeURIComponent(resolvedUrl)}`,
      "_blank",
      "noopener,noreferrer"
    )
  }

  // Password gate state
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  const [passwordInput, setPasswordInput] = useState("")
  const [passwordError, setPasswordError] = useState(false)

  // Current folder info
  const currentFolder = folderId ? folders.find(f => f.id === folderId) : null

  // Sub-folders
  const subFolders = folderId
    ? folders.filter(f => f.parentFolderId === folderId)
    : folders.filter(f => f.parentFolderId === null)

  const filteredSubFolders = search
    ? subFolders.filter(f => f.name.toLowerCase().includes(search.toLowerCase()))
    : subFolders

  // Resources filtered
  const filteredResources = resources.filter(r => {
    if (folderId !== null && r.folderId !== folderId) return false
    if (filterType !== "all" && r.type !== filterType) return false
    if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  // Password gate: intercept edit/delete and ask for password first
  const requestWithPassword = (action: PendingAction) => {
    setPendingAction(action)
    setPasswordInput("")
    setPasswordError(false)
  }

  const handlePasswordSubmit = () => {
    if (passwordInput !== ADMIN_PASSWORD) {
      setPasswordError(true)
      return
    }
    const action = pendingAction
    setPendingAction(null)
    setPasswordInput("")
    setPasswordError(false)

    if (!action) return
    if (action.type === "editResource") {
      setResourceToEdit(action.resource)
      setIsResourceDialogOpen(true)
    } else if (action.type === "deleteResource") {
      setResourceToDelete(action.resource)
    } else if (action.type === "editFolder") {
      setFolderToEdit(action.folder)
      setIsFolderDialogOpen(true)
    } else if (action.type === "deleteFolder") {
      setFolderToDelete(action.folder)
    } else if (action.type === "setThumbnail") {
      thumbnailTargetRef.current = action.resource
      thumbnailInputRef.current?.click()
    }
  }

  const handlePasswordCancel = () => {
    setPendingAction(null)
    setPasswordInput("")
    setPasswordError(false)
  }

  // Handlers — all edit/delete go through password gate
  const handleCreateResource = () => {
    setResourceToEdit(undefined)
    setIsResourceDialogOpen(true)
  }

  const handleEditResource = (resource: Resource) => {
    requestWithPassword({ type: "editResource", resource })
  }

  const handleCreateFolder = () => {
    setFolderToEdit(undefined)
    setIsFolderDialogOpen(true)
  }

  const handleEditFolder = (folder: Folder) => {
    requestWithPassword({ type: "editFolder", folder })
  }

  const confirmDeleteResource = () => {
    if (!resourceToDelete) return
    deleteResource(resourceToDelete.id)
    toast({ title: "Resource deleted" })
    setResourceToDelete(null)
  }

  const confirmDeleteFolder = () => {
    if (!folderToDelete) return
    deleteFolder(folderToDelete.id)
    toast({ title: "Folder deleted" })
    setFolderToDelete(null)
  }

  return (
    <MainLayout currentFolderId={folderId} onCreateFolder={handleCreateFolder}>
      {/* Header */}
      <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-background/95 backdrop-blur shrink-0 z-10 sticky top-0">
        <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
          <Link href="/" className="hover:text-foreground transition-colors">Library</Link>
          {folderId && currentFolder && (
            <>
              <ChevronRight size={14} />
              <span className="text-foreground">{currentFolder.name}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="relative w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search library..."
              className="pl-9 h-9 bg-accent/50 border-transparent focus-visible:bg-background focus-visible:border-primary"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button onClick={handleCreateResource} className="h-9 shadow-sm" size="sm">
            <Plus size={16} className="mr-1" /> Add Resource
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <ScrollArea className="flex-1 p-6">
        <div className="max-w-6xl mx-auto space-y-8 pb-12">

          {/* Controls */}
          <div className="flex items-center justify-between">
            <Tabs
              value={filterType}
              onValueChange={(v) => setFilterType(v as FilterType)}
              className="w-[400px]"
            >
              <TabsList className="bg-accent/50 p-1">
                <TabsTrigger value="all" className="rounded-sm">All</TabsTrigger>
                <TabsTrigger value="link" className="rounded-sm">Links</TabsTrigger>
                <TabsTrigger value="file" className="rounded-sm">Files</TabsTrigger>
                <TabsTrigger value="video" className="rounded-sm">Videos</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-1 bg-accent/50 p-1 rounded-md border border-transparent">
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 rounded-sm ${view === "grid" ? "bg-background shadow-sm" : ""}`}
                onClick={() => view !== "grid" && toggleView()}
              >
                <LayoutGrid size={16} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 rounded-sm ${view === "list" ? "bg-background shadow-sm" : ""}`}
                onClick={() => view !== "list" && toggleView()}
              >
                <List size={16} />
              </Button>
            </div>
          </div>

          {/* Sub Folders */}
          {filteredSubFolders.length > 0 && filterType === "all" && (
            <section>
              <h3 className="font-serif text-lg font-semibold mb-4 text-foreground">Folders</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredSubFolders.map(f => (
                  <FolderCard
                    key={f.id}
                    folder={f}
                    onEdit={handleEditFolder}
                    onDelete={(folder) => requestWithPassword({ type: "deleteFolder", folder })}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Resources */}
          <section>
            <h3 className="font-serif text-lg font-semibold mb-4 text-foreground flex items-center gap-2">
              Resources
              {filteredResources.length > 0 && (
                <span className="text-muted-foreground text-sm font-sans font-normal ml-2">
                  ({filteredResources.length})
                </span>
              )}
            </h3>

            {filteredResources.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center border-2 border-dashed border-border rounded-xl bg-accent/20">
                <div className="h-12 w-12 rounded-full bg-accent text-muted-foreground flex items-center justify-center mb-4">
                  <FolderOpen size={24} />
                </div>
                <h3 className="font-serif text-xl font-medium mb-2">No resources found</h3>
                <p className="text-muted-foreground max-w-sm mb-6">
                  {search
                    ? "Try a different search term or clear the filter."
                    : "Start adding links, files, and videos to organize your collection."}
                </p>
                {!search && (
                  <Button onClick={handleCreateResource}>
                    <Plus size={16} className="mr-2" /> Add First Resource
                  </Button>
                )}
              </div>
            ) : (
              <div className={view === "grid"
                ? "grid grid-cols-2 md:grid-cols-4 gap-4"
                : "space-y-2"
              }>
                {filteredResources.map(resource => (
                  <ResourceCard
                    key={resource.id}
                    resource={resource}
                    view={view}
                    onEdit={handleEditResource}
                    onDelete={(r) => requestWithPassword({ type: "deleteResource", resource: r })}
                    onPlayLater={handlePlayLater}
                    onSetThumbnail={(r) => requestWithPassword({ type: "setThumbnail", resource: r })}
                    thumbnail={thumbnails[resource.id]}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </ScrollArea>

      {/* Play Later Queue — floating panel */}
      {playLaterList.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50 w-80 bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-accent/40">
            <div className="flex items-center gap-2 font-semibold text-sm">
              <Clock size={15} className="text-primary" />
              Play Later
              <span className="ml-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full px-1.5 py-0.5">
                {playLaterList.length}
              </span>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={() => setPlayLaterList([])}
            >
              <X size={13} />
            </Button>
          </div>
          <div className="max-h-64 overflow-y-auto divide-y divide-border">
            {playLaterList.map(r => (
              <div key={r.id} className="flex items-center gap-3 px-4 py-2.5 group">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{r.name}</p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    title="Open in Player"
                    onClick={() => openInStreamer(r.url)}
                  >
                    <Tv2 size={13} />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 text-muted-foreground"
                    title="Remove"
                    onClick={() => removeFromPlayLater(r.id)}
                  >
                    <X size={13} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dialogs */}
      <ResourceDialog
        open={isResourceDialogOpen}
        onOpenChange={setIsResourceDialogOpen}
        resource={resourceToEdit}
        folderId={folderId}
      />

      <FolderDialog
        open={isFolderDialogOpen}
        onOpenChange={setIsFolderDialogOpen}
        folder={folderToEdit}
        parentFolderId={folderId}
      />

      {/* Password Gate Dialog */}
      {/* Hidden file input for thumbnail upload */}
      <input ref={thumbnailInputRef} type="file" accept="image/*" className="hidden" onChange={handleThumbnailFileChange} />

      <Dialog open={!!pendingAction} onOpenChange={(open) => !open && handlePasswordCancel()}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock size={18} /> Enter Password
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              This action requires the admin password.
            </p>
            <Input
              type="password"
              placeholder="Password"
              value={passwordInput}
              onChange={(e) => {
                setPasswordInput(e.target.value)
                setPasswordError(false)
              }}
              onKeyDown={(e) => e.key === "Enter" && handlePasswordSubmit()}
              className={passwordError ? "border-destructive focus-visible:ring-destructive" : ""}
              autoFocus
            />
            {passwordError && (
              <p className="text-sm text-destructive">Incorrect password. Please try again.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handlePasswordCancel}>Cancel</Button>
            <Button onClick={handlePasswordSubmit}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Resource Confirmation */}
      <AlertDialog open={!!resourceToDelete} onOpenChange={(open) => !open && setResourceToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Resource</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{resourceToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteResource}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Folder Confirmation */}
      <AlertDialog open={!!folderToDelete} onOpenChange={(open) => !open && setFolderToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Folder</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{folderToDelete?.name}"? Resources inside will be moved to the root. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteFolder}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  )
}
