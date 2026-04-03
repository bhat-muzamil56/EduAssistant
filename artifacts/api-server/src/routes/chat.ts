import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  chatSessionsTable,
  chatMessagesTable,
  knowledgeBaseTable,
} from "@workspace/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { findTopMatches } from "../lib/tfidf.js";
import { openai } from "@workspace/integrations-openai-ai-server";
import { ai } from "@workspace/integrations-gemini-ai";
import {
  SendChatMessageBody,
  GetChatMessagesParams,
  SendChatMessageParams,
} from "@workspace/api-zod";
import { authMiddleware, type AuthRequest } from "../middlewares/auth.js";
import { detectLanguage } from "../utils/detect-language.js";

const router: IRouter = Router();

// Map BCP-47 codes to human-readable language names for the AI prompt
function langName(code: string): string {
  const map: Record<string, string> = {
    // English
    "en": "English", "en-US": "English", "en-GB": "English",

    // Indian Languages (all 22 scheduled + prominent regional)
    "hi": "Hindi",        "hi-IN": "Hindi",
    "ta": "Tamil",        "ta-IN": "Tamil",
    "te": "Telugu",       "te-IN": "Telugu",
    "ml": "Malayalam",    "ml-IN": "Malayalam",
    "kn": "Kannada",      "kn-IN": "Kannada",
    "gu": "Gujarati",     "gu-IN": "Gujarati",
    "mr": "Marathi",      "mr-IN": "Marathi",
    "pa": "Punjabi",      "pa-IN": "Punjabi",
    "bn": "Bengali",      "bn-IN": "Bengali",  "bn-BD": "Bengali",
    "or": "Odia",         "or-IN": "Odia",
    "as": "Assamese",     "as-IN": "Assamese",
    "ne": "Nepali",       "ne-IN": "Nepali",   "ne-NP": "Nepali",
    "ur": "Urdu",         "ur-IN": "Urdu",     "ur-PK": "Urdu",
    "sd": "Sindhi",       "sd-IN": "Sindhi",
    "ks": "Kashmiri",     "ks-IN": "Kashmiri",
    "mai": "Maithili",    "mai-IN": "Maithili",
    "kok": "Konkani",     "kok-IN": "Konkani",
    "mni": "Manipuri",    "mni-IN": "Manipuri",
    "sat": "Santali",     "sat-IN": "Santali",
    "doi": "Dogri",       "doi-IN": "Dogri",
    "sa": "Sanskrit",     "sa-IN": "Sanskrit",
    "bho": "Bhojpuri",    "bho-IN": "Bhojpuri",
    "awa": "Awadhi",      "awa-IN": "Awadhi",
    "mag": "Magahi",      "mag-IN": "Magahi",
    "raj": "Rajasthani",  "raj-IN": "Rajasthani",
    "hne": "Chhattisgarhi", "hne-IN": "Chhattisgarhi",
    "tcy": "Tulu",        "tcy-IN": "Tulu",

    // South Asia
    "si": "Sinhala",      "si-LK": "Sinhala",
    "dz": "Dzongkha",     "dz-BT": "Dzongkha",
    "ps": "Pashto",       "ps-AF": "Pashto",
    "fa": "Persian",      "fa-IR": "Persian",  "fa-AF": "Dari",

    // Southeast Asia
    "my": "Burmese",      "my-MM": "Burmese",
    "th": "Thai",         "th-TH": "Thai",
    "lo": "Lao",          "lo-LA": "Lao",
    "km": "Khmer",        "km-KH": "Khmer",
    "vi": "Vietnamese",   "vi-VN": "Vietnamese",
    "ms": "Malay",        "ms-MY": "Malay",
    "id": "Indonesian",   "id-ID": "Indonesian",
    "fil": "Filipino",    "fil-PH": "Filipino",
    "jv": "Javanese",     "jv-ID": "Javanese",
    "su": "Sundanese",    "su-ID": "Sundanese",

    // East Asia
    "zh": "Chinese",      "zh-CN": "Chinese (Simplified)", "zh-TW": "Chinese (Traditional)", "zh-HK": "Cantonese",
    "ja": "Japanese",     "ja-JP": "Japanese",
    "ko": "Korean",       "ko-KR": "Korean",
    "mn": "Mongolian",    "mn-MN": "Mongolian",
    "bo": "Tibetan",      "bo-CN": "Tibetan",

    // Middle East
    "ar": "Arabic",       "ar-SA": "Arabic",
    "he": "Hebrew",       "he-IL": "Hebrew",
    "ku": "Kurdish",      "ku-TR": "Kurdish",
    "tr": "Turkish",      "tr-TR": "Turkish",

    // Central Asia / Caucasus
    "az": "Azerbaijani",  "az-AZ": "Azerbaijani",
    "uz": "Uzbek",        "uz-UZ": "Uzbek",
    "kk": "Kazakh",       "kk-KZ": "Kazakh",
    "ky": "Kyrgyz",       "ky-KG": "Kyrgyz",
    "tg": "Tajik",        "tg-TJ": "Tajik",
    "tk": "Turkmen",      "tk-TM": "Turkmen",
    "ka": "Georgian",     "ka-GE": "Georgian",
    "hy": "Armenian",     "hy-AM": "Armenian",

    // Europe — Major
    "ru": "Russian",      "ru-RU": "Russian",
    "uk": "Ukrainian",    "uk-UA": "Ukrainian",
    "be": "Belarusian",   "be-BY": "Belarusian",
    "fr": "French",       "fr-FR": "French",
    "de": "German",       "de-DE": "German",
    "es": "Spanish",      "es-ES": "Spanish", "es-MX": "Spanish",
    "pt": "Portuguese",   "pt-PT": "Portuguese", "pt-BR": "Portuguese (Brazilian)",
    "it": "Italian",      "it-IT": "Italian",
    "nl": "Dutch",        "nl-NL": "Dutch",
    "pl": "Polish",       "pl-PL": "Polish",
    "ro": "Romanian",     "ro-RO": "Romanian",
    "hu": "Hungarian",    "hu-HU": "Hungarian",
    "el": "Greek",        "el-GR": "Greek",
    "cs": "Czech",        "cs-CZ": "Czech",
    "sk": "Slovak",       "sk-SK": "Slovak",
    "bg": "Bulgarian",    "bg-BG": "Bulgarian",
    "hr": "Croatian",     "hr-HR": "Croatian",
    "sr": "Serbian",      "sr-RS": "Serbian",
    "sl": "Slovenian",    "sl-SI": "Slovenian",
    "mk": "Macedonian",   "mk-MK": "Macedonian",
    "sq": "Albanian",     "sq-AL": "Albanian",
    "bs": "Bosnian",      "bs-BA": "Bosnian",
    "sv": "Swedish",      "sv-SE": "Swedish",
    "da": "Danish",       "da-DK": "Danish",
    "nb": "Norwegian",    "nb-NO": "Norwegian",
    "fi": "Finnish",      "fi-FI": "Finnish",
    "is": "Icelandic",    "is-IS": "Icelandic",
    "lv": "Latvian",      "lv-LV": "Latvian",
    "lt": "Lithuanian",   "lt-LT": "Lithuanian",
    "et": "Estonian",     "et-EE": "Estonian",

    // Europe — Regional
    "ca": "Catalan",      "ca-ES": "Catalan",
    "eu": "Basque",       "eu-ES": "Basque",
    "gl": "Galician",     "gl-ES": "Galician",
    "cy": "Welsh",        "cy-GB": "Welsh",
    "ga": "Irish",        "ga-IE": "Irish",
    "mt": "Maltese",      "mt-MT": "Maltese",
    "af": "Afrikaans",    "af-ZA": "Afrikaans",

    // Africa
    "sw": "Swahili",      "sw-KE": "Swahili",
    "am": "Amharic",      "am-ET": "Amharic",
    "so": "Somali",       "so-SO": "Somali",
    "yo": "Yoruba",       "yo-NG": "Yoruba",
    "ha": "Hausa",        "ha-NG": "Hausa",
    "ig": "Igbo",         "ig-NG": "Igbo",
    "zu": "Zulu",         "zu-ZA": "Zulu",
    "xh": "Xhosa",        "xh-ZA": "Xhosa",
    "st": "Sesotho",      "st-ZA": "Sesotho",
    "sn": "Shona",        "sn-ZW": "Shona",
    "rw": "Kinyarwanda",  "rw-RW": "Kinyarwanda",
    "ln": "Lingala",      "ln-CD": "Lingala",
    "mg": "Malagasy",     "mg-MG": "Malagasy",
    "om": "Oromo",        "om-ET": "Oromo",
    "ti": "Tigrinya",     "ti-ER": "Tigrinya",
  };
  return map[code] ?? map[code.split("-")[0]] ?? "English";
}

async function getGeminiPerspective(
  question: string,
  context: string,
  detectedLang: { name: string; isEnglish: boolean }
): Promise<string> {
  const bilingualNote = detectedLang.isEnglish
    ? ""
    : `\nIMPORTANT: The user wrote in ${detectedLang.name}. Provide your explanation in ${detectedLang.name} only.`;
  try {
    const prompt = `You are a brilliant, knowledgeable AI assistant with expertise across all domains — science, technology, mathematics, history, geography, languages, arts, culture, cooking, health, law, finance, sports, philosophy, creative writing, coding, and everything else. Answer the following question with a clear, friendly, intuitive explanation in 2–3 short paragraphs. Use simple language, relatable analogies, and real-world examples where helpful. Do not use heavy markdown — keep it conversational.${bilingualNote}

${context ? `Relevant context from knowledge base:\n${context}\n\n` : ""}Question: ${question}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { maxOutputTokens: 1500 },
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
  detectedLang: { name: string; flag: string; isEnglish: boolean }
): Promise<string> {
  const langBlock = detectedLang.isEnglish
    ? ""
    : `
🌐 LANGUAGE RULE (strictly enforced):
The user wrote in **${detectedLang.name}**. You MUST respond ENTIRELY in ${detectedLang.name}.
Do NOT include any English. Do NOT add translations. Every single word of your response must be in ${detectedLang.name} only.`;

  const systemPrompt = `You are EduAssistant — a powerful, universal AI assistant powered by both OpenAI GPT and Google Gemini working together. You can answer ANY question on ANY topic — science, mathematics, history, geography, coding, technology, cooking, health, law, finance, sports, philosophy, creative writing, language, music, art, relationships, general knowledge, and everything else. You are like ChatGPT and Gemini combined.
${langBlock}

## Your core rules:
- NEVER say "I don't know", "I can't help with that", or "please rephrase"
- NEVER refuse a question because it's outside a narrow subject — you cover EVERYTHING
- Always give complete, accurate, helpful answers
- Be friendly, patient, and encouraging — like the smartest friend who knows everything
- Use clear structure with headings, numbered steps, or bullets as appropriate
- Include real-world examples and analogies to make things click
- End answers with an offer to go deeper or explain further

## Answer format — adapt to the question type:

**Concepts / "What is X?" questions:**
1. 🔍 **What is it?** — one-line definition
2. 📖 **Explanation** — clear breakdown
3. 💡 **Example** — relatable real-world example
4. 🔗 **Related ideas** — connected concepts worth knowing
5. ✅ **Summary** — 1–2 sentence recap

**How-to / Step-by-step questions:**
- Numbered steps with clear actions
- Include tips or common mistakes to avoid

**Maths / calculations:**
- Show working step-by-step
- Explain each step in plain English
- Give the final answer clearly

**Coding questions:**
- Show code in proper code blocks with language tags
- Explain what each part does
- Mention common pitfalls

**Creative writing / stories / poems:**
- Write the full piece — don't just describe it
- Match the requested tone and style

**Opinion / advice / recommendations:**
- Give a clear recommendation
- Explain the reasoning
- Mention alternatives where relevant

**General knowledge / facts:**
- Give accurate, concise facts
- Add interesting context that makes it memorable

**Broad or open-ended topics:**
- Break into clear numbered sections
- Cover the main branches/types with brief explanations

## Sources powering this answer:
${knowledgeContext ? `📚 **Knowledge Base (curated educational materials):**\n${knowledgeContext}\n` : ""}
${geminiInsight ? `🤖 **Google Gemini's perspective:**\n${geminiInsight}\n` : ""}

Synthesize all available knowledge into one perfect, comprehensive, ChatGPT-quality answer. The user expects the best answer possible — deliver it.`;

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

// List all sessions for the logged-in user (most recent first, with first-message preview)
router.get("/user-sessions", authMiddleware, async (req: AuthRequest, res) => {
  const userId = req.userId;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const sessions = await db
    .select()
    .from(chatSessionsTable)
    .where(eq(chatSessionsTable.userId, userId))
    .orderBy(desc(chatSessionsTable.createdAt));

  const sessionsWithPreview = await Promise.all(
    sessions.map(async (session) => {
      const firstMsg = await db
        .select()
        .from(chatMessagesTable)
        .where(and(
          eq(chatMessagesTable.sessionId, session.id),
          eq(chatMessagesTable.role, "user")
        ))
        .orderBy(chatMessagesTable.createdAt)
        .limit(1);

      return {
        id: session.id,
        createdAt: session.createdAt.toISOString(),
        preview: firstMsg[0]?.content?.slice(0, 80) ?? null,
      };
    })
  );

  // Only return sessions that have at least one message
  res.json(sessionsWithPreview.filter(s => s.preview !== null));
});

// Create a fresh new session for the logged-in user
router.post("/new-session", authMiddleware, async (req: AuthRequest, res) => {
  const userId = req.userId;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

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
  const { content } = SendChatMessageBody.parse(req.body);
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

  const topMatches = findTopMatches(content, knowledge, 5);
  const topScore = topMatches[0]?.score ?? 0;
  const confidence = Math.round(topScore * 100) / 100;

  // Only inject knowledge base context when there's a meaningful match (score > 0.05)
  // For unrelated questions the AI uses its own trained knowledge
  const relevantMatches = topMatches.filter(m => m.score > 0.05);
  const knowledgeContext =
    relevantMatches.length > 0
      ? relevantMatches
          .map(
            (m, i) =>
              `[${i + 1}] (${m.item.category ?? "General"}) Q: ${m.item.question}\nA: ${m.item.answer}`
          )
          .join("\n\n")
      : "";

  // Keep last 20 messages for better conversation continuity
  const chatHistory = previousMessages.slice(-20).map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  // Auto-detect the language the user typed in
  const detectedLang = detectLanguage(content);

  const geminiInsight = await getGeminiPerspective(content, knowledgeContext, detectedLang);

  const responseContent = await getFinalAnswer(
    content,
    knowledgeContext,
    geminiInsight,
    chatHistory,
    detectedLang
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
    detectedLang: detectedLang.isEnglish ? null : {
      code: detectedLang.code,
      name: detectedLang.name,
      flag: detectedLang.flag,
    },
  });
});

// ── Streaming endpoint ──────────────────────────────────────────────────────
// Runs Gemini in parallel (with 1.5s timeout) while streaming GPT token-by-token
router.post("/sessions/:sessionId/stream", authMiddleware, async (req: AuthRequest, res) => {
  const { sessionId } = SendChatMessageParams.parse(req.params);
  const { content } = SendChatMessageBody.parse(req.body);
  const lang: string | undefined = typeof req.body.lang === "string" ? req.body.lang : undefined;
  const userId = req.userId;

  // Auth check
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

  // SSE headers — keep connection open for streaming
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const sendEvent = (data: object) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    // Save user message
    await db.insert(chatMessagesTable).values({ sessionId, role: "user", content });

    // Load knowledge base + chat history in parallel
    const [knowledge, previousMessages] = await Promise.all([
      db.select().from(knowledgeBaseTable),
      db.select().from(chatMessagesTable)
        .where(eq(chatMessagesTable.sessionId, sessionId))
        .orderBy(chatMessagesTable.createdAt),
    ]);

    const topMatches = findTopMatches(content, knowledge, 5);
    const topScore = topMatches[0]?.score ?? 0;
    const confidence = Math.round(topScore * 100) / 100;
    const relevantMatches = topMatches.filter(m => m.score > 0.05);
    const knowledgeContext = relevantMatches.length > 0
      ? relevantMatches.map((m, i) => `[${i + 1}] (${m.item.category ?? "General"}) Q: ${m.item.question}\nA: ${m.item.answer}`).join("\n\n")
      : "";

    const chatHistory = previousMessages.slice(-20).map(m => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    const detectedLang = detectLanguage(content);

    // Run Gemini with a 1.5s timeout — don't block GPT on it
    const geminiInsight = await Promise.race([
      getGeminiPerspective(content, knowledgeContext, detectedLang),
      new Promise<string>(resolve => setTimeout(() => resolve(""), 1500)),
    ]);

    // Build GPT prompt (same as getFinalAnswer but inline for streaming)
    const langBlock = detectedLang.isEnglish
      ? ""
      : `\n🌐 LANGUAGE RULE (strictly enforced):\nThe user wrote in **${detectedLang.name}**. You MUST respond ENTIRELY in ${detectedLang.name}.\nDo NOT include any English. Do NOT add translations. Every single word of your response must be in ${detectedLang.name} only.`;

    const systemPrompt = `You are EduAssistant — a powerful, universal AI assistant powered by both OpenAI GPT and Google Gemini. You answer ANY question on ANY topic.
${langBlock}

## Rules:
- NEVER refuse or say "I don't know" — you cover EVERYTHING
- Give complete, accurate, helpful answers
- Use clear structure with headings, bullets, or numbered steps as appropriate
- Include real-world examples and analogies
- Be friendly and encouraging

## Sources:
${knowledgeContext ? `📚 Knowledge Base:\n${knowledgeContext}\n` : ""}${geminiInsight ? `🤖 Gemini's perspective:\n${geminiInsight}\n` : ""}

Synthesize all knowledge into one perfect, comprehensive answer.`;

    // Stream GPT response token-by-token
    const stream = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 2048,
      stream: true,
      messages: [
        { role: "system", content: systemPrompt },
        ...chatHistory,
        { role: "user", content },
      ],
    });

    let fullContent = "";
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content ?? "";
      if (delta) {
        fullContent += delta;
        sendEvent({ type: "chunk", content: delta });
      }
    }

    // Save assistant message to DB
    const [assistantMsg] = await db
      .insert(chatMessagesTable)
      .values({ sessionId, role: "assistant", content: fullContent, confidence })
      .returning();

    // Send final metadata event
    sendEvent({
      type: "done",
      message: {
        id: assistantMsg.id,
        sessionId: assistantMsg.sessionId,
        role: assistantMsg.role,
        content: assistantMsg.content,
        confidence: assistantMsg.confidence ?? null,
        createdAt: assistantMsg.createdAt.toISOString(),
        detectedLang: detectedLang.isEnglish ? null : {
          code: detectedLang.code,
          name: detectedLang.name,
          flag: detectedLang.flag,
        },
      },
    });
  } catch (err) {
    sendEvent({ type: "error", message: "Failed to generate response" });
  } finally {
    res.end();
  }
});

export default router;
