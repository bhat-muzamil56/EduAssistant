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
  const topMatches = findTopMatches(content, knowledge, 5);

  const topScore = topMatches[0]?.score ?? 0;
  const confidence = Math.round(topScore * 100) / 100;

  let responseContent: string;

  if (topMatches.length > 0 && topScore > 0.02) {
    const contextEntries = topMatches
      .map(
        (m, i) =>
          `[${i + 1}] Q: ${m.item.question}\n    A: ${m.item.answer}`
      )
      .join("\n\n");

    const systemPrompt = `You are an AI-powered education assistant specializing in Computer Science and Artificial Intelligence. You help students understand concepts clearly and thoroughly.

You have been provided with the most relevant knowledge base entries for the student's question. Use ONLY this context to answer. Do not make up information outside of what is provided.

If the context is sufficient, give a clear, helpful, and educational answer. If it is not sufficient, say so honestly.

Relevant Knowledge Base Context:
${contextEntries}`;

    const previousMessages = await db
      .select()
      .from(chatMessagesTable)
      .where(eq(chatMessagesTable.sessionId, sessionId))
      .orderBy(chatMessagesTable.createdAt);

    const chatHistory = previousMessages.slice(-8).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    const completion = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 8192,
      messages: [
        { role: "system", content: systemPrompt },
        ...chatHistory,
        { role: "user", content },
      ],
    });

    responseContent =
      completion.choices[0]?.message?.content ??
      "I'm sorry, I couldn't generate a response. Please try again.";
  } else {
    const fallbackSystemPrompt = `You are an AI-powered education assistant specializing in Computer Science and Artificial Intelligence. You help students understand concepts clearly and thoroughly.

The student's question does not closely match any entries in the knowledge base. Politely let them know, and suggest they try rephrasing or asking about CS/AI topics such as algorithms, data structures, machine learning, or programming concepts.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 8192,
      messages: [
        { role: "system", content: fallbackSystemPrompt },
        { role: "user", content },
      ],
    });

    responseContent =
      completion.choices[0]?.message?.content ??
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
