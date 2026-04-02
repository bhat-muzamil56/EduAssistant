import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  chatSessionsTable,
  chatMessagesTable,
  knowledgeBaseTable,
} from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { findTopMatches } from "../lib/tfidf.js";
import { openai } from "@workspace/integrations-openai-ai-server";
import {
  SendChatMessageBody,
  GetChatMessagesParams,
  SendChatMessageParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

const SYSTEM_PROMPT = `You are EduAssistant, an AI-powered education assistant specializing in Computer Science and Artificial Intelligence. Your role is to help students learn clearly, confidently, and step by step.

## How you must always respond:

1. **Always give a helpful answer.** Never say "I don't have enough context" or ask the student to rephrase. If the question is broad (e.g. "algorithm"), cover the topic comprehensively.
2. **Structure your answers clearly** using numbered steps, bullet points, or sections where appropriate so the student can follow easily.
3. **Use the knowledge base context** provided below as your primary source of truth. You may also draw on your broader CS/AI knowledge to fill gaps or provide examples.
4. **Be educational and thorough.** Explain concepts from the ground up — define terms, give examples, and relate ideas where helpful.
5. **Keep a friendly, encouraging tone.** You are a patient tutor, not a search engine.

## Response format:
- For concept questions: Define → Explain → Give examples → Summarize
- For broad topics (e.g. "algorithms", "machine learning"): Break into sub-topics with numbered sections
- For how-to questions: Numbered step-by-step
- Always end with a brief encouraging sentence or offer to go deeper on any point`;

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
  const topMatches = findTopMatches(content, knowledge, 8);

  const topScore = topMatches[0]?.score ?? 0;
  const confidence = Math.round(topScore * 100) / 100;

  const previousMessages = await db
    .select()
    .from(chatMessagesTable)
    .where(eq(chatMessagesTable.sessionId, sessionId))
    .orderBy(chatMessagesTable.createdAt);

  const chatHistory = previousMessages.slice(-8).map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  let fullSystemPrompt = SYSTEM_PROMPT;

  if (topMatches.length > 0) {
    const contextEntries = topMatches
      .map(
        (m, i) =>
          `[${i + 1}] Topic: ${m.item.category ?? "General"}\n    Q: ${m.item.question}\n    A: ${m.item.answer}`
      )
      .join("\n\n");

    fullSystemPrompt += `\n\n## Relevant Knowledge Base Entries (use these as your primary source):\n\n${contextEntries}`;
  }

  const completion = await openai.chat.completions.create({
    model: "gpt-5.2",
    max_completion_tokens: 8192,
    messages: [
      { role: "system", content: fullSystemPrompt },
      ...chatHistory,
      { role: "user", content },
    ],
  });

  const responseContent =
    completion.choices[0]?.message?.content ??
    "I'm sorry, I couldn't generate a response. Please try again.";

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
