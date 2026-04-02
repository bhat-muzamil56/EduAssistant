import { useState, useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetChatMessages,
  useSendChatMessage,
  getGetChatMessagesQueryKey,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const SESSION_STORAGE_PREFIX = "chatSessionId_";

async function fetchMySession(token: string): Promise<string> {
  const res = await fetch(`${API_BASE}/api/chat/my-session`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to get session");
  const data = await res.json();
  return data.id as string;
}

export function useChat() {
  const { user, token } = useAuth();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const initStarted = useRef(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (!token || !user || initStarted.current) return;
    initStarted.current = true;

    const storageKey = `${SESSION_STORAGE_PREFIX}${user.id}`;
    const cached = localStorage.getItem(storageKey);

    if (cached) {
      setSessionId(cached);
      setIsInitializing(false);
      return;
    }

    fetchMySession(token)
      .then((id) => {
        localStorage.setItem(storageKey, id);
        setSessionId(id);
      })
      .catch(() => {
        toast({
          title: "Connection Error",
          description: "Could not load your chat session. Please refresh.",
          variant: "destructive",
        });
      })
      .finally(() => {
        setIsInitializing(false);
      });
  }, [token, user]); // eslint-disable-line react-hooks/exhaustive-deps

  const messagesQuery = useGetChatMessages(sessionId ?? "", {
    query: {
      enabled: !!sessionId,
      refetchOnWindowFocus: false,
    },
  });

  const sendMutation = useSendChatMessage({
    mutation: {
      onSuccess: () => {
        if (sessionId) {
          queryClient.invalidateQueries({
            queryKey: getGetChatMessagesQueryKey(sessionId),
          });
        }
      },
      onError: () => {
        toast({
          title: "Failed to send message",
          description: "An error occurred. Please try again.",
          variant: "destructive",
        });
      },
    },
  });

  const sendMessage = useCallback(
    async (content: string) => {
      if (!sessionId || !content.trim()) return;
      await sendMutation.mutateAsync({ sessionId, data: { content } });
    },
    [sessionId, sendMutation]
  );

  return {
    sessionId,
    isInitializing,
    messages: messagesQuery.data ?? [],
    isLoadingMessages: messagesQuery.isLoading && !!sessionId,
    isSending: sendMutation.isPending,
    sendMessage,
    error: messagesQuery.error || sendMutation.error,
  };
}
