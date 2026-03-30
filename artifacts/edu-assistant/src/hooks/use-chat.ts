import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useCreateChatSession, 
  useGetChatMessages, 
  useSendChatMessage,
  getGetChatMessagesQueryKey
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

export function useChat() {
  const [sessionId, setSessionId] = useState<string | null>(() => sessionStorage.getItem("chatSessionId"));
  const [isInitializing, setIsInitializing] = useState(true);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createSession = useCreateChatSession();

  useEffect(() => {
    let mounted = true;
    
    async function initSession() {
      if (!sessionId) {
        try {
          const res = await createSession.mutateAsync();
          if (mounted) {
            sessionStorage.setItem("chatSessionId", res.id);
            setSessionId(res.id);
          }
        } catch (error) {
          console.error("Failed to create chat session:", error);
          if (mounted) {
            toast({
              title: "Connection Error",
              description: "Could not initialize a chat session. Please refresh the page.",
              variant: "destructive"
            });
          }
        }
      }
      if (mounted) {
        setIsInitializing(false);
      }
    }

    initSession();

    return () => {
      mounted = false;
    };
  }, [sessionId, createSession, toast]);

  // Provide enabled: !!sessionId implicitly via the Orval generated hook setup, 
  // but we enforce it just in case
  const messagesQuery = useGetChatMessages(sessionId || "", {
    query: {
      enabled: !!sessionId,
      refetchOnWindowFocus: false,
    }
  });

  const sendMutation = useSendChatMessage({
    mutation: {
      onSuccess: () => {
        if (sessionId) {
          queryClient.invalidateQueries({
            queryKey: getGetChatMessagesQueryKey(sessionId)
          });
        }
      },
      onError: (error) => {
        toast({
          title: "Failed to send message",
          description: error instanceof Error ? error.message : "An unknown error occurred",
          variant: "destructive"
        });
      }
    }
  });

  const sendMessage = async (content: string) => {
    if (!sessionId || !content.trim()) return;
    
    // Optistic UI could be added here, but relying on rapid refetch for simplicity and accuracy
    await sendMutation.mutateAsync({
      sessionId,
      data: { content }
    });
  };

  return {
    sessionId,
    isInitializing,
    messages: messagesQuery.data || [],
    isLoadingMessages: messagesQuery.isLoading,
    isSending: sendMutation.isPending,
    sendMessage,
    error: messagesQuery.error || sendMutation.error
  };
}
