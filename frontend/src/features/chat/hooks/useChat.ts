import { useMutation } from "@tanstack/react-query";
import { semanticSearchExpenses, sendChatMessage } from "../api/chatApi";
import { useChatStore } from "../store";
import { ConversationMessage } from "../types";

export function useSendChatMessage() {
  const setConversationHistory = useChatStore((state) => state.setConversationHistory);
  const setLastActionTaken = useChatStore((state) => state.setLastActionTaken);

  const mutation = useMutation({
    mutationFn: ({ message, history }: { message: string; history: ConversationMessage[] }) =>
      sendChatMessage({
        message,
        conversation_history: history,
      }),
    onMutate: ({ message, history }) => {
      setConversationHistory([...history, { role: "user", content: message }]);
      setLastActionTaken([]);
      return { previousHistory: history };
    },
    onSuccess: (data) => {
      setConversationHistory(data.conversation_history);
      setLastActionTaken(data.action_taken || []);
    },
    onError: (_error, _variables, context) => {
      if (context?.previousHistory) {
        setConversationHistory(context.previousHistory);
      }
    },
  });

  const sendMessage = (message: string) => {
    const history = useChatStore.getState().conversationHistory;
    mutation.mutate({ message, history });
  };

  const sendMessageAsync = async (message: string) => {
    const history = useChatStore.getState().conversationHistory;
    return mutation.mutateAsync({ message, history });
  };

  return {
    sendMessage,
    sendMessageAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}

export function useSemanticSearch() {
  return useMutation({
    mutationFn: ({ query, threshold, limit }: { query: string; threshold?: number; limit?: number }) => semanticSearchExpenses(query, threshold, limit),
  });
}
