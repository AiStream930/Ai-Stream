import { Router, type IRouter } from "express";
import { eq, ilike, and, desc } from "drizzle-orm";
import { db, resourcesTable } from "@workspace/db";
import {
  ListResourcesQueryParams,
  ListRecentResourcesQueryParams,
  GetResourceParams,
  UpdateResourceParams,
  DeleteResourceParams,
} from "@workspace/api-zod";
import { z } from "zod";

const router: IRouter = Router();

// Body schema that includes all fields including contentType
const CreateResourceBody = z.object({
  name: z.string().min(1),
  type: z.enum(["link", "file", "video"]),
  url: z.string().min(1),
  folderId: z.number().nullable().optional(),
  description: z.string().nullable().optional(),
  contentType: z.string().nullable().optional(),
  mimeType: z.string().nullable().optional(),
  size: z.number().nullable().optional(),
});

const UpdateResourceBody = z.object({
  name: z.string().min(1).optional(),
  type: z.enum(["link", "file", "video"]).optional(),
  url: z.string().min(1).optional(),
  folderId: z.number().nullable().optional(),
  description: z.string().nullable().optional(),
  contentType: z.string().nullable().optional(),
  mimeType: z.string().nullable().optional(),
  size: z.number().nullable().optional(),
});

router.get("/resources/recent", async (req, res): Promise<void> => {
  const query = ListRecentResourcesQueryParams.safeParse(req.query);
  const limit = query.success ? (query.data.limit ?? 10) : 10;

  const resources = await db
    .select()
    .from(resourcesTable)
    .orderBy(desc(resourcesTable.createdAt))
    .limit(limit);

  res.json(resources);
});

router.get("/resources", async (req, res): Promise<void> => {
  const query = ListResourcesQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { folderId, type, search } = query.data;
  const conditions = [];

  if (folderId !== undefined && folderId !== null) {
    conditions.push(eq(resourcesTable.folderId, folderId));
  }
  if (type) {
    conditions.push(eq(resourcesTable.type, type));
  }
  if (search) {
    conditions.push(ilike(resourcesTable.name, `%${search}%`));
  }

  const resources = await db
    .select()
    .from(resourcesTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(resourcesTable.createdAt));

  res.json(resources);
});

router.post("/resources", async (req, res): Promise<void> => {
  const parsed = CreateResourceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [resource] = await db
    .insert(resourcesTable)
    .values(parsed.data)
    .returning();

  res.status(201).json(resource);
});

router.get("/resources/:id", async (req, res): Promise<void> => {
  const params = GetResourceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [resource] = await db
    .select()
    .from(resourcesTable)
    .where(eq(resourcesTable.id, params.data.id));

  if (!resource) {
    res.status(404).json({ error: "Resource not found" });
    return;
  }

  res.json(resource);
});

router.patch("/resources/:id", async (req, res): Promise<void> => {
  const params = UpdateResourceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateResourceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [resource] = await db
    .update(resourcesTable)
    .set(parsed.data)
    .where(eq(resourcesTable.id, params.data.id))
    .returning();

  if (!resource) {
    res.status(404).json({ error: "Resource not found" });
    return;
  }

  res.json(resource);
});

router.delete("/resources/:id", async (req, res): Promise<void> => {
  const params = DeleteResourceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [resource] = await db
    .delete(resourcesTable)
    .where(eq(resourcesTable.id, params.data.id))
    .returning();

  if (!resource) {
    res.status(404).json({ error: "Resource not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
