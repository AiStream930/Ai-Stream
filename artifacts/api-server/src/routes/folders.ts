import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, foldersTable, resourcesTable } from "@workspace/db";
import {
  CreateFolderBody,
  GetFolderParams,
  UpdateFolderParams,
  UpdateFolderBody,
  DeleteFolderParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/folders", async (req, res): Promise<void> => {
  const folders = await db.select().from(foldersTable).orderBy(foldersTable.createdAt);

  // Count resources per folder
  const counts = await db
    .select({
      folderId: resourcesTable.folderId,
      count: sql<number>`count(*)::int`,
    })
    .from(resourcesTable)
    .groupBy(resourcesTable.folderId);

  const countMap = new Map<number, number>();
  for (const c of counts) {
    if (c.folderId !== null) countMap.set(c.folderId, c.count);
  }

  const result = folders.map((f) => ({
    ...f,
    resourceCount: countMap.get(f.id) ?? 0,
  }));

  res.json(result);
});

router.post("/folders", async (req, res): Promise<void> => {
  const parsed = CreateFolderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [folder] = await db
    .insert(foldersTable)
    .values(parsed.data)
    .returning();

  res.status(201).json({ ...folder, resourceCount: 0 });
});

router.get("/folders/:id", async (req, res): Promise<void> => {
  const params = GetFolderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [folder] = await db
    .select()
    .from(foldersTable)
    .where(eq(foldersTable.id, params.data.id));

  if (!folder) {
    res.status(404).json({ error: "Folder not found" });
    return;
  }

  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(resourcesTable)
    .where(eq(resourcesTable.folderId, folder.id));

  res.json({ ...folder, resourceCount: countRow?.count ?? 0 });
});

router.patch("/folders/:id", async (req, res): Promise<void> => {
  const params = UpdateFolderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateFolderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [folder] = await db
    .update(foldersTable)
    .set(parsed.data)
    .where(eq(foldersTable.id, params.data.id))
    .returning();

  if (!folder) {
    res.status(404).json({ error: "Folder not found" });
    return;
  }

  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(resourcesTable)
    .where(eq(resourcesTable.folderId, folder.id));

  res.json({ ...folder, resourceCount: countRow?.count ?? 0 });
});

router.delete("/folders/:id", async (req, res): Promise<void> => {
  const params = DeleteFolderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [folder] = await db
    .delete(foldersTable)
    .where(eq(foldersTable.id, params.data.id))
    .returning();

  if (!folder) {
    res.status(404).json({ error: "Folder not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
