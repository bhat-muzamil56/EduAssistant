import { useState, useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetChatMessages,
  useSendChatMessage,
  getGetChatMessagesQueryKey,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

const SESSION_KEY = "chatSessionId";

async function createSession(): Promise<string> {
  const res = await fetch("/api/chat/sessions", { method: "POST" });
  if (!res.ok) throw new Error("Failed to create session");
  const data = await res.json();
  return data.id as string;
}

export function useChat() {
  const [sessionId, setSessionId] = useState<string | null>(() =>
    sessionStorage.getItem(SESSION_KEY)
  );
  const [isInitializing, setIsInitializing] = useState(!sessionId);
  const initStarted = useRef(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (sessionId || initStarted.current) return;
    initStarted.current = true;

    createSession()
      .then((id) => {
        sessionStorage.setItem(SESSION_KEY, id);
        setSessionId(id);
      })
      .catch(() => {
        toast({
          title: "Connection Error",
          description: "Could not initialize a chat session. Please refresh the page.",
          variant: "destructive",
        });
      })
      .finally(() => {
        setIsInitializing(false);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
