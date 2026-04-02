import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { useState } from "react";
import { 
  ArrowRight, Sparkles, Brain, CheckCircle2, 
  Layers, Database, Code2, Zap, ShieldCheck, 
  Clock, Maximize, Smartphone, Settings, Mic, 
  Globe2, BarChart3, Network, Users, X, ChevronRight
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
      "Both model calls happen server-side using Replit AI Integration proxies (no API keys exposed to client)"
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

// ── Pipeline Step Detail Modal ───────────────────────────────────────────────
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

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="glass-card p-8 rounded-2xl flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-xl text-primary shrink-0">
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Smart Parsing</h3>
                <p className="text-muted-foreground">Understands the deep intent behind student questions rather than just matching keywords.</p>
              </div>
            </div>
            <div className="glass-card p-8 rounded-2xl flex items-start gap-4">
              <div className="p-3 bg-accent rounded-xl text-primary shrink-0">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Curated Data</h3>
                <p className="text-muted-foreground">Relies on a high-quality, factual knowledge base ensuring zero hallucinations.</p>
              </div>
            </div>
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
            {[
              { icon: Zap, title: "Instant Retrieval", desc: "Millisecond response times utilizing optimized backend similarity matching." },
              { icon: ShieldCheck, title: "Factual Accuracy", desc: "Zero hallucination guarantee. Answers are strictly bounded to the provided dataset." },
              { icon: Clock, title: "Contextual Memory", desc: "Maintains a history of interactions to provide a continuous learning conversation." },
              { icon: Brain, title: "Semantic Understanding", desc: "Matches intent, not just exact keywords. Variations of questions yield correct answers." },
              { icon: Smartphone, title: "Modern UI/UX", desc: "Beautiful, responsive interface designed to keep students engaged and focused." },
              { icon: Settings, title: "Extensible Base", desc: "Easily update the knowledge base with new curriculum materials via the database." }
            ].map((feat, i) => (
              <div key={i} className="p-6 rounded-2xl border border-border bg-card hover:border-primary/50 transition-colors">
                <feat.icon className="w-8 h-8 text-primary mb-4" />
                <h3 className="text-lg font-bold mb-2">{feat.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feat.desc}</p>
              </div>
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

      {/* TECH STACK */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Technology Stack</h2>
            <p className="text-muted-foreground text-lg">Modern technologies powering the AI Education Assistant.</p>
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

      {/* FUTURE ENHANCEMENTS */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Future Enhancements</h2>
            <p className="text-muted-foreground">Planned features to expand capabilities.</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { icon: Mic, label: "Voice Interaction" },
              { icon: Globe2, label: "Multilingual Support" },
              { icon: BarChart3, label: "Analytics Dashboard" },
              { icon: Network, label: "Deep Learning Model" },
              { icon: Layers, label: "LMS Integration" },
              { icon: Users, label: "Collaborative Features" }
            ].map((item, i) => (
              <div key={i} className="p-6 text-center border border-border rounded-2xl hover:border-primary hover:shadow-md transition-all">
                <item.icon className="w-8 h-8 mx-auto text-primary mb-3" />
                <h4 className="font-semibold">{item.label}</h4>
              </div>
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
