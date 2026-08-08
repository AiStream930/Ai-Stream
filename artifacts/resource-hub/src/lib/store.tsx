import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react"
import { Folder, Resource, ResourceType } from "./types"

const API = "/api"

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: options?.body instanceof FormData
      ? undefined
      : { "Content-Type": "application/json" },
    ...options,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`API ${res.status}: ${text}`)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

interface StoreContextValue {
  folders: Folder[]
  resources: Resource[]
  loading: boolean

  createFolder: (data: { name: string; parentFolderId?: number | null }) => Promise<Folder>
  updateFolder: (id: number, data: { name?: string; parentFolderId?: number | null }) => Promise<Folder>
  deleteFolder: (id: number) => Promise<void>

  createResource: (data: {
    name: string
    type: ResourceType
    url: string
    folderId?: number | null
    description?: string | null
    contentType?: string | null
    mimeType?: string | null
    size?: number | null
  }) => Promise<Resource>
  updateResource: (id: number, data: Partial<Omit<Resource, "id" | "createdAt" | "updatedAt">>) => Promise<Resource>
  deleteResource: (id: number) => Promise<void>

  getStats: () => { totalFolders: number; totalResources: number; byType: { link: number; file: number; video: number } }
}

const StoreContext = createContext<StoreContextValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [rawFolders, setRawFolders] = useState<Omit<Folder, "resourceCount">[]>([])
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)

  // Derive folders with resourceCount from local state
  const folders: Folder[] = rawFolders.map(f => ({
    ...f,
    resourceCount: resources.filter(r => r.folderId === f.id).length,
  }))

  useEffect(() => {
    async function load() {
      try {
        const [foldersData, resourcesData] = await Promise.all([
          apiFetch<Omit<Folder, "resourceCount">[]>("/folders"),
          apiFetch<Resource[]>("/resources"),
        ])
        setRawFolders(foldersData)
        setResources(resourcesData)
      } catch (e) {
        console.error("Failed to load from server:", e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const createFolder = useCallback(async (data: { name: string; parentFolderId?: number | null }) => {
    const folder = await apiFetch<Omit<Folder, "resourceCount">>("/folders", {
      method: "POST",
      body: JSON.stringify({ name: data.name, parentFolderId: data.parentFolderId ?? null }),
    })
    setRawFolders(prev => [...prev, folder])
    return { ...folder, resourceCount: 0 }
  }, [])

  const updateFolder = useCallback(async (id: number, data: { name?: string; parentFolderId?: number | null }) => {
    const folder = await apiFetch<Omit<Folder, "resourceCount">>(`/folders/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
    setRawFolders(prev => prev.map(f => f.id === id ? folder : f))
    const count = resources.filter(r => r.folderId === id).length
    return { ...folder, resourceCount: count }
  }, [resources])

  const deleteFolder = useCallback(async (id: number) => {
    await apiFetch(`/folders/${id}`, { method: "DELETE" })
    setRawFolders(prev => prev.filter(f => f.id !== id))
    setResources(prev => prev.map(r => r.folderId === id ? { ...r, folderId: null } : r))
  }, [])

  const createResource = useCallback(async (data: {
    name: string
    type: ResourceType
    url: string
    folderId?: number | null
    description?: string | null
    contentType?: string | null
    mimeType?: string | null
    size?: number | null
  }) => {
    const resource = await apiFetch<Resource>("/resources", {
      method: "POST",
      body: JSON.stringify(data),
    })
    setResources(prev => [resource, ...prev])
    return resource
  }, [])

  const updateResource = useCallback(async (id: number, data: Partial<Omit<Resource, "id" | "createdAt" | "updatedAt">>) => {
    const resource = await apiFetch<Resource>(`/resources/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
    setResources(prev => prev.map(r => r.id === id ? resource : r))
    return resource
  }, [])

  const deleteResource = useCallback(async (id: number) => {
    await apiFetch(`/resources/${id}`, { method: "DELETE" })
    setResources(prev => prev.filter(r => r.id !== id))
  }, [])

  const getStats = useCallback(() => {
    const byType = { link: 0, file: 0, video: 0 }
    for (const r of resources) {
      if (r.type in byType) byType[r.type as keyof typeof byType]++
    }
    return { totalFolders: rawFolders.length, totalResources: resources.length, byType }
  }, [rawFolders.length, resources])

  return (
    <StoreContext.Provider value={{
      folders, resources, loading,
      createFolder, updateFolder, deleteFolder,
      createResource, updateResource, deleteResource,
      getStats,
    }}>
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error("useStore must be used within StoreProvider")
  return ctx
}
