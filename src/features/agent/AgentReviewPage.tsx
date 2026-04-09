import { useState } from "react";
import { Link } from "react-router-dom";
import { ClipboardCheck } from "lucide-react";

import CreatorShell from "@/components/CreatorShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/hooks/useI18n";

import ReviewPanel from "./ReviewPanel";
import { usePageContext } from "./usePageContext";
import { useAgentJobs } from "./useAgentJobs";
import type { ProvenanceStatus } from "./types";

const statusFilters: Array<{ value: ProvenanceStatus | "all"; labelKey: string }> = [
  { value: "all", labelKey: "agent.review.filter.all" },
  { value: "pending_review", labelKey: "agent.review.filter.pending" },
  { value: "approved", labelKey: "agent.review.filter.approved" },
  { value: "rejected", labelKey: "agent.review.filter.rejected" },
  { value: "revised_by_human", labelKey: "agent.review.filter.revised" },
];

const AgentReviewPage = () => {
  const { t } = useI18n();
  const { jobs, setReviewStatus } = useAgentJobs();
  const [filter, setFilter] = useState<ProvenanceStatus | "all">("pending_review");

  usePageContext({ role: "creator", page: "agent-review" }, []);

  const filteredJobs = jobs.filter((j) => {
    if (!j.provenance) return false;
    if (filter === "all") return true;
    return j.provenance.status === filter;
  });

  const pendingCount = jobs.filter(
    (j) => j.provenance?.status === "pending_review",
  ).length;

  return (
    <CreatorShell
      badge={t("agent.review.badge")}
      title={t("agent.review.title")}
      description={t("agent.review.description")}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/creator/agent">{t("agent.review.backToDraft")}</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/creator">{t("creator.back")}</Link>
          </Button>
        </div>
      }
    >
      {/* Stats */}
      <div className="flex items-center gap-3">
        <ClipboardCheck className="h-5 w-5 text-primary" />
        <span className="text-sm text-muted-foreground">
          {t("agent.review.pendingCount", { count: String(pendingCount) })}
        </span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {statusFilters.map((sf) => (
          <Button
            key={sf.value}
            variant={filter === sf.value ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(sf.value)}
          >
            {t(sf.labelKey)}
          </Button>
        ))}
      </div>

      {/* Job list */}
      {filteredJobs.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("agent.review.empty.title")}</CardTitle>
            <CardDescription>{t("agent.review.empty.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/creator/agent">{t("agent.review.empty.action")}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredJobs.map((job) => (
            <ReviewPanel
              key={job.id}
              job={job}
              onStatusChange={setReviewStatus}
            />
          ))}
        </div>
      )}
    </CreatorShell>
  );
};

export default AgentReviewPage;
