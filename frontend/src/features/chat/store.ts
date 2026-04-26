import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { ConversationMessage } from "./types";

const MAX_HISTORY_SIZE = 20;

interface ChatState {
  conversationHistory: ConversationMessage[];
  lastActionTaken: string[];
  setConversationHistory: (messages: ConversationMessage[]) => void;
  setLastActionTaken: (actions: string[]) => void;
  clearConversation: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      conversationHistory: [],
      lastActionTaken: [],
      setConversationHistory: (messages) =>
        set({ conversationHistory: messages.slice(-MAX_HISTORY_SIZE) }),
      setLastActionTaken: (actions) => set({ lastActionTaken: actions }),
      clearConversation: () => set({ conversationHistory: [], lastActionTaken: [] }),
    }),
    {
      name: "chat-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        conversationHistory: state.conversationHistory.slice(-MAX_HISTORY_SIZE),
        lastActionTaken: state.lastActionTaken,
      }),
    },
  ),
);
