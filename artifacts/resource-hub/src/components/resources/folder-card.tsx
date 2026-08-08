import { Folder } from "@/lib/types"
import { Folder as FolderIcon, MoreVertical, Edit2, Trash2 } from "lucide-react"
import { Link } from "wouter"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface FolderCardProps {
  folder: Folder
  onEdit: (folder: Folder) => void
  onDelete: (folder: Folder) => void
}

export function FolderCard({ folder, onEdit, onDelete }: FolderCardProps) {
  return (
    <Card className="hover-elevate transition-all group border-primary/20 bg-accent/30">
      <CardContent className="p-4 flex items-center justify-between">
        <Link href={`/folder/${folder.id}`} className="flex items-center gap-3 flex-1 min-w-0">
          <div className="h-10 w-10 rounded-md bg-background border text-primary flex items-center justify-center shrink-0 shadow-sm">
            <FolderIcon size={20} className="fill-primary/20" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-foreground truncate hover:text-primary transition-colors">
              {folder.name}
            </h4>
            <p className="text-xs text-muted-foreground">
              {folder.resourceCount} {folder.resourceCount === 1 ? "item" : "items"}
            </p>
          </div>
        </Link>

        <div className="shrink-0 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8">
                <MoreVertical size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(folder)}>
                <Edit2 size={14} className="mr-2" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(folder)} className="text-destructive">
                <Trash2 size={14} className="mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  )
}
