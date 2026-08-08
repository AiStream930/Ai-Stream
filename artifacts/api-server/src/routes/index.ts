import { Router, type IRouter } from "express";
import healthRouter from "./health";
import foldersRouter from "./folders";
import resourcesRouter from "./resources";
import statsRouter from "./stats";
import uploadRouter from "./upload";

const router: IRouter = Router();

router.use(healthRouter);
router.use(foldersRouter);
router.use(resourcesRouter);
router.use(statsRouter);
router.use(uploadRouter);

export default router;
