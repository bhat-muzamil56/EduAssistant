import { useState, useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetChatMessages,
  getGetChatMessagesQueryKey,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const GUEST_SESSION_KEY = "guest_session_id";

export interface SessionPreview {
  id: string;
  createdAt: string;
  title: string | null;
  pinned: boolean;
  shareToken: string | null;
  preview: string;
}

export interface OptimisticMessage {
  id: string;
  role: "user";
  content: string;
  sessionId: string;
  confidence: null;
  createdAt: string;
}

async function apiFetch(path: string, token: string | null, options?: RequestInit) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string> ?? {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export function useChat() {
  const { user, token } = useAuth();
  const isGuest = !user && !token;

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<SessionPreview[]>([]);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [optimisticMessage, setOptimisticMessage] = useState<OptimisticMessage | null>(null);
  const [streamingContent, setStreamingContent] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const sessionsLoaded = useRef(false);

  // ── Smooth token queue (ChatGPT-style typewriter) ──────────────────────────
  // Tokens from the SSE stream are pushed here; a requestAnimationFrame loop
  // drains one token per frame so the user sees words appear one at a time.
  const tokenQueueRef = useRef<string[]>([]);
  const rafRef = useRef<number | null>(null);
  const isDrainingRef = useRef(false);

  const startDraining = useCallback(() => {
    if (isDrainingRef.current) return;
    isDrainingRef.current = true;
    const drain = () => {
      const token = tokenQueueRef.current.shift();
      if (token !== undefined) {
        setStreamingContent(prev => (prev ?? "") + token);
        rafRef.current = requestAnimationFrame(drain);
      } else {
        isDrainingRef.current = false;
        rafRef.current = null;
      }
    };
    rafRef.current = requestAnimationFrame(drain);
  }, []);

  const stopDraining = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    isDrainingRef.current = false;
    tokenQueueRef.current = [];
  }, []);

  // ── Guest: restore session from localStorage on mount ──────────────────────
  useEffect(() => {
    if (isGuest) {
      const stored = localStorage.getItem(GUEST_SESSION_KEY);
      if (stored) setSessionId(stored);
    }
  }, [isGuest]);

  // ── Authenticated: load history list whenever user logs in ─────────────────
  const refreshSessions = useCallback(async () => {
    if (!token) return;
    setIsLoadingSessions(true);
    try {
      const data = await apiFetch("/api/chat/user-sessions", token);
      setSessions(data as SessionPreview[]);
    } catch {
      // silently ignore
    } finally {
      setIsLoadingSessions(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token || !user || sessionsLoaded.current) return;
    sessionsLoaded.current = true;
    refreshSessions();
  }, [token, user, refreshSessions]);

  // Reset when user logs out
  useEffect(() => {
    if (!user) {
      setSessionId(null);
      setSessions([]);
      sessionsLoaded.current = false;
    }
  }, [user]);

  const messagesQuery = useGetChatMessages(sessionId ?? "", {
    query: {
      enabled: !!sessionId,
      refetchOnWindowFocus: false,
    },
  });

  // ── Create a new session (guest or authenticated) ──────────────────────────
  const createNewSession = useCallback(async (): Promise<string | null> => {
    setIsInitializing(true);
    try {
      let newId: string;
      if (token) {
        // Authenticated: create a named session tied to the user
        const data = await apiFetch("/api/chat/new-session", token, { method: "POST" });
        newId = data.id as string;
      } else {
        // Guest: create an anonymous session
        const data = await apiFetch("/api/chat/sessions", null, { method: "POST" });
        newId = data.id as string;
        localStorage.setItem(GUEST_SESSION_KEY, newId);
      }
      setSessionId(newId);
      return newId;
    } catch {
      toast({
        title: "Could not start a new chat",
        description: "Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsInitializing(false);
    }
  }, [token, toast]);

  // Switch to an existing session from history
  const switchSession = useCallback((id: string) => {
    setSessionId(id);
  }, []);

  // Rename a session
  const renameSession = useCallback(async (id: string, title: string) => {
    if (!token) return;
    try {
      await apiFetch(`/api/chat/sessions/${id}/rename`, token, {
        method: "PATCH",
        body: JSON.stringify({ title }),
      });
      setSessions(prev => prev.map(s => s.id === id ? { ...s, title } : s));
    } catch {
      // silently ignore
    }
  }, [token]);

  // Delete a session
  const deleteSession = useCallback(async (id: string) => {
    if (!token) return;
    try {
      await apiFetch(`/api/chat/sessions/${id}`, token, { method: "DELETE" });
      setSessions(prev => prev.filter(s => s.id !== id));
    } catch {
      // silently ignore
    }
  }, [token]);

  // Toggle pin on a session
  const pinSession = useCallback(async (id: string) => {
    if (!token) return;
    try {
      const data = await apiFetch(`/api/chat/sessions/${id}/pin`, token, { method: "PATCH" });
      setSessions(prev => {
        const updated = prev.map(s => s.id === id ? { ...s, pinned: data.pinned as boolean } : s);
        updated.sort((a, b) => {
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return 1;
          return 0;
        });
        return updated;
      });
    } catch {
      // silently ignore
    }
  }, [token]);

  // Generate or get share link for a session
  const shareSession = useCallback(async (id: string): Promise<string | null> => {
    if (!token) return null;
    try {
      const data = await apiFetch(`/api/chat/sessions/${id}/share`, token, { method: "POST" });
      const tok = data.token as string;
      setSessions(prev => prev.map(s => s.id === id ? { ...s, shareToken: tok } : s));
      return tok;
    } catch {
      return null;
    }
  }, [token]);

  // Revoke share link for a session
  const revokeShare = useCallback(async (id: string): Promise<void> => {
    if (!token) return;
    try {
      await apiFetch(`/api/chat/sessions/${id}/share`, token, { method: "DELETE" });
      setSessions(prev => prev.map(s => s.id === id ? { ...s, shareToken: null } : s));
    } catch {
      // silently ignore
    }
  }, [token]);

  // Summarize a session
  const summarizeSession = useCallback(async (id: string): Promise<string | null> => {
    if (!token) return null;
    try {
      const data = await apiFetch(`/api/chat/sessions/${id}/summarize`, token, { method: "POST" });
      return data.summary as string;
    } catch {
      return null;
    }
  }, [token]);

  // Clear active session → shows the clean welcome screen
  const newChat = useCallback(() => {
    if (isGuest) {
      // For guests, clear stored session so a fresh one is created next send
      localStorage.removeItem(GUEST_SESSION_KEY);
    }
    setSessionId(null);
  }, [isGuest]);

  // ── Send message (streaming) ───────────────────────────────────────────────
  const sendMessage = useCallback(
    async (content: string, lang?: string) => {
      if (!content.trim()) return;

      let sid = sessionId;
      if (!sid) {
        sid = await createNewSession();
        if (!sid) return;
      }

      // Show user message immediately
      setOptimisticMessage({
        id: `optimistic-${Date.now()}`,
        role: "user",
        content,
        sessionId: sid,
        confidence: null,
        createdAt: new Date().toISOString(),
      });
      setIsSending(true);
      setStreamingContent("");
      stopDraining();
      tokenQueueRef.current = [];

      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const response = await fetch(`${API_BASE}/api/chat/sessions/${sid}/stream`, {
          method: "POST",
          headers,
          body: JSON.stringify({ content, lang }),
        });

        if (!response.ok || !response.body) {
          throw new Error(`Stream failed: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const event = JSON.parse(line.slice(6));
              if (event.type === "chunk") {
                // Push token into queue; the rAF drain loop will render it
                // one token per frame, giving a smooth typewriter effect.
                tokenQueueRef.current.push(event.content);
                startDraining();
              } else if (event.type === "done") {
                // Wait for any queued tokens to finish rendering before
                // clearing the streaming bubble and showing confirmed messages.
                const drainRemaining = () => new Promise<void>(resolve => {
                  const check = () => {
                    if (tokenQueueRef.current.length === 0 && !isDrainingRef.current) {
                      resolve();
                    } else {
                      setTimeout(check, 16);
                    }
                  };
                  check();
                });
                await drainRemaining();
                stopDraining();
                setStreamingContent(null);
                setOptimisticMessage(null);
                await queryClient.invalidateQueries({
                  queryKey: getGetChatMessagesQueryKey(sid!),
                });
              } else if (event.type === "error") {
                throw new Error(event.message);
              }
            } catch {
              // skip malformed lines
            }
          }
        }
      } catch {
        stopDraining();
        tokenQueueRef.current = [];
        setStreamingContent(null);
        setOptimisticMessage(null);
        toast({
          title: "Failed to send message",
          description: "An error occurred. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsSending(false);
        if (token) await refreshSessions();
      }
    },
    [sessionId, token, createNewSession, queryClient, refreshSessions, toast, startDraining, stopDraining]
  );

  // Regenerate the last AI response (must be after sendMessage is defined)
  const confirmedMessagesRef = useRef<Array<{ id: string; role: string; content: string; createdAt: string; confidence: number | null; sessionId: string }>>([]);

  const regenerate = useCallback(async () => {
    if (!sessionId || isSending) return;
    const msgs = confirmedMessagesRef.current ?? [];
    const lastUserMsg = [...msgs].reverse().find(m => m.role === "user");
    if (!lastUserMsg) return;
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      await fetch(`${API_BASE}/api/chat/sessions/${sessionId}/last-reply`, { method: "DELETE", headers });
      await queryClient.invalidateQueries({ queryKey: getGetChatMessagesQueryKey(sessionId) });
    } catch {
      // silently ignore
    }
    await sendMessage(lastUserMsg.content);
  }, [sessionId, token, queryClient, sendMessage, isSending]);

  // Combine confirmed messages with the optimistic (pending) user message.
  // Guard against a race condition where React Query updates confirmedMessages
  // (now including the user's question from the server) at the same time the
  // optimisticMessage state hasn't been cleared yet — which would show the
  // user's question twice.
  const confirmedMessages = messagesQuery.data ?? [];
  confirmedMessagesRef.current = confirmedMessages;

  const lastConfirmed = confirmedMessages[confirmedMessages.length - 1];
  const optimisticAlreadyConfirmed =
    optimisticMessage &&
    lastConfirmed?.role === "user" &&
    lastConfirmed?.content === optimisticMessage.content;

  const allMessages =
    optimisticMessage && !optimisticAlreadyConfirmed
      ? [...confirmedMessages, optimisticMessage]
      : confirmedMessages;

  return {
    sessionId,
    sessions,
    isGuest,
    isInitializing,
    isLoadingSessions,
    messages: allMessages,
    isLoadingMessages: messagesQuery.isLoading && !!sessionId,
    isSending,
    streamingContent,
    sendMessage,
    newChat,
    switchSession,
    renameSession,
    deleteSession,
    pinSession,
    shareSession,
    revokeShare,
    summarizeSession,
    regenerate,
    refreshSessions,
    error: messagesQuery.error,
  };
}
