import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Bot, FileText, GraduationCap, Sparkles } from "lucide-react";

import CreatorShell from "@/components/CreatorShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/hooks/useI18n";

import { usePageContext } from "./usePageContext";
import ReviewPanel from "./ReviewPanel";
import { useAgentJobs } from "./useAgentJobs";
import type {
  AgentJobInput,
  AgentJobRecord,
  AssessmentDraftInput,
  PostDraftInput,
  ProcedureDraftInput,
} from "./types";

type DraftType = "procedure_draft" | "assessment_draft" | "post_draft";

const AgentDraftPage = () => {
  const { t } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const draftType = (searchParams.get("type") ?? "procedure_draft") as DraftType;
  const { jobs, running, error, submit, setReviewStatus } = useAgentJobs();

  usePageContext({ role: "creator", page: "agent-draft" }, [draftType]);

  // Procedure fields
  const [topic, setTopic] = useState("");
  const [objective, setObjective] = useState("");
  const [audience, setAudience] = useState<"Beginner" | "Intermediate" | "Advanced">("Intermediate");
  const [notes, setNotes] = useState("");
  const [format, setFormat] = useState<"simulation" | "video">("simulation");

  // Assessment fields
  const [assessProcedureId, setAssessProcedureId] = useState("");
  const [assessTopic, setAssessTopic] = useState("");
  const [questionCount, setQuestionCount] = useState(5);

  // Post fields
  const [postTopic, setPostTopic] = useState("");
  const [postNotes, setPostNotes] = useState("");
  const [postTags, setPostTags] = useState("");

  const [lastResult, setLastResult] = useState<AgentJobRecord | null>(null);

  const handleSubmit = async () => {
    let input: AgentJobInput;

    switch (draftType) {
      case "procedure_draft":
        input = {
          type: "procedure_draft",
          input: {
            topic,
            learningObjective: objective,
            audienceLevel: audience,
            sourceNotes: notes,
            format,
          } satisfies ProcedureDraftInput,
        };
        break;
      case "assessment_draft":
        input = {
          type: "assessment_draft",
          input: {
            procedureId: assessProcedureId || undefined,
            topic: assessTopic,
            questionCount,
            includeExplanations: true,
            includeDistractorRationale: true,
          } satisfies AssessmentDraftInput,
        };
        break;
      case "post_draft":
        input = {
          type: "post_draft",
          input: {
            topic: postTopic,
            notes: postNotes,
            tags: postTags.split(",").map((s) => s.trim()).filter(Boolean),
            targetLength: "medium",
          } satisfies PostDraftInput,
        };
        break;
    }

    const result = await submit(input);
    if (result) setLastResult(result);
  };

  const handleRegenerate = (job: AgentJobRecord) => {
    const input = job.input as Record<string, unknown>;
    if (input.topic) setTopic(input.topic as string);
    if (input.learningObjective) setObjective(input.learningObjective as string);
  };

  const typeOptions: Array<{ value: DraftType; icon: typeof Sparkles; labelKey: string }> = [
    { value: "procedure_draft", icon: Sparkles, labelKey: "agent.type.procedure" },
    { value: "assessment_draft", icon: GraduationCap, labelKey: "agent.type.assessment" },
    { value: "post_draft", icon: FileText, labelKey: "agent.type.post" },
  ];

  const recentJobs = jobs.filter((j) => j.type === draftType).slice(0, 5);

  return (
    <CreatorShell
      badge={t("agent.draft.badge")}
      title={t("agent.draft.title")}
      description={t("agent.draft.description")}
      actions={
        <Button variant="outline" asChild>
          <Link to="/creator">{t("creator.back")}</Link>
        </Button>
      }
    >
      {/* Draft type selector */}
      <div className="flex flex-wrap gap-2">
        {typeOptions.map((opt) => (
          <Button
            key={opt.value}
            variant={draftType === opt.value ? "default" : "outline"}
            size="sm"
            onClick={() => setSearchParams({ type: opt.value })}
          >
            <opt.icon className="mr-1.5 h-4 w-4" />
            {t(opt.labelKey)}
          </Button>
        ))}
      </div>

      {/* Input form */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <CardTitle>{t(`agent.jobType.${draftType}`)}</CardTitle>
          </div>
          <CardDescription>{t(`agent.draft.${draftType}.description`)}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {draftType === "procedure_draft" && (
            <>
              <div className="space-y-2">
                <Label>{t("agent.field.topic")}</Label>
                <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder={t("agent.field.topic.placeholder")} />
              </div>
              <div className="space-y-2">
                <Label>{t("agent.field.objective")}</Label>
                <Input value={objective} onChange={(e) => setObjective(e.target.value)} placeholder={t("agent.field.objective.placeholder")} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t("agent.field.audience")}</Label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={audience}
                    onChange={(e) => setAudience(e.target.value as typeof audience)}
                  >
                    <option value="Beginner">{t("agent.audience.beginner")}</option>
                    <option value="Intermediate">{t("agent.audience.intermediate")}</option>
                    <option value="Advanced">{t("agent.audience.advanced")}</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>{t("agent.field.format")}</Label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={format}
                    onChange={(e) => setFormat(e.target.value as typeof format)}
                  >
                    <option value="simulation">{t("agent.format.simulation")}</option>
                    <option value="video">{t("agent.format.video")}</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("agent.field.notes")}</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t("agent.field.notes.placeholder")} rows={3} />
              </div>
            </>
          )}

          {draftType === "assessment_draft" && (
            <>
              <div className="space-y-2">
                <Label>{t("agent.field.assessTopic")}</Label>
                <Input value={assessTopic} onChange={(e) => setAssessTopic(e.target.value)} placeholder={t("agent.field.assessTopic.placeholder")} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t("agent.field.procedureId")}</Label>
                  <Input value={assessProcedureId} onChange={(e) => setAssessProcedureId(e.target.value)} placeholder={t("agent.field.procedureId.placeholder")} />
                </div>
                <div className="space-y-2">
                  <Label>{t("agent.field.questionCount")}</Label>
                  <Input type="number" min={1} max={20} value={questionCount} onChange={(e) => setQuestionCount(Number(e.target.value))} />
                </div>
              </div>
            </>
          )}

          {draftType === "post_draft" && (
            <>
              <div className="space-y-2">
                <Label>{t("agent.field.postTopic")}</Label>
                <Input value={postTopic} onChange={(e) => setPostTopic(e.target.value)} placeholder={t("agent.field.postTopic.placeholder")} />
              </div>
              <div className="space-y-2">
                <Label>{t("agent.field.postNotes")}</Label>
                <Textarea value={postNotes} onChange={(e) => setPostNotes(e.target.value)} placeholder={t("agent.field.postNotes.placeholder")} rows={4} />
              </div>
              <div className="space-y-2">
                <Label>{t("agent.field.postTags")}</Label>
                <Input value={postTags} onChange={(e) => setPostTags(e.target.value)} placeholder={t("agent.field.postTags.placeholder")} />
              </div>
            </>
          )}

          <div className="flex items-center gap-3 border-t border-border pt-4">
            <Button onClick={handleSubmit} disabled={running}>
              <Sparkles className="mr-1.5 h-4 w-4" />
              {running ? t("agent.draft.generating") : t("agent.draft.generate")}
            </Button>
            {error && (
              <Badge variant="destructive">{error}</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Latest result */}
      {lastResult?.provenance && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">{t("agent.draft.latestResult")}</h3>
          <ReviewPanel
            job={lastResult}
            onStatusChange={setReviewStatus}
            onRegenerate={handleRegenerate}
          />
        </div>
      )}

      {/* Recent jobs for this type */}
      {recentJobs.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">{t("agent.draft.recentJobs")}</h3>
          {recentJobs.map((job) =>
            job.provenance ? (
              <ReviewPanel
                key={job.id}
                job={job}
                onStatusChange={setReviewStatus}
                onRegenerate={handleRegenerate}
              />
            ) : (
              <Card key={job.id}>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm">{job.id}</CardTitle>
                    <Badge variant={job.status === "failed" ? "destructive" : "secondary"}>
                      {job.status}
                    </Badge>
                  </div>
                  {job.error && (
                    <CardDescription className="text-destructive">{job.error}</CardDescription>
                  )}
                </CardHeader>
              </Card>
            ),
          )}
        </div>
      )}
    </CreatorShell>
  );
};

export default AgentDraftPage;
