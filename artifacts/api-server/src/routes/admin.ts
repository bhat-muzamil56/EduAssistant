import { Router, type IRouter } from "express";
import jwt from "jsonwebtoken";
import { db } from "@workspace/db";
import {
  knowledgeBaseTable,
  chatSessionsTable,
  chatMessagesTable,
} from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { adminAuthMiddleware, type AuthRequest } from "../middlewares/auth.js";
import { z } from "zod";

const router: IRouter = Router();

const LoginBody = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

router.post("/login", async (req, res) => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Username and password are required" });
    return;
  }

  const { username, password } = parsed.data;
  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const jwtSecret = process.env.JWT_SECRET;

  if (!adminUsername || !adminPassword || !jwtSecret) {
    res.status(500).json({ error: "Server misconfiguration" });
    return;
  }

  if (username !== adminUsername || password !== adminPassword) {
    res.status(401).json({ error: "Invalid username or password" });
    return;
  }

  const token = jwt.sign({ username }, jwtSecret, { expiresIn: "8h" });
  res.json({ token });
});

router.post("/logout", (_req, res) => {
  res.json({ message: "Logged out successfully" });
});

router.get("/knowledge", adminAuthMiddleware, async (_req: AuthRequest, res) => {
  const entries = await db.select().from(knowledgeBaseTable).orderBy(knowledgeBaseTable.createdAt);
  res.json(
    entries.map((e) => ({
      id: e.id,
      question: e.question,
      answer: e.answer,
      category: e.category ?? null,
      createdAt: e.createdAt.toISOString(),
    }))
  );
});

const KnowledgeBody = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
  category: z.string().optional().nullable(),
});

router.post("/knowledge", adminAuthMiddleware, async (req: AuthRequest, res) => {
  const parsed = KnowledgeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "question and answer are required" });
    return;
  }

  const { question, answer, category } = parsed.data;
  const [entry] = await db
    .insert(knowledgeBaseTable)
    .values({ question, answer, category: category ?? null })
    .returning();

  res.status(201).json({
    id: entry.id,
    question: entry.question,
    answer: entry.answer,
    category: entry.category ?? null,
    createdAt: entry.createdAt.toISOString(),
  });
});

router.put("/knowledge/:id", adminAuthMiddleware, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const parsed = KnowledgeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "question and answer are required" });
    return;
  }

  const { question, answer, category } = parsed.data;
  const [entry] = await db
    .update(knowledgeBaseTable)
    .set({ question, answer, category: category ?? null })
    .where(eq(knowledgeBaseTable.id, id))
    .returning();

  if (!entry) {
    res.status(404).json({ error: "Entry not found" });
    return;
  }

  res.json({
    id: entry.id,
    question: entry.question,
    answer: entry.answer,
    category: entry.category ?? null,
    createdAt: entry.createdAt.toISOString(),
  });
});

router.delete("/knowledge/:id", adminAuthMiddleware, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const [deleted] = await db
    .delete(knowledgeBaseTable)
    .where(eq(knowledgeBaseTable.id, id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Entry not found" });
    return;
  }

  res.json({ message: "Deleted successfully" });
});

router.get("/sessions", adminAuthMiddleware, async (_req: AuthRequest, res) => {
  const sessions = await db
    .select()
    .from(chatSessionsTable)
    .orderBy(chatSessionsTable.createdAt);

  const result = await Promise.all(
    sessions.map(async (session) => {
      const messages = await db
        .select()
        .from(chatMessagesTable)
        .where(eq(chatMessagesTable.sessionId, session.id))
        .orderBy(chatMessagesTable.createdAt);

      return {
        id: session.id,
        createdAt: session.createdAt.toISOString(),
        messageCount: messages.length,
        messages: messages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          confidence: m.confidence ?? null,
          createdAt: m.createdAt.toISOString(),
        })),
      };
    })
  );

  res.json(result);
});

export default router;
