export type ResourceType = "link" | "file" | "video"

export interface Folder {
  id: number
  name: string
  parentFolderId: number | null
  resourceCount: number
  createdAt: string
}

export interface Resource {
  id: number
  name: string
  type: ResourceType
  url: string
  folderId: number | null
  description: string | null
  contentType: string | null
  mimeType: string | null
  size: number | null
  createdAt: string
  updatedAt: string
}

export interface Stats {
  totalFolders: number
  totalResources: number
  byType: { link: number; file: number; video: number }
}
