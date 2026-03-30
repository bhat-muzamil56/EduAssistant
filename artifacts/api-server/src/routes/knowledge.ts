import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { knowledgeBaseTable } from "@workspace/db/schema";

const router: IRouter = Router();

router.get("/", async (_req, res) => {
  const entries = await db.select().from(knowledgeBaseTable);
  res.json(
    entries.map((e) => ({
      id: e.id,
      question: e.question,
      answer: e.answer,
      category: e.category ?? null,
    }))
  );
});

export default router;
