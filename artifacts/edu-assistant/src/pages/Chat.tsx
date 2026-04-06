import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import {
  Send, Bot, User, Loader2, ShieldCheck, RefreshCw, LogOut, Sparkles,
  BookOpen, Code2, Brain, Lightbulb, ChevronRight, ChevronDown,
  Mic, MicOff, Volume2, VolumeX, Radio, Globe, Calculator, FlaskConical,
  Utensils, Landmark, PenLine, Heart, Shuffle, FileText, Menu, X,
  MessageSquare, Plus, Clock, Copy, Check, Download, ThumbsUp, ThumbsDown,
  Search, Edit2, ChevronDown as ChevronDownIcon, ArrowDown, Keyboard,
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
import { motion, AnimatePresence } from "framer-motion";

// ── Supported languages ──────────────────────────────────────────────────────
const LANGUAGES = [
  { code: "en-US",  name: "English",       flag: "🇺🇸" },
  { code: "hi-IN",  name: "हिन्दी",         flag: "🇮🇳" },
  { code: "ta-IN",  name: "தமிழ்",          flag: "🇮🇳" },
  { code: "te-IN",  name: "తెలుగు",         flag: "🇮🇳" },
  { code: "ml-IN",  name: "മലയാളം",        flag: "🇮🇳" },
  { code: "kn-IN",  name: "ಕನ್ನಡ",          flag: "🇮🇳" },
  { code: "gu-IN",  name: "ગુજરાતી",       flag: "🇮🇳" },
  { code: "mr-IN",  name: "मराठी",          flag: "🇮🇳" },
  { code: "pa-IN",  name: "ਪੰਜਾਬੀ",        flag: "🇮🇳" },
  { code: "bn-IN",  name: "বাংলা",          flag: "🇮🇳" },
  { code: "or-IN",  name: "ଓଡ଼ିଆ",           flag: "🇮🇳" },
  { code: "as-IN",  name: "অসমীয়া",        flag: "🇮🇳" },
  { code: "ne-IN",  name: "नेपाली",         flag: "🇮🇳" },
  { code: "ur-IN",  name: "اردو",           flag: "🇮🇳" },
  { code: "sd-IN",  name: "سنڌي",          flag: "🇮🇳" },
  { code: "ks-IN",  name: "کٲشُر",          flag: "🇮🇳" },
  { code: "mai-IN", name: "मैथिली",         flag: "🇮🇳" },
  { code: "kok-IN", name: "कोंकणी",         flag: "🇮🇳" },
  { code: "mni-IN", name: "মেইতেই",         flag: "🇮🇳" },
  { code: "sat-IN", name: "ᱥᱟᱱᱛᱟᱲᱤ",       flag: "🇮🇳" },
  { code: "doi-IN", name: "डोगरी",          flag: "🇮🇳" },
  { code: "sa-IN",  name: "संस्कृत",        flag: "🇮🇳" },
  { code: "bho-IN", name: "भोजपुरी",        flag: "🇮🇳" },
  { code: "awa-IN", name: "अवधी",           flag: "🇮🇳" },
  { code: "mag-IN", name: "मगही",           flag: "🇮🇳" },
  { code: "raj-IN", name: "राजस्थानी",      flag: "🇮🇳" },
  { code: "hne-IN", name: "छत्तीसगढ़ी",     flag: "🇮🇳" },
  { code: "tcy-IN", name: "ತುಳು",           flag: "🇮🇳" },
  { code: "ur-PK",  name: "اردو (PK)",      flag: "🇵🇰" },
  { code: "bn-BD",  name: "বাংলা (BD)",     flag: "🇧🇩" },
  { code: "si-LK",  name: "සිංහල",          flag: "🇱🇰" },
  { code: "ne-NP",  name: "नेपाली (NP)",    flag: "🇳🇵" },
  { code: "dz-BT",  name: "རྫོང་ཁ",          flag: "🇧🇹" },
  { code: "ps-AF",  name: "پښتو",           flag: "🇦🇫" },
  { code: "fa-AF",  name: "دری",            flag: "🇦🇫" },
  { code: "my-MM",  name: "မြန်မာ",          flag: "🇲🇲" },
  { code: "th-TH",  name: "ภาษาไทย",        flag: "🇹🇭" },
  { code: "lo-LA",  name: "ລາວ",            flag: "🇱🇦" },
  { code: "km-KH",  name: "ខ្មែរ",           flag: "🇰🇭" },
  { code: "vi-VN",  name: "Tiếng Việt",     flag: "🇻🇳" },
  { code: "ms-MY",  name: "Melayu",         flag: "🇲🇾" },
  { code: "id-ID",  name: "Indonesia",      flag: "🇮🇩" },
  { code: "fil-PH", name: "Filipino",       flag: "🇵🇭" },
  { code: "jv-ID",  name: "Basa Jawa",      flag: "🇮🇩" },
  { code: "su-ID",  name: "Basa Sunda",     flag: "🇮🇩" },
  { code: "zh-CN",  name: "中文 (简体)",      flag: "🇨🇳" },
  { code: "zh-TW",  name: "中文 (繁體)",      flag: "🇹🇼" },
  { code: "zh-HK",  name: "粵語",            flag: "🇭🇰" },
  { code: "ja-JP",  name: "日本語",           flag: "🇯🇵" },
  { code: "ko-KR",  name: "한국어",           flag: "🇰🇷" },
  { code: "mn-MN",  name: "Монгол",          flag: "🇲🇳" },
  { code: "bo-CN",  name: "བོད་སྐད་",         flag: "🇨🇳" },
  { code: "ar-SA",  name: "العربية",         flag: "🇸🇦" },
  { code: "fa-IR",  name: "فارسی",           flag: "🇮🇷" },
  { code: "he-IL",  name: "עברית",           flag: "🇮🇱" },
  { code: "tr-TR",  name: "Türkçe",          flag: "🇹🇷" },
  { code: "ku-TR",  name: "Kurdî",           flag: "🏳️" },
  { code: "az-AZ",  name: "Azərbaycan",      flag: "🇦🇿" },
  { code: "uz-UZ",  name: "Oʻzbek",          flag: "🇺🇿" },
  { code: "kk-KZ",  name: "Қазақша",        flag: "🇰🇿" },
  { code: "ky-KG",  name: "Кыргызча",       flag: "🇰🇬" },
  { code: "tg-TJ",  name: "Тоҷикӣ",         flag: "🇹🇯" },
  { code: "tk-TM",  name: "Türkmen",         flag: "🇹🇲" },
  { code: "ka-GE",  name: "ქართული",         flag: "🇬🇪" },
  { code: "hy-AM",  name: "Հայերեն",         flag: "🇦🇲" },
  { code: "ru-RU",  name: "Русский",         flag: "🇷🇺" },
  { code: "uk-UA",  name: "Українська",      flag: "🇺🇦" },
  { code: "be-BY",  name: "Беларуская",      flag: "🇧🇾" },
  { code: "fr-FR",  name: "Français",        flag: "🇫🇷" },
  { code: "de-DE",  name: "Deutsch",         flag: "🇩🇪" },
  { code: "es-ES",  name: "Español",         flag: "🇪🇸" },
  { code: "pt-PT",  name: "Português (PT)",  flag: "🇵🇹" },
  { code: "pt-BR",  name: "Português (BR)",  flag: "🇧🇷" },
  { code: "it-IT",  name: "Italiano",        flag: "🇮🇹" },
  { code: "nl-NL",  name: "Nederlands",      flag: "🇳🇱" },
  { code: "pl-PL",  name: "Polski",          flag: "🇵🇱" },
  { code: "ro-RO",  name: "Română",          flag: "🇷🇴" },
  { code: "hu-HU",  name: "Magyar",          flag: "🇭🇺" },
  { code: "el-GR",  name: "Ελληνικά",        flag: "🇬🇷" },
  { code: "cs-CZ",  name: "Čeština",         flag: "🇨🇿" },
  { code: "sk-SK",  name: "Slovenčina",      flag: "🇸🇰" },
  { code: "bg-BG",  name: "Български",       flag: "🇧🇬" },
  { code: "hr-HR",  name: "Hrvatski",        flag: "🇭🇷" },
  { code: "sr-RS",  name: "Српски",          flag: "🇷🇸" },
  { code: "sl-SI",  name: "Slovenščina",     flag: "🇸🇮" },
  { code: "mk-MK",  name: "Македонски",      flag: "🇲🇰" },
  { code: "sq-AL",  name: "Shqip",           flag: "🇦🇱" },
  { code: "bs-BA",  name: "Bosanski",        flag: "🇧🇦" },
  { code: "sv-SE",  name: "Svenska",         flag: "🇸🇪" },
  { code: "da-DK",  name: "Dansk",           flag: "🇩🇰" },
  { code: "nb-NO",  name: "Norsk",           flag: "🇳🇴" },
  { code: "fi-FI",  name: "Suomi",           flag: "🇫🇮" },
  { code: "is-IS",  name: "Íslenska",        flag: "🇮🇸" },
  { code: "lv-LV",  name: "Latviešu",        flag: "🇱🇻" },
  { code: "lt-LT",  name: "Lietuvių",        flag: "🇱🇹" },
  { code: "et-EE",  name: "Eesti",           flag: "🇪🇪" },
  { code: "ca-ES",  name: "Català",          flag: "🏴" },
  { code: "eu-ES",  name: "Euskara",         flag: "🏴" },
  { code: "gl-ES",  name: "Galego",          flag: "🏴" },
  { code: "cy-GB",  name: "Cymraeg",         flag: "🏴󠁧󠁢󠁷󠁬󠁳󠁿" },
  { code: "ga-IE",  name: "Gaeilge",         flag: "🇮🇪" },
  { code: "mt-MT",  name: "Malti",           flag: "🇲🇹" },
  { code: "af-ZA",  name: "Afrikaans",       flag: "🇿🇦" },
  { code: "sw-KE",  name: "Kiswahili",       flag: "🇰🇪" },
  { code: "am-ET",  name: "አማርኛ",            flag: "🇪🇹" },
  { code: "so-SO",  name: "Soomaali",        flag: "🇸🇴" },
  { code: "yo-NG",  name: "Yorùbá",          flag: "🇳🇬" },
  { code: "ha-NG",  name: "Hausa",           flag: "🇳🇬" },
  { code: "ig-NG",  name: "Igbo",            flag: "🇳🇬" },
  { code: "zu-ZA",  name: "isiZulu",         flag: "🇿🇦" },
  { code: "xh-ZA",  name: "isiXhosa",        flag: "🇿🇦" },
  { code: "st-ZA",  name: "Sesotho",         flag: "🇱🇸" },
  { code: "sn-ZW",  name: "chiShona",        flag: "🇿🇼" },
  { code: "rw-RW",  name: "Kinyarwanda",     flag: "🇷🇼" },
  { code: "ln-CD",  name: "Lingála",         flag: "🇨🇩" },
  { code: "mg-MG",  name: "Malagasy",        flag: "🇲🇬" },
  { code: "om-ET",  name: "Afaan Oromoo",    flag: "🇪🇹" },
  { code: "ti-ER",  name: "ትግርኛ",            flag: "🇪🇷" },
];

const SUGGESTIONS = [
  { icon: Brain,        label: "What is machine learning?",             category: "AI" },
  { icon: Calculator,   label: "Solve: What is 25% of 480?",            category: "Math" },
  { icon: FlaskConical, label: "How does photosynthesis work?",          category: "Science" },
  { icon: Code2,        label: "Write a Python function to sort a list", category: "Code" },
  { icon: Landmark,     label: "Who was the first person on the Moon?",  category: "History" },
  { icon: Utensils,     label: "How do I make a simple pasta sauce?",    category: "Cooking" },
  { icon: PenLine,      label: "Write a short poem about the ocean",     category: "Creative" },
  { icon: Heart,        label: "What are 5 habits for better sleep?",    category: "Health" },
];

const QUICK_ACTIONS = [
  { icon: Brain,      label: "Explain a concept",  color: "#8b5cf6", prompt: "Explain "          },
  { icon: PenLine,    label: "Help me write",       color: "#ec4899", prompt: "Help me write "    },
  { icon: Calculator, label: "Solve a problem",     color: "#3b82f6", prompt: "Solve: "           },
  { icon: FileText,   label: "Summarize a topic",   color: "#10b981", prompt: "Summarize "        },
  { icon: Code2,      label: "Write some code",     color: "#f59e0b", prompt: "Write code to "   },
  { icon: Shuffle,    label: "Surprise me",         color: "#ef4444", prompt: "__surprise__"      },
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
  "How does the human immune system fight viruses?",
  "Write a short story about an AI that discovers emotions",
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

// ── Markdown code renderer with syntax highlighting ──────────────────────────
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

export default function Chat() {
  const [, navigate] = useLocation();
  const { user, logout, loading: authLoading } = useAuth();
  const {
    messages, sessions, isGuest, isInitializing, isLoadingMessages, isSending,
    streamingContent, sendMessage, newChat, switchSession, renameSession, error,
  } = useChat();

  const [input, setInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceInputPending, setVoiceInputPending] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [selectedLang, setSelectedLang] = useState(LANGUAGES[0]);

  // Feature states
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [feedbackMap, setFeedbackMap] = useState<Record<string, "up" | "down">>({});
  const [sessionSearch, setSessionSearch] = useState("");
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const [voiceSupported] = useState(
    () => typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
  );
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const langMenuRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  const voiceModeRef = useRef(false);
  const selectedLangRef = useRef(LANGUAGES[0]);
  const sendMessageRef = useRef<((msg: string, lang?: string) => Promise<void>) | null>(null);
  const voiceInputPendingRef = useRef(false);
  const wasVoiceSendRef = useRef(false);

  useEffect(() => { selectedLangRef.current = selectedLang; }, [selectedLang]);

  // Scroll-to-bottom detection
  useEffect(() => {
    const el = chatAreaRef.current;
    if (!el) return;
    const onScroll = () => {
      const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      setShowScrollBottom(distFromBottom > 250);
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

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
    const lines: string[] = [
      "═══════════════════════════════════════",
      "  EduAssistant — Conversation Export",
      `  Exported: ${new Date().toLocaleString()}`,
      "═══════════════════════════════════════",
      "",
    ];
    messages.forEach((msg) => {
      lines.push(msg.role === "user" ? "You:" : "EduAssistant:");
      lines.push(msg.content);
      lines.push("");
    });
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `eduassistant-chat-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [messages]);

  // ── Session rename ──────────────────────────────────────────────────────────
  const startRename = (id: string, currentTitle: string | null, currentPreview: string) => {
    setEditingSessionId(id);
    setEditingTitle(currentTitle ?? currentPreview.slice(0, 50));
    setTimeout(() => editInputRef.current?.focus(), 50);
  };

  const submitRename = async () => {
    if (!editingSessionId || !editingTitle.trim()) {
      setEditingSessionId(null);
      return;
    }
    await renameSession(editingSessionId, editingTitle.trim());
    setEditingSessionId(null);
  };

  // ── Feedback ────────────────────────────────────────────────────────────────
  const toggleFeedback = (msgId: string, direction: "up" | "down") => {
    setFeedbackMap(prev => {
      const current = prev[msgId];
      if (current === direction) {
        const next = { ...prev };
        delete next[msgId];
        return next;
      }
      return { ...prev, [msgId]: direction };
    });
  };

  // ── Voice ───────────────────────────────────────────────────────────────────
  const startListening = useCallback(() => {
    if (!voiceSupported) return;
    const Ctor = (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionInstance; webkitSpeechRecognition?: new () => SpeechRecognitionInstance }).SpeechRecognition
      ?? (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionInstance }).webkitSpeechRecognition;
    if (!Ctor) return;

    const recognition = new Ctor();
    recognition.lang = selectedLangRef.current.code;
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
      setInput(() => {
        if (interim) return `${finalTranscript}[…${interim}]`;
        return finalTranscript;
      });
    };

    recognition.onerror = () => { setIsListening(false); };

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

  const toggleListening = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      startListening();
    }
  }, [isListening, startListening]);

  // ── TTS ─────────────────────────────────────────────────────────────────────
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [voiceMode, setVoiceMode] = useState(false);

  useEffect(() => { voiceModeRef.current = voiceMode; }, [voiceMode]);
  useEffect(() => { sendMessageRef.current = sendMessage; }, [sendMessage]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setShowLangMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const stripMarkdown = (text: string) =>
    text
      .replace(/#{1,6}\s+/g, "")
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/\*(.+?)\*/g, "$1")
      .replace(/`{1,3}[^`]*`{1,3}/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/[>\-*_~]/g, "")
      .replace(/\n{2,}/g, ". ")
      .replace(/\n/g, " ")
      .trim();

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setSpeakingMsgId(null);
  }, []);

  const speak = useCallback((text: string, msgId: string) => {
    if (!window.speechSynthesis) return;
    stopSpeaking();
    const clean = stripMarkdown(text);
    const currentLang = selectedLangRef.current;
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = currentLang.code;
    utterance.rate = 0.95;
    utterance.pitch = 1;

    const voices = window.speechSynthesis.getVoices();
    const langPrefix = currentLang.code.split("-")[0];
    const preferred = voices.find(
      (v) => v.lang === currentLang.code && (v.name.includes("Natural") || v.name.includes("Google"))
    ) ?? voices.find((v) => v.lang === currentLang.code)
      ?? voices.find((v) => v.lang.startsWith(langPrefix));
    if (preferred) utterance.voice = preferred;

    utterance.onstart = () => { setIsSpeaking(true); setSpeakingMsgId(msgId); };
    utterance.onend = () => {
      setIsSpeaking(false);
      setSpeakingMsgId(null);
      if (voiceModeRef.current) setTimeout(() => startListening(), 500);
    };
    utterance.onerror = () => { setIsSpeaking(false); setSpeakingMsgId(null); };
    window.speechSynthesis.speak(utterance);
  }, [stopSpeaking, startListening]);

  const lastSpokenIdRef = useRef<string | null>(null);
  useEffect(() => {
    const shouldAutoSpeak = voiceModeRef.current || wasVoiceSendRef.current;
    if (!shouldAutoSpeak || isSending) return;
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg || lastMsg.role !== "assistant") return;
    if (lastMsg.id === lastSpokenIdRef.current) return;
    lastSpokenIdRef.current = lastMsg.id;
    wasVoiceSendRef.current = false;
    setTimeout(() => speak(lastMsg.content, lastMsg.id), 300);
  }, [messages, isSending, speak]);

  useEffect(() => () => { window.speechSynthesis?.cancel(); }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSending || isInitializing) return;
    const message = input.trim();
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "44px";
    if (voiceInputPendingRef.current) {
      wasVoiceSendRef.current = true;
      voiceInputPendingRef.current = false;
      setVoiceInputPending(false);
    }
    await sendMessage(message, selectedLang.code);
  };

  const handleSuggestion = (text: string) => {
    setInput(text);
    textareaRef.current?.focus();
  };

  const handleQuickAction = (prompt: string) => {
    if (prompt === "__surprise__") {
      const random = SURPRISE_QUESTIONS[Math.floor(Math.random() * SURPRISE_QUESTIONS.length)];
      setInput(random);
    } else {
      setInput(prompt);
    }
    textareaRef.current?.focus();
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (voiceInputPendingRef.current) {
      voiceInputPendingRef.current = false;
      setVoiceInputPending(false);
    }
    e.target.style.height = "44px";
    e.target.style.height = Math.min(e.target.scrollHeight, 128) + "px";
  };

  const isReady = !isInitializing && !isLoadingMessages;

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const formatSessionDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 86400000) return "Today";
    if (diff < 172800000) return "Yesterday";
    if (diff < 604800000) return d.toLocaleDateString(undefined, { weekday: "long" });
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  const filteredSessions = sessions.filter(s => {
    if (!sessionSearch.trim()) return true;
    const q = sessionSearch.toLowerCase();
    return (
      (s.title ?? "").toLowerCase().includes(q) ||
      (s.preview ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">

      {/* ── Sidebar ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              key="sidebar-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              key="sidebar-panel"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-72 bg-background border-r border-border flex flex-col shadow-2xl"
            >
              {/* Sidebar header */}
              <div className="flex items-center justify-between px-4 py-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="font-semibold text-sm text-foreground">Chat History</span>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* New Chat button */}
              <div className="px-3 py-3 border-b border-border">
                <button
                  onClick={() => { newChat(); setSidebarOpen(false); setInput(""); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all text-sm font-semibold shadow-sm active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  New chat
                </button>
              </div>

              {/* Search sessions */}
              {sessions.length > 0 && (
                <div className="px-3 py-2 border-b border-border">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/60 border border-border">
                    <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <input
                      type="text"
                      placeholder="Search chats…"
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
                    <p className="text-xs text-center">
                      {sessionSearch ? "No chats match your search." : "No chat history yet. Start a conversation!"}
                    </p>
                  </div>
                ) : (
                  filteredSessions.map((s) => (
                    <div key={s.id} className="group relative">
                      {editingSessionId === s.id ? (
                        <div className="px-3 py-2">
                          <input
                            ref={editInputRef}
                            type="text"
                            value={editingTitle}
                            onChange={e => setEditingTitle(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === "Enter") submitRename();
                              if (e.key === "Escape") setEditingSessionId(null);
                            }}
                            onBlur={submitRename}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-primary bg-primary/5 text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                            maxLength={80}
                          />
                          <p className="text-xs text-muted-foreground mt-1 px-1">Enter to save · Esc to cancel</p>
                        </div>
                      ) : (
                        <button
                          onClick={() => { switchSession(s.id); setSidebarOpen(false); }}
                          className="w-full text-left px-4 py-3 hover:bg-secondary/60 transition-colors pr-10"
                        >
                          <p className="text-xs text-muted-foreground mb-0.5 font-medium">
                            {formatSessionDate(s.createdAt)}
                          </p>
                          <p className="text-sm text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors font-medium">
                            {s.title ?? s.preview}
                          </p>
                          {s.title && (
                            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{s.preview}</p>
                          )}
                        </button>
                      )}
                      {/* Rename button on hover */}
                      {!isGuest && editingSessionId !== s.id && (
                        <button
                          onClick={e => { e.stopPropagation(); startRename(s.id, s.title, s.preview); }}
                          title="Rename"
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-secondary text-muted-foreground hover:text-foreground"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Header ── */}
      <header className="flex-shrink-0 h-16 border-b border-border/50 bg-background/80 backdrop-blur-md flex items-center px-4 md:px-6 justify-between z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            title="Chat history"
            className="p-2 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

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
          {/* Export button */}
          {messages.length > 0 && (
            <button
              onClick={exportConversation}
              title="Export conversation"
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>
          )}

          {/* Language selector */}
          <div className="relative" ref={langMenuRef}>
            <button
              onClick={() => setShowLangMenu((v) => !v)}
              title="Select response language"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-border bg-secondary/60 text-muted-foreground hover:border-primary/40 hover:text-primary transition-all"
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{selectedLang.flag} {selectedLang.name}</span>
              <span className="sm:hidden">{selectedLang.flag}</span>
              <ChevronDown className="w-3 h-3" />
            </button>
            <AnimatePresence>
              {showLangMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-1 z-50 w-48 max-h-72 overflow-y-auto rounded-xl border border-border bg-background/95 backdrop-blur-sm shadow-xl py-1"
                >
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => { setSelectedLang(lang); setShowLangMenu(false); }}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors hover:bg-secondary/60",
                        selectedLang.code === lang.code ? "text-primary font-semibold bg-primary/5" : "text-muted-foreground"
                      )}
                    >
                      <span className="text-base leading-none">{lang.flag}</span>
                      <span>{lang.name}</span>
                      {selectedLang.code === lang.code && <span className="ml-auto text-primary">✓</span>}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Voice Mode toggle */}
          {voiceSupported && (
            <button
              onClick={() => {
                const next = !voiceMode;
                setVoiceMode(next);
                if (next) {
                  setTimeout(() => startListening(), 100);
                } else {
                  stopSpeaking();
                  recognitionRef.current?.stop();
                  setIsListening(false);
                }
              }}
              title={voiceMode ? "Voice Mode ON — click to turn off" : "Turn on Voice Mode — fully hands-free"}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all",
                voiceMode
                  ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                  : "bg-secondary text-muted-foreground border-border hover:border-primary/40 hover:text-primary"
              )}
            >
              <Radio className={cn("w-3.5 h-3.5", voiceMode && "animate-pulse")} />
              <span className="hidden sm:inline">
                {voiceMode
                  ? isSpeaking ? "Speaking…" : isListening ? "Listening…" : "Voice ON"
                  : "Voice Mode"}
              </span>
            </button>
          )}

          {isGuest ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate("/login")}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-border bg-secondary/60 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all"
              >
                Sign in
              </button>
              <button
                onClick={() => navigate("/signup")}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
              >
                Sign up free
              </button>
            </div>
          ) : (
            <>
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-secondary/60 border border-border text-sm">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-primary text-xs font-bold">{user?.username[0].toUpperCase()}</span>
                </div>
                <span className="font-medium text-foreground">{user?.username}</span>
              </div>
              <button
                onClick={logout}
                className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </header>

      {/* Guest banner */}
      {isGuest && (
        <div className="w-full bg-primary/5 border-b border-primary/20 px-4 py-2.5 flex items-center justify-center gap-3 text-sm">
          <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
          <span className="text-muted-foreground">
            You're chatting as a <span className="font-semibold text-foreground">guest</span> — your history won't be saved.
          </span>
          <button
            onClick={() => navigate("/signup")}
            className="ml-1 text-primary font-semibold hover:underline shrink-0"
          >
            Sign up free →
          </button>
        </div>
      )}

      {/* ── Chat Area ── */}
      <div ref={chatAreaRef} className="flex-1 overflow-y-auto p-4 md:p-6 w-full max-w-4xl mx-auto relative">
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="h-full flex flex-col items-center justify-center text-center px-4"
          >
            <motion.h2
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="text-3xl md:text-4xl font-bold text-foreground mb-8 tracking-tight"
            >
              What can I help with?
            </motion.h2>

            {/* Quick action pills */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex flex-wrap justify-center gap-3 max-w-xl mb-8"
            >
              {QUICK_ACTIONS.map((action, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 + i * 0.06, duration: 0.3 }}
                  onClick={() => handleQuickAction(action.prompt)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-border bg-card hover:bg-secondary/70 hover:border-primary/40 hover:shadow-md transition-all text-sm font-medium text-foreground shadow-sm active:scale-95"
                >
                  <action.icon className="w-4 h-4 shrink-0" style={{ color: action.color }} />
                  {action.label}
                </motion.button>
              ))}
            </motion.div>

            {/* Suggested starter questions */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.5 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-2xl mb-6"
            >
              {SUGGESTIONS.map((s, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.05, duration: 0.3 }}
                  onClick={() => handleSuggestion(s.label)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border/60 bg-card/60 hover:bg-secondary/60 hover:border-primary/30 transition-all text-left group"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <s.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-muted-foreground mb-0.5">{s.category}</p>
                    <p className="text-sm text-foreground leading-tight line-clamp-1">{s.label}</p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
                </motion.button>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="flex items-center gap-2 text-xs text-muted-foreground"
            >
              <Sparkles className="w-3 h-3" />
              <span>Ask anything — EduAssistant knows it all</span>
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
                    "flex items-start gap-3 max-w-3xl group",
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
                      ? (user?.username?.[0]?.toUpperCase() ?? "G")
                      : <Bot className="w-4 h-4" />}
                  </div>

                  <div className={cn(
                    "px-5 py-4 rounded-2xl shadow-sm max-w-[85%] relative",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-card border border-border/50 text-foreground rounded-tl-sm",
                    speakingMsgId === msg.id && "ring-2 ring-primary/40"
                  )}>
                    {/* Copy button (top right, show on hover) */}
                    <button
                      onClick={() => copyMessage(msg.content, msg.id)}
                      title="Copy message"
                      className={cn(
                        "absolute top-2 right-2 p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100",
                        msg.role === "user"
                          ? "hover:bg-primary-foreground/20 text-primary-foreground/60 hover:text-primary-foreground"
                          : "hover:bg-secondary text-muted-foreground/50 hover:text-muted-foreground"
                      )}
                    >
                      {copiedMsgId === msg.id
                        ? <Check className="w-3.5 h-3.5 text-green-500" />
                        : <Copy className="w-3.5 h-3.5" />}
                    </button>

                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm md:prose-base dark:prose-invert prose-p:leading-relaxed prose-headings:font-bold max-w-none pr-6">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm, remarkMath]}
                          rehypePlugins={[rehypeKatex]}
                          components={{
                            code: ({ node, inline, className, children, ...props }: any) => (
                              <CodeBlock inline={inline} className={className} {...props}>
                                {children}
                              </CodeBlock>
                            ),
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>

                        {/* Bottom row */}
                        <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-3 flex-wrap">
                            {msg.confidence !== null && msg.confidence !== undefined && msg.confidence > 0 && (
                              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
                                Knowledge confidence: {Math.round(msg.confidence * 100)}%
                              </span>
                            )}
                            {msg.detectedLang && (
                              <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium border border-primary/20">
                                <Globe className="w-3 h-3" />
                                {msg.detectedLang.flag} Detected: {msg.detectedLang.name}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* Feedback buttons */}
                            <button
                              onClick={() => toggleFeedback(msg.id, "up")}
                              title="Good response"
                              className={cn(
                                "p-1 rounded-lg transition-colors",
                                feedbackMap[msg.id] === "up"
                                  ? "text-green-500 bg-green-500/10"
                                  : "text-muted-foreground/40 hover:text-green-500 hover:bg-green-500/10"
                              )}
                            >
                              <ThumbsUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => toggleFeedback(msg.id, "down")}
                              title="Bad response"
                              className={cn(
                                "p-1 rounded-lg transition-colors",
                                feedbackMap[msg.id] === "down"
                                  ? "text-red-500 bg-red-500/10"
                                  : "text-muted-foreground/40 hover:text-red-500 hover:bg-red-500/10"
                              )}
                            >
                              <ThumbsDown className="w-3.5 h-3.5" />
                            </button>

                            {/* Soundwave */}
                            {speakingMsgId === msg.id && (
                              <div className="flex items-end gap-0.5 h-4">
                                {[0, 150, 75, 225, 0].map((delay, i) => (
                                  <span
                                    key={i}
                                    className="w-0.5 rounded-full bg-primary animate-bounce"
                                    style={{ height: `${[6,12,8,10,5][i]}px`, animationDelay: `${delay}ms` }}
                                  />
                                ))}
                              </div>
                            )}

                            {/* Speak / stop button */}
                            <button
                              type="button"
                              onClick={() =>
                                speakingMsgId === msg.id ? stopSpeaking() : speak(msg.content, msg.id)
                              }
                              title={speakingMsgId === msg.id ? "Stop speaking" : "Read aloud"}
                              className={cn(
                                "p-1 rounded-lg transition-colors",
                                speakingMsgId === msg.id
                                  ? "text-primary hover:text-primary/70"
                                  : "text-muted-foreground/50 hover:text-primary hover:bg-primary/10"
                              )}
                            >
                              {speakingMsgId === msg.id
                                ? <VolumeX className="w-3.5 h-3.5" />
                                : <Volume2 className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="leading-relaxed whitespace-pre-wrap pr-6">{msg.content}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Streaming / thinking indicator */}
            {isSending && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 max-w-3xl mr-auto"
              >
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 mt-1">
                  <Bot className="w-4 h-4" />
                </div>
                {streamingContent !== null && streamingContent.length > 0 ? (
                  <div className="px-5 py-4 rounded-2xl bg-card border border-border/50 rounded-tl-sm max-w-[85%]">
                    <div className="prose prose-sm md:prose-base dark:prose-invert prose-p:leading-relaxed prose-headings:font-bold max-w-none">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm, remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                        components={{
                          code: ({ node, inline, className, children, ...props }: any) => (
                            <CodeBlock inline={inline} className={className} {...props}>
                              {children}
                            </CodeBlock>
                          ),
                        }}
                      >
                        {streamingContent}
                      </ReactMarkdown>
                    </div>
                    <span className="inline-block w-0.5 h-4 bg-primary animate-pulse ml-0.5 align-middle" />
                  </div>
                ) : (
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
                )}
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Scroll-to-bottom floating button */}
        <AnimatePresence>
          {showScrollBottom && messages.length > 0 && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={scrollToBottom}
              className="fixed bottom-28 right-6 z-20 p-2.5 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all hover:shadow-primary/50"
              title="Scroll to bottom"
            >
              <ArrowDown className="w-4 h-4" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* ── Input Area ── */}
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

          {/* Voice-input pending hint */}
          <AnimatePresence>
            {voiceInputPending && input.trim() && (
              <motion.div
                key="voice-pending-hint"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                className="flex items-center gap-2 mb-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 w-fit mx-auto"
              >
                <Mic className="w-3 h-3 text-amber-500" />
                <span className="text-xs font-medium text-amber-500">Voice message ready — AI will speak the reply</span>
                <Volume2 className="w-3 h-3 text-amber-500" />
              </motion.div>
            )}
          </AnimatePresence>

          <form
            onSubmit={handleSubmit}
            className={cn(
              "flex items-end gap-2 rounded-2xl border bg-card shadow-sm transition-all",
              isListening
                ? "border-red-400 shadow-red-500/10"
                : voiceInputPending
                ? "border-amber-400 shadow-amber-500/10"
                : "border-border focus-within:border-primary/50 focus-within:shadow-primary/10"
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
                  : voiceInputPending
                  ? "Voice captured — press Enter to send"
                  : isReady
                  ? "Ask anything… (Enter to send, Shift+Enter for new line)"
                  : "Connecting…"
              }
              disabled={!isReady || isSending}
              className="flex-1 bg-transparent resize-none outline-none p-3 text-foreground placeholder:text-muted-foreground"
              style={{ minHeight: "44px", maxHeight: "128px" }}
              rows={1}
            />

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
                    : voiceInputPending
                    ? "bg-amber-500 text-white hover:bg-amber-600"
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
              {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-2">
            EduAssistant · Your intelligent AI learning companion
          </p>
        </div>
      </div>
    </div>
  );
}
