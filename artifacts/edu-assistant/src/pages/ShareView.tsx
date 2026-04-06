import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { Bot, User, GraduationCap, ArrowLeft, Copy, Check, ExternalLink } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface SharedMessage {
  id: string;
  role: string;
  content: string;
  createdAt: string;
}

interface SharedConversation {
  title: string;
  createdAt: string;
  messages: SharedMessage[];
}

export default function ShareView() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [, navigate] = useLocation();
  const [data, setData] = useState<SharedConversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE}/api/chat/share/${token}`)
      .then(r => r.ok ? r.json() : Promise.reject("Not found"))
      .then(d => setData(d))
      .catch(() => setError("This shared conversation was not found or the link has expired."))
      .finally(() => setLoading(false));
  }, [token]);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <Bot className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-xl font-bold text-foreground mb-2">Conversation Not Found</h1>
          <p className="text-sm text-muted-foreground mb-6">{error}</p>
          <button
            onClick={() => navigate("/")}
            className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            Go to EduAssistant
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-md px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="p-2 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="bg-primary/15 p-1.5 rounded-xl">
              <GraduationCap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-sm text-foreground">EduAssistant</h1>
              <p className="text-xs text-muted-foreground">Shared Conversation</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={copyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-border bg-secondary/60 text-muted-foreground hover:text-foreground transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied!" : "Copy link"}
          </button>
          <button
            onClick={() => navigate("/signup")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Try EduAssistant
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-6">
        {/* Title */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-1">{data?.title}</h2>
          <p className="text-sm text-muted-foreground">
            {data?.messages.length} messages · {data?.createdAt ? new Date(data.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) : ""}
          </p>
        </div>

        {/* Messages */}
        <div className="space-y-4">
          {data?.messages.map(msg => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === "assistant" ? "" : "flex-row-reverse"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === "assistant" ? "bg-primary/15" : "bg-secondary"}`}>
                {msg.role === "assistant" ? <Bot className="w-4 h-4 text-primary" /> : <User className="w-4 h-4 text-muted-foreground" />}
              </div>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${msg.role === "assistant" ? "bg-card border border-border" : "bg-primary text-primary-foreground"}`}>
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm max-w-none text-foreground">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="leading-relaxed">{msg.content}</p>
                )}
                <p className={`text-[10px] mt-1 ${msg.role === "assistant" ? "text-muted-foreground/50" : "text-primary-foreground/60"}`}>
                  {new Date(msg.createdAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 text-center p-8 rounded-2xl bg-primary/5 border border-primary/20">
          <div className="w-12 h-12 bg-primary/15 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="w-6 h-6 text-primary" />
          </div>
          <h3 className="font-bold text-foreground mb-2">Start your own conversation</h3>
          <p className="text-sm text-muted-foreground mb-4">EduAssistant is an AI tutor that speaks your language and helps you learn anything.</p>
          <button
            onClick={() => navigate("/signup")}
            className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            Get started free →
          </button>
        </div>
      </div>
    </div>
  );
}
