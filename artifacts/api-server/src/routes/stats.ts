import { Router, type IRouter } from "express";
import { sql } from "drizzle-orm";
import { db, foldersTable, resourcesTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/stats", async (_req, res): Promise<void> => {
  const [folderCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(foldersTable);

  const typeCounts = await db
    .select({
      type: resourcesTable.type,
      count: sql<number>`count(*)::int`,
    })
    .from(resourcesTable)
    .groupBy(resourcesTable.type);

  const byType = { link: 0, file: 0, video: 0 };
  let totalResources = 0;
  for (const row of typeCounts) {
    const t = row.type as string;
    if (t === "link" || t === "file" || t === "video") {
      byType[t as keyof typeof byType] = row.count;
      totalResources += row.count;
    }
  }

  res.json({
    totalFolders: folderCount?.count ?? 0,
    totalResources,
    byType,
  });
});

export default router;
