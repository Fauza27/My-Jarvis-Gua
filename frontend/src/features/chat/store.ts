import { create } from "zustand";
import { ConversationMessage } from "./types";

const MAX_HISTORY_SIZE = 20;

interface ChatState {
  conversationHistory: ConversationMessage[];
  lastActionTaken: string[];
  setConversationHistory: (messages: ConversationMessage[]) => void;
  setLastActionTaken: (actions: string[]) => void;
  clearConversation: () => void;
}

// Financial conversations stay in memory and are cleared when the account changes.
export const useChatStore = create<ChatState>()((set) => ({
  conversationHistory: [],
  lastActionTaken: [],
  setConversationHistory: (messages) =>
    set({ conversationHistory: messages.slice(-MAX_HISTORY_SIZE) }),
  setLastActionTaken: (actions) => set({ lastActionTaken: actions }),
  clearConversation: () => {
    if (typeof window !== "undefined") localStorage.removeItem("chat-storage");
    set({ conversationHistory: [], lastActionTaken: [] });
  },
}));
