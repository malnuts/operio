import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { getProvider } from "./provider";
import type { AgentPageContext, ChatMessage, ChatState } from "./chat-context";
import {
  buildSystemPrompt,
  createEmptyChatState,
  createEmptyContext,
  getSuggestedActions,
  readChatState,
  saveChatState,
  type SuggestedAction,
} from "./chat-context";

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------

interface AgentChatContextValue {
  /** Current page context — set by the active page */
  pageContext: AgentPageContext;
  setPageContext: (ctx: AgentPageContext) => void;

  /** Chat state */
  messages: ChatMessage[];
  sendMessage: (content: string) => Promise<void>;
  clearChat: () => void;

  /** Derived */
  suggestedActions: SuggestedAction[];

  /** Panel open state */
  open: boolean;
  setOpen: (open: boolean) => void;

  /** Loading state */
  responding: boolean;
}

const AgentChatContext = createContext<AgentChatContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

const generateMessageId = () =>
  `msg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

export const AgentChatProvider = ({ children }: { children: ReactNode }) => {
  const [pageContext, setPageContextRaw] = useState<AgentPageContext>(createEmptyContext);
  const [chatState, setChatState] = useState<ChatState>(readChatState);
  const [open, setOpen] = useState(false);
  const [responding, setResponding] = useState(false);
  const pageContextRef = useRef(pageContext);

  const setPageContext = useCallback((ctx: AgentPageContext) => {
    pageContextRef.current = ctx;
    setPageContextRaw(ctx);
  }, []);

  const persistChat = useCallback((next: ChatState) => {
    setChatState(next);
    saveChatState(next);
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    const userMessage: ChatMessage = {
      id: generateMessageId(),
      role: "user",
      content,
      timestamp: new Date().toISOString(),
    };

    const withUser: ChatState = {
      ...chatState,
      messages: [...chatState.messages, userMessage],
      contextSnapshot: pageContextRef.current,
    };
    persistChat(withUser);
    setResponding(true);

    try {
      const provider = getProvider();
      const systemPrompt = buildSystemPrompt(pageContextRef.current);

      const response = await provider.generate({
        type: "chat" as never, // chat is a new type — stub handles it via default
        prompt: systemPrompt,
        input: {
          messages: withUser.messages.map((m) => ({ role: m.role, content: m.content })),
          context: pageContextRef.current,
        },
      });

      const assistantContent = typeof response.output.reply === "string"
        ? response.output.reply
        : typeof response.output.content === "string"
          ? response.output.content
          : JSON.stringify(response.output);

      const assistantMessage: ChatMessage = {
        id: generateMessageId(),
        role: "assistant",
        content: assistantContent,
        timestamp: new Date().toISOString(),
      };

      persistChat({
        messages: [...withUser.messages, assistantMessage],
        contextSnapshot: pageContextRef.current,
      });
    } catch (err) {
      const errorMessage: ChatMessage = {
        id: generateMessageId(),
        role: "assistant",
        content: err instanceof Error ? err.message : "Something went wrong. Please try again.",
        timestamp: new Date().toISOString(),
      };
      persistChat({
        messages: [...withUser.messages, errorMessage],
        contextSnapshot: pageContextRef.current,
      });
    } finally {
      setResponding(false);
    }
  }, [chatState, persistChat]);

  const clearChat = useCallback(() => {
    persistChat(createEmptyChatState());
  }, [persistChat]);

  const suggestedActions = useMemo(
    () => getSuggestedActions(pageContext),
    [pageContext],
  );

  const value = useMemo<AgentChatContextValue>(
    () => ({
      pageContext,
      setPageContext,
      messages: chatState.messages,
      sendMessage,
      clearChat,
      suggestedActions,
      open,
      setOpen,
      responding,
    }),
    [pageContext, setPageContext, chatState.messages, sendMessage, clearChat, suggestedActions, open, setOpen, responding],
  );

  return (
    <AgentChatContext.Provider value={value}>
      {children}
    </AgentChatContext.Provider>
  );
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export const useAgentChat = (): AgentChatContextValue => {
  const ctx = useContext(AgentChatContext);
  if (!ctx) throw new Error("useAgentChat must be used within AgentChatProvider");
  return ctx;
};
