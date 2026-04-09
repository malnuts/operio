import { CheckCircle, RefreshCw, RotateCcw, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/hooks/useI18n";

import ProvenanceBadge from "./ProvenanceBadge";
import type { AgentJobRecord, ProvenanceStatus } from "./types";

interface ReviewPanelProps {
  job: AgentJobRecord;
  onStatusChange: (jobId: string, status: ProvenanceStatus) => void;
  onRegenerate?: (job: AgentJobRecord) => void;
}

const formatOutput = (output: Record<string, unknown>): string =>
  JSON.stringify(output, null, 2);

const ReviewPanel = ({ job, onStatusChange, onRegenerate }: ReviewPanelProps) => {
  const { t } = useI18n();

  if (!job.provenance) return null;

  const isPending = job.provenance.status === "pending_review";
  const isApproved = job.provenance.status === "approved";

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-lg">{t(`agent.jobType.${job.type}`)}</CardTitle>
          <ProvenanceBadge provenance={job.provenance} />
          <Badge variant="outline">{job.id}</Badge>
        </div>
        <CardDescription>
          {t("agent.review.created", { date: new Date(job.createdAt).toLocaleString() })}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Side-by-side: input brief vs generated output */}
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-medium text-muted-foreground">
              {t("agent.review.input")}
            </p>
            <pre className="max-h-64 overflow-auto rounded-lg bg-muted/50 p-3 text-xs">
              {JSON.stringify(job.input, null, 2)}
            </pre>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-muted-foreground">
              {t("agent.review.output")}
            </p>
            <pre className="max-h-64 overflow-auto rounded-lg bg-muted/50 p-3 text-xs">
              {job.output ? formatOutput(job.output) : t("agent.review.noOutput")}
            </pre>
          </div>
        </div>

        {/* Human edits history */}
        {job.provenance.humanEdits.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium text-muted-foreground">
              {t("agent.review.editHistory")}
            </p>
            <ul className="space-y-1 text-xs text-muted-foreground">
              {job.provenance.humanEdits.map((edit, i) => (
                <li key={i}>
                  <span className="font-mono">{edit.fieldPath}</span>: {edit.summary}{" "}
                  <span className="text-muted-foreground/60">
                    ({new Date(edit.editedAt).toLocaleString()})
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Review actions */}
        <div className="flex flex-wrap gap-2 border-t border-border pt-4">
          {isPending && (
            <>
              <Button
                size="sm"
                onClick={() => onStatusChange(job.id, "approved")}
              >
                <CheckCircle className="mr-1.5 h-4 w-4" />
                {t("agent.review.approve")}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onStatusChange(job.id, "rejected")}
              >
                <XCircle className="mr-1.5 h-4 w-4" />
                {t("agent.review.reject")}
              </Button>
            </>
          )}
          {isApproved && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onStatusChange(job.id, "pending_review")}
            >
              <RotateCcw className="mr-1.5 h-4 w-4" />
              {t("agent.review.rollback")}
            </Button>
          )}
          {onRegenerate && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onRegenerate(job)}
            >
              <RefreshCw className="mr-1.5 h-4 w-4" />
              {t("agent.review.regenerate")}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ReviewPanel;
