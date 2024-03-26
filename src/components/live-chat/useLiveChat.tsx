import { useContext } from "react";

import { LiveChatContext } from "@/components/live-chat/LiveChatContext";

export const useLiveChat = () => {
    return useContext(LiveChatContext);
};
