import { Bot, CheckCircle, Clock, Pencil, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useI18n } from "@/hooks/useI18n";

import type { ProvenanceRecord } from "./types";

const statusConfig = {
  pending_review: { icon: Clock, variant: "secondary" as const },
  approved: { icon: CheckCircle, variant: "default" as const },
  rejected: { icon: XCircle, variant: "destructive" as const },
  revised_by_human: { icon: Pencil, variant: "outline" as const },
};

interface ProvenanceBadgeProps {
  provenance: ProvenanceRecord;
}

const ProvenanceBadge = ({ provenance }: ProvenanceBadgeProps) => {
  const { t } = useI18n();
  const config = statusConfig[provenance.status];
  const Icon = config.icon;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant={config.variant} className="gap-1.5">
          <Bot className="h-3 w-3" />
          <Icon className="h-3 w-3" />
          {t(`agent.provenance.status.${provenance.status}`)}
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-xs text-xs">
        <p>{t("agent.provenance.model")}: {provenance.modelId}</p>
        <p>{t("agent.provenance.generated")}: {new Date(provenance.generatedAt).toLocaleString()}</p>
        {provenance.humanEdits.length > 0 && (
          <p>{t("agent.provenance.edits", { count: String(provenance.humanEdits.length) })}</p>
        )}
      </TooltipContent>
    </Tooltip>
  );
};

export default ProvenanceBadge;
