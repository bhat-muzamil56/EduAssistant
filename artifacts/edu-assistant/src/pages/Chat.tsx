import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import {
  Send, Bot, Loader2, ShieldCheck, RefreshCw, LogOut, Sparkles,
  Brain, Code2, Calculator, FlaskConical, Utensils, Landmark, PenLine,
  Heart, Shuffle, FileText, Menu, X, MessageSquare, Plus, Clock,
  Copy, Check, Download, ThumbsUp, ThumbsDown, Search, Edit2, ArrowDown,
  Globe, Mic, MicOff, Volume2, VolumeX, Radio, ChevronDown, ChevronRight,
  Trash2, RotateCcw, UserX, User, Settings, Sun, Moon, Pin, PinOff,
  Share2, Keyboard, FileSearch, Lock, Eye, EyeOff, Link, LinkOff,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import "katex/dist/katex.min.css";
import { useChat } from "@/hooks/use-chat";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";

// ── Supported languages ──────────────────────────────────────────────────────
const LANGUAGES = [
  { code: "en-US", name: "English", flag: "🇺🇸" },
  { code: "hi-IN", name: "हिन्दी", flag: "🇮🇳" },
  { code: "ta-IN", name: "தமிழ்", flag: "🇮🇳" },
  { code: "te-IN", name: "తెలుగు", flag: "🇮🇳" },
  { code: "ml-IN", name: "മലയാളം", flag: "🇮🇳" },
  { code: "kn-IN", name: "ಕನ್ನಡ", flag: "🇮🇳" },
  { code: "gu-IN", name: "ગુજરાતી", flag: "🇮🇳" },
  { code: "mr-IN", name: "मराठी", flag: "🇮🇳" },
  { code: "pa-IN", name: "ਪੰਜਾਬੀ", flag: "🇮🇳" },
  { code: "bn-IN", name: "বাংলা", flag: "🇮🇳" },
  { code: "ur-PK", name: "اردو (PK)", flag: "🇵🇰" },
  { code: "zh-CN", name: "中文 (简体)", flag: "🇨🇳" },
  { code: "ja-JP", name: "日本語", flag: "🇯🇵" },
  { code: "ko-KR", name: "한국어", flag: "🇰🇷" },
  { code: "ar-SA", name: "العربية", flag: "🇸🇦" },
  { code: "fr-FR", name: "Français", flag: "🇫🇷" },
  { code: "de-DE", name: "Deutsch", flag: "🇩🇪" },
  { code: "es-ES", name: "Español", flag: "🇪🇸" },
  { code: "pt-BR", name: "Português (BR)", flag: "🇧🇷" },
  { code: "ru-RU", name: "Русский", flag: "🇷🇺" },
  { code: "tr-TR", name: "Türkçe", flag: "🇹🇷" },
  { code: "id-ID", name: "Indonesia", flag: "🇮🇩" },
  { code: "vi-VN", name: "Tiếng Việt", flag: "🇻🇳" },
  { code: "th-TH", name: "ภาษาไทย", flag: "🇹🇭" },
  { code: "sw-KE", name: "Kiswahili", flag: "🇰🇪" },
];

const SUGGESTIONS = [
  { icon: Brain, label: "What is machine learning?", category: "AI" },
  { icon: Calculator, label: "Solve: What is 25% of 480?", category: "Math" },
  { icon: FlaskConical, label: "How does photosynthesis work?", category: "Science" },
  { icon: Code2, label: "Write a Python function to sort a list", category: "Code" },
  { icon: Landmark, label: "Who was the first person on the Moon?", category: "History" },
  { icon: Utensils, label: "How do I make a simple pasta sauce?", category: "Cooking" },
  { icon: PenLine, label: "Write a short poem about the ocean", category: "Creative" },
  { icon: Heart, label: "What are 5 habits for better sleep?", category: "Health" },
];

const QUICK_ACTIONS = [
  { icon: Brain, label: "Explain a concept", color: "#8b5cf6", prompt: "Explain " },
  { icon: PenLine, label: "Help me write", color: "#ec4899", prompt: "Help me write " },
  { icon: Calculator, label: "Solve a problem", color: "#3b82f6", prompt: "Solve: " },
  { icon: FileText, label: "Summarize", color: "#10b981", prompt: "Summarize " },
  { icon: Code2, label: "Write code", color: "#f59e0b", prompt: "Write code to " },
  { icon: Shuffle, label: "Surprise me", color: "#ef4444", prompt: "__surprise__" },
];

const SURPRISE_QUESTIONS = [
  "What is the most distant object ever observed in the universe?",
  "How do black holes actually form?",
  "What is quantum entanglement in simple terms?",
  "Why do we dream and what happens in our brain when we sleep?",
  "How does the internet actually work from your browser to a server?",
  "What is the difference between DNA and RNA?",
  "How did ancient Egyptians build the pyramids?",
  "What would happen if you fell into a black hole?",
  "Write a short story about an AI that discovers emotions",
  "Explain the butterfly effect with a real-world example",
];

const MAX_CHARS = 2000;

// ── Types ────────────────────────────────────────────────────────────────────
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

// ── Code block with syntax highlighting ─────────────────────────────────────
function CodeBlock({ inline, className, children }: { inline?: boolean; className?: string; children?: React.ReactNode }) {
  const match = /language-(\w+)/.exec(className || "");
  const code = String(children).replace(/\n$/, "");
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!inline && match) {
    return (
      <div className="relative group/code my-3 rounded-xl overflow-hidden border border-border/40">
        <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-white/10">
          <span className="text-xs text-zinc-400 font-mono font-medium">{match[1]}</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-white/10"
          >
            {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <SyntaxHighlighter
          style={oneDark as Record<string, React.CSSProperties>}
          language={match[1]}
          PreTag="div"
          customStyle={{ margin: 0, borderRadius: 0, background: "#1a1a2e", fontSize: "0.85rem" }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    );
  }

  return (
    <code className={cn("bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[0.85em] font-mono", className)}>
      {children}
    </code>
  );
}

// ── Message timestamp ────────────────────────────────────────────────────────
function MessageTime({ iso }: { iso: string }) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  let label = "";
  if (diff < 60000) label = "just now";
  else if (diff < 3600000) label = `${Math.floor(diff / 60000)}m ago`;
  else if (diff < 86400000) label = d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  else label = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return <span className="text-[10px] text-muted-foreground/50 ml-1">{label}</span>;
}

// ── Confirm dialog ────────────────────────────────────────────────────────────
function ConfirmDialog({ title, description, onConfirm, onCancel, danger = false }: {
  title: string; description: string; onConfirm: () => void; onCancel: () => void; danger?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-background border border-border rounded-2xl shadow-2xl p-6 max-w-sm w-full"
      >
        <h3 className="font-bold text-foreground text-lg mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground mb-6">{description}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-secondary text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={cn(
              "flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors",
              danger
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            {danger ? "Delete" : "Confirm"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Chat() {
  const [, navigate] = useLocation();
  const { user, token, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const {
    sessionId, messages, sessions, isGuest, isInitializing, isLoadingMessages, isSending,
    streamingContent, sendMessage, newChat, switchSession, renameSession,
    deleteSession, pinSession, shareSession, revokeShare, summarizeSession, regenerate, error,
  } = useChat();

  // ── Core state ─────────────────────────────────────────────────────────────
  const [input, setInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState(LANGUAGES[0]);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [voiceInputPending, setVoiceInputPending] = useState(false);

  // ── Feature state ──────────────────────────────────────────────────────────
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [feedbackMap, setFeedbackMap] = useState<Record<string, "up" | "down">>({});
  const [sessionSearch, setSessionSearch] = useState("");
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; title: string } | null>(null);
  const [confirmDeleteAccount, setConfirmDeleteAccount] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // ── New feature state ──────────────────────────────────────────────────────
  const [showSummary, setShowSummary] = useState(false);
  const [summaryContent, setSummaryContent] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [cpCurrent, setCpCurrent] = useState("");
  const [cpNew, setCpNew] = useState("");
  const [cpConfirm, setCpConfirm] = useState("");
  const [cpShowCurrent, setCpShowCurrent] = useState(false);
  const [cpShowNew, setCpShowNew] = useState(false);
  const [cpLoading, setCpLoading] = useState(false);
  const [cpError, setCpError] = useState("");
  const [cpSuccess, setCpSuccess] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);

  // ── Refs ───────────────────────────────────────────────────────────────────
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const langMenuRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const voiceModeRef = useRef(false);
  const selectedLangRef = useRef(LANGUAGES[0]);
  const sendMessageRef = useRef<((msg: string, lang?: string) => Promise<void>) | null>(null);
  const voiceInputPendingRef = useRef(false);
  const wasVoiceSendRef = useRef(false);
  const lastSpokenIdRef = useRef<string | null>(null);

  const [voiceSupported] = useState(
    () => typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
  );
  const [isOnline, setIsOnline] = useState(() => typeof navigator !== "undefined" ? navigator.onLine : true);

  useEffect(() => {
    const online = () => setIsOnline(true);
    const offline = () => setIsOnline(false);
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    return () => { window.removeEventListener("online", online); window.removeEventListener("offline", offline); };
  }, []);

  useEffect(() => { selectedLangRef.current = selectedLang; }, [selectedLang]);
  useEffect(() => { voiceModeRef.current = voiceMode; }, [voiceMode]);
  useEffect(() => { sendMessageRef.current = sendMessage; }, [sendMessage]);

  // ── Scroll-to-bottom detection ─────────────────────────────────────────────
  const isNearBottomRef = useRef(true);
  const userScrolledUpRef = useRef(false);

  useEffect(() => {
    const el = chatAreaRef.current;
    if (!el) return;
    const onScroll = () => {
      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      const nearBottom = distanceFromBottom < 120;
      isNearBottomRef.current = nearBottom;
      userScrolledUpRef.current = !nearBottom;
      setShowScrollBottom(distanceFromBottom > 250);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToBottom = useCallback((force = false) => {
    if (force || isNearBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  // ── Ctrl+K → open sidebar search / ? → shortcuts ──────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSidebarOpen(true);
        setTimeout(() => document.getElementById("session-search")?.focus(), 150);
      }
      const active = document.activeElement as HTMLElement;
      const isTyping = active?.tagName === "TEXTAREA" || active?.tagName === "INPUT";
      if (e.key === "?" && !isTyping) {
        e.preventDefault();
        setShowShortcuts(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // ── Close menus on outside click ───────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) setShowLangMenu(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Auto-scroll on new messages (only if user is near bottom) ───────────────
  useEffect(() => {
    if (!userScrolledUpRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isSending]);

  // ── Copy message ────────────────────────────────────────────────────────────
  const copyMessage = useCallback((content: string, id: string) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopiedMsgId(id);
      setTimeout(() => setCopiedMsgId(null), 2000);
    });
  }, []);

  // ── Export conversation ─────────────────────────────────────────────────────
  const exportConversation = useCallback(() => {
    if (messages.length === 0) return;
    const lines = [
      "═══════════════════════════════════════",
      "  EduAssistant — Conversation Export",
      `  Exported: ${new Date().toLocaleString()}`,
      "═══════════════════════════════════════",
      "",
      ...messages.flatMap(m => [m.role === "user" ? "You:" : "EduAssistant:", m.content, ""]),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `eduassistant-chat-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [messages]);

  // ── Session rename ──────────────────────────────────────────────────────────
  const startRename = (id: string, currentTitle: string | null, preview: string) => {
    setEditingSessionId(id);
    setEditingTitle(currentTitle ?? preview.slice(0, 50));
    setTimeout(() => editInputRef.current?.focus(), 50);
  };

  const submitRename = async () => {
    if (!editingSessionId || !editingTitle.trim()) { setEditingSessionId(null); return; }
    await renameSession(editingSessionId, editingTitle.trim());
    setEditingSessionId(null);
  };

  // ── Session delete ──────────────────────────────────────────────────────────
  const handleDeleteSession = async (id: string) => {
    await deleteSession(id);
    setConfirmDelete(null);
    if (messages.length > 0) newChat();
  };

  // ── Feedback ────────────────────────────────────────────────────────────────
  const toggleFeedback = (msgId: string, dir: "up" | "down") => {
    setFeedbackMap(prev => {
      if (prev[msgId] === dir) { const n = { ...prev }; delete n[msgId]; return n; }
      return { ...prev, [msgId]: dir };
    });
  };

  // ── Delete account ──────────────────────────────────────────────────────────
  const handleDeleteAccount = async () => {
    if (!token) return;
    setIsDeletingAccount(true);
    try {
      const res = await fetch(`${import.meta.env.BASE_URL.replace(/\/$/, "")}/api/auth/account`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        logout();
        navigate("/");
      }
    } catch {
      // silently ignore
    } finally {
      setIsDeletingAccount(false);
      setConfirmDeleteAccount(false);
    }
  };

  // ── Change password ─────────────────────────────────────────────────────────
  const handleChangePassword = async () => {
    if (!token) return;
    if (!cpCurrent || !cpNew) { setCpError("All fields are required"); return; }
    if (cpNew.length < 6) { setCpError("New password must be at least 6 characters"); return; }
    if (cpNew !== cpConfirm) { setCpError("Passwords do not match"); return; }
    setCpLoading(true); setCpError("");
    try {
      const res = await fetch(`${import.meta.env.BASE_URL.replace(/\/$/, "")}/api/auth/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: cpCurrent, newPassword: cpNew }),
      });
      if (res.ok) {
        setCpSuccess(true);
        setCpCurrent(""); setCpNew(""); setCpConfirm("");
        setTimeout(() => { setCpSuccess(false); setShowChangePassword(false); }, 2000);
      } else {
        const data = await res.json();
        setCpError(data.error ?? "Failed to change password");
      }
    } catch { setCpError("Network error. Please try again."); }
    finally { setCpLoading(false); }
  };

  // ── Summarize chat ───────────────────────────────────────────────────────────
  const handleSummarize = async () => {
    if (!sessionId) return;
    setSummaryLoading(true); setShowSummary(true); setSummaryContent(null);
    const result = await summarizeSession(sessionId);
    setSummaryContent(result ?? "Could not generate summary.");
    setSummaryLoading(false);
  };

  // ── Share conversation ───────────────────────────────────────────────────────
  const handleShare = async () => {
    if (!sessionId || shareLoading) return;
    setShareLoading(true);
    const tok = await shareSession(sessionId);
    setShareLoading(false);
    if (tok) {
      const url = `${window.location.origin}${import.meta.env.BASE_URL.replace(/\/$/, "")}/share/${tok}`;
      navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 3000);
    }
  };

  // ── TTS helpers ─────────────────────────────────────────────────────────────
  const stripMarkdown = (text: string) =>
    text.replace(/#{1,6}\s+/g, "").replace(/\*\*(.+?)\*\*/g, "$1").replace(/`{1,3}[^`]*`{1,3}/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/[>\-*_~]/g, "").replace(/\n+/g, " ").trim();

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setSpeakingMsgId(null);
  }, []);

  const startListening = useCallback(() => {
    if (!voiceSupported) return;
    const Ctor = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    if (!Ctor) return;
    const recognition: SpeechRecognitionInstance = new Ctor();
    recognition.lang = selectedLangRef.current.code;
    recognition.continuous = false;
    recognition.interimResults = true;
    let finalTranscript = "";
    recognition.onresult = (e: SpeechRecognitionEvent) => {
      let interim = "";
      for (let i = e.results.length - 1; i >= 0; i--) {
        const r = e.results[i];
        if (r.isFinal) finalTranscript += r[0].transcript;
        else interim = r[0].transcript;
      }
      setInput(interim ? `${finalTranscript}[…${interim}]` : finalTranscript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => {
      setIsListening(false);
      const transcript = finalTranscript.trim();
      setInput(transcript);
      if (voiceModeRef.current && transcript && sendMessageRef.current) {
        setInput("");
        sendMessageRef.current(transcript, selectedLangRef.current.code);
      } else if (transcript) {
        voiceInputPendingRef.current = true;
        setVoiceInputPending(true);
      }
    };
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [voiceSupported]);

  const speak = useCallback((text: string, msgId: string) => {
    if (!window.speechSynthesis) return;
    stopSpeaking();
    const clean = stripMarkdown(text);
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = selectedLangRef.current.code;
    utterance.rate = 0.95;
    const voices = window.speechSynthesis.getVoices();
    const lang = selectedLangRef.current.code;
    const preferred = voices.find(v => v.lang === lang && v.name.includes("Google"))
      ?? voices.find(v => v.lang === lang)
      ?? voices.find(v => v.lang.startsWith(lang.split("-")[0]));
    if (preferred) utterance.voice = preferred;
    utterance.onstart = () => { setIsSpeaking(true); setSpeakingMsgId(msgId); };
    utterance.onend = () => {
      setIsSpeaking(false); setSpeakingMsgId(null);
      if (voiceModeRef.current) setTimeout(() => startListening(), 500);
    };
    utterance.onerror = () => { setIsSpeaking(false); setSpeakingMsgId(null); };
    window.speechSynthesis.speak(utterance);
  }, [stopSpeaking, startListening]);

  useEffect(() => {
    if (!voiceMode || isSending) return;
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg || lastMsg.role !== "assistant") return;
    if (lastMsg.id === lastSpokenIdRef.current) return;
    lastSpokenIdRef.current = lastMsg.id;
    wasVoiceSendRef.current = false;
    setTimeout(() => speak(lastMsg.content, lastMsg.id), 300);
  }, [messages, isSending, voiceMode, speak]);

  useEffect(() => () => { window.speechSynthesis?.cancel(); }, []);

  // ── Form submit ─────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSending || isInitializing) return;
    const message = input.trim();
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "44px";
    voiceInputPendingRef.current = false;
    setVoiceInputPending(false);
    userScrolledUpRef.current = false;
    isNearBottomRef.current = true;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    await sendMessage(message, selectedLang.code);
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value.slice(0, MAX_CHARS);
    setInput(val);
    if (voiceInputPendingRef.current) { voiceInputPendingRef.current = false; setVoiceInputPending(false); }
    e.target.style.height = "44px";
    e.target.style.height = Math.min(e.target.scrollHeight, 128) + "px";
  };

  const handleQuickAction = (prompt: string) => {
    const msg = prompt === "__surprise__"
      ? SURPRISE_QUESTIONS[Math.floor(Math.random() * SURPRISE_QUESTIONS.length)]
      : prompt;
    setInput(msg);
    textareaRef.current?.focus();
  };

  const isReady = !isInitializing && !isLoadingMessages;
  const charCount = input.length;
  const charWarning = charCount > MAX_CHARS * 0.85;

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return "Good morning";
    if (h >= 12 && h < 17) return "Good afternoon";
    if (h >= 17 && h < 21) return "Good evening";
    return "Good night";
  };

  const DAILY_TIPS = [
    "The Feynman Technique: explain a concept as if teaching a child to truly master it.",
    "Spaced repetition beats cramming — review material after 1 day, 3 days, 7 days, then 21 days.",
    "Active recall (testing yourself) is more effective than re-reading notes.",
    "The Pomodoro method: 25 minutes focused study, 5 minutes break.",
    "Writing by hand improves memory retention compared to typing.",
    "Teaching others what you learned is the fastest way to solidify knowledge.",
    "Sleep is when your brain consolidates memories — never skip sleep before exams.",
    "Breaking big tasks into smaller sub-tasks reduces procrastination significantly.",
    "Reading the summary and headings of a chapter first helps comprehension by 40%.",
    "Asking 'why?' repeatedly (5 Whys technique) builds deep conceptual understanding.",
    "The best time to study is when you're naturally alert — not when you're tired.",
    "Connecting new knowledge to something you already know speeds up learning.",
    "Mistakes are data — analyzing what went wrong is more valuable than getting it right.",
    "Mind maps help visual learners organize complex topics into memorable diagrams.",
    "Interleaved practice (mixing topics) builds stronger long-term memory than blocked practice.",
    "A quiet environment with no phone boosts focus by up to 200%.",
    "The first 20 minutes after waking are ideal for memorization tasks.",
    "Reading aloud improves recall — your brain processes information more deeply.",
    "Summarizing what you just read in one sentence forces deep understanding.",
    "Taking a 10-minute walk after studying helps transfer information to long-term memory.",
    "Using multiple senses (reading + listening + writing) strengthens neural pathways.",
    "Pretesting yourself before learning makes the actual learning 50% more effective.",
    "Drinking water improves cognitive performance — even mild dehydration hurts focus.",
    "Making a question out of every heading as you read transforms passive into active learning.",
    "The 2-minute rule: if a task takes under 2 minutes, do it immediately — don't defer.",
    "Chunking information (grouping related items) is how experts remember complex material.",
    "Music without lyrics (classical, lo-fi) can enhance focus for some learners.",
    "Goal-setting with specific, measurable targets improves academic performance by 30%.",
    "Handwriting a one-page summary after a lecture is the single best revision strategy.",
    "Curiosity activates dopamine — follow what genuinely interests you to learn faster.",
  ];

  const getDailyTip = () => {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    return DAILY_TIPS[dayOfYear % DAILY_TIPS.length];
  };

  const formatSessionDate = (iso: string) => {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    if (diff < 86400000) return "Today";
    if (diff < 172800000) return "Yesterday";
    if (diff < 604800000) return d.toLocaleDateString(undefined, { weekday: "long" });
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  const filteredSessions = sessions.filter(s => {
    if (!sessionSearch.trim()) return true;
    const q = sessionSearch.toLowerCase();
    return (s.title ?? "").toLowerCase().includes(q) || (s.preview ?? "").toLowerCase().includes(q);
  });

  type SessionGroup = { label: string; sessions: typeof filteredSessions };
  const groupedSessions: SessionGroup[] = (() => {
    if (sessionSearch.trim()) return [{ label: "Search Results", sessions: filteredSessions }];
    const now = Date.now();
    const pinned = filteredSessions.filter(s => s.pinned);
    const today = filteredSessions.filter(s => !s.pinned && now - new Date(s.createdAt).getTime() < 86400000);
    const yesterday = filteredSessions.filter(s => !s.pinned && now - new Date(s.createdAt).getTime() >= 86400000 && now - new Date(s.createdAt).getTime() < 172800000);
    const thisWeek = filteredSessions.filter(s => !s.pinned && now - new Date(s.createdAt).getTime() >= 172800000 && now - new Date(s.createdAt).getTime() < 604800000);
    const older = filteredSessions.filter(s => !s.pinned && now - new Date(s.createdAt).getTime() >= 604800000);
    const groups: SessionGroup[] = [];
    if (pinned.length) groups.push({ label: "📌 Pinned", sessions: pinned });
    if (today.length) groups.push({ label: "Today", sessions: today });
    if (yesterday.length) groups.push({ label: "Yesterday", sessions: yesterday });
    if (thisWeek.length) groups.push({ label: "This Week", sessions: thisWeek });
    if (older.length) groups.push({ label: "Older", sessions: older });
    return groups;
  })();

  const lastAssistantMsgId = [...messages].reverse().find(m => m.role === "assistant")?.id;

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">

      {/* ── Confirm dialogs ── */}
      <AnimatePresence>
        {confirmDelete && (
          <ConfirmDialog
            title="Delete this chat?"
            description={`"${confirmDelete.title}" and all its messages will be permanently deleted.`}
            danger
            onConfirm={() => handleDeleteSession(confirmDelete.id)}
            onCancel={() => setConfirmDelete(null)}
          />
        )}
        {confirmDeleteAccount && (
          <ConfirmDialog
            title="Delete your account?"
            description="This will permanently delete your account, all your chats, and all your data. This cannot be undone."
            danger
            onConfirm={handleDeleteAccount}
            onCancel={() => setConfirmDeleteAccount(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              key="sidebar"
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-72 bg-background border-r border-border flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between px-4 py-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="font-semibold text-sm">Chat History</span>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="px-3 py-3 border-b border-border">
                <button
                  onClick={() => { newChat(); setSidebarOpen(false); setInput(""); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-semibold transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4" /> New chat
                </button>
              </div>

              {/* Search */}
              {sessions.length > 0 && (
                <div className="px-3 py-2 border-b border-border">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/60 border border-border">
                    <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <input
                      id="session-search"
                      type="text"
                      placeholder="Search chats… (Ctrl+K)"
                      value={sessionSearch}
                      onChange={e => setSessionSearch(e.target.value)}
                      className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none"
                    />
                    {sessionSearch && (
                      <button onClick={() => setSessionSearch("")} className="text-muted-foreground hover:text-foreground">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Session list */}
              <div className="flex-1 overflow-y-auto py-2">
                {filteredSessions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground px-4">
                    <MessageSquare className="w-8 h-8 opacity-30" />
                    <p className="text-xs text-center">{sessionSearch ? "No chats match your search." : "No history yet. Start chatting!"}</p>
                  </div>
                ) : (
                  groupedSessions.map(group => (
                    <div key={group.label}>
                      <div className="px-4 pt-3 pb-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">{group.label}</span>
                      </div>
                      {group.sessions.map(s => (
                        <div key={s.id} className="group relative">
                          {editingSessionId === s.id ? (
                            <div className="px-3 py-2">
                              <input
                                ref={editInputRef}
                                type="text"
                                value={editingTitle}
                                onChange={e => setEditingTitle(e.target.value)}
                                onKeyDown={e => { if (e.key === "Enter") submitRename(); if (e.key === "Escape") setEditingSessionId(null); }}
                                onBlur={submitRename}
                                className="w-full px-3 py-2 text-sm rounded-lg border border-primary bg-primary/5 text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                                maxLength={80}
                              />
                              <p className="text-xs text-muted-foreground mt-1 px-1">Enter to save · Esc to cancel</p>
                            </div>
                          ) : (
                            <button
                              onClick={() => { switchSession(s.id); setSidebarOpen(false); }}
                              className={cn("w-full text-left px-4 py-2.5 hover:bg-secondary/60 transition-colors pr-16",
                                s.id === sessionId && "bg-primary/5 border-l-2 border-primary")}
                            >
                              <p className="text-sm text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors font-medium">
                                {s.title ?? s.preview}
                              </p>
                              {s.title && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{s.preview}</p>}
                            </button>
                          )}

                          {/* Pin, Rename & Delete buttons */}
                          {!isGuest && editingSessionId !== s.id && (
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={e => { e.stopPropagation(); pinSession(s.id); }}
                                title={s.pinned ? "Unpin" : "Pin to top"}
                                className={cn("p-1.5 rounded-lg hover:bg-secondary", s.pinned ? "text-primary" : "text-muted-foreground hover:text-foreground")}
                              >
                                {s.pinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
                              </button>
                              <button
                                onClick={e => { e.stopPropagation(); startRename(s.id, s.title, s.preview); }}
                                title="Rename" className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={e => { e.stopPropagation(); setConfirmDelete({ id: s.id, title: s.title ?? s.preview.slice(0, 30) }); }}
                                title="Delete" className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ))
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Header ── */}
      <header className="flex-shrink-0 h-14 border-b border-border/50 bg-background/80 backdrop-blur-md flex items-center px-3 md:px-5 justify-between z-10 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <button onClick={() => setSidebarOpen(true)} title="Chat history (Ctrl+K)"
            className="p-2 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors shrink-0">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <div className="relative shrink-0">
              <div className="bg-primary/15 p-1.5 rounded-xl"><Bot className="w-5 h-5 text-primary" /></div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border-2 border-background" />
            </div>
            <div className="min-w-0 hidden sm:block">
              <h1 className="font-bold text-sm text-foreground truncate">EduAssistant AI</h1>
              <p className="text-xs text-green-500 font-medium">● Online</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Dark mode toggle */}
          <button onClick={toggleTheme} title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Keyboard shortcuts */}
          <button onClick={() => setShowShortcuts(true)} title="Keyboard shortcuts (?)"
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors hidden sm:flex">
            <Keyboard className="w-4 h-4" />
          </button>

          {/* Summarize chat */}
          {messages.length > 0 && !isGuest && sessionId && (
            <button onClick={handleSummarize} title="Summarize this conversation"
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
              <FileSearch className="w-4 h-4" />
            </button>
          )}

          {/* Share conversation */}
          {messages.length > 0 && !isGuest && sessionId && (
            <button onClick={handleShare} title={shareCopied ? "Link copied!" : "Share conversation"}
              className={cn("p-2 rounded-xl transition-colors", shareCopied ? "text-green-500 bg-green-500/10" : "text-muted-foreground hover:text-foreground hover:bg-secondary")}>
              {shareCopied ? <Check className="w-4 h-4" /> : shareLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
            </button>
          )}

          {/* Export */}
          {messages.length > 0 && (
            <button onClick={exportConversation} title="Export conversation"
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
              <Download className="w-4 h-4" />
            </button>
          )}

          {/* Language */}
          <div className="relative" ref={langMenuRef}>
            <button onClick={() => setShowLangMenu(v => !v)}
              className="flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs font-semibold border border-border bg-secondary/60 text-muted-foreground hover:border-primary/40 hover:text-primary transition-all">
              <Globe className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{selectedLang.flag} {selectedLang.name}</span>
              <span className="md:hidden">{selectedLang.flag}</span>
              <ChevronDown className="w-3 h-3" />
            </button>
            <AnimatePresence>
              {showLangMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.96 }}
                  className="absolute right-0 top-full mt-1 z-50 w-44 max-h-64 overflow-y-auto rounded-xl border border-border bg-background/95 backdrop-blur-sm shadow-xl py-1"
                >
                  {LANGUAGES.map(lang => (
                    <button key={lang.code} onClick={() => { setSelectedLang(lang); setShowLangMenu(false); }}
                      className={cn("w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-secondary/60",
                        selectedLang.code === lang.code ? "text-primary font-semibold bg-primary/5" : "text-muted-foreground")}>
                      <span className="text-base">{lang.flag}</span>
                      <span className="truncate">{lang.name}</span>
                      {selectedLang.code === lang.code && <span className="ml-auto text-primary">✓</span>}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Voice Mode */}
          {voiceSupported && (
            <button
              onClick={() => {
                const next = !voiceMode;
                setVoiceMode(next);
                if (next) setTimeout(() => startListening(), 100);
                else { stopSpeaking(); recognitionRef.current?.stop(); setIsListening(false); }
              }}
              className={cn(
                "flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs font-semibold border transition-all",
                voiceMode ? "bg-primary text-primary-foreground border-primary" : "bg-secondary text-muted-foreground border-border hover:border-primary/40 hover:text-primary"
              )}>
              <Radio className={cn("w-3.5 h-3.5", voiceMode && "animate-pulse")} />
              <span className="hidden sm:inline">{voiceMode ? (isSpeaking ? "Speaking…" : isListening ? "Listening…" : "Voice ON") : "Voice"}</span>
            </button>
          )}

          {/* Auth buttons / Profile */}
          {isGuest ? (
            <div className="flex items-center gap-1.5">
              <button onClick={() => navigate("/login")}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-border bg-secondary/60 text-muted-foreground hover:text-foreground transition-all">
                Sign in
              </button>
              <button onClick={() => navigate("/signup")}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all">
                Sign up
              </button>
            </div>
          ) : (
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setShowProfile(v => !v)}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl bg-secondary/60 border border-border hover:border-primary/40 transition-all"
              >
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-primary text-[10px] font-bold">{user?.username[0].toUpperCase()}</span>
                </div>
                <span className="hidden md:inline text-xs font-semibold text-foreground">{user?.username}</span>
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
              </button>
              <AnimatePresence>
                {showProfile && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.96 }}
                    className="absolute right-0 top-full mt-1 z-50 w-52 rounded-xl border border-border bg-background/95 backdrop-blur-sm shadow-xl py-1"
                  >
                    <div className="px-4 py-3 border-b border-border">
                      <p className="font-semibold text-sm text-foreground">{user?.username}</p>
                      <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                    </div>
                    <button
                      onClick={() => { setShowProfile(false); navigate("/profile"); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
                    >
                      <User className="w-4 h-4" /> My Profile
                    </button>
                    <button
                      onClick={() => { setShowProfile(false); setShowChangePassword(true); setCpError(""); setCpSuccess(false); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
                    >
                      <Lock className="w-4 h-4" /> Change password
                    </button>
                    <button
                      onClick={() => { setShowProfile(false); logout(); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Sign out
                    </button>
                    <div className="border-t border-border mt-1 pt-1">
                      <button
                        onClick={() => { setShowProfile(false); setConfirmDeleteAccount(true); }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <UserX className="w-4 h-4" /> Delete account
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </header>

      {/* Offline banner */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="w-full bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 flex items-center justify-center gap-2 text-xs text-amber-600 dark:text-amber-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
            You're offline — messages won't send until your connection is restored.
          </motion.div>
        )}
      </AnimatePresence>

      {/* Guest banner */}
      {isGuest && (
        <div className="w-full bg-primary/5 border-b border-primary/20 px-4 py-2 flex items-center justify-center gap-3 text-xs">
          <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="text-muted-foreground">Chatting as <span className="font-semibold text-foreground">guest</span> — history won't be saved.</span>
          <button onClick={() => navigate("/signup")} className="text-primary font-semibold hover:underline shrink-0">Sign up free →</button>
        </div>
      )}

      {/* ── Chat Area ── */}
      <div ref={chatAreaRef} className="flex-1 overflow-y-auto p-3 md:p-5 w-full max-w-4xl mx-auto relative" style={{ overflowAnchor: "none" }}>
        {isInitializing || isLoadingMessages ? (
          <div className="h-full flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center"><Bot className="w-6 h-6 text-primary" /></div>
              <Loader2 className="w-4 h-4 animate-spin text-primary absolute -bottom-1 -right-1 bg-background rounded-full" />
            </div>
            <p className="text-sm">Getting your session ready…</p>
          </div>
        ) : error ? (
          <div className="h-full flex flex-col items-center justify-center gap-4 text-destructive">
            <p>Failed to load chat session.</p>
            <button onClick={() => window.location.reload()} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-xl hover:bg-secondary/80 flex items-center gap-2 text-sm">
              <RefreshCw className="w-4 h-4" /> Try again
            </button>
          </div>
        ) : messages.length === 0 ? (
          /* ── Welcome / Empty State ── */
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="h-full flex flex-col items-center justify-center text-center px-4">
            <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              className="text-sm font-medium text-primary mb-1">
              {getGreeting()}{user ? `, ${user.username}` : ""}!
            </motion.p>
            <motion.h2 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="text-2xl md:text-4xl font-bold text-foreground mb-6">
              What can I help with?
            </motion.h2>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="flex flex-wrap justify-center gap-2.5 max-w-xl mb-6">
              {QUICK_ACTIONS.map((action, i) => (
                <motion.button key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 + i * 0.06 }}
                  onClick={() => handleQuickAction(action.prompt)}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-full border border-border bg-card hover:bg-secondary/70 hover:border-primary/40 transition-all text-sm font-medium shadow-sm active:scale-95">
                  <action.icon className="w-4 h-4 shrink-0" style={{ color: action.color }} />
                  {action.label}
                </motion.button>
              ))}
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-2xl mb-5">
              {SUGGESTIONS.map((s, i) => (
                <motion.button key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.05 }}
                  onClick={() => { setInput(s.label); textareaRef.current?.focus(); }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border/60 bg-card/60 hover:bg-secondary/60 hover:border-primary/30 transition-all text-left group">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <s.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-muted-foreground mb-0.5">{s.category}</p>
                    <p className="text-sm text-foreground leading-tight line-clamp-1">{s.label}</p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary shrink-0" />
                </motion.button>
              ))}
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75 }}
              className="flex items-start gap-2.5 max-w-md px-4 py-3 rounded-xl bg-primary/5 border border-primary/15 text-left mb-4">
              <Brain className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary/60 mb-0.5">Tip of the day</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{getDailyTip()}</p>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
              className="flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="w-3 h-3" />
              <span>Ask anything — EduAssistant knows it all</span>
            </motion.div>
          </motion.div>
        ) : (
          /* ── Messages ── */
          <div className="space-y-5 pb-4">
            <AnimatePresence initial={false}>
              {messages.map((msg, idx) => {
                const isLast = idx === messages.length - 1;
                const isLastAI = msg.id === lastAssistantMsgId;
                return (
                  <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
                    className={cn("flex items-start gap-2.5 max-w-3xl group", msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto")}>
                    <div className={cn("w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-1 text-xs font-bold",
                      msg.role === "user" ? "bg-primary/20 text-primary" : "bg-primary text-primary-foreground")}>
                      {msg.role === "user" ? (user?.username?.[0]?.toUpperCase() ?? "G") : <Bot className="w-3.5 h-3.5" />}
                    </div>

                    <div className={cn("px-4 py-3.5 rounded-2xl shadow-sm relative",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-sm max-w-[85%]"
                        : "bg-card border border-border/50 text-foreground rounded-tl-sm max-w-[90%]",
                      speakingMsgId === msg.id && "ring-2 ring-primary/40"
                    )}>
                      {/* Copy button */}
                      <button
                        onClick={() => copyMessage(msg.content, msg.id)}
                        title="Copy"
                        className={cn("absolute top-2 right-2 p-1 rounded-lg transition-all opacity-0 group-hover:opacity-100",
                          msg.role === "user"
                            ? "hover:bg-white/20 text-white/60 hover:text-white"
                            : "hover:bg-secondary text-muted-foreground/40 hover:text-muted-foreground"
                        )}>
                        {copiedMsgId === msg.id ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                      </button>

                      {msg.role === "assistant" ? (
                        <div className="prose prose-sm dark:prose-invert prose-p:leading-relaxed prose-headings:font-bold max-w-none pr-5">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm, remarkMath]}
                            rehypePlugins={[rehypeKatex]}
                            components={{
                              code: ({ node, inline, className, children, ...props }: any) => (
                                <CodeBlock inline={inline} className={className} {...props}>{children}</CodeBlock>
                              ),
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>

                          {/* Bottom row: confidence, feedback, TTS, timestamp, regenerate */}
                          <div className="mt-2.5 pt-2.5 border-t border-border/60 flex flex-wrap items-center gap-2">
                            {msg.confidence !== null && msg.confidence !== undefined && msg.confidence > 0 && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <ShieldCheck className="w-3 h-3 text-green-500" />
                                {Math.round(msg.confidence * 100)}% match
                              </span>
                            )}
                            <div className="flex items-center gap-1 ml-auto">
                              <MessageTime iso={msg.createdAt} />
                              <button onClick={() => toggleFeedback(msg.id, "up")} title="Good response"
                                className={cn("p-1 rounded-lg transition-colors",
                                  feedbackMap[msg.id] === "up" ? "text-green-500 bg-green-500/10" : "text-muted-foreground/40 hover:text-green-500 hover:bg-green-500/10")}>
                                <ThumbsUp className="w-3 h-3" />
                              </button>
                              <button onClick={() => toggleFeedback(msg.id, "down")} title="Bad response"
                                className={cn("p-1 rounded-lg transition-colors",
                                  feedbackMap[msg.id] === "down" ? "text-red-500 bg-red-500/10" : "text-muted-foreground/40 hover:text-red-500 hover:bg-red-500/10")}>
                                <ThumbsDown className="w-3 h-3" />
                              </button>
                              {speakingMsgId === msg.id && (
                                <div className="flex items-end gap-0.5 h-3.5">
                                  {[6, 12, 8, 10, 5].map((h, i) => (
                                    <span key={i} className="w-0.5 rounded-full bg-primary animate-bounce"
                                      style={{ height: `${h}px`, animationDelay: `${i * 75}ms` }} />
                                  ))}
                                </div>
                              )}
                              <button onClick={() => speakingMsgId === msg.id ? stopSpeaking() : speak(msg.content, msg.id)}
                                title={speakingMsgId === msg.id ? "Stop" : "Read aloud"}
                                className={cn("p-1 rounded-lg transition-colors",
                                  speakingMsgId === msg.id ? "text-primary" : "text-muted-foreground/40 hover:text-primary hover:bg-primary/10")}>
                                {speakingMsgId === msg.id ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                              </button>
                              {/* Regenerate on last AI message */}
                              {isLastAI && !isSending && (
                                <button onClick={() => regenerate()} title="Regenerate response"
                                  className="p-1 rounded-lg transition-colors text-muted-foreground/40 hover:text-primary hover:bg-primary/10">
                                  <RotateCcw className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p className="leading-relaxed whitespace-pre-wrap pr-5">{msg.content}</p>
                          <div className="flex justify-end mt-1">
                            <MessageTime iso={msg.createdAt} />
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Streaming / thinking indicator */}
            {isSending && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2.5 max-w-3xl mr-auto">
                <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 mt-1">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                {streamingContent !== null && streamingContent.length > 0 ? (
                  <div className="px-4 py-3.5 rounded-2xl bg-card border border-border/50 rounded-tl-sm max-w-[90%]">
                    <div className="prose prose-sm dark:prose-invert prose-p:leading-relaxed max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}
                        components={{
                          code: ({ node, inline, className, children, ...props }: any) => (
                            <CodeBlock inline={inline} className={className} {...props}>{children}</CodeBlock>
                          ),
                        }}>
                        {streamingContent}
                      </ReactMarkdown>
                    </div>
                    <span className="inline-block w-0.5 h-4 bg-primary animate-pulse ml-0.5 align-middle" />
                  </div>
                ) : (
                  <div className="px-4 py-3.5 rounded-2xl bg-card border border-border/50 rounded-tl-sm flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground mr-1">Thinking</span>
                    {[0, 150, 300].map((delay, i) => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                    ))}
                  </div>
                )}
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Scroll-to-bottom button */}
        <AnimatePresence>
          {showScrollBottom && messages.length > 0 && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => { userScrolledUpRef.current = false; isNearBottomRef.current = true; scrollToBottom(true); }}
              className="fixed bottom-28 right-5 z-20 p-2.5 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all">
              <ArrowDown className="w-4 h-4" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* ── Input Area ── */}
      <div className="flex-shrink-0 bg-background/90 backdrop-blur-md border-t border-border p-3 md:p-4 w-full">
        <div className="max-w-4xl mx-auto">
          {/* Recording indicator */}
          <AnimatePresence>
            {isListening && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                className="flex items-center gap-2 mb-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 w-fit mx-auto">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs font-medium text-red-500">Listening… speak now</span>
                <button type="button" onClick={() => { recognitionRef.current?.stop(); setIsListening(false); }}
                  className="text-red-500/70 hover:text-red-500 text-xs underline">stop</button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Voice-input pending */}
          <AnimatePresence>
            {voiceInputPending && input.trim() && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                className="flex items-center gap-2 mb-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 w-fit mx-auto">
                <Mic className="w-3 h-3 text-amber-500" />
                <span className="text-xs font-medium text-amber-500">Voice captured — AI will speak the reply</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit}
            className={cn("flex items-end gap-2 rounded-2xl border bg-card shadow-sm transition-all",
              isListening ? "border-red-400" : voiceInputPending ? "border-amber-400" : "border-border focus-within:border-primary/50")}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleTextareaChange}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }}
              placeholder={isListening ? "Listening…" : voiceInputPending ? "Voice captured — press Enter to send" : isReady ? "Ask anything… (Enter to send, Shift+Enter for new line)" : "Connecting…"}
              disabled={!isReady || isSending}
              className="flex-1 bg-transparent resize-none outline-none p-3 text-foreground placeholder:text-muted-foreground text-sm"
              style={{ minHeight: "44px", maxHeight: "128px" }}
              rows={1}
            />
            {voiceSupported && (
              <button type="button" onClick={() => { if (isListening) { recognitionRef.current?.stop(); setIsListening(false); } else startListening(); }}
                disabled={!isReady || isSending}
                className={cn("p-3 rounded-xl transition-all mb-1 shrink-0 relative",
                  isListening ? "bg-red-500 text-white hover:bg-red-600" : voiceInputPending ? "bg-amber-500 text-white" : "bg-secondary text-muted-foreground hover:text-primary disabled:opacity-40")}>
                {isListening ? (<><MicOff className="w-4 h-4" /><span className="absolute inset-0 rounded-xl bg-red-500 animate-ping opacity-25" /></>) : <Mic className="w-4 h-4" />}
              </button>
            )}
            <button type="submit" disabled={!input.trim() || !isReady || isSending}
              className="p-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all mb-1 mr-1 shrink-0">
              {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>

          {/* Character counter */}
          <div className="flex items-center justify-between mt-1.5 px-1">
            <p className="text-xs text-muted-foreground">EduAssistant · Your intelligent AI learning companion</p>
            {charCount > 0 && (
              <span className={cn("text-xs tabular-nums", charWarning ? "text-amber-500 font-semibold" : "text-muted-foreground")}>
                {charCount} / {MAX_CHARS}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Summary Modal ── */}
      <AnimatePresence>
        {showSummary && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowSummary(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-background border border-border rounded-2xl shadow-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center">
                    <FileSearch className="w-4 h-4 text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground">Conversation Summary</h3>
                </div>
                <button onClick={() => setShowSummary(false)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
              {summaryLoading ? (
                <div className="flex flex-col items-center gap-3 py-8">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  <p className="text-sm text-muted-foreground">Generating summary with AI…</p>
                </div>
              ) : (
                <div className="prose prose-sm max-w-none text-foreground">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{summaryContent ?? ""}</ReactMarkdown>
                </div>
              )}
              {!summaryLoading && (
                <div className="mt-4 flex justify-end">
                  <button onClick={() => setShowSummary(false)} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">Close</button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Keyboard Shortcuts Modal ── */}
      <AnimatePresence>
        {showShortcuts && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowShortcuts(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-background border border-border rounded-2xl shadow-2xl p-6 max-w-sm w-full">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center">
                    <Keyboard className="w-4 h-4 text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground">Keyboard Shortcuts</h3>
                </div>
                <button onClick={() => setShowShortcuts(false)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2">
                {[
                  { key: "Enter", desc: "Send message" },
                  { key: "Shift + Enter", desc: "New line in message" },
                  { key: "Ctrl + K", desc: "Open / search chat history" },
                  { key: "Escape", desc: "Close sidebar or cancel" },
                  { key: "?", desc: "Open this shortcuts panel" },
                ].map(({ key, desc }) => (
                  <div key={key} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                    <span className="text-sm text-muted-foreground">{desc}</span>
                    <kbd className="px-2 py-0.5 rounded-md bg-secondary border border-border text-xs font-mono font-semibold text-foreground">{key}</kbd>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Change Password Modal ── */}
      <AnimatePresence>
        {showChangePassword && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => { if (!cpLoading) setShowChangePassword(false); }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-background border border-border rounded-2xl shadow-2xl p-6 max-w-sm w-full">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center">
                    <Lock className="w-4 h-4 text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground">Change Password</h3>
                </div>
                <button onClick={() => setShowChangePassword(false)} disabled={cpLoading} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {cpSuccess ? (
                <div className="text-center py-6">
                  <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-3">
                    <Check className="w-6 h-6 text-green-500" />
                  </div>
                  <p className="font-semibold text-foreground">Password changed!</p>
                  <p className="text-sm text-muted-foreground mt-1">Your password has been updated successfully.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Current password</label>
                    <div className="relative">
                      <input type={cpShowCurrent ? "text" : "password"} value={cpCurrent} onChange={e => setCpCurrent(e.target.value)}
                        className="w-full px-3 py-2.5 pr-10 rounded-xl border border-border bg-secondary/30 text-foreground text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                        placeholder="Enter current password" disabled={cpLoading} />
                      <button type="button" onClick={() => setCpShowCurrent(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {cpShowCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">New password</label>
                    <div className="relative">
                      <input type={cpShowNew ? "text" : "password"} value={cpNew} onChange={e => setCpNew(e.target.value)}
                        className="w-full px-3 py-2.5 pr-10 rounded-xl border border-border bg-secondary/30 text-foreground text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                        placeholder="New password (min 6 chars)" disabled={cpLoading} />
                      <button type="button" onClick={() => setCpShowNew(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {cpShowNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Confirm new password</label>
                    <input type="password" value={cpConfirm} onChange={e => setCpConfirm(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") handleChangePassword(); }}
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-secondary/30 text-foreground text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                      placeholder="Confirm new password" disabled={cpLoading} />
                  </div>
                  {cpError && <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{cpError}</p>}
                  <button onClick={handleChangePassword} disabled={cpLoading || !cpCurrent || !cpNew || !cpConfirm}
                    className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-1">
                    {cpLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Change password"}
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
