import { Resource } from "@/lib/types"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface VideoPlayerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  resource: Resource | null
}

export function VideoPlayerModal({ open, onOpenChange, resource }: VideoPlayerModalProps) {
  if (!resource) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl p-0 overflow-hidden bg-black border-none text-white">
        <DialogHeader className="p-4 absolute top-0 left-0 w-full z-10 bg-gradient-to-b from-black/80 to-transparent">
          <DialogTitle className="text-white font-sans">{resource.name}</DialogTitle>
        </DialogHeader>
        <div className="w-full aspect-video bg-black flex items-center justify-center pt-10">
          <video
            controls
            autoPlay
            className="w-full h-full object-contain"
            src={resource.url}
          >
            Your browser does not support the video tag.
          </video>
        </div>
      </DialogContent>
    </Dialog>
  )
}
