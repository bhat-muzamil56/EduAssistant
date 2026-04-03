import { useState, useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetChatMessages,
  getGetChatMessagesQueryKey,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export interface SessionPreview {
  id: string;
  createdAt: string;
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

async function apiFetch(path: string, token: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export function useChat() {
  const { user, token } = useAuth();
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

  // Load history list whenever user logs in
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

  // Create a brand-new session on the server
  const createNewSession = useCallback(async (): Promise<string | null> => {
    if (!token) return null;
    setIsInitializing(true);
    try {
      const data = await apiFetch("/api/chat/new-session", token, { method: "POST" });
      const newId = data.id as string;
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

  // Clear active session → shows the clean welcome screen
  const newChat = useCallback(() => {
    setSessionId(null);
  }, []);

  // Send via streaming — user message appears instantly, AI streams word-by-word
  const sendMessage = useCallback(
    async (content: string, lang?: string) => {
      if (!content.trim() || !token) return;

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

      try {
        const response = await fetch(`${API_BASE}/api/chat/sessions/${sid}/stream`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
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
                setStreamingContent(prev => (prev ?? "") + event.content);
              } else if (event.type === "done") {
                // Streaming complete — refresh messages from server
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
        setStreamingContent(null);
        setOptimisticMessage(null);
        toast({
          title: "Failed to send message",
          description: "An error occurred. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsSending(false);
        await refreshSessions();
      }
    },
    [sessionId, token, createNewSession, queryClient, refreshSessions, toast]
  );

  // Combine confirmed messages with the optimistic (pending) user message
  const confirmedMessages = messagesQuery.data ?? [];
  const allMessages = optimisticMessage
    ? [...confirmedMessages, optimisticMessage]
    : confirmedMessages;

  return {
    sessionId,
    sessions,
    isInitializing,
    isLoadingSessions,
    messages: allMessages,
    isLoadingMessages: messagesQuery.isLoading && !!sessionId,
    isSending,
    streamingContent,
    sendMessage,
    newChat,
    switchSession,
    refreshSessions,
    error: messagesQuery.error,
  };
}
