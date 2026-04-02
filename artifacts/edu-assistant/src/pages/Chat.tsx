import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import {
  Send,
  Bot,
  User,
  Loader2,
  ShieldCheck,
  RefreshCw,
  LogOut,
  Sparkles,
  BookOpen,
  Code2,
  Brain,
  Lightbulb,
  ChevronRight,
  Mic,
  MicOff,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useChat } from "@/hooks/use-chat";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

const SUGGESTIONS = [
  { icon: Brain, label: "What is machine learning?", category: "AI" },
  { icon: Code2, label: "Explain algorithms with examples", category: "CS" },
  { icon: BookOpen, label: "How does deep learning work?", category: "AI" },
  { icon: Lightbulb, label: "What is a neural network?", category: "AI" },
  { icon: Code2, label: "Difference between stack and queue", category: "DS" },
  { icon: Brain, label: "What is natural language processing?", category: "AI" },
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

// ── Web Speech API type shim ────────────────────────────────────────────────
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: Event) => void) | null;
  onend: (() => void) | null;
}
declare const webkitSpeechRecognition: new () => SpeechRecognitionInstance;
declare const SpeechRecognition: new () => SpeechRecognitionInstance;

export default function Chat() {
  const [, navigate] = useLocation();
  const { user, logout, loading: authLoading } = useAuth();
  const { messages, isInitializing, isLoadingMessages, isSending, sendMessage, error } = useChat();
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported] = useState(
    () => typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
  );
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const toggleListening = useCallback(() => {
    if (!voiceSupported) return;

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const Ctor = (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionInstance; webkitSpeechRecognition?: new () => SpeechRecognitionInstance }).SpeechRecognition
      ?? (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionInstance }).webkitSpeechRecognition;
    if (!Ctor) return;

    const recognition = new Ctor();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = true;

    let finalTranscript = "";

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      let interim = "";
      for (let i = e.results.length - 1; i >= 0; i--) {
        const r = e.results[i];
        if (r.isFinal) {
          finalTranscript += r[0].transcript;
        } else {
          interim = r[0].transcript;
        }
      }
      setInput((prev) => {
        const base = prev.replace(/\[listening…[^\]]*\]/g, "").trimEnd();
        return interim
          ? `${base} ${finalTranscript}[listening… ${interim}]`.trimStart()
          : `${base} ${finalTranscript}`.trimStart();
      });
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      // clean up any leftover interim placeholder
      setInput((prev) => prev.replace(/\[listening…[^\]]*\]/g, "").trimEnd());
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isListening, voiceSupported]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/");
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSending || isInitializing) return;
    const message = input.trim();
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "44px";
    await sendMessage(message);
  };

  const handleSuggestion = (text: string) => {
    setInput(text);
    textareaRef.current?.focus();
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "44px";
    e.target.style.height = Math.min(e.target.scrollHeight, 128) + "px";
  };

  const isReady = !isInitializing && !isLoadingMessages;

  if (authLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 h-16 border-b border-border/50 bg-background/80 backdrop-blur-md flex items-center px-4 md:px-6 justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="bg-primary/15 p-2 rounded-xl">
                <Bot className="w-5 h-5 text-primary" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background" />
            </div>
            <div>
              <h1 className="font-bold text-sm text-foreground">EduAssistant AI</h1>
              <p className="text-xs text-green-500 font-medium">● Online</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-secondary/60 border border-border text-sm">
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-primary text-xs font-bold">{user.username[0].toUpperCase()}</span>
            </div>
            <span className="font-medium text-foreground">{user.username}</span>
          </div>
          <button
            onClick={logout}
            className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 w-full max-w-4xl mx-auto">
        {isInitializing || isLoadingMessages ? (
          <div className="h-full flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Bot className="w-6 h-6 text-primary" />
              </div>
              <Loader2 className="w-4 h-4 animate-spin text-primary absolute -bottom-1 -right-1 bg-background rounded-full" />
            </div>
            <p className="text-sm">Getting your session ready…</p>
          </div>
        ) : error ? (
          <div className="h-full flex flex-col items-center justify-center gap-4 text-destructive">
            <p>Failed to load chat session.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-xl hover:bg-secondary/80 flex items-center gap-2 text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Try again
            </button>
          </div>
        ) : messages.length === 0 ? (
          /* ── Welcome / Empty State ── */
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="h-full flex flex-col items-center justify-center text-center px-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="relative mb-6"
            >
              <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center border border-primary/20 shadow-lg">
                <Bot className="w-10 h-10 text-primary" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-background">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="mb-8"
            >
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                {getGreeting()}, {user.username}! 👋
              </h2>
              <p className="text-muted-foreground text-base max-w-md mx-auto leading-relaxed">
                I'm <span className="text-primary font-semibold">EduAssistant</span> — your AI-powered tutor for Computer Science & Artificial Intelligence. What would you like to learn today?
              </p>
            </motion.div>

            {/* AI Greeting Card */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="w-full max-w-lg mb-8 p-4 rounded-2xl bg-primary/5 border border-primary/20 text-left"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm text-foreground leading-relaxed">
                    Hi there! I'm powered by both <strong>OpenAI GPT</strong> and <strong>Google Gemini</strong> working together. I can explain any CS or AI concept clearly — from beginner basics to advanced topics. Just ask me anything! 🚀
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Suggestion Chips */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className="w-full max-w-lg"
            >
              <p className="text-xs text-muted-foreground font-medium mb-3 text-left">Try asking:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestion(s.label)}
                    className="flex items-center gap-3 p-3 text-sm text-left border border-border rounded-xl bg-card hover:bg-secondary/50 hover:border-primary/40 hover:shadow-sm transition-all group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                      <s.icon className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <span className="text-foreground flex-1 leading-tight">{s.label}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 shrink-0 transition-opacity" />
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        ) : (
          /* ── Messages ── */
          <div className="space-y-6 pb-4">
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className={cn(
                    "flex items-start gap-3 max-w-3xl",
                    msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                  )}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 text-sm font-bold",
                      msg.role === "user"
                        ? "bg-primary/20 text-primary"
                        : "bg-primary text-primary-foreground"
                    )}
                  >
                    {msg.role === "user"
                      ? user.username[0].toUpperCase()
                      : <Bot className="w-4 h-4" />}
                  </div>

                  <div
                    className={cn(
                      "px-5 py-4 rounded-2xl shadow-sm max-w-[85%]",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                        : "bg-card border border-border/50 text-foreground rounded-tl-sm"
                    )}
                  >
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm md:prose-base dark:prose-invert prose-p:leading-relaxed prose-headings:font-bold max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content}
                        </ReactMarkdown>
                        {msg.confidence !== null && msg.confidence !== undefined && msg.confidence > 0 && (
                          <div className="mt-3 pt-3 border-t border-border/60 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
                            Knowledge confidence: {Math.round(msg.confidence * 100)}%
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isSending && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 max-w-3xl mr-auto"
              >
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 mt-1">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="px-5 py-4 rounded-2xl bg-card border border-border/50 rounded-tl-sm flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground mr-1">Thinking</span>
                  {[0, 150, 300].map((delay, i) => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-full bg-primary/60 animate-bounce"
                      style={{ animationDelay: `${delay}ms` }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 bg-background/90 backdrop-blur-md border-t border-border p-4 w-full">
        <div className="max-w-4xl mx-auto">

          {/* Recording indicator */}
          <AnimatePresence>
            {isListening && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                className="flex items-center gap-2 mb-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 w-fit mx-auto"
              >
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs font-medium text-red-500">Listening… speak now</span>
                <button
                  type="button"
                  onClick={toggleListening}
                  className="ml-1 text-red-500/70 hover:text-red-500 transition-colors text-xs underline"
                >
                  stop
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <form
            onSubmit={handleSubmit}
            className={cn(
              "flex items-end gap-2 bg-card border-2 transition-all rounded-2xl p-2",
              isListening
                ? "border-red-500/60 shadow-md shadow-red-500/10"
                : "border-border focus-within:border-primary/60 focus-within:shadow-md"
            )}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleTextareaChange}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder={
                isListening
                  ? "Listening to your voice…"
                  : isReady
                  ? "Message EduAssistant… or tap 🎤 to speak"
                  : "Connecting…"
              }
              disabled={!isReady || isSending}
              className="flex-1 bg-transparent resize-none outline-none p-3 text-foreground placeholder:text-muted-foreground"
              style={{ minHeight: "44px", maxHeight: "128px" }}
              rows={1}
            />

            {/* Mic button — only shown when speech is supported */}
            {voiceSupported && (
              <button
                type="button"
                onClick={toggleListening}
                disabled={!isReady || isSending}
                title={isListening ? "Stop listening" : "Speak your question"}
                className={cn(
                  "p-3 rounded-xl transition-all mb-1 shrink-0 relative",
                  isListening
                    ? "bg-red-500 text-white hover:bg-red-600"
                    : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed"
                )}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-4 h-4" />
                    <span className="absolute inset-0 rounded-xl bg-red-500 animate-ping opacity-25" />
                  </>
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </button>
            )}

            <button
              type="submit"
              disabled={!input.trim() || !isReady || isSending}
              className="p-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all mb-1 mr-1 shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <p className="text-center text-xs text-muted-foreground mt-2">
            Powered by OpenAI GPT &amp; Google Gemini · Answers grounded in curated CS/AI materials
          </p>
        </div>
      </div>
    </div>
  );
}
