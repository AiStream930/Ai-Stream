import { Resource } from "@/lib/types"
import {
  FileIcon,
  LinkIcon,
  VideoIcon,
  MoreVertical,
  ExternalLink,
  Edit2,
  Trash2,
  Tv2,
  Clock,
  Camera,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatDate, formatBytes } from "@/lib/utils"

function openInStreamer(url: string) {
  const room = Math.floor(Math.random() * 1_000_000) + 1
  const target = `https://videoplayerstreamer.base44.app/?room=${room}&src=${encodeURIComponent(url)}`
  window.open(target, "_blank", "noopener,noreferrer")
}

// Resolve URL: local paths (uploaded files) get the full origin prepended
function resolveUrl(url: string) {
  if (url.startsWith("/")) return `${window.location.origin}${url}`
  return url
}

interface ResourceCardProps {
  resource: Resource
  view: "grid" | "list"
  onEdit: (resource: Resource) => void
  onDelete: (resource: Resource) => void
  onPlayLater?: (resource: Resource) => void
  onSetThumbnail?: (resource: Resource) => void
  thumbnail?: string
}

export function ResourceCard({ resource, view, onEdit, onDelete, onPlayLater, onSetThumbnail, thumbnail }: ResourceCardProps) {
  const Icon = resource.type === "video" ? VideoIcon : resource.type === "file" ? FileIcon : LinkIcon
  const resolvedUrl = resolveUrl(resource.url)

  const handleOpen = () => window.open(resolvedUrl, "_blank", "noopener,noreferrer")
  const showPlayer = resource.type === "video" || resource.type === "file"

  /* ── GRID + VIDEO ───────────────────────────────────────────────────── */
  if (view === "grid" && resource.type === "video") {
    return (
      <Card className="hover-elevate transition-all group overflow-hidden flex flex-col">

        {/* Thumbnail — only shown when one is set */}
        {thumbnail && (
          <div className="relative aspect-square overflow-hidden">
            <img src={thumbnail} alt={resource.name} className="w-full h-full object-cover" />

            {/* Always-visible name gradient overlay */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent pt-6 pb-2 px-3 pointer-events-none">
              <p className="text-white text-xs font-semibold leading-tight drop-shadow-sm">
                {resource.name}
              </p>
            </div>

            {/* Hover action overlay */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-3 pb-8">
              <Button size="sm" className="w-full gap-1" onClick={() => openInStreamer(resolvedUrl)}>
                <Tv2 size={14} /> Open in Player
              </Button>
              {onPlayLater && (
                <Button size="sm" variant="secondary" className="w-full gap-1" onClick={() => onPlayLater(resource)}>
                  <Clock size={14} /> Play Later
                </Button>
              )}
            </div>

            {/* Edit/delete menu — top-right on hover */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="secondary" className="h-7 w-7">
                    <MoreVertical size={14} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(resource)}>
                    <Edit2 size={14} className="mr-2" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDelete(resource)} className="text-destructive">
                    <Trash2 size={14} className="mr-2" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}

        {/* Info — always visible */}
        <CardContent className="p-3 flex flex-col gap-1 flex-1">
          {/* Top row: name + menu (when no thumbnail) */}
          <div className="flex items-start justify-between gap-2">
            <h4
              className="font-semibold text-sm text-foreground cursor-pointer hover:text-primary transition-colors leading-snug flex-1"
              onClick={handleOpen}
            >
              {resource.name}
            </h4>
            {!thumbnail && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="ghost" className="h-7 w-7 -mr-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreVertical size={14} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(resource)}>
                    <Edit2 size={14} className="mr-2" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDelete(resource)} className="text-destructive">
                    <Trash2 size={14} className="mr-2" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {resource.description && (
            <p className="text-xs text-muted-foreground leading-relaxed">{resource.description}</p>
          )}

          <div className="flex items-center justify-between mt-auto pt-1">
            <p className="text-[10px] text-muted-foreground">
              {formatDate(resource.createdAt)}
              {resource.size ? ` · ${formatBytes(resource.size)}` : ""}
            </p>

            {/* Camera button — always visible */}
            {onSetThumbnail && (
              <button
                title="Set thumbnail"
                onClick={() => onSetThumbnail(resource)}
                className="h-6 w-6 rounded-full bg-muted hover:bg-muted-foreground/20 text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
              >
                <Camera size={12} />
              </button>
            )}
          </div>

          {/* Action buttons when no thumbnail */}
          {!thumbnail && (
            <div className="flex gap-2 mt-1">
              <Button size="sm" className="flex-1 gap-1 h-7 text-xs" onClick={() => openInStreamer(resolvedUrl)}>
                <Tv2 size={12} /> Open in Player
              </Button>
              {onPlayLater && (
                <Button size="sm" variant="outline" className="flex-1 gap-1 h-7 text-xs" onClick={() => onPlayLater(resource)}>
                  <Clock size={12} /> Play Later
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  /* ── LIST VIEW ──────────────────────────────────────────────────────── */
  if (view === "list") {
    return (
      <Card className="hover-elevate transition-all group overflow-hidden">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-md bg-accent text-primary flex items-center justify-center shrink-0">
            <Icon size={20} />
          </div>

          <div className="flex-1 min-w-0">
            <h4
              className="font-medium text-foreground truncate cursor-pointer hover:text-primary transition-colors"
              onClick={handleOpen}
            >
              {resource.name}
            </h4>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
              <span className="capitalize">{resource.type}</span>
              <span>·</span>
              <span>{formatDate(resource.createdAt)}</span>
              {resource.size && (
                <>
                  <span>·</span>
                  <span>{formatBytes(resource.size)}</span>
                </>
              )}
            </div>
            {resource.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{resource.description}</p>
            )}
          </div>

          <div className="shrink-0 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {showPlayer && (
              <Button
                size="sm"
                variant="default"
                onClick={() => openInStreamer(resolvedUrl)}
                className="h-8 gap-1"
              >
                <Tv2 size={14} /> Open in Player
              </Button>
            )}
            {showPlayer && onPlayLater && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onPlayLater(resource)}
                className="h-8 gap-1"
              >
                <Clock size={14} /> Play Later
              </Button>
            )}
            <Button size="sm" variant="secondary" onClick={handleOpen} className="h-8 gap-1">
              <ExternalLink size={14} /> Open
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" className="h-8 w-8">
                  <MoreVertical size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(resource)}>
                  <Edit2 size={14} className="mr-2" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(resource)} className="text-destructive">
                  <Trash2 size={14} className="mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    )
  }

  /* ── GRID (non-video) ───────────────────────────────────────────────── */
  return (
    <Card className="hover-elevate transition-all group flex flex-col h-full overflow-hidden">
      <CardContent className="p-5 flex flex-col h-full gap-4">
        <div className="flex justify-between items-start">
          <div className="h-10 w-10 rounded-md bg-accent text-primary flex items-center justify-center shrink-0">
            <Icon size={20} />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 -mr-2 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(resource)}>
                <Edit2 size={14} className="mr-2" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(resource)} className="text-destructive">
                <Trash2 size={14} className="mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex-1">
          <h4
            className="font-semibold text-foreground cursor-pointer hover:text-primary transition-colors mb-1"
            onClick={handleOpen}
          >
            {resource.name}
          </h4>
          {resource.description && (
            <p className="text-sm text-muted-foreground mb-3">
              {resource.description}
            </p>
          )}
        </div>

        {showPlayer && (
          <Button
            size="sm"
            className="w-full gap-2"
            onClick={() => openInStreamer(resolvedUrl)}
          >
            <Tv2 size={15} /> Open in Player
          </Button>
        )}

        <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/50">
          <Badge variant="secondary" className="capitalize text-[10px] px-2 py-0 h-5">
            {resource.type}
          </Badge>
          <div className="text-xs text-muted-foreground">
            {formatDate(resource.createdAt)}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
