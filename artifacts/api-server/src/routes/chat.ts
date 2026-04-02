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
    : `\nIMPORTANT: The user wrote in ${detectedLang.name}. Provide your explanation in ${detectedLang.name} only (the main answer will include an English version separately).`;
  try {
    const prompt = `You are a CS/AI tutor. Give a clear, friendly, intuitive explanation of the following question in 2-3 short paragraphs. Use simple language, relatable analogies, and a real-world example. Do not use heavy markdown — keep it conversational.${bilingualNote}

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
  detectedLang: { name: string; flag: string; isEnglish: boolean }
): Promise<string> {
  const bilingualBlock = detectedLang.isEnglish
    ? ""
    : `
🌐 BILINGUAL RESPONSE REQUIRED (mandatory — do not skip):
The user wrote in **${detectedLang.name}**. You MUST structure your entire response in TWO clearly separated sections:

**Section 1 — 🇬🇧 English:**
[Full, complete answer in English]

---

**Section 2 — ${detectedLang.flag} ${detectedLang.name}:**
[Full, complete answer translated into ${detectedLang.name} — every word must be in ${detectedLang.name}]

Both sections must be complete — do NOT abbreviate or summarise either one. Always use this exact format with the section headers and the horizontal rule separator.`;

  const systemPrompt = `You are EduAssistant — an AI education tutor for Computer Science and Artificial Intelligence, powered by both OpenAI GPT and Google Gemini working together.
${bilingualBlock}

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

export default router;
