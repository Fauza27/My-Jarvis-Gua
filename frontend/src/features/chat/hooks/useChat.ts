import { useMutation, useQueryClient } from "@tanstack/react-query";
import { expenseQueryKeys } from "@/features/expense/hooks/useExpense";
import { useAuthStore } from "@/features/auth/store";
import { semanticSearchExpenses, sendChatMessage } from "../api/chatApi";
import { useChatStore } from "../store";
import { ConversationMessage } from "../types";

export function useSendChatMessage() {
  const queryClient = useQueryClient();
  const setConversationHistory = useChatStore(
    (state) => state.setConversationHistory,
  );
  const setLastActionTaken = useChatStore((state) => state.setLastActionTaken);

  const mutation = useMutation({
    mutationFn: ({
      message,
      history,
    }: {
      message: string;
      history: ConversationMessage[];
    }) =>
      sendChatMessage({
        message,
        conversation_history: history,
      }),
    onMutate: ({ message, history }) => {
      setConversationHistory([...history, { role: "user", content: message }]);
      setLastActionTaken([]);
      return {
        previousHistory: history,
        userId: useAuthStore.getState().user?.id,
      };
    },
    onSuccess: (data, _variables, context) => {
      if (context?.userId !== useAuthStore.getState().user?.id) return;
      setConversationHistory(data.conversation_history);
      setLastActionTaken(data.action_taken || []);
      if (
        data.action_taken?.some((action) =>
          ["create_expense", "update_expense", "delete_expense"].includes(
            action,
          ),
        )
      ) {
        void queryClient.invalidateQueries({ queryKey: expenseQueryKeys.all });
      }
    },
    onError: (_error, _variables, context) => {
      if (
        context?.previousHistory &&
        context.userId === useAuthStore.getState().user?.id
      ) {
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
    mutationFn: ({
      query,
      threshold,
      limit,
      dateFrom,
      dateTo,
    }: {
      query: string;
      threshold?: number;
      limit?: number;
      dateFrom?: string;
      dateTo?: string;
    }) => semanticSearchExpenses(query, threshold, limit, dateFrom, dateTo),
  });
}
