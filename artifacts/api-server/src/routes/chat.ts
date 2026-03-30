import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  chatSessionsTable,
  chatMessagesTable,
  knowledgeBaseTable,
} from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { findBestMatch } from "../lib/tfidf.js";
import {
  SendChatMessageBody,
  GetChatMessagesParams,
  SendChatMessageParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/sessions", async (req, res) => {
  const [session] = await db
    .insert(chatSessionsTable)
    .values({})
    .returning();
  res.status(201).json({
    id: session.id,
    createdAt: session.createdAt.toISOString(),
  });
});

router.get("/sessions/:sessionId/messages", async (req, res) => {
  const { sessionId } = GetChatMessagesParams.parse(req.params);
  const messages = await db
    .select()
    .from(chatMessagesTable)
    .where(eq(chatMessagesTable.sessionId, sessionId))
    .orderBy(chatMessagesTable.createdAt);
  res.json(
    messages.map((m) => ({
      id: m.id,
      sessionId: m.sessionId,
      role: m.role,
      content: m.content,
      confidence: m.confidence ?? null,
      createdAt: m.createdAt.toISOString(),
    }))
  );
});

router.post("/sessions/:sessionId/messages", async (req, res) => {
  const { sessionId } = SendChatMessageParams.parse(req.params);
  const { content } = SendChatMessageBody.parse(req.body);

  await db.insert(chatMessagesTable).values({
    sessionId,
    role: "user",
    content,
  });

  const knowledge = await db.select().from(knowledgeBaseTable);
  const match = findBestMatch(content, knowledge);

  let responseContent: string;
  let confidence: number | null = null;

  if (match && match.score > 0.05) {
    responseContent = match.item.answer;
    confidence = Math.round(match.score * 100) / 100;
  } else {
    responseContent =
      "I'm sorry, I couldn't find a relevant answer in the knowledge base for your question. Please try rephrasing or ask about a different topic from the curriculum.";
  }

  const [assistantMsg] = await db
    .insert(chatMessagesTable)
    .values({
      sessionId,
      role: "assistant",
      content: responseContent,
      confidence,
    })
    .returning();

  res.json({
    id: assistantMsg.id,
    sessionId: assistantMsg.sessionId,
    role: assistantMsg.role,
    content: assistantMsg.content,
    confidence: assistantMsg.confidence ?? null,
    createdAt: assistantMsg.createdAt.toISOString(),
  });
});

export default router;
