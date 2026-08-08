import { useEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { createPortal } from "react-dom"
import { Resource } from "@/lib/types"
import { useStore } from "@/lib/store"
import { resourceSchema, ResourceFormValues } from "@/lib/validations"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { X, UploadCloud, FileCheck, Loader2 } from "lucide-react"

interface ResourceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  resource?: Resource
  folderId?: number | null
}

export function ResourceDialog({ open, onOpenChange, resource, folderId }: ResourceDialogProps) {
  const isEditing = !!resource
  const { toast } = useToast()
  const { folders, createResource, updateResource } = useStore()
  const overlayRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [uploading, setUploading] = useState(false)
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<ResourceFormValues>({
    resolver: zodResolver(resourceSchema),
    defaultValues: {
      name: "",
      type: "video",
      url: "",
      description: "",
      contentType: null,
      folderId: folderId ?? null,
    },
  })

  const watchedType = form.watch("type")

  useEffect(() => {
    if (open) {
      setUploadedFileName(null)
      if (resource) {
        form.reset({
          name: resource.name,
          type: resource.type,
          url: resource.url,
          description: resource.description ?? "",
          contentType: resource.contentType ?? null,
          folderId: resource.folderId ?? null,
        })
        if (resource.mimeType || resource.size) {
          // Already has upload metadata
        }
      } else {
        form.reset({
          name: "",
          type: "video",
          url: "",
          description: "",
          contentType: null,
          folderId: folderId ?? null,
        })
      }
    }
  }, [open, resource, folderId, form])

  // Reset contentType when type changes
  useEffect(() => {
    form.setValue("contentType", null)
  }, [watchedType, form])

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [open])

  // Auto-prepend https:// for link type
  const handleUrlBlur = () => {
    if (watchedType === "link") {
      const val = form.getValues("url").trim()
      if (val && !val.startsWith("http://") && !val.startsWith("https://") && !val.startsWith("//")) {
        form.setValue("url", `https://${val}`, { shouldValidate: true })
      }
    }
  }

  // File upload handler
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/upload", { method: "POST", body: formData })
      if (!res.ok) throw new Error("Upload failed")

      const data = await res.json() as { url: string; mimeType: string; size: number; filename: string }
      form.setValue("url", data.url, { shouldValidate: true })
      setUploadedFileName(file.name)

      // Auto-fill name if empty
      if (!form.getValues("name")) {
        form.setValue("name", file.name.replace(/\.[^.]+$/, ""), { shouldValidate: true })
      }

      toast({ title: "File uploaded", description: file.name })
    } catch {
      toast({ title: "Upload failed", description: "Please try again or enter the URL manually.", variant: "destructive" })
    } finally {
      setUploading(false)
      // Reset input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const onSubmit = async (data: ResourceFormValues) => {
    setSubmitting(true)
    try {
      if (isEditing) {
        await updateResource(resource.id, data)
        toast({ title: "Resource updated" })
      } else {
        await createResource(data)
        toast({ title: "Resource added" })
      }
      onOpenChange(false)
    } catch {
      toast({ title: "Error", description: "Could not save resource. Please try again.", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  const showUploader = watchedType === "file" || watchedType === "video"

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 bg-background flex flex-col"
      onKeyDown={(e) => e.key === "Escape" && onOpenChange(false)}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-border shrink-0">
        <div>
          <h2 className="text-2xl font-serif font-bold">
            {isEditing ? "Edit Resource" : "Add Resource"}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isEditing ? "Update the resource details below." : "Fill in the details to add a new resource to your library."}
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

      {/* Form body */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-8 py-10">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

              {/* Type selector */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">Type</FormLabel>
                    <div className="grid grid-cols-3 gap-3 mt-2">
                      {(["link", "file", "video"] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => field.onChange(t)}
                          className={`rounded-xl border-2 py-4 text-sm font-semibold capitalize transition-all ${
                            field.value === t
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-accent/30 text-muted-foreground hover:border-primary/40"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* File / Video upload area */}
              {showUploader && (
                <div className="space-y-2">
                  <p className="text-base font-semibold">Upload File</p>
                  <div
                    className="border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center gap-3 cursor-pointer hover:border-primary/50 hover:bg-accent/20 transition-all"
                    onClick={() => !uploading && fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept={watchedType === "video" ? "video/*" : "*/*"}
                      onChange={handleFileSelect}
                    />
                    {uploading ? (
                      <>
                        <Loader2 size={28} className="text-primary animate-spin" />
                        <p className="text-sm text-muted-foreground">Uploading…</p>
                      </>
                    ) : uploadedFileName ? (
                      <>
                        <FileCheck size={28} className="text-primary" />
                        <p className="text-sm font-medium text-foreground truncate max-w-full">{uploadedFileName}</p>
                        <p className="text-xs text-muted-foreground">Click to replace</p>
                      </>
                    ) : (
                      <>
                        <UploadCloud size={28} className="text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Click to select {watchedType === "video" ? "a video file" : "a file"}
                        </p>
                        <p className="text-xs text-muted-foreground">Up to 500 MB</p>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground text-center">— or enter a URL below —</p>
                </div>
              )}

              {/* Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Golden Hour Timelapse"
                        className="h-12 text-base"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* URL */}
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">
                      {watchedType === "link" ? "URL / Link" : "URL or Uploaded Path"}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={watchedType === "link" ? "example.com or https://..." : "https://... or upload above"}
                        className="h-12 text-base"
                        {...field}
                        onBlur={(e) => {
                          field.onBlur()
                          handleUrlBlur()
                          e.preventDefault()
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />


              {/* Folder */}
              <FormField
                control={form.control}
                name="folderId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">Folder (Optional)</FormLabel>
                    <Select
                      onValueChange={(val) => field.onChange(val === "none" ? null : parseInt(val))}
                      value={field.value?.toString() || "none"}
                    >
                      <FormControl>
                        <SelectTrigger className="h-12 text-base">
                          <SelectValue placeholder="No folder" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {folders.map((f) => (
                          <SelectItem key={f.id} value={f.id.toString()}>
                            {f.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add a note or summary about this resource…"
                        className="text-base min-h-[100px] resize-none"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Actions */}
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
                <Button type="submit" size="lg" className="flex-1" disabled={submitting || uploading}>
                  {submitting ? (
                    <><Loader2 size={16} className="mr-2 animate-spin" /> Saving…</>
                  ) : isEditing ? "Save Changes" : "Add Resource"}
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
