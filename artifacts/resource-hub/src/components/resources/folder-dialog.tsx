import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { createPortal } from "react-dom"
import { Folder } from "@/lib/types"
import { useStore } from "@/lib/store"
import { folderSchema, FolderFormValues } from "@/lib/validations"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { X, Loader2 } from "lucide-react"

interface FolderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  folder?: Folder
  parentFolderId?: number | null
}

export function FolderDialog({ open, onOpenChange, folder, parentFolderId }: FolderDialogProps) {
  const isEditing = !!folder
  const { toast } = useToast()
  const { createFolder, updateFolder } = useStore()
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<FolderFormValues>({
    resolver: zodResolver(folderSchema),
    defaultValues: {
      name: "",
      parentFolderId: parentFolderId ?? null,
    },
  })

  useEffect(() => {
    if (open) {
      if (folder) {
        form.reset({ name: folder.name, parentFolderId: folder.parentFolderId ?? null })
      } else {
        form.reset({ name: "", parentFolderId: parentFolderId ?? null })
      }
    }
  }, [open, folder, parentFolderId, form])

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [open])

  const onSubmit = async (data: FolderFormValues) => {
    setSubmitting(true)
    try {
      if (isEditing) {
        await updateFolder(folder.id, { name: data.name, parentFolderId: data.parentFolderId })
        toast({ title: "Folder updated" })
      } else {
        await createFolder({ name: data.name, parentFolderId: data.parentFolderId })
        toast({ title: "Folder created" })
      }
      onOpenChange(false)
    } catch {
      toast({ title: "Error", description: "Could not save folder. Please try again.", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-background flex flex-col"
      onKeyDown={(e) => e.key === "Escape" && onOpenChange(false)}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-border shrink-0">
        <div>
          <h2 className="text-2xl font-serif font-bold">
            {isEditing ? "Edit Folder" : "New Folder"}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isEditing ? "Rename this folder." : "Create a new folder to organize your resources."}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full"
          onClick={() => onOpenChange(false)}
        >
          <X size={20} />
        </Button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-8 py-10">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">Folder Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Movies 2024"
                        className="h-12 text-base"
                        autoFocus
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="flex-1"
                  onClick={() => onOpenChange(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" size="lg" className="flex-1" disabled={submitting}>
                  {submitting ? (
                    <><Loader2 size={16} className="mr-2 animate-spin" /> Saving…</>
                  ) : isEditing ? "Save Changes" : "Create Folder"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>,
    document.body
  )
}
