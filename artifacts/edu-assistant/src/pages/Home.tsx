import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { useState } from "react";
import { 
  ArrowRight, Sparkles, Brain, CheckCircle2, 
  Layers, Database, Code2, Zap, ShieldCheck, 
  Clock, Maximize, Smartphone, Settings,
  BarChart3, Network, Mic, X, ChevronRight
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";

// ── Pipeline step details ────────────────────────────────────────────────────
const PIPELINE_DETAILS = [
  {
    step: "Question",
    desc: "Student asks",
    icon: "💬",
    color: "from-blue-500 to-blue-600",
    subtitle: "Input Capture & Validation",
    what: "The student types a question into the chat interface. The frontend captures the raw text and sends it to the backend via a POST request to /api/chat/sessions/:id/messages with a JSON payload.",
    how: [
      "React state captures each keystroke in real time",
      "On submit, the message is sent as JSON: { content: '...' }",
      "The Express router validates the request body (non-empty, max 4000 chars)",
      "Auth middleware confirms the user's JWT token before processing",
      "The raw question string is passed unchanged to the next stage"
    ],
    code: `POST /api/chat/sessions/:id/messages\nBody: { "content": "What is machine learning?" }\nHeaders: Authorization: Bearer <jwt_token>`,
    output: "Validated raw question string ready for preprocessing"
  },
  {
    step: "Preprocessing",
    desc: "Text cleaning",
    icon: "🧹",
    color: "from-violet-500 to-violet-600",
    subtitle: "Text Normalization & Cleaning",
    what: "The raw question goes through a series of text-cleaning transformations to strip noise and standardise the input before it can be vectorised. Messy text produces bad vectors — clean text produces good ones.",
    how: [
      "Convert everything to lowercase (\"Machine Learning\" → \"machine learning\")",
      "Strip all punctuation using a regex replace: /[^\\w\\s]/g",
      "Collapse multiple whitespace characters into a single space",
      "Trim leading and trailing whitespace from the result",
      "Remove common stop-words (the, is, a, an, of, for, …) that carry no semantic weight",
      "Apply basic stemming: remove common suffixes (-ing, -ed, -s) where safe to do so"
    ],
    code: `function preprocess(text: string): string {\n  return text\n    .toLowerCase()\n    .replace(/[^\\w\\s]/g, '')\n    .replace(/\\s+/g, ' ')\n    .trim();\n}`,
    output: "Clean, normalised token string: \"machine learning\""
  },
  {
    step: "Vectorization",
    desc: "TF-IDF encode",
    icon: "📐",
    color: "from-emerald-500 to-emerald-600",
    subtitle: "TF-IDF Numerical Encoding",
    what: "Term Frequency–Inverse Document Frequency (TF-IDF) converts the cleaned text into a numerical vector. Each dimension of the vector corresponds to a unique word in the knowledge base vocabulary, weighted by how distinctive that word is across all documents.",
    how: [
      "Build a vocabulary from every word that appears in the knowledge base",
      "TF (Term Frequency) = count of word in document ÷ total words in document",
      "IDF (Inverse Document Frequency) = log(N / df) where N = total docs, df = docs containing the word",
      "TF-IDF score = TF × IDF — rare-but-present words score higher",
      "The question is encoded using the same vocabulary so dimensions align",
      "Result is a sparse high-dimensional float vector (one value per vocab word)"
    ],
    code: `// Simplified TF-IDF computation\nconst tf = termCount / totalTerms;\nconst idf = Math.log(totalDocs / (docsWithTerm + 1));\nconst tfidf = tf * idf;`,
    output: "Sparse float vector representing the question in vocabulary space"
  },
  {
    step: "Matching",
    desc: "Cosine similarity",
    icon: "🔍",
    color: "from-orange-500 to-orange-600",
    subtitle: "Semantic Similarity Search",
    what: "The question vector is compared against every pre-computed knowledge-entry vector using cosine similarity. Cosine similarity measures the angle between two vectors — a score of 1.0 means identical direction (perfect semantic match); 0.0 means orthogonal (no overlap).",
    how: [
      "Each knowledge base entry was vectorised at startup and cached in memory",
      "Dot product of question vector and each knowledge vector is computed",
      "Each is divided by the product of their magnitudes (L2 norms)",
      "This yields a cosine score in [0, 1] for every knowledge entry",
      "All entries are ranked by descending cosine score",
      "The top 8 entries with the highest similarity scores are selected"
    ],
    code: `function cosineSimilarity(a: number[], b: number[]): number {\n  const dot = a.reduce((s, v, i) => s + v * b[i], 0);\n  const normA = Math.sqrt(a.reduce((s, v) => s + v * v, 0));\n  const normB = Math.sqrt(b.reduce((s, v) => s + v * v, 0));\n  return dot / (normA * normB);\n}`,
    output: "Ranked list of top-8 knowledge entries with similarity scores"
  },
  {
    step: "Retrieval",
    desc: "Find answer",
    icon: "📚",
    color: "from-cyan-500 to-cyan-600",
    subtitle: "Knowledge Base Retrieval",
    what: "The top-8 ranked knowledge entries are fetched from PostgreSQL and their content is assembled into a structured context block. This is the \"Retrieval\" half of the RAG (Retrieval-Augmented Generation) pipeline — grounding the AI in real curated knowledge.",
    how: [
      "Entry IDs from the ranking step are used in a WHERE id IN (...) SQL query",
      "Each entry contains: question, answer, category, and an optional explanation",
      "Entries are ordered by cosine score (most relevant first)",
      "A context string is built: entries are numbered and concatenated",
      "The full chat message history for this session is also fetched for context",
      "Both context and history are packaged into the AI prompt template"
    ],
    code: `SELECT id, question, answer, category\nFROM knowledge_base\nWHERE id = ANY($1)\nORDER BY array_position($1, id);`,
    output: "Structured context block with top-8 curated knowledge entries"
  },
  {
    step: "Processing",
    desc: "Score confidence",
    icon: "⚙️",
    color: "from-rose-500 to-rose-600",
    subtitle: "Dual-Model AI Processing",
    what: "This is the most compute-intensive stage. The retrieved context is fed into a two-model pipeline: Gemini drafts an intuitive explanation first, then GPT synthesises the final structured answer. The top cosine score is used as a confidence indicator.",
    how: [
      "Confidence score = highest cosine similarity from the Matching step (0–100%)",
      "Gemini (gemini-2.5-pro) receives the context + question and drafts an intuitive explanation",
      "GPT (gpt-4o) receives Gemini's draft + original context and synthesises the final answer",
      "GPT is instructed to produce a ChatGPT-style structured response with sections, emojis, real-world examples",
      "The AI prompt explicitly includes the confidence score so the model can caveat low-confidence answers",
      "Both model calls happen server-side through secure AI Integration proxies (no API keys exposed to client)"
    ],
    code: `// Stage 1: Gemini draft\nconst draft = await gemini.generate({ prompt: geminiPrompt });\n// Stage 2: GPT synthesis\nconst final = await openai.chat({ messages: gptMessages(draft) });`,
    output: "Final structured AI answer with confidence score attached"
  },
  {
    step: "Response",
    desc: "AI replies",
    icon: "✨",
    color: "from-pink-500 to-pink-600",
    subtitle: "Response Delivery & Persistence",
    what: "The final AI-generated answer is saved to PostgreSQL (so chat history is preserved across sessions) and immediately streamed back to the client. The frontend renders it with animated message bubbles and typed formatting.",
    how: [
      "The AI response string is saved to the chat_messages table with role='assistant'",
      "The session's updated_at timestamp is refreshed in chat_sessions",
      "The full response JSON is returned: { id, content, role, createdAt, confidence }",
      "React Query invalidates the messages cache so the UI re-fetches and displays the new message",
      "Framer Motion animates the message bubble fading in from below",
      "The confidence score is optionally displayed as a badge on the message card"
    ],
    code: `INSERT INTO chat_messages (session_id, role, content)\nVALUES ($1, 'assistant', $2)\nRETURNING id, content, role, created_at;`,
    output: "Animated AI response visible in the chat, saved to the database"
  }
];

// ── Platform Capability details ───────────────────────────────────────────────
const CAPABILITY_DETAILS = [
  {
    icon: Brain,
    label: "Dual AI Engine",
    desc: "Gemini drafts an intuitive explanation, GPT synthesises the final structured answer — two models working together on every question.",
    color: "from-violet-500 to-purple-700",
    badge: "🤖 AI Power",
    what: "EduAssistant uses two AI models simultaneously. First, Google Gemini generates a quick intuitive explanation. Then, GPT takes that explanation plus the knowledge base results and synthesises a final, polished, structured answer. You get the best of both models in every single response.",
    frontend: [
      "You send a question — the chat UI opens a streaming connection instantly",
      "Words start appearing on screen within ~1 second as GPT generates them",
      "A blinking cursor shows the AI is still writing — just like ChatGPT",
      "When streaming completes, the full response is saved and confidence shown",
      "The UI handles both models transparently — you just see one clean answer"
    ],
    backend: [
      "Gemini runs with a 1.5s timeout in parallel with knowledge base retrieval",
      "If Gemini finishes in time, its insight is injected into the GPT prompt",
      "GPT streams the final answer token-by-token via Server-Sent Events (SSE)",
      "The combined response is saved to PostgreSQL once streaming is complete",
      "If Gemini times out, GPT proceeds alone — no disruption to the user"
    ],
    capabilities: [
      "Two AI models work together on every question",
      "Responses start streaming in ~1 second",
      "Gemini adds intuitive context, GPT structures the final answer",
      "Automatic fallback if either model is slow",
      "Answers any question on any topic — science, maths, coding, history, and more"
    ]
  },
  {
    icon: Database,
    label: "Curated Knowledge Base",
    desc: "A hand-curated CS & AI knowledge base powers the retrieval layer, ensuring every answer is grounded in verified educational content.",
    color: "from-blue-500 to-cyan-600",
    badge: "📚 Knowledge",
    what: "The Knowledge Base is a database of 99+ verified Q&A pairs covering computer science, AI, mathematics, science, history, and more. Before the AI responds, it searches this database for the most relevant facts and injects them into the prompt — grounding the answer in real, verified content rather than guessing.",
    frontend: [
      "A 'Knowledge confidence: XX%' badge appears on every AI response",
      "High % means the answer is directly backed by the knowledge base",
      "The Knowledge Base Preview section on the home page shows sample entries",
      "Users benefit from the knowledge base automatically — no extra steps needed"
    ],
    backend: [
      "All 99+ entries are stored in the PostgreSQL knowledgeBaseTable",
      "TF-IDF vectors are computed in-memory for fast similarity matching",
      "Top 5 most relevant entries are selected for each question",
      "Only entries scoring above 0.05 cosine similarity are injected",
      "Admins can add new entries anytime — they're instantly available"
    ],
    capabilities: [
      "99+ curated entries across CS, AI, maths, science, history and more",
      "Entries are instantly searchable by any user question",
      "New entries take effect immediately — no restart required",
      "Category-tagged for organised knowledge management",
      "Admin scripts to bulk-add entries in seconds"
    ]
  },
  {
    icon: ShieldCheck,
    label: "Secure Authentication",
    desc: "Full login and sign-up with hashed passwords and JWT session tokens. Every chat endpoint is protected — only you can see your history.",
    color: "from-green-500 to-teal-600",
    badge: "🔒 Security",
    what: "Every account and conversation in EduAssistant is fully secured. Passwords are never stored as plain text — they're hashed with bcrypt. When you log in, you receive a JWT (JSON Web Token) that proves your identity. Every API call to the chat requires this token — without it, no data is accessible.",
    frontend: [
      "Sign up or log in with your email and password on the auth page",
      "Your JWT token is stored securely in localStorage after login",
      "Every API request automatically includes the token in the Authorization header",
      "If your session expires, you're redirected to the login page automatically",
      "The nav shows your username and a sign-out button when logged in"
    ],
    backend: [
      "Passwords are hashed with bcrypt (salt rounds = 10) before storage",
      "On login, bcrypt compares the input against the stored hash",
      "A signed JWT token is issued with your userId and an expiry time",
      "Every protected route runs authMiddleware — it verifies the JWT signature",
      "Session data is never stored server-side — stateless auth via JWT"
    ],
    capabilities: [
      "bcrypt password hashing — raw passwords never stored",
      "JWT tokens for stateless, scalable authentication",
      "Every chat, session, and message is scoped to your user ID",
      "Admin-only routes protected by an isAdmin database flag",
      "Automatic session expiry and logout on invalid tokens"
    ]
  },
  {
    icon: Clock,
    label: "Persistent Chat History",
    desc: "Conversations are saved to PostgreSQL and linked to your account. Close the browser, come back days later — your history is still there.",
    color: "from-indigo-500 to-blue-600",
    badge: "💾 Memory",
    what: "Every message you send and every AI response you receive is permanently saved in PostgreSQL and linked to your account. You can close the browser, switch devices, or come back weeks later — all your conversations are exactly where you left them. The sidebar shows all your past chats with previews.",
    frontend: [
      "A sidebar (hamburger menu) shows all your past chat sessions",
      "Each session shows a preview of your first message and the date",
      "Click any session to jump back into that exact conversation",
      "New Chat button starts a fresh conversation while keeping all old ones",
      "Sessions are grouped by date — Today, Yesterday, and older dates"
    ],
    backend: [
      "Every message is stored in chatMessagesTable with sessionId, role, content, and timestamp",
      "Sessions are stored in chatSessionsTable linked to your userId",
      "GET /api/chat/user-sessions returns all sessions with first-message previews",
      "GET /api/chat/sessions/:id/messages returns all messages in a session",
      "Last 20 messages from a session are sent to the AI as conversation context"
    ],
    capabilities: [
      "Unlimited chat sessions per user — all saved permanently",
      "Full conversation history restored on every visit",
      "Chat sidebar with previews, dates, and instant session switching",
      "AI remembers the last 20 messages for natural follow-up questions",
      "All history is private — no other user can access your sessions"
    ]
  },
  {
    icon: BarChart3,
    label: "Admin Dashboard",
    desc: "A protected admin panel lets administrators view all users, monitor active chat sessions, and oversee platform activity in real time.",
    color: "from-orange-500 to-red-600",
    badge: "⚙️ Admin",
    what: "The Admin Dashboard is a special protected page only accessible to admin accounts. It gives administrators a complete overview of the platform — all registered users, all chat sessions, message counts, and activity statistics. It's the control centre for managing and monitoring EduAssistant.",
    frontend: [
      "Admin panel is accessible at /admin — redirects if you're not an admin",
      "Shows total users, total sessions, total messages at a glance",
      "Lists all registered users with their usernames and account creation dates",
      "Shows all chat sessions with message counts and timestamps",
      "Real-time data — refreshes on each visit"
    ],
    backend: [
      "Admin routes are protected by authMiddleware + isAdmin check in the DB",
      "GET /api/admin/stats returns aggregated counts from the database",
      "GET /api/admin/users returns all users (password hashes excluded)",
      "GET /api/admin/sessions returns all sessions across all users",
      "The isAdmin flag is set directly in the usersTable in PostgreSQL"
    ],
    capabilities: [
      "Full platform oversight — users, sessions, messages",
      "Secure admin-only access controlled by database flag",
      "Monitor user growth and chat activity over time",
      "View any session's message count and creation time",
      "Easy to extend with new admin features as the platform grows"
    ]
  },
  {
    icon: Mic,
    label: "Voice Interaction",
    desc: "Tap the microphone in chat to speak your question out loud. The browser transcribes it in real time and drops the text straight into the message box.",
    color: "from-pink-500 to-rose-600",
    badge: "🎙️ Voice",
    what: "Voice Interaction lets you speak to EduAssistant instead of typing. Press the mic button, speak your question, and the browser transcribes it instantly using the Web Speech API. When you use the mic, the AI also speaks the answer back to you using text-to-speech — a full hands-free experience.",
    frontend: [
      "Mic button in the chat input area — click to start, click again to stop",
      "Orange animated pulse shows the mic is actively listening",
      "Your speech is transcribed in real-time directly into the input box",
      "When sent via mic, the AI response is automatically read aloud (TTS)",
      "Voice Mode toggle — the AI speaks every response automatically",
      "50+ language support — speaks and listens in Urdu, Hindi, Arabic, and more"
    ],
    backend: [
      "Speech recognition runs entirely in the browser — no server processing needed",
      "The transcribed text is sent to the backend exactly like a typed message",
      "Language detection identifies the spoken language from the transcript",
      "The AI responds in the same language the user spoke in",
      "Text-to-speech (TTS) is also browser-based — zero server overhead"
    ],
    capabilities: [
      "Real-time speech-to-text transcription in the browser",
      "Auto-speak: AI reads its response aloud when you use the mic",
      "Hands-free Voice Mode — speak and listen continuously",
      "Works in 50+ languages — speak in any language",
      "No additional setup — works instantly in Chrome and modern browsers"
    ]
  }
];

type CapabilityDetail = typeof CAPABILITY_DETAILS[0];

function CapabilityModal({ capability, onClose }: { capability: CapabilityDetail; onClose: () => void }) {
  const [tab, setTab] = useState<"frontend" | "backend">("frontend");
  const Icon = capability.icon;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 24 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className="relative bg-background rounded-2xl shadow-2xl w-full max-w-2xl max-h-[88vh] overflow-y-auto border border-border"
          onClick={(e) => e.stopPropagation()}
        >
          <div className={`bg-gradient-to-r ${capability.color} p-6 rounded-t-2xl`}>
            <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-white/70 text-xs font-bold uppercase tracking-widest">{capability.badge}</div>
                <h2 className="text-2xl font-bold text-white">{capability.label}</h2>
              </div>
            </div>
            <p className="text-white/80 text-sm mt-2">{capability.desc}</p>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <h3 className="font-bold text-foreground mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary inline-block" />
                What is it?
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{capability.what}</p>
            </div>

            <div>
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setTab("frontend")}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${tab === "frontend" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
                >
                  ⚛️ Frontend
                </button>
                <button
                  onClick={() => setTab("backend")}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${tab === "backend" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
                >
                  🖥️ Backend
                </button>
              </div>
              <ol className="space-y-2">
                {(tab === "frontend" ? capability.frontend : capability.backend).map((item, i) => (
                  <li key={i} className="flex gap-3 text-sm text-muted-foreground">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
              <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                What it can do
              </h3>
              <ul className="space-y-2">
                {capability.capabilities.map((cap, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    <span>{cap}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Feature details ──────────────────────────────────────────────────────────
const FEATURE_DETAILS = [
  {
    icon: Zap,
    title: "Instant Retrieval",
    short: "Millisecond response times utilizing optimized backend similarity matching.",
    color: "from-yellow-500 to-orange-500",
    badge: "⚡ Performance",
    what: "Instant Retrieval is the engine that searches the knowledge base and finds the most relevant answer to your question in milliseconds — before the AI even starts generating a response. It uses a mathematical technique called TF-IDF + Cosine Similarity to rank every entry in the database by how closely it matches what you asked.",
    frontend: [
      "You type a question and press Send",
      "The message is immediately shown on screen (optimistic UI)",
      "A streaming connection opens to the server",
      "The UI starts receiving and displaying words as they arrive — no full wait"
    ],
    backend: [
      "Your question is received by Express and validated",
      "TF-IDF vectors are computed for your question against all 99+ knowledge base entries",
      "Cosine similarity scores are calculated — top 5 matches are selected",
      "Only matches above 0.05 score threshold are injected into the AI prompt",
      "The retrieval takes <10ms regardless of knowledge base size"
    ],
    capabilities: [
      "Finds relevant answers even with typos or vague phrasing",
      "Handles 99+ knowledge entries in milliseconds",
      "Scores every answer by relevance — most relevant wins",
      "Works entirely in-memory for zero database query overhead",
      "Confidence score shown on each AI response"
    ]
  },
  {
    icon: ShieldCheck,
    title: "Factual Accuracy",
    short: "Zero hallucination guarantee. Answers are strictly bounded to the provided dataset.",
    color: "from-green-500 to-emerald-600",
    badge: "🛡️ Reliability",
    what: "Factual Accuracy means EduAssistant only tells you things it knows for certain. When a question matches the curated knowledge base, the AI is given that verified content as its source — reducing the chance of made-up or incorrect answers. A confidence score is always shown so you know how sure the system is.",
    frontend: [
      "Every AI response shows a 'Knowledge confidence: XX%' badge",
      "High confidence (>70%) means the answer is grounded in the knowledge base",
      "Low confidence means the AI is using its own general knowledge",
      "The detected language is shown to confirm correct processing"
    ],
    backend: [
      "The top cosine similarity score becomes the 'confidence' value",
      "This score is stored in the database alongside the AI response",
      "When confidence is high, verified Q&A pairs are injected into the AI prompt",
      "The AI is instructed to synthesize from the provided facts — not invent",
      "The confidence value is returned with every API response"
    ],
    capabilities: [
      "Shows a % confidence score on every single response",
      "Grounded answers sourced from curated educational material",
      "AI is explicitly instructed not to guess when it doesn't know",
      "Knowledge base is admin-controlled — only verified content goes in",
      "Confidence metadata stored per-message in PostgreSQL"
    ]
  },
  {
    icon: Clock,
    title: "Contextual Memory",
    short: "Maintains a history of interactions to provide a continuous learning conversation.",
    color: "from-blue-500 to-indigo-600",
    badge: "🧠 Memory",
    what: "Contextual Memory means EduAssistant remembers everything you said earlier in the conversation. If you ask a follow-up question like 'Can you explain that differently?' it knows what 'that' refers to. Your entire conversation history is stored in the database and sent to the AI with every new message.",
    frontend: [
      "All your past messages appear when you open a previous chat from the sidebar",
      "The sidebar shows all your chat sessions with previews and dates",
      "You can switch between conversations — each one keeps its own separate history",
      "New Chat button starts a clean conversation with no memory of the old one"
    ],
    backend: [
      "Every message (user + AI) is saved to PostgreSQL with a session ID",
      "When you send a new message, the last 20 messages are loaded from the DB",
      "The full conversation history is included in the AI prompt as context",
      "Each user can have unlimited sessions — all stored and retrievable",
      "Sessions are secured by user ID — you only see your own history"
    ],
    capabilities: [
      "Remembers the last 20 messages for full conversation context",
      "Unlimited chat sessions per user — all permanently saved",
      "Chat history sidebar with session previews and timestamps",
      "Switch between past conversations without losing any messages",
      "Follow-up questions work naturally without re-explaining context"
    ]
  },
  {
    icon: Brain,
    title: "Semantic Understanding",
    short: "Matches intent, not just exact keywords. Variations of questions yield correct answers.",
    color: "from-purple-500 to-violet-600",
    badge: "🔍 Intelligence",
    what: "Semantic Understanding means EduAssistant understands what you mean, not just what you literally typed. It uses TF-IDF (Term Frequency–Inverse Document Frequency) to measure how meaningful each word is. So 'explain neural networks' and 'what are neural nets?' both find the same answer — because the intent is the same.",
    frontend: [
      "You can phrase questions naturally — no need for exact keyword matches",
      "Typos, abbreviations, and paraphrasing all still work",
      "The AI handles follow-up questions using conversation context",
      "Multilingual questions are understood and answered in the same language"
    ],
    backend: [
      "TF-IDF assigns importance weights to each word in your question",
      "Common words (the, is, a) get low scores; rare/important words get high scores",
      "A vector is computed for your question and compared to all KB entries",
      "Cosine similarity measures the angle between vectors — not exact word match",
      "The closest meaning wins, not just the most keyword overlap"
    ],
    capabilities: [
      "Understands paraphrased and rephrased questions",
      "Works across 50+ languages — auto-detects and responds in kind",
      "Handles abbreviations, informal language, and typos",
      "Intent-based matching — asks about concepts, not just words",
      "Combined with AI for questions beyond the knowledge base"
    ]
  },
  {
    icon: Smartphone,
    title: "Modern UI/UX",
    short: "Beautiful, responsive interface designed to keep students engaged and focused.",
    color: "from-pink-500 to-rose-600",
    badge: "🎨 Design",
    what: "Modern UI/UX means EduAssistant looks and feels like a professional app. The interface is clean, animated, responsive (works on phone, tablet, and desktop), and supports dark mode. It's built with the same design principles as ChatGPT — minimal, distraction-free, and easy to use.",
    frontend: [
      "Smooth animations using Framer Motion on every interaction",
      "ChatGPT-style welcome screen with quick action chips",
      "Streaming text that appears word-by-word as the AI types",
      "Responsive layout — works perfectly on mobile, tablet, and desktop",
      "Dark mode support with consistent theming throughout",
      "Voice input (mic button) and text-to-speech for AI responses",
      "Installable as a PWA from Chrome — works like a native app"
    ],
    backend: [
      "Vite + React builds an optimized production bundle",
      "Tailwind CSS generates only the CSS classes actually used",
      "Server-Sent Events (SSE) enable real-time streaming from the API",
      "React Query handles caching, loading states, and background refetches",
      "PWA manifest and service worker serve the app offline-ready"
    ],
    capabilities: [
      "Installable as an app from Chrome (PWA)",
      "Full voice assistant — speak questions, hear answers",
      "50+ language support with auto-detection",
      "Animated streaming responses with blinking cursor",
      "Slide-out chat history sidebar like ChatGPT",
      "Works on any device — phone, tablet, laptop, desktop"
    ]
  },
  {
    icon: Settings,
    title: "Extensible Base",
    short: "Easily update the knowledge base with new curriculum materials via the database.",
    color: "from-slate-600 to-slate-800",
    badge: "🗄️ Admin",
    what: "Extensible Base means the knowledge EduAssistant uses can be expanded at any time. Admins can add new Q&A pairs to the PostgreSQL database and the AI will immediately start using them — no code changes, no redeployment needed. There's also a built-in Admin Panel to manage users and sessions.",
    frontend: [
      "Admin Panel at /admin — view all users, sessions, and messages",
      "See total message counts, session counts, and registered users",
      "Admin-only access controlled by the isAdmin flag in the database",
      "Knowledge Base Preview section shows sample Q&A on the home page"
    ],
    backend: [
      "Knowledge base stored in PostgreSQL knowledgeBaseTable",
      "Add new entries with: pnpm run add-knowledge (scripts package)",
      "Seed entire knowledge base with: pnpm run seed-knowledge",
      "99+ entries across CS, AI, maths, science, history and more",
      "New entries are instantly available to all users — no restart needed",
      "Each entry has: question, answer, category, and embedding-ready text"
    ],
    capabilities: [
      "99+ curated knowledge entries already loaded",
      "Add unlimited new entries without touching code",
      "Covers any topic — CS, AI, science, math, history, language",
      "Admin panel for full user and session management",
      "Database-driven — update once, all users benefit instantly",
      "Category-tagged entries for organized knowledge management"
    ]
  }
];

type FeatureDetail = typeof FEATURE_DETAILS[0];

function FeatureModal({ feature, onClose }: { feature: FeatureDetail; onClose: () => void }) {
  const [tab, setTab] = useState<"frontend" | "backend">("frontend");
  const Icon = feature.icon;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 24 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className="relative bg-background rounded-2xl shadow-2xl w-full max-w-2xl max-h-[88vh] overflow-y-auto border border-border"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`bg-gradient-to-r ${feature.color} p-6 rounded-t-2xl`}>
            <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-white/70 text-xs font-bold uppercase tracking-widest">{feature.badge}</div>
                <h2 className="text-2xl font-bold text-white">{feature.title}</h2>
              </div>
            </div>
            <p className="text-white/80 text-sm mt-2">{feature.short}</p>
          </div>

          <div className="p-6 space-y-6">
            {/* What is it */}
            <div>
              <h3 className="font-bold text-foreground mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary inline-block" />
                What is it?
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.what}</p>
            </div>

            {/* Frontend / Backend tabs */}
            <div>
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setTab("frontend")}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${tab === "frontend" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
                >
                  ⚛️ Frontend
                </button>
                <button
                  onClick={() => setTab("backend")}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${tab === "backend" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
                >
                  🖥️ Backend
                </button>
              </div>
              <ol className="space-y-2">
                {(tab === "frontend" ? feature.frontend : feature.backend).map((item, i) => (
                  <li key={i} className="flex gap-3 text-sm text-muted-foreground">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* What it can do */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
              <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                What it can do
              </h3>
              <ul className="space-y-2">
                {feature.capabilities.map((cap, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    <span>{cap}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function PipelineModal({ stage, onClose }: { stage: typeof PIPELINE_DETAILS[0]; onClose: () => void }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 24 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className="relative bg-background rounded-2xl shadow-2xl w-full max-w-2xl max-h-[88vh] overflow-y-auto border border-border"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header gradient strip */}
          <div className={`bg-gradient-to-r ${stage.color} p-6 rounded-t-2xl`}>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="text-4xl mb-2">{stage.icon}</div>
            <div className="text-white/70 text-xs font-bold uppercase tracking-widest mb-1">{stage.subtitle}</div>
            <h2 className="text-2xl font-bold text-white">{stage.step}</h2>
            <p className="text-white/80 text-sm mt-1">{stage.desc}</p>
          </div>

          <div className="p-6 space-y-6">
            {/* What happens */}
            <div>
              <h3 className="font-bold text-foreground mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary inline-block" />
                What happens here
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{stage.what}</p>
            </div>

            {/* Step-by-step */}
            <div>
              <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary inline-block" />
                Step-by-step breakdown
              </h3>
              <ol className="space-y-2">
                {stage.how.map((item, i) => (
                  <li key={i} className="flex gap-3 text-sm text-muted-foreground">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Code snippet */}
            <div>
              <h3 className="font-bold text-foreground mb-2 flex items-center gap-2">
                <Code2 className="w-4 h-4 text-primary" />
                Backend code (simplified)
              </h3>
              <pre className="bg-muted rounded-xl p-4 text-xs font-mono text-muted-foreground overflow-x-auto whitespace-pre-wrap leading-relaxed border border-border">
                {stage.code}
              </pre>
            </div>

            {/* Output */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex gap-3 items-start">
              <ChevronRight className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div>
                <div className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Output to next stage</div>
                <p className="text-sm text-foreground">{stage.output}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Stagger variants for animations
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

export default function Home() {
  const { user } = useAuth();
  const [selectedStage, setSelectedStage] = useState<typeof PIPELINE_DETAILS[0] | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<FeatureDetail | null>(null);
  const [selectedCapability, setSelectedCapability] = useState<CapabilityDetail | null>(null);
  const [selectedAboutCard, setSelectedAboutCard] = useState<"smart" | "curated" | null>(null);
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* HERO SECTION */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-primary/20 blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full bg-accent/30 blur-[120px]" />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div 
              initial="hidden" animate="visible" variants={containerVariants}
              className="max-w-2xl"
            >
              <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm mb-6 border border-primary/20">
                <Sparkles className="w-4 h-4" />
                <span>Next-Generation Learning</span>
              </motion.div>
              
              <motion.h1 variants={itemVariants} className="text-5xl sm:text-6xl md:text-7xl font-bold leading-tight mb-6">
                Your Intelligent <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-400">
                  Educational Assistant
                </span>
              </motion.h1>
              
              <motion.p variants={itemVariants} className="text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed">
                Empower your learning journey with an AI-driven chatbot that understands context, retrieves precise knowledge, and delivers answers instantly.
              </motion.p>
              
              <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4">
                <Link
                  href={user ? "/chat" : "/signup"}
                  className="inline-flex items-center justify-center px-8 py-4 rounded-xl text-base font-bold bg-primary text-primary-foreground shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-1 transition-all duration-300"
                >
                  {user ? "Launch Chat" : "Get Started — It's Free"}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
                <a 
                  href="#about" 
                  className="inline-flex items-center justify-center px-8 py-4 rounded-xl text-base font-bold bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:-translate-y-1 transition-all duration-300"
                >
                  Learn More
                </a>
              </motion.div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <img 
                src={`${import.meta.env.BASE_URL}images/hero-abstract.png`} 
                alt="Abstract AI Visualization" 
                className="w-full h-auto object-cover rounded-3xl shadow-2xl shadow-primary/10"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ABOUT SECTION */}
      <section id="about" className="py-24 bg-card relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">About The Project</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              The AI-Powered Education Assistant is designed to bridge the gap between vast educational resources and student comprehension. By leveraging natural language processing techniques, we've created a system that doesn't just search—it understands.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed mt-4">
              Instead of relying on generic web searches, our chatbot interfaces with a highly curated, domain-specific dataset. It utilizes advanced text similarity algorithms (inspired by TF-IDF and Cosine Similarity) to match student queries with the most accurate, context-aware responses.
            </p>
          </div>

          <p className="text-center text-sm text-muted-foreground mb-6">
            👆 Click either card to learn exactly what it means
          </p>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <motion.button
              whileHover={{ scale: 1.03, y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedAboutCard("smart")}
              className="glass-card p-8 rounded-2xl flex items-start gap-4 text-left cursor-pointer group w-full hover:border-primary/50 hover:shadow-lg transition-all"
            >
              <div className="p-3 bg-primary/10 rounded-xl text-primary shrink-0">
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Smart Parsing</h3>
                <p className="text-muted-foreground">Understands the deep intent behind student questions rather than just matching keywords.</p>
                <span className="text-xs text-primary/60 group-hover:text-primary font-medium mt-2 inline-block transition-colors">tap to learn more →</span>
              </div>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03, y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedAboutCard("curated")}
              className="glass-card p-8 rounded-2xl flex items-start gap-4 text-left cursor-pointer group w-full hover:border-primary/50 hover:shadow-lg transition-all"
            >
              <div className="p-3 bg-accent rounded-xl text-primary shrink-0">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Curated Data</h3>
                <p className="text-muted-foreground">Relies on a high-quality, factual knowledge base ensuring zero hallucinations.</p>
                <span className="text-xs text-primary/60 group-hover:text-primary font-medium mt-2 inline-block transition-colors">tap to learn more →</span>
              </div>
            </motion.button>
          </div>
        </div>
      </section>

      {/* OBJECTIVES & SCOPE */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16">
            <div>
              <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-primary" />
                Key Objectives
              </h2>
              <ul className="space-y-4">
                {[
                  "Provide instant, accurate answers to student queries.",
                  "Reduce instructor workload by automating repetitive questions.",
                  "Ensure high reliability by using a closed, trusted dataset.",
                  "Deliver an intuitive, chat-based interface familiar to modern users."
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 p-4 rounded-xl hover:bg-secondary/50 transition-colors">
                    <div className="w-2 h-2 mt-2 rounded-full bg-primary shrink-0" />
                    <span className="text-lg text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
                <Maximize className="w-8 h-8 text-primary" />
                System Scope
              </h2>
              <ul className="space-y-4">
                {[
                  "Focused purely on educational Q&A based on provided materials.",
                  "Web-based application accessible across desktop and mobile.",
                  "Maintains history of interactions for contextual awareness.",
                  "Does NOT execute arbitrary code or browse the live internet."
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 p-4 rounded-xl hover:bg-secondary/50 transition-colors">
                    <div className="w-2 h-2 mt-2 rounded-full bg-accent-foreground shrink-0" />
                    <span className="text-lg text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ARCHITECTURE */}
      <section id="architecture" className="py-24 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">System Architecture</h2>
            <p className="text-lg text-muted-foreground">A clean, scalable full-stack implementation using modern web technologies.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="glass-card p-8 rounded-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full transition-transform group-hover:scale-110" />
              <Layers className="w-10 h-10 text-primary mb-6" />
              <h3 className="text-xl font-bold mb-2">Presentation Layer</h3>
              <p className="text-sm font-semibold text-primary mb-4">React + Tailwind</p>
              <p className="text-muted-foreground">Responsive, highly interactive UI providing a ChatGPT-like experience. Uses React Query for seamless API communication.</p>
            </div>
            
            <div className="glass-card p-8 rounded-2xl relative overflow-hidden group border-primary/20 shadow-primary/5">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full transition-transform group-hover:scale-110" />
              <Code2 className="w-10 h-10 text-primary mb-6" />
              <h3 className="text-xl font-bold mb-2">Application Layer</h3>
              <p className="text-sm font-semibold text-primary mb-4">Node.js + Express</p>
              <p className="text-muted-foreground">Processes incoming queries, executes text-similarity algorithms against the knowledge base, and manages chat sessions.</p>
            </div>

            <div className="glass-card p-8 rounded-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full transition-transform group-hover:scale-110" />
              <Database className="w-10 h-10 text-primary mb-6" />
              <h3 className="text-xl font-bold mb-2">Data Layer</h3>
              <p className="text-sm font-semibold text-primary mb-4">PostgreSQL + Drizzle</p>
              <p className="text-muted-foreground">Securely stores the structured Knowledge Base and user Chat Histories. Ensuring fast and reliable retrieval.</p>
            </div>
          </div>
        </div>
      </section>

      {/* KEY FEATURES */}
      <section id="features" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Key Features</h2>
            <p className="text-lg text-muted-foreground">Everything you need to deploy an intelligent campus assistant.</p>
          </div>


          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURE_DETAILS.map((feat, i) => (
              <motion.button
                key={i}
                whileHover={{ scale: 1.03, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedFeature(feat)}
                className="p-6 rounded-2xl border border-border bg-card hover:border-primary/50 hover:shadow-lg transition-all text-left group cursor-pointer w-full"
              >
                <feat.icon className="w-8 h-8 text-primary mb-4" />
                <h3 className="text-lg font-bold mb-2">{feat.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-3">{feat.short}</p>
                <span className="text-xs text-primary/60 group-hover:text-primary font-medium transition-colors">
                  tap to explore →
                </span>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS / PIPELINE */}
      <section id="how-it-works" className="py-24 bg-primary text-primary-foreground overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-primary-foreground/80 text-lg">A sophisticated AI pipeline that matches student queries to curated knowledge.</p>
          </div>
          <p className="text-center text-primary-foreground/50 text-sm mb-10">
            👆 Click any step to see exactly what happens in the backend
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-2 lg:gap-4 overflow-x-auto pb-8">
            {PIPELINE_DETAILS.map((stage, i, arr) => (
              <div key={i} className="flex flex-col md:flex-row items-center">
                <motion.button
                  whileHover={{ scale: 1.06, y: -4 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setSelectedStage(stage)}
                  className="bg-primary-foreground/10 hover:bg-primary-foreground/20 border border-primary-foreground/20 hover:border-primary-foreground/50 backdrop-blur-sm p-4 rounded-xl w-40 text-center cursor-pointer transition-colors group"
                >
                  <div className="text-2xl mb-1">{stage.icon}</div>
                  <div className="text-xs font-bold text-primary-foreground/60 uppercase tracking-wider mb-1">Step {i + 1}</div>
                  <div className="font-bold mb-1 group-hover:text-white">{stage.step}</div>
                  <div className="text-xs text-primary-foreground/70">{stage.desc}</div>
                  <div className="mt-2 text-[10px] text-primary-foreground/40 group-hover:text-primary-foreground/70 transition-colors">
                    tap to explore →
                  </div>
                </motion.button>
                {i < arr.length - 1 && (
                  <ArrowRight className="w-6 h-6 my-4 md:my-0 md:mx-2 lg:mx-4 text-primary-foreground/50 rotate-90 md:rotate-0 shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pipeline detail modal */}
      {selectedStage && (
        <PipelineModal stage={selectedStage} onClose={() => setSelectedStage(null)} />
      )}

      {/* Feature detail modal */}
      {selectedFeature && (
        <FeatureModal feature={selectedFeature} onClose={() => setSelectedFeature(null)} />
      )}

      {/* Capability detail modal */}
      {selectedCapability && (
        <CapabilityModal capability={selectedCapability} onClose={() => setSelectedCapability(null)} />
      )}

      {/* About card modals — Smart Parsing & Curated Data */}
      {selectedAboutCard && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedAboutCard(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 24 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="relative bg-background rounded-2xl shadow-2xl w-full max-w-2xl max-h-[88vh] overflow-y-auto border border-border"
              onClick={(e) => e.stopPropagation()}
            >
              {selectedAboutCard === "smart" ? (
                <>
                  <div className="bg-gradient-to-r from-violet-500 to-indigo-600 p-6 rounded-t-2xl">
                    <button onClick={() => setSelectedAboutCard(null)} className="absolute top-4 right-4 text-white/70 hover:text-white"><X className="w-5 h-5" /></button>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                        <Brain className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="text-white/70 text-xs font-bold uppercase tracking-widest">🧠 How EduAssistant Thinks</div>
                        <h2 className="text-2xl font-bold text-white">Smart Parsing</h2>
                      </div>
                    </div>
                    <p className="text-white/80 text-sm mt-2">Understands the deep intent behind your question — not just the words you used.</p>
                  </div>
                  <div className="p-6 space-y-6">
                    <div>
                      <h3 className="font-bold text-foreground mb-2 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-primary inline-block" />What is Smart Parsing?</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">Smart Parsing is the ability to understand <strong>what you really mean</strong> — not just what you literally typed. Most basic search systems only look for exact word matches. Smart Parsing goes deeper: it figures out the <em>intent</em> and <em>meaning</em> behind your words, so you get the right answer even if you phrased the question differently.</p>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                      <h3 className="font-bold text-foreground mb-2 flex items-center gap-2">💡 Real-life analogy</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">Imagine asking a librarian <em>"What's that thing that makes computers learn?"</em> — a smart librarian understands you mean <strong>Machine Learning</strong> and brings you the right book. A basic keyword search would find nothing because the words don't match exactly.</p>
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground mb-3 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-primary inline-block" />How it works in EduAssistant</h3>
                      <ol className="space-y-2">
                        {[
                          "Your question is converted into a mathematical vector using TF-IDF (Term Frequency–Inverse Document Frequency)",
                          "TF-IDF gives higher importance to rare, meaningful words and ignores common filler words (the, is, a)",
                          "Every entry in the knowledge base also has its own vector",
                          "Cosine Similarity measures the angle between your question vector and each knowledge base vector",
                          "The closest angle = the most similar meaning — that entry wins, even if the words differ"
                        ].map((step, i) => (
                          <li key={i} className="flex gap-3 text-sm text-muted-foreground">
                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center mt-0.5">{i + 1}</span>
                            <span className="leading-relaxed">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                      <h3 className="font-bold text-foreground mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" />What this means for you</h3>
                      <ul className="space-y-2">
                        {[
                          "Ask in any phrasing — you don't need to use exact keywords",
                          "Typos and informal language still work",
                          "Follow-up questions like 'explain that differently' are understood",
                          "Ask in Urdu, Hindi, Arabic, or any language — it still parses correctly",
                          "You get the most relevant answer, not just a random keyword match"
                        ].map((cap, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                            <span>{cap}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-gradient-to-r from-blue-500 to-cyan-600 p-6 rounded-t-2xl">
                    <button onClick={() => setSelectedAboutCard(null)} className="absolute top-4 right-4 text-white/70 hover:text-white"><X className="w-5 h-5" /></button>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                        <Database className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="text-white/70 text-xs font-bold uppercase tracking-widest">📚 Verified Knowledge</div>
                        <h2 className="text-2xl font-bold text-white">Curated Data</h2>
                      </div>
                    </div>
                    <p className="text-white/80 text-sm mt-2">Answers grounded in a hand-verified knowledge base — not random internet results.</p>
                  </div>
                  <div className="p-6 space-y-6">
                    <div>
                      <h3 className="font-bold text-foreground mb-2 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-primary inline-block" />What is Curated Data?</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">Curated Data means the information EduAssistant uses has been <strong>hand-picked, verified, and organised</strong> by humans — not scraped randomly from the internet. Every Q&A entry in the knowledge base was carefully written or approved to ensure it is accurate, clear, and trustworthy. This is the opposite of an AI that "makes things up."</p>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                      <h3 className="font-bold text-foreground mb-2 flex items-center gap-2">💡 Real-life analogy</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">Think of the difference between a <strong>Wikipedia article</strong> (written and reviewed by experts) vs. a random forum post. Curated data is like having a professor personally write every answer — you know it's correct before the AI even uses it.</p>
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground mb-3 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-primary inline-block" />How it works in EduAssistant</h3>
                      <ol className="space-y-2">
                        {[
                          "99+ Q&A pairs are stored in a PostgreSQL database — each one hand-crafted",
                          "Every entry has a category tag (AI, maths, science, history, coding, etc.)",
                          "When you ask a question, the top matching entries are found and sent to the AI",
                          "The AI is instructed to base its answer on these verified facts — not guess",
                          "A confidence score (%) is shown on every response so you know how much of it came from verified data"
                        ].map((step, i) => (
                          <li key={i} className="flex gap-3 text-sm text-muted-foreground">
                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center mt-0.5">{i + 1}</span>
                            <span className="leading-relaxed">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                      <h3 className="font-bold text-foreground mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" />What this means for you</h3>
                      <ul className="space-y-2">
                        {[
                          "Answers are based on verified facts — not random internet content",
                          "The AI cannot hallucinate (make up) answers grounded in the knowledge base",
                          "Every response shows a % confidence so you know how reliable it is",
                          "Knowledge grows over time — admins can add new verified entries anytime",
                          "You're learning from quality-controlled educational material, not guesses"
                        ].map((cap, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                            <span>{cap}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        </AnimatePresence>
      )}

      {/* TECH STACK */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Technology Stack</h2>
            <p className="text-muted-foreground text-lg">Modern technologies powering EduAssistant.</p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
            {[
              "⚛️ React", "📘 TypeScript", "🟢 Node.js", "🚂 Express", 
              "🐘 PostgreSQL", "📊 TF-IDF", "📐 Cosine Similarity", 
              "🎨 Tailwind CSS", "⚡ React Query"
            ].map((tech, i) => (
              <div key={i} className="px-6 py-3 bg-secondary rounded-full font-semibold text-secondary-foreground border border-border/50 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300 cursor-default">
                {tech}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* KNOWLEDGE BASE PREVIEW */}
      <section className="py-24 bg-card">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Knowledge Base Preview</h2>
              <p className="text-muted-foreground">Sample of curated academic questions and answers.</p>
            </div>
            <div className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 bg-primary/10 text-primary rounded-lg font-medium text-sm">
              📚 Dataset Size: 50+ Questions
            </div>
          </div>
          
          <div className="overflow-x-auto rounded-xl border border-border bg-background shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-secondary/50 border-b border-border">
                  <th className="p-4 font-semibold text-foreground w-1/3">Question</th>
                  <th className="p-4 font-semibold text-foreground">Answer Preview</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  ["What is Artificial Intelligence?", "AI is the simulation of human intelligence in machines..."],
                  ["What is Machine Learning?", "Machine learning is a subset of AI that enables systems to learn from data..."],
                  ["What is Python?", "Python is a popular programming language used in web development..."],
                  ["Define compiler", "A compiler converts high-level code into machine code..."],
                  ["What is Natural Language Processing?", "NLP enables computers to understand human language..."]
                ].map(([q, a], i) => (
                  <tr key={i} className="hover:bg-secondary/20 transition-colors">
                    <td className="p-4 text-sm font-medium text-foreground">{q}</td>
                    <td className="p-4 text-sm text-muted-foreground truncate max-w-xs">{a}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* PLATFORM CAPABILITIES */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Platform Capabilities</h2>
            <p className="text-muted-foreground">Everything that's live and working in EduAssistant right now.</p>
          </div>
          
          <p className="text-center text-sm text-muted-foreground mb-8 -mt-8">
            👆 Click any capability to understand what it does and how it works
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {CAPABILITY_DETAILS.map((item, i) => (
              <motion.button
                key={i}
                whileHover={{ scale: 1.03, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedCapability(item)}
                className="p-6 border border-border rounded-2xl hover:border-primary hover:shadow-md transition-all text-left group cursor-pointer w-full"
              >
                <item.icon className="w-8 h-8 text-primary mb-3 group-hover:scale-110 transition-transform" />
                <h4 className="font-semibold text-foreground mb-2">{item.label}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">{item.desc}</p>
                <span className="text-xs text-primary/60 group-hover:text-primary font-medium transition-colors">
                  tap to explore →
                </span>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT DEVELOPER */}
      <section className="py-24 bg-card border-t border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass-panel p-8 md:p-12 rounded-3xl grid md:grid-cols-5 gap-12 items-center">
            <div className="md:col-span-2 flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-primary blur-2xl opacity-20" />
                <img 
                  src={`${import.meta.env.BASE_URL}images/developer-avatar.png`} 
                  alt="Developer Avatar" 
                  className="w-48 h-48 rounded-full object-cover border-4 border-background shadow-xl relative z-10"
                />
              </div>
            </div>
            <div className="md:col-span-3">
              <h2 className="text-3xl font-bold mb-2">About the Developer</h2>
              <div className="text-primary font-medium mb-6">Developer: Muzamil Arshid</div>
              <p className="text-muted-foreground leading-relaxed mb-8">
                This project demonstrates the practical application of Natural Language Processing, Machine Learning, and Full-Stack Web Development. Built with modern technologies including React, Node.js, Express, PostgreSQL, and TF-IDF vectorization for intelligent academic assistance.
              </p>
              
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-foreground mb-1">10+</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Technologies</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground mb-1">50+</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Knowledge Items</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground mb-1">100%</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Open Source</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
