import { createContext } from "react";

export interface LiveChatContextType {
  showLiveChat: (type?: string) => void;
  isLiveChatLoading: boolean;
}

export const LiveChatContext = createContext<LiveChatContextType>({
  showLiveChat: (type?: string) => {
    throw new Error("the LiveChatProvider is missing");
  },
  isLiveChatLoading: false,
});
