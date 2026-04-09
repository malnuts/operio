/**
 * Convenience hook for pages to push their context into the chat assistant.
 * Automatically updates when dependencies change and clears on unmount.
 */

import { useEffect } from "react";

import { useAgentChat } from "./AgentChatProvider";
import { createEmptyContext, type AgentPageContext } from "./chat-context";

export const usePageContext = (context: AgentPageContext, deps: unknown[]) => {
  const { setPageContext } = useAgentChat();

  useEffect(() => {
    setPageContext(context);
    return () => setPageContext(createEmptyContext());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
};
