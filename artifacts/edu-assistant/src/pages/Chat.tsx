import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Send, ArrowLeft, Bot, User, Loader2, ShieldCheck, RefreshCw, LogOut } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useChat } from "@/hooks/use-chat";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

export default function Chat() {
  const [, navigate] = useLocation();
  const { user, logout, loading: authLoading } = useAuth();
  const { messages, isInitializing, isLoadingMessages, isSending, sendMessage, error } = useChat();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [authLoading, user, navigate]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSending || isInitializing) return;
    
    const message = input;
    setInput("");
    await sendMessage(message);
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
    <div className="flex flex-col h-screen bg-background overflow-hidden relative">
      {/* App Header */}
      <header className="flex-shrink-0 h-16 glass-panel border-b border-border/50 flex items-center px-4 justify-between z-10">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="p-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="bg-primary/20 p-1.5 rounded-md">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-sm leading-tight text-foreground">EduAssistant AI</h1>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500"></span> Online
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50 border border-border text-sm">
            <User className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="font-medium text-foreground">{user.username}</span>
          </div>
          <button
            onClick={logout}
            className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto chat-scroll p-4 md:p-6 w-full max-w-4xl mx-auto">
        {isInitializing || isLoadingMessages ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
            <p>Initializing knowledge base...</p>
          </div>
        ) : error ? (
          <div className="h-full flex flex-col items-center justify-center text-destructive">
            <p className="mb-4">Failed to load chat session.</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-70">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 border border-primary/20">
              <Bot className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Welcome to EduAssistant</h2>
            <p className="text-muted-foreground max-w-sm">
              I'm connected to the curated curriculum knowledge base. Ask me anything about Artificial Intelligence, Computer Science, or programming!
            </p>
            <div className="mt-8 grid gap-2 w-full max-w-md">
              {[
                "What is Artificial Intelligence?",
                "Explain how a compiler works.",
                "What's the difference between Machine Learning and Deep Learning?"
              ].map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => setInput(suggestion)}
                  className="p-3 text-sm text-left border border-border rounded-xl bg-card hover:bg-secondary/50 hover:border-primary/30 transition-colors"
                >
                  "{suggestion}"
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6 pb-4">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={cn(
                  "flex items-start gap-4 max-w-3xl",
                  msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1",
                  msg.role === "user" ? "bg-accent text-primary" : "bg-primary text-primary-foreground"
                )}>
                  {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                
                <div className={cn(
                  "px-5 py-4 rounded-2xl shadow-sm",
                  msg.role === "user" 
                    ? "bg-primary text-primary-foreground rounded-tr-sm" 
                    : "bg-card border border-border/50 text-foreground rounded-tl-sm"
                )}>
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm md:prose-base dark:prose-invert prose-p:leading-relaxed max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                      </ReactMarkdown>
                      
                      {msg.confidence !== null && msg.confidence !== undefined && (
                        <div className="mt-4 pt-3 border-t border-border flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                          <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
                          Knowledge Match Confidence: {Math.round(msg.confidence * 100)}%
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
              </div>
            ))}
            
            {isSending && (
              <div className="flex items-start gap-4 max-w-3xl mr-auto animate-pulse">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 mt-1">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="px-5 py-4 rounded-2xl bg-card border border-border/50 rounded-tl-sm flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "0ms" }}></div>
                  <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "150ms" }}></div>
                  <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "300ms" }}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 bg-background/80 backdrop-blur-md border-t border-border p-4 w-full">
        <div className="max-w-4xl mx-auto relative">
          <form 
            onSubmit={handleSubmit}
            className="relative flex items-end gap-2 bg-card border-2 border-border focus-within:border-primary/50 focus-within:shadow-md transition-all rounded-2xl p-2"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder={isReady ? "Ask a question..." : "Connecting..."}
              disabled={!isReady || isSending}
              className="flex-1 max-h-32 min-h-[44px] bg-transparent resize-none outline-none p-3 text-foreground placeholder:text-muted-foreground chat-scroll"
              rows={1}
            />
            <button
              type="submit"
              disabled={!input.trim() || !isReady || isSending}
              className="p-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all mb-1 mr-1 shrink-0"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
          <div className="text-center mt-2">
            <p className="text-xs text-muted-foreground">
              EduAssistant may occasionally produce unexpected results. Answers are based on curated data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
