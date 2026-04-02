import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  chatSessionsTable,
  chatMessagesTable,
  knowledgeBaseTable,
} from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { findTopMatches } from "../lib/tfidf.js";
import { openai } from "@workspace/integrations-openai-ai-server";
import { ai } from "@workspace/integrations-gemini-ai";
import {
  SendChatMessageBody,
  GetChatMessagesParams,
  SendChatMessageParams,
} from "@workspace/api-zod";
import { authMiddleware, type AuthRequest } from "../middlewares/auth.js";

const router: IRouter = Router();

// Map BCP-47 codes to human-readable language names for the AI prompt
function langName(code: string): string {
  const map: Record<string, string> = {
    "en": "English", "en-US": "English", "en-GB": "English",
    "ar": "Arabic", "ar-SA": "Arabic",
    "ur": "Urdu", "ur-PK": "Urdu",
    "hi": "Hindi", "hi-IN": "Hindi",
    "ta": "Tamil", "ta-IN": "Tamil",
    "ml": "Malayalam", "ml-IN": "Malayalam",
    "kn": "Kannada", "kn-IN": "Kannada",
    "te": "Telugu", "te-IN": "Telugu",
    "es": "Spanish", "es-ES": "Spanish", "es-MX": "Spanish",
    "fr": "French", "fr-FR": "French",
    "zh": "Chinese", "zh-CN": "Chinese (Simplified)", "zh-TW": "Chinese (Traditional)",
    "de": "German", "de-DE": "German",
    "pt": "Portuguese", "pt-BR": "Portuguese (Brazilian)", "pt-PT": "Portuguese",
    "tr": "Turkish", "tr-TR": "Turkish",
    "bn": "Bengali", "bn-BD": "Bengali",
    "ru": "Russian", "ru-RU": "Russian",
    "pa": "Punjabi", "pa-IN": "Punjabi",
    "ja": "Japanese", "ja-JP": "Japanese",
    "it": "Italian", "it-IT": "Italian",
    "ko": "Korean", "ko-KR": "Korean",
    "ms": "Malay", "ms-MY": "Malay",
    "id": "Indonesian", "id-ID": "Indonesian",
    "sw": "Swahili", "sw-KE": "Swahili",
    "nl": "Dutch", "nl-NL": "Dutch",
    "fa": "Persian", "fa-IR": "Persian",
    "vi": "Vietnamese", "vi-VN": "Vietnamese",
    "th": "Thai", "th-TH": "Thai",
    "pl": "Polish", "pl-PL": "Polish",
  };
  return map[code] ?? map[code.split("-")[0]] ?? "English";
}

async function getGeminiPerspective(
  question: string,
  context: string,
  lang = "en"
): Promise<string> {
  const language = langName(lang);
  try {
    const prompt = `You are a CS/AI tutor. Give a clear, friendly, intuitive explanation of the following question in 2-3 short paragraphs. Use simple language, relatable analogies, and a real-world example. Do not use heavy markdown — keep it conversational.
IMPORTANT: You MUST respond entirely in ${language}. Every word of your answer must be in ${language}.

${context ? `Relevant context:\n${context}\n\n` : ""}Question: ${question}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { maxOutputTokens: 1024 },
    });
    return response.text ?? "";
  } catch {
    return "";
  }
}

async function getFinalAnswer(
  question: string,
  knowledgeContext: string,
  geminiInsight: string,
  chatHistory: { role: "user" | "assistant"; content: string }[],
  lang = "en"
): Promise<string> {
  const language = langName(lang);
  const systemPrompt = `You are EduAssistant — an AI education tutor for Computer Science and Artificial Intelligence, powered by both OpenAI GPT and Google Gemini working together.

🌐 LANGUAGE INSTRUCTION (highest priority): You MUST respond ENTIRELY in ${language}. Every single word of your answer — including headings, labels, examples, and the closing line — must be written in ${language}. Do not mix languages. Do not fall back to English unless ${language} IS English.

## Your personality:
- Friendly, patient, and encouraging — like a great university tutor
- Always give complete, easy-to-understand answers — never say "I don't know" or ask the student to rephrase
- Use clear structure: numbered steps, bullet points, bold headings
- Include real-world examples and analogies to make concepts click
- End every answer with an encouraging line or offer to explain further

## Your answer format (adapt based on question type):
**For concept questions:**
1. 🔍 **What is it?** — simple one-line definition
2. 📖 **Explanation** — clear breakdown
3. 💡 **Real-world example** — relatable analogy or use case
4. 🔗 **How it connects** — related concepts
5. ✅ **Summary** — 1-2 sentence recap

**For broad topics** (e.g. "algorithms", "machine learning"):
- Break into numbered sub-sections, each with a heading
- Cover the main branches/types with brief explanations

**For how-to questions:**
- Numbered step-by-step with clear actions

## Sources available to you:
You have TWO powerful AI perspectives to draw from:

${knowledgeContext ? `📚 **Knowledge Base (curated CS/AI materials):**\n${knowledgeContext}\n` : ""}
${geminiInsight ? `🤖 **Google Gemini's perspective on this question:**\n${geminiInsight}\n` : ""}

Synthesize both the knowledge base and Gemini's insights into one perfect, comprehensive answer. Make it feel like ChatGPT at its best — clear, structured, and genuinely helpful.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-5.2",
    max_completion_tokens: 8192,
    messages: [
      { role: "system", content: systemPrompt },
      ...chatHistory,
      { role: "user", content: question },
    ],
  });

  return (
    completion.choices[0]?.message?.content ??
    "I'm sorry, I couldn't generate a response. Please try again."
  );
}

router.get("/my-session", authMiddleware, async (req: AuthRequest, res) => {
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const existing = await db
    .select()
    .from(chatSessionsTable)
    .where(eq(chatSessionsTable.userId, userId))
    .orderBy(chatSessionsTable.createdAt)
    .limit(1);

  if (existing.length > 0) {
    res.json({ id: existing[0].id, createdAt: existing[0].createdAt.toISOString() });
    return;
  }

  const [session] = await db
    .insert(chatSessionsTable)
    .values({ userId })
    .returning();

  res.status(201).json({ id: session.id, createdAt: session.createdAt.toISOString() });
});

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

router.get("/sessions/:sessionId/messages", authMiddleware, async (req: AuthRequest, res) => {
  const { sessionId } = GetChatMessagesParams.parse(req.params);
  const userId = req.userId;

  if (userId) {
    const session = await db
      .select()
      .from(chatSessionsTable)
      .where(and(eq(chatSessionsTable.id, sessionId), eq(chatSessionsTable.userId, userId)))
      .limit(1);

    if (session.length === 0) {
      res.status(403).json({ error: "Access denied" });
      return;
    }
  }

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

router.post("/sessions/:sessionId/messages", authMiddleware, async (req: AuthRequest, res) => {
  const { sessionId } = SendChatMessageParams.parse(req.params);
  const { content, lang = "en" } = SendChatMessageBody.parse(req.body);
  const userId = req.userId;

  if (userId) {
    const session = await db
      .select()
      .from(chatSessionsTable)
      .where(and(eq(chatSessionsTable.id, sessionId), eq(chatSessionsTable.userId, userId)))
      .limit(1);

    if (session.length === 0) {
      res.status(403).json({ error: "Access denied" });
      return;
    }
  }

  await db.insert(chatMessagesTable).values({
    sessionId,
    role: "user",
    content,
  });

  const [knowledge, previousMessages] = await Promise.all([
    db.select().from(knowledgeBaseTable),
    db
      .select()
      .from(chatMessagesTable)
      .where(eq(chatMessagesTable.sessionId, sessionId))
      .orderBy(chatMessagesTable.createdAt),
  ]);

  const topMatches = findTopMatches(content, knowledge, 8);
  const topScore = topMatches[0]?.score ?? 0;
  const confidence = Math.round(topScore * 100) / 100;

  const knowledgeContext =
    topMatches.length > 0
      ? topMatches
          .map(
            (m, i) =>
              `[${i + 1}] (${m.item.category ?? "General"}) Q: ${m.item.question}\nA: ${m.item.answer}`
          )
          .join("\n\n")
      : "";

  const chatHistory = previousMessages.slice(-8).map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  const geminiInsight = await getGeminiPerspective(content, knowledgeContext, lang);

  const responseContent = await getFinalAnswer(
    content,
    knowledgeContext,
    geminiInsight,
    chatHistory,
    lang
  );

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
