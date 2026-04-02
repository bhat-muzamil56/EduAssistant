import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import chatRouter from "./chat.js";
import knowledgeRouter from "./knowledge.js";
import adminRouter from "./admin.js";
import authRouter from "./auth.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/chat", chatRouter);
router.use("/knowledge", knowledgeRouter);
router.use("/admin", adminRouter);
router.use("/auth", authRouter);

export default router;
