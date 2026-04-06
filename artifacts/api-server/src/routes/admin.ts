import { Router, type IRouter } from "express";
import jwt from "jsonwebtoken";
import { db } from "@workspace/db";
import {
  knowledgeBaseTable,
  chatSessionsTable,
  chatMessagesTable,
  usersTable,
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

router.get("/users", adminAuthMiddleware, async (_req: AuthRequest, res) => {
  const users = await db
    .select({
      id: usersTable.id,
      username: usersTable.username,
      email: usersTable.email,
      createdAt: usersTable.createdAt,
    })
    .from(usersTable)
    .orderBy(usersTable.createdAt);

  res.json(
    users.map((u) => ({
      id: u.id,
      username: u.username,
      email: u.email,
      createdAt: u.createdAt.toISOString(),
    }))
  );
});

router.get("/stats", adminAuthMiddleware, async (_req: AuthRequest, res) => {
  const [users, sessions, messages] = await Promise.all([
    db.select({ id: usersTable.id }).from(usersTable),
    db.select({ id: chatSessionsTable.id }).from(chatSessionsTable),
    db.select({ id: chatMessagesTable.id }).from(chatMessagesTable),
  ]);
  res.json({
    totalUsers: users.length,
    totalSessions: sessions.length,
    totalMessages: messages.length,
  });
});

router.get("/analytics", adminAuthMiddleware, async (_req: AuthRequest, res) => {
  const [allMessages, allSessions, allUsers, allKnowledge] = await Promise.all([
    db.select({ id: chatMessagesTable.id, role: chatMessagesTable.role, createdAt: chatMessagesTable.createdAt, sessionId: chatMessagesTable.sessionId }).from(chatMessagesTable).orderBy(chatMessagesTable.createdAt),
    db.select({ id: chatSessionsTable.id, userId: chatSessionsTable.userId, createdAt: chatSessionsTable.createdAt }).from(chatSessionsTable),
    db.select({ id: usersTable.id, username: usersTable.username, createdAt: usersTable.createdAt }).from(usersTable),
    db.select({ category: knowledgeBaseTable.category }).from(knowledgeBaseTable),
  ]);

  // Daily message counts for last 14 days
  const daily: Record<string, number> = {};
  for (let i = 13; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    daily[d.toISOString().slice(0, 10)] = 0;
  }
  allMessages.forEach(m => {
    const day = m.createdAt.toISOString().slice(0, 10);
    if (day in daily) daily[day]++;
  });
  const dailyStats = Object.entries(daily).map(([date, count]) => ({ date: date.slice(5), count }));

  // Messages per session
  const sessionMsgCount: Record<string, number> = {};
  allMessages.forEach(m => { sessionMsgCount[m.sessionId] = (sessionMsgCount[m.sessionId] ?? 0) + 1; });
  const avgMsgsPerSession = allSessions.length > 0
    ? Math.round(Object.values(sessionMsgCount).reduce((a, b) => a + b, 0) / allSessions.length * 10) / 10
    : 0;

  // User message counts
  const sessionUserMap: Record<string, string> = {};
  allSessions.forEach(s => { if (s.userId) sessionUserMap[s.id] = s.userId; });
  const userMsgCount: Record<string, number> = {};
  allMessages.filter(m => m.role === "user").forEach(m => {
    const uid = sessionUserMap[m.sessionId];
    if (uid) userMsgCount[uid] = (userMsgCount[uid] ?? 0) + 1;
  });
  const topUsers = allUsers
    .map(u => ({ username: u.username, messages: userMsgCount[u.id] ?? 0 }))
    .sort((a, b) => b.messages - a.messages)
    .slice(0, 5);

  // Knowledge base category distribution
  const catCount: Record<string, number> = {};
  allKnowledge.forEach(k => { const c = k.category ?? "General"; catCount[c] = (catCount[c] ?? 0) + 1; });
  const categories = Object.entries(catCount).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);

  // New users per day last 7 days
  const userDaily: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    userDaily[d.toISOString().slice(0, 10)] = 0;
  }
  allUsers.forEach(u => {
    const day = u.createdAt.toISOString().slice(0, 10);
    if (day in userDaily) userDaily[day]++;
  });
  const userGrowth = Object.entries(userDaily).map(([date, count]) => ({ date: date.slice(5), count }));

  res.json({ dailyStats, avgMsgsPerSession, topUsers, categories, userGrowth,
    totals: { users: allUsers.length, sessions: allSessions.length, messages: allMessages.length, knowledge: allKnowledge.length }
  });
});

router.get("/users/:userId/history", adminAuthMiddleware, async (req: AuthRequest, res) => {
  const { userId } = req.params;

  const sessions = await db
    .select()
    .from(chatSessionsTable)
    .where(eq(chatSessionsTable.userId, userId))
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
