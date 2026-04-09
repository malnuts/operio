import { useI18n } from "@/hooks/useI18n";

import type { SuggestedAction } from "./chat-context";

interface AgentSuggestedActionsProps {
  actions: SuggestedAction[];
  onSelect: (prompt: string) => void;
  disabled?: boolean;
}

const AgentSuggestedActions = ({ actions, onSelect, disabled }: AgentSuggestedActionsProps) => {
  const { t } = useI18n();

  if (actions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 px-4 pb-2">
      {actions.map((action) => (
        <button
          key={action.labelKey}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(action.prompt)}
          className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:opacity-50"
        >
          {t(action.labelKey)}
        </button>
      ))}
    </div>
  );
};

export default AgentSuggestedActions;
