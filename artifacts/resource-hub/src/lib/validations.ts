import { z } from "zod"

export const CONTENT_TYPES_VIDEO = [
  { value: "movie", label: "Movie" },
  { value: "tv-show", label: "TV Show" },
  { value: "documentary", label: "Documentary" },
  { value: "series", label: "Series" },
  { value: "episode", label: "Episode" },
  { value: "short-film", label: "Short Film" },
  { value: "animation", label: "Animation" },
  { value: "live-stream", label: "Live Stream" },
  { value: "music-video", label: "Music Video" },
  { value: "clip", label: "Clip" },
  { value: "podcast", label: "Podcast" },
  { value: "tutorial", label: "Tutorial" },
  { value: "other", label: "Other" },
]

export const CONTENT_TYPES_FILE = [
  { value: "document", label: "Document" },
  { value: "spreadsheet", label: "Spreadsheet" },
  { value: "presentation", label: "Presentation" },
  { value: "image", label: "Image" },
  { value: "audio", label: "Audio" },
  { value: "archive", label: "Archive" },
  { value: "ebook", label: "E-Book" },
  { value: "subtitle", label: "Subtitle" },
  { value: "other", label: "Other" },
]

export const CONTENT_TYPES_LINK = [
  { value: "article", label: "Article" },
  { value: "news", label: "News" },
  { value: "tutorial", label: "Tutorial" },
  { value: "reference", label: "Reference" },
  { value: "social", label: "Social Media" },
  { value: "tool", label: "Tool / App" },
  { value: "forum", label: "Forum / Community" },
  { value: "wiki", label: "Wiki / Docs" },
  { value: "shop", label: "Shop / Store" },
  { value: "other", label: "Other" },
]

export function getContentTypes(type: "link" | "file" | "video") {
  if (type === "video") return CONTENT_TYPES_VIDEO
  if (type === "file") return CONTENT_TYPES_FILE
  return CONTENT_TYPES_LINK
}

export const resourceSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["link", "file", "video"]),
  url: z.string().min(1, "URL is required"),
  description: z.string().optional().nullable(),
  contentType: z.string().optional().nullable(),
  folderId: z.coerce.number().optional().nullable(),
})

export type ResourceFormValues = z.infer<typeof resourceSchema>

export const folderSchema = z.object({
  name: z.string().min(1, "Folder name is required"),
  parentFolderId: z.coerce.number().optional().nullable(),
})

export type FolderFormValues = z.infer<typeof folderSchema>
